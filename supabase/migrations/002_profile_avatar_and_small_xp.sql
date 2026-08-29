-- TERRA: foto profil + XP kecil.
-- Jalankan setelah schema.sql lama sudah terpasang.

alter table public.profiles add column if not exists avatar_url text;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('profile-photos', 'profile-photos', true, 2097152, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update set
  public = true,
  file_size_limit = 2097152,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "profile_photos_public_read" on storage.objects;
create policy "profile_photos_public_read"
on storage.objects for select
using (bucket_id = 'profile-photos');

drop policy if exists "profile_photos_insert_own" on storage.objects;
create policy "profile_photos_insert_own"
on storage.objects for insert to authenticated
with check (
  bucket_id = 'profile-photos'
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "profile_photos_update_own" on storage.objects;
create policy "profile_photos_update_own"
on storage.objects for update to authenticated
using (
  bucket_id = 'profile-photos'
  and (storage.foldername(name))[1] = auth.uid()::text
)
with check (
  bucket_id = 'profile-photos'
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "profile_photos_delete_own" on storage.objects;
create policy "profile_photos_delete_own"
on storage.objects for delete to authenticated
using (
  bucket_id = 'profile-photos'
  and (storage.foldername(name))[1] = auth.uid()::text
);

create or replace function public.update_profile_avatar(p_avatar_url text)
returns text
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then raise exception 'Belum login.'; end if;
  if p_avatar_url is null or length(p_avatar_url) > 1000 then
    raise exception 'URL foto profil tidak valid.';
  end if;
  update public.profiles
  set avatar_url = p_avatar_url
  where id = auth.uid();
  return p_avatar_url;
end;
$$;

revoke execute on function public.update_profile_avatar(text) from public, anon;
grant execute on function public.update_profile_avatar(text) to authenticated;

-- XP hanya diberikan oleh fungsi approval setoran, bukan scanner/edukasi.
-- Nilai sengaja kecil: Anorganik 10 XP/kg, Organik 5 XP/kg, B3/Residu 0 XP.
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

update public.rewards set points_cost = case name
  when 'Stiker TERRA' then 20
  when 'Notebook TERRA' then 50
  when 'Tote Bag TERRA' then 100
  when 'Tumbler TERRA' then 150
  when 'Eco Kit TERRA' then 250
  else points_cost
end
where name in ('Stiker TERRA', 'Notebook TERRA', 'Tote Bag TERRA', 'Tumbler TERRA', 'Eco Kit TERRA');
