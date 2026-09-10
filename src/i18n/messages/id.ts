/**
 * Indonesia (id).
 *
 * Translated by Claude, not yet reviewed by a native speaker. "RPM Boss" and
 * "rpm" are left as they are: one is a name, the other is what the gauge says.
 */
import type { Messages } from '../en'

export const messages: Messages = {
  statusIdle: "Buka rekaman, atau rekam mesinnya.",
  statusDecoding: "Memproses…",
  statusRecording: "Merekam. Dekatkan ponsel ke mesin.",
  statusLoaded: "Dimuat: {name} · {duration}",
  dismiss: "Tutup",
  openAudio: "Buka audio",
  record: "Rekam",
  stopRecording: "Berhenti {elapsed} / {max} d",
  play: "Putar",
  stopPlaying: "Berhenti",
  rangeLegend: "Perkiraan rentang (opsional)",
  rangeMin: "Min",
  rangeMax: "Maks",
  calculate: "Hitung",
  analysing: "Menganalisis…",
  rpm: "rpm",
  marked: "{count} ditandai",
  octaveUp: "menurut rentang Anda, satu tanda berarti dua pembakaran",
  octaveDown: "menurut rentang Anda, dua tanda berarti satu pembakaran",
  errorTooLarge: "Terlalu besar. Pakai rekaman di bawah 50 MB.",
  errorUndecodable: "Tidak bisa membuka berkas itu. Pakai WAV, MP3, AAC/M4A, atau OGG.",
  errorMicDenied: "Mikrofon diblokir. Izinkan, lalu coba lagi.",
  errorNoMic: "Perangkat ini tidak punya mikrofon.",
  errorInsecureOrigin: "Mikrofon perlu alamat aman (https).",
  errorTooShort: "Rekam paling sedikit {duration}.",
  errorNoAudio: "Tidak ada yang terekam. Tutup aplikasi lain yang memakai mikrofon.",
  errorRecordFailed: "Perekaman gagal. Coba lagi.",
  errorCaptureBlocked: "Peramban ini tidak bisa merekam suara mesin. Pakai Chrome, atau buka berkas.",
  errorWindowTooShort: "Pilih paling sedikit {duration}.",
  errorNoSignal: "Tidak ada suara mesin yang tetap di sini. Coba bagian lain.",
  errorWorkerFailed: "Analisis tidak bisa dimulai. Muat ulang halaman.",
  languageLabel: "Bahasa",
}
