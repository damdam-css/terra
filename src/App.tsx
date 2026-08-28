import React, { useState, useEffect } from 'react';
import { Header, ActivePage } from './components/Header';
import { Hero } from './components/Hero';
import { TerraVision } from './components/TerraVision';
import { TerraEdu } from './components/TerraEdu';
import { TerraSort } from './components/TerraSort';
import { TerraCycle } from './components/TerraCycle';
import { TerraAIModal } from './components/TerraAIModal';
import { Footer } from './components/Footer';
import { EDU_MODULES as INITIAL_EDU_MODULES } from './data/mockData';
import { EduModule, WasteScanResult } from './types';
import { sfx } from './utils/audio';

export default function App() {
  const [activePage, setActivePage] = useState<ActivePage>('home');
  
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

  const [isChatOpen, setIsChatOpen] = useState<boolean>(false);
  const [chatInitialQuery, setChatInitialQuery] = useState<string | undefined>(undefined);
  const [toastMessage, setToastMessage] = useState<{ text: string; sub: string } | null>(null);

  // Sync to local storage for persistent learner progress
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
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  const handleEarnXp = (amount: number, reason?: string) => {
    setEcoXp((prev) => prev + amount);
    if (reason) {
      showXpToast(amount, reason);
    }
  };

  const handleScanComplete = (result: WasteScanResult) => {
    handleEarnXp(25, `Memindai ${result.itemName}`);
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

  // Convert completed module ids to stage keys for Hero
  const stageMap: Record<string, string> = {
    'mod-1': 'KNOW',
    'mod-2': 'LEARN',
    'mod-3': 'SORT',
    'mod-4': 'ACT',
    'mod-5': 'PROTECT',
  };
  const completedStages = completedModules.map((id) => stageMap[id] || '').filter(Boolean);

  return (
    <div className="min-h-screen bg-[#FAF9F5] text-[#1D3557] font-body selection:bg-[#FFF176] selection:text-[#1D3557] flex flex-col">
      
      {/* 1. Header Navigation Bar */}
      <Header
        activePage={activePage}
        onSelectPage={(page) => {
          setActivePage(page);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        ecoXp={ecoXp}
        onOpenChat={() => handleOpenChatWithQuery()}
      />

      {/* Main Content Pages */}
      <main className="flex-1">
        {/* PAGE 1: BERANDA & AI SCAN */}
        {activePage === 'home' && (
          <>
            <Hero
              completedStages={completedStages}
              onStartScan={() => {
                const el = document.getElementById('terra-vision');
                el?.scrollIntoView({ behavior: 'smooth' });
              }}
              onOpenEdu={() => {
                setActivePage('edu');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              onOpenSort={() => {
                setActivePage('sort');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              onOpenCycle={() => {
                setActivePage('cycle');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              onStageClick={() => {
                setActivePage('edu');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              onOpenChat={() => handleOpenChatWithQuery()}
            />

            {/* TERRA Vision AI Waste Camera & Scanner */}
            <TerraVision
              onScanComplete={handleScanComplete}
              onOpenDiyIdea={handleOpenDiyIdea}
            />
          </>
        )}

        {/* PAGE 2: EDUKASI & MODUL BELAJAR (+ FITUR TAMBAH MATERI) */}
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

        {/* PAGE 3: PANDUAN PILAH SAMPAH (TERRA SORT) */}
        {activePage === 'sort' && (
          <TerraSort />
        )}

        {/* PAGE 4: KREASI & DAUR ULANG (TERRA CYCLE) */}
        {activePage === 'cycle' && (
          <TerraCycle />
        )}
      </main>

      {/* Footer */}
      <Footer 
        onSelectPage={(page) => {
          setActivePage(page);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        onOpenChat={() => handleOpenChatWithQuery()} 
      />

      {/* Floating Action Button: "Tanya Terri AI" Mascot */}
      <div className="fixed bottom-6 right-6 z-40">
        <button
          onClick={() => {
            sfx.playBrickClick();
            handleOpenChatWithQuery();
          }}
          className="group brick-btn bg-[#FFF176] text-[#1D3557] border-3 border-[#1D3557] p-3.5 sm:px-5 sm:py-3.5 rounded-3xl font-heading font-black text-xs sm:text-sm flex items-center gap-2.5 shadow-[0_6px_0_0_#1D3557] hover:shadow-[0_8px_0_0_#1D3557] hover:-translate-y-1 transition-all cursor-pointer"
        >
          <div className="w-8 h-8 bg-[#1D3557] text-[#FFF176] rounded-xl flex flex-col items-center justify-center font-mono font-bold text-[10px] shrink-0 border border-[#FFF176]">
            <span>●  ●</span>
            <span className="leading-none text-[9px]">‿</span>
          </div>

          <div className="hidden sm:flex flex-col text-left">
            <span className="text-[10px] uppercase font-bold text-[#1D3557]/60 leading-none">AI Assistant</span>
            <span className="leading-tight">Tanya Terri AI</span>
          </div>

          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
          </span>
        </button>
      </div>

      {/* Modal: AI Terri Chatbot */}
      {isChatOpen && (
        <TerraAIModal
          isOpen={isChatOpen}
          onClose={() => setIsChatOpen(false)}
          initialQuery={chatInitialQuery}
          onAddXp={(xp) => handleEarnXp(xp, 'Interaksi Cerdas dengan Terri AI')}
        />
      )}

      {/* Toast Notification for XP Earned & Actions */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 animate-bounce">
          <div className="bg-[#FFF176] border-2 border-[#1D3557] text-[#1D3557] px-4 py-3 rounded-2xl shadow-[0_6px_0_0_#1D3557] flex items-center gap-3">
            <div className="p-2 bg-[#1D3557] text-[#FFF176] rounded-xl text-lg font-black">
              ✨
            </div>
            <div>
              <div className="font-heading font-black text-sm">{toastMessage.text}</div>
              <div className="text-xs font-semibold text-[#1D3557]/80">{toastMessage.sub}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
