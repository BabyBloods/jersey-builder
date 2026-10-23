# jersey-builder
Web untuk membuat mockup Jersey 3D interaktif.

## Tech Stack
- **React 19** + **TypeScript** + **Vite**
- **Three.js** untuk 3D Viewer & PBR rendering
- Custom PBR Materials (Milano, Emboss, Microcool)
- Canvas 2D Procedural Pattern & Texture Generator
- Export Screenshot (1K, 2K, 4K), Paket Listing 5-in-1, dan Video Turntable 360°

---

## 🐳 Menjalankan dengan Docker (Direkomendasikan)

Tidak perlu install Node.js / npm di komputer lokal, cukup gunakan Docker:

### 1. Mode Development (Live Reload / HMR)
Menjalankan web di mode dev dengan hot-reload otomatis:
```bash
docker compose up dev
```
Buka di browser: **[http://localhost:5173](http://localhost:5173)**

### 2. Mode Production (Nginx)
Menjalankan bundle produksi yang sangat cepat dan ringan via Nginx:
```bash
docker compose up --build prod
```
Buka di browser: **[http://localhost:8080](http://localhost:8080)**

### Menghentikan Container
```bash
docker compose down
```

---

## 💻 Menjalankan Tanpa Docker (Opsional via Node.js/npm)

Jika ingin menjalankan langsung dari host:
```bash
# Install dependencies
npm install

# Jalankan dev server
npm run dev

# Build produksi
npm run build
```
