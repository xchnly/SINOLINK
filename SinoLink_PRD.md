# Product Requirements Document
# SinoLink
**Aplikasi Terjemahan Mandarin ↔ Indonesia ↔ Inggris**

| | |
|---|---|
| **Versi** | 1.0.0 |
| **Tanggal** | Juni 2026 |
| **Status** | Draft |
| **Stack** | Next.js 14 + Tailwind CSS |
| **AI** | Google Gemini API (server-side proxy) |

---

## Daftar Isi

1. [Overview Produk](#1-overview-produk)
2. [Solusi Akses dari China](#2-solusi-akses-dari-china)
3. [Fitur Produk](#3-fitur-produk)
4. [Desain UX / UI](#4-desain-ux--ui)
5. [Spesifikasi Teknis](#5-spesifikasi-teknis)
6. [Roadmap Pengembangan](#6-roadmap-pengembangan)
7. [Analisis Risiko](#7-analisis-risiko)
8. [Success Metrics](#8-success-metrics)
9. [Open Questions](#9-open-questions)

---

## 1. Overview Produk

**Nama Produk:** SinoLink  
**Tagline:** Jembatan bahasa antara Mandarin, Indonesia, dan Inggris — dapat diakses dari mana saja, termasuk dari Tiongkok.

**Target User:** Profesional bisnis, pelajar, ekspatriat, dan pekerja logistik yang butuh terjemahan cepat antara 3 bahasa utama Asia-Pasifik.

### 1.1 Latar Belakang

Kebutuhan terjemahan antara Mandarin, Indonesia, dan Inggris sangat tinggi, terutama di lingkungan bisnis logistik dan perdagangan internasional. Namun solusi yang ada sering kali:

- Tidak mendukung pasangan bahasa Mandarin–Indonesia secara langsung
- Tidak dapat diakses dari Tiongkok karena blokir GFW (Great Firewall)
- Tidak memiliki konteks domain-spesifik (logistik, bisnis, dll.)

### 1.2 Tujuan Produk

1. Menyediakan terjemahan akurat untuk 6 pasangan bahasa: ZH↔ID, ZH↔EN, ID↔EN
2. Memastikan website dapat diakses dari Tiongkok melalui solusi proxy/relay
3. Memberikan UX yang bersih, cepat, dan mobile-friendly
4. Mendukung terjemahan teks panjang dan input suara (roadmap)

---

## 2. Solusi Akses dari China

### 2.1 Masalah: Google Services Diblokir di China

Google Gemini API (`generativelanguage.googleapis.com`) diblokir oleh Great Firewall China. Request langsung dari browser user di China ke Gemini API akan gagal.

**Solusi:** Pastikan request API tidak pernah keluar dari browser secara langsung ke Google, melainkan selalu melalui server Next.js yang berada di luar China.

### 2.2 Arsitektur: Server-Side Proxy via Next.js API Route

```
Browser User (China)
    ↓ HTTPS ke domain website (tidak diblokir)
Next.js Server (Cloudflare Edge – HK/Singapore)
    ↓ Server-to-server call (tidak terpengaruh GFW)
Google Gemini API
    ↓ Response JSON
Next.js Server → Browser User (China)
```

Dengan arsitektur ini, browser user di China **hanya berkomunikasi dengan domain website** (bukan domain Google). Selama domain website tidak diblokir, akses tetap lancar.

### 2.3 Implementasi: Next.js API Route Proxy

```typescript
// app/api/translate/route.ts
import { GoogleGenerativeAI } from '@google/generative-ai';

export async function POST(req: Request) {
  const { text, from, to } = await req.json();

  const genAI = new GoogleGenerativeAI(
    process.env.GEMINI_API_KEY! // Disimpan di server, tidak pernah ke client
  );

  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

  const prompt = buildPrompt(text, from, to);
  const result = await model.generateContent(prompt);

  return Response.json({
    translation: result.response.text()
  });
}
```

> ⚠️ **API Key Gemini TIDAK PERNAH dikirim ke browser.** Semua operasi dilakukan di server Next.js.

### 2.4 Pilihan Deployment untuk Aksesibilitas China

| Platform | Region | Aksesibilitas China | Rekomendasi |
|---|---|---|---|
| Vercel | Singapore, HK | ⚠️ Kadang tidak stabil | Cukup untuk MVP |
| **Cloudflare Pages + Workers** | **HK, Tokyo, SG** | **✅ Sangat baik** | **Rekomendasi Utama** |
| VPS Alibaba Cloud HK / Tencent Cloud HK | Hong Kong | ✅ Terbaik, latensi rendah | Untuk Produksi |
| Railway / Render | US/EU | ❌ Sering diblokir | Hindari |

**Rekomendasi:** Deploy di **Cloudflare Pages** (frontend) + **Cloudflare Workers** (API proxy). Cloudflare memiliki edge node di Hong Kong dengan latensi rendah dan aksesibilitas stabil dari China.

### 2.5 Checklist Domain untuk Aksesibilitas China

- [ ] Domain tidak mengandung kata "google", "gemini", atau brand yang diblokir
- [ ] SSL/HTTPS aktif (wajib)
- [ ] DNS menggunakan Cloudflare
- [ ] Tidak loading resource dari CDN yang diblokir (Google Fonts, Google Analytics)
- [ ] Gunakan self-hosted fonts atau Cloudflare CDN

---

## 3. Fitur Produk

### 3.1 Fitur MVP (P0 — Wajib Ada)

| Fitur | Deskripsi |
|---|---|
| Terjemahan Teks | Input teks, pilih bahasa sumber & target, tampilkan hasil dari Gemini |
| 6 Pasangan Bahasa | ZH→ID, ID→ZH, ZH→EN, EN→ZH, ID→EN, EN→ID |
| Auto-Detect Bahasa | Deteksi otomatis bahasa input |
| Swap Bahasa | Tukar posisi bahasa sumber dan target + konten dengan satu klik |
| Copy to Clipboard | Salin hasil terjemahan |
| Responsive UI | Mobile-first, berfungsi di HP dan desktop |

### 3.2 Fitur Lanjutan (P1 — Sprint 2)

| Fitur | Deskripsi |
|---|---|
| Dark / Light Mode | Toggle tema menggunakan Tailwind `dark:` |
| Riwayat Terjemahan | Simpan 10 terjemahan terakhir di `localStorage` |
| Karakter Counter | Tampilkan jumlah karakter input (batas 2000) |

### 3.3 Roadmap (P2 — Future)

| Fitur | Deskripsi |
|---|---|
| Input Suara | Speech-to-text untuk input Mandarin, Indonesia, Inggris |
| Terjemahan Dokumen | Upload `.txt` / `.docx` dan terjemahkan seluruh isi |
| Pinyin Display | Tampilkan Pinyin untuk output teks Mandarin |
| Simplified vs Traditional | Pilihan karakter Mandarin |

---

## 4. Desain UX / UI

### 4.1 Prinsip Desain

- **Clean & minimal:** satu fokus utama — area terjemahan
- **Speed-first:** animasi minimal, render cepat
- **Mobile-first:** UI didesain untuk layar 375px ke atas
- **Bilingual UI:** label antarmuka dalam Bahasa Indonesia (opsional Mandarin)

### 4.2 Layout Halaman Utama

```
┌──────────────── HEADER ────────────────┐
│  Logo SinoLink          [🌙 Toggle]   │
├──────────── LANGUAGE SELECTOR ─────────┤
│  [Mandarin ▾]   [⇄ Swap]  [Indonesia ▾]│
├──────────── TRANSLATION AREA ──────────┤
│  [Input Textarea]  │  [Output Area]    │
│  [Clear] [0/2000]  │  [Copy] [🔊]      │
├──────────────── HISTORY ───────────────┤
│  Riwayat 10 terjemahan terakhir        │
└──────────────── FOOTER ────────────────┘
```

### 4.3 Color Palette (Tailwind)

| Token | Light | Dark | Penggunaan |
|---|---|---|---|
| Primary | `blue-600` | `blue-400` | CTA, aktif state |
| Background | `white` | `slate-900` | Halaman |
| Surface | `slate-50` | `slate-800` | Card, textarea |
| Border | `slate-200` | `slate-700` | Input border |
| Text Primary | `slate-900` | `slate-50` | Teks utama |
| Text Secondary | `slate-500` | `slate-400` | Label, placeholder |
| Success | `green-500` | `green-400` | Konfirmasi copy |
| Error | `red-500` | `red-400` | Error, batas karakter |

---

## 5. Spesifikasi Teknis

### 5.1 Technology Stack

| Layer | Teknologi | Keterangan |
|---|---|---|
| Frontend | Next.js 14 (App Router) | SSR + SSG, SEO-friendly |
| Styling | Tailwind CSS v3 | Utility-first, dark mode support |
| AI / Translation | Google Gemini 1.5 Flash | Cepat, murah, akurasi tinggi |
| API Layer | Next.js API Routes | Server-side proxy, bypass GFW |
| State Management | React `useState` + Zustand | Sederhana, cukup untuk MVP |
| Deployment | Cloudflare Pages + Workers | Edge network dekat China |
| DNS / SSL | Cloudflare | CDN, SSL otomatis |

### 5.2 Struktur Project

```
sinolink/
├── app/
│   ├── api/
│   │   └── translate/
│   │       └── route.ts        ← Proxy ke Gemini API
│   ├── page.tsx                ← Halaman utama
│   └── layout.tsx
├── components/
│   ├── TranslateBox.tsx        ← Area input/output utama
│   ├── LanguageSelector.tsx    ← Dropdown pilih bahasa
│   ├── HistoryPanel.tsx        ← Riwayat terjemahan
│   └── ThemeToggle.tsx
├── lib/
│   ├── gemini.ts               ← Wrapper Gemini SDK
│   └── prompts.ts              ← Prompt templates
├── .env.local                  ← GEMINI_API_KEY (jangan di-commit!)
├── next.config.ts
└── tailwind.config.ts
```

### 5.3 Prompt Template untuk Gemini

```typescript
// lib/prompts.ts

const LANG_MAP: Record<string, string> = {
  zh: 'Chinese (Simplified Mandarin)',
  id: 'Indonesian',
  en: 'English',
};

export function buildTranslationPrompt(
  text: string,
  from: string,
  to: string
): string {
  return `You are a professional translator specializing in Chinese (Mandarin), Indonesian, and English.

Translate the following text from ${LANG_MAP[from]} to ${LANG_MAP[to]}.

Rules:
- Return ONLY the translated text, no explanation or preamble
- Preserve original formatting, numbers, and punctuation
- Use formal/professional register
- For Chinese output: use Simplified Chinese characters

Text to translate:
${text}`;
}
```

### 5.4 Type Definitions

```typescript
// types/index.ts

export type Language = 'zh' | 'id' | 'en';

export interface TranslateRequest {
  text: string;
  from: Language;
  to: Language;
}

export interface TranslateResponse {
  translation: string;
  error?: string;
}

export interface HistoryItem {
  id: string;
  from: Language;
  to: Language;
  input: string;
  output: string;
  timestamp: number;
}
```

### 5.5 Rate Limiting & Error Handling

- Rate limit per IP: maksimum **20 request/menit**
- Batas karakter input: **2000 karakter** per request
- Retry logic: 1x retry otomatis jika Gemini API timeout
- Tampilkan pesan error yang user-friendly, bukan raw error
- Loading skeleton selama menunggu response Gemini

### 5.6 Environment Variables

```bash
# .env.local
GEMINI_API_KEY=your_gemini_api_key_here

# Opsional untuk rate limiting
RATE_LIMIT_MAX=20
RATE_LIMIT_WINDOW_MS=60000
```

---

## 6. Roadmap Pengembangan

| Fase | Timeline | Deliverable |
|---|---|---|
| **MVP** | Minggu 1–2 | Setup Next.js + Tailwind, API route proxy Gemini, UI terjemahan dasar 6 pasangan bahasa, deploy ke Cloudflare |
| **v1.1** | Minggu 3–4 | Dark mode, riwayat localStorage, karakter counter, auto-detect bahasa, error handling lengkap |
| **v1.2** | Bulan 2 | Simplified/Traditional Chinese toggle, register formal/informal, Pinyin display |
| **v2.0** | Bulan 3 | Input suara (Web Speech API), upload `.txt` untuk terjemahan dokumen |

---

## 7. Analisis Risiko

| Risiko | Mitigasi | Level |
|---|---|---|
| Domain diblokir GFW | Gunakan domain yang tidak terkait Google; deploy di Cloudflare edge HK; hindari resource dari Google CDN | 🟡 SEDANG |
| Gemini API quota habis | Rate limiting per IP; caching terjemahan yang sama; monitoring di Google AI Studio | 🟡 SEDANG |
| Latency tinggi dari China | Deploy Cloudflare Workers (edge HK/Tokyo); minimalkan payload; streaming response | 🟡 SEDANG |
| API Key bocor | Simpan di env variable server saja; TIDAK PERNAH kirim ke client; `.env.local` di-gitignore | 🟢 RENDAH |
| Kualitas terjemahan buruk | Prompt engineering yang baik; feedback thumbs up/down; gunakan Gemini 1.5 Flash terbaru | 🟢 RENDAH |
| Biaya API membengkak | Gemini Flash sangat murah (~$0.075/1M token); rate limiter; monitoring usage | 🟢 RENDAH |

---

## 8. Success Metrics

### MVP (Minggu 1–4)
- [ ] Website dapat diakses dari IP China tanpa error
- [ ] Translation latency < 3 detik dari lokasi China
- [ ] Error rate API Gemini < 2%
- [ ] Core Web Vitals: LCP < 2.5s, CLS < 0.1

### Jangka Panjang
- [ ] DAU 100 user dalam bulan pertama setelah launch
- [ ] Average session duration > 2 menit
- [ ] Translation satisfaction rate > 80%
- [ ] Zero downtime untuk user China selama 30 hari berturut-turut

---

## 9. Open Questions

Keputusan yang masih perlu dibuat sebelum development dimulai:

1. **Nama domain** yang akan digunakan? (pastikan tidak mengandung kata yang diblokir GFW)
2. **Autentikasi user?** Jika ya → riwayat tersimpan di cloud. Jika tidak → cukup localStorage.
3. **Model Gemini:** Flash (lebih cepat/murah) vs Pro (lebih akurat)?
4. **Bahasa UI:** Indonesia saja, atau perlu versi Mandarin juga untuk user China?
5. **Monetisasi:** Apakah perlu premium tier atau iklan sejak awal?

---

*SinoLink · PRD v1.0 · Juni 2026*  
*Prepared by Hendry · SITC JiaXiang Logistics Indonesia*
