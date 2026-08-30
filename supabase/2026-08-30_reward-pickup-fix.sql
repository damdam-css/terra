-- Run this once on the existing production database.
-- Safe to re-run.

alter table public.reward_redemptions
  add column if not exists picked_up_by uuid references public.profiles(id);
alter table public.reward_redemptions
  add column if not exists picked_up_at timestamptz;
alter table public.reward_redemptions
  drop constraint if exists reward_redemptions_status_check;
alter table public.reward_redemptions
  add constraint reward_redemptions_status_check
  check (status in ('pending', 'approved', 'rejected', 'picked_up'));

create or replace function public.mark_reward_redemption_picked_up(
  p_redemption_id uuid,
  p_staff_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  r public.reward_redemptions%rowtype;
  staff_role text;
begin
  select role
    into staff_role
    from public.profiles
   where id = p_staff_id
     and not is_blocked;

  if staff_role is null or staff_role not in ('admin', 'petugas') then
    raise exception 'Akses verifikasi ditolak.';
  end if;

  select *
    into r
    from public.reward_redemptions
   where id = p_redemption_id
   for update;

  if not found then
    raise exception 'Penukaran reward tidak ditemukan.';
  end if;

  if r.status <> 'approved' then
    raise exception 'Reward harus berstatus approved sebelum ditandai sudah diambil.';
  end if;

  update public.reward_redemptions
     set status = 'picked_up',
         picked_up_by = p_staff_id,
         picked_up_at = now()
   where id = p_redemption_id;

  return jsonb_build_object(
    'status', 'picked_up',
    'redemption_id', p_redemption_id,
    'picked_up_by', p_staff_id
  );
end;
$$;
revoke execute on function public.mark_reward_redemption_picked_up(uuid, uuid) from public, anon, authenticated;
grant execute on function public.mark_reward_redemption_picked_up(uuid, uuid) to service_role;
