import { useEffect, useState } from "react";
import { Copy, ExternalLink, ImagePlus, Plus, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { calcProfit, calcVariationProfit, money, uid, type Artwork, type Listing, type ListingVariation } from "@/lib/catalog";
import { StoreBadge } from "./StoreBadge";

interface Props {
  listing: Listing | null;
  artworks: Artwork[];
  categories: string[];
  onAddCategory: (name: string) => Promise<void>;
  onClose: () => void;
  onSave: (l: Listing) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

const copy = (text: string, what: string) => {
  navigator.clipboard.writeText(text);
  toast.success(`${what} copied`);
};

const NEW_CATEGORY = "__new__";

export function ListingDrawer({ listing, artworks, categories, onAddCategory, onClose, onSave, onDelete }: Props) {
  const [d, setD] = useState<Listing | null>(listing);
  const [tagInput, setTagInput] = useState("");
  const [photoUrl, setPhotoUrl] = useState("");
  const [newCategory, setNewCategory] = useState("");
  const [addingCategory, setAddingCategory] = useState(false);
  const [saving, setSaving] = useState(false);
  useEffect(() => {
    setD(listing);
    setAddingCategory(false);
    setNewCategory("");
  }, [listing]);
  if (!d) return <Sheet open={false} />;

  const set = <K extends keyof Listing>(k: K, v: Listing[K]) => setD({ ...d, [k]: v });
  const profit = calcProfit(d);
  const addTag = () => {
    const t = tagInput.split(",").map((s) => s.trim()).filter(Boolean);
    if (t.length) set("tags", Array.from(new Set([...d.tags, ...t])));
    setTagInput("");
  };
  const addVariation = () => set("variations", [...d.variations, { id: uid(), name: "", sku: d.sku, retailPrice: d.retailPrice, baseCost: d.baseCost, royaltyRate: d.royaltyRate }]);
  const updateVariation = <K extends keyof ListingVariation>(id: string, key: K, value: ListingVariation[K]) =>
    set("variations", d.variations.map((v) => v.id === id ? { ...v, [key]: value } : v));
  const toggleCategory = (name: string) => {
    const current = d.categories.length ? d.categories : [d.category];
    const next = current.includes(name) ? current.filter((c) => c !== name) : [...current, name];
    if (!next.length) return;
    setD({ ...d, categories: next, category: next[0] ?? d.category });
  };
  const onFile = (files: FileList | null) => {
    Array.from(files ?? []).forEach((f) => {
      const r = new FileReader();
      r.onload = () => setD((cur) => (cur ? { ...cur, photos: [...cur.photos, String(r.result)] } : cur));
      r.readAsDataURL(f);
    });
  };
  const allCategories = Array.from(new Set([...categories, d.category].filter(Boolean)));
  const saveNewCategory = async () => {
    const name = newCategory.trim();
    if (!name) return;
    try {
      await onAddCategory(name);
      setD((current) => current ? { ...current, category: name, categories: Array.from(new Set([...current.categories, name])) } : current);
      setAddingCategory(false);
      setNewCategory("");
      toast.success(`Category “${name}” added`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Category could not be saved. Please retry.");
    }
  };

  return (
    <Sheet open={!!listing} onOpenChange={(o) => !o && onClose()}>
      <SheetContent className="w-full overflow-y-auto bg-background sm:max-w-xl">
        <SheetHeader className="space-y-2 text-left">
          <div className="flex items-center gap-2">
            <StoreBadge supplier={d.supplier} />
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
                  <img src={p} alt="" className="h-full w-full object-cover" />
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
            <Field label="Store name">
              <Input value={d.store} placeholder="e.g. Raw Palette on Etsy" onChange={(e) => set("store", e.target.value)} />
            </Field>
            <Field label="Supplier">
              <Select value={d.supplier} onValueChange={(v) => set("supplier", v as Listing["supplier"])}>
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
            <Field label="Categories" className="col-span-2">
              <div className="rounded-md border bg-card p-2">
                <div className="flex flex-wrap gap-1.5">
                  {allCategories.map((c) => {
                    const selected = (d.categories.length ? d.categories : [d.category]).includes(c);
                    return <button key={c} type="button" onClick={() => toggleCategory(c)} className={`rounded-full border px-2.5 py-1 text-xs transition ${selected ? "border-primary bg-primary text-primary-foreground" : "text-muted-foreground hover:border-primary hover:text-foreground"}`}>{c}</button>;
                  })}
                  {!addingCategory && <Button type="button" size="sm" variant="ghost" onClick={() => setAddingCategory(true)}><Plus className="h-3.5 w-3.5" /> New</Button>}
                </div>
                {addingCategory && <div className="mt-2 flex gap-1.5"><Input autoFocus placeholder="New category name" value={newCategory} onChange={(e) => setNewCategory(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); saveNewCategory(); } if (e.key === "Escape") setAddingCategory(false); }} /><Button size="sm" variant="secondary" onClick={saveNewCategory} disabled={!newCategory.trim()}>Add</Button></div>}
              </div>
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
              {d.supplier === "printify" ? (
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
                  {d.supplier === "printify" ? "Net profit / unit" : "Royalty payout / unit"}
                </div>
                <div className={`font-display text-3xl ${profit.net < 0 ? "text-destructive" : "text-primary"}`}>{money(profit.net)}</div>
              </div>
              <div className="text-right">
                <div className="text-xs uppercase tracking-widest text-muted-foreground">Margin</div>
                <div className="font-display text-2xl text-gold">{profit.margin}%</div>
              </div>
            </div>
          </section>

          {/* Variations */}
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <SectionTitle>Variations & pricing</SectionTitle>
              <Button size="sm" variant="outline" onClick={addVariation}><Plus className="h-4 w-4" /> Add variation</Button>
            </div>
            {d.variations.length === 0 ? (
              <p className="rounded-md border border-dashed p-3 text-sm text-muted-foreground">Combine sizes, colors, or other options here when each one has a different price or production cost.</p>
            ) : (
              <div className="space-y-2">
                {d.variations.map((v) => {
                  const p = calcVariationProfit(v, d.supplier);
                  return <div key={v.id} className="rounded-lg border bg-card p-3">
                    <div className="mb-2 flex items-center gap-2">
                      <Input className="flex-1" placeholder="e.g. Small / Natural" value={v.name} onChange={(e) => updateVariation(v.id, "name", e.target.value)} />
                      <button onClick={() => set("variations", d.variations.filter((x) => x.id !== v.id))} aria-label="Remove variation" className="rounded p-1 text-muted-foreground hover:text-destructive"><X className="h-4 w-4" /></button>
                    </div>
                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                      <Input aria-label="Variation SKU" placeholder="SKU" value={v.sku} onChange={(e) => updateVariation(v.id, "sku", e.target.value)} />
                      <Input aria-label="Variation retail price" type="number" step="0.01" placeholder="Retail" value={v.retailPrice} onChange={(e) => updateVariation(v.id, "retailPrice", Number(e.target.value))} />
                      {d.supplier === "printify" ? <Input aria-label="Variation base cost" type="number" step="0.01" placeholder="Cost" value={v.baseCost} onChange={(e) => updateVariation(v.id, "baseCost", Number(e.target.value))} /> : <Input aria-label="Variation royalty rate" type="number" step="0.5" placeholder="Royalty %" value={v.royaltyRate} onChange={(e) => updateVariation(v.id, "royaltyRate", Number(e.target.value))} />}
                      <div className="flex items-center justify-end rounded-md bg-secondary px-2 text-sm font-semibold text-primary">+{money(p.net)}</div>
                    </div>
                  </div>;
                })}
              </div>
            )}
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
          <Button variant="ghost" className="text-destructive" disabled={saving} onClick={async () => {
            setSaving(true);
            try { await onDelete(d.id); onClose(); toast.success("Listing deleted"); }
            catch (error) { toast.error(error instanceof Error ? error.message : "Delete failed. Please retry."); }
            finally { setSaving(false); }
          }}>
            <Trash2 className="h-4 w-4" /> Delete
          </Button>
          <div className="flex-1" />
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button disabled={saving} onClick={async () => {
            setSaving(true);
            try { await onSave(d); onClose(); toast.success("Listing saved to Cloud"); }
            catch (error) { toast.error(error instanceof Error ? error.message : "Save failed. Please retry."); }
            finally { setSaving(false); }
          }}>{saving ? "Saving…" : "Save listing"}</Button>
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
