import React, { useState, useEffect, useRef } from 'react';
import { X, Send, Sparkles, RefreshCw, Bot, User, Trash2, HelpCircle, MessageSquare, CornerDownLeft } from 'lucide-react';
import Markdown from 'react-markdown';
import { ChatMessage } from '../types';
import { sfx } from '../utils/audio';

interface TerraAIModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialQuery?: string;
}

export const TerraAIModal: React.FC<TerraAIModalProps> = ({
  isOpen,
  onClose,
  initialQuery,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome-1',
      sender: 'terri',
      text: 'Halo Sahabat Bumi! 🧱✨ Aku **Terri**, asisten cerdas balok dari TERRA. Ada yang ingin kamu tanyakan seputar apa itu sampah organik, cara memilah, membuat kompos, atau ide daur ulang hari ini?',
      timestamp: 'Baru saja',
    },
  ]);
  const [inputText, setInputText] = useState<string>('');
  const [isTyping, setIsTyping] = useState<boolean>(false);
  const [mascotMood, setMascotMood] = useState<'happy' | 'thinking' | 'excited'>('happy');

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const suggestionChips = [
    'Sampah organik itu apa?',
    'Bagaimana cara membuat kompos di rumah?',
    'Apakah botol plastik PET bisa didaur ulang?',
    'Cara membuang baterai & limbah B3 yang aman',
    'Ide kreasi upcycle kardus bekas sepatu',
    'Apa syarat membuat ecobrick padat?',
  ];

  useEffect(() => {
    if (initialQuery && isOpen) {
      handleSendMessage(initialQuery);
    }
  }, [initialQuery, isOpen]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  if (!isOpen) return null;

  const handleSendMessage = async (textToSend?: string) => {
    const text = textToSend || inputText;
    if (!text.trim() || isTyping) return;

    sfx.playBrickClick();
    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: text.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputText('');
    setIsTyping(true);
    setMascotMood('thinking');

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userMessage: userMsg.text,
          messages: messages.slice(-6), // Send last few messages for multi-turn context
        }),
      });

      const data = await response.json();
      if (data.success && data.reply) {
        const terriMsg: ChatMessage = {
          id: `terri-${Date.now()}`,
          sender: 'terri',
          text: data.reply,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        };
        setMessages((prev) => [...prev, terriMsg]);
        sfx.playScanChirp();
      } else {
        throw new Error('Gagal mendapatkan balasan');
      }
    } catch (err) {
      const errorMsg: ChatMessage = {
        id: `terri-err-${Date.now()}`,
        sender: 'terri',
        text: 'Maaf, Terri sedang menyusun balok jawaban. Intinya: selalu pisahkan sampah organik (hijau), anorganik (biru), dan B3 (kuning/merah) di rumahmu ya! 🌱',
        timestamp: 'Baru saja',
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsTyping(false);
      setMascotMood('excited');
      setTimeout(() => setMascotMood('happy'), 3000);
    }
  };

  const handleClearChat = () => {
    sfx.playBrickClick();
    setMessages([
      {
        id: 'welcome-reset',
        sender: 'terri',
        text: 'Percakapan telah direset. Mau tanya hal seru apa lagi tentang peduli bumi? 🧱🌿',
        timestamp: 'Baru saja',
      },
    ]);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/50 backdrop-blur-xs animate-fadeIn">
      {/* Container Toy Brick Structure */}
      <div className="relative w-full max-w-2xl bg-white border-3 border-[#1D3557] rounded-3xl shadow-[0_12px_0_0_#1D3557] flex flex-col h-[90vh] max-h-[680px] overflow-hidden">
        
        {/* Modal Header */}
        <div className="bg-[#FFF176] border-b-3 border-[#1D3557] px-4 py-3.5 flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-3">
            {/* Mascot Face Icon */}
            <div className="w-10 h-10 bg-[#1D3557] border-2 border-[#1D3557] rounded-2xl flex flex-col items-center justify-center text-[#FFF176] shadow-xs shrink-0">
              <span className="font-mono text-xs font-black">
                {mascotMood === 'thinking' ? '•   •' : mascotMood === 'excited' ? '★   ★' : '●   ●'}
              </span>
              <span className="font-mono text-[10px] leading-none">
                {mascotMood === 'thinking' ? ' ᗢ ' : ' ‿ '}
              </span>
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-heading font-black text-base sm:text-lg text-[#1D3557] leading-none">
                  Terri AI Assistant
                </h3>
                <span className="bg-[#C7F9CC] border border-[#1D3557]/40 text-[#1D3557] font-extrabold text-[10px] px-2 py-0.5 rounded-full shadow-xs">
                  {mascotMood === 'thinking' ? 'Sedang Merakit...' : 'Online & Ceria'}
                </span>
              </div>
              <p className="text-[11px] font-semibold text-[#1D3557]/80 mt-1">
                Konsultan Pemilahan & Daur Ulang Ramah Siswa
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={handleClearChat}
              className="p-2 rounded-xl text-[#1D3557]/70 hover:text-[#1D3557] hover:bg-[#FEF9E7] border border-transparent hover:border-[#1D3557]/20 transition-all cursor-pointer"
              title="Bersihkan Percakapan"
            >
              <Trash2 className="w-4 h-4" />
            </button>
            <button
              onClick={() => {
                sfx.playBrickClick();
                onClose();
              }}
              className="p-2 rounded-xl bg-white border-2 border-[#1D3557] hover:bg-slate-100 text-[#1D3557] shadow-[0_2px_0_0_#1D3557] active:translate-y-0.5 active:shadow-none transition-all cursor-pointer"
              title="Tutup Modal"
            >
              <X className="w-4 h-4 stroke-[2.5]" />
            </button>
          </div>
        </div>

        {/* Chat Scroll Thread Area */}
        <div className="flex-1 p-4 sm:p-5 overflow-y-auto space-y-4 bg-[#FAF9F5]">
          {messages.map((msg) => {
            const isUser = msg.sender === 'user';
            return (
              <div
                key={msg.id}
                className={`flex gap-2.5 sm:gap-3 items-start ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
              >
                {/* Avatar */}
                <div
                  className={`w-8 h-8 sm:w-9 sm:h-9 rounded-xl border-2 border-[#1D3557] flex items-center justify-center shrink-0 font-bold text-xs shadow-xs ${
                    isUser ? 'bg-[#BDE0FE] text-[#1D3557]' : 'bg-[#FFF176] text-[#1D3557]'
                  }`}
                >
                  {isUser ? <User className="w-4 h-4 stroke-[2.5]" /> : <Bot className="w-4 h-4 stroke-[2.5]" />}
                </div>

                {/* Message Bubble Block */}
                <div className={`max-w-[85%] sm:max-w-[80%] space-y-1 ${isUser ? 'items-end' : 'items-start'}`}>
                  <div
                    className={`p-3.5 sm:p-4 rounded-2xl border-2 border-[#1D3557] text-xs sm:text-sm font-medium leading-relaxed shadow-[0_3px_0_0_#1D3557] ${
                      isUser
                        ? 'bg-[#BDE0FE] text-[#1D3557] rounded-tr-none'
                        : 'bg-white text-[#1D3557] rounded-tl-none'
                    }`}
                  >
                    {isUser ? (
                      <p className="whitespace-pre-wrap font-semibold">{msg.text}</p>
                    ) : (
                      <div className="text-[#1D3557] leading-relaxed space-y-2 [&>p]:mb-2 [&>p:last-child]:mb-0 [&>ul]:list-disc [&>ul]:pl-5 [&>ul]:space-y-1 [&>ol]:list-decimal [&>ol]:pl-5 [&>ol]:space-y-1 [&>h3]:font-heading [&>h3]:font-black [&>h3]:text-sm [&>h3]:mt-2 [&>h4]:font-bold [&>strong]:font-black [&>strong]:text-[#1D3557] [&>em]:italic">
                        <Markdown>{msg.text}</Markdown>
                      </div>
                    )}
                  </div>

                  <div className={`text-[10px] font-semibold text-[#1D3557]/50 px-1 ${isUser ? 'text-right' : 'text-left'}`}>
                    {msg.timestamp}
                  </div>
                </div>
              </div>
            );
          })}

          {/* Typing Indicator */}
          {isTyping && (
            <div className="flex gap-2.5 items-center text-xs font-bold text-[#1D3557] bg-white border-2 border-[#1D3557] p-3 rounded-2xl shadow-[0_3px_0_0_#1D3557] w-fit animate-pulse">
              <div className="w-5 h-5 bg-[#FFF176] border border-[#1D3557] rounded-md flex items-center justify-center text-[10px]">
                🧱
              </div>
              <span>Terri sedang merakit balok jawaban pintar...</span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Quick Suggestion Chips Horizontal Bar */}
        <div className="bg-[#FAF9F5] border-t border-[#1D3557]/20 px-3.5 py-2.5 overflow-x-auto flex gap-2 no-scrollbar shrink-0">
          {suggestionChips.map((chip, idx) => (
            <button
              key={idx}
              onClick={() => handleSendMessage(chip)}
              className="whitespace-nowrap px-3 py-1.5 rounded-xl bg-white border-2 border-[#1D3557]/30 hover:border-[#1D3557] hover:bg-[#FFF176]/50 text-[11px] font-heading font-bold text-[#1D3557] transition-all cursor-pointer shadow-xs active:scale-95 shrink-0"
            >
              💡 {chip}
            </button>
          ))}
        </div>

        {/* Chat Input Field & Send Action */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="p-3 sm:p-3.5 bg-white border-t-2 border-[#1D3557] flex items-center gap-2 shrink-0"
        >
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Tulis pertanyaanmu (contoh: sampah organik itu apa?)..."
            className="flex-1 bg-[#FAF9F5] border-2 border-[#1D3557]/25 focus:border-[#1D3557] rounded-2xl px-4 py-2.5 text-xs sm:text-sm font-semibold text-[#1D3557] focus:outline-none transition-all placeholder:text-[#1D3557]/40"
          />

          <button
            type="submit"
            disabled={!inputText.trim() || isTyping}
            className="brick-btn bg-[#FFF176] text-[#1D3557] border-2 border-[#1D3557] px-4 py-2.5 rounded-2xl font-heading font-black text-xs shadow-[0_3px_0_0_#1D3557] disabled:opacity-40 active:translate-y-0.5 active:shadow-none cursor-pointer flex items-center gap-1.5 transition-all"
          >
            <span>Kirim</span>
            <Send className="w-3.5 h-3.5 stroke-[2.5]" />
          </button>
        </form>

      </div>
    </div>
  );
};
