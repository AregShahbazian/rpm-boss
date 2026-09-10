/**
 * Cebuano (ceb).
 *
 * Translated by Claude, not yet reviewed by a native speaker. "RPM Boss" and
 * "rpm" are left as they are: one is a name, the other is what the gauge says.
 */
import type { Messages } from '../en'

export const messages: Messages = {
  statusIdle: "Ablihi ang rekording, o irekord ang makina.",
  statusDecoding: "Giproseso…",
  statusRecording: "Nagrekord. Iduol ang telepono sa makina.",
  statusLoaded: "Na-load: {name} · {duration}",
  dismiss: "Sirad-i",
  openAudio: "Ablihi ang audio",
  record: "Irekord",
  stopRecording: "Hunong {elapsed} / {max} s",
  play: "Patugtoga",
  stopPlaying: "Hunong",
  rangeLegend: "Gilauman nga range (opsyonal)",
  rangeMin: "Min",
  rangeMax: "Maks",
  calculate: "Kwentaha",
  analysing: "Gisusi…",
  rpm: "rpm",
  marked: "{count} gimarkahan",
  octaveUp: "sumala sa imong range, ang matag marka duha ka pagbuto",
  octaveDown: "sumala sa imong range, duha ka marka usa ka pagbuto",
  errorTooLarge: "Dako kaayo. Gamit ug rekording nga ubos sa 50 MB.",
  errorUndecodable: "Dili maablihan kana nga file. Gamit ug WAV, MP3, AAC/M4A o OGG.",
  errorMicDenied: "Gi-block ang mikropono. Tugoti kini, dayon sulayi pag-usab.",
  errorNoMic: "Walay mikropono kini nga device.",
  errorInsecureOrigin: "Ang mikropono nagkinahanglan ug luwas nga address (https).",
  errorTooShort: "Pagrekord ug labing menos {duration}.",
  errorNoAudio: "Walay narekord. Sirad-i ang ubang app nga naggamit sa mikropono.",
  errorRecordFailed: "Napakyas ang pagrekord. Sulayi pag-usab.",
  errorCaptureBlocked: "Kini nga browser dili makarekord sa tingog sa makina. Gamit ug Chrome, o ablihi ang file.",
  errorWindowTooShort: "Pagpili ug labing menos {duration}.",
  errorNoSignal: "Walay kanunay nga tingog sa makina dinhi. Sulayi ang laing bahin.",
  errorWorkerFailed: "Wala makasugod ang pagsusi. I-reload ang page.",
  languageLabel: "Pinulongan",
}
