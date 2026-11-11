export interface Siswa {
  id: string;
  nisn: string;
  nama: string;
  kelas: string;
  userUid?: string;
  updatedAt?: unknown;
}

export interface Mapel {
  id: string;
  namaMapel: string;
  semester: string;
  tahunAjaran: string;
  userUid?: string;
  updatedAt?: unknown;
}

export interface Jadwal {
  id: string;
  hari: string;
  jam: string;
  kelas: string;
  mapel: string;
  userUid?: string;
  updatedAt?: unknown;
}

export interface LogAbsensi {
  id: string;
  waktu: string; // YYYY-MM-DD
  tanggal: string;
  kelas: string;
  mapel: string;
  idSiswa: string;
  namaSiswa: string;
  status: 'Hadir' | 'Izin' | 'Sakit' | 'Alpa';
  bulan: string;
  tahun: string;
  namaGuru: string;
  userUid?: string;
  updatedAt?: unknown;
}

export interface DataNilai {
  id: string;
  waktu: string;
  jenis: string; // e.g. UH1, UTS, UAS, Tugas 1
  mapel: string;
  kelas: string;
  idSiswa: string;
  namaSiswa: string;
  nilai: number | '';
  namaGuru: string;
  userUid?: string;
  updatedAt?: unknown;
}

export interface JurnalAgenda {
  id: string;
  tanggal: string;
  jam: string;
  kelas: string;
  mapel: string;
  materi: string;
  status: string; // Terlaksana / Tunda
  absenSiswa: string;
  ket?: string;
  namaGuru: string;
  userUid?: string;
  updatedAt?: unknown;
}

export interface SiswaBimbingan {
  id: string;
  namaSiswa: string;
  kelas: string;
  userUid?: string;
  updatedAt?: unknown;
}

export interface BimbinganWali {
  id: string;
  tanggal: string;
  namaSiswa: string;
  kelas: string;
  jenis: string; // Akademik, Pribadi, Sosial, Keterampilan
  kasus: string;
  tindakLanjut: string;
  guruWali: string;
  userUid?: string;
  updatedAt?: unknown;
}

export interface Pengaturan {
  Nama_Guru: string;
  NIP_Guru: string;
  Pemerintah: string;
  Nama_Sekolah: string;
  Alamat_Sekolah: string;
  Nama_Kepsek: string;
  NIP_Kepsek: string;
  Tempat_Tanda_Tangan: string;
  Logo_Kiri: string;
  Logo_Kanan: string;
  username?: string;
  password?: string;
  isDatabaseCleared?: boolean;
  userUid?: string;
  updatedAt?: unknown;
}

export interface ModulFormState {
  namaGuru: string;
  nipGuru?: string;
  namaSekolah: string;
  namaKepsek?: string;
  nipKepsek?: string;
  kota?: string;
  tahunAjaran: string;
  semester?: string;
  jenjang: string;
  fase: string;
  kelas: string;
  waktu: string;
  mataPelajaran: string;
  topik: string;
  subTopik: string;
  kodeTp?: string;
  rumusanTp?: string;
  cpAsal?: string;
  kktp?: string;
  sarana?: string;
  lampiranPilihan?: string;
  jumlahPertemuan: string;
  model: string;
  metode?: string;
  tujuan: string;
  karakteristik: string;
  targetPeserta?: string;
  mode?: "akreditasi_premium" | "deep_learning" | "diferensiasi" | "rpm_pancasila";
  profilPancasila?: string;
  pendekatan?: string;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
}
