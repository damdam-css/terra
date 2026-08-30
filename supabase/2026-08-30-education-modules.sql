-- TERRA: ensure admin-managed education modules exist in production
create table if not exists public.education_modules (
  id uuid primary key default gen_random_uuid(),
  data jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists education_modules_created_idx
  on public.education_modules(created_at asc);

alter table public.education_modules enable row level security;

drop policy if exists "education_public_read" on public.education_modules;
create policy "education_public_read"
  on public.education_modules
  for select to anon, authenticated
  using (true);
