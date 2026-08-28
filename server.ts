import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";
import { GoogleGenAI, Type } from "@google/genai";

dotenv.config();

function getGenAIClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === "MY_GEMINI_API_KEY") {
    return null;
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });
}

// Resilient helper to handle 503 (High Demand) spikes gracefully across models
async function generateContentWithFallback(
  ai: GoogleGenAI,
  requestParams: {
    contents: any;
    config?: any;
  }
) {
  const candidateModels = [
    "gemini-3.7-flash",
    "gemini-flash-latest",
    "gemini-3.1-flash-lite",
  ];

  let lastError: any = null;

  for (const model of candidateModels) {
    try {
      const result = await ai.models.generateContent({
        model,
        contents: requestParams.contents,
        config: requestParams.config,
      });
      return { response: result, modelUsed: model };
    } catch (err: any) {
      lastError = err;
      const status = err?.status || err?.code;
      const errMsg = err?.message || "";
      console.warn(`Model ${model} returned error (${status}): ${errMsg}. Attempting fallback model...`);
      // If error is 503 (High demand) or 404 (model unavailable), continue loop to next model
      if (status === 503 || status === 404 || status === 429 || errMsg.includes("high demand") || errMsg.includes("UNAVAILABLE")) {
        // Tiny wait before retry
        await new Promise((r) => setTimeout(r, 400));
        continue;
      }
      // For other critical errors, rethrow or try next
      continue;
    }
  }

  throw lastError;
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: "25mb" }));

  // API 1: Health
  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  // API 2: TERRA Vision - AI Waste Scanner
  app.post("/api/scan-waste", async (req, res) => {
    try {
      const { imageBase64, mimeType = "image/jpeg", itemName } = req.body;
      const ai = getGenAIClient();

      if (!ai) {
        // Fallback realistic smart analysis for preview/demonstration if no key
        const sampleAnalysis = getFallbackWasteAnalysis(itemName);
        return res.json({ success: true, data: sampleAnalysis, source: "mock-engine" });
      }

      const prompt = `Anda adalah TERRA Vision AI, sistem pemindai sampah cerdas berbasis Modular Toy Brick untuk mengedukasi siswa dan masyarakat Indonesia.
Analisis objek/sampah pada gambar atau nama barang '${itemName || "sampah ini"}' secara teliti dan akurat.
Kategorikan secara spesifik ke dalam salah satu dari 4 kategori utama:
1. "Organik" (Sampah sisa makanan, daun, kulit buah, sisa dapur yang mudah membusuk)
2. "Anorganik" (Plastik, botol PET, kaleng alumunium, kaca, kardus, kertas, kresek)
3. "B3" (Bahan Berbahaya & Beracun: baterai, obat kadaluarsa, lampu neon, botol pestisida, elektronik kecil rusak)
4. "Residu" (Pembalut, popok, tisu basah kotor, puntung rokok, styrofoam kotor, sachet multilayer yang sulit didaur ulang)

Berikan analisis dalam format JSON terstruktur dengan skema berikut:
- itemName: string (nama benda yang terdeteksi, e.g. "Botol Plastik PET Minuman Mineral")
- category: "Organik" | "Anorganik" | "B3" | "Residu"
- subMaterial: string (e.g. "Plastik PET (Polyethylene Terephthalate) Kode #1")
- decompositionTime: string (e.g. "450 - 500 Tahun")
- recyclabilityScore: number (0 sampai 100, contoh 90 untuk botol PET)
- actionBadge: string (singkat, e.g. "Daur Ulang", "Komposkan", "Kirim ke Drop Point B3", "Residu TPA")
- handlingSteps: array of strings (3-4 langkah praktis, jelas dan ramah anak, misal "1. Cuci bersih dan keringkan", "2. Lepas label plastik dan tutupnya", "3. Remas botol hingga pipih untuk menghemat ruang", "4. Setorkan ke Bank Sampah terdekat")
- upcycleIdea: object with title (string), difficulty ("Mudah" | "Sedang" | "Kreatif"), description (string)
- ecoTip: string (fakta menarik edukatif 1-2 kalimat untuk siswa)
- carbonSavedKg: number (perkiraan reduksi emisi karbon jika dikelola dengan benar dalam kg, e.g. 0.08)`;

      let response;
      const fastConfig = {
        responseMimeType: "application/json",
        thinkingConfig: {
          thinkingBudget: 0,
        },
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            itemName: { type: Type.STRING },
            category: { type: Type.STRING },
            subMaterial: { type: Type.STRING },
            decompositionTime: { type: Type.STRING },
            recyclabilityScore: { type: Type.NUMBER },
            actionBadge: { type: Type.STRING },
            handlingSteps: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
            upcycleIdea: {
              type: Type.OBJECT,
              properties: {
                title: { type: Type.STRING },
                difficulty: { type: Type.STRING },
                description: { type: Type.STRING },
              },
              required: ["title", "difficulty", "description"],
            },
            ecoTip: { type: Type.STRING },
            carbonSavedKg: { type: Type.NUMBER },
          },
          required: [
            "itemName",
            "category",
            "subMaterial",
            "decompositionTime",
            "recyclabilityScore",
            "actionBadge",
            "handlingSteps",
            "upcycleIdea",
            "ecoTip",
            "carbonSavedKg",
          ],
        },
      };

      let responseResult;
      if (imageBase64) {
        const cleanBase64 = imageBase64.replace(/^data:image\/\w+;base64,/, "");
        responseResult = await generateContentWithFallback(ai, {
          contents: {
            parts: [
              {
                inlineData: {
                  mimeType: mimeType || "image/jpeg",
                  data: cleanBase64,
                },
              },
              { text: prompt },
            ],
          },
          config: fastConfig,
        });
      } else {
        responseResult = await generateContentWithFallback(ai, {
          contents: prompt,
          config: fastConfig,
        });
      }

      const text = responseResult.response.text || "{}";
      const parsed = JSON.parse(text);
      res.json({ success: true, data: parsed, source: responseResult.modelUsed });
    } catch (error: any) {
      console.error("Scan waste error:", error);
      // Fallback gracefully
      const sample = getFallbackWasteAnalysis(req.body.itemName || "Sampah Terdeteksi");
      res.json({ success: true, data: sample, error: error.message, source: "fallback" });
    }
  });

  // API 3: TERRA AI Chatbot ("Terri" Mascot Eco-Brick)
  app.post("/api/chat", async (req, res) => {
    try {
      const { messages, userMessage } = req.body;
      const ai = getGenAIClient();

      const systemInstruction = `Kamu adalah "Terri", maskot balok ramah & asisten AI pintar dari platform edukasi TERRA (Kenali, Pilah, Olah, Jaga Bumi).
Karakter & Gaya Jawabanmu:
- Ceria, ramah, edukatif, suka metafora balok (seperti merakit balok kebaikan untuk bumi).
- Berbahasa Indonesia santun, jelas, dan mudah dipahami siswa maupun keluarga.
- Jawab secara TEPAT dan RELEVAN dengan pertanyaan pengguna:
  * Jika ditanya definisi/pengertian (contoh: "sampah organik itu apa", "apa itu residu"), jelaskan pengertiannya secara gamblang, contoh-contoh barangnya, sifat penguraiannya, dan cara pemilahannya ke tong sampah yang benar.
  * Jika ditanya langkah/cara (contoh: "cara membuat kompos", "cara membuat ecobrick"), berikan langkah-langkah bernomor yang ringkas dan praktis.
  * Jika ditanya ide daur ulang, berikan ide kreasi unik (Waste to Worth).
- Format jawaban dengan Markdown rapi: gunakan bullet point, penomoran, dan teks tebal untuk istilah penting.
- Berikan penutup singkat penuh semangat khas TERRA!`;

      if (!ai) {
        const reply = getFallbackChatReply(userMessage);
        return res.json({ success: true, reply, source: "mock" });
      }

      // Build chat contents safely for Gemini API:
      // Rules: First message MUST be role 'user', and roles MUST strictly alternate (user -> model -> user -> model).
      const validContents: { role: "user" | "model"; parts: { text: string }[] }[] = [];

      if (Array.isArray(messages)) {
        for (const m of messages) {
          if (!m || !m.text || typeof m.text !== "string") continue;
          // Skip initial default welcome message if it was the bot
          if (m.id?.startsWith("welcome")) continue;

          const role: "user" | "model" = m.sender === "user" ? "user" : "model";

          // Must start with user
          if (validContents.length === 0 && role !== "user") {
            continue;
          }

          // If same role in consecutive turns, merge parts
          if (validContents.length > 0 && validContents[validContents.length - 1].role === role) {
            validContents[validContents.length - 1].parts[0].text += `\n\n${m.text}`;
          } else {
            validContents.push({
              role,
              parts: [{ text: m.text }],
            });
          }
        }
      }

      const currentPrompt = userMessage?.trim() || "Halo Terri!";

      // Ensure last message is current user prompt
      if (validContents.length > 0 && validContents[validContents.length - 1].role === "user") {
        if (validContents[validContents.length - 1].parts[0].text !== currentPrompt) {
          validContents.push({ role: "model", parts: [{ text: "Siap, apa ada pertanyaan selanjutnya?" }] });
          validContents.push({ role: "user", parts: [{ text: currentPrompt }] });
        }
      } else {
        validContents.push({ role: "user", parts: [{ text: currentPrompt }] });
      }

      const responseResult = await generateContentWithFallback(ai, {
        contents: validContents,
        config: {
          systemInstruction,
          temperature: 0.6,
          thinkingConfig: {
            thinkingBudget: 0,
          },
        },
      });

      const reply = responseResult.response.text || "Halo! Ada yang bisa Terri bantu tentang memilah atau mendaur ulang sampah hari ini?";
      res.json({ success: true, reply, source: responseResult.modelUsed });
    } catch (error: any) {
      console.error("Chat error:", error);
      const reply = getFallbackChatReply(req.body.userMessage);
      res.json({ success: true, reply, error: error.message, source: "fallback" });
    }
  });

  // API 4: TERRA Cycle - Upcycle Idea Generator
  app.post("/api/diy-idea", async (req, res) => {
    try {
      const { materialName } = req.body;
      const ai = getGenAIClient();

      if (!ai) {
        return res.json({
          success: true,
          idea: {
            title: `Pot Sukulen Unik dari ${materialName || "Botol Plastik"}`,
            materials: [`1 buah ${materialName || "Botol Plastik"}`, "Cat akrilik pastel", "Gunting/Cutter", "Tanah & Bibit tanaman sukulen"],
            steps: [
              "Gunting bagian tengah botol membentuk bentuk telinga kucing lucu.",
              "Buat 3 lubang kecil di dasar botol untuk drainase air siraman.",
              "Warnai dengan cat warna pastel soft favoritmu.",
              "Isi tanah subur dan tanam tanaman sukulen cantik!"
            ],
            difficulty: "Mudah (15 Menit)",
            impact: "Mencegah sampah plastik berakhir di TPA dan mempercantik meja belajar!",
          }
        });
      }

      const responseResult = await generateContentWithFallback(ai, {
        contents: `Buatkan 1 ide proyek kreasi daur ulang (Upcycling DIY / Waste into Worth) yang kreatif, seru, dan mudah dipraktikkan untuk barang/sampah: '${materialName || "Kardus bekas"}'.
Berikan output format JSON terstruktur:
- title: string (judul proyek menarik)
- materials: array of strings (alat dan bahan yang dibutuhkan)
- steps: array of strings (4-5 langkah pembuatan urut dan mudah)
- difficulty: string (e.g. "Mudah (15 Menit)", "Sedang (30 Menit)", "Kreatif (45 Menit)")
- impact: string (manfaat positif lingkungan & kegunaan barang baru)` ,
        config: {
          responseMimeType: "application/json",
          thinkingConfig: {
            thinkingBudget: 0,
          },
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              materials: { type: Type.ARRAY, items: { type: Type.STRING } },
              steps: { type: Type.ARRAY, items: { type: Type.STRING } },
              difficulty: { type: Type.STRING },
              impact: { type: Type.STRING },
            },
            required: ["title", "materials", "steps", "difficulty", "impact"],
          },
        },
      });

      const parsed = JSON.parse(responseResult.response.text || "{}");
      res.json({ success: true, idea: parsed, source: responseResult.modelUsed });
    } catch (error: any) {
      console.error("DIY Idea error:", error);
      res.json({
        success: true,
        idea: {
          title: `Organizer Meja Modular dari ${req.body.materialName || "Kardus Bekas"}`,
          materials: ["Kardus bekas", "Gunting & Lem kertas", "Kertas origami motif", "Penggaris"],
          steps: [
            "Potong kardus menjadi balok-balok kompartemen ukuran 8x8 cm.",
            "Rekatkan sisi-sisinya menggunakan lem kuat membentuk rak bertingkat.",
            "Bungkus dengan kertas warna pastel soft.",
            "Gunakan untuk merapikan pensil, penghapus, dan kuas lukismu!"
          ],
          difficulty: "Mudah (20 Menit)",
          impact: "Mengurangi sampah kardus rumah tangga menjadi barang multifungsi.",
        }
      });
    }
  });

  // API 5: Smart Bins IoT Status Telemetry
  app.get("/api/smart-bins", (_req, res) => {
    const bins = [
      {
        id: "BIN-01",
        location: "Gedung Utama - Lobi Edukasi",
        type: "Anorganik (Plastik & Kertas)",
        capacityPercent: 42,
        status: "Normal",
        batteryLevel: 94,
        temperatureC: 27.5,
        lastEmptied: "2 Jam lalu",
        colorBadge: "#BDE0FE",
      },
      {
        id: "BIN-02",
        location: "Kantin Sekolah Sehat",
        type: "Organik (Sisa Makanan)",
        capacityPercent: 88,
        status: "Perlu Dikosongkan",
        batteryLevel: 89,
        temperatureC: 29.8,
        lastEmptied: "5 Jam lalu",
        colorBadge: "#C7F9CC",
      },
      {
        id: "BIN-03",
        location: "Laboratorium Sains & Komputer",
        type: "B3 (Baterai & Lampu)",
        capacityPercent: 24,
        status: "Normal",
        batteryLevel: 98,
        temperatureC: 25.1,
        lastEmptied: "3 Hari lalu",
        colorBadge: "#FFF176",
      },
      {
        id: "BIN-04",
        location: "Taman Belakang & Gazebo",
        type: "Residu Umum",
        capacityPercent: 65,
        status: "Optimal",
        batteryLevel: 82,
        temperatureC: 28.0,
        lastEmptied: "3 Jam lalu",
        colorBadge: "#FFD166",
      }
    ];
    res.json({ success: true, bins, count: bins.length });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`TERRA App running on http://localhost:${PORT}`);
  });
}

