/**
 * Filipino (fil).
 *
 * Translated by Claude, not yet reviewed by a native speaker. "RPM Boss" and
 * "rpm" are left as they are: one is a name, the other is what the gauge says.
 */
import type { Messages } from '../en'

export const messages: Messages = {
  statusIdle: "Magbukas ng rekording, o i-record ang makina.",
  statusDecoding: "Pinoproseso…",
  statusRecording: "Nagre-record. Ilapit ang telepono sa makina.",
  statusLoaded: "Nakarga: {name} · {duration}",
  dismiss: "Isara",
  openAudio: "Magbukas ng audio",
  record: "I-record",
  stopRecording: "Itigil",
  play: "I-play",
  stopPlaying: "Itigil",
  rangeLegend: "Inaasahang saklaw (opsyonal)",
  rangeMin: "Min",
  rangeMax: "Maks",
  calculate: "Kalkulahin",
  analysing: "Sinusuri…",
  rpm: "rpm",
  marked: "{count} pagsabog ang namarkahan",
  octaveUp: "ayon sa saklaw mo, bawat marka ay dalawang pagsabog",
  octaveDown: "ayon sa saklaw mo, dalawang marka ay isang pagsabog",
  errorTooLarge: "Masyadong malaki. Gumamit ng rekording na wala pang 50 MB.",
  errorUndecodable: "Hindi mabuksan ang file na iyan. Gumamit ng WAV, MP3, AAC/M4A o OGG.",
  errorMicDenied: "Naka-block ang mikropono. Payagan ito, tapos subukan ulit.",
  errorNoMic: "Walang mikropono ang device na ito.",
  errorInsecureOrigin: "Kailangan ng mikropono ng secure na address (https).",
  errorTooShort: "Mag-record ng hindi bababa sa {duration}.",
  errorNoAudio: "Walang naitala. Isara ang ibang app na gumagamit ng mikropono.",
  errorRecordFailed: "Nabigo ang pag-record. Subukan ulit.",
  errorCaptureBlocked: "Hindi mairekord ng browser na ito ang tunog ng makina. Gumamit ng Chrome, o magbukas ng file.",
  errorUnknown: "May mali. Subukan ulit.",
  errorWindowTooShort: "Pumili ng hindi bababa sa {duration}.",
  errorNoSignal: "Walang tuloy-tuloy na tunog ng makina dito. Subukan ang ibang bahagi.",
  errorWorkerFailed: "Hindi makapagsimula ang pagsusuri. I-reload ang page.",
  languageLabel: "Wika",
}
