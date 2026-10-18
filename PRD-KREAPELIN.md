# Spesifikasi Requirement: Web Latihan Tes Koran

## 1. Tujuan

Membuat web latihan tes koran dengan soal **unlimited** dan durasi **5 menit**, di mana setiap kali user menekan angka jawaban di keyboard:

- jawaban langsung dinilai,
- soal langsung berganti,
- tanpa scroll,
- tanpa tombol submit,
- tanpa reload halaman.

---

## 2. Aturan Soal

- Soal terdiri dari dua bilangan: `a` dan `b`.
- Masing-masing bilangan adalah bilangan **1 sampai 99** (1 atau 2 digit). Tidak menggunakan 0 sebagai bilangan soal.
- Operator hanya penjumlahan `a + b`.
- Jawaban benar adalah **digit terakhir / digit satuan** dari hasil `a + b`.

| Soal | Hasil | Jawaban benar |
|------|-------|---------------|
| 15 + 5 | 20 | 0 |
| 12 + 7 | 19 | 9 |
| 99 + 99 | 198 | 8 |

- Soal dibuat otomatis di browser secara acak. Tidak perlu database bank soal.
- Soal boleh berulang; tidak wajib menghindari soal yang sama.
- Soal baru langsung muncul setelah user menekan satu digit jawaban.

Rumus jawaban benar:

```text
correctDigit = (a + b) % 10
```

---

## 3. Alur Aplikasi / State

Aplikasi memiliki 3 status:

### A. IDLE — Sebelum Mulai

- Menampilkan judul, instruksi singkat, timer `05:00`, dan skor awal `0`.
- Tombol **Mulai**.
- Keyboard belum menerima input jawaban.

### B. RUNNING — Sedang Mengerjakan

- Timer berjalan mundur dari `05:00` sampai `00:00`.
- Soal pertama langsung ditampilkan.
- Setiap penekanan digit 0–9 langsung dianggap sebagai jawaban untuk soal yang sedang tampil.
- Setelah dinilai, aplikasi langsung:
  1. Update jumlah benar/salah.
  2. Generate soal baru.
  3. Tampilkan soal baru.
  4. Tetap siap menerima input berikutnya.
- Tidak ada tombol submit, tidak ada Enter, tidak ada scroll.

### C. FINISHED — Waktu Habis

- Timer berhenti di `00:00`.
- Input keyboard digit diabaikan.
- Menampilkan ringkasan hasil:
  - Jumlah benar
  - Jumlah salah
  - Total soal dijawab
  - Akurasi
  - Skor akhir
- Tombol **Ulangi** untuk reset dan mulai lagi.

---

## 4. Requirement Fungsional

| ID | Requirement |
|----|-------------|
| FR-01 | User dapat menekan tombol **Mulai** untuk memulai sesi 5 menit. |
| FR-02 | Saat mulai, timer diset ke 5 menit dan langsung berjalan. |
| FR-03 | Soal pertama langsung ditampilkan tanpa reload. |
| FR-04 | Setiap soal menampilkan format `a + b = ?`. |
| FR-05 | User menjawab dengan menekan angka 0–9 pada keyboard, termasuk numpad. |
| FR-06 | Setelah satu digit ditekan, aplikasi langsung menilai jawaban. |
| FR-07 | Jika jawaban benar, counter benar bertambah 1. |
| FR-08 | Jika jawaban salah, counter salah bertambah 1. |
| FR-09 | Setelah penilaian, soal baru langsung digenerate dan ditampilkan. |
| FR-10 | Tidak ada tombol submit; tidak perlu menekan Enter. |
| FR-11 | Input selain digit 0–9 diabaikan. |
| FR-12 | Event keyboard auto-repeat harus diabaikan (`e.repeat === true`), agar menahan tombol tidak menjawab banyak soal. |
| FR-13 | Setiap `keydown` digit dianggap jawaban untuk soal yang sedang tampil. Tidak ada buffer jawaban. |
| FR-14 | Timer menggunakan format `MM:SS`, mulai dari `05:00`. |
| FR-15 | Saat timer mencapai `00:00`, sesi berakhir dan input dinonaktifkan. |
| FR-16 | Setelah selesai, tampilkan ringkasan hasil. |
| FR-17 | Tombol **Ulangi** mereset timer, skor, dan soal. |
| FR-18 | Soal digenerate secara acak di client-side, tanpa backend. |
| FR-19 | Jumlah soal tidak terbatas selama waktu masih berjalan. |

