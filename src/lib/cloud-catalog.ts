import { supabase } from "@/integrations/supabase/client";
import type { Artwork, Listing } from "./catalog";
import type { TablesInsert } from "@/integrations/supabase/types";

export const cloudCatalogKey = (userId: string) => ["cloud-catalog", userId] as const;

async function ownerId() {
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) throw new Error("Sign in to save your catalog.");
  return data.user.id;
}

// Keep durable object references in rows, never expiring signed URLs.
export function storageReference(value: string): string {
  if (!value.includes("/storage/v1/object/sign/")) return value;
  const parts = value.split("/storage/v1/object/sign/");
  const path = parts[1]?.split("?")[0];
  return path ? `storage://${decodeURIComponent(path)}` : value;
}

async function imageForDisplay(value: string): Promise<string> {
  if (!value.startsWith("storage://")) return value;
  const [bucket, ...parts] = value.slice(10).split("/");
  if (!bucket || !parts.length) throw new Error("Invalid cloud image reference.");
  const { data, error } = await supabase.storage.from(bucket).createSignedUrl(parts.join("/"), 3600);
  if (error) throw error;
  return data.signedUrl;
}

async function persistImage(value: string, bucket: string, userId: string): Promise<string> {
  const durable = storageReference(value);
  if (!durable || durable.startsWith("storage://")) return durable;
  // Existing external links remain links; uploaded images and bundled sample images are copied into storage.
  if (/^https?:/.test(durable)) return durable;
  const response = await fetch(durable);
  if (!response.ok) throw new Error("Could not read the image. Please upload it again.");
  const blob = await response.blob();
  const path = `${userId}/${crypto.randomUUID()}`;
  const { error } = await supabase.storage.from(bucket).upload(path, blob, { contentType: blob.type });
  if (error) throw error;
  return `storage://${bucket}/${path}`;
}

export async function fetchCloudCatalog() {
  const userId = await ownerId();
  const [a, l, c] = await Promise.all([
    supabase.from("artworks").select("*").eq("user_id", userId).order("created_at"),
    supabase.from("listings").select("*").eq("user_id", userId).order("created_at"),
    supabase.from("categories").select("name").eq("user_id", userId).order("name"),
  ]);
  if (a.error) throw a.error;
  if (l.error) throw l.error;
  if (c.error) throw c.error;
  const artworks: Artwork[] = await Promise.all(a.data.map(async (row) => ({
    id: row.id, name: row.name, image: await imageForDisplay(row.image), notes: row.notes, createdAt: row.created_at,
  })));
  const listings: Listing[] = await Promise.all(l.data.map(async (row) => ({
    id: row.id, artworkId: row.artwork_id, store: row.store, supplier: row.supplier as Listing["supplier"], title: row.title,
    category: row.category, status: row.status as Listing["status"], retailPrice: Number(row.retail_price),
    baseCost: Number(row.base_cost), royaltyRate: Number(row.royalty_rate), description: row.description,
    tags: row.tags, url: row.url, sku: row.sku, photos: await Promise.all(row.photos.map(imageForDisplay)),
    printProvider: row.print_provider, dpiCheck: row.dpi_check, variantNotes: row.variant_notes, productionNotes: row.production_notes,
  })));
  const categories = c.data.map((row) => row.name);
  return { artworks, listings, categories };
}

export async function saveCloudArtwork(artwork: Artwork) {
  const userId = await ownerId();
  const image = await persistImage(artwork.image, "artwork-originals", userId);
  const { error } = await supabase.from("artworks").upsert({ id: artwork.id, user_id: userId, name: artwork.name, image, notes: artwork.notes, created_at: artwork.createdAt });
  if (error) throw error;
}

export async function saveCloudListing(listing: Listing) {
  const userId = await ownerId();
  const photos = await Promise.all(listing.photos.map((p) => persistImage(p, "listing-mockups", userId)));
  const row: TablesInsert<"listings"> = {
    id: listing.id, user_id: userId, artwork_id: listing.artworkId, store: listing.store, supplier: listing.supplier,
    title: listing.title,
    category: listing.category, status: listing.status, retail_price: listing.retailPrice, base_cost: listing.baseCost,
    royalty_rate: listing.royaltyRate, description: listing.description, tags: listing.tags, url: listing.url,
    sku: listing.sku, photos, print_provider: listing.printProvider, dpi_check: listing.dpiCheck,
    variant_notes: listing.variantNotes, production_notes: listing.productionNotes,
  };
  const { error } = await supabase.from("listings").upsert(row);
  if (error) throw error;
}

export async function deleteCloudListing(id: string) {
  const userId = await ownerId();
  const { error } = await supabase.from("listings").delete().eq("id", id).eq("user_id", userId);
  if (error) throw error;
}

export async function saveCloudCategory(name: string) {
  const userId = await ownerId();
  const trimmed = name.trim();
  if (!trimmed) return;
  // Stable id makes repeat saves a no-op instead of a duplicate.
  const { error } = await supabase.from("categories").upsert(
    { id: `${userId}:${trimmed.toLowerCase()}`, user_id: userId, name: trimmed },
    { onConflict: "user_id,name", ignoreDuplicates: true },
  );
  if (error) throw error;
}

export async function importBrowserCatalog(catalog: { artworks: Artwork[]; listings: Listing[] }) {
  // Stable remapping makes retries safe and prevents legacy short IDs colliding across owners.
  const userId = await ownerId();
  const id = (value: string) => `${userId}:import:${value}`;
  for (const artwork of catalog.artworks) await saveCloudArtwork({ ...artwork, id: id(artwork.id) });
  for (const listing of catalog.listings) await saveCloudListing({ ...listing, id: id(listing.id), artworkId: listing.artworkId ? id(listing.artworkId) : null });
}
