import React, { useState } from 'react';
import { X, Plus, Sparkles, BookOpen, Trash2, CheckCircle2, HelpCircle } from 'lucide-react';
import { EduModule } from '../types';
import { sfx } from '../utils/audio';

interface AddEduModalProps {
  onClose: () => void;
  onAddModule: (newModule: EduModule) => void;
}

export const AddEduModal: React.FC<AddEduModalProps> = ({ onClose, onAddModule }) => {
  const [title, setTitle] = useState('');
  const [stage, setStage] = useState<'KNOW' | 'LEARN' | 'SORT' | 'ACT' | 'PROTECT'>('LEARN');
  const [category, setCategory] = useState<'Organik' | 'Anorganik' | 'B3' | 'Residu' | 'Umum'>('Organik');
  const [duration, setDuration] = useState('5 Menit');
  const [summary, setSummary] = useState('');
  
  // Sections (content paragraphs)
  const [sections, setSections] = useState<{ title: string; content: string }[]>([
    { title: 'Pengantar', content: '' },
    { title: 'Langkah Praktis', content: '' },
  ]);

  // Quiz
  const [quizQuestion, setQuizQuestion] = useState('');
  const [quizOptions, setQuizOptions] = useState<string[]>(['', '', '', '']);
  const [correctIndex, setCorrectIndex] = useState<number>(0);
  const [quizExplanation, setQuizExplanation] = useState('');

  const stageColorMap = {
    KNOW: { color: '#BDE0FE', label: '1. KNOW (Kenali)' },
    LEARN: { color: '#FFF176', label: '2. LEARN (Pahami)' },
    SORT: { color: '#C7F9CC', label: '3. SORT (Pilah)' },
    ACT: { color: '#FFD6A5', label: '4. ACT (Aksi/Daur Ulang)' },
    PROTECT: { color: '#E8DFF5', label: '5. PROTECT (Jaga Bumi)' },
  };

  const handleAddSection = () => {
    setSections([...sections, { title: `Poin ${sections.length + 1}`, content: '' }]);
  };

  const handleRemoveSection = (index: number) => {
    if (sections.length > 1) {
      setSections(sections.filter((_, i) => i !== index));
    }
  };

  const handleUpdateSection = (index: number, field: 'title' | 'content', val: string) => {
    const updated = [...sections];
    updated[index][field] = val;
    setSections(updated);
  };

  const handleUpdateOption = (index: number, val: string) => {
    const updated = [...quizOptions];
    updated[index] = val;
    setQuizOptions(updated);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !summary.trim() || !quizQuestion.trim()) {
      alert('Mohon lengkapi Judul, Rangkuman, dan Pertanyaan Kuis.');
      return;
    }

    const filledOptions = quizOptions.filter((opt) => opt.trim() !== '');
    if (filledOptions.length < 2) {
      alert('Kuis harus memiliki minimal 2 pilihan jawaban.');
      return;
    }

    const newMod: EduModule = {
      id: `custom-mod-${Date.now()}`,
      stage,
      title: title.trim(),
      category: category as any,
      color: stageColorMap[stage].color,
      duration: duration.trim() || '5 Menit',
      xp: 50,
      completed: false,
      isCustom: true,
      summary: summary.trim(),
      sections: sections.filter((s) => s.title.trim() && s.content.trim()),
      quiz: {
        question: quizQuestion.trim(),
        options: quizOptions.map((o, idx) => o.trim() || `Pilihan ${idx + 1}`),
        correctIndex: Math.min(correctIndex, quizOptions.length - 1),
        explanation: quizExplanation.trim() || 'Jawaban ini tepat sesuai prinsip pengelolaan sampah!',
      },
    };

    sfx.playSuccessFanfare();
    onAddModule(newMod);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fadeIn">
      <div className="relative w-full max-w-2xl bg-white border-3 border-[#1D3557] rounded-3xl shadow-[0_12px_0_0_#1D3557] flex flex-col max-h-[90vh] overflow-hidden">
        
        {/* Top Header */}
        <div className="bg-[#BDE0FE] border-b-2 border-[#1D3557] p-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 bg-white border-2 border-[#1D3557] rounded-xl flex items-center justify-center font-bold text-lg shadow-xs">
              📚
            </div>
            <div>
              <h3 className="font-heading font-black text-lg text-[#1D3557]">
                Tambah Modul Edukasi Baru
              </h3>
              <p className="text-xs font-semibold text-[#1D3557]/70">
                Buat materi pembelajaran baru dan kuis interaktif untuk siswa
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              sfx.playBrickClick();
              onClose();
            }}
            className="p-1.5 rounded-xl bg-white border border-[#1D3557] hover:bg-slate-100 text-[#1D3557] shadow-xs cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 space-y-5 bg-[#FAF9F5]">
          
          {/* 1. Main Info */}
          <div className="bg-white border-2 border-[#1D3557] p-4 rounded-2xl shadow-xs space-y-3.5">
            <h4 className="font-heading font-bold text-sm text-[#1D3557] flex items-center gap-2">
              <span>🧱 1. Informasi Utama Modul</span>
            </h4>

            <div>
              <label className="block text-xs font-bold text-[#1D3557] mb-1">
                Judul Materi Edukasi *
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Contoh: Mengenal Cara Membuat Eco-Enzyme dari Kulit Buah"
                className="w-full bg-[#FAF9F5] border-2 border-[#1D3557]/20 focus:border-[#1D3557] rounded-xl px-3.5 py-2 text-xs font-semibold text-[#1D3557] focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-bold text-[#1D3557] mb-1">
                  Tahapan Balok (Stage)
                </label>
                <select
                  value={stage}
                  onChange={(e) => setStage(e.target.value as any)}
                  className="w-full bg-[#FAF9F5] border-2 border-[#1D3557]/20 focus:border-[#1D3557] rounded-xl px-3 py-2 text-xs font-semibold text-[#1D3557] focus:outline-none"
                >
                  <option value="KNOW">1. KNOW (Kenali)</option>
                  <option value="LEARN">2. LEARN (Pahami)</option>
                  <option value="SORT">3. SORT (Pilah)</option>
                  <option value="ACT">4. ACT (Daur Ulang)</option>
                  <option value="PROTECT">5. PROTECT (Jaga Bumi)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#1D3557] mb-1">
                  Kategori Sampah
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as any)}
                  className="w-full bg-[#FAF9F5] border-2 border-[#1D3557]/20 focus:border-[#1D3557] rounded-xl px-3 py-2 text-xs font-semibold text-[#1D3557] focus:outline-none"
                >
                  <option value="Organik">Organik</option>
                  <option value="Anorganik">Anorganik</option>
                  <option value="B3">B3</option>
                  <option value="Residu">Residu</option>
                  <option value="Umum">Umum / Semua</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#1D3557] mb-1">
                  Estimasi Durasi
                </label>
                <input
                  type="text"
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  placeholder="e.g. 5 Menit"
                  className="w-full bg-[#FAF9F5] border-2 border-[#1D3557]/20 focus:border-[#1D3557] rounded-xl px-3 py-2 text-xs font-semibold text-[#1D3557] focus:outline-none"
                >
                </input>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#1D3557] mb-1">
                Rangkuman Singkat / Ringkasan Materi *
              </label>
              <textarea
                required
                rows={2}
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
                placeholder="Tuliskan 1-2 kalimat ringkasan inti dari materi ini..."
                className="w-full bg-[#FAF9F5] border-2 border-[#1D3557]/20 focus:border-[#1D3557] rounded-xl px-3.5 py-2 text-xs font-semibold text-[#1D3557] focus:outline-none"
              />
            </div>
          </div>

          {/* 2. Content Sections */}
          <div className="bg-white border-2 border-[#1D3557] p-4 rounded-2xl shadow-xs space-y-3.5">
            <div className="flex items-center justify-between">
              <h4 className="font-heading font-bold text-sm text-[#1D3557]">
                📖 2. Isi Paragraf Pembahasan
              </h4>
              <button
                type="button"
                onClick={handleAddSection}
                className="text-[11px] font-bold bg-[#FFF176] text-[#1D3557] border border-[#1D3557] px-2.5 py-1 rounded-lg flex items-center gap-1 hover:bg-[#ffe600] cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                Tambah Paragraf
              </button>
            </div>

            <div className="space-y-3">
              {sections.map((sec, idx) => (
                <div key={idx} className="p-3 bg-[#FAF9F5] border border-[#1D3557]/20 rounded-xl space-y-2 relative">
                  <div className="flex items-center justify-between">
                    <input
                      type="text"
                      value={sec.title}
                      onChange={(e) => handleUpdateSection(idx, 'title', e.target.value)}
                      placeholder={`Subjudul Poin ${idx + 1}`}
                      className="font-bold text-xs bg-transparent border-b border-[#1D3557]/30 text-[#1D3557] focus:outline-none py-0.5"
                    />
                    {sections.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveSection(idx)}
                        className="text-rose-600 hover:text-rose-800 p-1"
                        title="Hapus Bagian Ini"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                  <textarea
                    rows={3}
                    value={sec.content}
                    onChange={(e) => handleUpdateSection(idx, 'content', e.target.value)}
                    placeholder="Tuliskan penjelasan detail materi pada poin ini..."
                    className="w-full bg-white border border-[#1D3557]/15 rounded-lg p-2 text-xs text-[#1D3557] focus:outline-none"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* 3. Interactive Quiz */}
          <div className="bg-white border-2 border-[#1D3557] p-4 rounded-2xl shadow-xs space-y-3.5">
            <h4 className="font-heading font-bold text-sm text-[#1D3557] flex items-center gap-2">
              <span>🎯 3. Pertanyaan Kuis Pemahaman</span>
            </h4>

            <div>
              <label className="block text-xs font-bold text-[#1D3557] mb-1">
                Pertanyaan Kuis *
              </label>
              <input
                type="text"
                required
                value={quizQuestion}
                onChange={(e) => setQuizQuestion(e.target.value)}
                placeholder="Contoh: Apa perbandingan komposisi air, gula, dan sisa buah untuk eco-enzyme?"
                className="w-full bg-[#FAF9F5] border-2 border-[#1D3557]/20 focus:border-[#1D3557] rounded-xl px-3.5 py-2 text-xs font-semibold text-[#1D3557] focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#1D3557] mb-1">
                Pilihan Jawaban (Pilih radio button pada jawaban yang BENAR) *
              </label>
              <div className="space-y-2">
                {quizOptions.map((opt, oIdx) => (
                  <div key={oIdx} className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="correctQuizOption"
                      checked={correctIndex === oIdx}
                      onChange={() => setCorrectIndex(oIdx)}
                      className="w-4 h-4 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                    />
                    <input
                      type="text"
                      value={opt}
                      onChange={(e) => handleUpdateOption(oIdx, e.target.value)}
                      placeholder={`Pilihan ${String.fromCharCode(65 + oIdx)}`}
                      className={`flex-1 bg-[#FAF9F5] border rounded-xl px-3 py-1.5 text-xs text-[#1D3557] focus:outline-none ${
                        correctIndex === oIdx ? 'border-emerald-600 bg-emerald-50/50 font-bold' : 'border-[#1D3557]/20'
                      }`}
                    />
                  </div>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#1D3557] mb-1">
                Penjelasan Kunci Jawaban
              </label>
              <input
                type="text"
                value={quizExplanation}
                onChange={(e) => setQuizExplanation(e.target.value)}
                placeholder="Penjelasan mengapa jawaban tersebut tepat..."
                className="w-full bg-[#FAF9F5] border-2 border-[#1D3557]/20 focus:border-[#1D3557] rounded-xl px-3.5 py-2 text-xs font-semibold text-[#1D3557] focus:outline-none"
              />
            </div>
          </div>

          {/* Footer Submit Action */}
          <div className="pt-2 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-[#1D3557]/30 text-xs font-bold text-[#1D3557] hover:bg-slate-100 cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              className="brick-btn bg-[#C7F9CC] text-[#1D3557] border-2 border-[#1D3557] px-6 py-2.5 rounded-xl font-heading font-bold text-xs sm:text-sm shadow-[0_3px_0_0_#1D3557] hover:bg-[#b0f5b7] active:translate-y-0.5 active:shadow-none cursor-pointer flex items-center gap-2"
            >
              <Sparkles className="w-4 h-4 text-emerald-800" />
              <span>Simpan & Terbitkan Materi</span>
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};
