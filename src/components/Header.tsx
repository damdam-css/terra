import React from 'react';
import { Trophy, Home, BookOpen, Trash2, RefreshCw } from 'lucide-react';
import { sfx } from '../utils/audio';

export type ActivePage = 'home' | 'edu' | 'sort' | 'cycle';

interface HeaderProps {
  activePage: ActivePage;
  onSelectPage: (page: ActivePage) => void;
  onOpenChat: () => void;
  ecoXp: number;
}

export const Header: React.FC<HeaderProps> = ({
  activePage,
  onSelectPage,
  onOpenChat,
  ecoXp,
}) => {
  const navItems: { id: ActivePage; label: string; icon: React.ReactNode; color: string; badge?: string }[] = [
    { id: 'home', label: 'Beranda & AI Scan', icon: <Home className="w-4 h-4" />, color: '#BDE0FE' },
    { id: 'edu', label: 'Edukasi & Modul', icon: <BookOpen className="w-4 h-4" />, color: '#FFF176', badge: '+Materi' },
    { id: 'sort', label: 'Pilah Sampah', icon: <Trash2 className="w-4 h-4" />, color: '#C7F9CC' },
    { id: 'cycle', label: 'Ide Daur Ulang', icon: <RefreshCw className="w-4 h-4" />, color: '#FFD6A5' },
  ];

  return (
    <header className="sticky top-0 z-40 bg-[#FAF9F5]/95 backdrop-blur-md border-b-2 border-[#1D3557]/15">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between gap-3">
        {/* Brand Logo */}
        <div 
          onClick={() => {
            sfx.playBrickClick();
            onSelectPage('home');
          }}
          className="flex items-center gap-3 cursor-pointer group select-none"
        >
          {/* Logo 3D Toy Brick Graphic */}
          <div className="relative w-11 h-11 bg-[#FFF176] border-2 border-[#1D3557] rounded-2xl flex items-center justify-center shadow-[0_4px_0_0_#1D3557] group-hover:scale-105 group-hover:-rotate-2 transition-transform">
            {/* Studs on top */}
            <div className="absolute -top-1.5 left-2 w-2.5 h-1.5 bg-[#FFF176] border border-[#1D3557] rounded-t-sm" />
            <div className="absolute -top-1.5 right-2 w-2.5 h-1.5 bg-[#FFF176] border border-[#1D3557] rounded-t-sm" />
            <span className="font-heading font-black text-xl text-[#1D3557] tracking-tight">T</span>
          </div>

          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-heading font-black text-2xl tracking-wider text-[#1D3557]">
                TERRA
              </span>
              <span className="bg-[#C7F9CC] border border-[#1D3557]/30 text-[#1D3557] font-extrabold text-[10px] px-1.5 py-0.5 rounded-md shadow-xs">
                AI Powered
              </span>
            </div>
            <p className="text-[11px] font-semibold text-[#1D3557]/70 hidden sm:block">
              Kenali • Pilah • Olah • Jaga Bumi
            </p>
          </div>
        </div>

        {/* Center Desktop Navigation Tabs */}
        <nav className="hidden md:flex items-center gap-2 bg-slate-100/90 p-1.5 rounded-2xl border-2 border-[#1D3557] shadow-[0_3px_0_0_#1D3557]">
          {navItems.map((item) => {
            const isActive = activePage === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  sfx.playBrickClick();
                  onSelectPage(item.id);
                }}
                className={`px-3.5 py-1.5 rounded-xl font-heading font-bold text-xs flex items-center gap-2 transition-all cursor-pointer ${
                  isActive
                    ? 'border-2 border-[#1D3557] text-[#1D3557] shadow-[0_2px_0_0_#1D3557] scale-105'
                    : 'text-[#1D3557]/70 hover:text-[#1D3557] hover:bg-white/80 border-2 border-transparent'
                }`}
                style={{
                  backgroundColor: isActive ? item.color : 'transparent',
                }}
              >
                {item.icon}
                <span>{item.label}</span>
                {item.badge && (
                  <span className="text-[9px] bg-white/80 px-1.5 py-0.5 rounded-md border border-[#1D3557]/20 font-bold">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Right Action Widgets (Eco-XP, AI Chat Trigger) */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Eco-XP Badge */}
          <div 
            className="flex items-center gap-1.5 bg-[#FEF9E7] border-2 border-[#1D3557] px-3 py-1.5 rounded-2xl shadow-[0_3px_0_0_#1D3557]"
            title="Eco-XP didapat dari menyelesaikan modul edukasi dan scan sampah!"
          >
            <Trophy className="w-4 h-4 text-amber-600 fill-amber-400" />
            <div className="flex flex-col">
              <span className="text-[9px] uppercase font-bold text-[#1D3557]/60 leading-none">Earth XP</span>
              <span className="font-heading font-black text-xs text-[#1D3557] leading-tight">
                {ecoXp} <span className="text-[10px] font-bold text-emerald-700">Pts</span>
              </span>
            </div>
          </div>

          {/* AI Chatbot Assistant "Terri" Trigger Button */}
          <button
            onClick={() => {
              sfx.playScanChirp();
              onOpenChat();
            }}
            className="brick-btn bg-[#FFF176] text-[#1D3557] px-3.5 py-1.5 rounded-2xl border-2 border-[#1D3557] font-heading font-bold text-xs sm:text-sm flex items-center gap-2 cursor-pointer group"
          >
            <div className="w-5 h-5 bg-[#BDE0FE] border border-[#1D3557] rounded-md flex items-center justify-center text-[10px] font-black group-hover:rotate-12 transition-transform">
              🤖
            </div>
            <span>Tanya Terri AI</span>
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
          </button>
        </div>
      </div>

      {/* Mobile Page Switcher Tabs */}
      <div className="md:hidden flex items-center justify-around px-2 py-2 bg-[#FAF9F5] border-t-2 border-[#1D3557]/20">
        {navItems.map((item) => {
          const isActive = activePage === item.id;
          return (
            <button
              key={item.id}
              onClick={() => {
                sfx.playBrickClick();
                onSelectPage(item.id);
              }}
              className={`flex-1 py-1.5 px-1 rounded-xl text-[11px] font-heading font-bold flex flex-col items-center gap-0.5 transition-all ${
                isActive
                  ? 'border-2 border-[#1D3557] text-[#1D3557] shadow-[0_2px_0_0_#1D3557]'
                  : 'text-[#1D3557]/70 hover:bg-white'
              }`}
              style={{
                backgroundColor: isActive ? item.color : 'transparent',
              }}
            >
              {item.icon}
              <span className="truncate max-w-[70px]">{item.label.split(' ')[0]}</span>
            </button>
          );
        })}
      </div>
    </header>
  );
};
