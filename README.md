# Tes Koran (Kraepelin) — Web Latihan

Web latihan tes koran (Kraepelin) dengan soal **unlimited** dan durasi **5 menit**.

## ✨ Fitur

- ⚡ Soal penjumlahan acak (1–99 + 1–99), jawab digit satuan
- ⏱ Timer 5 menit yang akurat (berbasis `Date.now()`)
- ⌨️ Input langsung via keyboard (angka 0–9, termasuk numpad)
- 📱 On-screen keypad untuk perangkat sentuh
- 🎯 Feedback visual instan (benar/salah)
- 📊 Ringkasan hasil di akhir (benar, salah, total, akurasi, skor)
- 🔄 Tombol **Ulangi** untuk sesi baru
- 🚫 Tanpa scroll, tanpa submit, tanpa reload

## 🚀 Cara Menjalankan

### Prasyarat

- [Node.js](https://nodejs.org/) v18+

### Instalasi & Jalankan

```bash
# Install dependencies
npm install

# Jalankan dev server
npm run dev
```

Buka URL yang muncul di terminal (biasanya `http://localhost:5173`).

### Build untuk Produksi

```bash
npm run build
npm run preview
```

## 🎮 Cara Bermain

1. Klik tombol **Mulai**
2. Soal penjumlahan akan muncul di layar
3. Tekan angka **0–9** di keyboard (jawaban = digit satuan dari hasil)
4. Soal baru langsung muncul setelah menjawab
5. Lanjut sampai waktu habis!

## 🛠 Tech Stack

- **Vite** — Build tool & dev server
- **Vanilla JS** — Tanpa framework
- **CSS** — Glassmorphism dark theme dengan animasi
