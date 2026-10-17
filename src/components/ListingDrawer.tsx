import { useEffect, useState } from "react";
import { Copy, ExternalLink, ImagePlus, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CATEGORIES, calcProfit, money, type Artwork, type Listing } from "@/lib/catalog";
import { StoreBadge } from "./StoreBadge";
import { CatalogImage } from "@/components/CatalogImage";
import { uploadCatalogImage } from "@/lib/supabase";

interface Props {
  listing: Listing | null;
  artworks: Artwork[];
  onClose: () => void;
  onSave: (l: Listing) => void;
  onDelete: (id: string) => void;
}

const copy = (text: string, what: string) => {
  navigator.clipboard.writeText(text);
  toast.success(`${what} copied`);
};

export function ListingDrawer({ userId, listing, artworks, onClose, onSave, onDelete }: Props) {
  const [d, setD] = useState<Listing | null>(listing);
  const [tagInput, setTagInput] = useState("");
  const [photoUrl, setPhotoUrl] = useState("");
  useEffect(() => setD(listing), [listing]);
  if (!d) return <Sheet open={false} />;

  const set = <K extends keyof Listing>(k: K, v: Listing[K]) => setD({ ...d, [k]: v });
  const profit = calcProfit(d);
  const addTag = () => {
    const t = tagInput.split(",").map((s) => s.trim()).filter(Boolean);
    if (t.length) set("tags", Array.from(new Set([...d.tags, ...t])));
    setTagInput("");
  };
  const onFile = async (files: FileList | null) => {
    for (const file of Array.from(files ?? [])) {
      try {
        const path = await uploadCatalogImage(userId, file);
        setD((cur) => (cur ? { ...cur, photos: [...cur.photos, path] } : cur));
      } catch (error) {
        console.error("Image upload failed", error);
        toast.error("Couldn't upload that image. Check your connection and try again.");
      }
    }
  };

  return (
    <Sheet open={!!listing} onOpenChange={(o) => !o && onClose()}>
      <SheetContent className="w-full overflow-y-auto bg-background sm:max-w-xl">
        <SheetHeader className="space-y-2 text-left">
          <div className="flex items-center gap-2">
            <StoreBadge store={d.store} />
            <span className="text-xs uppercase tracking-widest text-muted-foreground">{d.category}</span>
          </div>
          <SheetTitle className="font-display text-2xl">{d.title || "New listing"}</SheetTitle>
        </SheetHeader>

        <div className="mt-6 space-y-7 pb-24">
          {/* Photos */}
          <section>
            <SectionTitle>Mockups & photos</SectionTitle>
            <div className="grid grid-cols-3 gap-2">
              {d.photos.map((p, i) => (
                <div key={i} className="group relative aspect-square overflow-hidden rounded-md border">
                  <CatalogImage src={p} alt="" className="h-full w-full object-cover" />
                  <button
                    onClick={() => set("photos", d.photos.filter((_, j) => j !== i))}
                    className="absolute right-1 top-1 rounded-full bg-charcoal/80 p-1 text-ivory opacity-0 group-hover:opacity-100"
                    aria-label="Remove photo"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
              <label className="flex aspect-square cursor-pointer flex-col items-center justify-center gap-1 rounded-md border-2 border-dashed text-xs text-muted-foreground hover:border-primary hover:text-primary">
                <ImagePlus className="h-5 w-5" /> Upload
                <input type="file" accept="image/*" multiple hidden onChange={(e) => onFile(e.target.files)} />
              </label>
            </div>
            <div className="mt-2 flex gap-2">
              <Input placeholder="…or paste image URL" value={photoUrl} onChange={(e) => setPhotoUrl(e.target.value)} />
              <Button variant="secondary" onClick={() => { if (photoUrl) { set("photos", [...d.photos, photoUrl]); setPhotoUrl(""); } }}>Add</Button>
            </div>
          </section>

          {/* Basics */}
          <section className="grid grid-cols-2 gap-3">
            <Field label="Title" className="col-span-2">
              <Input value={d.title} onChange={(e) => set("title", e.target.value)} />
            </Field>
            <Field label="Store">
              <Select value={d.store} onValueChange={(v) => set("store", v as Listing["store"])}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="printify">Printify</SelectItem>
                  <SelectItem value="zazzle">Zazzle</SelectItem>
                </SelectContent>
              </Select>
            </Field>
            <Field label="Status">
              <Select value={d.status} onValueChange={(v) => set("status", v as Listing["status"])}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="archived">Archived</SelectItem>
                </SelectContent>
              </Select>
            </Field>
            <Field label="Category">
              <Select value={d.category} onValueChange={(v) => set("category", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Artwork">
              <Select value={d.artworkId ?? "none"} onValueChange={(v) => set("artworkId", v === "none" ? null : v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Standalone</SelectItem>
                  {artworks.map((a) => <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </Field>
          </section>

          {/* Financials */}
          <section className="paper rounded-lg p-4">
            <SectionTitle>Profit calculator</SectionTitle>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Retail price ($)">
                <Input type="number" step="0.01" value={d.retailPrice} onChange={(e) => set("retailPrice", Number(e.target.value))} />
              </Field>
              {d.store === "printify" ? (
                <Field label="Base / production cost ($)">
                  <Input type="number" step="0.01" value={d.baseCost} onChange={(e) => set("baseCost", Number(e.target.value))} />
                </Field>
              ) : (
                <Field label="Royalty rate (%)">
                  <Input type="number" step="0.5" value={d.royaltyRate} onChange={(e) => set("royaltyRate", Number(e.target.value))} />
                </Field>
              )}
            </div>
            <div className="mt-4 flex items-end justify-between border-t border-dashed pt-3">
              <div>
                <div className="text-xs uppercase tracking-widest text-muted-foreground">
                  {d.store === "printify" ? "Net profit / unit" : "Royalty payout / unit"}
                </div>
                <div className={`font-display text-3xl ${profit.net < 0 ? "text-destructive" : "text-primary"}`}>{money(profit.net)}</div>
              </div>
              <div className="text-right">
                <div className="text-xs uppercase tracking-widest text-muted-foreground">Margin</div>
                <div className="font-display text-2xl text-gold">{profit.margin}%</div>
              </div>
            </div>
          </section>

          {/* Copy */}
          <section className="space-y-3">
            <SectionTitle>Listing copy</SectionTitle>
            <Field label="Product description" action={<CopyBtn onClick={() => copy(d.description, "Description")} />}>
              <Textarea rows={4} value={d.description} onChange={(e) => set("description", e.target.value)} />
            </Field>
            <Field label={`Search tags (${d.tags.length})`} action={<CopyBtn onClick={() => copy(d.tags.join(", "), "Tags")} />}>
              <div className="flex flex-wrap gap-1.5">
                {d.tags.map((t) => (
                  <span key={t} className="inline-flex items-center gap-1 rounded-full bg-secondary px-2.5 py-0.5 text-xs">
                    {t}
                    <button onClick={() => set("tags", d.tags.filter((x) => x !== t))} aria-label={`Remove ${t}`}><X className="h-3 w-3" /></button>
                  </span>
                ))}
              </div>
              <Input
                className="mt-2"
                placeholder="Add tags, comma separated — press Enter"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addTag(); } }}
                onBlur={addTag}
              />
            </Field>
          </section>

          {/* Links */}
          <section className="grid grid-cols-2 gap-3">
            <Field label="Store link" className="col-span-2" action={d.url ? <a href={d.url} target="_blank" rel="noreferrer" className="text-primary"><ExternalLink className="h-3.5 w-3.5" /></a> : null}>
              <Input value={d.url} placeholder="https://" onChange={(e) => set("url", e.target.value)} />
            </Field>
            <Field label="SKU" action={<CopyBtn onClick={() => copy(d.sku, "SKU")} />}>
              <Input value={d.sku} onChange={(e) => set("sku", e.target.value)} />
            </Field>
            <Field label="Print provider">
              <Input value={d.printProvider} onChange={(e) => set("printProvider", e.target.value)} />
            </Field>
          </section>

          {/* Production */}
          <section className="space-y-3">
            <SectionTitle>Production notes</SectionTitle>
            <label className="flex items-center justify-between rounded-md border bg-card px-3 py-2 text-sm">
              DPI check passed (300 dpi+)
              <Switch checked={d.dpiCheck} onCheckedChange={(v) => set("dpiCheck", v)} />
            </label>
            <Field label="Variant notes">
              <Textarea rows={2} value={d.variantNotes} onChange={(e) => set("variantNotes", e.target.value)} />
            </Field>
            <Field label="Other notes">
              <Textarea rows={3} value={d.productionNotes} onChange={(e) => set("productionNotes", e.target.value)} />
            </Field>
          </section>
        </div>

        <div className="fixed bottom-0 right-0 flex w-full gap-2 border-t bg-background/95 p-4 backdrop-blur sm:max-w-xl">
          <Button variant="ghost" className="text-destructive" onClick={() => { onDelete(d.id); onClose(); }}>
            <Trash2 className="h-4 w-4" /> Delete
          </Button>
          <div className="flex-1" />
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={() => { onSave(d); onClose(); toast.success("Listing saved"); }}>Save listing</Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h3 className="mb-2 font-display text-sm font-semibold uppercase tracking-[0.2em] text-foreground">{children}</h3>;
}
function Field({ label, children, className, action }: { label: string; children: React.ReactNode; className?: string; action?: React.ReactNode }) {
  return (
    <div className={className}>
      <div className="mb-1 flex items-center justify-between">
        <Label className="text-xs text-muted-foreground">{label}</Label>
        {action}
      </div>
      {children}
    </div>
  );
}
function CopyBtn({ onClick }: { onClick: () => void }) {
  return (
    <button onClick={onClick} className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:text-coral">
      <Copy className="h-3 w-3" /> Copy
    </button>
  );
}
