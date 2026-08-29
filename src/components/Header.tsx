import React from 'react';
import {
  LogIn,
  Home,
  BookOpen,
  Trash2,
  RefreshCw,
  MessageCircle,
  UserCircle,
  UserPlus,
} from 'lucide-react';
import { sfx } from '../utils/audio';

export type ActivePage = 'home' | 'edu' | 'sort' | 'cycle';

interface HeaderProps {
  activePage: ActivePage;
  onSelectPage: (page: ActivePage) => void;
  onOpenChat: () => void;
  isLoggedIn?: boolean;
  avatarUrl?: string | null;
  onOpenProfile?: () => void;
  onLogin: () => void;
  onRegister: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activePage,
  onSelectPage,
  onOpenChat,
  isLoggedIn = false,
  avatarUrl,
  onOpenProfile,
  onLogin,
  onRegister,
}) => {
  const navItems: {
    id: ActivePage;
    label: string;
    mobileLabel: string;
    icon: React.ReactNode;
    color: string;
    badge?: string;
  }[] = [
    {
      id: 'home',
      label: 'Beranda & AI Scan',
      mobileLabel: 'Beranda',
      icon: <Home className="w-4 h-4" strokeWidth={2.2} />,
      color: '#BDE0FE',
    },
    {
      id: 'edu',
      label: 'Edukasi & Modul',
      mobileLabel: 'Edukasi',
      icon: <BookOpen className="w-4 h-4" strokeWidth={2.2} />,
      color: '#FFF176',
      badge: '+Materi',
    },
    {
      id: 'sort',
      label: 'Pilah Sampah',
      mobileLabel: 'Pilah',
      icon: <Trash2 className="w-4 h-4" strokeWidth={2.2} />,
      color: '#C7F9CC',
    },
    {
      id: 'cycle',
      label: 'Ide Daur Ulang',
      mobileLabel: 'Daur Ulang',
      icon: <RefreshCw className="w-4 h-4" strokeWidth={2.2} />,
      color: '#FFD6A5',
    },
  ];

  return (
    <header className="sticky top-0 z-40 bg-[#FAF9F5]/95 backdrop-blur-sm border-b-2 border-[#1D3557]/15">
      {/* Desktop / Main Header */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="min-h-[76px] py-3 flex items-center justify-between gap-4">

          {/* Brand */}
          <button
            type="button"
            onClick={() => {
              sfx.playBrickClick();
              onSelectPage('home');
            }}
            className="flex items-center gap-2.5 shrink-0 cursor-pointer group text-left"
            aria-label="Kembali ke Beranda Terra"
          >
            {/* Terra Mark */}
            <div className="relative w-11 h-11 bg-[#FFF176] border-2 border-[#1D3557] rounded-xl flex items-center justify-center shadow-[0_4px_0_0_#1D3557] group-hover:-translate-y-0.5 transition-transform duration-150">
              <div className="absolute -top-1.5 left-2 w-2.5 h-1.5 bg-[#FFF176] border border-[#1D3557] rounded-t-sm" />
              <div className="absolute -top-1.5 right-2 w-2.5 h-1.5 bg-[#FFF176] border border-[#1D3557] rounded-t-sm" />

              <span className="font-heading font-black text-xl text-[#1D3557] tracking-tight">
                T
              </span>
            </div>

            {/* Brand Text */}
            <div className="block">
              <div className="flex items-center gap-2">
                <span className="font-heading font-black text-[20px] sm:text-[25px] leading-none tracking-wide text-[#1D3557]">
                  TERRA
                </span>

              </div>

              <p className="hidden sm:block text-[10px] font-semibold text-[#1D3557]/60 mt-1 tracking-wide">
                Kenali • Pilah • Olah • Jaga Bumi
              </p>
            </div>
          </button>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center bg-[#EEF2F4] border-2 border-[#1D3557] rounded-xl p-1 shadow-[0_3px_0_0_#1D3557]">
            {navItems.map((item) => {
              const isActive = activePage === item.id;

              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    sfx.playBrickClick();
                    onSelectPage(item.id);
                  }}
                  className={`
                    relative
                    min-h-[44px]
                    px-3
                    xl:px-3.5
                    rounded-lg
                    font-heading
                    font-bold
                    text-[11px]
                    xl:text-xs
                    flex
                    items-center
                    justify-center
                    gap-1.5
                    transition-all
                    duration-150
                    cursor-pointer
                    whitespace-nowrap
                    ${
                      isActive
                        ? 'border-2 border-[#1D3557] text-[#1D3557] shadow-[0_2px_0_0_#1D3557] -translate-y-0.5'
                        : 'border-2 border-transparent text-[#1D3557]/60 hover:text-[#1D3557] hover:bg-white/70'
                    }
                  `}
                  style={{
                    backgroundColor: isActive ? item.color : 'transparent',
                  }}
                >
                  {item.icon}

                  <span>{item.label}</span>

                  {item.badge && (
                    <span className="ml-0.5 text-[8px] bg-white/80 px-1.5 py-1 rounded border border-[#1D3557]/20 font-bold leading-none">
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Right Actions */}
          <div className="flex items-center gap-2 shrink-0">
            {!isLoggedIn ? (
              <>
                <button
                  type="button"
                  onClick={onLogin}
                  className="flex items-center gap-1.5 border-2 border-[#1D3557] bg-white rounded-xl px-2.5 sm:px-3 py-2 font-heading font-bold text-xs hover:bg-[#BDE0FE]"
                >
                  <LogIn className="w-4 h-4" />
                  <span className="hidden sm:inline">Login</span>
                </button>
                <button
                  type="button"
                  onClick={onRegister}
                  className="flex items-center gap-1.5 border-2 border-[#1D3557] bg-[#C7F9CC] rounded-xl px-2.5 sm:px-3 py-2 font-heading font-bold text-xs shadow-[0_3px_0_0_#1D3557] hover:-translate-y-0.5"
                >
                  <UserPlus className="w-4 h-4" />
                  <span className="hidden sm:inline">Daftar</span>
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={onOpenProfile}
                className="flex items-center gap-2 border-2 border-[#1D3557] bg-white rounded-xl px-2.5 py-2 font-heading font-bold text-xs shadow-[0_3px_0_0_#1D3557] hover:bg-[#BDE0FE]"
                title="Buka profil pengguna"
              >
                {avatarUrl ? (
                  <img src={avatarUrl} alt="Foto profil" className="w-7 h-7 rounded-lg object-cover border border-[#1D3557]" />
                ) : (
                  <UserCircle className="w-6 h-6" />
                )}
                <span className="hidden sm:inline">Profil</span>
              </button>
            )}

            {/* Terri AI */}
            <button
              type="button"
              onClick={() => {
                sfx.playScanChirp();
                onOpenChat();
              }}
              className="group brick-btn bg-[#FFF176] text-[#1D3557] px-2.5 sm:px-3.5 py-2 rounded-xl border-2 border-[#1D3557] font-heading font-bold text-xs sm:text-sm flex items-center gap-2 cursor-pointer shadow-[0_4px_0_0_#1D3557] hover:-translate-y-0.5 hover:shadow-[0_5px_0_0_#1D3557]"
              aria-label="Buka Tanya Terri AI"
            >
              <div className="w-7 h-7 bg-[#BDE0FE] border border-[#1D3557] rounded-lg flex items-center justify-center shrink-0">
                <MessageCircle
                  className="w-3.5 h-3.5 text-[#1D3557]"
                  strokeWidth={2.4}
                />
              </div>

              <span className="hidden sm:inline">
                Tanya Terri AI
              </span>

              <span
                className="relative flex h-2 w-2 shrink-0"
                aria-label="Online"
              >
                <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-40" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      <nav className="lg:hidden border-t border-[#1D3557]/10 bg-[#FAF9F5] px-2 py-2">
        <div className="max-w-xl mx-auto grid grid-cols-4 gap-1.5">
          {navItems.map((item) => {
            const isActive = activePage === item.id;

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  sfx.playBrickClick();
                  onSelectPage(item.id);
                }}
                className={`
                  min-h-[52px]
                  rounded-lg
                  px-1.5
                  py-1.5
                  font-heading
                  font-bold
                  text-[10px]
                  flex
                  flex-col
                  items-center
                  justify-center
                  gap-1
                  transition-all
                  duration-150
                  cursor-pointer
                  ${
                    isActive
                      ? 'border-2 border-[#1D3557] text-[#1D3557] shadow-[0_2px_0_0_#1D3557]'
                      : 'border-2 border-transparent text-[#1D3557]/55 hover:text-[#1D3557] hover:bg-white'
                  }
                `}
                style={{
                  backgroundColor: isActive ? item.color : 'transparent',
                }}
              >
                {item.icon}

                <span className="truncate max-w-full">
                  {item.mobileLabel}
                </span>
              </button>
            );
          })}
        </div>
      </nav>
    </header>
  );
};