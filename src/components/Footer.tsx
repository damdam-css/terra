import React from 'react';
import {
  Heart,
  Sparkles,
  ArrowUp,
  Camera,
  BookOpen,
  Search,
  Hammer,
  Bot,
} from 'lucide-react';
import { ActivePage } from './Header';
import { sfx } from '../utils/audio';

interface FooterProps {
  onOpenChat: () => void;
  onSelectPage?: (page: ActivePage) => void;
}

export const Footer: React.FC<FooterProps> = ({
  onOpenChat,
  onSelectPage,
}) => {
  const scrollToTop = () => {
    sfx.playBrickClick();

    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  };

  const handleNav = (page: ActivePage) => {
    sfx.playBrickClick();

    if (onSelectPage) {
      onSelectPage(page);
    }
  };

  const featureItems = [
    {
      name: 'TERRA',
      label: 'Vision',
      description: 'Pemindai AI',
      page: 'home' as ActivePage,
      icon: Camera,
    },
    {
      name: 'TERRA',
      label: 'Edu',
      description: 'Modul Belajar',
      page: 'edu' as ActivePage,
      icon: BookOpen,
    },
    {
      name: 'TERRA',
      label: 'Sort',
      description: 'Direktori Wadah',
      page: 'sort' as ActivePage,
      icon: Search,
    },
    {
      name: 'TERRA',
      label: 'Cycle',
      description: 'Waste to Worth',
      page: 'cycle' as ActivePage,
      icon: Hammer,
    },
  ];

  return (
    <footer className="bg-[#1D3557] text-white border-t-4 border-[#FFF176]">

      {/* Main Footer */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 sm:py-16">

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 lg:gap-8">

          {/* Brand */}
          <div className="lg:col-span-2">

            <div className="flex items-center gap-3 mb-5">

              {/* TERRA Logo */}
              <div className="relative w-11 h-11 shrink-0 bg-[#FFF176] border-2 border-white rounded-xl flex items-center justify-center shadow-[0_4px_0_0_#0F223A]">

                <div className="absolute -top-1.5 left-2 w-2.5 h-1.5 bg-[#FFF176] border border-white rounded-t-sm" />

                <div className="absolute -top-1.5 right-2 w-2.5 h-1.5 bg-[#FFF176] border border-white rounded-t-sm" />

                <span className="font-heading font-black text-xl text-[#1D3557]">
                  T
                </span>
              </div>

              <div>
                <span className="block font-heading font-black text-2xl tracking-wide text-white leading-none">
                  TERRA
                </span>

                <span className="block text-[10px] font-semibold text-[#BDE0FE] mt-1">
                  Kenali, Pilah, Olah, Jaga Bumi
                </span>
              </div>

            </div>

            <p className="text-xs sm:text-sm text-slate-300 font-medium leading-relaxed max-w-md">
              Platform edukasi dan pengelolaan sampah berbasis Artificial
              Intelligence dengan konsep modular toy brick yang interaktif
              untuk generasi muda Indonesia.
            </p>

            {/* Technology Badge */}
            <div className="mt-5 inline-flex items-center gap-2 bg-white/8 border border-white/15 px-3 py-2 rounded-xl">

              <div className="w-6 h-6 rounded-lg bg-[#FFF176] text-[#1D3557] flex items-center justify-center">
                <Sparkles
                  className="w-3.5 h-3.5"
                  strokeWidth={2.4}
                />
              </div>

              <div>
                <span className="block text-[8px] uppercase tracking-wider font-bold text-slate-400 leading-none">
                  Technology
                </span>

                <span className="block text-[11px] font-heading font-bold text-white mt-0.5">
                  Google Gemini AI
                </span>
              </div>

            </div>
          </div>

          {/* 5 Pilar */}
          <div>

            <h4 className="font-heading font-bold text-sm uppercase tracking-wider text-[#FFF176] mb-4">
              5 Pilar TERRA
            </h4>

            <ul className="space-y-2.5 text-xs font-medium text-slate-300">

              <li className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#BDE0FE] shrink-0" />

                <span>
                  <span className="text-[10px] font-medium text-white/60 mr-0.5">
                    01.
                  </span>
                  KNOW — Kenali Krisis
                </span>
              </li>

              <li className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#FFF176] shrink-0" />

                <span>
                  <span className="text-[10px] font-medium text-white/60 mr-0.5">
                    02.
                  </span>
                  LEARN — Pahami 3R
                </span>
              </li>

              <li className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#C7F9CC] shrink-0" />

                <span>
                  <span className="text-[10px] font-medium text-white/60 mr-0.5">
                    03.
                  </span>
                  SORT — Pilah Wadah
                </span>
              </li>

              <li className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#BDE0FE] shrink-0" />

                <span>
                  <span className="text-[10px] font-medium text-white/60 mr-0.5">
                    04.
                  </span>
                  ACT — Upcycle & Kompos
                </span>
              </li>

              <li className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#FFE066] shrink-0" />

                <span>
                  <span className="text-[10px] font-medium text-white/60 mr-0.5">
                    05.
                  </span>
                  PROTECT — Jaga Bumi
                </span>
              </li>

            </ul>
          </div>

          {/* Fitur Interaktif */}
          <div>

            <h4 className="font-heading font-bold text-sm uppercase tracking-wider text-[#FFF176] mb-4">
              Fitur Interaktif
            </h4>

            <div className="space-y-1.5">

              {featureItems.map((item) => {
                const Icon = item.icon;

                return (
                  <button
                    key={item.page}
                    onClick={() => handleNav(item.page)}
                    className="w-full group flex items-center gap-2.5 p-2 rounded-xl text-left hover:bg-white/8 transition-colors cursor-pointer"
                  >

                    <div className="w-7 h-7 shrink-0 rounded-lg bg-white/8 border border-white/10 flex items-center justify-center group-hover:bg-[#FFF176] group-hover:text-[#1D3557] transition-colors">
                      <Icon
                        className="w-3.5 h-3.5"
                        strokeWidth={2.2}
                      />
                    </div>

                    <div className="min-w-0">

                      <span className="block text-xs text-white leading-tight">
                        <span className="font-heading font-black">
                          {item.name}
                        </span>{' '}

                        <span className="font-medium">
                          {item.label}
                        </span>
                      </span>

                      <span className="block text-[10px] text-slate-400 mt-0.5">
                        {item.description}
                      </span>

                    </div>

                  </button>
                );
              })}

            </div>
          </div>

          {/* Bantuan AI */}
          <div>

            <h4 className="font-heading font-bold text-sm uppercase tracking-wider text-[#FFF176] mb-4">
              Bantuan AI
            </h4>

            <p className="text-xs text-slate-300 leading-relaxed font-medium mb-4">
              Punya pertanyaan seputar pemilahan sampah di rumah atau sekolah?
            </p>

            <button
              onClick={() => {
                sfx.playBrickClick();
                onOpenChat();
              }}
              className="group w-full bg-[#FFF176] text-[#1D3557] border-2 border-white py-2.5 px-4 rounded-xl font-heading font-bold text-xs flex items-center justify-center gap-2 shadow-[0_4px_0_0_#0F223A] hover:-translate-y-0.5 hover:shadow-[0_5px_0_0_#0F223A] active:translate-y-1 active:shadow-[0_1px_0_0_#0F223A] transition-all cursor-pointer"
            >

              <span className="w-7 h-7 bg-[#BDE0FE] border border-[#1D3557] rounded-lg flex items-center justify-center group-hover:rotate-3 transition-transform">
                <Bot
                  className="w-4 h-4"
                  strokeWidth={2.3}
                />
              </span>

              <span>Buka Terri AI</span>

            </button>
          </div>

        </div>

        {/* Bottom Divider */}
        <div className="mt-12 pt-6 border-t border-white/12">

          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">

            {/* Copyright */}
            <div className="flex items-center gap-1.5 text-[11px] sm:text-xs font-medium text-slate-400 text-center sm:text-left">
              <span>
                © {new Date().getFullYear()} TERRA.
              </span>

              <span className="hidden sm:inline">
                Dibuat untuk lingkungan yang lebih baik.
              </span>
            </div>

            {/* Back To Top */}
            <button
              onClick={scrollToTop}
              className="group flex items-center gap-2 bg-white/8 hover:bg-white/15 text-white px-3.5 py-2 rounded-xl border border-white/15 text-xs font-heading font-bold transition-all cursor-pointer"
            >
              <span>Kembali ke Atas</span>

              <ArrowUp
                className="w-3.5 h-3.5 group-hover:-translate-y-0.5 transition-transform"
                strokeWidth={2.3}
              />
            </button>

          </div>

          {/* Bottom Statement */}
          <div className="mt-5 flex items-center justify-center gap-2 text-[10px] text-slate-500">

            <span className="h-px w-8 bg-white/10" />

            <Heart
              className="w-3 h-3 text-[#FFF176]"
              fill="currentColor"
              strokeWidth={1.8}
            />

            <span>Belajar. Memilah. Bertindak.</span>

            <span className="h-px w-8 bg-white/10" />

          </div>

        </div>

      </div>
    </footer>
  );
};