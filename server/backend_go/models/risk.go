package models

import "time"

// RiskLevel defines Pusri 5x5 matrix risk grade
type RiskLevel string

const (
	RiskLevelHigh      RiskLevel = "High"
	RiskLevelModToHigh RiskLevel = "Mod to High"
	RiskLevelModerate  RiskLevel = "Moderate"
	RiskLevelLowToMod  RiskLevel = "Low to Mod"
	RiskLevelLow       RiskLevel = "Low"
)

// PusriRisk represents the core risk entity stored in MySQL pusri_risks
type PusriRisk struct {
	ID                          string             `gorm:"primaryKey;column:id;type:varchar(64)" json:"id"`
	KodeRisiko                  string             `gorm:"uniqueIndex;column:kode_risiko;type:varchar(64)" json:"kodeRisiko"`
	KodeOrganisasi              string             `gorm:"index;column:kode_organisasi;type:varchar(32)" json:"kodeOrganisasi"`
	NamaOrganisasi              string             `gorm:"column:nama_organisasi;type:varchar(255)" json:"namaOrganisasi"`
	Tahun                       int                `gorm:"index;column:tahun" json:"tahun"`
	SasaranRKAP                 string             `gorm:"column:sasaran_rkap;type:text" json:"sasaranRKAP"`
	SasaranUnitKerja            string             `gorm:"column:sasaran_unit_kerja;type:text" json:"sasaranUnitKerja"`
	KonteksEksternal            string             `gorm:"column:konteks_eksternal;type:text" json:"konteksEksternal"`
	KonteksInternal             string             `gorm:"column:konteks_internal;type:text" json:"konteksInternal"`
	SumberRisiko                string             `gorm:"column:sumber_risiko;type:varchar(255)" json:"sumberRisiko"`
	PernyataanRisiko            string             `gorm:"column:pernyataan_risiko;type:text;not null" json:"pernyataanRisiko"`
	PenyebabRisiko              string             `gorm:"column:penyebab_risiko;type:text;not null" json:"penyebabRisiko"`
	DampakRisiko                string             `gorm:"column:dampak_risiko;type:text;not null" json:"dampakRisiko"`
	PengendalianExisting        string             `gorm:"column:pengendalian_existing;type:text" json:"pengendalianExisting"`
	KategoriRisiko              string             `gorm:"index;column:kategori_risiko;type:varchar(64)" json:"kategoriRisiko"`
	KriteriaDampakKey           string             `gorm:"column:kriteria_dampak_key;type:varchar(64)" json:"kriteriaDampakKey,omitempty"`
	KriteriaDampakTitle         string             `gorm:"column:kriteria_dampak_title;type:varchar(255)" json:"kriteriaDampakTitle,omitempty"`
	KriteriaDampakLevel         int                `gorm:"column:kriteria_dampak_level" json:"kriteriaDampakLevel,omitempty"`
	KemungkinanAwal             int                `gorm:"column:kemungkinan_awal" json:"kemungkinanAwal"`
	DampakAwal                  int                `gorm:"column:dampak_awal" json:"dampakAwal"`
	InherentScore               int                `gorm:"->;column:inherent_score;index" json:"inherentScore"`
	TingkatRisikoAwal           RiskLevel          `gorm:"column:tingkat_risiko_awal;type:varchar(50)" json:"tingkatRisikoAwal"`
	CurrentTingkatRisiko        RiskLevel          `gorm:"index;column:current_tingkat_risiko;type:varchar(50)" json:"currentTingkatRisiko"`
	JenisPenanganan             string             `gorm:"column:jenis_penanganan;type:varchar(50)" json:"jenisPenanganan"`
	ButuhMitigasi               bool               `gorm:"column:butuh_mitigasi" json:"butuhMitigasi"`
	StatusKebutuhanMitigasi     string             `gorm:"column:status_kebutuhan_mitigasi;type:varchar(128)" json:"statusKebutuhanMitigasi"`
	AlasanKebutuhanMitigasi     string             `gorm:"column:alasan_kebutuhan_mitigasi;type:text" json:"alasanKebutuhanMitigasi"`
	RencanaPenanganan           string             `gorm:"column:rencana_penanganan;type:text" json:"rencanaPenanganan"`
	TargetWaktuMitigasi         string             `gorm:"column:target_waktu_mitigasi;type:varchar(128)" json:"targetWaktuMitigasi"`
	BiayaRencanaPengendalian    float64            `gorm:"column:biaya_rencana_pengendalian;type:decimal(15,2)" json:"biayaRencanaPengendalian"`
	PicDepartemen               string             `gorm:"column:pic_departemen;type:varchar(255)" json:"picDepartemen,omitempty"`
	PicPelaksana                string             `gorm:"column:pic_pelaksana;type:varchar(255)" json:"picPelaksana"`
	PicPengendali               string             `gorm:"column:pic_pengendali;type:varchar(255)" json:"picPengendali"`
	JenisAnggaran               string             `gorm:"column:jenis_anggaran;type:varchar(128)" json:"jenisAnggaran"`
	StatusWorkflow              string             `gorm:"index;column:status_workflow;type:varchar(100)" json:"statusWorkflow"`
	StatusPelaksanaanTerakhir   string             `gorm:"column:status_pelaksanaan_terakhir;type:varchar(64)" json:"statusPelaksanaanTerakhir,omitempty"`
	ProgressPelaksanaanTerakhir int                `gorm:"column:progress_pelaksanaan_terakhir" json:"progressPelaksanaanTerakhir,omitempty"`
	ReviewNotesVp               string             `gorm:"column:review_notes_vp;type:text" json:"reviewNotesVp,omitempty"`
	ApprovalNotesAdmin          string             `gorm:"column:approval_notes_admin;type:text" json:"approvalNotesAdmin,omitempty"`
	PengendalianTriwulan        []QuarterlyControl `gorm:"foreignKey:RiskID" json:"pengendalianTriwulan"`
	PelaksanaanTindakan         []ActionExecution  `gorm:"foreignKey:RiskID" json:"pelaksanaanTindakan,omitempty"`
	CarryOverInfo               *CarryOverDetails  `gorm:"foreignKey:RiskID" json:"carryOverInfo,omitempty"`
	CreatedDate                 string             `gorm:"column:created_date;type:varchar(64)" json:"createdDate"`
	UpdatedDate                 string             `gorm:"column:updated_date;type:varchar(64)" json:"updatedDate"`
	CreatedBy                   string             `gorm:"column:created_by;type:varchar(128)" json:"createdBy"`
}

