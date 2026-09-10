/**
 * Português (pt).
 *
 * Translated by Claude, not yet reviewed by a native speaker. "RPM Boss" and
 * "rpm" are left as they are: one is a name, the other is what the gauge says.
 */
import type { Messages } from '../en'

export const messages: Messages = {
  statusIdle: "Abra uma gravação, ou grave o motor.",
  statusDecoding: "Processando…",
  statusRecording: "Gravando. Aproxime o celular do motor.",
  statusLoaded: "Carregado: {name} · {duration}",
  dismiss: "Fechar",
  openAudio: "Abrir áudio",
  record: "Gravar",
  stopRecording: "Parar",
  play: "Tocar",
  stopPlaying: "Parar",
  rangeLegend: "Faixa esperada (opcional)",
  rangeMin: "Mín",
  rangeMax: "Máx",
  calculate: "Calcular",
  analysing: "Analisando…",
  rpm: "rpm",
  marked: "{count} combustões marcadas",
  octaveUp: "pela sua faixa, cada marca são duas combustões",
  octaveDown: "pela sua faixa, duas marcas são uma combustão",
  errorTooLarge: "Grande demais. Use uma gravação com menos de 50 MB.",
  errorUndecodable: "Não dá para abrir esse arquivo. Use WAV, MP3, AAC/M4A ou OGG.",
  errorMicDenied: "Microfone bloqueado. Libere e tente de novo.",
  errorNoMic: "Este aparelho não tem microfone.",
  errorInsecureOrigin: "O microfone precisa de um endereço seguro (https).",
  errorTooShort: "Grave pelo menos {duration}.",
  errorNoAudio: "Nada foi gravado. Feche outros apps que usam o microfone.",
  errorRecordFailed: "A gravação falhou. Tente de novo.",
  errorCaptureBlocked: "Este navegador não grava o som do motor. Use o Chrome, ou abra um arquivo.",
  errorUnknown: "Algo deu errado. Tente de novo.",
  errorWindowTooShort: "Escolha pelo menos {duration}.",
  errorNoSignal: "Não há motor constante aqui. Tente outra parte.",
  errorWorkerFailed: "A análise não iniciou. Recarregue a página.",
  languageLabel: "Idioma",
  settings: "Definições",
  theme: "Tema",
  themeSystem: "Sistema",
  themeLight: "Claro",
  themeDark: "Escuro",
}