function getFallbackWasteAnalysis(itemName?: string) {
  const query = (itemName || "botol plastik").toLowerCase();
  if (query.includes("daun") || query.includes("buah") || query.includes("makanan") || query.includes("sayur") || query.includes("nasi")) {
    return {
      itemName: itemName || "Sisa Kulit Buah & Daun Kering",
      category: "Organik",
      subMaterial: "Biomassa Organik Mudah Terurai",
      decompositionTime: "2 - 4 Minggu",
      recyclabilityScore: 98,
      actionBadge: "Komposkan",
      handlingSteps: [
        "Potong kecil-kecil agar mikroorganisme bekerja lebih cepat.",
        "Masukkan ke dalam komposter ember tumpuk atau biopori tanah.",
        "Taburkan sedikit sekam padi/tanah subur untuk menjaga kelembaban.",
        "Dalam 3-4 minggu panen pupuk organik cair & padat bernutrisi tinggi!"
      ],
      upcycleIdea: {
        title: "Pupuk Kompos Organik Rumahan (Eco-Enzyme)",
        difficulty: "Mudah",
        description: "Campurkan 1 bagian gula merah, 3 bagian kulit buah, dan 10 bagian air untuk membuat cairan pembersih serbaguna ramah lingkungan."
      },
      ecoTip: "Sampah organik yang tidak terolah menghasilkan gas metana di TPA. Dengan mengompos, kamu mencegah pemanasan global!",
      carbonSavedKg: 0.25
    };
  } else if (query.includes("baterai") || query.includes("obat") || query.includes("lampu") || query.includes("elektronik")) {
    return {
      itemName: itemName || "Baterai Bekas AA / AAA",
      category: "B3",
      subMaterial: "Logam Berat & Kimia Toksik (Kadmium/Litium)",
      decompositionTime: "100+ Tahun (Mencemari Air)",
      recyclabilityScore: 35,
      actionBadge: "Drop Point B3",
      handlingSteps: [
        "Tutup kutub positif dan negatif baterai dengan selotip isolasi bening.",
        "Simpan di wadah plastik kering tertutup dan jauh dari jangkauan balita.",
        "Jangan buang ke tempat sampah umum atau dibakar.",
        "Antarkan ke Drop Box E-Waste / B3 di Bank Sampah atau kantor kelurahan terdekat."
      ],
      upcycleIdea: {
        title: "Penyimpanan Khusus Kotak E-Waste Balok",
        difficulty: "Sedang",
        description: "Gunakan toples kaca tebal bertutup rapat berlabel 'E-Waste Only' sebelum diserahkan ke pengelola limbah resmi."
      },
      ecoTip: "Satu butir baterai kecil bisa mencemari hingga 600.000 liter air tanah jika dibuang sembarangan!",
      carbonSavedKg: 0.12
    };
  } else if (query.includes("kertas") || query.includes("kardus") || query.includes("buku")) {
    return {
      itemName: itemName || "Kardus Kemasan Karton",
      category: "Anorganik",
      subMaterial: "Serat Selulosa Kertas Karton Daur Ulang",
      decompositionTime: "2 - 5 Bulan",
      recyclabilityScore: 92,
      actionBadge: "Daur Ulang",
      handlingSteps: [
        "Lepaskan pita perekat plastik dan lakban yang menempel.",
        "Lipat kardus hingga pipih dan rapi untuk menghemat ruang penyimpanan.",
        "Jaga agar tetap kering dan bebas dari noda minyak atau makanan.",
        "Kumpulkan dan timbang di Bank Sampah untuk ditukar poin TERRA."
      ],
      upcycleIdea: {
        title: "Kotak Dokumen & Rak Balok Buku Mini",
        difficulty: "Mudah",
        description: "Potong sisi kardus miring 45 derajat, lapisi kertas kado/kertas daur ulang, jadilah magazine holder estetik."
      },
      ecoTip: "Mendaur ulang 1 ton kardus menyelamatkan 17 pohon dewasa dan menghemat 26.000 liter air!",
      carbonSavedKg: 0.45
    };
  }

  // Default: Botol Plastik PET
  return {
    itemName: itemName || "Botol Plastik Minuman PET (Kode #1)",
    category: "Anorganik",
    subMaterial: "Polyethylene Terephthalate (PETE #1)",
    decompositionTime: "450 - 500 Tahun",
    recyclabilityScore: 95,
    actionBadge: "Daur Ulang",
    handlingSteps: [
      "Habiskan cairan di dalam botol, lalu bilas sebentar dengan air bersih.",
      "Lepaskan label plastik pembungkus merk dan pisahkan tutup botolnya.",
      "Remas botol hingga pipih untuk memadatkan volume tempat sampah.",
      "Kumpulkan dalam kantong anorganik atau bawa ke Smart Bin / Bank Sampah."
    ],
    upcycleIdea: {
      title: "Pot Tanaman Hidroponik Sumbu (Wick System)",
      difficulty: "Mudah",
      description: "Potong botol menjadi 2 bagian. Balik bagian atas, pasang kain flanel sebagai sumbu nutrisi, isi tanah, dan tanam sayur kangkung/bayam."
    },
    ecoTip: "Botol PET yang didaur ulang bisa dipintal menjadi serat dakron untuk jaket hangat dan tas belanja!",
    carbonSavedKg: 0.18
  };
}

