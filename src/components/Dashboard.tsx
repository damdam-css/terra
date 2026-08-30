import React, { useCallback, useEffect, useState } from 'react';
import {
  ArrowLeft,
  Banknote,
  Ban,
  BookOpen,
  CheckCircle2,
  Clock3,
  Gift,
  History,
  Leaf,
  Trophy,
  LogOut,
  PackageCheck,
  RefreshCw,
  ScanLine,
  ShieldCheck,
  UserRound,
  UsersRound,
  XCircle,
  MessageCircle,
  Camera,
  Image as ImageIcon,
  KeyRound,
  Trash2,
} from 'lucide-react';
import { UserRole, WasteCategory } from '../types';
import { supabase } from '../lib/supabase';
import { TerraVision } from './TerraVision';
import { TerraAIModal } from './TerraAIModal';

interface DashboardProps {
  role: UserRole;
  fullName: string;
  email: string;
  onLogout: () => void;
  onBackToLanding?: () => void;
  avatarUrl?: string | null;
  onAvatarUpdated?: (avatarUrl: string) => void;
}

interface ManagedUser {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  is_blocked: boolean;
  email_confirmed: boolean;
  created_at: string;
}

interface Deposit {
  id: string;
  student_id: string;
  student_name: string;
  student_email: string;
  bank_name: string;
  category: WasteCategory;
  material: string;
  weight_kg: number;
  notes: string | null;
  photo_path?: string | null;
  photo_url?: string | null;
  status: 'pending' | 'approved' | 'rejected';
  points_awarded: number;
  staff_note: string | null;
  created_at: string;
  verified_at: string | null;
}

interface Reward {
  id: string;
  name: string;
  description: string;
  points_cost: number;
  stock: number;
  active: boolean;
}

interface Redemption {
  id: string;
  reward_id: string;
  reward_name: string;
  student_name?: string;
  student_email?: string;
  points_cost: number;
  status: 'pending' | 'approved' | 'rejected' | 'picked_up';
  staff_note: string | null;
  created_at: string;
  verified_at: string | null;
}

const api = async (path: string, init: RequestInit = {}) => {
  if (!supabase) throw new Error('Supabase belum dikonfigurasi.');

  const { data: { session } } = await supabase.auth.getSession();

  const response = await fetch(path, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(init.headers || {}),
      Authorization: `Bearer ${session?.access_token || ''}`,
    },
  });

  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(body.error || 'Request gagal.');
  return body;
};

const categoryOptions: WasteCategory[] = ['Organik', 'Anorganik', 'B3', 'Residu'];

const formatDate = (value: string) => {
  return new Intl.DateTimeFormat('id-ID', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));
};

const statusClass = (status: string) => {
  if (status === 'approved' || status === 'picked_up') return 'bg-emerald-100 text-emerald-800';
  if (status === 'rejected') return 'bg-red-100 text-red-800';
  return 'bg-amber-100 text-amber-800';
};

