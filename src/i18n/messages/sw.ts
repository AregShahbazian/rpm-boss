/**
 * Kiswahili (sw).
 *
 * Translated by Claude, not yet reviewed by a native speaker. "RPM Boss" and
 * "rpm" are left as they are: one is a name, the other is what the gauge says.
 */
import type { Messages } from '../en'

export const messages: Messages = {
  statusIdle: "Fungua rekodi, au rekodi injini.",
  statusDecoding: "Inachakata…",
  statusRecording: "Inarekodi. Sogeza simu karibu na injini.",
  statusLoaded: "Imepakiwa: {name} · {duration}",
  dismiss: "Funga",
  openAudio: "Fungua sauti",
  pickSample: "Jaribu sampuli",
  record: "Rekodi",
  stopRecording: "Simamisha",
  play: "Sikiliza",
  stopPlaying: "Simamisha",
  rangeLegend: "Kiwango unachotarajia (si lazima)",
  rangeMin: "Chini",
  rangeMax: "Juu",
  calculate: "Hesabu",
  analysing: "Inachambua…",
  rpm: "rpm",
  marked: "milipuko {count} imewekwa alama",
  octaveUp: "kwa kiwango chako, kila alama ni milipuko miwili",
  octaveDown: "kwa kiwango chako, alama mbili ni mlipuko mmoja",
  errorTooLarge: "Kubwa mno. Tumia rekodi chini ya MB 50.",
  errorUndecodable: "Faili hiyo haifunguki. Tumia WAV, MP3, AAC/M4A au OGG.",
  errorMicDenied: "Maikrofoni imezuiwa. Iruhusu, kisha jaribu tena.",
  errorNoMic: "Kifaa hiki hakina maikrofoni.",
  errorInsecureOrigin: "Maikrofoni inahitaji anwani salama (https).",
  errorTooShort: "Rekodi angalau {duration}.",
  errorNoAudio: "Hakuna kilichorekodiwa. Funga programu nyingine zinazotumia maikrofoni.",
  errorRecordFailed: "Kurekodi kumeshindikana. Jaribu tena.",
  errorCaptureBlocked: "Kivinjari hiki hakiwezi kurekodi sauti ya injini. Tumia Chrome, au fungua faili.",
  errorUnknown: "Kuna hitilafu. Jaribu tena.",
  errorWindowTooShort: "Chagua angalau {duration}.",
  errorNoSignal: "Hakuna sauti thabiti ya injini hapa. Jaribu sehemu nyingine.",
  errorWorkerFailed: "Uchambuzi haukuanza. Pakia ukurasa upya.",
  languageLabel: "Lugha",
  settings: "Mipangilio",
  theme: "Mandhari",
  themeSystem: "Mfumo",
  themeLight: "Nuru",
  themeDark: "Giza",
}
