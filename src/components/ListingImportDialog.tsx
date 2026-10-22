import { useEffect, useState } from "react";
import { FileImage, Link, Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { emptyListing, type Listing, type Supplier } from "@/lib/catalog";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreate: (listing: Listing) => void;
}

function titleFromUrl(value: string) {
  try {
    const url = new URL(value);
    const part = decodeURIComponent(url.pathname.split("/").filter(Boolean).pop() ?? "");
    return part.replace(/[-_]+/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()).trim();
  } catch {
    return "";
  }
}

function supplierFromUrl(value: string): Supplier {
  return value.toLowerCase().includes("zazzle") ? "zazzle" : "printify";
}

export function ListingImportDialog({ open, onOpenChange, onCreate }: Props) {
  const [url, setUrl] = useState("");
  const [title, setTitle] = useState("");
  const [notes, setNotes] = useState("");
  const [photo, setPhoto] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!open) {
      setUrl(""); setTitle(""); setNotes(""); setPhoto(""); setBusy(false);
    }
  }, [open]);

  const onScreenshot = (file?: File) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setPhoto(String(reader.result));
    reader.readAsDataURL(file);
  };

  const prepareDraft = async () => {
    if (!url.trim() && !photo) {
      toast.error("Add a listing URL or screenshot first.");
      return;
    }
    setBusy(true);
    try {
      const supplier = supplierFromUrl(url);
      const draft = emptyListing(null, supplier);
      draft.url = url.trim();
      draft.title = title.trim() || titleFromUrl(url);
      draft.store = supplier === "zazzle" ? "Zazzle" : "Printify";
      draft.photos = photo ? [photo] : [];
      draft.productionNotes = notes.trim();
      draft.variantNotes = "Imported draft — review sizes, colors, prices, and costs before saving.";
      onCreate(draft);
      onOpenChange(false);
      toast.success("Draft created — review the imported details before saving");
    } finally {
      setBusy(false);
    }
  };

  return <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogContent className="sm:max-w-lg">
      <DialogHeader>
        <DialogTitle className="font-display text-2xl">Import a listing</DialogTitle>
        <p className="text-sm text-muted-foreground">Start with a store URL or screenshot. The result opens as a draft so you can verify prices before saving.</p>
      </DialogHeader>
      <div className="space-y-4 py-2">
        <div>
          <Label>Listing URL</Label>
          <div className="relative mt-1"><Link className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input className="pl-9" placeholder="https://www.printify.com/..." value={url} onChange={(e) => setUrl(e.target.value)} /></div>
          <p className="mt-1 text-xs text-muted-foreground">The URL, store, and a title derived from the URL are filled automatically. Store pages may block browser-side metadata access.</p>
        </div>
        <div>
          <Label>Listing screenshot</Label>
          <label className="mt-1 flex cursor-pointer items-center gap-3 rounded-md border-2 border-dashed p-4 text-sm text-muted-foreground hover:border-primary hover:text-primary"><FileImage className="h-5 w-5" /> {photo ? "Screenshot attached" : "Choose a screenshot"}<input type="file" accept="image/*" hidden onChange={(e) => onScreenshot(e.target.files?.[0])} /></label>
        </div>
        <div><Label>Title override <span className="font-normal text-muted-foreground">(optional)</span></Label><Input className="mt-1" placeholder="Product title" value={title} onChange={(e) => setTitle(e.target.value)} /></div>
        <div><Label>Import notes <span className="font-normal text-muted-foreground">(optional)</span></Label><Textarea className="mt-1" rows={2} placeholder="Anything to remember while reviewing this draft" value={notes} onChange={(e) => setNotes(e.target.value)} /></div>
        <div className="rounded-md bg-secondary p-3 text-xs text-muted-foreground"><Sparkles className="mb-1 h-4 w-4 text-gold" /> Automated OCR and full store-page extraction require a server-side AI/parser connection. This safe draft flow never overwrites an existing listing.</div>
      </div>
      <div className="flex justify-end gap-2"><Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button><Button onClick={prepareDraft} disabled={busy}>{busy && <Loader2 className="h-4 w-4 animate-spin" />} Create draft</Button></div>
    </DialogContent>
  </Dialog>;
}