func (PusriRisk) TableName() string {
	return "pusri_risks"
}

// QuarterlyControl stores TW 1-4 monitoring in pengendalian_triwulan
type QuarterlyControl struct {
	ID                     string    `gorm:"primaryKey;column:id;type:varchar(64)" json:"id"`
	RiskID                 string    `gorm:"index;column:risk_id;type:varchar(64)" json:"riskId"`
	KodeRisiko             string    `gorm:"column:kode_risiko;type:varchar(64)" json:"kodeRisiko"`
	Triwulan               string    `gorm:"column:triwulan;type:varchar(16)" json:"triwulan"`
	RealisasiKegiatan      string    `gorm:"column:realisasi_kegiatan;type:text" json:"realisasiKegiatan"`
	RealisasiBiaya         float64   `gorm:"column:realisasi_biaya;type:decimal(15,2)" json:"realisasiBiaya"`
	ProgressPersen         int       `gorm:"column:progress_persen" json:"progressPersen"`
	KemungkinanResidual    int       `gorm:"column:kemungkinan_residual" json:"kemungkinanResidual"`
	DampakResidual         int       `gorm:"column:dampak_residual" json:"dampakResidual"`
	ResidualScore          int       `gorm:"->;column:residual_score" json:"residualScore"`
	TingkatResidual        RiskLevel `gorm:"column:tingkat_residual;type:varchar(50)" json:"tingkatResidual"`
	StatusPengendalian     string    `gorm:"column:status_pengendalian;type:varchar(50)" json:"statusPengendalian"`
	KendalaDanTindakLanjut string    `gorm:"column:kendala_dan_tindak_lanjut;type:text" json:"kendalaDanTindakLanjut"`
	ReportedBy             string    `gorm:"column:reported_by;type:varchar(150)" json:"reportedBy"`
	UpdatedAt              time.Time `gorm:"column:updated_at" json:"updatedAt"`
}

