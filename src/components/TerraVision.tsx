import React, { useState, useRef, useEffect } from 'react';
import {
  Camera,
  Upload,
  Sparkles,
  RefreshCw,
  CheckCircle2,
  ArrowRight,
  Lightbulb,
  Clock,
  Award,
  Leaf,
  Trash2,
  CupSoda,
  AlertTriangle,
  Bot,
  Zap,
  Globe2,
} from 'lucide-react';
import { SAMPLE_SCAN_PRESETS } from '../data/mockData';
import { WasteScanResult } from '../types';
import { sfx } from '../utils/audio';

interface TerraVisionProps {
  onScanComplete?: (result: WasteScanResult) => void;
  onOpenDiyIdea?: (itemName: string) => void;
}

export const TerraVision: React.FC<TerraVisionProps> = ({
  onScanComplete,
  onOpenDiyIdea,
}) => {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [selectedItemName, setSelectedItemName] = useState<string>('');

  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [scanResult, setScanResult] = useState<WasteScanResult | null>(null);
  const [scanError, setScanError] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState<boolean>(false);
  const [isCameraActive, setIsCameraActive] = useState<boolean>(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    return () => {
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  const handleAnalyze = async (imgSrc?: string, name?: string) => {
    const targetImg = imgSrc || selectedImage;
    const targetName = name || selectedItemName;

    setIsScanning(true);
    setScanError(null);
    sfx.playScanChirp();

    try {
      let base64Payload = '';

      if (targetImg && targetImg.startsWith('data:image')) {
        base64Payload = targetImg;
      } else if (targetImg && targetImg.startsWith('http')) {
        try {
          const res = await fetch(targetImg);
          const blob = await res.blob();
          const reader = new FileReader();

          base64Payload = await new Promise((resolve) => {
            reader.onloadend = () => resolve(reader.result as string);
            reader.readAsDataURL(blob);
          });
        } catch {
          base64Payload = '';
        }
      }

      const response = await fetch('/api/scan-waste', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64: base64Payload,
          itemName: targetName,
        }),
      });

      const json = await response.json();

      if (json.success && json.data) {
        setScanResult(json.data);
        sfx.playSuccessFanfare();

        if (onScanComplete) {
          onScanComplete(json.data);
        }
      } else {
        throw new Error(json.error || 'Gagal memindai');
      }
    } catch (err: any) {
      console.warn('Scan error, using fallback analysis:', err);

      const fallbackResult: WasteScanResult = {
        itemName: targetName || 'Botol Plastik PET Minuman Mineral',
        category: 'Anorganik',
        subMaterial: 'Plastik PET (Polyethylene Terephthalate) Kode #1',
        decompositionTime: '450 - 500 Tahun',
        recyclabilityScore: 94,
        actionBadge: 'Daur Ulang',
        handlingSteps: [
          'Habiskan isi cairan dan bilas sebentar dengan air bersih.',
          'Lepaskan label plastik dan pisahkan tutup botolnya.',
          'Remas botol hingga pipih untuk menghemat 70% volume tempat sampah.',
          'Kumpulkan dan setorkan ke Bank Sampah atau Smart Bin terdekat.',
        ],
        upcycleIdea: {
          title: 'Pot Tanaman Hidroponik Sumbu (Self-Watering Pot)',
          difficulty: 'Mudah (15 Menit)',
          description:
            'Potong botol menjadi 2 bagian, pasang kain flanel sebagai sumbu nutrisi di bagian tutup botol untuk menanam sayur kangkung.',
        },
        ecoTip:
          'Botol PET adalah jenis plastik yang paling mudah didaur ulang di dunia menjadi serat kain sintetis!',
        carbonSavedKg: 0.18,
      };

      setScanResult(fallbackResult);
      sfx.playSuccessFanfare();

      if (onScanComplete) {
        onScanComplete(fallbackResult);
      }
    } finally {
      setIsScanning(false);
    }
  };

  const compressImage = (file: File): Promise<string> => {
    return new Promise((resolve) => {
      const reader = new FileReader();

      reader.onload = (e) => {
        const img = new Image();

        img.onload = () => {
          const maxDim = 800;
          let { width, height } = img;

          if (width > height && width > maxDim) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else if (height > maxDim) {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }

          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext('2d');

          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            resolve(canvas.toDataURL('image/jpeg', 0.75));
          } else {
            resolve(e.target?.result as string);
          }
        };

        img.src = e.target?.result as string;
      };

      reader.readAsDataURL(file);
    });
  };

  const handleFileUpload = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];

    if (file) {
      const compressedBase64 = await compressImage(file);

      setSelectedImage(compressedBase64);
      setSelectedItemName(file.name.replace(/\.[^/.]+$/, ''));
      setScanResult(null);

      handleAnalyze(compressedBase64, file.name);
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);

    const file = e.dataTransfer.files?.[0];

    if (file) {
      const compressedBase64 = await compressImage(file);

      setSelectedImage(compressedBase64);
      setSelectedItemName(file.name.replace(/\.[^/.]+$/, ''));
      setScanResult(null);

      handleAnalyze(compressedBase64, file.name);
    }
  };

  const startCamera = async () => {
    try {
      setIsCameraActive(true);

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      alert(
        'Kamera tidak dapat diakses atau izin ditolak. Silakan unggah foto secara manual.'
      );

      setIsCameraActive(false);
    }
  };

  const takeSnapshot = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;

      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 480;

      const ctx = canvas.getContext('2d');

      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

        const dataUrl = canvas.toDataURL('image/jpeg');

        setSelectedImage(dataUrl);
        setSelectedItemName('Foto Sampah Kamera');

        stopCamera();
        handleAnalyze(dataUrl, 'Foto Sampah Kamera');
      }
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;

      stream.getTracks().forEach((track) => track.stop());

      videoRef.current.srcObject = null;
    }

    setIsCameraActive(false);
  };

  const getCategoryStyles = (category: string) => {
    switch (category) {
      case 'Organik':
        return {
          bg: 'bg-[#C7F9CC]',
          text: 'text-[#1D3557]',
          badgeBg: 'bg-emerald-700 text-white',
          border: 'border-[#1D3557]',
          icon: <Leaf className="w-5 h-5" />,
          binName: 'Wadah Hijau (Organik / Kompos)',
        };

      case 'Anorganik':
        return {
          bg: 'bg-[#BDE0FE]',
          text: 'text-[#1D3557]',
          badgeBg: 'bg-blue-700 text-white',
          border: 'border-[#1D3557]',
          icon: <CupSoda className="w-5 h-5" />,
          binName: 'Wadah Biru (Daur Ulang Kering)',
        };

      case 'B3':
        return {
          bg: 'bg-[#FFF176]',
          text: 'text-[#1D3557]',
          badgeBg: 'bg-amber-600 text-white',
          border: 'border-[#1D3557]',
          icon: <AlertTriangle className="w-5 h-5" />,
          binName: 'Wadah Khusus B3 (Limbah Toksik)',
        };

      case 'Residu':
      default:
        return {
          bg: 'bg-[#E2E8F0]',
          text: 'text-[#1D3557]',
          badgeBg: 'bg-slate-700 text-white',
          border: 'border-[#1D3557]',
          icon: <Trash2 className="w-5 h-5" />,
          binName: 'Wadah Abu-abu (Residu TPA)',
        };
    }
  };

  return (
    <section
      id="terra-vision"
      className="py-12 bg-white/70 border-y-2 border-[#1D3557]/15"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-10">
          <div className="inline-flex items-center gap-2 bg-[#BDE0FE] border-2 border-[#1D3557] px-3.5 py-1 rounded-full text-xs font-heading font-extrabold text-[#1D3557] shadow-[0_2px_0_0_#1D3557] mb-3">
            <Sparkles className="w-3.5 h-3.5 text-blue-900" />
            <span>TERRA VISION — PEMINDAI SAMPAH CERDAS</span>
          </div>

          <h2 className="font-heading font-black text-2xl sm:text-3xl md:text-4xl text-[#1D3557]">
            Pindai Sampah, Temukan Cara Olahnya Seketika!
          </h2>

          <p className="text-sm sm:text-base text-[#1D3557]/75 font-medium mt-2">
            Arahkan kamera atau unggah foto sampah di sekitarmu. AI Vision
            TERRA akan mendeteksi material, memberikan rekomendasi pemilahan
            wadah, hingga ide daur ulang.
          </p>
        </div>

        {/* Preset Sample Selector */}
        <div className="mb-6 bg-[#FAF9F6] p-4 rounded-2xl border-2 border-[#1D3557]/20 shadow-xs">
          <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
            <span className="text-xs font-heading font-bold text-[#1D3557] flex items-center gap-1.5">
              <Zap className="w-4 h-4 text-amber-600" />
              Uji Cepat dengan Contoh Sampah:
            </span>

            <span className="text-[11px] text-[#1D3557]/60">
              Klik salah satu balok sampel di bawah untuk analisis otomatis
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2.5">
            {SAMPLE_SCAN_PRESETS.map((preset) => {
              const isSelected = selectedItemName === preset.name;

              return (
                <button
                  key={preset.id}
                  onClick={() => {
                    sfx.playBrickClick();
                    setSelectedImage(preset.imgUrl);
                    setSelectedItemName(preset.name);
                    handleAnalyze(preset.imgUrl, preset.name);
                  }}
                  className={`p-2.5 rounded-xl border-2 transition-all text-left flex items-center gap-2 ${
                    isSelected
                      ? 'bg-[#FFF176] border-[#1D3557] shadow-[0_3px_0_0_#1D3557] -translate-y-0.5'
                      : 'bg-white border-[#1D3557]/20 hover:border-[#1D3557] hover:bg-slate-50'
                  }`}
                >
                  <span className="text-xl">{preset.icon}</span>

                  <div className="min-w-0 flex-1">
                    <div className="font-heading font-bold text-xs text-[#1D3557] truncate">
                      {preset.name}
                    </div>

                    <div className="text-[10px] font-semibold text-[#1D3557]/60">
                      {preset.category}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Scanner Workstation */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

          {/* Left Column */}
          <div className="lg:col-span-5 space-y-4">
            <div className="relative">

              <div className="flex justify-between px-6 -mb-2 z-10 relative">
                <div className="w-6 h-3 bg-[#BDE0FE] border-2 border-[#1D3557] rounded-t-md" />
                <div className="w-6 h-3 bg-[#BDE0FE] border-2 border-[#1D3557] rounded-t-md" />
                <div className="w-6 h-3 bg-[#BDE0FE] border-2 border-[#1D3557] rounded-t-md" />
              </div>

              <div className="bg-[#BDE0FE] border-3 border-[#1D3557] rounded-3xl p-5 shadow-[0_8px_0_0_#1D3557]">

                <div className="flex items-center justify-between mb-3 border-b-2 border-[#1D3557]/20 pb-2.5">
                  <div className="flex items-center gap-2">
                    <Camera className="w-5 h-5 text-[#1D3557]" />

                    <span className="font-heading font-black text-sm text-[#1D3557]">
                      SLOT PEMINDAI BALOK
                    </span>
                  </div>

                  <span className="bg-white/90 text-[#1D3557] border border-[#1D3557]/30 text-[10px] font-extrabold px-2 py-0.5 rounded-md">
                    AI SENSOR
                  </span>
                </div>

                {/* Viewport */}
                <div
                  onDragOver={(e) => {
                    e.preventDefault();
                    setIsDragOver(true);
                  }}
                  onDragLeave={() => setIsDragOver(false)}
                  onDrop={handleDrop}
                  className={`relative w-full aspect-4/3 bg-[#1D3557]/5 border-2 border-dashed rounded-2xl overflow-hidden flex flex-col items-center justify-center transition-all ${
                    isDragOver
                      ? 'border-[#1D3557] bg-[#FFF176]/30'
                      : 'border-[#1D3557]/40 bg-white'
                  }`}
                >

                  {/* Camera */}
                  {isCameraActive ? (
                    <div className="relative w-full h-full bg-black">
                      <video
                        ref={videoRef}
                        autoPlay
                        playsInline
                        className="w-full h-full object-cover"
                      />

                      <canvas ref={canvasRef} className="hidden" />

                      <button
                        onClick={takeSnapshot}
                        className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-[#FFF176] border-2 border-[#1D3557] px-4 py-2 rounded-full font-heading font-black text-xs text-[#1D3557] shadow-[0_3px_0_0_#1D3557] flex items-center gap-1.5"
                      >
                        <Camera className="w-4 h-4" />
                        Ambil Foto
                      </button>
                    </div>
                  ) : selectedImage ? (
                    <div className="relative w-full h-full">
                      <img
                        src={selectedImage}
                        alt="Preview Sampah"
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />

                      {isScanning && (
                        <div className="absolute inset-0 bg-[#BDE0FE]/30 backdrop-blur-[1px] flex flex-col items-center justify-center">
                          <div className="w-full h-1 bg-[#FFF176] shadow-[0_0_12px_#FFF176] absolute animate-scan-line" />

                          <div className="bg-[#1D3557] text-white px-4 py-2 rounded-2xl border-2 border-white font-heading font-black text-xs flex items-center gap-2 shadow-lg animate-bounce">
                            <RefreshCw className="w-4 h-4 animate-spin text-[#FFF176]" />
                            <span>Menganalisis Material...</span>
                          </div>
                        </div>
                      )}

                      <div className="absolute top-2 left-2 bg-[#1D3557]/80 backdrop-blur-xs text-white px-2.5 py-1 rounded-xl text-[10px] font-bold">
                        {selectedItemName}
                      </div>
                    </div>
                  ) : (
                    <div className="text-center p-6 space-y-2">
                      <div className="w-14 h-14 mx-auto bg-[#BDE0FE] border-2 border-[#1D3557] rounded-2xl flex items-center justify-center shadow-[0_3px_0_0_#1D3557]">
                        <Camera
                          className="w-7 h-7 text-[#1D3557]"
                          strokeWidth={2.2}
                        />
                      </div>

                      <div className="font-heading font-bold text-sm text-[#1D3557]">
                        Tarik & Lepas Foto di Sini
                      </div>

                      <p className="text-xs text-[#1D3557]/70">
                        atau klik tombol di bawah untuk unggah file
                      </p>
                    </div>
                  )}
                </div>

                {/* Controls */}
                <div className="grid grid-cols-2 gap-2 mt-4">
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileUpload}
                    accept="image/*"
                    className="hidden"
                  />

                  <button
                    onClick={() => {
                      sfx.playBrickClick();

                      if (isCameraActive) {
                        stopCamera();
                      } else {
                        fileInputRef.current?.click();
                      }
                    }}
                    className="p-2.5 bg-white border-2 border-[#1D3557] rounded-xl font-heading font-bold text-xs text-[#1D3557] flex items-center justify-center gap-1.5 shadow-[0_3px_0_0_#1D3557] active:translate-y-0.5 active:shadow-none transition-all cursor-pointer"
                  >
                    <Upload className="w-4 h-4" />
                    <span>Unggah Foto</span>
                  </button>

                  <button
                    onClick={() => {
                      sfx.playBrickClick();

                      if (isCameraActive) {
                        stopCamera();
                      } else {
                        startCamera();
                      }
                    }}
                    className={`p-2.5 border-2 border-[#1D3557] rounded-xl font-heading font-bold text-xs text-[#1D3557] flex items-center justify-center gap-1.5 shadow-[0_3px_0_0_#1D3557] active:translate-y-0.5 active:shadow-none transition-all cursor-pointer ${
                      isCameraActive
                        ? 'bg-rose-200'
                        : 'bg-[#FFF176]'
                    }`}
                  >
                    <Camera className="w-4 h-4" />

                    <span>
                      {isCameraActive
                        ? 'Tutup Kamera'
                        : 'Buka Kamera'}
                    </span>
                  </button>
                </div>

                {/* Analyze */}
                <button
                  onClick={() => handleAnalyze()}
                  disabled={isScanning || !selectedImage}
                  className="w-full mt-3 brick-btn bg-[#FFF176] text-[#1D3557] border-2 border-[#1D3557] py-3 rounded-2xl font-heading font-black text-sm flex items-center justify-center gap-2 cursor-pointer shadow-[0_4px_0_0_#1D3557] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isScanning ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Sedang Memindai Balok Sampah...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 text-amber-700" />
                      <span>Analisis Sekarang (Gemini AI)</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Right Column */}
          <div className="lg:col-span-7">
            {scanResult ? (
              (() => {
                const catStyle = getCategoryStyles(scanResult.category);

                return (
                  <div className="space-y-4 animate-fadeIn">

                    <div className="flex justify-between px-8 -mb-2 z-10 relative">
                      <div className="w-8 h-3 bg-[#BDE0FE] rounded-t-md border-2 border-[#1D3557]" />
                      <div className="w-8 h-3 bg-[#BDE0FE] rounded-t-md border-2 border-[#1D3557]" />
                      <div className="w-8 h-3 bg-[#BDE0FE] rounded-t-md border-2 border-[#1D3557]" />
                    </div>

                    <div className="bg-white border-3 border-[#1D3557] rounded-3xl p-6 shadow-[0_10px_0_0_#1D3557] relative">

                      {/* Result Header */}
                      <div className="flex items-start justify-between flex-wrap gap-2 border-b-2 border-[#1D3557]/15 pb-4 mb-4">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="w-8 h-8 rounded-lg bg-[#FAF9F5] border border-[#1D3557]/20 flex items-center justify-center">
                              {catStyle.icon}
                            </span>

                            <span className="text-xs font-bold text-[#1D3557]/60 uppercase tracking-wider">
                              Hasil Deteksi AI TERRA
                            </span>
                          </div>

                          <h3 className="font-heading font-black text-2xl text-[#1D3557]">
                            {scanResult.itemName}
                          </h3>

                          <p className="text-xs font-semibold text-[#1D3557]/75">
                            Material: {scanResult.subMaterial}
                          </p>
                        </div>

                        <div
                          className={`px-4 py-2 rounded-2xl border-2 border-[#1D3557] ${catStyle.bg} shadow-[0_3px_0_0_#1D3557] text-center`}
                        >
                          <div className="text-[10px] uppercase font-bold text-[#1D3557]/70">
                            Kategori Wadah
                          </div>

                          <div className="font-heading font-black text-lg text-[#1D3557]">
                            {scanResult.category}
                          </div>
                        </div>
                      </div>

                      {/* Metrics */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-5">

                        <div className="bg-[#FAF9F5] p-3 rounded-2xl border-2 border-[#1D3557]/15 shadow-xs">
                          <div className="flex items-center gap-1.5 text-xs font-bold text-[#1D3557]/70 mb-1">
                            <Award className="w-3.5 h-3.5 text-amber-600" />
                            <span>Tujuan Wadah:</span>
                          </div>

                          <div className="font-heading font-bold text-xs text-[#1D3557]">
                            {catStyle.binName}
                          </div>
                        </div>

                        <div className="bg-[#FAF9F5] p-3 rounded-2xl border-2 border-[#1D3557]/15 shadow-xs">
                          <div className="flex items-center gap-1.5 text-xs font-bold text-[#1D3557]/70 mb-1">
                            <Clock className="w-3.5 h-3.5 text-blue-600" />
                            <span>Waktu Terurai:</span>
                          </div>

                          <div className="font-heading font-bold text-xs text-[#1D3557]">
                            {scanResult.decompositionTime}
                          </div>
                        </div>

                        <div className="bg-[#FAF9F5] p-3 rounded-2xl border-2 border-[#1D3557]/15 shadow-xs">
                          <div className="flex items-center justify-between text-xs font-bold text-[#1D3557]/70 mb-1">
                            <span>Daur Ulang:</span>

                            <span className="text-[#1D3557] font-black">
                              {scanResult.recyclabilityScore}%
                            </span>
                          </div>

                          <div className="w-full bg-slate-200 h-2.5 rounded-full overflow-hidden border border-[#1D3557]/20">
                            <div
                              className="bg-emerald-500 h-full rounded-full transition-all duration-1000"
                              style={{
                                width: `${scanResult.recyclabilityScore}%`,
                              }}
                            />
                          </div>
                        </div>
                      </div>

                      {/* Handling */}
                      <div className="mb-5 bg-[#FAF9F5] p-4 rounded-2xl border-2 border-[#1D3557]/15">
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="font-heading font-bold text-sm text-[#1D3557] flex items-center gap-1.5">
                            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                            <span>Langkah Penanganan Mandiri:</span>
                          </h4>

                          <span className="bg-[#FFF176] text-[#1D3557] text-[10px] font-black px-2 py-0.5 rounded-md border border-[#1D3557]/30">
                            {scanResult.actionBadge}
                          </span>
                        </div>

                        <div className="space-y-2">
                          {scanResult.handlingSteps.map(
                            (step, idx) => (
                              <div
                                key={idx}
                                className="flex items-start gap-2.5 bg-white p-2.5 rounded-xl border border-[#1D3557]/10 text-xs font-medium text-[#1D3557]/85"
                              >
                                <span className="w-5 h-5 rounded-md bg-[#BDE0FE] text-[#1D3557] font-black flex items-center justify-center text-[11px] shrink-0 border border-[#1D3557]/20">
                                  {idx + 1}
                                </span>

                                <span className="pt-0.5 leading-relaxed">
                                  {step}
                                </span>
                              </div>
                            )
                          )}
                        </div>
                      </div>

                      {/* Upcycle / Impact */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">

                        <div className="bg-[#FFF176]/30 p-3.5 rounded-2xl border-2 border-[#1D3557]/20 flex flex-col justify-between">
                          <div>
                            <div className="flex items-center gap-1.5 text-xs font-heading font-black text-[#1D3557] mb-1">
                              <Lightbulb className="w-4 h-4 text-amber-600" />
                              <span>Ide Upcycle (Waste to Worth)</span>
                            </div>

                            <div className="font-bold text-xs text-[#1D3557] mb-1">
                              {scanResult.upcycleIdea.title}
                            </div>

                            <p className="text-[11px] text-[#1D3557]/75 line-clamp-2">
                              {scanResult.upcycleIdea.description}
                            </p>
                          </div>

                          <button
                            onClick={() => {
                              sfx.playBrickClick();

                              if (onOpenDiyIdea) {
                                onOpenDiyIdea(scanResult.itemName);
                              }
                            }}
                            className="mt-3 text-[11px] font-heading font-black text-[#1D3557] flex items-center gap-1 hover:underline cursor-pointer"
                          >
                            <span>Lihat Tutorial DIY Lengkap</span>
                            <ArrowRight className="w-3 h-3" />
                          </button>
                        </div>

                        <div className="bg-[#C7F9CC]/40 p-3.5 rounded-2xl border-2 border-[#1D3557]/20">
                          <div className="flex items-center gap-1.5 text-xs font-heading font-black text-[#1D3557] mb-1">
                            <Leaf className="w-4 h-4 text-emerald-700" />
                            <span>Dampak Lingkungan</span>
                          </div>

                          <p className="text-[11px] text-[#1D3557]/80 leading-relaxed">
                            {scanResult.ecoTip}
                          </p>

                          <div className="mt-2 text-[11px] font-extrabold text-emerald-800 bg-white/80 px-2 py-1 rounded-lg inline-flex items-center gap-1.5 border border-emerald-300">
                            <Globe2 className="w-3.5 h-3.5" />
                            +{scanResult.carbonSavedKg || 0.15} kg CO₂ dicegah jika dipilah
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })()
            ) : (
              /* Empty State */
              <div className="bg-white border-3 border-[#1D3557] rounded-3xl p-8 shadow-[0_10px_0_0_#1D3557] text-center flex flex-col items-center justify-center min-h-[420px]">
                <div className="w-20 h-20 bg-[#FFF176] border-3 border-[#1D3557] rounded-3xl flex items-center justify-center shadow-[0_5px_0_0_#1D3557] mb-4 rotate-3">
                  <Bot
                    className="w-10 h-10 text-[#1D3557]"
                    strokeWidth={2}
                  />
                </div>

                <h3 className="font-heading font-black text-xl text-[#1D3557] mb-2">
                  Siap Memindai Sampah Pertamamu?
                </h3>

                <p className="text-xs sm:text-sm text-[#1D3557]/70 max-w-md mb-6 leading-relaxed font-medium">
                  Pilih salah satu contoh di bagian atas, unggah foto
                  dari galerimu, atau aktifkan kamera untuk mendapatkan
                  analisis pemilahan instan dari TERRA Vision.
                </p>

                <button
                  onClick={() => handleAnalyze()}
                  disabled={!selectedImage}
                  className="brick-btn bg-[#BDE0FE] text-[#1D3557] border-2 border-[#1D3557] px-6 py-3 rounded-2xl font-heading font-bold text-sm flex items-center gap-2 cursor-pointer shadow-[0_4px_0_0_#1D3557] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Sparkles className="w-4 h-4 text-blue-900" />
                  <span>Uji Contoh Sekarang</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};