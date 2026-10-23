# Nemesis3D (Web Jersey) — Panduan Proyek untuk AI

## 1. Deskripsi Project
Nemesis3D adalah aplikasi web interaktif 3D Jersey Customizer & Generator untuk apparel olahraga. Aplikasi ini memungkinkan pengguna memilih jenis kain jersey, merancang motif prosedural atau mengimpor desain grafis, menempatkan logo secara presisi, serta melihat pratinjau 3D real-time dengan model jersey GLB dan preset kamera. Pengguna dapat mengekspor hasil dalam bentuk screenshot resolusi tinggi (hingga 4K), paket listing marketplace 5-in-1 (ZIP), video animasi 360° turntable (WebM), maupun batch export multi-desain.

## 2. Tech Stack
- **Bahasa & Runtime:** TypeScript 6.0, ES Modules (Node.js)
- **Framework UI & Bundler:** React 19.3, Vite 8.3
- **3D Engine:** Three.js 0.186 (WebGLRenderer, OrbitControls, GLTFLoader, MeshPhysicalMaterial)
- **Styling:** Tailwind CSS v4 (`@tailwindcss/vite`), Custom CSS Variables (8dp spacing & token warna Nemesis di `src/index.css`)
- **Icons & Linter:** Lucide React 1.60, Oxlint 1.88
- **Database & Storage:** Browser IndexedDB (Client-side, database `nemesis3d_db`, tanpa backend server)
- **Archive / Exporter:** Native zero-dependency PKZIP generator (`src/export/zip.ts`) & MediaRecorder API

## 3. Struktur Folder
- `src/batch/`: Pemrosesan & render massal multi-desain ke paket Master ZIP (`batchProcessor.ts`).
- `src/engine/`: Core engine Three.js meliputi inisialisasi scene, pencahayaan 3-titik/PMREM, kamera & preset, background, dan render loop.
- `src/export/`: Generator ekspor aset (screenshot multi-resolusi, listing pack marketplace ZIP, turntable video 360°, modul ZIP).
- `src/materials/`: Shader material PBR jersey dan generator normal map prosedural kain (Milano, Emboss, Microcool).
- `src/model/`: Mesh geometry fallback (placeholder jersey modular).
- `src/patterns/`: 5 generator motif prosedural Canvas 2D (Contour Peak, Fuji Ridge, Mocha Dust, Moss Strata, Merah Putih Ridge).
- `src/state/`: Skema JSON desain (`JerseyDesignSchema`), IndexedDB autosave/drafts, Undo/Redo history, dan encoder URL shareable.
- `src/texture/`: Canvas compositor (penggabung warna dasar, motif, logo, dan UV guide menjadi diffuse texture Three.js).
- `src/ui/`: Komponen React antarmuka (Header, ControlPanel, Viewer canvas 3D, CameraPresets, ValidationPanel, TemplateGallery, Modal).
- `public/`: Aset statis (model 3D `shirt_baked.glb`, preset katalog `templates.json`, ikon SVG).

## 4. Alur Utama
- **Routing & Navigasi:** SPA client-side berbasis state `currentStep` (1: Pilih Template, 2: Sesuaikan, 3: Pratinjau, 4: Export) di `src/App.tsx`, ditambah parameter URL hash `#d=<base64>` yang didecode via `src/state/shareLink.ts`.
- **Alur Data & Render:**
  1. Pengguna berinteraksi melalui `ControlPanel` atau memilih template dari `TemplateGallery`.
  2. State desain diperbarui di `App.tsx` (memicu pencatatan history stack untuk Undo/Redo dan autosave ke IndexedDB).
  3. `TextureCompositor` merender layer warna, motif, dan logo ke elemen `<canvas>` 2D, menghasilkan `THREE.CanvasTexture` (diffuse map).
  4. `Viewer.tsx` menyalurkan diffuse map dan spesifikasi bahan ke `JerseyMaterialManager` yang diaplikasikan ke model 3D (`shirt_baked.glb`).
  5. Saat diekspor, modul di `src/export/` atau `src/batch/` mengambil WebGL context / canvas buffer untuk menghasilkan PNG, ZIP, atau WebM.

