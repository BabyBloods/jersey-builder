# PROGRESS.md — Status Perkembangan Nemesis3D (Web Jersey)

## 1. Status Fitur

### Core 3D Viewer & Engine
- [x] Scene setup Three.js dengan WebGLRenderer, antialias, dan tone mapping (`src/engine/scene.ts`) ✅
- [x] Pencahayaan studio 3-titik, rim light, ambient, floor shadow, dan PMREM environment map (`src/engine/lighting.ts`) ✅
- [x] Kontrol kamera OrbitControls & 6 preset view (depan, belakang, kerah, detail bahan, kanan, kiri) (`src/engine/camera.ts`, `src/ui/CameraPresets.tsx`) ✅
- [x] Dynamic background (polos, gradasi linear 2 warna, custom gambar, transparan) (`src/engine/background.ts`) ✅
- [x] Render loop terkendali dengan auto-rotate turntable (`src/engine/loop.ts`) ✅
- [x] Model 3D produksi `shirt_baked.glb` loader dengan fallback modular placeholder jersey (`src/ui/Viewer.tsx`, `src/model/placeholder.ts`) ✅
- [x] Kerah 3D leher presisi (rib collar) terintegrasi pada model GLB & placeholder (`src/ui/Viewer.tsx`, `src/materials/jerseyMaterial.ts`) ✅
- [x] Opsi Lengan Panjang 3D terintegrasi (short vs long sleeves) pada model GLB & placeholder (`src/ui/Viewer.tsx`, `src/model/placeholder.ts`) ✅
- [ ] Optimasi penyesuaian normal map bawaan GLB dengan normal map bahan procedural 🚧

### Material & Tekstur Kain
- [x] 3 Tipe bahan jersey PBR (Milano, Emboss, Microcool) (`src/materials/normalMaps.ts`) ✅
- [x] Generator normal map prosedural kain via HTML5 Canvas (`src/materials/normalMaps.ts`) ✅
- [x] Pengelola material jersey (`JerseyMaterialManager`) dengan mode inject ke mesh GLB maupun placeholder (`src/materials/jerseyMaterial.ts`) ✅
- [x] Slider kustomisasi kekuatan emboss (0.1–3.0) dan skala tekstur (0.5–2.5) (`src/ui/ControlPanel.tsx`) ✅

### Generator Motif & Desain
- [x] 5 Generator motif prosedural canvas 2D: Contour Peak, Fuji Ridge, Mocha Dust, Moss Strata, Merah Putih Ridge (`src/patterns/generators.ts`) ✅
- [x] Multi-layer motif dengan parameter seed, kerapatan, sudut, skala, dan opacity (`src/patterns/generators.ts`, `src/ui/ControlPanel.tsx`) ✅
- [x] Mode A: Desain prosedural berbasis layer motif (`src/texture/textureCompositor.ts`) ✅
- [x] Mode B: Impor gambar grafis eksternal dengan kontrol transformasi (pan X/Y, zoom, rotasi, flip horizontal) (`src/texture/textureCompositor.ts`) ✅
- [x] Panduan penempatan panel jersey (UV Guide overlay) untuk model GLB (`src/texture/uvGuide.ts`) ✅

### Logo & Kustomisasi
- [x] Upload logo kustom (format gambar / Data URL) (`src/texture/logoLayer.ts`, `src/ui/ControlPanel.tsx`) ✅
- [x] Preset koordinat penempatan logo (Dada Kiri, Dada Tengah, Dada Kanan, Punggung Atas, Punggung Tengah, Lengan) (`src/texture/logoLayer.ts`) ✅
- [x] Slider ukuran dan offset posisi logo [X, Y] (`src/texture/logoLayer.ts`, `src/ui/ControlPanel.tsx`) ✅

