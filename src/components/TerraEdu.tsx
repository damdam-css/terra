import React, { useState } from 'react';
import { BookOpen, CheckCircle2, Clock, Award, Sparkles, ChevronRight, X, HelpCircle, Check, ArrowRight, RotateCcw, Plus, Trash2 } from 'lucide-react';
import confetti from 'canvas-confetti';
import { EduModule } from '../types';
import { sfx } from '../utils/audio';
import { AddEduModal } from './AddEduModal';

interface TerraEduProps {
  modules: EduModule[];
  completedModules: string[];
  onCompleteModule: (moduleId: string, xpGained: number) => void;
  onAddModule: (newMod: EduModule) => void;
  onDeleteModule?: (moduleId: string) => void;
  onResetProgress?: () => void;
}

export const TerraEdu: React.FC<TerraEduProps> = ({
  modules,
  completedModules,
  onCompleteModule,
  onAddModule,
  onDeleteModule,
  onResetProgress,
}) => {
  const [selectedModule, setSelectedModule] = useState<EduModule | null>(null);
  const [selectedQuizOption, setSelectedQuizOption] = useState<number | null>(null);
  const [quizSubmitted, setQuizSubmitted] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'content' | 'quiz'>('content');
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);

  const totalModules = modules.length;
  const completedCount = completedModules.length;
  const progressPercent = totalModules > 0 ? Math.round((completedCount / totalModules) * 100) : 0;

  const openModule = (mod: EduModule) => {
    sfx.playBrickClick();
    setSelectedModule(mod);
    setSelectedQuizOption(null);
    setQuizSubmitted(false);
    setActiveTab('content');
  };

  const closeModule = () => {
    sfx.playBrickClick();
    setSelectedModule(null);
  };

  const handleMarkContentCompleted = () => {
    if (!selectedModule) return;
    sfx.playSuccessFanfare();
    confetti({
      particleCount: 40,
      spread: 60,
      origin: { y: 0.6 },
      colors: ['#FFF176', '#BDE0FE', '#C7F9CC'],
    });
    onCompleteModule(selectedModule.id, selectedModule.xp);
  };

  const handleAnswerQuiz = (idx: number) => {
    if (quizSubmitted) return;
    sfx.playBrickClick();
    setSelectedQuizOption(idx);
  };

  const handleSubmitQuiz = () => {
    if (selectedQuizOption === null || !selectedModule) return;
    setQuizSubmitted(true);

    const isCorrect = selectedQuizOption === selectedModule.quiz.correctIndex;
    if (isCorrect) {
      sfx.playSuccessFanfare();
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.6 },
        colors: ['#FFF176', '#BDE0FE', '#C7F9CC'],
      });
      onCompleteModule(selectedModule.id, selectedModule.xp);
    } else {
      sfx.playErrorBump();
    }
  };

  return (
    <section id="terra-edu" className="py-12 bg-[#FAF9F5]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
          <div>
            <div className="inline-flex items-center gap-2 bg-[#FFF176] border-2 border-[#1D3557] px-3.5 py-1 rounded-full text-xs font-heading font-extrabold text-[#1D3557] shadow-[0_2px_0_0_#1D3557] mb-2.5">
              <BookOpen className="w-3.5 h-3.5 text-amber-700" />
              <span>TERRA EDU — MODUL PEMBELAJARAN INTERAKTIF</span>
            </div>
            <h2 className="font-heading font-black text-2xl sm:text-3xl md:text-4xl text-[#1D3557]">
              Jelajahi Balok Pengetahuan Bumi 📚🧱
            </h2>
            <p className="text-sm text-[#1D3557]/75 font-medium mt-1">
              Pelajari dampak krisis sampah, prinsip 3R, teknik pengomposan, hingga ekonomi sirkular.
            </p>
          </div>

          {/* Action Buttons & Progress Tracker */}
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => {
                sfx.playBrickClick();
                setIsAddModalOpen(true);
              }}
              className="brick-btn bg-[#BDE0FE] text-[#1D3557] border-2 border-[#1D3557] px-4 py-2.5 rounded-2xl font-heading font-bold text-xs sm:text-sm flex items-center gap-2 shadow-[0_4px_0_0_#1D3557] hover:bg-[#a2d2ff] active:translate-y-0.5 active:shadow-none transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>+ Tambah Materi Baru</span>
            </button>

            {/* Modular Brick Progress Bar Tracker */}
            <div className="bg-white border-2 border-[#1D3557] p-3 rounded-2xl shadow-[0_4px_0_0_#1D3557] min-w-[240px]">
              <div className="flex items-center justify-between text-xs font-bold text-[#1D3557] mb-1.5">
                <span>Progres Belajar:</span>
                <div className="flex items-center gap-2">
                  <span className="font-heading font-black text-sm">{progressPercent}%</span>
                  {progressPercent === 100 && onResetProgress && (
                    <button
                      onClick={onResetProgress}
                      className="text-[10px] text-rose-600 hover:underline flex items-center gap-0.5"
                      title="Reset progres untuk belajar ulang"
                    >
                      <RotateCcw className="w-2.5 h-2.5" /> Ulang
                    </button>
                  )}
                </div>
              </div>

              {/* Toy Brick Segmented Progress Bar */}
              <div className="w-full bg-[#FAF9F5] border border-[#1D3557]/30 rounded-xl p-1 shadow-inner">
                <div className="flex gap-1.5 h-3">
                  {modules.map((mod) => {
                    const isDone = completedModules.includes(mod.id);
                    return (
                      <div
                        key={mod.id}
                        className={`flex-1 rounded-sm border border-[#1D3557]/40 transition-all ${
                          isDone
                            ? 'bg-[#C7F9CC] shadow-xs'
                            : 'bg-[#1D3557]/10'
                        }`}
                        title={`${mod.title} (${isDone ? 'Selesai' : 'Belum Selesai'})`}
                      />
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Modules Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {modules.map((mod, index) => {
            const isDone = completedModules.includes(mod.id);

            return (
              <div
                key={mod.id}
                onClick={() => openModule(mod)}
                className="group relative cursor-pointer bg-white border-3 border-[#1D3557] rounded-3xl p-5 shadow-[0_6px_0_0_#1D3557] hover:shadow-[0_8px_0_0_#1D3557] hover:-translate-y-1 transition-all flex flex-col justify-between"
              >
                {/* Delete button for custom module */}
                {mod.isCustom && onDeleteModule && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (confirm(`Hapus materi "${mod.title}"?`)) {
                        onDeleteModule(mod.id);
                      }
                    }}
                    title="Hapus Materi Kustom Ini"
                    className="absolute top-3 right-3 p-1.5 rounded-xl bg-white/90 border border-rose-300 text-rose-600 hover:bg-rose-100 transition-all z-10"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}

                <div>
                  {/* Top Module Header */}
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span
                      className="px-2.5 py-0.5 rounded-md border border-[#1D3557] text-[10px] font-heading font-black"
                      style={{ backgroundColor: mod.color }}
                    >
                      BALOK {index + 1}: {mod.stage}
                    </span>
                    {isDone ? (
                      <span className="flex items-center gap-1 bg-[#C7F9CC] text-[#1D3557] border border-[#1D3557]/30 text-[10px] font-bold px-2 py-0.5 rounded-md">
                        <CheckCircle2 className="w-3 h-3 text-emerald-700" />
                        Selesai
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold text-[#1D3557]/60 bg-white/60 px-2 py-0.5 rounded-md border border-[#1D3557]/10">
                        +{mod.xp} XP
                      </span>
                    )}
                  </div>

                  {/* Title & Summary */}
                  <h3 className="font-heading font-black text-lg text-[#1D3557] leading-snug group-hover:text-amber-800 transition-colors mb-2">
                    {mod.title}
                  </h3>
                  <p className="text-xs text-[#1D3557]/75 line-clamp-3 leading-relaxed mb-4">
                    {mod.summary}
                  </p>
                </div>

                {/* Bottom Footer Info */}
                <div className="pt-3 border-t-2 border-[#1D3557]/10 flex items-center justify-between text-xs font-bold text-[#1D3557]">
                  <div className="flex items-center gap-3 text-[11px] text-[#1D3557]/70">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-blue-600" />
                      {mod.duration}
                    </span>
                    <span className="flex items-center gap-1">
                      <Award className="w-3.5 h-3.5 text-amber-600" />
                      +{mod.xp} XP
                    </span>
                  </div>

                  <div className="flex items-center gap-1 text-xs font-heading font-extrabold group-hover:translate-x-1 transition-transform">
                    <span>{isDone ? 'Buka Ulang' : 'Mulai Belajar'}</span>
                    <ChevronRight className="w-4 h-4" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Module Reader & Quiz Modal */}
      {selectedModule && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-fadeIn">
          <div className="relative w-full max-w-3xl bg-white border-3 border-[#1D3557] rounded-3xl shadow-[0_12px_0_0_#1D3557] flex flex-col max-h-[90vh] overflow-hidden">
            
            {/* Modal Header */}
            <div
              className="p-5 border-b-2 border-[#1D3557] flex items-center justify-between"
              style={{ backgroundColor: selectedModule.color }}
            >
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="bg-white/90 border border-[#1D3557] text-[#1D3557] font-black text-[10px] px-2 py-0.5 rounded-md">
                    TAHAP {selectedModule.stage}
                  </span>
                  <span className="text-xs font-bold text-[#1D3557]/75">
                    Kategori: {selectedModule.category}
                  </span>
                </div>
                <h3 className="font-heading font-black text-xl sm:text-2xl text-[#1D3557] leading-tight">
                  {selectedModule.title}
                </h3>
              </div>

              <button
                onClick={closeModule}
                className="p-2 rounded-xl bg-white border border-[#1D3557] hover:bg-slate-100 text-[#1D3557] shadow-xs cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Navigation Tabs (Materi vs Kuis) */}
            <div className="flex border-b-2 border-[#1D3557]/15 bg-[#FAF9F5]">
              <button
                onClick={() => {
                  sfx.playBrickClick();
                  setActiveTab('content');
                }}
                className={`flex-1 py-3 font-heading font-bold text-xs sm:text-sm flex items-center justify-center gap-2 border-r border-[#1D3557]/15 cursor-pointer ${
                  activeTab === 'content'
                    ? 'bg-white text-[#1D3557] border-b-2 border-b-[#1D3557]'
                    : 'text-[#1D3557]/60 hover:bg-white/60'
                }`}
              >
                <BookOpen className="w-4 h-4" />
                <span>Isi Materi Edukasi</span>
              </button>

              <button
                onClick={() => {
                  sfx.playBrickClick();
                  setActiveTab('quiz');
                }}
                className={`flex-1 py-3 font-heading font-bold text-xs sm:text-sm flex items-center justify-center gap-2 cursor-pointer ${
                  activeTab === 'quiz'
                    ? 'bg-white text-[#1D3557] border-b-2 border-b-[#1D3557]'
                    : 'text-[#1D3557]/60 hover:bg-white/60'
                }`}
              >
                <HelpCircle className="w-4 h-4" />
                <span>Kuis Pemahaman (+{selectedModule.xp} XP)</span>
              </button>
            </div>

            {/* Modal Body Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-white">
              {activeTab === 'content' ? (
                <div className="space-y-6">
                  {/* Summary Callout */}
                  <div className="p-4 rounded-2xl bg-[#FFF176]/30 border-2 border-[#1D3557] shadow-xs">
                    <h4 className="font-heading font-black text-xs uppercase tracking-wider text-amber-900 mb-1 flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-amber-700" />
                      Inti Pembelajaran
                    </h4>
                    <p className="text-xs sm:text-sm font-semibold text-[#1D3557] leading-relaxed">
                      {selectedModule.summary}
                    </p>
                  </div>

                  {/* Section Paragraphs */}
                  {selectedModule.sections.map((sec, sIdx) => (
                    <div key={sIdx} className="space-y-2">
                      <h4 className="font-heading font-bold text-base text-[#1D3557] flex items-center gap-2">
                        <span className="w-6 h-6 rounded-lg bg-[#BDE0FE] border border-[#1D3557] flex items-center justify-center text-xs font-black">
                          {sIdx + 1}
                        </span>
                        <span>{sec.title}</span>
                      </h4>
                      <p className="text-xs sm:text-sm text-[#1D3557]/80 leading-relaxed font-medium pl-8">
                        {sec.content}
                      </p>
                    </div>
                  ))}

                  {/* Complete & Next Action */}
                  <div className="pt-4 border-t-2 border-[#1D3557]/10 flex flex-col sm:flex-row items-center justify-between gap-3">
                    <div className="text-xs font-bold text-[#1D3557]/70">
                      Selesai membaca materi? Uji pemahamanmu di tab kuis!
                    </div>

                    <div className="flex items-center gap-2 w-full sm:w-auto">
                      <button
                        onClick={handleMarkContentCompleted}
                        className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl border-2 border-[#1D3557] bg-[#C7F9CC] text-[#1D3557] font-heading font-bold text-xs shadow-xs hover:bg-[#b0f5b7] cursor-pointer flex items-center justify-center gap-1.5"
                      >
                        <Check className="w-4 h-4" />
                        <span>Tandai Selesai Baca</span>
                      </button>

                      <button
                        onClick={() => {
                          sfx.playBrickClick();
                          setActiveTab('quiz');
                        }}
                        className="flex-1 sm:flex-none brick-btn bg-[#FFF176] text-[#1D3557] border-2 border-[#1D3557] px-4 py-2.5 rounded-xl font-heading font-bold text-xs shadow-[0_3px_0_0_#1D3557] cursor-pointer flex items-center justify-center gap-1.5"
                      >
                        <span>Lanjut ke Kuis</span>
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                /* Quiz Tab Content */
                <div className="space-y-6">
                  <div className="p-4 rounded-2xl bg-[#BDE0FE]/30 border-2 border-[#1D3557] shadow-xs">
                    <div className="text-xs font-bold text-[#1D3557]/70 uppercase tracking-wider mb-1">
                      Pertanyaan Kuis
                    </div>
                    <h4 className="font-heading font-bold text-base sm:text-lg text-[#1D3557]">
                      {selectedModule.quiz.question}
                    </h4>
                  </div>

                  {/* Options */}
                  <div className="space-y-3">
                    {selectedModule.quiz.options.map((opt, oIdx) => {
                      const isSelected = selectedQuizOption === oIdx;
                      const isCorrectAnswer = oIdx === selectedModule.quiz.correctIndex;

                      let btnStyle = 'bg-white border-[#1D3557] hover:bg-[#FAF9F5]';
                      if (isSelected) {
                        btnStyle = 'bg-[#FFF176] border-[#1D3557] shadow-[0_4px_0_0_#1D3557]';
                      }

                      if (quizSubmitted) {
                        if (isCorrectAnswer) {
                          btnStyle = 'bg-[#C7F9CC] border-emerald-800 font-bold';
                        } else if (isSelected && !isCorrectAnswer) {
                          btnStyle = 'bg-rose-100 border-rose-800 text-rose-900';
                        }
                      }

                      return (
                        <button
                          key={oIdx}
                          disabled={quizSubmitted}
                          onClick={() => handleAnswerQuiz(oIdx)}
                          className={`w-full p-4 rounded-2xl border-2 text-left font-medium text-xs sm:text-sm flex items-center justify-between gap-3 transition-all cursor-pointer ${btnStyle}`}
                        >
                          <div className="flex items-center gap-3">
                            <span className="w-6 h-6 rounded-lg bg-[#FAF9F5] border border-[#1D3557] flex items-center justify-center font-heading font-black text-xs">
                              {String.fromCharCode(65 + oIdx)}
                            </span>
                            <span>{opt}</span>
                          </div>

                          {quizSubmitted && isCorrectAnswer && (
                            <CheckCircle2 className="w-5 h-5 text-emerald-700 shrink-0" />
                          )}
                        </button>
                      );
                    })}
                  </div>

                  {/* Quiz Results / Explanation */}
                  {quizSubmitted && (
                    <div
                      className={`p-4 rounded-2xl border-2 shadow-xs ${
                        selectedQuizOption === selectedModule.quiz.correctIndex
                          ? 'bg-[#C7F9CC]/40 border-emerald-700 text-emerald-950'
                          : 'bg-rose-50 border-rose-600 text-rose-950'
                      }`}
                    >
                      <div className="font-heading font-black text-sm mb-1 flex items-center gap-2">
                        {selectedQuizOption === selectedModule.quiz.correctIndex ? (
                          <>
                            <Sparkles className="w-4 h-4 text-emerald-700" />
                            <span>Jawaban Benar! Kamu mendapatkan +{selectedModule.xp} XP 🎉</span>
                          </>
                        ) : (
                          <>
                            <span>Jawaban Kurang Tepat 💡</span>
                          </>
                        )}
                      </div>
                      <p className="text-xs leading-relaxed font-medium">
                        {selectedModule.quiz.explanation}
                      </p>
                    </div>
                  )}

                  {/* Quiz Submit Button */}
                  <div className="pt-4 border-t-2 border-[#1D3557]/10 flex justify-end">
                    {!quizSubmitted ? (
                      <button
                        onClick={handleSubmitQuiz}
                        disabled={selectedQuizOption === null}
                        className="brick-btn bg-[#C7F9CC] text-[#1D3557] border-2 border-[#1D3557] px-6 py-2.5 rounded-xl font-heading font-bold text-xs sm:text-sm shadow-[0_3px_0_0_#1D3557] disabled:opacity-40 cursor-pointer flex items-center gap-2"
                      >
                        <Check className="w-4 h-4" />
                        <span>Kirim Jawaban Kuis</span>
                      </button>
                    ) : (
                      <button
                        onClick={() => {
                          sfx.playBrickClick();
                          closeModule();
                        }}
                        className="brick-btn bg-[#FFF176] text-[#1D3557] border-2 border-[#1D3557] px-6 py-2.5 rounded-xl font-heading font-bold text-xs sm:text-sm shadow-[0_3px_0_0_#1D3557] cursor-pointer"
                      >
                        Tutup & Simpan Progres
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>

          </div>
        </div>
      )}

      {/* Add Module Modal */}
      {isAddModalOpen && (
        <AddEduModal
          onClose={() => setIsAddModalOpen(false)}
          onAddModule={onAddModule}
        />
      )}
    </section>
  );
};
