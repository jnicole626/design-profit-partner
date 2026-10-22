ALTER TABLE public.listings
  ADD COLUMN IF NOT EXISTS categories text[] NOT NULL DEFAULT '{}';

UPDATE public.listings
SET categories = ARRAY[category]
WHERE cardinality(categories) = 0;