func (QuarterlyControl) TableName() string {
	return "pengendalian_triwulan"
}

// ActionExecution stores action implementation records in pelaksanaan_tindakan
type ActionExecution struct {
	ID                 string    `gorm:"primaryKey;column:id;type:varchar(64)" json:"id"`
	RiskID             string    `gorm:"index;column:risk_id;type:varchar(64)" json:"riskId"`
	KodeRisiko         string    `gorm:"column:kode_risiko;type:varchar(64)" json:"kodeRisiko"`
	Triwulan           string    `gorm:"column:triwulan;type:varchar(16)" json:"triwulan,omitempty"`
	TanggalPelaksanaan string    `gorm:"column:tanggal_pelaksanaan;type:varchar(32)" json:"tanggalPelaksanaan"`
	PicPelaksana       string    `gorm:"column:pic_pelaksana;type:varchar(255)" json:"picPelaksana"`
	UraianTindakan     string    `gorm:"column:uraian_tindakan;type:text" json:"uraianTindakan"`
	ProgressPersen     int       `gorm:"column:progress_persen" json:"progressPersen"`
	StatusPelaksanaan  string    `gorm:"column:status_pelaksanaan;type:varchar(64)" json:"statusPelaksanaan"`
	RealisasiBiaya     float64   `gorm:"column:realisasi_biaya;type:decimal(15,2)" json:"realisasiBiaya"`
	Efektivitas        string    `gorm:"column:efektivitas;type:varchar(64)" json:"efektivitas"`
	UpdatedAt          time.Time `gorm:"column:updated_at" json:"updatedAt"`
}

func (ActionExecution) TableName() string {
	return "pelaksanaan_tindakan"
}

// CarryOverDetails stores carry over to next year in carry_over
type CarryOverDetails struct {
	ID                  string `gorm:"primaryKey;column:id;type:varchar(64)" json:"id"`
	RiskID              string `gorm:"uniqueIndex;column:risk_id;type:varchar(64)" json:"riskId"`
	KodeRisiko          string `gorm:"column:kode_risiko;type:varchar(64)" json:"kodeRisiko"`
	TargetTahun         int    `gorm:"column:target_tahun" json:"targetTahun"`
	AlasanCarryOver     string `gorm:"column:alasan_carry_over;type:text" json:"alasanCarryOver"`
	RekomendasiKomite   string `gorm:"column:rekomendasi_komite;type:text" json:"rekomendasiKomite"`
	ApprovalCarryOverBy string `gorm:"column:approval_carry_over_by;type:varchar(255)" json:"approvalCarryOverBy"`
	TanggalCarryOver    string `gorm:"column:tanggal_carry_over;type:date" json:"tanggalCarryOver"`
}

func (CarryOverDetails) TableName() string {
	return "carry_over"
}

// SyncEvent represents cross-module API synchronization log
type SyncEvent struct {
	ID             string    `gorm:"primaryKey;column:id;type:varchar(64)" json:"id"`
	Timestamp      time.Time `gorm:"column:created_at" json:"timestamp"`
	ModuleSource   string    `gorm:"column:module_source;type:varchar(128)" json:"moduleSource"`
	ModuleTarget   string    `gorm:"column:module_target;type:varchar(128)" json:"moduleTarget"`
	Endpoint       string    `gorm:"column:endpoint;type:varchar(255)" json:"endpoint"`
	Method         string    `gorm:"column:method;type:varchar(16)" json:"method"`
	Status         string    `gorm:"column:status;type:varchar(32)" json:"status"`
	DurationMs     float64   `gorm:"column:duration_ms;type:decimal(8,2)" json:"durationMs"`
	PayloadSummary string    `gorm:"column:payload_summary;type:text" json:"payloadSummary"`
}

func (SyncEvent) TableName() string {
	return "sync_event_modul"
}
