import roses from "@/assets/art-roses.jpg";
import dragonfly from "@/assets/art-dragonfly.jpg";
import magnolia from "@/assets/art-magnolia.jpg";
import bloom from "@/assets/art-bloom.jpg";

export type Supplier = "printify" | "zazzle";
export type Status = "draft" | "active" | "archived";
export const CATEGORIES = [
  "Apparel",
  "Bags",
  "Jewelry",
  "Home Goods",
  "Stationery",
  "Cards",
  "Drinkware",
  "Wall Art",
] as const;

export interface Artwork {
  id: string;
  name: string;
  image: string;
  notes: string;
  createdAt: string;
}

export interface ListingVariation {
  id: string;
  name: string;
  sku: string;
  retailPrice: number;
  baseCost: number;
  royaltyRate: number;
}

export interface Listing {
  id: string;
  artworkId: string | null; // null = standalone
  store: string; // free-text store name, e.g. "Raw Palette on Etsy"
  supplier: Supplier; // who fulfills it: Printify or Zazzle
  title: string;
  category: string;
  categories: string[];
  status: Status;
  retailPrice: number;
  baseCost: number; // Printify only
  royaltyRate: number; // Zazzle only, percent
  description: string;
  tags: string[];
  url: string;
  sku: string;
  photos: string[];
  printProvider: string;
  dpiCheck: boolean;
  variantNotes: string;
  productionNotes: string;
  variations: ListingVariation[];
}

export interface Profit {
  net: number;
  margin: number; // percent of retail
}

const round2 = (n: number) => Math.round(n * 100) / 100;

/** Printify: retail - base cost. Zazzle: retail × royalty rate %. */
export function calcProfit(
  l: Pick<Listing, "supplier" | "retailPrice" | "baseCost" | "royaltyRate">,
): Profit {
  const retail = Number(l.retailPrice) || 0;
  const net =
    l.supplier === "printify"
      ? retail - (Number(l.baseCost) || 0)
      : retail * ((Number(l.royaltyRate) || 0) / 100);
  return { net: round2(net), margin: retail > 0 ? round2((net / retail) * 100) : 0 };
}

export function calcVariationProfit(
  v: Pick<ListingVariation, "retailPrice" | "baseCost" | "royaltyRate">,
  supplier: Supplier,
): Profit {
  return calcProfit({ supplier, ...v });
}

export function summarize(artworks: Artwork[], listings: Listing[]) {
  const active = listings.filter((l) => l.status === "active");
  const avg = listings.length
    ? listings.reduce((s, l) => s + calcProfit(l).net, 0) / listings.length
    : 0;
  return { totalArtworks: artworks.length, activeListings: active.length, avgProfit: round2(avg) };
}

export const uid = () => Math.random().toString(36).slice(2, 10);

export const emptyListing = (artworkId: string | null, supplier: Supplier = "printify", id = uid()): Listing => ({
  id,
  artworkId,
  store: "",
  supplier,
  title: "",
  category: supplier === "zazzle" ? "Stationery" : "Apparel",
  categories: [supplier === "zazzle" ? "Stationery" : "Apparel"],
  status: "draft",
  retailPrice: 0,
  baseCost: 0,
  royaltyRate: 10,
  description: "",
  tags: [],
  url: "",
  sku: "",
  photos: [],
  printProvider: "",
  dpiCheck: false,
  variantNotes: "",
  productionNotes: "",
  variations: [],
});

let sampleId = 0;
const PF = "Raw Palette · Printify";
const ZZ = "Raw Palette · Zazzle";
const L = (p: Partial<Listing> & Pick<Listing, "artworkId" | "supplier" | "title">): Listing => ({
  ...emptyListing(p.artworkId, p.supplier, `sample-${++sampleId}`),
  store: p.supplier === "zazzle" ? ZZ : PF,
  ...p,
});

export const seedArtworks: Artwork[] = [
  { id: "a1", name: "Gilded Roses", image: roses, notes: "Original watercolor, 6000×6000 @ 300dpi. Gold leaf layer separate.", createdAt: "2026-03-02" },
  { id: "a2", name: "Jeweled Dragonfly", image: dragonfly, notes: "Transparent PNG master available. Works best on light garments.", createdAt: "2026-04-18" },
  { id: "a3", name: "Magnolia Checker", image: magnolia, notes: "Seamless repeat tile — use for all-over prints.", createdAt: "2026-05-27" },
  { id: "a4", name: "Bloom Lettering", image: bloom, notes: "Hand lettering, vector + raster versions.", createdAt: "2026-07-09" },
];

