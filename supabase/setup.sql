-- Run this once in Supabase Dashboard > SQL Editor.
-- The bucket is private. Each signed-in user can only access their own catalog and files.

create table if not exists public.catalog_state (
  user_id uuid primary key references auth.users(id) on delete cascade,
  artworks jsonb not null default '[]'::jsonb,
  listings jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.catalog_state enable row level security;

drop policy if exists "Users can read their own catalog" on public.catalog_state;
create policy "Users can read their own catalog"
  on public.catalog_state for select to authenticated
  using (auth.uid() = user_id);

drop policy if exists "Users can create their own catalog" on public.catalog_state;
create policy "Users can create their own catalog"
  on public.catalog_state for insert to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "Users can update their own catalog" on public.catalog_state;
create policy "Users can update their own catalog"
  on public.catalog_state for update to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

insert into storage.buckets (id, name, public)
values ('catalog-images', 'catalog-images', false)
on conflict (id) do update set public = false;

drop policy if exists "Users can view their own catalog images" on storage.objects;
create policy "Users can view their own catalog images"
  on storage.objects for select to authenticated
  using (bucket_id = 'catalog-images' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "Users can upload their own catalog images" on storage.objects;
create policy "Users can upload their own catalog images"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'catalog-images' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "Users can update their own catalog images" on storage.objects;
create policy "Users can update their own catalog images"
  on storage.objects for update to authenticated
  using (bucket_id = 'catalog-images' and (storage.foldername(name))[1] = auth.uid()::text)
  with check (bucket_id = 'catalog-images' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "Users can delete their own catalog images" on storage.objects;
create policy "Users can delete their own catalog images"
  on storage.objects for delete to authenticated
  using (bucket_id = 'catalog-images' and (storage.foldername(name))[1] = auth.uid()::text);
