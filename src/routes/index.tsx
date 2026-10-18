import { createFileRoute } from "@tanstack/react-router";
import { Suspense, useMemo, useState } from "react";
import { useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { CloudSignIn } from "@/components/CloudSignIn";
import { useCloudSession } from "@/components/CloudSession";
import { cloudCatalogKey, fetchCloudCatalog, saveCloudArtwork, saveCloudListing, deleteCloudListing, importBrowserCatalog } from "@/lib/cloud-catalog";
import { ImagePlus, Layers, Palette, Plus, Search, Sparkles, Tag, TrendingUp } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ListingDrawer } from "@/components/ListingDrawer";
import { StatusBadge, StoreBadge } from "@/components/StoreBadge";
import {
  CATEGORIES, calcProfit, emptyListing, loadCatalog, money, summarize, uid,
  type Artwork, type Listing, type Store,
} from "@/lib/catalog";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "The Raw Palette — Product Design Studio" },
      { name: "description", content: "Track artwork, Printify and Zazzle listings, profit, photos, tags and production notes in one place." },
      { property: "og:title", content: "The Raw Palette — Product Design Studio" },
      { property: "og:description", content: "Artwork and store listing tracker for Printify and Zazzle sellers." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

type StoreFilter = "all" | Store;

function Index() {
  const { user, ready } = useCloudSession();
  if (!ready) return <p className="p-8 text-muted-foreground">Opening your catalog…</p>;
  if (!user) return <main className="mx-auto max-w-7xl space-y-6 px-6 py-8"><h1 className="font-display text-3xl font-bold">The Raw Palette</h1><CloudSignIn /></main>;
  return <Suspense fallback={<p className="p-8 text-muted-foreground">Loading cloud catalog…</p>}><CloudCatalog key={user.id} userId={user.id} /></Suspense>;
}

function CloudCatalog({ userId }: { userId: string }) {
  const queryClient = useQueryClient();
  const { data: { artworks, listings } } = useSuspenseQuery({ queryKey: cloudCatalogKey(userId), queryFn: fetchCloudCatalog, staleTime: 60_000, refetchInterval: 30 * 60_000 });
  const [importing, setImporting] = useState(false);
  const [store, setStore] = useState<StoreFilter>("all");
  const [category, setCategory] = useState("all");
  const [q, setQ] = useState("");
  const [open, setOpen] = useState<Listing | null>(null);
  const [artDialog, setArtDialog] = useState(false);

  const refresh = () => queryClient.invalidateQueries({ queryKey: cloudCatalogKey(userId) });
  const importCatalog = async () => {
    setImporting(true);
    try { await importBrowserCatalog(loadCatalog()); await refresh(); toast.success("Browser catalog imported to Cloud"); }
    catch (error) { toast.error(error instanceof Error ? error.message : "Import failed. Your browser copy is unchanged."); }
    finally { setImporting(false); }
  };

  const stats = summarize(artworks, listings);
  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    return listings.filter((l) => {
      if (store !== "all" && l.store !== store) return false;
      if (category !== "all" && l.category !== category) return false;
      if (!term) return true;
      const art = artworks.find((a) => a.id === l.artworkId)?.name ?? "";
      return [l.title, l.description, l.sku, art, ...l.tags].some((s) => s.toLowerCase().includes(term));
    });
  }, [listings, artworks, store, category, q]);
  const filtering = store !== "all" || category !== "all" || q.trim() !== "";

  const saveListing = async (l: Listing) => { await saveCloudListing(l); await refresh(); };
  const standalone = filtered.filter((l) => !l.artworkId || !artworks.some((a) => a.id === l.artworkId));

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="relative overflow-hidden border-b bg-charcoal text-ivory">
        <div className="checker absolute inset-x-0 bottom-0 h-2.5 opacity-90" />
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-6 py-7">
          <div>
            <div className="font-script text-2xl leading-none text-gold">the</div>
            <h1 className="font-display text-3xl font-bold tracking-[0.18em] sm:text-4xl">
              RAW <span className="text-coral">PALETTE</span>
            </h1>
            <p className="mt-1 text-xs uppercase tracking-[0.3em] text-ivory/60">Design & listing studio</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => supabase.auth.signOut()}>Sign out</Button>
            <Button variant="outline" className="border-ivory/30 bg-transparent text-ivory hover:bg-ivory/10 hover:text-ivory" onClick={() => setArtDialog(true)}>
              <Palette className="h-4 w-4" /> New artwork
            </Button>
            <Button className="bg-coral text-ivory hover:bg-coral/90" onClick={() => setOpen(emptyListing(null))}>
              <Plus className="h-4 w-4" /> New listing
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl space-y-8 px-6 py-8">
        <div className="flex flex-wrap items-center gap-3">{artworks.length === 0 && listings.length === 0 && <span className="text-sm text-muted-foreground">Your cloud catalog is empty.</span>}<Button variant="outline" disabled={importing} onClick={importCatalog}>{importing ? "Importing…" : "Import this browser’s catalog"}</Button></div>
        {/* Stats */}
        <section className="grid gap-4 sm:grid-cols-3">
          <Stat icon={<Layers />} label="Total artworks" value={String(stats.totalArtworks)} tone="bg-teal" />
          <Stat icon={<Sparkles />} label="Active listings" value={String(stats.activeListings)} sub={`of ${listings.length} total`} tone="bg-coral" />
          <Stat icon={<TrendingUp />} label="Avg profit / item" value={money(stats.avgProfit)} tone="bg-gold" />
        </section>

        {/* Filters */}
        <section className="paper flex flex-wrap items-center gap-3 rounded-xl p-3">
          <div className="flex rounded-lg bg-secondary p-1">
            {(["all", "printify", "zazzle"] as StoreFilter[]).map((s) => (
              <button
                key={s}
                onClick={() => setStore(s)}
                className={`rounded-md px-4 py-1.5 text-sm font-semibold capitalize transition ${
                  store === s ? (s === "zazzle" ? "bg-coral text-ivory" : s === "printify" ? "bg-teal text-ivory" : "bg-charcoal text-ivory") : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {s}
              </button>
            ))}
          </div>
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger className="w-44 bg-card"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All categories</SelectItem>
              {CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
            </SelectContent>
          </Select>
          <div className="relative min-w-60 flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input className="bg-card pl-9" placeholder="Search tags, titles, SKUs…" value={q} onChange={(e) => setQ(e.target.value)} />
          </div>
          <span className="text-sm text-muted-foreground">{filtered.length} listings</span>
        </section>

        {/* Artworks */}
        <section className="space-y-6">
          {artworks.map((a) => {
            const ls = filtered.filter((l) => l.artworkId === a.id);
            if (filtering && ls.length === 0) return null;
            return (
              <article key={a.id} className="paper grid overflow-hidden rounded-xl md:grid-cols-[240px_1fr]">
                <div className="relative bg-secondary">
                  {a.image ? (
                    <img src={a.image} alt={a.name} loading="lazy" className="h-56 w-full object-cover md:h-full" />
                  ) : (
                    <div className="flex h-56 items-center justify-center text-muted-foreground md:h-full"><ImagePlus /></div>
                  )}
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-charcoal/85 to-transparent p-4 pt-10">
                    <h2 className="font-display text-lg font-bold tracking-wide text-ivory">{a.name}</h2>
                    <p className="font-script text-lg leading-tight text-gold">{listings.filter((l) => l.artworkId === a.id).length} listings</p>
                  </div>
                </div>
                <div className="p-4">
                  {a.notes && <p className="mb-3 border-l-2 border-gold pl-3 text-sm italic text-muted-foreground">{a.notes}</p>}
                  <div className="space-y-2">
                    {ls.map((l) => <ListingRow key={l.id} l={l} onClick={() => setOpen(l)} />)}
                    {ls.length === 0 && <p className="text-sm text-muted-foreground">No listings yet.</p>}
                  </div>
                  <Button variant="ghost" size="sm" className="mt-2 text-primary" onClick={() => setOpen(emptyListing(a.id))}>
                    <Plus className="h-4 w-4" /> Add listing for this design
                  </Button>
                </div>
              </article>
            );
          })}

          {(standalone.length > 0 || !filtering) && (
            <article className="paper rounded-xl p-4">
              <h2 className="mb-3 flex items-center gap-2 font-display text-lg font-bold tracking-wide">
                <Tag className="h-4 w-4 text-coral" /> Standalone listings
              </h2>
              <div className="space-y-2">
                {standalone.map((l) => <ListingRow key={l.id} l={l} onClick={() => setOpen(l)} />)}
                {standalone.length === 0 && <p className="text-sm text-muted-foreground">Products not tied to a master artwork show up here.</p>}
              </div>
            </article>
          )}
          {filtering && filtered.length === 0 && (
            <p className="py-16 text-center font-script text-2xl text-muted-foreground">Nothing matches those filters — yet.</p>
          )}
        </section>
      </main>

      <ListingDrawer
        listing={open}
        artworks={artworks}
        onClose={() => setOpen(null)}
        onSave={saveListing}
        onDelete={async (id) => { await deleteCloudListing(id); await refresh(); }}
      />
      <ArtworkDialog open={artDialog} onOpenChange={setArtDialog} onCreate={async (a) => { await saveCloudArtwork(a); await refresh(); }} />
    </div>
  );
}

function Stat({ icon, label, value, sub, tone }: { icon: React.ReactNode; label: string; value: string; sub?: string; tone: string }) {
  return (
    <div className="paper relative overflow-hidden rounded-xl p-5">
      <div className={`absolute -right-6 -top-6 h-24 w-24 rounded-full opacity-20 ${tone}`} />
      <div className={`mb-3 inline-flex h-9 w-9 items-center justify-center rounded-lg text-ivory [&_svg]:h-4 [&_svg]:w-4 ${tone}`}>{icon}</div>
      <div className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">{label}</div>
      <div className="font-display text-3xl font-bold">{value}</div>
      {sub && <div className="text-xs text-muted-foreground">{sub}</div>}
    </div>
  );
}

function ListingRow({ l, onClick }: { l: Listing; onClick: () => void }) {
  const p = calcProfit(l);
  return (
    <button onClick={onClick} className="flex w-full items-center gap-3 rounded-lg border bg-background/60 p-2.5 text-left transition hover:border-primary hover:bg-background">
      <div className="h-12 w-12 shrink-0 overflow-hidden rounded-md bg-secondary">
        {l.photos[0] && <img src={l.photos[0]} alt="" loading="lazy" className="h-full w-full object-cover" />}
      </div>
      <div className="min-w-0 flex-1">
        <div className="truncate font-semibold">{l.title || "Untitled"}</div>
        <div className="mt-0.5 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          <StoreBadge store={l.store} />
          <span>{l.category}</span>
          {l.sku && <span className="hidden sm:inline">· {l.sku}</span>}
        </div>
      </div>
      <StatusBadge status={l.status} />
      <div className="w-24 text-right">
        <div className="text-sm text-muted-foreground">{money(l.retailPrice)}</div>
        <div className={`font-semibold ${p.net < 0 ? "text-destructive" : "text-primary"}`}>+{money(p.net)}</div>
        <div className="text-[11px] text-gold">{p.margin}% margin</div>
      </div>
    </button>
  );
}

function ArtworkDialog({ open, onOpenChange, onCreate }: { open: boolean; onOpenChange: (o: boolean) => void; onCreate: (a: Artwork) => Promise<void> }) {
  const [name, setName] = useState("");
  const [image, setImage] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const onFile = (f?: File) => {
    if (!f) return;
    const r = new FileReader();
    r.onload = () => setImage(String(r.result));
    r.readAsDataURL(f);
  };
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-background">
        <DialogHeader><DialogTitle className="font-display tracking-wide">New artwork</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div><Label>Name</Label><Input value={name} onChange={(e) => setName(e.target.value)} /></div>
          <div>
            <Label>Artwork image</Label>
            <label className="mt-1 flex h-36 cursor-pointer items-center justify-center overflow-hidden rounded-md border-2 border-dashed text-sm text-muted-foreground hover:border-primary">
              {image ? <img src={image} alt="" className="h-full w-full object-cover" /> : <span className="flex items-center gap-2"><ImagePlus className="h-4 w-4" /> Upload image</span>}
              <input type="file" accept="image/*" hidden onChange={(e) => onFile(e.target.files?.[0])} />
            </label>
          </div>
          <div><Label>Notes</Label><Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="File sizes, DPI, color notes…" /></div>
          <Button
            className="w-full"
            disabled={!name.trim() || saving}
            onClick={async () => {
              setSaving(true);
              try {
                await onCreate({ id: uid(), name: name.trim(), image, notes, createdAt: new Date().toISOString().slice(0, 10) });
                setName(""); setImage(""); setNotes(""); onOpenChange(false);
                toast.success("Artwork saved to Cloud");
              } catch (error) { toast.error(error instanceof Error ? error.message : "Artwork could not be saved. Please retry."); }
              finally { setSaving(false); }
            }}
          >
            {saving ? "Saving…" : "Create artwork"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