export const Dashboard: React.FC<DashboardProps> = ({ role, fullName, email, onLogout, onBackToLanding, avatarUrl, onAvatarUpdated }) => {
  const roleLabel = role === 'admin' ? 'Administrator' : role === 'petugas' ? 'Petugas' : 'Siswa';
  const canManageUsers = role === 'admin' || role === 'petugas';
  const canVerify = canManageUsers;

  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [deposits, setDeposits] = useState<Deposit[]>([]);
  const [redemptions, setRedemptions] = useState<Redemption[]>([]);
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [xp, setXp] = useState(0);
  const [verifiedDepositCount, setVerifiedDepositCount] = useState(0);
  const [leaderboard, setLeaderboard] = useState<{ id: string; full_name: string; avatar_url?: string | null; points: number; rank: number }[]>([]);
  const [loadingLeaderboard, setLoadingLeaderboard] = useState(false);

  const [loading, setLoading] = useState(false);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [view, setView] = useState<'home' | 'bank' | 'scanner' | 'reward' | 'verify'>('home');
  const [isTerriOpen, setIsTerriOpen] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [adminRewards, setAdminRewards] = useState<Reward[]>([]);
  const [loadingAdminRewards, setLoadingAdminRewards] = useState(false);

  const [depositForm, setDepositForm] = useState({
    bankName: 'Bank Sampah TERRA Sekolah',
    category: 'Anorganik' as WasteCategory,
    material: '',
    weightKg: '',
    notes: '',
    photoBase64: '',
    photoMimeType: 'image/jpeg',
  });

  const showError = (message: string) => {
    setNotice('');
    setError(message);
  };

  const showNotice = (message: string) => {
    setError('');
    setNotice(message);
  };

  // Feedback UI is intentionally transient. Validation errors such as
  // insufficient points should not stay stuck on the dashboard forever.
  useEffect(() => {
    if (!error && !notice) return;
    const timer = window.setTimeout(() => {
      setError('');
      setNotice('');
    }, 4500);
    return () => window.clearTimeout(timer);
  }, [error, notice]);

  const handleAvatarUpload = async (file?: File) => {
    if (!file || !supabase) return;
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      showError('Foto profil harus JPG, PNG, atau WebP.');
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      showError('Foto profil maksimal 2 MB.');
      return;
    }

    setUploadingAvatar(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Sesi login tidak ditemukan.');

      const ext = file.type === 'image/png' ? 'png' : file.type === 'image/webp' ? 'webp' : 'jpg';
      const path = `${user.id}/avatar.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from('profile-photos')
        .upload(path, file, { upsert: true, contentType: file.type, cacheControl: '3600' });
      if (uploadError) {
        const message = uploadError.message?.toLowerCase() || '';
        if (message.includes('bucket not found')) {
          throw new Error('Bucket foto profil belum tersedia. Restart server TERRA lalu coba lagi. Jika masih muncul, jalankan SQL schema terbaru di Supabase.');
        }
        throw uploadError;
      }

      const { data: publicData } = supabase.storage.from('profile-photos').getPublicUrl(path);
      const avatar = `${publicData.publicUrl}?v=${Date.now()}`;
      const { error: profileError } = await supabase.rpc('update_profile_avatar', { p_avatar_url: avatar });
      if (profileError) throw profileError;

      onAvatarUpdated?.(avatar);
      showNotice('Foto profil berhasil diperbarui.');
    } catch (err: any) {
      showError(err?.message || 'Gagal mengunggah foto profil.');
    } finally {
      setUploadingAvatar(false);
    }
  };

  const loadAdminRewards = useCallback(async () => {
    if (role !== 'admin') return;
    setLoadingAdminRewards(true);
    try {
      const result = await api('/api/admin/rewards');
      setAdminRewards(result.rewards || []);
    } catch (err: any) {
      showError(err?.message || 'Gagal memuat pengaturan reward.');
    } finally { setLoadingAdminRewards(false); }
  }, [role]);

  const updateAdminReward = async (reward: Reward, patch: Partial<Reward>) => {
    setBusyId(`reward-admin-${reward.id}`);
    try {
      const result = await api(`/api/admin/rewards/${reward.id}`, { method: 'PATCH', body: JSON.stringify(patch) });
      setAdminRewards((prev) => prev.map((r) => r.id === reward.id ? result.reward : r));
      setRewards((prev) => prev.map((r) => r.id === reward.id ? result.reward : r));
      showNotice('Pengaturan reward berhasil disimpan.');
    } catch (err: any) { showError(err?.message || 'Gagal mengubah reward.'); }
    finally { setBusyId(null); }
  };

  const loadLeaderboard = useCallback(async () => {
    setLoadingLeaderboard(true);
    try {
      const result = await api('/api/leaderboard');
      setLeaderboard(result.leaderboard || []);
    } catch (err: any) {
      showError(err?.message || 'Gagal memuat leaderboard.');
    } finally {
      setLoadingLeaderboard(false);
    }
  }, []);

  const loadStudentData = useCallback(async () => {
    if (role !== 'siswa') return;
    setLoading(true);
    try {
      const result = await api('/api/student/dashboard');
      setXp(Number(result.xp || 0));
      setVerifiedDepositCount(Number(result.verifiedDepositCount || 0));
      setDeposits(result.deposits || []);
      setRewards(result.rewards || []);
      setRedemptions(result.redemptions || []);
      void loadLeaderboard();
    } catch (err: any) {
      showError(err?.message || 'Gagal memuat data dashboard siswa.');
    } finally {
      setLoading(false);
    }
  }, [role, loadLeaderboard]);

  const loadStaffData = useCallback(async () => {
    if (!canVerify) return;
    setLoading(true);
    try {
      const result = await api('/api/staff/verification');
      setDeposits(result.deposits || []);
      setRedemptions(result.redemptions || []);
    } catch (err: any) {
      showError(err?.message || 'Gagal memuat antrean verifikasi.');
    } finally {
      setLoading(false);
    }
  }, [canVerify]);

  const loadUsers = useCallback(async () => {
    if (!canManageUsers) return;
    setLoadingUsers(true);
    try {
      const result = await api('/api/admin/users');
      setUsers(result.users || []);
    } catch (err: any) {
      showError(err?.message || 'Gagal memuat data akun.');
    } finally {
      setLoadingUsers(false);
    }
  }, [canManageUsers]);

  useEffect(() => {
    if (role === 'siswa') loadStudentData();
    if (role === 'admin') loadAdminRewards();
    if (canVerify) loadStaffData();
    if (canManageUsers) loadUsers();
  }, [role, canVerify, canManageUsers, loadStudentData, loadStaffData, loadUsers]);

  const handleDepositPhoto = (file?: File) => {
    if (!file) return;
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      showError('Foto harus berformat JPG, PNG, atau WebP.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      showError('Ukuran foto maksimal 5 MB.');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setDepositForm((current) => ({
        ...current,
        photoBase64: String(reader.result || ''),
        photoMimeType: file.type,
      }));
    };
    reader.onerror = () => showError('Foto gagal dibaca. Coba pilih foto lain.');
    reader.readAsDataURL(file);
  };

  const submitDeposit = async (event: React.FormEvent) => {
    event.preventDefault();
    setBusyId('new-deposit');
    setError('');
    setNotice('');

    const weight = Number(depositForm.weightKg);
    if (!depositForm.photoBase64) {
      showError('Foto sampah wajib diambil atau diunggah sebelum laporan dikirim.');
      setBusyId(null);
      return;
    }
    if (!depositForm.material.trim()) {
      showError('Nama/material sampah wajib diisi.');
      setBusyId(null);
      return;
    }
    if (!Number.isFinite(weight) || weight <= 0 || weight > 1000) {
      showError('Berat sampah harus lebih dari 0 kg dan maksimal 1000 kg.');
      setBusyId(null);
      return;
    }

    try {
      await api('/api/student/deposits', {
        method: 'POST',
        body: JSON.stringify({
          bankName: depositForm.bankName,
          category: depositForm.category,
          material: depositForm.material.trim(),
          weightKg: weight,
          notes: depositForm.notes.trim(),
          photoBase64: depositForm.photoBase64,
          photoMimeType: depositForm.photoMimeType,
        }),
      });

      setDepositForm({
        bankName: 'Bank Sampah TERRA Sekolah',
        category: 'Anorganik',
        material: '',
        weightKg: '',
        notes: '',
        photoBase64: '',
        photoMimeType: 'image/jpeg',
      });
      showNotice('Laporan berhasil dikirim. Tunggu konfirmasi petugas sebelum poin masuk.');
      await loadStudentData();
    } catch (err: any) {
      showError(err?.message || 'Gagal mengirim laporan sampah.');
    } finally {
      setBusyId(null);
    }
  };

  const redeemReward = async (reward: Reward) => {
    if (xp < reward.points_cost) {
      showError(`Poin kamu belum cukup. Reward ini membutuhkan ${reward.points_cost} poin.`);
      return;
    }
    if (reward.stock <= 0) {
      showError('Reward ini sedang habis.');
      return;
    }
    if (!window.confirm(`Ajukan penukaran ${reward.name} dengan ${reward.points_cost} poin?`)) return;

    setBusyId(reward.id);
    try {
      await api('/api/student/redemptions', {
        method: 'POST',
        body: JSON.stringify({ rewardId: reward.id }),
      });
      showNotice('Pengajuan reward berhasil dibuat. Poin baru dipotong setelah dikonfirmasi petugas.');
      await loadStudentData();
    } catch (err: any) {
      showError(err?.message || 'Gagal mengajukan reward.');
    } finally {
      setBusyId(null);
    }
  };

  const verifyDeposit = async (deposit: Deposit, approved: boolean) => {
    const action = approved ? 'mengonfirmasi' : 'menolak';
    if (!window.confirm(`Yakin mau ${action} laporan ${deposit.student_name}?`)) return;

    setBusyId(deposit.id);
    try {
      await api(`/api/staff/deposits/${deposit.id}/verify`, {
        method: 'POST',
        body: JSON.stringify({ approved }),
      });
      showNotice(approved ? 'Setoran dikonfirmasi dan poin diberikan.' : 'Setoran ditolak.');
      await loadStaffData();
    } catch (err: any) {
      showError(err?.message || 'Gagal memproses setoran.');
    } finally {
      setBusyId(null);
    }
  };

  const markRewardPickedUp = async (redemptionId: string) => {
    if (!window.confirm('Tandai reward ini sudah benar-benar diserahkan ke siswa?')) return;
    setBusyId(redemptionId);
    try {
      await api(`/api/staff/redemptions/${redemptionId}/pickup`, { method: 'POST' });
      showNotice('Reward ditandai sudah diambil.');
      await loadStaffData();
    } catch (err: any) {
      showError(err?.message || 'Gagal memperbarui status reward.');
    } finally {
      setBusyId(null);
    }
  };

  const verifyRedemption = async (redemption: Redemption, approved: boolean) => {
    const action = approved ? 'mengonfirmasi' : 'menolak';
    if (!window.confirm(`Yakin mau ${action} penukaran ${redemption.reward_name}?`)) return;

    setBusyId(redemption.id);
    try {
      await api(`/api/staff/redemptions/${redemption.id}/verify`, {
        method: 'POST',
        body: JSON.stringify({ approved }),
      });
      showNotice(approved ? 'Penukaran disetujui. Siswa diminta menemui petugas untuk mengambil reward.' : 'Penukaran reward ditolak.');
      await loadStaffData();
    } catch (err: any) {
      showError(err?.message || 'Gagal memproses penukaran reward.');
    } finally {
      setBusyId(null);
    }
  };

  const resetUserPassword = async (user: ManagedUser) => {
    if (role !== 'admin') return;
    const password = window.prompt(`Password baru untuk ${user.email} (minimal 8 karakter):`, '');
    if (password === null) return;
    if (password.length < 8) {
      showError('Password baru minimal 8 karakter.');
      return;
    }
    const confirmPassword = window.prompt('Ketik ulang password baru untuk konfirmasi:', '');
    if (confirmPassword === null) return;
    if (password !== confirmPassword) {
      showError('Konfirmasi password tidak cocok.');
      return;
    }
    if (!window.confirm(`Reset password akun ${user.email}? Password lama akan langsung tidak berlaku.`)) return;

    const id = `reset-${user.id}`;
    setBusyId(id);
    try {
      await api(`/api/admin/users/${user.id}/reset-password`, {
        method: 'POST',
        body: JSON.stringify({ password }),
      });
      showNotice('Password akun berhasil direset.');
    } catch (err: any) {
      showError(err?.message || 'Gagal mereset password akun.');
    } finally {
      setBusyId(null);
    }
  };

  const deleteUser = async (user: ManagedUser) => {
    if (role !== 'admin') return;
    const confirmation = window.prompt(
      `PENGHAPUSAN PERMANEN akun ${user.email}.

Ketik YAKIN untuk melanjutkan:`,
      ''
    );
    if (confirmation !== 'YAKIN') {
      if (confirmation !== null) showError('Penghapusan dibatalkan. Kamu harus mengetik YAKIN persis.');
      return;
    }
    if (!window.confirm(`Hapus permanen akun ${user.email}? Data akun yang terkait akan ikut terhapus dan tindakan ini tidak dapat dibatalkan.`)) return;

    const id = `delete-${user.id}`;
    setBusyId(id);
    try {
      await api(`/api/admin/users/${user.id}/delete`, { method: 'POST' });
      showNotice('Akun berhasil dihapus permanen.');
      await loadUsers();
    } catch (err: any) {
      showError(err?.message || 'Gagal menghapus akun.');
    } finally {
      setBusyId(null);
    }
  };

  const toggleBlock = async (user: ManagedUser) => {
    const action = user.is_blocked ? 'unblock' : 'block';
    const label = user.is_blocked ? 'membuka blokir' : 'memblokir';
    if (!window.confirm(`Yakin mau ${label} akun ${user.email}?`)) return;

    setBusyId(user.id);
    try {
      await api(`/api/admin/users/${user.id}/${action}`, { method: 'POST' });
      showNotice(user.is_blocked ? 'Akun berhasil dibuka.' : 'Akun berhasil diblokir.');
      await loadUsers();
    } catch (err: any) {
      showError(err?.message || 'Gagal mengubah status akun.');
    } finally {
      setBusyId(null);
    }
  };

  const Header = () => (
    <header className="border-b-2 border-[#1D3557]/15 bg-white sticky top-0 z-30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-[#FFF176] border-2 border-[#1D3557] shadow-[0_4px_0_0_#1D3557] flex items-center justify-center font-heading font-black text-xl">T</div>
          <div>
            <div className="font-heading font-black text-xl">TERRA</div>
            <div className="text-[9px] font-bold opacity-55">DASHBOARD {roleLabel.toUpperCase()}</div>
          </div>
        </div>
        {onBackToLanding && (
          <button
            onClick={onBackToLanding}
            className="flex items-center gap-2 border-2 border-[#1D3557] rounded-xl px-3 py-2 font-bold text-sm bg-white hover:bg-[#BDE0FE]"
          >
            <ArrowLeft className="w-4 h-4" /> Beranda
          </button>
        )}
        <button onClick={onLogout} className="flex items-center gap-2 border-2 border-[#1D3557] rounded-xl px-3 py-2 font-bold text-sm bg-white hover:bg-[#FFF176]">
          <LogOut className="w-4 h-4" /> Keluar
        </button>
      </div>
    </header>
  );

  const Notice = () => (
    <>
      {error && (
        <div className="mb-5 rounded-2xl border-2 border-red-700 bg-red-50 p-4 text-sm font-semibold text-red-800 flex items-start gap-2">
          <XCircle className="w-5 h-5 shrink-0" />
          <span className="flex-1">{error}</span>
          <button type="button" onClick={() => setError('')} className="font-black text-lg leading-none px-1 hover:opacity-60" aria-label="Tutup peringatan">×</button>
        </div>
      )}
      {notice && (
        <div className="mb-5 rounded-2xl border-2 border-emerald-700 bg-emerald-50 p-4 text-sm font-semibold text-emerald-800 flex items-start gap-2">
          <CheckCircle2 className="w-5 h-5 shrink-0" />
          <span className="flex-1">{notice}</span>
          <button type="button" onClick={() => setNotice('')} className="font-black text-lg leading-none px-1 hover:opacity-60" aria-label="Tutup notifikasi">×</button>
        </div>
      )}
    </>
  );

  const ProfilePanel = () => (
    <section className="mb-6 bg-white border-2 border-[#1D3557] rounded-3xl p-5 shadow-[0_5px_0_0_#1D3557]">
      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        {avatarUrl ? (
          <img src={avatarUrl} alt="Foto profil" className="w-20 h-20 rounded-2xl object-cover border-2 border-[#1D3557]" />
        ) : (
          <div className="w-20 h-20 rounded-2xl bg-[#BDE0FE] border-2 border-[#1D3557] flex items-center justify-center">
            <UserRound className="w-9 h-9" />
          </div>
        )}
        <div className="flex-1">
          <div className="text-[10px] font-black uppercase opacity-60">Profil Pengguna</div>
          <div className="font-heading font-black text-xl">{fullName || 'Pengguna TERRA'}</div>
          <div className="text-sm opacity-60 break-all">{email}</div>
        </div>
        <label className="border-2 border-[#1D3557] rounded-xl px-4 py-2.5 bg-[#FFF176] font-bold text-sm cursor-pointer hover:bg-[#ffe94d] text-center">
          {uploadingAvatar ? 'Mengunggah...' : 'Ganti Foto Profil'}
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            disabled={uploadingAvatar}
            onChange={(e) => {
              const file = e.target.files?.[0];
              void handleAvatarUpload(file);
              e.currentTarget.value = '';
            }}
          />
        </label>
      </div>
    </section>
  );

  const StudentDashboard = () => {
    if (view === 'scanner') {
      return (
        <>
          <button onClick={() => setView('home')} className="mb-5 flex items-center gap-2 font-bold text-sm hover:underline">
            <ArrowLeft className="w-4 h-4" /> Kembali ke Dashboard
          </button>
          <div className="bg-white border-2 border-[#1D3557] rounded-3xl p-5 shadow-[0_6px_0_0_#1D3557]">
            <TerraVision onScanComplete={() => undefined} onOpenDiyIdea={() => undefined} />
          </div>
        </>
      );
    }

    return (
      <>
        <div className="bg-[#BDE0FE] border-2 border-[#1D3557] rounded-3xl p-6 shadow-[0_6px_0_0_#1D3557] mb-6">
          <div className="text-xs font-black uppercase opacity-60">Dashboard Siswa</div>
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
            <div>
              <h1 className="font-heading font-black text-4xl mt-1">Halo, {fullName || email}</h1>
              <p className="mt-2 font-semibold">Setor sampah, kumpulkan poin setelah diverifikasi petugas, lalu tukarkan dengan reward.</p>
            </div>
            <div className="bg-[#FFF176] border-2 border-[#1D3557] rounded-2xl px-5 py-4 shadow-[0_4px_0_0_#1D3557] min-w-[180px]">
              <div className="text-[10px] font-black uppercase opacity-60">Poin</div>
              <div className="font-heading font-black text-3xl">{loading ? '...' : xp.toLocaleString('id-ID')} Poin</div>
            </div>
          </div>
        </div>

        <Notice />

        <div className="grid md:grid-cols-3 gap-4">
          <button onClick={() => setView('bank')} className="text-left bg-[#C7F9CC] border-2 border-[#1D3557] rounded-2xl p-5 shadow-[0_5px_0_0_#1D3557] hover:-translate-y-1 transition">
            <Banknote className="w-8 h-8 mb-4" />
            <h2 className="font-heading font-black text-2xl">Bank Sampah</h2>
            <p className="text-sm opacity-65 mt-1">Laporkan setoran dan lihat riwayat verifikasi.</p>
          </button>

          <button onClick={() => setView('scanner')} className="text-left bg-[#FFF176] border-2 border-[#1D3557] rounded-2xl p-5 shadow-[0_5px_0_0_#1D3557] hover:-translate-y-1 transition">
            <ScanLine className="w-8 h-8 mb-4" />
            <h2 className="font-heading font-black text-2xl">Scanner Sampah</h2>
            <p className="text-sm opacity-65 mt-1">Kenali kategori dan cara menangani sampah.</p>
          </button>

          <button onClick={() => setView('reward')} className="text-left bg-[#FFD6A5] border-2 border-[#1D3557] rounded-2xl p-5 shadow-[0_5px_0_0_#1D3557] hover:-translate-y-1 transition">
            <Gift className="w-8 h-8 mb-4" />
            <h2 className="font-heading font-black text-2xl">Reward</h2>
            <p className="text-sm opacity-65 mt-1">Tukarkan poin setelah laporanmu dikonfirmasi petugas.</p>
          </button>
        </div>

        <button
          onClick={() => setIsTerriOpen(true)}
          className="mt-6 w-full text-left bg-white border-2 border-[#1D3557] rounded-2xl p-5 shadow-[0_5px_0_0_#1D3557] hover:-translate-y-1 transition flex items-center gap-4"
        >
          <div className="w-12 h-12 rounded-xl bg-[#FFF176] border-2 border-[#1D3557] flex items-center justify-center shrink-0">
            <MessageCircle className="w-6 h-6" />
          </div>
          <div>
            <h2 className="font-heading font-black text-2xl">Chatbot Terri</h2>
            <p className="text-sm opacity-65 mt-1">Tanya soal sampah, pemilahan, Bank Sampah, daur ulang, dan lingkungan.</p>
          </div>
        </button>

        <section className="mt-6 bg-white border-2 border-[#1D3557] rounded-3xl shadow-[0_6px_0_0_#1D3557] overflow-hidden">
          <div className="p-5 border-b-2 border-[#1D3557]/10 flex items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2"><Trophy className="w-6 h-6" /><h2 className="font-heading font-black text-2xl">Leaderboard</h2></div>
              <p className="text-sm opacity-60 mt-1">Peringkat siswa berdasarkan total poin dari setoran yang sudah diverifikasi.</p>
            </div>
            <button onClick={() => void loadLeaderboard()} disabled={loadingLeaderboard} className="border-2 border-[#1D3557] rounded-xl px-3 py-2 font-bold flex items-center gap-2 hover:bg-[#FFF176] disabled:opacity-50"><RefreshCw className={`w-4 h-4 ${loadingLeaderboard ? 'animate-spin' : ''}`} /> Refresh</button>
          </div>
          <div className="divide-y-2 divide-[#1D3557]/10">
            {leaderboard.map((entry) => (
              <div key={entry.id} className="p-4 flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-[#FFF176] border-2 border-[#1D3557] flex items-center justify-center font-heading font-black">#{entry.rank}</div>
                {entry.avatar_url ? <img src={entry.avatar_url} alt="" className="w-10 h-10 rounded-xl object-cover border-2 border-[#1D3557]" /> : <div className="w-10 h-10 rounded-xl bg-[#BDE0FE] border-2 border-[#1D3557] flex items-center justify-center"><UserRound className="w-5 h-5" /></div>}
                <div className="min-w-0 flex-1"><div className="font-bold truncate">{entry.full_name || 'Siswa'}</div><div className="text-xs opacity-60">Peringkat {entry.rank}</div></div>
                <div className="font-heading font-black">{entry.points.toLocaleString('id-ID')} poin</div>
              </div>
            ))}
            {!loadingLeaderboard && leaderboard.length === 0 && <div className="p-8 text-center opacity-60">Belum ada data leaderboard.</div>}
          </div>
        </section>

        <div className="grid md:grid-cols-2 gap-4 mt-6">
          <div className="bg-white border-2 border-[#1D3557] rounded-2xl p-5 shadow-[0_4px_0_0_#1D3557]">
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="text-xs font-black uppercase opacity-60">Setoran terverifikasi</div>
                <div className="font-heading font-black text-3xl">{verifiedDepositCount}</div>
              </div>
              <CheckCircle2 className="w-9 h-9" />
            </div>
          </div>
          <div className="bg-white border-2 border-[#1D3557] rounded-2xl p-5 shadow-[0_4px_0_0_#1D3557]">
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="text-xs font-black uppercase opacity-60">Email</div>
                <div className="font-bold mt-1 break-all">{email}</div>
              </div>
              <UserRound className="w-9 h-9" />
            </div>
          </div>
        </div>
      </>
    );
  };

  const StudentBank = () => (
    <>
      <button onClick={() => setView('home')} className="mb-5 flex items-center gap-2 font-bold text-sm hover:underline">
        <ArrowLeft className="w-4 h-4" /> Kembali ke Dashboard
      </button>
      <Notice />
      <div className="grid lg:grid-cols-[420px_1fr] gap-6">
        <section className="bg-white border-2 border-[#1D3557] rounded-3xl p-5 shadow-[0_6px_0_0_#1D3557]">
          <h2 className="font-heading font-black text-2xl">Lapor Setoran</h2>
          <p className="text-sm opacity-65 mt-1 mb-5">Isi data sesuai sampah yang benar-benar kamu setor. Petugas yang menentukan apakah laporan valid.</p>
          <form onSubmit={submitDeposit} className="space-y-4">
            <label className="block">
              <span className="text-xs font-black uppercase">Bank Sampah</span>
              <input value={depositForm.bankName} onChange={(e) => setDepositForm((current) => ({ ...current, bankName: e.target.value }))} className="mt-1 w-full border-2 border-[#1D3557]/25 rounded-xl px-3 py-3 outline-none focus:border-[#1D3557]" />
            </label>
            <label className="block">
              <span className="text-xs font-black uppercase">Kategori</span>
              <select value={depositForm.category} onChange={(e) => setDepositForm((current) => ({ ...current, category: e.target.value as WasteCategory }))} className="mt-1 w-full border-2 border-[#1D3557]/25 rounded-xl px-3 py-3 bg-white outline-none focus:border-[#1D3557]">
                {categoryOptions.map((category) => <option key={category}>{category}</option>)}
              </select>
            </label>
            <label className="block">
              <span className="text-xs font-black uppercase">Jenis / Material</span>
              <input value={depositForm.material} onChange={(e) => setDepositForm((current) => ({ ...current, material: e.target.value }))} placeholder="Contoh: Botol PET" className="mt-1 w-full border-2 border-[#1D3557]/25 rounded-xl px-3 py-3 outline-none focus:border-[#1D3557]" />
            </label>
            <div className="block">
              <span className="text-xs font-black uppercase">Bukti Foto Sampah</span>
              <div className="mt-1 rounded-2xl border-2 border-dashed border-[#1D3557]/30 bg-[#FAF9F5] p-3">
                {depositForm.photoBase64 ? (
                  <div className="space-y-3">
                    <img src={depositForm.photoBase64} alt="Preview sampah" className="w-full h-48 object-cover rounded-xl border-2 border-[#1D3557]" />
                    <div className="flex gap-2">
                      <label className="flex-1 cursor-pointer text-center border-2 border-[#1D3557] rounded-xl px-3 py-2 font-bold bg-white hover:bg-[#FFF176]">
                        Ganti Foto
                        <input type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={(e) => handleDepositPhoto(e.target.files?.[0])} />
                      </label>
                      <button type="button" onClick={() => setDepositForm((current) => ({ ...current, photoBase64: '' }))} className="border-2 border-[#1D3557] rounded-xl px-3 py-2 font-bold bg-[#FFD6A5]">Hapus</button>
                    </div>
                  </div>
                ) : (
                  <label className="cursor-pointer block text-center py-5">
                    <Camera className="w-8 h-8 mx-auto mb-2" />
                    <div className="font-black">Ambil / pilih foto sampah</div>
                    <div className="text-xs opacity-60 mt-1">Wajib • JPG, PNG, WebP • Maks. 5 MB</div>
                    <input type="file" accept="image/*" capture="environment" className="hidden" onChange={(e) => handleDepositPhoto(e.target.files?.[0])} />
                  </label>
                )}
              </div>
              {!depositForm.photoBase64 && <div className="mt-1.5 text-xs font-semibold text-red-600">Foto wajib dilampirkan sebagai bukti laporan.</div>}
            </div>
            <label className="block">
              <span className="text-xs font-black uppercase">Berat (kg)</span>
              <input type="number" min="0.01" max="1000" step="0.01" value={depositForm.weightKg} onChange={(e) => setDepositForm((current) => ({ ...current, weightKg: e.target.value }))} placeholder="0.5" className="mt-1 w-full border-2 border-[#1D3557]/25 rounded-xl px-3 py-3 outline-none focus:border-[#1D3557]" />
            </label>
            <label className="block">
              <span className="text-xs font-black uppercase">Catatan (opsional)</span>
              <textarea value={depositForm.notes} onChange={(e) => setDepositForm((current) => ({ ...current, notes: e.target.value }))} rows={3} placeholder="Keterangan tambahan" className="mt-1 w-full border-2 border-[#1D3557]/25 rounded-xl px-3 py-3 outline-none focus:border-[#1D3557] resize-none" />
            </label>
            <button disabled={busyId === 'new-deposit'} className="w-full bg-[#C7F9CC] border-2 border-[#1D3557] rounded-xl py-3 font-heading font-black disabled:opacity-50">
              {busyId === 'new-deposit' ? 'Mengirim...' : 'Kirim Laporan'}
            </button>
          </form>
        </section>

        <section className="bg-white border-2 border-[#1D3557] rounded-3xl shadow-[0_6px_0_0_#1D3557] overflow-hidden">
          <div className="p-5 border-b-2 border-[#1D3557]/10 flex items-center justify-between">
            <div><h2 className="font-heading font-black text-2xl">Riwayat Setoran</h2><p className="text-sm opacity-60">Poin hanya masuk setelah petugas mengonfirmasi.</p></div>
            <button onClick={loadStudentData} className="border-2 border-[#1D3557] rounded-xl p-2 hover:bg-[#FFF176]"><RefreshCw className="w-4 h-4" /></button>
          </div>
          <div className="divide-y-2 divide-[#1D3557]/10">
            {deposits.map((deposit) => (
              <div key={deposit.id} className="p-5">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                  <div>
                    <div className="font-black">{deposit.material}</div>
                    <div className="text-xs opacity-60 mt-1">{deposit.category} · {deposit.weight_kg} kg · {deposit.bank_name}</div>
                    <div className="text-xs opacity-50 mt-1">{formatDate(deposit.created_at)}</div>
                  </div>
                  <span className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-black ${statusClass(deposit.status)}`}>
                    {deposit.status === 'approved' ? <CheckCircle2 className="w-3.5 h-3.5" /> : deposit.status === 'rejected' ? <XCircle className="w-3.5 h-3.5" /> : <Clock3 className="w-3.5 h-3.5" />}
                    {deposit.status === 'approved' ? `+${deposit.points_awarded} poin` : deposit.status === 'rejected' ? 'Ditolak' : 'Menunggu'}
                  </span>
                </div>
                {deposit.staff_note && <div className="mt-3 text-xs bg-[#FAF9F5] rounded-xl p-3">Catatan petugas: {deposit.staff_note}</div>}
              </div>
            ))}
            {deposits.length === 0 && <div className="p-8 text-center opacity-60">Belum ada laporan setoran.</div>}
          </div>
        </section>
      </div>
    </>
  );

  const StudentRewards = () => (
    <>
      <button onClick={() => setView('home')} className="mb-5 flex items-center gap-2 font-bold text-sm hover:underline">
        <ArrowLeft className="w-4 h-4" /> Kembali ke Dashboard
      </button>
      <Notice />
      <div className="bg-[#FFF176] border-2 border-[#1D3557] rounded-3xl p-5 shadow-[0_6px_0_0_#1D3557] mb-6 flex items-center justify-between gap-4">
        <div><div className="text-xs font-black uppercase opacity-60">Saldo tersedia</div><div className="font-heading font-black text-4xl">{xp.toLocaleString('id-ID')} Poin</div></div>
        <Gift className="w-12 h-12" />
      </div>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {rewards.map((reward) => (
          <div key={reward.id} className="bg-white border-2 border-[#1D3557] rounded-2xl p-5 shadow-[0_5px_0_0_#1D3557] flex flex-col">
            <div className="w-12 h-12 rounded-xl bg-[#FFD6A5] border-2 border-[#1D3557] flex items-center justify-center mb-4"><Gift className="w-6 h-6" /></div>
            <h3 className="font-heading font-black text-xl">{reward.name}</h3>
            <p className="text-sm opacity-65 mt-1 flex-1">{reward.description}</p>
            <div className="mt-4 flex items-center justify-between gap-2">
              <span className="font-heading font-black">{reward.points_cost} poin</span>
              <button onClick={() => redeemReward(reward)} disabled={busyId === reward.id || reward.stock <= 0} className="border-2 border-[#1D3557] rounded-xl px-3 py-2 font-black bg-[#C7F9CC] disabled:opacity-50">
                {reward.stock <= 0 ? 'Habis' : busyId === reward.id ? 'Memproses...' : 'Tukarkan'}
              </button>
            </div>
            <div className="text-[11px] opacity-50 mt-2">Stok: {reward.stock}</div>
          </div>
        ))}
      </div>

      <section className="mt-8 bg-white border-2 border-[#1D3557] rounded-3xl shadow-[0_6px_0_0_#1D3557] overflow-hidden">
        <div className="p-5 border-b-2 border-[#1D3557]/10"><h2 className="font-heading font-black text-2xl">Riwayat Penukaran</h2></div>
        {redemptions.some((r) => r.status === 'approved') && (
          <div className="mx-5 mt-5 rounded-2xl border-2 border-emerald-700 bg-emerald-50 p-4 text-sm font-bold text-emerald-900">
            Penukaran kamu sudah disetujui. Silakan samperin petugas untuk mengambil reward. Setelah diterima, statusnya akan ditandai sudah diambil.
          </div>
        )}
        <div className="divide-y-2 divide-[#1D3557]/10">
          {redemptions.map((redemption) => (
            <div key={redemption.id} className="p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div><div className="font-black">{redemption.reward_name}</div><div className="text-xs opacity-50 mt-1">{formatDate(redemption.created_at)}</div></div>
              <div className="flex items-center gap-2"><span className="font-bold">{redemption.points_cost} poin</span><span className={`rounded-full px-3 py-1 text-xs font-black ${statusClass(redemption.status)}`}>{redemption.status === 'approved' ? 'Disetujui • Samperin Petugas' : redemption.status === 'picked_up' ? 'Sudah Diambil' : redemption.status === 'rejected' ? 'Ditolak' : 'Menunggu'}</span></div>
            </div>
          ))}
          {redemptions.length === 0 && <div className="p-8 text-center opacity-60">Belum ada penukaran reward.</div>}
        </div>
      </section>
    </>
  );

  const VerificationPanel = () => (
    <>
      <Notice />
      <div className="flex items-center justify-between mb-5">
        <div><h2 className="font-heading font-black text-3xl">Verifikasi</h2><p className="text-sm opacity-60">Periksa laporan siswa sebelum poin diberikan.</p></div>
        <button onClick={loadStaffData} className="border-2 border-[#1D3557] rounded-xl px-3 py-2 font-bold flex items-center gap-2 hover:bg-[#FFF176]"><RefreshCw className="w-4 h-4" /> Refresh</button>
      </div>

      <section className="bg-white border-2 border-[#1D3557] rounded-3xl shadow-[0_6px_0_0_#1D3557] overflow-hidden mb-6">
        <div className="p-5 border-b-2 border-[#1D3557]/10"><h3 className="font-heading font-black text-2xl">Setoran Menunggu</h3></div>
        <div className="divide-y-2 divide-[#1D3557]/10">
          {deposits.filter((d) => d.status === 'pending').map((deposit) => (
            <div key={deposit.id} className="p-5">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                <div className="grid md:grid-cols-[180px_1fr] gap-4 items-start">
                  {deposit.photo_url ? (
                    <a href={deposit.photo_url} target="_blank" rel="noreferrer" className="block">
                      <img src={deposit.photo_url} alt={`Bukti ${deposit.material}`} className="w-full h-36 object-cover rounded-xl border-2 border-[#1D3557]" />
                      <div className="text-[11px] font-bold mt-1 flex items-center gap-1"><ImageIcon className="w-3.5 h-3.5" /> Buka foto</div>
                    </a>
                  ) : (
                    <div className="h-36 rounded-xl border-2 border-red-300 bg-red-50 flex items-center justify-center text-xs font-bold text-red-700 text-center p-3">Foto tidak tersedia</div>
                  )}
                  <div>
                  <div className="font-black text-lg">{deposit.student_name}</div>
                  <div className="text-xs opacity-60">{deposit.student_email}</div>
                  <div className="mt-2 text-sm"><strong>{deposit.material}</strong> · {deposit.category} · {deposit.weight_kg} kg</div>
                  <div className="text-xs opacity-50 mt-1">{deposit.bank_name} · {formatDate(deposit.created_at)}</div>
                  {deposit.notes && <div className="text-xs bg-[#FAF9F5] rounded-xl p-3 mt-3">Catatan siswa: {deposit.notes}</div>}
                  </div>
                </div>
                <div className="flex gap-2 shrink-0">
                  <button disabled={busyId === deposit.id} onClick={() => verifyDeposit(deposit, false)} className="border-2 border-[#1D3557] rounded-xl px-3 py-2 font-black bg-[#FFD6A5] disabled:opacity-50">Tolak</button>
                  <button disabled={busyId === deposit.id} onClick={() => verifyDeposit(deposit, true)} className="border-2 border-[#1D3557] rounded-xl px-3 py-2 font-black bg-[#C7F9CC] disabled:opacity-50">{busyId === deposit.id ? 'Memproses...' : 'Konfirmasi'}</button>
                </div>
              </div>
            </div>
          ))}
          {deposits.filter((d) => d.status === 'pending').length === 0 && <div className="p-8 text-center opacity-60">Tidak ada setoran yang menunggu verifikasi.</div>}
        </div>
      </section>

      <section className="bg-white border-2 border-[#1D3557] rounded-3xl shadow-[0_6px_0_0_#1D3557] overflow-hidden">
        <div className="p-5 border-b-2 border-[#1D3557]/10"><h3 className="font-heading font-black text-2xl">Penukaran Reward Menunggu</h3></div>
        <div className="divide-y-2 divide-[#1D3557]/10">
          {redemptions.filter((r) => r.status === 'pending').map((redemption) => (
            <div key={redemption.id} className="p-5 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div><div className="font-black">{redemption.reward_name}</div><div className="text-sm mt-1">Biaya: <strong>{redemption.points_cost} poin</strong></div><div className="text-xs opacity-50 mt-1">{formatDate(redemption.created_at)}</div></div>
              <div className="flex gap-2"><button disabled={busyId === redemption.id} onClick={() => verifyRedemption(redemption, false)} className="border-2 border-[#1D3557] rounded-xl px-3 py-2 font-black bg-[#FFD6A5] disabled:opacity-50">Tolak</button><button disabled={busyId === redemption.id} onClick={() => verifyRedemption(redemption, true)} className="border-2 border-[#1D3557] rounded-xl px-3 py-2 font-black bg-[#C7F9CC] disabled:opacity-50">{busyId === redemption.id ? 'Memproses...' : 'Konfirmasi'}</button></div>
            </div>
          ))}
          {redemptions.filter((r) => r.status === 'pending').length === 0 && <div className="p-8 text-center opacity-60">Tidak ada penukaran yang menunggu verifikasi.</div>}
        </div>
      </section>

      <section className="bg-white border-2 border-[#1D3557] rounded-3xl shadow-[0_6px_0_0_#1D3557] overflow-hidden mt-6">
        <div className="p-5 border-b-2 border-[#1D3557]/10"><h3 className="font-heading font-black text-2xl">Reward Siap Diambil</h3><p className="text-sm opacity-60 mt-1">Siswa sudah disetujui. Tandai setelah reward benar-benar diserahkan.</p></div>
        <div className="divide-y-2 divide-[#1D3557]/10">
          {redemptions.filter((r) => r.status === 'approved').map((redemption) => (
            <div key={redemption.id} className="p-5 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div><div className="font-black">{redemption.student_name || 'Siswa'} — {redemption.reward_name}</div><div className="text-sm mt-1">Biaya: <strong>{redemption.points_cost} poin</strong></div><div className="text-xs opacity-50 mt-1">Disetujui {formatDate(redemption.verified_at || redemption.created_at)}</div></div>
              <button disabled={busyId === redemption.id} onClick={() => markRewardPickedUp(redemption.id)} className="border-2 border-[#1D3557] rounded-xl px-3 py-2 font-black bg-[#BDE0FE] disabled:opacity-50">{busyId === redemption.id ? 'Memproses...' : 'Tandai Sudah Diambil'}</button>
            </div>
          ))}
          {redemptions.filter((r) => r.status === 'approved').length === 0 && <div className="p-8 text-center opacity-60">Tidak ada reward yang sedang menunggu diambil.</div>}
        </div>
      </section>
    </>
  );

  const RewardManagement = () => (
    <section className="mt-8 bg-white border-2 border-[#1D3557] rounded-3xl shadow-[0_6px_0_0_#1D3557] overflow-hidden">
      <div className="p-5 border-b-2 border-[#1D3557]/10 flex items-center justify-between">
        <div><h2 className="font-heading font-black text-2xl">Pengaturan Reward</h2><p className="text-sm opacity-60">Admin bisa mengubah biaya poin, stok, dan status reward.</p></div>
        <button onClick={loadAdminRewards} disabled={loadingAdminRewards} className="border-2 border-[#1D3557] rounded-xl px-3 py-2 font-bold"><RefreshCw className={`w-4 h-4 ${loadingAdminRewards ? 'animate-spin' : ''}`} /></button>
      </div>
      <div className="p-5 space-y-3">
        {adminRewards.map((reward) => (
          <div key={reward.id} className="grid grid-cols-1 md:grid-cols-[1fr_130px_110px_110px_auto] gap-3 items-center border-2 border-[#1D3557]/10 rounded-2xl p-3">
            <div><div className="font-black">{reward.name}</div><div className="text-xs opacity-60">{reward.description}</div></div>
            <input type="number" min="1" value={reward.points_cost} onChange={(e) => setAdminRewards((p) => p.map((r) => r.id === reward.id ? { ...r, points_cost: Number(e.target.value) } : r))} className="border-2 border-[#1D3557]/20 rounded-xl px-3 py-2 font-bold" title="Biaya poin" />
            <input type="number" min="0" value={reward.stock} onChange={(e) => setAdminRewards((p) => p.map((r) => r.id === reward.id ? { ...r, stock: Number(e.target.value) } : r))} className="border-2 border-[#1D3557]/20 rounded-xl px-3 py-2 font-bold" title="Stok" />
            <label className="flex items-center gap-2 text-sm font-bold"><input type="checkbox" checked={reward.active} onChange={(e) => updateAdminReward(reward, { active: e.target.checked })} /> Aktif</label>
            <button disabled={busyId === `reward-admin-${reward.id}`} onClick={() => updateAdminReward(reward, { points_cost: reward.points_cost, stock: reward.stock })} className="border-2 border-[#1D3557] rounded-xl px-3 py-2 font-black bg-[#FFF176] disabled:opacity-50">{busyId === `reward-admin-${reward.id}` ? 'Menyimpan...' : 'Simpan'}</button>
          </div>
        ))}
        {!loadingAdminRewards && adminRewards.length === 0 && <div className="p-6 text-center opacity-60">Belum ada reward.</div>}
      </div>
    </section>
  );

  const UserManagement = () => (
    <section className="mt-8 bg-white border-2 border-[#1D3557] rounded-3xl shadow-[0_6px_0_0_#1D3557] overflow-hidden">
      <div className="p-5 border-b-2 border-[#1D3557]/10 flex items-center justify-between gap-3">
        <div><h2 className="font-heading font-black text-2xl">Manajemen Akun</h2><p className="text-sm opacity-60">Status blokir diterapkan ke profile dan Supabase Auth.</p></div>
        <button onClick={loadUsers} disabled={loadingUsers} className="border-2 border-[#1D3557] rounded-xl px-3 py-2 font-bold flex items-center gap-2 hover:bg-[#FFF176] disabled:opacity-50"><RefreshCw className={`w-4 h-4 ${loadingUsers ? 'animate-spin' : ''}`} /> Refresh</button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-[#FAF9F5]"><tr className="text-left"><th className="p-4">Akun</th><th className="p-4">Role</th><th className="p-4">Email</th><th className="p-4">Verifikasi</th><th className="p-4">Status</th><th className="p-4">Aksi</th></tr></thead>
          <tbody>
            {users.map((user) => {
              const canToggle = user.role === 'siswa' || (role === 'admin' && user.role === 'petugas');
              return <tr key={user.id} className="border-t-2 border-[#1D3557]/10">
                <td className="p-4 font-bold">{user.full_name || 'Tanpa nama'}</td>
                <td className="p-4 uppercase text-xs font-black">{user.role}</td>
                <td className="p-4">{user.email}</td>
                <td className="p-4">{user.email_confirmed ? <span className="text-emerald-700 font-bold">Terverifikasi</span> : <span className="text-amber-700 font-bold">Belum verifikasi</span>}</td>
                <td className="p-4">{user.is_blocked ? <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2 py-1 text-red-800 font-bold"><Ban className="w-3 h-3" /> Diblokir</span> : <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-1 text-emerald-800 font-bold"><CheckCircle2 className="w-3 h-3" /> Aktif</span>}</td>
                <td className="p-4">
                  <div className="flex flex-wrap gap-2">
                    {canToggle ? <button onClick={() => toggleBlock(user)} disabled={busyId === user.id} className={`rounded-xl border-2 border-[#1D3557] px-3 py-2 font-bold disabled:opacity-50 ${user.is_blocked ? 'bg-[#C7F9CC]' : 'bg-[#FFD6A5]'}`}>{busyId === user.id ? 'Memproses...' : user.is_blocked ? 'Buka blokir' : 'Blokir akun'}</button> : null}
                    {role === 'admin' && user.role !== 'admin' && user.id !== undefined ? <>
                      <button onClick={() => resetUserPassword(user)} disabled={busyId === `reset-${user.id}` || busyId === `delete-${user.id}`} className="rounded-xl border-2 border-[#1D3557] px-3 py-2 font-bold bg-[#BDE0FE] disabled:opacity-50 flex items-center gap-1"> <KeyRound className="w-4 h-4" /> {busyId === `reset-${user.id}` ? 'Mereset...' : 'Reset password'}</button>
                      <button onClick={() => deleteUser(user)} disabled={busyId === `delete-${user.id}` || busyId === `reset-${user.id}`} className="rounded-xl border-2 border-[#1D3557] px-3 py-2 font-bold bg-[#FFADAD] disabled:opacity-50 flex items-center gap-1"><Trash2 className="w-4 h-4" /> {busyId === `delete-${user.id}` ? 'Menghapus...' : 'Hapus akun'}</button>
                    </> : null}
                    {!canToggle && role !== 'admin' && <span className="text-xs opacity-50">Tidak tersedia</span>}
                  </div>
                </td>
              </tr>;
            })}
            {!loadingUsers && users.length === 0 && <tr><td colSpan={6} className="p-8 text-center opacity-60">Belum ada data akun.</td></tr>}
          </tbody>
        </table>
      </div>
    </section>
  );

  return (
    <div className="min-h-screen bg-[#FAF9F5] text-[#1D3557]">
      <Header />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <ProfilePanel />
        {role === 'siswa' && view !== 'home' && view !== 'scanner' && view !== 'bank' && view !== 'reward' ? null : null}

        {role === 'siswa' && view === 'home' && <StudentDashboard />}
        {role === 'siswa' && view === 'bank' && <StudentBank />}
        {role === 'siswa' && view === 'reward' && <StudentRewards />}
        {role === 'siswa' && view === 'scanner' && <StudentDashboard />}

        {canVerify && (
          <>
            {view === 'home' && (
              <>
                <div className="bg-[#BDE0FE] border-2 border-[#1D3557] rounded-3xl p-6 shadow-[0_6px_0_0_#1D3557] mb-6">
                  <div className="text-xs font-black uppercase opacity-60">Role aktif</div>
                  <h1 className="font-heading font-black text-4xl mt-1">Dashboard {roleLabel}</h1>
                  <p className="mt-2 font-semibold">Halo, {fullName || email}. Kelola verifikasi dan akses akun TERRA.</p>
                </div>
                <Notice />
                <div className="grid md:grid-cols-3 gap-4">
                  <button onClick={() => setView('verify')} className="text-left bg-[#C7F9CC] border-2 border-[#1D3557] rounded-2xl p-5 shadow-[0_5px_0_0_#1D3557] hover:-translate-y-1 transition"><PackageCheck className="w-8 h-8 mb-4" /><h2 className="font-heading font-black text-xl">Verifikasi</h2><p className="text-sm opacity-65 mt-1">Konfirmasi setoran dan penukaran reward siswa.</p></button>
                  <button onClick={() => setView('home')} className="text-left bg-[#FFD6A5] border-2 border-[#1D3557] rounded-2xl p-5 shadow-[0_5px_0_0_#1D3557]"><UsersRound className="w-8 h-8 mb-4" /><h2 className="font-heading font-black text-xl">Manajemen Akun</h2><p className="text-sm opacity-65 mt-1">Lihat panel manajemen akun di bawah.</p></button>
                  <div className="bg-white border-2 border-[#1D3557] rounded-2xl p-5 shadow-[0_5px_0_0_#1D3557]"><ShieldCheck className="w-8 h-8 mb-4" /><h2 className="font-heading font-black text-xl">Keamanan</h2><p className="text-sm opacity-65 mt-1">Akses dibatasi berdasarkan role dan status blokir.</p></div>
                </div>
                <UserManagement />
                {role === 'admin' && <RewardManagement />}
              </>
            )}
            {view === 'verify' && <><button onClick={() => setView('home')} className="mb-5 flex items-center gap-2 font-bold text-sm hover:underline"><ArrowLeft className="w-4 h-4" /> Kembali ke Dashboard</button><VerificationPanel /></>}
          </>
        )}
      </main>
      {role === 'siswa' && (
        <TerraAIModal
          isOpen={isTerriOpen}
          onClose={() => setIsTerriOpen(false)}
        />
      )}
    </div>
  );
};
