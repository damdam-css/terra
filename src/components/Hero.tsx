import React, { useState } from 'react';
import { Camera, Sparkles, ArrowRight, BookOpen, Layers, CheckCircle2, ShieldCheck, Heart } from 'lucide-react';
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
  const [mascotMood, setMascotMood] = useState<'happy' | 'wink' | 'love' | 'sparkle'>('happy');

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
    happy: { eyes: '●   ●', mouth: ' ‿ ', expression: 'Semangat Pilah Sampah!', tag: 'Terri Si Balok AI' },
    wink: { eyes: '◕   ~', mouth: ' ▽ ', expression: 'Yuk scan sampahmu sekarang!', tag: 'Klik aku lagi!' },
    love: { eyes: '♥   ♥', mouth: ' ‿ ', expression: 'Terima kasih sudah jaga bumi!', tag: 'Eco Guardian' },
    sparkle: { eyes: '★   ★', mouth: ' ᗜ ', expression: 'Setiap aksi kecilmu berharga!', tag: 'Pilah Bijak' },
  };

  const cycleMascotMood = () => {
    sfx.playBrickClick(1.2);
    const moods: ('happy' | 'wink' | 'love' | 'sparkle')[] = ['happy', 'wink', 'love', 'sparkle'];
    const nextIdx = (moods.indexOf(mascotMood) + 1) % moods.length;
    setMascotMood(moods[nextIdx]);
  };

  return (
    <section className="relative pt-6 pb-12 overflow-hidden">
      {/* Background Decorative Brick Elements */}
      <div className="absolute top-10 left-5 w-24 h-12 bg-[#BDE0FE]/30 border border-[#1D3557]/10 rounded-2xl -rotate-6 pointer-events-none -z-10" />
      <div className="absolute top-40 right-8 w-20 h-20 bg-[#FFF176]/30 border border-[#1D3557]/10 rounded-2xl rotate-12 pointer-events-none -z-10" />
      <div className="absolute bottom-10 left-1/3 w-32 h-10 bg-[#C7F9CC]/30 border border-[#1D3557]/10 rounded-2xl -rotate-3 pointer-events-none -z-10" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          
          {/* Left Column: Heading, Value Prop, and Action Buttons */}
          <div className="lg:col-span-7 space-y-6 text-left">
            
            {/* Top Micro Pill */}
            <div className="inline-flex items-center gap-2 bg-[#FFF176] border-2 border-[#1D3557] px-3.5 py-1.5 rounded-full shadow-[0_3px_0_0_#1D3557]">
              <span className="text-base">🌱</span>
              <span className="font-heading font-extrabold text-xs text-[#1D3557] uppercase tracking-wider">
                Gerakan Edukasi & Pengelolaan Sampah AI
              </span>
            </div>

            {/* Main Headline */}
            <h1 className="font-heading font-black text-3xl sm:text-4xl md:text-5xl text-[#1D3557] leading-tight tracking-tight">
              Kenali, Pilah, Olah, <br className="hidden sm:inline" />
              <span className="relative inline-block bg-[#BDE0FE] px-2 py-0.5 rounded-2xl border-2 border-[#1D3557] shadow-[0_4px_0_0_#1D3557] -rotate-1 mx-1 my-1">
                Jaga Bumi
              </span>{' '}
              dengan Ceria! 🧱
            </h1>

            {/* Subtext */}
            <p className="text-base sm:text-lg text-[#1D3557]/80 leading-relaxed font-medium max-w-2xl">
              TERRA mengubah cara siswa dan masyarakat memperlakukan sampah melalui konsep antarmuka <strong className="text-[#1D3557] font-bold">Modular Toy Brick</strong> yang interaktif, pemindai kamera AI instan, modul edukasi bertahap, dan kreasi daur ulang pintar.
            </p>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button
                onClick={() => {
                  sfx.playScanChirp();
                  handleScan();
                }}
                className="brick-btn bg-[#BDE0FE] text-[#1D3557] border-2 border-[#1D3557] px-6 py-3.5 rounded-2xl font-heading font-bold text-base flex items-center gap-2.5 cursor-pointer shadow-[0_6px_0_0_#1D3557]"
              >
                <Camera className="w-5 h-5" />
                <span>Mulai Pindai Sampah (AI Vision)</span>
              </button>

              <button
                onClick={() => {
                  sfx.playBrickClick();
                  handleEdu();
                }}
                className="brick-btn bg-[#FFF176] text-[#1D3557] border-2 border-[#1D3557] px-5 py-3.5 rounded-2xl font-heading font-bold text-base flex items-center gap-2 cursor-pointer shadow-[0_6px_0_0_#1D3557]"
              >
                <BookOpen className="w-5 h-5" />
                <span>Modul Edukasi</span>
              </button>

              {onOpenSort && (
                <button
                  onClick={() => {
                    sfx.playBrickClick();
                    onOpenSort();
                  }}
                  className="brick-btn bg-[#C7F9CC] text-[#1D3557] border-2 border-[#1D3557] px-4 py-3.5 rounded-2xl font-heading font-bold text-sm shadow-[0_4px_0_0_#1D3557] hover:bg-[#b0f5b7] active:translate-y-1 active:shadow-none transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>🗑️ Pilah Sampah</span>
                </button>
              )}

              {onOpenCycle && (
                <button
                  onClick={() => {
                    sfx.playBrickClick();
                    onOpenCycle();
                  }}
                  className="brick-btn bg-[#FFD6A5] text-[#1D3557] border-2 border-[#1D3557] px-4 py-3.5 rounded-2xl font-heading font-bold text-sm shadow-[0_4px_0_0_#1D3557] hover:bg-[#ffc585] active:translate-y-1 active:shadow-none transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>🔨 Ide Daur Ulang</span>
                </button>
              )}
            </div>
          </div>

          {/* Right Column: Toy Brick Interactive Mascot & 3D Brick Card Display */}
          <div className="lg:col-span-5 flex flex-col items-center">
            <div className="relative w-full max-w-md">
              {/* Main Mascot Card Container */}
              <div className="bg-white border-3 border-[#1D3557] rounded-3xl p-6 shadow-[0_10px_0_0_#1D3557] relative overflow-hidden">
                {/* Header ribbon */}
                <div className="flex items-center justify-between border-b-2 border-[#1D3557]/15 pb-4 mb-5">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-rose-400 border border-[#1D3557]" />
                    <span className="w-3 h-3 rounded-full bg-amber-400 border border-[#1D3557]" />
                    <span className="w-3 h-3 rounded-full bg-emerald-400 border border-[#1D3557]" />
                  </div>
                  <span className="bg-[#FEF9E7] border border-[#1D3557]/30 text-[#1D3557] font-heading font-bold text-xs px-2.5 py-1 rounded-xl">
                    Maskot Cerdas TERRA
                  </span>
                </div>

                {/* Interactive Mascot "Terri" Character Box */}
                <div 
                  onClick={cycleMascotMood}
                  className="bg-gradient-to-b from-[#BDE0FE] to-[#A8DADC] border-2 border-[#1D3557] rounded-3xl p-6 flex flex-col items-center text-center cursor-pointer group hover:scale-[1.02] transition-all shadow-[0_4px_0_0_#1D3557] relative"
                >
                  {/* Click me hint badge */}
                  <div className="absolute -top-3 right-4 bg-[#FFF176] border-2 border-[#1D3557] px-2 py-0.5 rounded-full text-[10px] font-heading font-bold shadow-xs">
                    Sentuh Wajahku! ✨
                  </div>

                  {/* 3D Modular Brick Head on Mascot */}
                  <div className="relative w-36 h-32 bg-[#FFF176] border-3 border-[#1D3557] rounded-3xl flex flex-col items-center justify-center shadow-[0_6px_0_0_#1D3557] mb-3 group-hover:rotate-1 transition-transform">
                    {/* Top Studs */}
                    <div className="absolute -top-2 left-6 w-5 h-2 bg-[#FFF176] border-2 border-[#1D3557] rounded-t-md" />
                    <div className="absolute -top-2 right-6 w-5 h-2 bg-[#FFF176] border-2 border-[#1D3557] rounded-t-md" />
                    
                    {/* Mascot Eyes and Mouth */}
                    <div className="font-mono text-2xl font-black text-[#1D3557] tracking-widest select-none">
                      {mascotFaces[mascotMood].eyes}
                    </div>
                    <div className="font-mono text-xl font-black text-[#1D3557] leading-none mt-1 select-none">
                      {mascotFaces[mascotMood].mouth}
                    </div>

                    {/* Cute Rosy Cheeks */}
                    <div className="flex justify-between w-24 mt-1">
                      <span className="w-3.5 h-1.5 bg-rose-400/60 rounded-full" />
                      <span className="w-3.5 h-1.5 bg-rose-400/60 rounded-full" />
                    </div>
                  </div>

                  {/* Dynamic Speech Bubble */}
                  <div className="bg-white border-2 border-[#1D3557] rounded-2xl px-4 py-2 text-xs font-heading font-bold text-[#1D3557] shadow-xs max-w-[240px]">
                    "{mascotFaces[mascotMood].expression}"
                  </div>

                  <div className="mt-2 text-[11px] font-semibold text-[#1D3557]/70">
                    Klik Terri untuk ganti ekspresi balok! 🧱
                  </div>
                </div>

                {/* Bottom Mascot Card Actions */}
                <div className="mt-4 pt-3 border-t-2 border-[#1D3557]/10 flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-[#1D3557]">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    <span>AI Guardian v2.5</span>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleChat();
                    }}
                    className="text-xs font-heading font-bold text-[#1D3557] underline hover:text-[#1D3557]/70 cursor-pointer"
                  >
                    Buka Obrolan →
                  </button>
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* 5 Modular Philosophy Brick Cards Row */}
        <div className="mt-14 pt-8 border-t-2 border-[#1D3557]/15">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 mb-6">
            <div>
              <h2 className="font-heading font-black text-xl text-[#1D3557] flex items-center gap-2">
                <span>🧱 5 Pilar Balok Filosofi TERRA</span>
                <span className="text-xs font-bold font-body bg-[#FFF176] border border-[#1D3557] px-2 py-0.5 rounded-md">
                  Modular Framework
                </span>
              </h2>
              <p className="text-xs text-[#1D3557]/70 font-medium mt-0.5">
                Klik kartu balok untuk langsung membuka modul materi edukasinya!
              </p>
            </div>
            <div className="text-xs font-bold text-[#1D3557]/80 bg-white border border-[#1D3557]/20 px-3 py-1 rounded-xl shadow-xs">
              Selesaikan untuk kumpulkan Earth-XP 🌟
            </div>
          </div>

          {/* Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {TERRA_PHILOSOPHY.map((stage, idx) => {
              const isDone = completedStages.includes(stage.key);

              return (
                <div
                  key={stage.key}
                  onClick={() => {
                    sfx.playBrickClick();
                    handleStage(stage.key);
                  }}
                  className="group relative cursor-pointer p-4 rounded-2xl border-2 border-[#1D3557] transition-all shadow-[0_4px_0_0_#1D3557] hover:shadow-[0_6px_0_0_#1D3557] hover:-translate-y-0.5"
                  style={{ backgroundColor: stage.color }}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="bg-white/90 border border-[#1D3557]/30 text-[#1D3557] font-black text-[10px] px-2 py-0.5 rounded-md shadow-xs">
                      {stage.badge}
                    </span>
                    {isDone ? (
                      <span className="bg-emerald-500 text-white p-0.5 rounded-full">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold text-[#1D3557]/60">
                        0{idx + 1}
                      </span>
                    )}
                  </div>

                  <div className="font-heading font-black text-lg text-[#1D3557] leading-none mb-1">
                    {stage.en}
                  </div>
                  <div className="text-xs font-bold text-[#1D3557]/85 mb-1.5">
                    {stage.title}
                  </div>
                  <p className="text-[11px] text-[#1D3557]/75 line-clamp-2 leading-relaxed">
                    {stage.description}
                  </p>

                  <div className="mt-3 pt-2 border-t border-[#1D3557]/15 flex items-center justify-between text-[11px] font-bold text-[#1D3557]">
                    <span>Buka Modul</span>
                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>
    </section>
  );
};
