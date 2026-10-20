ALTER TABLE public.listings ADD COLUMN supplier text NOT NULL DEFAULT '';
UPDATE public.listings SET supplier = store WHERE supplier = '';
ALTER TABLE public.listings DROP CONSTRAINT IF EXISTS listings_store_check;
ALTER TABLE public.listings ADD CONSTRAINT listings_supplier_check CHECK (supplier IN ('printify', 'zazzle'));
COMMENT ON COLUMN public.listings.store IS 'Free-text store name (e.g. "Raw Palette on Etsy"); fulfillment supplier lives in supplier.';

CREATE TABLE public.categories (
  id text primary key,
  user_id uuid not null default auth.uid(),
  name text not null,
  created_at timestamptz not null default now(),
  unique (user_id, name)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.categories TO authenticated;
GRANT ALL ON public.categories TO service_role;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owners manage categories" ON public.categories FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE INDEX categories_user_idx ON public.categories (user_id);