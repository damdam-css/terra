import React, { useState } from 'react';
import {
  Sparkles,
  Hammer,
  Clock,
  ArrowRight,
  Lightbulb,
  CheckCircle2,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  Globe2,
  Recycle,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { UPCYCLE_PROJECTS } from '../data/mockData';
import { UpcycleProject } from '../types';
import { sfx } from '../utils/audio';

export const TerraCycle: React.FC = () => {
  const projects: UpcycleProject[] = UPCYCLE_PROJECTS;

  const [customMaterial, setCustomMaterial] =
    useState<string>('');

  const [isGenerating, setIsGenerating] =
    useState<boolean>(false);

  const [aiGeneratedIdea, setAiGeneratedIdea] =
    useState<any | null>(null);

  const [expandedProjectId, setExpandedProjectId] =
    useState<string | null>(null);

  const handleGenerateAiDiy = async (
    e: React.FormEvent
  ) => {
    e.preventDefault();

    if (!customMaterial.trim() || isGenerating) {
      return;
    }

    setIsGenerating(true);
    setAiGeneratedIdea(null);
    sfx.playScanChirp();

    try {
      const response = await fetch('/api/diy-idea', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          materialName: customMaterial,
        }),
      });

      const data = await response.json();

      if (data.success && data.idea) {
        setAiGeneratedIdea(data.idea);
        sfx.playSuccessFanfare();

        confetti({
          particleCount: 40,
          spread: 60,
          origin: { y: 0.7 },
          colors: [
            '#FFF176',
            '#BDE0FE',
            '#C7F9CC',
          ],
        });
      }
    } catch (err) {
      console.warn(
        'AI DIY generation error:',
        err
      );
    } finally {
      setIsGenerating(false);
    }
  };

  const toggleProjectSteps = (id: string) => {
    sfx.playBrickClick();

    setExpandedProjectId(
      expandedProjectId === id ? null : id
    );
  };

  return (
    <section
      id="terra-cycle"
      className="py-12 bg-[#FAF9F5]"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-10">

          <div className="inline-flex items-center gap-2 bg-[#FFE066] border-2 border-[#1D3557] px-3.5 py-1 rounded-full text-xs font-heading font-medium text-[#1D3557] shadow-[0_2px_0_0_#1D3557] mb-2.5">
            <Hammer className="w-3.5 h-3.5 text-amber-900" />
            <span>TERRA CYCLE — WASTE INTO WORTH</span>
          </div>

          <h2 className="font-heading font-black text-2xl sm:text-3xl md:text-4xl text-[#1D3557]">
            Ubah Sampah Jadi Karya Berharga!
          </h2>

          <p className="text-sm text-[#1D3557]/75 font-medium mt-1">
            Galeri ide kreasi daur ulang (upcycling)
            modular yang mudah dipraktikkan di rumah
            atau sekolah.
          </p>
        </div>

        {/* AI DIY Generator */}
        <div className="bg-gradient-to-r from-[#BDE0FE]/40 via-[#FFF176]/30 to-[#C7F9CC]/40 border-3 border-[#1D3557] p-6 rounded-3xl shadow-[0_8px_0_0_#1D3557] mb-10">

          <div className="max-w-2xl mx-auto text-center space-y-3">

            <div className="flex items-center justify-center gap-2 font-heading font-medium text-lg text-[#1D3557]">
              <Sparkles className="w-5 h-5 text-amber-600" />

              <span>
                AI Upcycle Generator
                <span className="text-[#1D3557]/65">
                  {' '}
                  (Rancang Proyek Sendiri)
                </span>
              </span>
            </div>

            <p className="text-xs text-[#1D3557]/75 font-medium">
              Punya barang bekas yang tidak ada di
              galeri? Tuliskan jenis sampahnya dan
              biarkan AI merancang tutorial DIY khusus
              untukmu.
            </p>

            <form
              onSubmit={handleGenerateAiDiy}
              className="flex flex-col sm:flex-row gap-2 pt-2"
            >
              <input
                type="text"
                value={customMaterial}
                onChange={(e) =>
                  setCustomMaterial(e.target.value)
                }
                placeholder="Contoh: Kardus sereal, tutup galon, celana jeans robek, kaleng kornet..."
                className="flex-1 px-4 py-3 bg-white border-2 border-[#1D3557] rounded-2xl text-xs sm:text-sm font-medium text-[#1D3557] focus:outline-none shadow-xs"
              />

              <button
                type="submit"
                disabled={
                  !customMaterial.trim() ||
                  isGenerating
                }
                className="brick-btn bg-[#FFF176] text-[#1D3557] border-2 border-[#1D3557] px-6 py-3 rounded-2xl font-heading font-medium text-xs sm:text-sm flex items-center justify-center gap-2 cursor-pointer shadow-[0_4px_0_0_#1D3557] disabled:opacity-40"
              >
                {isGenerating ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Merancang...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-amber-700" />
                    <span>Buat Ide DIY</span>
                  </>
                )}
              </button>
            </form>
          </div>

          {/* AI Generated Result */}
          {aiGeneratedIdea && (
            <div className="mt-6 bg-white border-2 border-[#1D3557] p-5 rounded-2xl shadow-[0_4px_0_0_#1D3557] animate-fadeIn">

              <div className="flex items-start justify-between flex-wrap gap-2 border-b border-[#1D3557]/15 pb-3 mb-3">

                <div>
                  <span className="bg-[#C7F9CC] border border-[#1D3557]/30 text-[#1D3557] font-medium text-[10px] px-2 py-0.5 rounded-md">
                    Proyek Hasil Kreasi AI
                  </span>

                  <h3 className="font-heading font-black text-xl text-[#1D3557] mt-1">
                    {aiGeneratedIdea.title}
                  </h3>
                </div>

                <span className="bg-[#FFF176] border border-[#1D3557]/30 text-[#1D3557] font-medium text-xs px-3 py-1 rounded-xl">
                  <Clock className="w-3 h-3 inline mr-1" />
                  {aiGeneratedIdea.difficulty}
                </span>
              </div>

              {/* Materials */}
              <div className="mb-4">

                <div className="font-heading font-medium text-xs text-[#1D3557] mb-1.5 flex items-center gap-1.5">
                  <Hammer className="w-3.5 h-3.5 text-amber-700" />
                  <span>Alat & Bahan:</span>
                </div>

                <div className="flex flex-wrap gap-1.5">
                  {aiGeneratedIdea.materials?.map(
                    (m: string, idx: number) => (
                      <span
                        key={idx}
                        className="bg-[#FAF9F5] border border-[#1D3557]/20 px-2.5 py-1 rounded-lg text-xs font-medium text-[#1D3557]"
                      >
                        {m}
                      </span>
                    )
                  )}
                </div>
              </div>

              {/* Steps */}
              <div className="space-y-2 mb-4">

                <div className="font-heading font-medium text-xs text-[#1D3557] flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Langkah Pembuatan:</span>
                </div>

                {aiGeneratedIdea.steps?.map(
                  (
                    step: string,
                    sIdx: number
                  ) => (
                    <div
                      key={sIdx}
                      className="flex items-start gap-2 text-xs text-[#1D3557]/85 font-medium bg-[#FAF9F5] p-2 rounded-xl"
                    >
                      <span className="w-5 h-5 bg-[#BDE0FE] rounded-md font-medium text-[10px] flex items-center justify-center shrink-0 border border-[#1D3557]/20">
                        {sIdx + 1}
                      </span>

                      <span className="leading-relaxed">
                        {step}
                      </span>
                    </div>
                  )
                )}
              </div>

              {/* Impact */}
              <div className="bg-[#FEF9E7] p-3 rounded-xl border border-[#1D3557]/20 text-xs font-medium text-[#1D3557] flex items-start gap-2">
                <Globe2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-700" />

                <span>
                  <span className="font-medium">
                    Manfaat Lingkungan:
                  </span>{' '}
                  {aiGeneratedIdea.impact}
                </span>
              </div>

            </div>
          )}
        </div>

        {/* Featured Projects */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

          {projects.map((proj) => {
            const isExpanded =
              expandedProjectId === proj.id;

            return (
              <div
                key={proj.id}
                className="bg-white border-3 border-[#1D3557] rounded-3xl p-6 shadow-[0_6px_0_0_#1D3557] hover:shadow-[0_8px_0_0_#1D3557] hover:-translate-y-1 transition-all flex flex-col justify-between"
              >

                <div>

                  {/* Top Bar */}
                  <div className="flex items-center justify-between mb-3">

                    <div className="flex items-center gap-2">

                      {/* Replaced emoji placeholder with Lucide icon */}
                      <div className="w-10 h-10 shrink-0 rounded-xl bg-[#FFF176]/60 border-2 border-[#1D3557]/20 flex items-center justify-center">
                        <Recycle
                          className="w-5 h-5 text-[#1D3557]"
                          strokeWidth={2}
                        />
                      </div>

                      <div>

                        <span className="bg-[#BDE0FE] border border-[#1D3557]/30 text-[#1D3557] font-medium text-[10px] px-2 py-0.5 rounded-md">
                          Bahan: {proj.sourceMaterial}
                        </span>

                        <div className="text-[11px] font-normal text-[#1D3557]/60 flex items-center gap-1 mt-0.5">
                          <Clock className="w-3 h-3" />
                          {proj.timeEstimate}
                          <span>•</span>
                          {proj.difficulty}
                        </div>

                      </div>
                    </div>

                  </div>

                  {/* Project Title */}
                  <h3 className="font-heading font-black text-lg text-[#1D3557] mb-2 leading-snug">
                    {proj.title}
                  </h3>

                  {/* Materials */}
                  <div className="mb-3">

                    <div className="text-[11px] font-medium text-[#1D3557]/70 mb-1">
                      Alat & Bahan:
                    </div>

                    <div className="flex flex-wrap gap-1">

                      {proj.materials.map(
                        (mat, mIdx) => (
                          <span
                            key={mIdx}
                            className="bg-slate-100 px-2 py-0.5 rounded-md text-[10px] font-normal text-[#1D3557]/80"
                          >
                            {mat}
                          </span>
                        )
                      )}

                    </div>
                  </div>

                  {/* Collapsible Steps */}
                  {isExpanded && (
                    <div className="space-y-2 mt-4 pt-3 border-t border-[#1D3557]/15 animate-fadeIn">

                      <div className="text-xs font-heading font-medium text-[#1D3557]">
                        Langkah Pengerjaan:
                      </div>

                      {proj.steps.map(
                        (step, sIdx) => (
                          <div
                            key={sIdx}
                            className="flex items-start gap-2 bg-[#FAF9F5] p-2 rounded-xl text-xs font-medium text-[#1D3557]"
                          >
                            <span className="w-4 h-4 bg-[#FFF176] rounded text-[10px] font-medium flex items-center justify-center shrink-0 border border-[#1D3557]/20">
                              {sIdx + 1}
                            </span>

                            <span className="leading-relaxed">
                              {step}
                            </span>
                          </div>
                        )
                      )}

                    </div>
                  )}

                </div>

                {/* Card Footer */}
                <div className="mt-4 pt-3 border-t border-[#1D3557]/10 flex items-center justify-between">

                  <span className="text-[11px] font-medium text-emerald-800 bg-[#C7F9CC] px-2 py-0.5 rounded-md border border-[#1D3557]/20 flex items-center gap-1.5">
                    <LeafIcon />
                    Skor Dampak: {proj.impactScore}/100
                  </span>

                  <button
                    onClick={() =>
                      toggleProjectSteps(proj.id)
                    }
                    className="text-xs font-heading font-medium text-[#1D3557] flex items-center gap-1 hover:underline cursor-pointer"
                  >
                    <span>
                      {isExpanded
                        ? 'Tutup Langkah'
                        : 'Lihat Panduan Langkah'}
                    </span>

                    {isExpanded ? (
                      <ChevronUp className="w-4 h-4" />
                    ) : (
                      <ChevronDown className="w-4 h-4" />
                    )}
                  </button>

                </div>

              </div>
            );
          })}

        </div>
      </div>
    </section>
  );
};

/*
 * Small reusable icon so the impact badge
 * doesn't need a keyboard emoji.
 */
const LeafIcon = () => (
  <svg
    viewBox="0 0 24 24"
    className="w-3.5 h-3.5"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M20 4c-4.5 0-8.2 1.1-10.8 3.7C6.5 10.4 6 14 6 18" />
    <path d="M4 20c3.5-3.5 7-5.5 12-6" />
    <path d="M20 4c0 6-3 10-8 10" />
  </svg>
);