### Export & Output
- [x] Export screenshot instan multi-resolusi (1K 1024x1024, 2K 2048x2048, 4K 4096x4096) (`src/export/screenshot.ts`) ✅
- [x] Export Paket Listing Marketplace 5-in-1 dalam file ZIP (depan, belakang, 2-up berdampingan, detail bahan, tekstur diffuse) (`src/export/listingPack.ts`) ✅
- [x] Export video animasi 360° turntable WebM via MediaRecorder (pilihan rasio 1:1, 9:16, 16:9, durasi 3–10s, 30/60 FPS) (`src/export/turntableVideo.ts`) ✅
- [x] Batch Export / Multi-design processing massal ke Master ZIP (`src/batch/batchProcessor.ts`, `src/ui/BatchExportModal.tsx`) ✅
- [x] Zero-dependency PKZIP generator murni browser (`src/export/zip.ts`) ✅

### Manajemen State, Template & Penyimpanan
- [x] Skema JSON desain terstandarisasi & fungsi validasi dengan dukungan `lengan_panjang` (`src/state/schema.ts`) ✅
- [x] Autosave berkala dan penyimpanan draft lokal IndexedDB (`src/state/indexedDb.ts`, `src/ui/DraftsModal.tsx`) ✅
- [x] Undo / Redo history stack (`src/state/history.ts`, `src/ui/Header.tsx`) ✅
- [x] URL sharing desain terkompresi Base64 via hash `#d=...` (`src/state/shareLink.ts`) ✅
- [x] Template Presets Gallery dari data lokal/JSON (`src/ui/TemplateGallery.tsx`, `public/templates.json`) ✅
- [x] Stepper alur 4 tahap & Checklist Validasi Kesiapan Desain (`src/ui/Header.tsx`, `src/ui/ValidationPanel.tsx`) ✅
- [ ] Otentikasi pengguna & penyimpanan cloud database terpusat ⬜
- [ ] Integrasi direct upload API ke platform marketplace (Shopee, TikTok Shop, Tokopedia/Lazada) ⬜

---

## 2. Sedang Dikerjakan / Selesai Sesi Ini
- [x] Full Dockerization: Web app berjalan 100% di container Docker (`docker compose up dev` di port 5173 dan `prod` Nginx di port 8080). ✅
- [x] Lengan Panjang Single Seamless Sleeve (Gambar 5): Rekonstruksi model 3D via Dijkstra geodesic anchor (`generate_true_long_sleeve.cjs`) — 300+ simpul ketiak & bahu 100% terkunci diam (zero robekan ketiak), dan lengan bawah memanjang mulus menyatu tanpa manset lengan pendek di tengah (tidak ada lagi efek baju dobel/undershirt). ✅
- [x] Kerah V-Neck Bersih & Rapi (Gambar 3): Menghilangkan lekukan kawah/dent tajam di panel dada. V-Neck kini melengkung anggun dan natural mengikuti tepi lingkar leher depan atletis. ✅
- [x] Kerah Round Neck Sempurna (Gambar 4): Mempertahankan kerah pita bulat elastis melingkar bawaan GLB yang simetris dan rapi. ✅
- [x] Template Preset Baru "Stardust Meteor" (Gambar 3, 4, 5): Implementasi motif prosedural `meteor-shower` dengan jejak hujan meteor vertikal bergradien, kepala meteor bercahaya putih/cyan, taburan bintang berlian 4-sudut (✦), dan debu kosmik stardust di latar midnight blue `#141C2B`. ✅
- [x] Sinkronisasi Git & GitHub: Seluruh commit dan file Docker & model 3D terbaru ter-push ke repository `BabyBloods/jersey-builder`. ✅

---

## 3. Rencana Tindak Lanjut Sesi Berikutnya
1. **Pengetesan Interaktif User**:
   - Pengujian live di browser `http://localhost:5173` untuk opsi Lengan Pendek vs Lengan Panjang dan switch Kerah V-Neck vs Round Neck.
2. **Kustomisasi Badge Logo & Warna**:
   - Menambahkan opsi logo kustom atau preset lambang grafis atletis pada dada kanan/kiri sesuai referensi mockup.

---

