/**
 * Melayu (ms).
 *
 * Translated by Claude, not yet reviewed by a native speaker. "RPM Boss" and
 * "rpm" are left as they are: one is a name, the other is what the gauge says.
 */
import type { Messages } from '../en'

export const messages: Messages = {
  statusIdle: "Buka rakaman, atau rakam enjin.",
  statusDecoding: "Memproses…",
  statusRecording: "Merakam. Dekatkan telefon ke enjin.",
  statusLoaded: "Dimuatkan: {name} · {duration}",
  dismiss: "Tutup",
  openAudio: "Buka audio",
  pickSample: "Cuba sampel",
  record: "Rakam",
  stopRecording: "Berhenti",
  play: "Main",
  stopPlaying: "Berhenti",
  rangeLegend: "Julat dijangka (pilihan)",
  rangeMin: "Min",
  rangeMax: "Maks",
  calculate: "Kira",
  analysing: "Menganalisis…",
  rpm: "rpm",
  marked: "{count} pembakaran ditanda",
  octaveUp: "mengikut julat anda, satu tanda ialah dua pembakaran",
  octaveDown: "mengikut julat anda, dua tanda ialah satu pembakaran",
  errorTooLarge: "Terlalu besar. Guna rakaman bawah 50 MB.",
  errorUndecodable: "Tidak boleh membuka fail itu. Guna WAV, MP3, AAC/M4A atau OGG.",
  errorMicDenied: "Mikrofon disekat. Benarkan, kemudian cuba lagi.",
  errorNoMic: "Peranti ini tiada mikrofon.",
  errorInsecureOrigin: "Mikrofon perlukan alamat selamat (https).",
  errorTooShort: "Rakam sekurang-kurangnya {duration}.",
  errorNoAudio: "Tiada apa dirakam. Tutup aplikasi lain yang guna mikrofon.",
  errorRecordFailed: "Rakaman gagal. Cuba lagi.",
  errorCaptureBlocked: "Pelayar ini tidak boleh merakam bunyi enjin. Guna Chrome, atau buka fail.",
  errorUnknown: "Ada masalah. Cuba lagi.",
  errorWindowTooShort: "Pilih sekurang-kurangnya {duration}.",
  errorNoSignal: "Tiada bunyi enjin yang tetap di sini. Cuba bahagian lain.",
  errorWorkerFailed: "Analisis tidak dapat bermula. Muat semula halaman.",
  languageLabel: "Bahasa",
}
