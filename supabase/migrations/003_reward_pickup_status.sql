-- Reward redemption lifecycle: pending -> approved/rejected -> picked_up.
alter table public.reward_redemptions
  drop constraint if exists reward_redemptions_status_check;

alter table public.reward_redemptions
  add constraint reward_redemptions_status_check
  check (status in ('pending', 'approved', 'rejected', 'picked_up'));

create or replace function public.approve_reward_redemption(
  p_redemption_id uuid,
  p_staff_id uuid,
  p_approved boolean,
  p_staff_note text default null
)
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
  if coalesce(current_balance, 0) < r.points_cost then raise exception 'Poin siswa tidak mencukupi.'; end if;

  update public.point_wallets set balance = balance - r.points_cost, updated_at = now() where user_id = r.student_id;
  update public.rewards set stock = stock - 1 where id = r.reward_id;

  update public.reward_redemptions
    set status = 'approved', verified_by = p_staff_id, staff_note = p_staff_note, verified_at = now()
    where id = p_redemption_id;

  insert into public.point_transactions(user_id, amount, transaction_type, reference_id, description)
  values(r.student_id, -r.points_cost, 'reward_redemption', r.id, 'Penukaran reward yang dikonfirmasi petugas');

  return jsonb_build_object('status', 'approved');
end;
$$;

revoke execute on function public.approve_reward_redemption(uuid, uuid, boolean, text) from public, anon, authenticated;
grant execute on function public.approve_reward_redemption(uuid, uuid, boolean, text) to service_role;

create or replace function public.mark_reward_redemption_picked_up(p_redemption_id uuid, p_staff_id uuid)
returns jsonb
language plpgsql
security definer set search_path = public
as $$
declare
  staff_role text;
  current_status text;
begin
  select role into staff_role from public.profiles where id = p_staff_id and not is_blocked;
  if staff_role is null or staff_role not in ('admin', 'petugas') then
    raise exception 'Akses ditolak.';
  end if;

  select status into current_status from public.reward_redemptions where id = p_redemption_id for update;
  if current_status is null then raise exception 'Penukaran tidak ditemukan.'; end if;
  if current_status <> 'approved' then raise exception 'Reward belum berstatus disetujui.'; end if;

  update public.reward_redemptions
    set status = 'picked_up', verified_by = p_staff_id, verified_at = now(),
        staff_note = coalesce(staff_note, 'Reward sudah diserahkan kepada siswa.')
    where id = p_redemption_id;

  return jsonb_build_object('status', 'picked_up');
end;
$$;

revoke execute on function public.mark_reward_redemption_picked_up(uuid, uuid) from public, anon, authenticated;
grant execute on function public.mark_reward_redemption_picked_up(uuid, uuid) to service_role;