export const seedListings: Listing[] = [
  L({ artworkId: "a1", supplier: "printify", title: "Gilded Roses Heavyweight Tee", category: "Apparel", status: "active", retailPrice: 32, baseCost: 13.45, description: "Soft heavyweight cotton tee featuring hand-painted cream roses with gold leaf accents and coral splashes.", tags: ["roses", "watercolor", "floral tee", "gold leaf", "boho"], url: "https://printify.com/app/store/products/1", sku: "PF-GR-TEE-01", photos: [roses], printProvider: "Monster Digital", dpiCheck: true, variantNotes: "S–3XL in Natural, Ivory, Sand. Skip dark colors." }),
  L({ artworkId: "a1", supplier: "printify", title: "Gilded Roses Tote Bag", category: "Bags", status: "active", retailPrice: 26, baseCost: 11.2, description: "Sturdy all-over print tote with gilded rose bouquet.", tags: ["tote", "roses", "market bag", "gift for her"], sku: "PF-GR-TOT-01", photos: [roses], printProvider: "MWW On Demand", dpiCheck: true, variantNotes: "15\" and 18\" sizes. Black handles." }),
  L({ artworkId: "a1", supplier: "zazzle", title: "Gilded Roses Wedding Invitation", category: "Stationery", status: "active", retailPrice: 3.15, royaltyRate: 15, description: "Elegant floral wedding invitation with editable text and gilded roses.", tags: ["wedding invitation", "floral", "gold", "romantic"], url: "https://www.zazzle.com/store/rawpalette", sku: "ZZ-GR-INV-01", photos: [roses], variantNotes: "5x7, Signature matte paper default." }),
  L({ artworkId: "a2", supplier: "printify", title: "Dragonfly Pendant Necklace", category: "Jewelry", status: "active", retailPrice: 38, baseCost: 16.8, description: "Glass cabochon pendant with jeweled dragonfly artwork on a gold-tone chain.", tags: ["dragonfly", "necklace", "nature jewelry", "gift"], sku: "PF-DF-NCK-01", photos: [dragonfly], printProvider: "ShineOn", dpiCheck: true, variantNotes: "Gold and silver finishes." }),
  L({ artworkId: "a2", supplier: "printify", title: "Dragonfly Ceramic Mug 11oz", category: "Drinkware", status: "draft", retailPrice: 18, baseCost: 6.9, description: "Glossy ceramic mug with wraparound dragonfly print.", tags: ["mug", "dragonfly", "coffee"], sku: "PF-DF-MUG-11", printProvider: "Printify Choice", dpiCheck: false, productionNotes: "Re-export at 2475×1155 before publishing — current file is soft." }),
  L({ artworkId: "a2", supplier: "zazzle", title: "Dragonfly Greeting Card", category: "Cards", status: "active", retailPrice: 4.6, royaltyRate: 12, description: "Blank-inside greeting card with jeweled dragonfly.", tags: ["greeting card", "dragonfly", "blank card", "thinking of you"], sku: "ZZ-DF-CRD-01", photos: [dragonfly] }),
  L({ artworkId: "a3", supplier: "printify", title: "Magnolia Checker Throw Pillow", category: "Home Goods", status: "active", retailPrice: 34, baseCost: 14.75, description: "Spun polyester square pillow in a magnolia-and-checkerboard all-over print.", tags: ["throw pillow", "checkerboard", "botanical decor"], sku: "PF-MC-PIL-18", photos: [magnolia], printProvider: "Jondo", dpiCheck: true, variantNotes: "14\", 18\", 20\" squares." }),
  L({ artworkId: "a3", supplier: "zazzle", title: "Magnolia Checker Notebook", category: "Stationery", status: "archived", retailPrice: 16.95, royaltyRate: 10, description: "Spiral notebook with botanical checker cover.", tags: ["notebook", "journal", "botanical"], sku: "ZZ-MC-NTB-01", photos: [magnolia] }),
  L({ artworkId: "a4", supplier: "zazzle", title: "Bloom Script Thank You Card", category: "Cards", status: "active", retailPrice: 3.95, royaltyRate: 14, description: "Hand-lettered 'Bloom' card with gold flourishes.", tags: ["thank you card", "lettering", "bloom", "watercolor"], sku: "ZZ-BL-TY-01", photos: [bloom] }),
  L({ artworkId: null, supplier: "printify", title: "Raw Palette Logo Cap", category: "Apparel", status: "draft", retailPrice: 28, baseCost: 12.3, description: "Embroidered dad cap with The Raw Palette wordmark.", tags: ["cap", "embroidered", "brand merch"], sku: "PF-RP-CAP-01", printProvider: "Embroidery Co", productionNotes: "Need 6-color thread version of the logo." }),
];

const KEY = "raw-palette-catalog-v1";
export function loadCatalog(): { artworks: Artwork[]; listings: Listing[] } {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    /* ignore */
  }
  return { artworks: seedArtworks, listings: seedListings };
}
export function saveCatalog(data: { artworks: Artwork[]; listings: Listing[] }) {
  try {
    localStorage.setItem(KEY, JSON.stringify(data));
  } catch {
    /* quota */
  }
}
/** True when this browser holds a saved (non-seed) catalog that can be imported to Cloud. */
export function hasBrowserCatalog(): boolean {
  try {
    return localStorage.getItem(KEY) !== null;
  } catch {
    return false;
  }
}

export const money = (n: number) =>
  n.toLocaleString("en-US", { style: "currency", currency: "USD" });
