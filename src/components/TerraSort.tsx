import React, { useState } from 'react';
import { Search, Filter, Layers, Clock, AlertCircle, Sparkles, Check, ArrowRight } from 'lucide-react';
import { SORT_DIRECTORY } from '../data/mockData';
import { SortItem, WasteCategory } from '../types';
import { sfx } from '../utils/audio';

export const TerraSort: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [activeItemModal, setActiveItemModal] = useState<SortItem | null>(null);

  const categories = [
    { key: 'ALL', label: 'Semua Benda', color: 'bg-white' },
    { key: 'Organik', label: '🌱 Organik (Hijau)', color: 'bg-[#C7F9CC]' },
    { key: 'Anorganik', label: '🥤 Anorganik (Biru)', color: 'bg-[#BDE0FE]' },
    { key: 'B3', label: '⚠️ B3 (Kuning/Merah)', color: 'bg-[#FFF176]' },
    { key: 'Residu', label: '🗑️ Residu (Abu-abu)', color: 'bg-[#E2E8F0]' },
  ];

  const filteredItems = SORT_DIRECTORY.filter((item) => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.material.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.tips.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'ALL' || item.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <section id="terra-sort" className="py-12 bg-white/60 border-t-2 border-[#1D3557]/15">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-8">
          <div className="inline-flex items-center gap-2 bg-[#C7F9CC] border-2 border-[#1D3557] px-3.5 py-1 rounded-full text-xs font-heading font-extrabold text-[#1D3557] shadow-[0_2px_0_0_#1D3557] mb-2.5">
            <Layers className="w-3.5 h-3.5 text-emerald-800" />
            <span>TERRA SORT — DIREKTORI PENCARIAN WADAH SAMPAH</span>
          </div>
          <h2 className="font-heading font-black text-2xl sm:text-3xl md:text-4xl text-[#1D3557]">
            Cari & Temukan Wadah yang Tepat 🔍
          </h2>
          <p className="text-sm text-[#1D3557]/75 font-medium mt-1">
            Ragu membuang barang tertentu? Ketik nama barang untuk melihat panduan pemilahan, warna tong sampah, dan tips pengemasan.
          </p>
        </div>

        {/* Search & Category Filter Controls */}
        <div className="bg-[#FAF9F5] border-2 border-[#1D3557] p-4 rounded-3xl shadow-[0_6px_0_0_#1D3557] mb-8 space-y-4">
          {/* Search Bar */}
          <div className="relative">
            <Search className="w-5 h-5 text-[#1D3557]/50 absolute left-4 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari nama sampah (misal: botol plastik, ampas kopi, baterai, kardus, styrofoam)..."
              className="w-full pl-12 pr-4 py-3 bg-white border-2 border-[#1D3557]/30 focus:border-[#1D3557] rounded-2xl text-xs sm:text-sm font-medium text-[#1D3557] focus:outline-none transition-all shadow-xs"
            />
          </div>

          {/* Category Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
            {categories.map((cat) => {
              const isSelected = selectedCategory === cat.key;
              return (
                <button
                  key={cat.key}
                  onClick={() => {
                    sfx.playBrickClick();
                    setSelectedCategory(cat.key);
                  }}
                  className={`whitespace-nowrap px-3.5 py-1.5 rounded-xl text-xs font-heading font-bold border-2 transition-all cursor-pointer ${
                    isSelected
                      ? 'border-[#1D3557] shadow-[0_3px_0_0_#1D3557] -translate-y-0.5'
                      : 'border-[#1D3557]/20 hover:border-[#1D3557] text-[#1D3557]/70'
                  } ${cat.color}`}
                >
                  {cat.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Directory Items Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredItems.map((item) => {
            const getBadgeColor = (cat: string) => {
              switch (cat) {
                case 'Organik': return 'bg-[#C7F9CC]';
                case 'Anorganik': return 'bg-[#BDE0FE]';
                case 'B3': return 'bg-[#FFF176]';
                default: return 'bg-[#E2E8F0]';
              }
            };

            return (
              <div
                key={item.id}
                onClick={() => {
                  sfx.playBrickClick();
                  setActiveItemModal(item);
                }}
                className="group bg-white border-2 border-[#1D3557] rounded-2xl p-4 shadow-[0_4px_0_0_#1D3557] hover:shadow-[0_6px_0_0_#1D3557] hover:-translate-y-1 transition-all cursor-pointer flex flex-col justify-between"
              >
                <div>
                  {/* Category Pill on top */}
                  <div className="flex items-center justify-between mb-2">
                    <span className={`px-2 py-0.5 rounded-md border border-[#1D3557]/40 text-[10px] font-heading font-black text-[#1D3557] ${getBadgeColor(item.category)}`}>
                      {item.category}
                    </span>
                    <span className="text-[11px] font-bold text-[#1D3557]/60 flex items-center gap-1">
                      <Clock className="w-3 h-3" /> {item.decomposition}
                    </span>
                  </div>

                  <h3 className="font-heading font-black text-sm text-[#1D3557] group-hover:text-blue-900 transition-colors mb-1">
                    {item.name}
                  </h3>

                  <p className="text-[11px] text-[#1D3557]/70 line-clamp-2 leading-relaxed">
                    {item.tips}
                  </p>
                </div>

                <div className="mt-3 pt-2 border-t border-[#1D3557]/10 flex items-center justify-between text-[11px] font-bold text-[#1D3557]">
                  <span className="flex items-center gap-1 text-[10px] text-[#1D3557]/80">
                    🗑️ {item.binName}
                  </span>
                  <span className="text-blue-700 flex items-center gap-0.5 group-hover:translate-x-0.5 transition-transform">
                    Detail <ArrowRight className="w-3 h-3" />
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {filteredItems.length === 0 && (
          <div className="text-center py-12 bg-white border-2 border-dashed border-[#1D3557]/30 rounded-3xl p-8">
            <div className="text-3xl mb-2">🔍</div>
            <h4 className="font-heading font-black text-base text-[#1D3557]">
              Sampah Tidak Ditemukan
            </h4>
            <p className="text-xs text-[#1D3557]/70 mt-1">
              Coba cari dengan kata kunci lain atau tanyakan langsung pada Terri AI Assistant!
            </p>
          </div>
        )}

      </div>

      {/* Item Detail Modal */}
      {activeItemModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-fadeIn">
          <div className="relative w-full max-w-md bg-white border-3 border-[#1D3557] rounded-3xl p-6 shadow-[0_12px_0_0_#1D3557] space-y-4">
            
            <div className="flex items-start justify-between border-b-2 border-[#1D3557]/15 pb-3">
              <div>
                <span className="bg-[#BDE0FE] border border-[#1D3557]/30 text-[#1D3557] font-black text-[10px] px-2 py-0.5 rounded-md">
                  Kategori: {activeItemModal.category}
                </span>
                <h3 className="font-heading font-black text-xl text-[#1D3557] mt-1">
                  {activeItemModal.name}
                </h3>
              </div>
              <button
                onClick={() => setActiveItemModal(null)}
                className="p-1.5 rounded-xl border border-[#1D3557] text-[#1D3557] hover:bg-slate-100 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs sm:text-sm">
              <div className="bg-[#FAF9F5] p-3 rounded-xl border border-[#1D3557]/20">
                <div className="font-bold text-[#1D3557]/70 text-[11px] mb-0.5">Struktur Material:</div>
                <div className="font-semibold text-[#1D3557]">{activeItemModal.material}</div>
              </div>

              <div className="bg-[#FAF9F5] p-3 rounded-xl border border-[#1D3557]/20">
                <div className="font-bold text-[#1D3557]/70 text-[11px] mb-0.5">Wadah yang Tepat:</div>
                <div className="font-heading font-black text-sm text-[#1D3557]">{activeItemModal.binName}</div>
              </div>

              <div className="bg-[#FEF9E7] p-3 rounded-xl border border-[#1D3557]/20">
                <div className="font-bold text-[#1D3557]/70 text-[11px] mb-0.5">Waktu Terurai Alami:</div>
                <div className="font-semibold text-[#1D3557]">{activeItemModal.decomposition}</div>
              </div>

              <div className="bg-[#C7F9CC]/40 p-3 rounded-xl border border-[#1D3557]/20">
                <div className="font-bold text-emerald-900 text-[11px] mb-0.5">💡 Tips Penanganan Terbaik:</div>
                <div className="font-medium text-[#1D3557] leading-relaxed">{activeItemModal.tips}</div>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setActiveItemModal(null)}
                className="brick-btn bg-[#FFF176] text-[#1D3557] border-2 border-[#1D3557] px-5 py-2 rounded-xl font-heading font-bold text-xs shadow-[0_3px_0_0_#1D3557]"
              >
                Mengerti, Terima Kasih! 🧱
              </button>
            </div>

          </div>
        </div>
      )}

    </section>
  );
};
