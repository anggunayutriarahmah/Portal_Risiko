# Backend Golang & MySQL Database Engine
## PT Pupuk Sriwidjaja Palembang - Enterprise Risk Management

Dokumentasi implementasi backend menggunakan **Golang 1.22+** dan **MySQL 8.0** dengan arsitektur sinkronisasi real-time antar modul risiko korporat.

### 1. Struktur Arsitektur
- **Database Engine**: MySQL 8.0 / InnoDB dengan UTF8MB4 Collation
- **API Server**: Golang REST Microservice dengan connection pool GORM & Goroutines
- **Sync Mechanism**: Real-time cross-module event dispatching (<10ms latency)
- **Modul Terintegrasi**:
  1. Unit Kerja (Identifikasi & Pendaftaran Risiko)
  2. Atasan / VP (Supervisory Review & Verification)
  3. Risk Admin Korporat (Approval, Penugasan PIC, Alokasi Kode RSK)
  4. Pengendalian Risiko (Monitoring Triwulan TW 1 - TW 4)
  5. Evaluasi & Carry Over (Evaluasi Tahunan & Carry Over ke RKAP Berikutnya)

### 2. Cara Menjalankan di Server Produksi
```bash
# 1. Setup Database MySQL
mysql -u root -p < schema.sql

# 2. Build & Jalankan Service Golang
cd server/backend_go
go mod init pusri-risk-backend
go mod tidy
go run main.go
```

Endpoint REST API Golang aktif di port `8080` dan terhubung langsung ke frontend Pusri Risk Portal.
