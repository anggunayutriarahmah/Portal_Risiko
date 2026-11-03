# Panduan Kolaborasi Pengembang (Frontend & Backend Developer)
## Portal Manajemen Risiko Korporat PT Pupuk Sriwidjaja Palembang (2026)

Dokumen ini menjelaskan alur kerja, struktur folder, cara menjalankan, mengembangkan, dan mengakses aplikasi secara terpisah maupun terintegrasi bagi pengembang **Frontend** dan **Backend**.

---

## 1. Arsitektur Proyek

Aplikasi ini dirancang dengan pemisahan tanggung jawab (*Separation of Concerns*) yang rapi:

```
├── .env                       # Variabel lingkungan & konfigurasi database MySQL
├── server.ts                  # Backend Utama (Node.js/Express REST API + Auto-Sync MySQL)
├── server/
│   ├── mysql.ts               # Driver pool koneksi MySQL (mysql2/promise) & SQL Query
│   ├── db.ts                  # In-memory database & business logic fallback
│   └── backend_go/            # Opsi Microservice Backend (Golang 1.22 + GORM/Driver MySQL)
│       ├── main.go            # REST API Service Golang (Port 8080)
│       └── schema.sql         # Skema database DDL & DML MySQL 8.0 InnoDB
├── src/                       # Frontend SPA (React 19 + TypeScript + Vite + Tailwind CSS)
│   ├── components/            # Komponen UI (Header, Sidebar, Modals, dll)
│   ├── components/views/      # Halaman/Menu (Identifikasi, Review VP, Approval Admin, dll)
│   ├── services/api.ts        # Client API SDK (penghubung Frontend ke REST API)
│   ├── types/pusri.ts         # Type definition TypeScript (Enterprise Risk Models)
│   └── App.tsx                # Main Container & State Manager
└── package.json               # Konfigurasi dependensi dan perintah run script
```

---

## 2. Cara Kerja Bagi Pengembang FRONTEND

### Fokus Pekerjaan Frontend:
- Mengembangkan antarmuka pengguna (UI), formulir, validasi input, tampilan matriks 5x5, dan responsive view.
- Mengelola state komponen dan interaksi pengguna.
- Menghubungkan tampilan ke API melalui `src/services/api.ts`.

### Folder yang Dikerjakan:
1. `src/components/views/`: Komponen halaman seperti `IdentifikasiView.tsx`, `ReviewVpView.tsx`, `ApprovalAdminView.tsx`, `PengendalianTwView.tsx`, dll.
2. `src/components/`: Komponen reusable seperti `Sidebar.tsx`, `Header.tsx`, `RiskTable.tsx`, `RiskMatrix5x5.tsx`.
3. `src/services/api.ts`: Tempat Frontend memanggil endpoint Backend (`fetch('/api/...')`).
4. `src/types/pusri.ts`: Model tipe data TypeScript.

### Cara Menjalankan Frontend:
Cukup jalankan di terminal:
```bash
npm run dev
```
Akses di browser: `http://localhost:3000`

> **Catatan**: Server development telah mengintegrasikan Vite middleware langsung dengan API backend, sehingga Anda dapat langsung melihat perubahan UI (Hot-Reload) sekaligus mencoba API secara nyata tanpa konfigurasi rumit CORS.

---

## 3. Cara Kerja Bagi Pengembang BACKEND

### Fokus Pekerjaan Backend:
- Mengelola skema tabel MySQL, relasi Foreign Keys, dan integritas data.
- Menambahkan atau memperbarui endpoint REST API (`GET`, `POST`, `PUT`, `DELETE`).
- Mengatur validasi bisnis, otentikasi role, dan jejak audit (*Audit Trail*).

### Pilihan Backend yang Tersedia:

#### Pilihan A: Backend Node.js / TypeScript (`server.ts` & `server/mysql.ts`) - Rekomendasi
Backend ini aktif secara default saat menjalankan `npm run dev` atau `npm start`.
- **Lokasi File**:
  - `server.ts`: Daftar seluruh rute REST API (`/api/risks`, `/api/departments`, `/api/users`, dll).
  - `server/mysql.ts`: Fungsi eksekusi query SQL (`saveRiskToMySql`, `loadRisksFromMySql`, `getTableData`).
  - `.env`: Konfigurasi host, user, password, dan nama database MySQL.
- **Cara Menjalankan**:
  ```bash
  npm run dev:backend
  ```
- **Cara Mengakses / Menguji API**:
  Anda dapat menggunakan Postman, Thunder Client, atau cURL ke `http://localhost:3000/api/...`. Contoh:
  ```bash
  curl http://localhost:3000/api/risks
  curl http://localhost:3000/api/database/connection
  ```

#### Pilihan B: Backend Golang 1.22 Microservice (`server/backend_go/`)
Bagi yang ingin menjalankan REST API murni menggunakan bahasa Golang:
- **Lokasi File**:
  - `server/backend_go/go.mod`: Definisi modul Go (`pusri-risk-backend`).
  - `server/backend_go/main.go`: Server HTTP Golang mandiri (port 8080).
  - `server/backend_go/models/`: Model data risiko dan event sinkronisasi.
  - `server/backend_go/schema.sql`: File SQL untuk inisialisasi tabel database.
- **Cara Menjalankan**:
  ```bash
  npm run backend:go
  ```
  Atau manual dari terminal:
  ```bash
  cd server/backend_go
  go run main.go
  ```
- Backend Golang akan berjalan di `http://localhost:8080` dan mengekspos endpoint seperti:
  - `GET http://localhost:8080/api/v1/risks`
  - `POST http://localhost:8080/api/v1/risks`

---

## 4. Cara Pengaturan Database MySQL (Localhost)

1. Pastikan servis MySQL (XAMPP / Laragon / Docker / MySQL Service) sudah berjalan di port `3306`.
2. Buka terminal atau GUI (HeidiSQL, DBeaver, phpMyAdmin).
3. Jalankan perintah pembuatan database dan import:
   ```bash
   mysql -u root -p -e "CREATE DATABASE IF NOT EXISTS pusri_risk_db;"
   mysql -u root -p pusri_risk_db < server/backend_go/schema.sql
   ```
4. Periksa file `.env` di root proyek:
   ```env
   MYSQL_HOST=localhost
   MYSQL_PORT=3306
   MYSQL_USER=root
   MYSQL_PASSWORD=
   MYSQL_DATABASE=pusri_risk_db
   ```
5. Buka web di `http://localhost:3000`, masuk ke menu **Pengaturan & Profil Pengguna**, lalu klik tombol **"Tes Koneksi ke MySQL Localhost"**.

---

## 5. Ringkasan Pembagian Tugas (Cheat Sheet)

| Posisi | Folder / File Utama | Perintah Run | Akses / Output |
| :--- | :--- | :--- | :--- |
| **Frontend** | `/src/**`, `/index.html` | `npm run dev` | `http://localhost:3000` (Web UI) |
| **Backend Node** | `/server.ts`, `/server/mysql.ts`, `.env` | `npm run dev` | `http://localhost:3000/api/*` (REST API) |
| **Backend Go** | `/server/backend_go/main.go` | `npm run backend:go` | `http://localhost:8080/api/v1/*` |
| **Database** | `/server/backend_go/schema.sql` | `mysql -u root -p` | Tabel `pusri_risk_db` di MySQL |