---

## 5. Requirement UI/UX

| ID | Requirement |
|----|-------------|
| UX-01 | Layout menggunakan satu layar penuh, tanpa scroll. Gunakan `height: 100dvh` dan `overflow: hidden`. |
| UX-02 | Soal ditampilkan besar di tengah layar agar mudah dibaca. |
| UX-03 | Timer dan skor selalu terlihat di bagian atas. |
| UX-04 | Area soal memiliki ukuran tetap agar tidak terjadi layout shift saat soal berganti. |
| UX-05 | Tidak menggunakan input field teks. Gunakan global keyboard listener agar fokus tidak hilang. |
| UX-06 | Tidak ada animasi/transisi yang menunda munculnya soal baru. |
| UX-07 | Feedback benar/salah boleh ditampilkan singkat, tetapi tidak boleh menunda soal baru. Contoh: flash warna pada counter skor. |
| UX-08 | Tampilkan hint: **"Tekan angka 0–9 untuk menjawab"**. |
| UX-09 | Desain minimal, kontras tinggi, nyaman untuk latihan cepat. |
| UX-10 | *Opsional:* sediakan keypad angka on-screen untuk perangkat sentuh. Jika ada, tombol keypad memanggil fungsi jawaban yang sama dengan keyboard. |

---

## 6. Requirement Teknis

| ID | Requirement |
|----|-------------|
| TR-01 | Rekomendasi: React + Vite + Tailwind CSS, atau Vanilla JS jika ingin lebih sederhana. |
| TR-02 | Tidak wajib backend. Soal digenerate di browser. |
| TR-03 | Timer harus akurat. Gunakan `endTime = Date.now() + 300000` dan hitung sisa waktu berdasarkan selisih waktu, bukan hanya mengurangi counter setiap interval. |
| TR-04 | Update tampilan timer boleh setiap 100–250 ms, tetapi display cukup `MM:SS`. |
| TR-05 | Keyboard listener mendengarkan `keydown` pada `window`/`document`. |
| TR-06 | Deteksi digit: `e.key` bernilai `'0'`–`'9'` atau `e.code` bernilai `Numpad0`–`Numpad9`. |
| TR-07 | Abaikan jika `e.ctrlKey`, `e.altKey`, atau `e.metaKey` aktif. |
| TR-08 | Abaikan jika status bukan `RUNNING`. |
| TR-09 | Gunakan satu fungsi pusat, misalnya `submitAnswer(digit)`, untuk menilai jawaban, update skor, generate soal baru, dan render. |
| TR-10 | Pastikan tidak ada race condition: nilai jawaban, update counter, lalu generate soal baru dalam satu alur sinkron. |
| TR-11 | Tidak boleh ada loading state saat pergantian soal. |
| TR-12 | Aplikasi harus berjalan di Chrome, Edge, dan Firefox versi terbaru. |

---

## 7. State Data yang Perlu Dikelola

```text
status: "IDLE" | "RUNNING" | "FINISHED"
endTime: number | null
currentQuestion: { a: number, b: number, correctDigit: number } | null
correctCount: number
wrongCount: number
totalAnswered: number
```

Skor akhir yang ditampilkan:

- `correctCount`
- `wrongCount`
- `totalAnswered = correctCount + wrongCount`
- `accuracy = totalAnswered === 0 ? 0 : (correctCount / totalAnswered) * 100`

