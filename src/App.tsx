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

interface Profile {
  id: string;
  full_name: string;
  role: UserRole;
  email: string;
  is_blocked: boolean;
}

type AuthMode = 'login' | 'register' | 'forgot' | 'reset';

export default function App() {
  const [activePage, setActivePage] = useState<ActivePage>('home');
  const [authMode, setAuthMode] = useState<AuthMode | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [authReady, setAuthReady] = useState(!isSupabaseConfigured);

  const [ecoXp, setEcoXp] = useState<number>(() => {
    const saved = localStorage.getItem('terra_eco_xp');
    return saved ? parseInt(saved, 10) : 0;
  });

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

  const loadProfile = async (): Promise<boolean> => {
    if (!supabase) return false;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setProfile(null);
      return false;
    }

    const { data, error } = await supabase
      .from('profiles')
      .select('id, full_name, role, is_blocked')
      .eq('id', user.id)
      .maybeSingle();

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
        .select('id, full_name, role, is_blocked')
        .single();

      if (createError || !created) {
        console.error('Profile belum ada dan gagal dibuat:', createError || error);
        setProfile(null);
        return false;
      }

      setProfile({
        id: created.id,
        full_name: created.full_name || user.email || '',
        role: created.role as UserRole,
        email: user.email || '',
        is_blocked: Boolean(created.is_blocked),
      });
      return true;
    }

    if (error) {
      console.error('Gagal mengambil profile:', error);
      setProfile(null);
      return false;
    }

    if (data.is_blocked) {
      await supabase.auth.signOut();
      setProfile(null);
      setAuthMode('login');
      return false;
    }

    setProfile({
      id: data.id,
      full_name: data.full_name || user.email || '',
      role: data.role as UserRole,
      email: user.email || '',
      is_blocked: Boolean(data.is_blocked),
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

    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!mounted) return;
      if (session && urlMode !== 'reset-password') await loadProfile();
      setAuthReady(true);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((event) => {
      if (!mounted) return;
      if (event === 'SIGNED_OUT') {
        setProfile(null);
        return;
      }
      if (event === 'PASSWORD_RECOVERY') {
        setAuthMode('reset');
        return;
      }
      if (event === 'SIGNED_IN') {
        window.setTimeout(() => {
          if (mounted) loadProfile();
        }, 0);
      }
    });

    return () => {
      mounted = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    localStorage.setItem('terra_eco_xp', ecoXp.toString());
  }, [ecoXp]);

  useEffect(() => {
    localStorage.setItem('terra_completed_modules', JSON.stringify(completedModules));
  }, [completedModules]);

  const showXpToast = (gained: number, reason: string) => {
    setToastMessage({
      text: gained > 0 ? `+${gained} Earth-XP Didapat! 🎉` : 'Info Progres ℹ️',
      sub: reason,
    });
    setTimeout(() => setToastMessage(null), 4000);
  };

  const handleEarnXp = (amount: number, reason?: string) => {
    setEcoXp((prev) => prev + amount);
    if (reason) showXpToast(amount, reason);
  };

  const handleScanComplete = (_result: WasteScanResult) => {
    // Scanner hanya membantu identifikasi. XP diberikan dari setoran
    // Bank Sampah setelah dikonfirmasi petugas.
  };

  const handleCompleteEduModule = (moduleId: string, xpGained: number) => {
    if (!completedModules.includes(moduleId)) {
      setCompletedModules((prev) => [...prev, moduleId]);
      handleEarnXp(xpGained, 'Menyelesaikan Modul Belajar');
    }
  };

  const handleAddEduModule = (newMod: EduModule) => {
    const updated = [...eduModules, newMod];
    setEduModules(updated);
    localStorage.setItem('terra_custom_edu_modules', JSON.stringify(updated));
    showXpToast(20, `Materi Baru "${newMod.title}" Berhasil Ditambahkan! 📚`);
  };

  const handleDeleteEduModule = (moduleId: string) => {
    const updated = eduModules.filter((m) => m.id !== moduleId);
    setEduModules(updated);
    localStorage.setItem('terra_custom_edu_modules', JSON.stringify(updated));
    const updatedCompleted = completedModules.filter((id) => id !== moduleId);
    setCompletedModules(updatedCompleted);
    localStorage.setItem('terra_completed_modules', JSON.stringify(updatedCompleted));
    showXpToast(0, 'Materi berhasil dihapus');
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

  if (profile) {
    return <Dashboard role={profile.role} fullName={profile.full_name} email={profile.email} onLogout={handleLogout} />;
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
          const loaded = await loadProfile();
          if (loaded) setAuthMode(null);
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
        ecoXp={ecoXp}
        onOpenChat={() => handleOpenChatWithQuery()}
        onLogin={() => setAuthMode('login')}
        onRegister={() => setAuthMode('register')}
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
          </>
        )}

        {activePage === 'edu' && (
          <TerraEdu
            modules={eduModules}
            completedModules={completedModules}
            onCompleteModule={handleCompleteEduModule}
            onAddModule={handleAddEduModule}
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
          onAddXp={(xp) => handleEarnXp(xp, 'Interaksi Cerdas dengan Terri AI')}
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
