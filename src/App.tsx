import React, { useEffect, useState } from 'react';
import { Header, ActivePage } from './components/Header';
import { Hero } from './components/Hero';
import { TerraVision } from './components/TerraVision';
import { TerraEdu } from './components/TerraEdu';
import { TerraSort } from './components/TerraSort';
import { TerraCycle } from './components/TerraCycle';
import { TerraAIModal } from './components/TerraAIModal';
import { Footer } from './components/Footer';
import { AuthPage } from './components/AuthPage';
import { Dashboard } from './components/Dashboard';
import { EDU_MODULES as INITIAL_EDU_MODULES } from './data/mockData';
import { EduModule, UserRole, WasteScanResult } from './types';
import { sfx } from './utils/audio';
import { isSupabaseConfigured, supabase } from './lib/supabase';
import { Trophy } from 'lucide-react';

interface Profile {
  id: string;
  full_name: string;
  username: string | null;
  role: UserRole;
  email: string;
  is_blocked: boolean;
  avatar_url: string | null;
}

type AuthMode = 'login' | 'register' | 'forgot' | 'reset';

export default function App() {
  const [activePage, setActivePage] = useState<ActivePage>('home');
  const [authMode, setAuthMode] = useState<AuthMode | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [showDashboard, setShowDashboard] = useState(true);
  const [authReady, setAuthReady] = useState(!isSupabaseConfigured);

  const [eduModules, setEduModules] = useState<EduModule[]>(() => {
    const saved = localStorage.getItem('terra_custom_edu_modules');
    if (!saved) return INITIAL_EDU_MODULES;
    try {
      const parsed = JSON.parse(saved);
      return Array.isArray(parsed) && parsed.length > 0 ? parsed : INITIAL_EDU_MODULES;
    } catch {
      return INITIAL_EDU_MODULES;
    }
  });

  const [completedModules, setCompletedModules] = useState<string[]>(() => {
    const saved = localStorage.getItem('terra_completed_modules');
    if (!saved) return [];
    try {
      const parsed = JSON.parse(saved);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  });

  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatInitialQuery, setChatInitialQuery] = useState<string | undefined>(undefined);
  const [toastMessage, setToastMessage] = useState<{ text: string; sub: string } | null>(null);
  const [publicLeaderboard, setPublicLeaderboard] = useState<
    { id: string; full_name: string; avatar_url?: string | null; points: number; rank: number }[]
  >([]);
  const [leaderboardLoading, setLeaderboardLoading] = useState(true);
  const [leaderboardError, setLeaderboardError] = useState('');

  useEffect(() => {
    let cancelled = false;

    const loadPublicLeaderboard = async () => {
      setLeaderboardLoading(true);
      setLeaderboardError('');
      try {
        const response = await fetch('/api/leaderboard');
        const body = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(body.error || 'Gagal memuat leaderboard.');
        if (!cancelled) setPublicLeaderboard(body.leaderboard || []);
      } catch (error: any) {
        if (!cancelled) setLeaderboardError(error?.message || 'Gagal memuat leaderboard.');
      } finally {
        if (!cancelled) setLeaderboardLoading(false);
      }
    };

    void loadPublicLeaderboard();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    let cancelled = false;
    fetch('/api/education')
      .then(async (r) => { const body = await r.json().catch(() => ({})); if (!r.ok) throw new Error(body.error || 'Gagal memuat materi.'); return body; })
      .then((body) => { if (!cancelled && Array.isArray(body.modules) && body.modules.length) setEduModules((prev) => [...prev.filter((m) => !m.isCustom), ...body.modules]); })
      .catch((err) => console.warn('Materi custom belum dimuat:', err));
    return () => { cancelled = true; };
  }, []);


  const loadProfile = async (knownUser?: { id: string; email?: string; user_metadata?: Record<string, any> }): Promise<boolean> => {
    if (!supabase) return false;

    const user = knownUser || (await supabase.auth.getUser()).data.user;
    if (!user) {
      setProfile(null);
      setShowDashboard(false);
      return false;
    }

    const { data, error } = await supabase
      .from('profiles')
      .select('id, full_name, username, role, is_blocked')
      .eq('id', user.id)
      .maybeSingle();

    if (error) {
      console.error('Gagal mengambil profile:', error);
      setProfile(null);
      setShowDashboard(false);
      return false;
    }

    // Setelah database di-reset, user Auth lama masih ada tetapi profile-nya
    // bisa belum ada. Buat ulang sebagai siswa. Admin/petugas yang sudah punya
    // profile tidak masuk ke blok ini, jadi role mereka tetap aman.
    if (!data) {
      const { data: created, error: createError } = await supabase
        .from('profiles')
        .insert({
          id: user.id,
          full_name: user.user_metadata?.full_name || user.email || '',
          role: 'siswa',
          is_blocked: false,
        })
        .select('id, full_name, username, role, is_blocked')
        .single();

      if (createError || !created) {
        console.error('Profile belum ada dan gagal dibuat:', createError || error);
        setProfile(null);
        return false;
      }

      setShowDashboard(true);
      setProfile({
        id: created.id,
        full_name: created.full_name || user.email || '',
        username: created.username || null,
        role: created.role as UserRole,
        email: user.email || '',
        is_blocked: Boolean(created.is_blocked),
        avatar_url: null,
      });
      return true;
    }

    if (data.is_blocked) {
      await supabase.auth.signOut();
      setProfile(null);
      setAuthMode('login');
      return false;
    }

    setShowDashboard(true);
    let avatarUrl: string | null = null;
    const { data: avatarData, error: avatarError } = await supabase
      .from('profiles')
      .select('avatar_url')
      .eq('id', user.id)
      .maybeSingle();
    if (!avatarError) avatarUrl = avatarData?.avatar_url || null;

    setProfile({
      id: data.id,
      full_name: data.full_name || user.email || '',
      username: data.username || null,
      role: data.role as UserRole,
      email: user.email || '',
      is_blocked: Boolean(data.is_blocked),
      avatar_url: avatarUrl,
    });
    return true;
  };

  useEffect(() => {
    const urlMode = new URLSearchParams(window.location.search).get('mode');
    if (urlMode === 'reset-password') setAuthMode('reset');

    if (!supabase) {
      setAuthReady(true);
      return;
    }

    let mounted = true;

    // Jangan tahan seluruh aplikasi hanya karena query profile lambat.
    // Session dibaca dulu, UI siap segera, profile dimuat setelahnya.
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!mounted) return;
      setAuthReady(true);

      if (session && urlMode !== 'reset-password') {
        void loadProfile(session.user).catch((error) => {
          console.error('Gagal memuat profile:', error);
        });
      }
    }).catch((error) => {
      console.error('Gagal membaca session:', error);
      if (mounted) {
        setProfile(null);
        setAuthReady(true);
      }
    });

    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      if (!mounted) return;

      if (event === 'SIGNED_OUT') {
        setShowDashboard(false);
        setProfile(null);
        return;
      }

      if (event === 'PASSWORD_RECOVERY') {
        setAuthMode('reset');
        return;
      }

      // AuthPage menunggu loadProfile setelah login. Hindari request profile dobel di sini.
    });

    return () => {
      mounted = false;
      listener.subscription.unsubscribe();
    };
  }, []);


  useEffect(() => {
    localStorage.setItem('terra_completed_modules', JSON.stringify(completedModules));
  }, [completedModules]);

  const showXpToast = (gained: number, reason: string) => {
    setToastMessage({
      text: gained > 0 ? `+${gained} Poin Didapat!` : 'Info Progres ℹ️',
      sub: reason,
    });
    setTimeout(() => setToastMessage(null), 4000);
  };


  const handleScanComplete = (_result: WasteScanResult) => {
    // Scanner hanya membantu identifikasi. Poin diberikan dari setoran
    // Bank Sampah setelah dikonfirmasi petugas.
  };

  const handleCompleteEduModule = (moduleId: string, xpGained: number) => {
    if (!completedModules.includes(moduleId)) {
      setCompletedModules((prev) => [...prev, moduleId]);
      // Poin TERRA hanya berasal dari setoran Bank Sampah yang diverifikasi petugas.
      // Progres edukasi tidak menambah saldo XP.
    }
  };

  const handleAddEduModule = async (newMod: EduModule) => {
    if (profile?.role !== 'admin' || !supabase) return;
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const response = await fetch('/api/admin/education', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session?.access_token || ''}` },
        body: JSON.stringify({ module: newMod }),
      });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(body.error || 'Gagal menyimpan materi.');
      setEduModules((prev) => [...prev, body.module]);
      showXpToast(0, `Materi Baru "${newMod.title}" berhasil ditambahkan.`);
    } catch (err: any) {
      showXpToast(0, err?.message || 'Gagal menyimpan materi.');
    }
  };

  const handleDeleteEduModule = async (moduleId: string) => {
    if (profile?.role !== 'admin' || !supabase) return;
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const response = await fetch(`/api/admin/education/${moduleId}`, { method: 'DELETE', headers: { Authorization: `Bearer ${session?.access_token || ''}` } });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(body.error || 'Gagal menghapus materi.');
      setEduModules((prev) => prev.filter((m) => m.id !== moduleId));
      setCompletedModules((prev) => prev.filter((id) => id !== moduleId));
      showXpToast(0, 'Materi berhasil dihapus');
    } catch (err: any) {
      showXpToast(0, err?.message || 'Gagal menghapus materi.');
    }
  };

  const handleResetEduProgress = () => {
    setCompletedModules([]);
    localStorage.setItem('terra_completed_modules', JSON.stringify([]));
    showXpToast(0, 'Progres Edukasi di-reset menjadi 0');
  };

  const handleOpenDiyIdea = (itemName: string) => {
    setChatInitialQuery(`Berikan aku ide kreasi daur ulang (upcycle DIY) unik dan mudah untuk ${itemName}`);
    setIsChatOpen(true);
  };

  const handleOpenChatWithQuery = (query?: string) => {
    setChatInitialQuery(query);
    setIsChatOpen(true);
  };

  const handleLogout = async () => {
    // Pastikan seluruh komponen dashboard (termasuk kamera) di-unmount sebelum sesi dibuang.
    setShowDashboard(false);
    await supabase?.auth.signOut();
    setProfile(null);
    setAuthMode('login');
  };

  const stageMap: Record<string, string> = {
    'mod-1': 'KNOW',
    'mod-2': 'LEARN',
    'mod-3': 'SORT',
    'mod-4': 'ACT',
    'mod-5': 'PROTECT',
  };
  const completedStages = completedModules.map((id) => stageMap[id] || '').filter(Boolean);

  if (!authReady) {
    return <div className="min-h-screen flex items-center justify-center bg-[#FAF9F5] font-heading font-black text-[#1D3557]">Memuat sesi...</div>;
  }

  if (profile && showDashboard) {
    return (
      <Dashboard
        role={profile.role}
        fullName={profile.full_name}
        username={profile.username}
        email={profile.email}
        avatarUrl={profile.avatar_url}
        onUsernameUpdated={(username) => setProfile((current) => current ? { ...current, username } : current)}
        onNameUpdated={(fullName) => setProfile((current) => current ? { ...current, full_name: fullName } : current)}
        onAvatarUpdated={(avatarUrl) => setProfile((current) => current ? { ...current, avatar_url: avatarUrl } : current)}
        onLogout={handleLogout}
        onBackToLanding={() => {
          setActivePage('home');
          setShowDashboard(false);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
      />
    );
  }

  if (authMode) {
    return (
      <AuthPage
        initialMode={authMode}
        onBack={() => {
          setAuthMode(null);
          window.history.replaceState({}, '', window.location.pathname);
        }}
        onSuccess={async () => {
          setAuthMode(null);
          const loaded = await loadProfile();
          if (!loaded) setAuthMode('login');
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#FAF9F5] text-[#1D3557] font-body selection:bg-[#FFF176] selection:text-[#1D3557] flex flex-col">
      <Header
        activePage={activePage}
        onSelectPage={(page) => {
          setActivePage(page);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        isLoggedIn={Boolean(profile)}
        avatarUrl={profile?.avatar_url || null}
        onOpenProfile={() => { if (profile) setShowDashboard(true); }}
        onOpenChat={() => handleOpenChatWithQuery()}
        onLogin={() => {
          if (profile) setShowDashboard(true);
          else setAuthMode('login');
        }}
        onRegister={() => {
          if (profile) setShowDashboard(true);
          else setAuthMode('register');
        }}
      />

      <main className="flex-1">
        {activePage === 'home' && (
          <>
            <Hero
              completedStages={completedStages}
              onStartScan={() => document.getElementById('terra-vision')?.scrollIntoView({ behavior: 'smooth' })}
              onOpenEdu={() => { setActivePage('edu'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
              onOpenSort={() => { setActivePage('sort'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
              onOpenCycle={() => { setActivePage('cycle'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
              onStageClick={() => { setActivePage('edu'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
              onOpenChat={() => handleOpenChatWithQuery()}
            />
            <TerraVision onScanComplete={handleScanComplete} onOpenDiyIdea={handleOpenDiyIdea} />

            <section className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
              <div className="bg-white border-2 border-[#1D3557] rounded-3xl shadow-[0_6px_0_0_#1D3557] overflow-hidden">
                <div className="p-5 sm:p-6 border-b-2 border-[#1D3557]/10 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-xl bg-[#FFF176] border-2 border-[#1D3557] flex items-center justify-center">
                      <Trophy className="w-6 h-6" />
                    </div>
                    <div>
                      <h2 className="font-heading font-black text-2xl">Leaderboard TERRA</h2>
                      <p className="text-sm opacity-60">Peringkat poin siswa. Bisa dilihat siapa saja.</p>
                    </div>
                  </div>
                </div>

                {leaderboardError && (
                  <div className="m-5 rounded-2xl border-2 border-red-700 bg-red-50 p-4 text-sm font-semibold text-red-800">
                    {leaderboardError}
                  </div>
                )}

                {leaderboardLoading ? (
                  <div className="p-8 text-center font-bold opacity-60">Memuat leaderboard...</div>
                ) : publicLeaderboard.length === 0 ? (
                  <div className="p-8 text-center opacity-60">Belum ada data poin siswa.</div>
                ) : (
                  <div className="divide-y-2 divide-[#1D3557]/10">
                    {publicLeaderboard.slice(0, 10).map((entry) => (
                      <div key={entry.id} className="p-4 sm:px-6 flex items-center gap-4">
                        <div className="w-9 text-center font-heading font-black text-lg">#{entry.rank}</div>
                        <div className="w-10 h-10 rounded-full border-2 border-[#1D3557] bg-[#BDE0FE] overflow-hidden flex items-center justify-center font-black">
                          {entry.avatar_url ? (
                            <img src={entry.avatar_url} alt="" className="w-full h-full object-cover" />
                          ) : (
                            (entry.full_name || 'S').charAt(0).toUpperCase()
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="font-bold truncate">{entry.full_name || 'Siswa'}</div>
                          <div className="text-xs opacity-55">Siswa</div>
                        </div>
                        <div className="font-heading font-black">{entry.points.toLocaleString('id-ID')} poin</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </section>
          </>
        )}

        {activePage === 'edu' && (
          <TerraEdu
            modules={eduModules}
            completedModules={completedModules}
            onCompleteModule={handleCompleteEduModule}
            onAddModule={handleAddEduModule}
            currentRole={profile?.role ?? null}
            onDeleteModule={handleDeleteEduModule}
            onResetProgress={handleResetEduProgress}
          />
        )}

        {activePage === 'sort' && <TerraSort />}
        {activePage === 'cycle' && <TerraCycle />}
      </main>

      <Footer
        onSelectPage={(page) => {
          setActivePage(page);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        onOpenChat={() => handleOpenChatWithQuery()}
      />

      <div className="fixed bottom-6 right-6 z-40">
        <button
          onClick={() => { sfx.playBrickClick(); handleOpenChatWithQuery(); }}
          className="group brick-btn bg-[#FFF176] text-[#1D3557] border-3 border-[#1D3557] p-3.5 sm:px-5 sm:py-3.5 rounded-3xl font-heading font-black text-xs sm:text-sm flex items-center gap-2.5 shadow-[0_6px_0_0_#1D3557] hover:shadow-[0_8px_0_0_#1D3557] hover:-translate-y-1 transition-all cursor-pointer"
        >
          <div className="w-8 h-8 bg-[#1D3557] text-[#FFF176] rounded-xl flex flex-col items-center justify-center font-mono font-bold text-[10px] shrink-0 border border-[#FFF176]">
            <span>●  ●</span><span className="leading-none text-[9px]">‿</span>
          </div>
          <div className="hidden sm:flex flex-col text-left">
            <span className="text-[10px] uppercase font-bold text-[#1D3557]/60 leading-none">AI Assistant</span>
            <span className="leading-tight">Tanya Terri AI</span>
          </div>
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
          </span>
        </button>
      </div>

      {isChatOpen && (
        <TerraAIModal
          isOpen={isChatOpen}
          onClose={() => setIsChatOpen(false)}
          initialQuery={chatInitialQuery}
        />
      )}

      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 animate-bounce">
          <div className="bg-[#FFF176] border-2 border-[#1D3557] text-[#1D3557] px-4 py-3 rounded-2xl shadow-[0_6px_0_0_#1D3557] flex items-center gap-3">
            <div className="p-2 bg-[#1D3557] text-[#FFF176] rounded-xl text-lg font-black">✨</div>
            <div><div className="font-heading font-black text-sm">{toastMessage.text}</div><div className="text-xs font-semibold text-[#1D3557]/80">{toastMessage.sub}</div></div>
          </div>
        </div>
      )}
    </div>
  );
}
