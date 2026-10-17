import { createClient } from "@supabase/supabase-js";
import type { Artwork, Listing } from "@/lib/catalog";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined;

export const supabaseConfigured = Boolean(supabaseUrl && supabaseKey);
export const supabase = supabaseConfigured
  ? createClient(supabaseUrl!, supabaseKey!, {
      auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
    })
  : null;

export type CatalogData = { artworks: Artwork[]; listings: Listing[] };

export async function loadCloudCatalog(userId: string): Promise<CatalogData | null> {
  if (!supabase) throw new Error("Supabase isn't configured yet. Add the two VITE_SUPABASE settings.");
  const { data, error } = await supabase
    .from("catalog_state")
    .select("artworks,listings")
    .eq("user_id", userId)
    .maybeSingle();
  if (error) throw error;
  return data ? { artworks: data.artworks as Artwork[], listings: data.listings as Listing[] } : null;
}

export async function saveCloudCatalog(userId: string, catalog: CatalogData) {
  if (!supabase) throw new Error("Supabase isn't configured yet. Add the two VITE_SUPABASE settings.");
  const { error } = await supabase.from("catalog_state").upsert({
    user_id: userId,
    artworks: catalog.artworks,
    listings: catalog.listings,
    updated_at: new Date().toISOString(),
  });
  if (error) throw error;
}

export async function uploadCatalogImage(userId: string, file: File): Promise<string> {
  if (!supabase) throw new Error("Supabase isn't configured yet. Add the two VITE_SUPABASE settings.");
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "-");
  const path = `${userId}/${crypto.randomUUID()}-${safeName}`;
  const { error } = await supabase.storage.from("catalog-images").upload(path, file, {
    cacheControl: "3600",
    upsert: false,
    contentType: file.type || undefined,
  });
  if (error) throw error;
  // Store the object path, not a public URL. Signed-in views can request a fresh signed URL.
  return `supabase-storage:${path}`;
}

export async function resolveCatalogImage(image: string): Promise<string> {
  if (!image.startsWith("supabase-storage:") || !supabase) return image;
  const path = image.slice("supabase-storage:".length);
  const { data, error } = await supabase.storage.from("catalog-images").createSignedUrl(path, 60 * 60);
  if (error) throw error;
  return data.signedUrl;
}

/** Convert legacy data-URL images from the old browser-only catalog into private storage objects. */
export async function migrateLegacyImages(userId: string, catalog: CatalogData): Promise<CatalogData> {
  const migrate = async (value: string, label: string) => {
    if (!value.startsWith("data:image/")) return value;
    const response = await fetch(value);
    const blob = await response.blob();
    const file = new File([blob], label.replace(/[^a-zA-Z0-9._-]/g, "-") + ".image", {
      type: blob.type || "image/png",
    });
    return uploadCatalogImage(userId, file);
  };
  const artworks = await Promise.all(catalog.artworks.map(async (artwork) => ({
    ...artwork,
    image: await migrate(artwork.image, `artwork-${artwork.id}`),
  })));
  const listings = await Promise.all(catalog.listings.map(async (listing) => ({
    ...listing,
    photos: await Promise.all(listing.photos.map((photo, index) => migrate(photo, `listing-${listing.id}-${index}`))),
  })));
  return { artworks, listings };
}
