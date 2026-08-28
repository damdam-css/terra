import React from 'react';
import { Heart, Sparkles, Shield, ArrowUp, Github, Mail, Globe } from 'lucide-react';
import { ActivePage } from './Header';
import { sfx } from '../utils/audio';

interface FooterProps {
  onOpenChat: () => void;
  onSelectPage?: (page: ActivePage) => void;
}

export const Footer: React.FC<FooterProps> = ({ onOpenChat, onSelectPage }) => {
  const scrollToTop = () => {
    sfx.playBrickClick();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleNav = (page: ActivePage) => {
    sfx.playBrickClick();
    if (onSelectPage) {
      onSelectPage(page);
    }
  };

  return (
    <footer className="bg-[#1D3557] text-white pt-16 pb-12 border-t-4 border-[#FFF176] relative">
      {/* Top Toy Brick Interlocking Studs on dark background */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Main Footer Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 mb-12">
          
          {/* Col 1 & 2: Brand & Philosophy */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 bg-[#FFF176] border-2 border-white rounded-2xl flex items-center justify-center text-xl shadow-[0_3px_0_0_#FFF176]">
                🌱
              </div>
              <div>
                <span className="font-heading font-black text-2xl tracking-wide text-white">
                  TERRA
                </span>
                <span className="block text-[11px] font-semibold text-[#BDE0FE]">
                  Kenali, Pilah, Olah, Jaga Bumi
                </span>
              </div>
            </div>

            <p className="text-xs sm:text-sm text-slate-300 font-medium leading-relaxed max-w-sm">
              Platform edukasi dan pengelolaan sampah berbasis Artificial Intelligence (AI) dengan konsep modular toy brick yang menyenangkan untuk generasi muda Indonesia.
            </p>

            <div className="flex items-center gap-2 pt-2">
              <span className="bg-white/10 border border-white/20 text-[#FFF176] px-3 py-1 rounded-full text-xs font-heading font-extrabold flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Powered by Google Gemini AI</span>
              </span>
            </div>
          </div>

          {/* Col 3: 5 Pilar Filosofi TERRA */}
          <div className="space-y-3">
            <h4 className="font-heading font-black text-sm uppercase tracking-wider text-[#FFF176]">
              5 Pilar TERRA
            </h4>
            <ul className="space-y-2 text-xs font-semibold text-slate-300">
              <li className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#BDE0FE]" /> 1. KNOW — Kenali Krisis
              </li>
              <li className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#FFF176]" /> 2. LEARN — Pahami 3R
              </li>
              <li className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#C7F9CC]" /> 3. SORT — Pilah Wadah
              </li>
              <li className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#BDE0FE]" /> 4. ACT — Upcycle & Kompos
              </li>
              <li className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#FFE066]" /> 5. PROTECT — Jaga Bumi
              </li>
            </ul>
          </div>

          {/* Col 4: Navigasi Fitur */}
          <div className="space-y-3">
            <h4 className="font-heading font-black text-sm uppercase tracking-wider text-[#FFF176]">
              Fitur Interaktif
            </h4>
            <ul className="space-y-2 text-xs font-medium text-slate-300">
              <li>
                <button onClick={() => handleNav('home')} className="hover:text-white transition-colors cursor-pointer text-left">
                  📸 TERRA Vision (Pemindai AI)
                </button>
              </li>
              <li>
                <button onClick={() => handleNav('edu')} className="hover:text-white transition-colors cursor-pointer text-left">
                  📚 TERRA Edu (Modul Belajar)
                </button>
              </li>
              <li>
                <button onClick={() => handleNav('sort')} className="hover:text-white transition-colors cursor-pointer text-left">
                  🔍 TERRA Sort (Direktori Wadah)
                </button>
              </li>
              <li>
                <button onClick={() => handleNav('cycle')} className="hover:text-white transition-colors cursor-pointer text-left">
                  🔨 TERRA Cycle (Waste to Worth)
                </button>
              </li>
            </ul>
          </div>

          {/* Col 5: Tanya Terri Launcher */}
          <div className="space-y-3">
            <h4 className="font-heading font-black text-sm uppercase tracking-wider text-[#FFF176]">
              Bantuan AI
            </h4>
            <p className="text-xs text-slate-300 leading-relaxed font-medium">
              Ada pertanyaan seputar pemilahan di rumah atau sekolah?
            </p>
            <button
              onClick={() => {
                sfx.playBrickClick();
                onOpenChat();
              }}
              className="brick-btn w-full bg-[#FFF176] text-[#1D3557] border-2 border-white py-2.5 px-4 rounded-2xl font-heading font-black text-xs flex items-center justify-center gap-2 shadow-[0_4px_0_0_#000] cursor-pointer"
            >
              <span>🤖 Buka Terri AI Chatbot</span>
            </button>
          </div>

        </div>

        {/* Bottom Copyright & Back to Top */}
        <div className="pt-8 border-t border-white/15 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-medium text-slate-400">
          <div className="flex items-center gap-1">
            <span>© {new Date().getFullYear()} TERRA. Dibuat dengan cinta untuk kelestarian Bumi Indonesia.</span>
          </div>

          <button
            onClick={scrollToTop}
            className="flex items-center gap-1.5 bg-white/10 hover:bg-white/20 text-white px-3.5 py-1.5 rounded-xl border border-white/20 text-xs font-heading font-bold transition-all cursor-pointer"
          >
            <span>Kembali ke Atas</span>
            <ArrowUp className="w-3.5 h-3.5" />
          </button>
        </div>

      </div>
    </footer>
  );
};
