# Portal Risiko Pusri

Portal manajemen risiko PT Pupuk Sriwidjaja Palembang.

## Menjalankan secara lokal

**Prasyarat:** Node.js dan MySQL.

1. Install dependencies dengan `npm install`.
2. Salin `.env.example` menjadi `.env`, lalu sesuaikan konfigurasi MySQL lokal (`MYSQL_HOST`, `MYSQL_PORT`, `MYSQL_USER`, `MYSQL_PASSWORD`, dan `MYSQL_DATABASE`).
3. Jalankan aplikasi dengan `npm run dev`.

Data akun IAM, risiko, organisasi, dan sumber risiko dibaca dari MySQL yang dikonfigurasi. Perubahan data tersebut harus tersimpan di MySQL agar digunakan aplikasi; data akun dari berkas snapshot lokal tidak digunakan sebagai sumber daftar akun.