> **Skor utama = `correctCount`** (default). Jika ingin skor lain, harus ditentukan eksplisit.

---

## 8. Logika Inti yang Wajib Diimplementasikan

Pseudocode:

```text
startSession():
  status = RUNNING
  correctCount = 0
  wrongCount = 0
  totalAnswered = 0
  endTime = Date.now() + 300000
  currentQuestion = generateQuestion()
  render()

generateQuestion():
  a = random integer 1..99
  b = random integer 1..99
  correctDigit = (a + b) % 10
  return { a, b, correctDigit }

onKeyDown(event):
  if status !== RUNNING: return
  if event.repeat: return
  if event.ctrlKey || event.altKey || event.metaKey: return
  digit = mapKeyToDigit(event)
  if digit === null: return
  submitAnswer(digit)

submitAnswer(digit):
  if status !== RUNNING: return
  totalAnswered += 1
  if digit === currentQuestion.correctDigit:
    correctCount += 1
  else:
    wrongCount += 1
  currentQuestion = generateQuestion()
  render()

checkTimer():
  remaining = endTime - Date.now()
  if remaining <= 0:
    status = FINISHED
    renderResult()
  else:
    renderTimer(remaining)
```

---

## 9. Edge Cases yang Harus Ditangani

- **User menahan tombol angka** → hanya satu jawaban yang tercatat karena `e.repeat` diabaikan.
- **User menekan tombol non-digit** seperti Shift, Enter, panah → diabaikan.
- **User menekan dua digit sangat cepat** → digit pertama menjawab soal saat ini, digit kedua menjawab soal berikutnya. Ini sesuai perilaku "setiap keydown adalah jawaban untuk soal yang sedang tampil".
- **Timer habis tepat saat user menekan tombol** → jika status sudah `FINISHED`, jawaban diabaikan.
- **User belum menjawab sama sekali sampai waktu habis** → hasil menampilkan total 0, akurasi 0%.
- **Soal menghasilkan jawaban 0** → user harus bisa menekan 0 dan dinilai benar.
- **Numpad** → harus berfungsi sama seperti angka atas.
- **Halaman tidak boleh scroll** saat soal berganti atau saat feedback muncul.

---

## 10. Acceptance Criteria / Test Case

| No | Skenario | Hasil yang Diharapkan |
|----|----------|-----------------------|
| 1 | Klik **Mulai** | Timer mulai dari `05:00`, soal pertama muncul. |
| 2 | Soal `15 + 5`, user tekan `0` | Dinilai benar, counter benar +1, soal baru langsung muncul. |
| 3 | Soal `15 + 5`, user tekan `4` | Dinilai salah, counter salah +1, soal baru langsung muncul. |
| 4 | User tekan tombol `A` | Tidak terjadi apa-apa. |
| 5 | User menahan tombol `0` | Hanya satu jawaban tercatat. |
| 6 | User tekan numpad `7` | Dianggap jawaban digit 7. |
| 7 | Timer mencapai `00:00` | Input berhenti, ringkasan hasil muncul. |
| 8 | Setelah selesai user tekan angka | Tidak ada jawaban yang tercatat. |
| 9 | Klik **Ulangi** | Timer kembali `05:00`, skor reset, soal baru muncul. |
| 10 | Ganti soal berkali-kali | Halaman tidak scroll dan soal berganti instan. |

---

## 11. Deliverables untuk Agent

Agent harus menyerahkan:

- [ ] Source code aplikasi.
- [ ] README berisi cara menjalankan project.
- [ ] Implementasi timer 5 menit yang akurat.
- [ ] Implementasi generator soal 1–99 + 1–99.
- [ ] Implementasi penilaian digit terakhir.
- [ ] Implementasi keyboard listener digit 0–9 dan numpad.
- [ ] Implementasi auto-next setelah jawaban.
- [ ] Implementasi halaman hasil dan tombol **Ulangi**.
- [ ] Pastikan layout tanpa scroll.