## 5. Database
- **Platform:** Client-side IndexedDB browser (lokasi skema & helper: `src/state/indexedDb.ts`).
- **Nama DB & Versi:** `nemesis3d_db` (versi 1).
- **Tabel / Object Store:** `drafts` (primary key: `id`, index: `updatedAt`).
- **Entitas `DraftItem`:** `{ id, template_id, nama_desain, updatedAt, thumbnail (data URL 256x256), design (JerseyDesignSchema) }`.
- **Skema Lengkap:** Terdefinisi di `src/state/schema.ts` (`JerseyDesignSchema`). Tidak ada tabel/relasi SQL relasional atau server backend.

## 6. Konvensi Kode
- **Penamaan File:** PascalCase untuk React components (`Viewer.tsx`, `ControlPanel.tsx`), camelCase untuk file utilitas/engine (`textureCompositor.ts`, `jerseyMaterial.ts`).
- **Gaya Kode:** TypeScript strict mode, ES Modules, functional components dengan React Hooks (`useState`, `useRef`, `useCallback`, `useEffect`).
- **Penamaan Variabel:** camelCase berbahasa Indonesia / bilingual teknis sesuai domain jersey (`warnaDasar`, `bahan`, `diffuseMap`, `currentStep`).
- **Dokumentasi File:** JSDoc header berbahasa Indonesia di setiap file modul yang merujuk pada spesifikasi fitur / design tokens.
- **Zero-Dependency Exports:** Modul kompresi ZIP dan perekam video mengutamakan Web API murni browser tanpa package eksternal berat.

## 7. Cara Menjalankan
- **Install:** `npm install`
- **Run Dev:** `npm run dev` (berjalan di default `http://localhost:5173`)
- **Build:** `npm run build` (menjalankan `tsc -b && vite build`, output di folder `dist/`)
- **Lint:** `npm run lint` (menjalankan `oxlint`)
- **Test:** TODO: konfirmasi ke developer (belum ada framework testing otomatis di package.json)
- **Deploy:** TODO: konfirmasi ke developer (arsitektur statis SPA, siap dideploy ke static hosting seperti Vercel, Netlify, atau GitHub Pages)

## 8. Environment & Konfigurasi
- `vite.config.ts`: Konfigurasi build Vite dengan plugin React (`@vitejs/plugin-react`) dan Tailwind CSS (`@tailwindcss/vite`).
- `tsconfig.json`, `tsconfig.app.json`, `tsconfig.node.json`: Konfigurasi compiler TypeScript.
- `.oxlintrc.json`: Aturan linting Oxc/Oxlint.
- **Variabel ENV:** Tidak ada file `.env` yang digunakan saat ini (seluruh pemrosesan berjalan client-side). TODO: konfirmasi ke developer jika memerlukan environment variable khusus untuk deployment atau backend API di masa mendatang.

## 9. Jangan Disentuh
- `public/shirt_baked.glb`: File aset binary 3D model jersey produksi yang berisi UV map layout, normal texture bawaan, dan baked AO map.
- `node_modules/` & `dist/`: Direktori dependensi dan hasil build otomatis.
- `package-lock.json`: Lockfile manajemen dependensi npm.

## 10. Gotchas
- **Material GLB vs Placeholder:** `shirt_baked.glb` menggunakan material asli (`lambert1`) dengan normal map dan AO map bawaan. Jangan mengganti material GLB secara destruktif (`new MeshPhysicalMaterial`); modifikasi material harus menginjeksi diffuse/color via `trackActiveMesh` agar kerutan kain bawaan tidak hilang.
- **UV Texture Wrapping:** Layout UV model `shirt_baked.glb` memakai koordinat atlas [0,1]. Diffuse map harus diset `wrapS = wrapT = THREE.ClampToEdgeWrapping` (bukan `RepeatWrapping`) untuk mencegah artefak jahitan (seam line) dan perulangan motif yang salah.
- **Batasan URL Share:** Fungsi share URL (`#d=...`) sengaja mengecualikan binary base64 gambar/logo besar untuk mencegah crash akibat batasan panjang URL browser.
- **Dukungan MediaRecorder:** Perekaman video turntable mengandalkan codec WebM (VP9/VP8) browser. Format MP4 native tidak didukung oleh semua browser di sisi klien.
- **Offset Presets Kamera:** Pusat vertikal model `shirt_baked.glb` berada di Y ≈ -0.045, berbeda dari koordinat origin model placeholder prosedural.

---
Di akhir setiap sesi, update PROGRESS.md (status, file yang berubah, langkah berikutnya).