function getFallbackChatReply(msg?: string): string {
  const q = (msg || "").toLowerCase().trim();

  // 1. Organik & Sisa Makanan
  if (
    q.includes("organik") ||
    q.includes("sisa makanan") ||
    q.includes("kulit buah") ||
    q.includes("sisa sayur") ||
    q.includes("daun kering") ||
    q.includes("sisa dapur")
  ) {
    // Sub-case: Cara membuat kompos dari organik
    if (q.includes("kompos") || q.includes("cara olah") || q.includes("cara buat") || q.includes("pupuk")) {
      return `🌱 **Langkah Mudah Mengolah Sampah Organik Menjadi Kompos:**

1. **Pilah Bahan Hijau & Cokelat:**
   - *Bahan Hijau (Nitrogen):* Sisa sayuran mentah, kulit buah, ampas teh/kopi.
   - *Bahan Cokelat (Karbon):* Daun kering, sekam, serbuk gergaji, cacahan kardus polos.
2. **Cacah Kecil (2-3 cm):** Agar mikroba tanah bekerja lebih cepat dan hemat ruang.
3. **Metode Tumpuk Berlapis (Metode Balok):**
   - Lapisan bawah: Daun kering (penyerap cairan & sirkulasi udara).
   - Lapisan tengah: Sampah dapur/sisa buah.
   - Lapisan atas: Taburan sedikit tanah subur atau kompos matang (sebagai starter mikroba).
4. **Jaga Kelembaban:** Kondisi harus lembab seperti spons basah yang diperas (tidak becek).
5. **Panen (3-4 Minggu):** Kompos berwarna hitam gembur, harum bau tanah alami, dan siap menyuburkan tanamanmu! 🌿✨`;
    }

    return `🌱 **Apa itu Sampah Organik & Cara Pengelolaannya:**

**Sampah Organik** adalah sampah yang berasal dari sisa makhluk hidup (tumbuhan dan hewan) yang **mudah membusuk dan dapat terurai secara alami oleh mikroorganisme** dalam waktu singkat.

📦 **Contoh Nyata Sampah Organik:**
- **Sisa Dapur:** Kulit buah (pisang, jeruk, apel), potongan sayur, ampas kopi/teh, cangkang telur.
- **Sisa Makanan:** Nasi basi, sisa lauk (tulang ikan/ayam kecil), sisa roti.
- **Sampah Kebun:** Daun kering, ranting kecil, rumput liar, bunga layu.

♻️ **Cara Pengelolaan yang Benar:**
1. Buang ke **Tong Sampah Hijau (Organik)** tanpa kantong plastik/kresek.
2. **Olah Menjadi Kompos:** Gunakan komposter ember tumpuk, metode Takakura, atau lubang biopori.
3. **Cairan Eco-Enzyme:** Fermentasikan kulit buah + gula merah + air (rasio 3:1:10) selama 3 bulan untuk pembersih alami multifungsi!
4. **Pakan Maggot BSF:** Sampah organik sangat bernutrisi untuk budidaya larva Black Soldier Fly.

💡 *Tips Balok:* Jangan buang sampah organik di dalam plastik tertutup ke TPA karena akan menghasilkan gas metana yang memicu efek rumah kaca! 🧱🌍`;
  }

  // 2. Anorganik (Plastik, Botol, Kaca, Logam, Kaleng, Kardus)
  if (
    q.includes("anorganik") ||
    q.includes("an organic") ||
    q.includes("non organik") ||
    q.includes("non-organik")
  ) {
    return `🔵 **Apa itu Sampah Anorganik & Cara Pengelolaannya:**

**Sampah Anorganik** adalah sampah yang berasal dari bahan-bahan non-hayati (buatan pabrik atau sintetis) yang **tidak dapat membusuk secara alami** dan membutuhkan waktu puluhan hingga ratusan tahun untuk terurai.

📦 **Contoh Sampah Anorganik:**
- **Plastik:** Botol PET (#1), botol sampo/deterjen HDPE (#2), gelas air mineral PP (#5), kantong kresek LDPE (#4).
- **Kertas & Karton:** Kardus kemasan, buku tulis bekas, kertas HVS, koran, majalah.
- **Logam & Kaleng:** Kaleng minuman aluminium, kaleng susu kental manis, tutup botol logam, paku, kawat.
- **Kaca & Beling:** Botol kecap, toples selai kaca, pecahan cermin/piring kaca.

♻️ **Langkah Penanganan (Prinsip 3R):**
1. **Bersihkan & Keringkan:** Bilas sisa cairan/minyak agar tidak berbau dan mengundang lalat.
2. **Keringkan & Pipihkan:** Remas botol plastik atau lipat kardus untuk menghemat ruang penyimpanan.
3. **Pilah ke Tong Biru (Anorganik):** Pisahkan sesuai jenisnya (plastik, kertas, kaleng).
4. **Setor ke Bank Sampah / Smart Bin TERRA:** Sampah anorganik memiliki nilai ekonomis tinggi untuk didaur ulang kembali menjadi barang baru! 🧱💰`;
  }

  // 3. Plastik & Botol
  if (q.includes("plastik") || q.includes("botol") || q.includes("kresek") || q.includes("pet") || q.includes("sedotan")) {
    return `🥤 **Panduan Cerdas Memilah & Daur Ulang Plastik:**

Plastik memiliki kode daur ulang 1 sampai 7 dengan karakteristik berbeda:
- **PET / PETE #1 (Botol air mineral/jus):** Paling mudah didaur ulang! Lepas label, cuci bersih, dan remas hingga pipih.
- **HDPE #2 (Botol sampo, lotion, tutup botol):** Plastik tebal berkualitas tinggi, sangat disukai industri daur ulang.
- **LDPE #4 (Kantong kresek bening):** Kumpulkan dalam jumlah banyak untuk bahan baku ecobrick atau paving block daur ulang.
- **PP #5 (Cup boba, kotak makanan microwave):** Kuat dan tahan panas, bisa digunakan kembali (*reuse*) berkali-kali.

💡 *Tips Balok:* Jadikan botol plastik bekas sebagai pot hidroponik sumbu (*wick system*) atau celengan balok lucu! 🧱✨`;
  }

  // 4. Kertas & Kardus
  if (q.includes("kertas") || q.includes("kardus") || q.includes("karton") || q.includes("koran") || q.includes("buku")) {
    return `📦 **Pengelolaan Sampah Kertas & Kardus:**

1. **Jaga Tetap Kering & Bersih:** Kertas yang basah atau berminyak (seperti bungkus gorengan) tidak bisa didaur ulang dan masuk ke kategori Residu.
2. **Lepas Staples & Lakban Plastik:** Bersihkan perekat plastik dari kardus sebelum dilipat.
3. **Manfaat Daur Ulang:** Setiap 1 ton kertas yang didaur ulang menyelamatkan sekitar 17 pohon dewasa dan menghemat 26.000 liter air! 🌳
4. **Ide Upcycle:** Kardus tebal bisa dirakit menjadi kotak penyimpanan modul balok, organizer meja belajar, atau mainan miniatur rumah! 🧱`;
  }

  // 5. B3 (Bahan Berbahaya & Beracun / E-Waste)
  if (
    q.includes("b3") ||
    q.includes("baterai") ||
    q.includes("aki") ||
    q.includes("lampu") ||
    q.includes("neon") ||
    q.includes("obat") ||
    q.includes("racun") ||
    q.includes("elektronik") ||
    q.includes("e-waste")
  ) {
    return `⚠️ **Perhatian Khusus Sampah B3 (Bahan Berbahaya & Beracun):**

Sampah B3 mengandung zat kimia beracun, logam berat (merkuri, timbal, kadmium), atau zat mudah meledak/terbakar yang **SANGAT BERBAHAYA** jika dibuang sembarangan atau dibakar!

📦 **Contoh Sampah B3 di Rumah:**
- Baterai bekas (alkaline, lithium jam dinding/remote), aki bekas.
- Lampu neon (bohlam TL mengandung uap merkuri).
- Botol semprot aerosol (obat nyamuk, deodoran, pylox).
- Obat-obatan kadaluarsa, termometer air raksa, cairan pembersih porselen keras.
- Limbah elektronik (*E-Waste*): HP rusak, kabel putus, charger terbakar.

🛡️ **Aturan Penanganan Aman:**
1. **Jangan Dicampur** ke tong sampah biasa (organik/anorganik).
2. Tutup kutub (+) dan (-) baterai dengan isolasi/selotip bening untuk mencegah korsleting.
3. Simpan di wadah khusus berlabel **Kotak B3**.
4. Bawa dan setorkan ke **Drop Point E-Waste / B3 Dinas Lingkungan Hidup** atau Dropbox B3 resmi. 🛑🧱`;
  }

  // 6. Residu
  if (
    q.includes("residu") ||
    q.includes("popok") ||
    q.includes("pembalut") ||
    q.includes("pampers") ||
    q.includes("tisu") ||
    q.includes("sachet") ||
    q.includes("puntung") ||
    q.includes("styrofoam")
  ) {
    return `🗑️ **Mengenal Sampah Residu & Cara Menguranginya:**

**Sampah Residu** adalah jenis sampah yang **tidak dapat didaur ulang secara ekonomis maupun dikomposkan**, baik karena terkontaminasi kotoran biologis atau berbahan komposit berlapis-lapis.

📦 **Contoh Sampah Residu:**
- Popok bayi & pembalut sekali pakai.
- Tisu basah dan tisu kotor bekas pakai.
- Kemasan sachet multilayer (kombinasi plastik + foil aluminium tipis).
- Styrofoam kotor bekas makanan berkuah/berminyak.
- Puntung rokok, pecahan keramik halus, spons cuci piring aus.

📍 **Penanganan:**
- Masukkan ke **Tong Sampah Abu-Abu (Residu)** untuk dibawa ke Tempat Pemrosesan Akhir (TPA) berstandar sanitasi (*Sanitary Landfill*).
- **Aksi Terbaik:** Terapkan prinsip *Reduce* (kurangi) dengan beralih ke popok kain cuci ulang (*clothe diaper*), sapu tangan kain, dan wadah makan sendiri (*tumbler/lunchbox*). 🧱🌱`;
  }

  // 7. Kompos / Takakura / Biopori / Eco-Enzyme
  if (q.includes("kompos") || q.includes("pupuk") || q.includes("takakura") || q.includes("biopori") || q.includes("eco enzyme") || q.includes("eco-enzyme")) {
    return `🌱 **Panduan Membuat Kompos & Eco-Enzyme Rumahan:**

🧱 **A. Kompos Metode Takakura / Ember Tumpuk:**
1. Siapkan keranjang berpori dan bantalan sekam/daun kering di dasar.
2. Masukkan sisa potongan sayur dan buah yang sudah dicacah.
3. Aduk bersama sedikit kompos lama atau larutan EM4/air beras sebagai starter mikroba.
4. Tutup dengan kain berpori agar tidak dihinggapi lalat, diamkan selama 3-4 minggu hingga matang.

🍋 **B. Formula Ajaib Eco-Enzyme:**
- **Rumus Perbandingan:** **1 Bagian Gula Merah/Molase : 3 Bagian Kulit Buah Segar : 10 Bagian Air Bersih**
- Campurkan dalam wadah plastik kedap udara (jangan botol kaca).
- Buka tutupnya di 2 minggu pertama untuk membuang gas fermentasi.
- Panen di bulan ke-3 untuk mendapatkan cairan pembersih serbaguna dan pupuk cair ramah lingkungan! 🌿✨`;
  }

  // 8. Ecobrick & Ide Daur Ulang Kreatif (Waste into Worth)
  if (q.includes("ecobrick") || q.includes("eco brick") || q.includes("kerajinan") || q.includes("daur ulang") || q.includes("kreasi") || q.includes("upcycle") || q.includes("diy")) {
    return `🧱 **Cara Membuat Ecobrick Balok Padat (Waste into Worth):**

Ecobrick adalah botol plastik yang diisi padat dengan sampah plastik non-daur ulang (kresek, sachet bersih) untuk dijadikan balok bangunan ramah lingkungan!

🔨 **Langkah Membuat:**
1. **Siapkan Botol PET (Ukuran sama, misal 600 ml):** Pastikan bagian dalam kering total.
2. **Kumpulkan Sampah Plastik Kering & Bersih:** Potong sachet, bungkus makanan ringan, atau kresek kecil-kecil.
3. **Padatkan dengan Tongkat Kayu:** Masukkan plastik sedikit demi sedikit lalu tusuk dan tekan sekuat tenaga hingga keras seperti batu bata.
4. **Standar Kerapatan:** Botol 600 ml minimal berbobot **200 gram**.
5. **Rakit Jadi Furnitur:** Gabungkan ecobrick dengan lem tembak atau kawat untuk membuat kursi modular, meja kopi, atau pembatas taman! 🌟🧱`;
  }

  // 9. Prinsip 3R / 5R / Konsep Balok TERRA
  if (q.includes("3r") || q.includes("5r") || q.includes("terra") || q.includes("prinsip") || q.includes("balok")) {
    return `🧱🌍 **5 Tahap Balok TERRA untuk Menjaga Bumi:**

1. 🔍 **KNOW (Kenali):** Pahami jenis material sampah (Organik, Anorganik, B3, Residu) dan waktu penguraiannya di alam.
2. 📖 **LEARN (Pelajari):** Edukasi diri dan keluarga tentang dampak sampah terhadap pemanasan global dan krisis iklim.
3. 🗂️ **SORT (Pilah):** Pisahkan sampah langsung dari sumbernya menggunakan wadah warna modular yang tepat.
4. 🔨 **ACT (Olah/Aksi):** Terapkan 3R (*Reduce, Reuse, Recycle*), buat kompos, ecobrick, dan setor ke Bank Sampah.
5. 🛡️ **PROTECT (Jaga Bumi):** Sebarkan kebiasaan baik ini ke teman sekolah, keluarga, dan lingkungan sekitar! 💚`;
  }

  // 10. Salam / Sapaan
  if (
    q.includes("halo") ||
    q.includes("hai") ||
    q.includes("assalam") ||
    q.includes("pagi") ||
    q.includes("siang") ||
    q.includes("sore") ||
    q.includes("malam") ||
    q.includes("siapa kamu") ||
    q.includes("kamu siapa")
  ) {
    return `Halo Sahabat Bumi! 🧱✨ Aku **Terri**, maskot balok ramah dan asisten AI pintar dari TERRA.

Aku siap membantumu mempelajari:
1. 🌱 Pengertian & pengelolaan **Sampah Organik** (kompos, biopori, eco-enzyme).
2. 🔵 Cara memilah **Sampah Anorganik** (plastik, botol PET, kardus, kaleng).
3. ⚠️ Penanganan aman **Limbah B3** (baterai, lampu, e-waste).
4. 🔨 Ide kreasi daur ulang unik (**Ecobrick & Upcycling DIY**).

Ada sampah atau materi yang ingin kamu tanyakan hari ini? Yuk ketik pertanyaanmu! 😊`;
  }

  // 11. Ucapan Terima Kasih
  if (q.includes("terima kasih") || q.includes("makasih") || q.includes("makasi") || q.includes("thanks") || q.includes("keren") || q.includes("hebat") || q.includes("oke") || q.includes("sip")) {
    return `Sama-sama Sahabat Bumi! Senang sekali bisa membantu! 🧱🌟
Ingat, setiap balok kebaikan kecil yang kita pilah hari ini adalah pondasi kokoh untuk bumi yang lebih hijau dan lestari.

Jika ada pertanyaan lain seputar sampah atau daur ulang, jangan ragu untuk tanya Terri lagi ya! 💚🌏`;
  }

  // 12. Default Cerdas
  return `Halo! Pertanyaan yang sangat menarik tentang pengelolaan lingkungan! 🧱🌱

Di ekosistem **TERRA**, kita membagi pengelolaan sampah ke dalam 4 kategori utama:
- 🟢 **Organik:** Sisa makanan, sayur, buah, dan daun yang bisa diolah jadi kompos subur atau eco-enzyme.
- 🔵 **Anorganik:** Botol plastik, kaleng, kardus, dan kertas yang bernilai jual di Bank Sampah.
- 🟡 **B3 (Berbahaya):** Baterai, lampu neon, obat kadaluarsa, dan barang elektronik rusak yang butuh drop point khusus.
- ⚪ **Residu:** Popok, pembalut, tisu basah kotor, dan sachet yang harus dibuang ke TPA berizin.

💡 *Kamu bisa menanyakan:*
- *"Bagaimana cara membuat kompos di ember bekas?"*
- *"Sampah botol plastik jenis apa saja yang bisa didaur ulang?"*
- *"Cara membuang baterai bekas dengan aman"*
- *"Ide kerajinan dari kardus dan botol"*`;
}

startServer();