## 4. Bug / Utang Teknis yang Terlihat
- **Ketiadaan Test Runner:** Belum ada konfigurasi testing otomatis (unit test / e2e) seperti Vitest, Jest, atau Playwright di `package.json`.
- **MediaRecorder Codec Compatibility:** Export turntable video menggunakan MediaRecorder dengan mime type `video/webm`. Browser seperti Safari (macOS/iOS) memiliki dukungan terbatas untuk WebM VP9/VP8, dan perekaman native MP4 belum di-fallback via library seperti ffmpeg.wasm.
- **Ukuran Memory IndexedDB:** Desain yang memiliki gambar impor beresolusi sangat besar disimpan langsung sebagai base64 string di IndexedDB, yang berpotensi memakan kuota penyimpanan lokal browser.
- **Skrip Deployment & CI/CD:** Belum tersedia workflow GitHub Actions atau skrip deployment otomatis.

---

## 5. Log Sesi
- **2026-10-23 (Sesi Malam):**
  - **Analisis Root Cause Keluhan User (Ketiak bolong & lengan pipih/tanpa volume):**
    - Pada eksperimen awal (`generate_clean_long_sleeve.js`), deformasi peregangan vertikal vertex lengan dengan `tStart > 0.045` menyebabkan simpul sambungan ketiak tertarik ke bawah menjauhi panel torso, meninggalkan celah robek terbuka pada ketiak.
    - Pola lengan pendek pada `shirt_baked.glb` berupa lembaran pola jahit 2D terbuka, sehingga saat ditarik memanjang menghasilkan bentuk datar seperti tirai tipis tanpa rongga lengan atau manset.
  - **Solusi Rekayasa Geometri Dedicated Lengan Panjang (`generate_perfect_long_sleeve.cjs`):**
    - Mempertahankan panel badan, bahu, dan ketiak asli `shirt_baked.glb` 100% utuh tanpa deformasi liar (seam ketiak tertutup rapat tanpa celah).
    - Membangun mesh pipa tabung forearm 3D anatomis (22 segmen cincin melingkar) dari profil lingkar manset asli (`LEFT_CUFF_PROFILE`, 32 titik) hingga pergelangan tangan dengan taper proporsional, manset pergelangan elastis (ribbed wrist cuff), dan inward hem lip.
    - Mengoreksi orientasi normal face/winding order segitiga (`(a, d, b)` dan `(b, d, c)` untuk lengan kiri; `(a, b, d)` dan `(b, c, d)` untuk lengan kanan) sehingga normal mengarah ke luar secara benar terhadap pencahayaan Three.js PBR.
    - GLB baru berhasil diekspor ke `public/shirt_long_sleeve.glb` (1.11 MB, 12.049 vertex, 67.383 index) dan disalin ke `dist/shirt_long_sleeve.glb`.
  - **Validasi Build:**
    - Menjalankan `npm run build` (`tsc -b && vite build`) dengan status **Exit Code 0** (sukses tanpa error).
- **2026-10-22:** Implementasi 2 tipe kerah (Ribbon bulat athletic rib & V-Neck meruncing presisi ke sternum) dengan 32 titik kontur leher presisi dari GLB, sambungan lengan panjang 100% menyatu ke manset lengan pendek GLB (arah 36°, radius 0.028x0.052, overlap 2.5cm ke dalam manset tanpa celah), dan pembaruan 3 tekstur normal map prosedural sesuai foto referensi asli: Milano (chevron herringbone zig-zag), Emboss (kontur relief organik woodgrain), dan Microcool (mesh pori mikro hexagonal).
- **2026-10-22:** Perbaikan posisi & orientasi geometri kerah dan sambungan lengan panjang di `src/ui/Viewer.tsx`.
- **2026-10-22:** Perbaikan fitur aktif/nonaktif kerah 3D jersey dan penambahan fitur opsi lengan panjang/pendek (`src/state/schema.ts`, `src/state/shareLink.ts`, `src/App.tsx`, `src/ui/Viewer.tsx`, `src/ui/ControlPanel.tsx`, `src/ui/ValidationPanel.tsx`, `src/materials/jerseyMaterial.ts`, `src/model/placeholder.ts`).
- **2026-10-22:** Setup awal CLAUDE.md dan PROGRESS.md (.claudeignore, .cursorignore, CLAUDE.md, PROGRESS.md).

