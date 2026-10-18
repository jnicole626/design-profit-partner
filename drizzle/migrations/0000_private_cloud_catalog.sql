CREATE TABLE public.artworks (
 id text PRIMARY KEY,
 user_id uuid NOT NULL DEFAULT auth.uid(),
 name text NOT NULL,
 image text NOT NULL DEFAULT '',
 notes text NOT NULL DEFAULT '',
 created_at date NOT NULL DEFAULT CURRENT_DATE,
 UNIQUE(id, user_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.artworks TO authenticated;
GRANT ALL ON public.artworks TO service_role;
ALTER TABLE public.artworks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owners manage artwork" ON public.artworks FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE INDEX artworks_owner_idx ON public.artworks(user_id);
CREATE TABLE public.listings (
 id text PRIMARY KEY,
 user_id uuid NOT NULL DEFAULT auth.uid(),
 artwork_id text,
 store text NOT NULL CHECK (store IN ('printify','zazzle')),
 title text NOT NULL DEFAULT '',
 category text NOT NULL,
 status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','active','archived')),
 retail_price numeric NOT NULL DEFAULT 0,
 base_cost numeric NOT NULL DEFAULT 0,
 royalty_rate numeric NOT NULL DEFAULT 10,
 description text NOT NULL DEFAULT '',
 tags text[] NOT NULL DEFAULT '{}',
 url text NOT NULL DEFAULT '',
 sku text NOT NULL DEFAULT '',
 photos text[] NOT NULL DEFAULT '{}',
 print_provider text NOT NULL DEFAULT '',
 dpi_check boolean NOT NULL DEFAULT false,
 variant_notes text NOT NULL DEFAULT '',
 production_notes text NOT NULL DEFAULT '',
 created_at timestamptz NOT NULL DEFAULT now(),
 FOREIGN KEY (artwork_id,user_id) REFERENCES public.artworks(id,user_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.listings TO authenticated;
GRANT ALL ON public.listings TO service_role;
ALTER TABLE public.listings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owners manage listings" ON public.listings FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE INDEX listings_owner_idx ON public.listings(user_id);
CREATE INDEX listings_artwork_idx ON public.listings(artwork_id);
CREATE POLICY "Owners manage catalog files" ON storage.objects FOR ALL TO authenticated USING (bucket_id IN ('artwork-originals','listing-mockups') AND (storage.foldername(name))[1] = auth.uid()::text) WITH CHECK (bucket_id IN ('artwork-originals','listing-mockups') AND (storage.foldername(name))[1] = auth.uid()::text);