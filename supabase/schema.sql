-- TERRA AUTH + BANK SAMPAH + REWARD SCHEMA
-- Jalankan seluruh file ini di Supabase SQL Editor.

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null default '',
  role text not null default 'siswa' check (role in ('siswa', 'petugas', 'admin')),
  is_blocked boolean not null default false,
  avatar_url text,
  created_at timestamptz not null default now()
);

alter table public.profiles add column if not exists is_blocked boolean not null default false;
alter table public.profiles add column if not exists avatar_url text;

create table if not exists public.point_wallets (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  balance integer not null default 0 check (balance >= 0),
  updated_at timestamptz not null default now()
);

create table if not exists public.point_transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  amount integer not null check (amount <> 0),
  transaction_type text not null check (transaction_type in ('deposit_reward', 'reward_redemption', 'manual_adjustment')),
  reference_id uuid,
  description text not null default '',
  created_at timestamptz not null default now()
);

create table if not exists public.waste_deposits (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.profiles(id) on delete cascade,
  bank_name text not null,
  category text not null check (category in ('Organik', 'Anorganik', 'B3', 'Residu')),
  material text not null,
  weight_kg numeric(10,2) not null check (weight_kg > 0 and weight_kg <= 1000),
  notes text,
  photo_path text not null,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  points_awarded integer not null default 0 check (points_awarded >= 0),
  verified_by uuid references public.profiles(id),
  staff_note text,
  created_at timestamptz not null default now(),
  verified_at timestamptz
);

