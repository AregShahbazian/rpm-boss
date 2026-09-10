/**
 * Español (es).
 *
 * Translated by Claude, not yet reviewed by a native speaker. "RPM Boss" and
 * "rpm" are left as they are: one is a name, the other is what the gauge says.
 */
import type { Messages } from '../en'

export const messages: Messages = {
  statusIdle: "Abre una grabación o graba el motor.",
  statusDecoding: "Procesando…",
  statusRecording: "Grabando. Acerca el teléfono al motor.",
  statusLoaded: "Cargado: {name} · {duration}",
  dismiss: "Cerrar",
  openAudio: "Abrir audio",
  pickSample: "Probar un ejemplo",
  record: "Grabar",
  stopRecording: "Parar",
  play: "Reproducir",
  stopPlaying: "Parar",
  rangeLegend: "Rango esperado (opcional)",
  rangeMin: "Mín",
  rangeMax: "Máx",
  calculate: "Calcular",
  analysing: "Analizando…",
  rpm: "rpm",
  marked: "{count} combustiones marcadas",
  octaveUp: "según tu rango, cada marca son dos combustiones",
  octaveDown: "según tu rango, dos marcas son una combustión",
  errorTooLarge: "Demasiado grande. Usa una grabación de menos de 50 MB.",
  errorUndecodable: "No se puede abrir ese archivo. Usa WAV, MP3, AAC/M4A u OGG.",
  errorMicDenied: "Micrófono bloqueado. Permítelo y vuelve a intentarlo.",
  errorNoMic: "Este dispositivo no tiene micrófono.",
  errorInsecureOrigin: "El micrófono necesita una dirección segura (https).",
  errorTooShort: "Graba al menos {duration}.",
  errorNoAudio: "No se grabó nada. Cierra otras apps que usen el micrófono.",
  errorRecordFailed: "La grabación falló. Inténtalo de nuevo.",
  errorCaptureBlocked: "Este navegador no puede grabar el sonido del motor. Usa Chrome o abre un archivo.",
  errorUnknown: "Algo salió mal. Inténtalo de nuevo.",
  errorWindowTooShort: "Elige al menos {duration}.",
  errorNoSignal: "Aquí no hay un motor constante. Prueba otra parte.",
  errorWorkerFailed: "No se pudo iniciar el análisis. Recarga la página.",
  languageLabel: "Idioma",
  settings: "Ajustes",
  theme: "Tema",
  themeSystem: "Sistema",
  themeLight: "Claro",
  themeDark: "Oscuro",
}
