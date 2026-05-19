-- Run in Supabase SQL editor

create table if not exists public.trackers (
  id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  company text,
  category text,
  notes text,
  delivery_receipt_date timestamptz,
  delivery_receipt_end_date timestamptz,
  images text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table if not exists public.tracker_images (
  id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  tracker_id text not null references public.trackers(id) on delete cascade,
  image_path text not null,
  name text not null,
  type text not null,
  size bigint not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table if not exists public.activities (
  id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  tracker_id text,
  type text not null,
  message text not null,
  preview_image_data_url text,
  created_at timestamptz not null default now()
);

create table if not exists public.app_settings (
  id text not null default 'app',
  user_id uuid not null references auth.users(id) on delete cascade,
  display_name text,
  dark_mode text not null default 'system',
  reminder jsonb not null default '{"enabled":true,"intervalMinutes":1,"notificationSoundEnabled":true}'::jsonb,
  lock jsonb not null default '{"enabled":false,"biometricEnabled":false}'::jsonb,
  seeded_at timestamptz,
  last_reminder_events jsonb not null default '{}'::jsonb,
  dismissed_reminder_months jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  primary key (id, user_id)
);

alter table public.trackers enable row level security;
alter table public.tracker_images enable row level security;
alter table public.activities enable row level security;
alter table public.app_settings enable row level security;

create policy if not exists "trackers owner all" on public.trackers
for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy if not exists "tracker_images owner all" on public.tracker_images
for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy if not exists "activities owner all" on public.activities
for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy if not exists "app_settings owner all" on public.app_settings
for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

insert into storage.buckets (id, name, public)
values ('tracker-images', 'tracker-images', false)
on conflict (id) do nothing;

create policy if not exists "tracker images owner select" on storage.objects
for select using (bucket_id = 'tracker-images' and auth.uid()::text = (storage.foldername(name))[1]);

create policy if not exists "tracker images owner write" on storage.objects
for insert with check (bucket_id = 'tracker-images' and auth.uid()::text = (storage.foldername(name))[1]);

create policy if not exists "tracker images owner update" on storage.objects
for update using (bucket_id = 'tracker-images' and auth.uid()::text = (storage.foldername(name))[1])
with check (bucket_id = 'tracker-images' and auth.uid()::text = (storage.foldername(name))[1]);

create policy if not exists "tracker images owner delete" on storage.objects
for delete using (bucket_id = 'tracker-images' and auth.uid()::text = (storage.foldername(name))[1]);