create table if not exists public.rewards (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text not null default '',
  points_cost integer not null check (points_cost > 0),
  stock integer not null default 0 check (stock >= 0),
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.reward_redemptions (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.profiles(id) on delete cascade,
  reward_id uuid not null references public.rewards(id),
  points_cost integer not null check (points_cost > 0),
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  verified_by uuid references public.profiles(id),
  staff_note text,
  created_at timestamptz not null default now(),
  verified_at timestamptz
);

-- Private bucket untuk bukti foto setoran. Backend service_role yang mengunggah dan membuat signed URL.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('waste-deposit-photos', 'waste-deposit-photos', false, 5242880, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update set public = false, file_size_limit = 5242880, allowed_mime_types = excluded.allowed_mime_types;

alter table public.waste_deposits add column if not exists photo_path text;


-- Foto profil pengguna. Bucket publik hanya untuk avatar, bukan bukti setoran.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('profile-photos', 'profile-photos', true, 2097152, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update set public = true, file_size_limit = 2097152, allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "profile_photos_public_read" on storage.objects;
create policy "profile_photos_public_read"
on storage.objects for select
using (bucket_id = 'profile-photos');

drop policy if exists "profile_photos_insert_own" on storage.objects;
create policy "profile_photos_insert_own"
on storage.objects for insert
to authenticated
with check (bucket_id = 'profile-photos' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "profile_photos_update_own" on storage.objects;
create policy "profile_photos_update_own"
on storage.objects for update
to authenticated
using (bucket_id = 'profile-photos' and (storage.foldername(name))[1] = auth.uid()::text)
with check (bucket_id = 'profile-photos' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "profile_photos_delete_own" on storage.objects;
create policy "profile_photos_delete_own"
on storage.objects for delete
to authenticated
using (bucket_id = 'profile-photos' and (storage.foldername(name))[1] = auth.uid()::text);

create or replace function public.update_profile_avatar(p_avatar_url text)
returns text
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then raise exception 'Belum login.'; end if;
  if p_avatar_url is null or length(p_avatar_url) > 1000 then raise exception 'URL foto profil tidak valid.'; end if;
  update public.profiles set avatar_url = p_avatar_url where id = auth.uid();
  return p_avatar_url;
end;
$$;

revoke execute on function public.update_profile_avatar(text) from public, anon;
grant execute on function public.update_profile_avatar(text) to authenticated;

create index if not exists waste_deposits_student_idx on public.waste_deposits(student_id, created_at desc);
create index if not exists waste_deposits_status_idx on public.waste_deposits(status, created_at asc);
create index if not exists point_transactions_user_idx on public.point_transactions(user_id, created_at desc);
create index if not exists reward_redemptions_status_idx on public.reward_redemptions(status, created_at asc);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, role, is_blocked)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', ''),
    'siswa',
    false
  )
  on conflict (id) do nothing;

  insert into public.point_wallets (user_id, balance)
  values (new.id, 0)
  on conflict (user_id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();

-- Pastikan user lama juga punya wallet.
insert into public.point_wallets (user_id, balance)
select id, 0 from public.profiles
on conflict (user_id) do nothing;

-- 5 reward awal TERRA.
insert into public.rewards (name, description, points_cost, stock, active)
select * from (values
  ('Stiker TERRA', 'Paket stiker bertema TERRA untuk menghias buku atau laptop.', 100, 100, true),
  ('Notebook TERRA', 'Notebook untuk mencatat aktivitas dan ide ramah lingkungan.', 250, 50, true),
  ('Tote Bag TERRA', 'Tas pakai ulang untuk mengurangi penggunaan kantong sekali pakai.', 500, 30, true),
  ('Tumbler TERRA', 'Tumbler pakai ulang untuk kebiasaan minum tanpa botol sekali pakai.', 750, 20, true),
  ('Eco Kit TERRA', 'Paket perlengkapan sederhana untuk aktivitas ramah lingkungan.', 1000, 10, true)
) as v(name, description, points_cost, stock, active)
where not exists (select 1 from public.rewards r where r.name = v.name);

-- Biaya reward dibuat kecil agar progres terasa, tetapi tidak membanjiri saldo.
update public.rewards set points_cost = case name
  when 'Stiker TERRA' then 20
  when 'Notebook TERRA' then 50
  when 'Tote Bag TERRA' then 100
  when 'Tumbler TERRA' then 150
  when 'Eco Kit TERRA' then 250
  else points_cost
end
where name in ('Stiker TERRA', 'Notebook TERRA', 'Tote Bag TERRA', 'Tumbler TERRA', 'Eco Kit TERRA');

-- Rate XP per kg. B3/residu diberi 0 agar siswa tidak terdorong membawa limbah berbahaya
-- hanya demi mengejar poin.
create or replace function public.calculate_deposit_points(p_category text, p_weight numeric)
returns integer
language sql
immutable
as $$
  select greatest(0, floor(p_weight * case p_category
    when 'Anorganik' then 10
    when 'Organik' then 5
    when 'B3' then 0
    when 'Residu' then 0
    else 0
  end)::integer);
$$;

-- Atomic: setoran hanya bisa diverifikasi sekali dan XP diberikan sekali.
create or replace function public.approve_waste_deposit(p_deposit_id uuid, p_staff_id uuid, p_approved boolean, p_staff_note text default null)
returns jsonb
language plpgsql
security definer set search_path = public
as $$
declare
  d public.waste_deposits%rowtype;
  staff_role text;
  points integer;
begin
  select role into staff_role from public.profiles where id = p_staff_id and not is_blocked;
  if staff_role is null or staff_role not in ('admin', 'petugas') then
    raise exception 'Akses verifikasi ditolak.';
  end if;

  select * into d from public.waste_deposits where id = p_deposit_id for update;
  if not found then raise exception 'Setoran tidak ditemukan.'; end if;
  if d.status <> 'pending' then raise exception 'Setoran sudah diproses.'; end if;

  if not p_approved then
    update public.waste_deposits
      set status = 'rejected', verified_by = p_staff_id, staff_note = p_staff_note, verified_at = now()
      where id = p_deposit_id;
    return jsonb_build_object('status', 'rejected', 'points', 0);
  end if;

  points := public.calculate_deposit_points(d.category, d.weight_kg);

  update public.waste_deposits
    set status = 'approved', points_awarded = points, verified_by = p_staff_id, staff_note = p_staff_note, verified_at = now()
    where id = p_deposit_id;

  insert into public.point_wallets(user_id, balance)
    values(d.student_id, 0)
    on conflict(user_id) do nothing;

  update public.point_wallets
    set balance = balance + points, updated_at = now()
    where user_id = d.student_id;

  if points > 0 then
    insert into public.point_transactions(user_id, amount, transaction_type, reference_id, description)
    values(d.student_id, points, 'deposit_reward', d.id, 'XP dari setoran sampah yang dikonfirmasi petugas');
  end if;

  return jsonb_build_object('status', 'approved', 'points', points);
end;
$$;

-- Atomic: stok dan saldo dicek ulang saat petugas menyetujui reward.
create or replace function public.approve_reward_redemption(p_redemption_id uuid, p_staff_id uuid, p_approved boolean, p_staff_note text default null)
returns jsonb
language plpgsql
security definer set search_path = public
as $$
declare
  r public.reward_redemptions%rowtype;
  reward_row public.rewards%rowtype;
  staff_role text;
  current_balance integer;
begin
  select role into staff_role from public.profiles where id = p_staff_id and not is_blocked;
  if staff_role is null or staff_role not in ('admin', 'petugas') then
    raise exception 'Akses verifikasi ditolak.';
  end if;

  select * into r from public.reward_redemptions where id = p_redemption_id for update;
  if not found then raise exception 'Penukaran tidak ditemukan.'; end if;
  if r.status <> 'pending' then raise exception 'Penukaran sudah diproses.'; end if;

  if not p_approved then
    update public.reward_redemptions
      set status = 'rejected', verified_by = p_staff_id, staff_note = p_staff_note, verified_at = now()
      where id = p_redemption_id;
    return jsonb_build_object('status', 'rejected');
  end if;

  select * into reward_row from public.rewards where id = r.reward_id for update;
  if not found or not reward_row.active then raise exception 'Reward tidak tersedia.'; end if;
  if reward_row.stock <= 0 then raise exception 'Stok reward habis.'; end if;

  select balance into current_balance from public.point_wallets where user_id = r.student_id for update;
  if coalesce(current_balance, 0) < r.points_cost then raise exception 'XP siswa tidak mencukupi.'; end if;

  update public.point_wallets
    set balance = balance - r.points_cost, updated_at = now()
    where user_id = r.student_id;

  update public.rewards
    set stock = stock - 1
    where id = r.reward_id;

  update public.reward_redemptions
    set status = 'approved', verified_by = p_staff_id, staff_note = p_staff_note, verified_at = now()
    where id = p_redemption_id;

  insert into public.point_transactions(user_id, amount, transaction_type, reference_id, description)
  values(r.student_id, -r.points_cost, 'reward_redemption', r.id, 'Penukaran reward yang dikonfirmasi petugas');

  return jsonb_build_object('status', 'approved');
end;
$$;

-- RPC verifikasi hanya boleh dipanggil backend memakai service_role.
-- Jangan biarkan client authenticated memanggil fungsi ini langsung.
revoke execute on function public.approve_waste_deposit(uuid, uuid, boolean, text) from public, anon, authenticated;
revoke execute on function public.approve_reward_redemption(uuid, uuid, boolean, text) from public, anon, authenticated;
grant execute on function public.approve_waste_deposit(uuid, uuid, boolean, text) to service_role;
grant execute on function public.approve_reward_redemption(uuid, uuid, boolean, text) to service_role;

-- RLS. Semua operasi sensitif dilakukan backend dengan service role.
alter table public.profiles enable row level security;
alter table public.point_wallets enable row level security;
alter table public.point_transactions enable row level security;
alter table public.waste_deposits enable row level security;
alter table public.rewards enable row level security;
alter table public.reward_redemptions enable row level security;

drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own" on public.profiles for select to authenticated using (auth.uid() = id);

-- User Auth lama yang kehilangan profile setelah reset DB boleh membuat
-- profile dirinya sendiri, tetapi SELALU sebagai siswa. Admin/petugas tidak
-- dapat menaikkan role lewat browser.
drop policy if exists "profiles_insert_own_student" on public.profiles;
create policy "profiles_insert_own_student"
on public.profiles
for insert
to authenticated
with check (
  auth.uid() = id
  and role = 'siswa'
  and is_blocked = false
);

drop policy if exists "wallet_select_own" on public.point_wallets;
create policy "wallet_select_own" on public.point_wallets for select to authenticated using (auth.uid() = user_id);

drop policy if exists "transactions_select_own" on public.point_transactions;
create policy "transactions_select_own" on public.point_transactions for select to authenticated using (auth.uid() = user_id);

drop policy if exists "deposits_select_own" on public.waste_deposits;
create policy "deposits_select_own" on public.waste_deposits for select to authenticated using (auth.uid() = student_id);

drop policy if exists "rewards_select_active" on public.rewards;
create policy "rewards_select_active" on public.rewards for select to authenticated using (active = true);

drop policy if exists "redemptions_select_own" on public.reward_redemptions;
create policy "redemptions_select_own" on public.reward_redemptions for select to authenticated using (auth.uid() = student_id);

-- Tidak ada INSERT/UPDATE policy untuk data sensitif.
-- Backend memakai service role yang tidak pernah dikirim ke browser.
