import React, { useState } from 'react';
import {
  Camera,
  ArrowRight,
  BookOpen,
  CheckCircle2,
  ShieldCheck,
  Leaf,
  Trash2,
  RefreshCw,
} from 'lucide-react';
import { TERRA_PHILOSOPHY } from '../data/mockData';
import { sfx } from '../utils/audio';

interface HeroProps {
  onScanClick?: () => void;
  onStartScan?: () => void;
  onChatClick?: () => void;
  onOpenChat?: () => void;
  onLearnMore?: () => void;
  onOpenEdu?: () => void;
  onOpenSort?: () => void;
  onOpenCycle?: () => void;
  onStageClick?: (stageKey: string) => void;
  completedStages?: string[];
}

export const Hero: React.FC<HeroProps> = ({
  onScanClick,
  onStartScan,
  onChatClick,
  onOpenChat,
  onLearnMore,
  onOpenEdu,
  onOpenSort,
  onOpenCycle,
  onStageClick,
  completedStages = [],
}) => {
  const [mascotMood, setMascotMood] = useState<
    'happy' | 'wink' | 'love' | 'sparkle'
  >('happy');

  const handleScan = () => {
    if (onStartScan) onStartScan();
    else if (onScanClick) onScanClick();
  };

  const handleChat = () => {
    if (onOpenChat) onOpenChat();
    else if (onChatClick) onChatClick();
  };

  const handleEdu = () => {
    if (onOpenEdu) onOpenEdu();
    else if (onLearnMore) onLearnMore();
    else if (onStageClick) onStageClick('KNOW');
  };

  const handleStage = (stageKey: string) => {
    if (onStageClick) {
      onStageClick(stageKey);
    } else {
      handleEdu();
    }
  };

  const mascotFaces = {
    happy: {
      eyes: '●   ●',
      mouth: ' ‿ ',
      expression: 'Semangat Pilah Sampah!',
      tag: 'Terri Si Balok AI',
    },
    wink: {
      eyes: '◕   ~',
      mouth: ' ▽ ',
      expression: 'Yuk scan sampahmu sekarang!',
      tag: 'Klik aku lagi!',
    },
    love: {
      eyes: '♥   ♥',
      mouth: ' ‿ ',
      expression: 'Terima kasih sudah jaga bumi!',
      tag: 'Eco Guardian',
    },
    sparkle: {
      eyes: '★   ★',
      mouth: ' ᗜ ',
      expression: 'Setiap aksi kecilmu berharga!',
      tag: 'Pilah Bijak',
    },
  };

  const cycleMascotMood = () => {
    sfx.playBrickClick(1.2);

    const moods: (
      | 'happy'
      | 'wink'
      | 'love'
      | 'sparkle'
    )[] = ['happy', 'wink', 'love', 'sparkle'];

    const nextIdx =
      (moods.indexOf(mascotMood) + 1) % moods.length;

    setMascotMood(moods[nextIdx]);
  };

  return (
    <section className="relative overflow-hidden pt-8 pb-14 sm:pt-10 sm:pb-16">
      {/* Subtle background decoration */}
      <div className="pointer-events-none absolute left-[-40px] top-24 h-32 w-32 rounded-full bg-[#BDE0FE]/25 blur-2xl" />
      <div className="pointer-events-none absolute right-[-50px] top-16 h-40 w-40 rounded-full bg-[#FFF176]/25 blur-2xl" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Main Hero */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">

          {/* Left Content */}
          <div className="lg:col-span-7">

            {/* Eyebrow */}
            <div className="inline-flex items-center gap-2 bg-[#FFF176] border-2 border-[#1D3557] px-3.5 py-2 rounded-xl shadow-[0_3px_0_0_#1D3557] mb-6">
              <Leaf
                className="w-4 h-4 text-[#1D3557]"
                strokeWidth={2.5}
              />

              <span className="font-heading font-extrabold text-[10px] sm:text-xs text-[#1D3557] uppercase tracking-[0.08em]">
                Gerakan Edukasi & Pengelolaan Sampah
              </span>
            </div>

            {/* Headline */}
            <h1 className="font-heading font-black text-[2.7rem] sm:text-5xl md:text-6xl lg:text-[4.2rem] text-[#1D3557] leading-[0.98] tracking-tight max-w-4xl">
              Kenali, Pilah,
              <br />
              Olah,{' '}
              <span className="relative inline-block mt-2 sm:mt-3">
                <span className="relative z-10 inline-block bg-[#BDE0FE] px-3 py-2 rounded-2xl border-2 border-[#1D3557] shadow-[0_5px_0_0_#1D3557] -rotate-1">
                  Jaga Bumi
                </span>
              </span>
              <br />
              <span className="text-[#1D3557]/90">
                dengan Ceria.
              </span>
            </h1>

            {/* Description */}
            <p className="mt-7 max-w-2xl text-base sm:text-lg text-[#1D3557]/72 leading-relaxed font-medium">
              TERRA membantu siswa dan masyarakat memahami sampah,
              memilih cara pemilahan yang tepat, dan menemukan ide
              pengolahan yang lebih baik melalui pengalaman belajar
              yang interaktif.
            </p>

            {/* Main Actions */}
            <div className="mt-8 flex flex-wrap items-center gap-3">

              {/* Primary */}
              <button
                type="button"
                onClick={() => {
                  sfx.playScanChirp();
                  handleScan();
                }}
                className="brick-btn bg-[#BDE0FE] text-[#1D3557] border-2 border-[#1D3557] px-5 sm:px-6 py-3.5 rounded-xl font-heading font-bold text-sm sm:text-base flex items-center gap-2.5 cursor-pointer shadow-[0_5px_0_0_#1D3557] hover:-translate-y-0.5"
              >
                <Camera
                  className="w-5 h-5"
                  strokeWidth={2.4}
                />

                <span>Mulai Pindai Sampah</span>

                <ArrowRight
                  className="w-4 h-4 ml-0.5"
                  strokeWidth={2.5}
                />
              </button>

              {/* Education */}
              <button
                type="button"
                onClick={() => {
                  sfx.playBrickClick();
                  handleEdu();
                }}
                className="brick-btn bg-[#FFF176] text-[#1D3557] border-2 border-[#1D3557] px-5 py-3.5 rounded-xl font-heading font-bold text-sm sm:text-base flex items-center gap-2 cursor-pointer shadow-[0_5px_0_0_#1D3557] hover:-translate-y-0.5"
              >
                <BookOpen
                  className="w-5 h-5"
                  strokeWidth={2.4}
                />

                <span>Mulai Belajar</span>
              </button>
            </div>

            {/* Secondary Links */}
            <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs sm:text-sm font-bold text-[#1D3557]/60">

              {onOpenSort && (
                <button
                  type="button"
                  onClick={() => {
                    sfx.playBrickClick();
                    onOpenSort();
                  }}
                  className="inline-flex items-center gap-1.5 hover:text-[#1D3557] transition-colors cursor-pointer"
                >
                  <Trash2
                    className="w-3.5 h-3.5"
                    strokeWidth={2.4}
                  />
                  Pilah Sampah
                </button>
              )}

              {onOpenCycle && (
                <button
                  type="button"
                  onClick={() => {
                    sfx.playBrickClick();
                    onOpenCycle();
                  }}
                  className="inline-flex items-center gap-1.5 hover:text-[#1D3557] transition-colors cursor-pointer"
                >
                  <RefreshCw
                    className="w-3.5 h-3.5"
                    strokeWidth={2.4}
                  />
                  Ide Daur Ulang
                </button>
              )}

              <span className="hidden sm:block w-1 h-1 rounded-full bg-[#1D3557]/30" />

              <span className="text-[#1D3557]/45">
                Belajar • Pilah • Bertindak
              </span>
            </div>
          </div>

          {/* Right Mascot */}
          <div className="lg:col-span-5 flex justify-center lg:justify-end">
            <div className="relative w-full max-w-[440px]">

              {/* Small decorative brick */}
              <div className="absolute -left-3 top-8 w-12 h-12 bg-[#FFD6A5] border-2 border-[#1D3557] rounded-xl shadow-[0_4px_0_0_#1D3557] -rotate-6 hidden sm:block" />

              <div className="absolute -right-3 bottom-12 w-14 h-14 bg-[#C7F9CC] border-2 border-[#1D3557] rounded-xl shadow-[0_4px_0_0_#1D3557] rotate-6 hidden sm:block" />

              {/* Main Card */}
              <div className="relative bg-white border-2 sm:border-3 border-[#1D3557] rounded-3xl p-4 sm:p-5 shadow-[0_8px_0_0_#1D3557]">

                {/* Card Header */}
                <div className="flex items-center justify-between border-b-2 border-[#1D3557]/10 pb-3.5 mb-4">

                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-400 border border-[#1D3557]" />
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-400 border border-[#1D3557]" />
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 border border-[#1D3557]" />
                  </div>

                  <span className="text-[9px] sm:text-[10px] font-heading font-bold uppercase tracking-wide text-[#1D3557]/55">
                    TERRA Assistant
                  </span>
                </div>

                {/* Mascot Area */}
                <button
                  type="button"
                  onClick={cycleMascotMood}
                  className="w-full bg-[#BDE0FE] border-2 border-[#1D3557] rounded-2xl p-5 sm:p-7 flex flex-col items-center text-center cursor-pointer group shadow-[0_4px_0_0_#1D3557] relative hover:-translate-y-0.5 transition-transform duration-150"
                  aria-label="Ganti ekspresi Terri"
                >

                  {/* Interaction label */}
                  <div className="absolute -top-3 right-4 bg-[#FFF176] border-2 border-[#1D3557] px-2.5 py-1 rounded-lg text-[9px] font-heading font-bold shadow-[0_2px_0_0_#1D3557]">
                    Klik untuk interaksi
                  </div>

                  {/* Mascot */}
                  <div className="relative w-32 h-28 sm:w-36 sm:h-32 bg-[#FFF176] border-3 border-[#1D3557] rounded-[28px] flex flex-col items-center justify-center shadow-[0_6px_0_0_#1D3557] group-hover:rotate-1 transition-transform">

                    {/* Studs */}
                    <div className="absolute -top-2 left-5 sm:left-6 w-5 h-2 bg-[#FFF176] border-2 border-[#1D3557] rounded-t-md" />
                    <div className="absolute -top-2 right-5 sm:right-6 w-5 h-2 bg-[#FFF176] border-2 border-[#1D3557] rounded-t-md" />

                    {/* Eyes */}
                    <div className="font-mono text-xl sm:text-2xl font-black text-[#1D3557] tracking-widest select-none">
                      {mascotFaces[mascotMood].eyes}
                    </div>

                    {/* Mouth */}
                    <div className="font-mono text-lg sm:text-xl font-black text-[#1D3557] leading-none mt-1 select-none">
                      {mascotFaces[mascotMood].mouth}
                    </div>

                    {/* Cheeks */}
                    <div className="flex justify-between w-20 sm:w-24 mt-1">
                      <span className="w-3 h-1.5 bg-rose-400/60 rounded-full" />
                      <span className="w-3 h-1.5 bg-rose-400/60 rounded-full" />
                    </div>
                  </div>

                  {/* Speech */}
                  <div className="mt-5 bg-white border-2 border-[#1D3557] rounded-xl px-4 py-2.5 text-xs font-heading font-bold text-[#1D3557] shadow-[0_2px_0_0_#1D3557] max-w-[260px]">
                    {mascotFaces[mascotMood].expression}
                  </div>

                  <span className="mt-3 text-[10px] font-semibold text-[#1D3557]/55">
                    {mascotFaces[mascotMood].tag}
                  </span>
                </button>

                {/* Card Footer */}
                <div className="mt-4 pt-3.5 border-t-2 border-[#1D3557]/10 flex items-center justify-between gap-3">

                  <div className="flex items-center gap-1.5 text-[10px] sm:text-xs font-bold text-[#1D3557]/65">
                    <ShieldCheck
                      className="w-4 h-4 text-emerald-600 shrink-0"
                      strokeWidth={2.3}
                    />
                    <span>Asisten TERRA</span>
                  </div>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleChat();
                    }}
                    className="text-xs font-heading font-bold text-[#1D3557] hover:text-[#1D3557]/65 transition-colors cursor-pointer"
                  >
                    Buka Obrolan
                    <ArrowRight
                      className="inline-block w-3.5 h-3.5 ml-1"
                      strokeWidth={2.5}
                    />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Philosophy Section */}
        <div className="mt-16 sm:mt-20 pt-8 border-t-2 border-[#1D3557]/12">

          {/* Section Heading */}
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 mb-6">

            <div>
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <span className="font-heading font-black text-xl sm:text-2xl text-[#1D3557]">
                  5 Pilar TERRA
                </span>

                <span className="text-[9px] sm:text-[10px] font-bold font-body bg-[#FFF176] border border-[#1D3557] px-2 py-1 rounded-md">
                  MODULAR FRAMEWORK
                </span>
              </div>

              <p className="text-xs sm:text-sm text-[#1D3557]/60 font-medium">
                Ikuti setiap tahap untuk memahami dan melakukan aksi
                nyata terhadap sampah.
              </p>
            </div>

            <div className="inline-flex self-start lg:self-auto items-center gap-2 text-[10px] sm:text-xs font-bold text-[#1D3557]/65 bg-white border border-[#1D3557]/20 px-3 py-2 rounded-lg">
              <span className="w-2 h-2 rounded-full bg-[#FFF176] border border-[#1D3557]/40" />
              Selesaikan modul untuk mendapatkan poin
            </div>
          </div>

          {/* Philosophy Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
            {TERRA_PHILOSOPHY.map((stage, idx) => {
              const isDone = completedStages.includes(stage.key);

              return (
                <button
                  type="button"
                  key={stage.key}
                  onClick={() => {
                    sfx.playBrickClick();
                    handleStage(stage.key);
                  }}
                  className="group relative text-left cursor-pointer p-4 rounded-xl border-2 border-[#1D3557] transition-all shadow-[0_4px_0_0_#1D3557] hover:-translate-y-1 hover:shadow-[0_6px_0_0_#1D3557] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1D3557] focus-visible:ring-offset-2"
                  style={{
                    backgroundColor: stage.color,
                  }}
                >
                  {/* Top */}
                  <div className="flex items-center justify-between mb-4">

                    <span className="bg-white/85 border border-[#1D3557]/25 text-[#1D3557] font-black text-[9px] px-2 py-1 rounded-md">
                      {stage.badge}
                    </span>

                    {isDone ? (
                      <span className="flex items-center justify-center bg-emerald-600 text-white w-5 h-5 rounded-full">
                        <CheckCircle2
                          className="w-3.5 h-3.5"
                          strokeWidth={2.8}
                        />
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold text-[#1D3557]/45">
                        0{idx + 1}
                      </span>
                    )}
                  </div>

                  {/* Stage */}
                  <div className="font-heading font-black text-xl text-[#1D3557] leading-none mb-1">
                    {stage.en}
                  </div>

                  <div className="text-xs font-bold text-[#1D3557]/80 mb-2">
                    {stage.title}
                  </div>

                  <p className="text-[11px] text-[#1D3557]/65 line-clamp-2 leading-relaxed min-h-[34px]">
                    {stage.description}
                  </p>

                  {/* Bottom */}
                  <div className="mt-4 pt-2.5 border-t border-[#1D3557]/15 flex items-center justify-between text-[10px] sm:text-[11px] font-bold text-[#1D3557]">
                    <span>
                      {isDone ? 'Modul selesai' : 'Buka modul'}
                    </span>

                    <ArrowRight
                      className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform"
                      strokeWidth={2.5}
                    />
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
};