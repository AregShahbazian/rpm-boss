/**
 * Français (fr).
 *
 * Translated by Claude, not yet reviewed by a native speaker. "RPM Boss" and
 * "rpm" are left as they are: one is a name, the other is what the gauge says.
 */
import type { Messages } from '../en'

export const messages: Messages = {
  statusIdle: "Ouvre un enregistrement, ou enregistre le moteur.",
  statusDecoding: "Traitement…",
  statusRecording: "Enregistrement. Approche le téléphone du moteur.",
  statusLoaded: "Chargé : {name} · {duration}",
  dismiss: "Fermer",
  openAudio: "Ouvrir un audio",
  pickSample: "Essayer un exemple",
  record: "Enregistrer",
  stopRecording: "Arrêter",
  play: "Écouter",
  stopPlaying: "Arrêter",
  rangeLegend: "Plage attendue (facultatif)",
  rangeMin: "Min",
  rangeMax: "Max",
  calculate: "Calculer",
  analysing: "Analyse…",
  rpm: "rpm",
  marked: "{count} explosions repérées",
  octaveUp: "selon ta plage, chaque repère vaut deux explosions",
  octaveDown: "selon ta plage, deux repères valent une explosion",
  errorTooLarge: "Trop gros. Utilise un enregistrement de moins de 50 Mo.",
  errorUndecodable: "Impossible d'ouvrir ce fichier. Utilise WAV, MP3, AAC/M4A ou OGG.",
  errorMicDenied: "Micro bloqué. Autorise-le, puis réessaie.",
  errorNoMic: "Pas de micro sur cet appareil.",
  errorInsecureOrigin: "Le micro exige une adresse sécurisée (https).",
  errorTooShort: "Enregistre au moins {duration}.",
  errorNoAudio: "Rien n'a été enregistré. Ferme les autres applis qui utilisent le micro.",
  errorRecordFailed: "L'enregistrement a échoué. Réessaie.",
  errorCaptureBlocked: "Ce navigateur ne peut pas enregistrer le son du moteur. Utilise Chrome, ou ouvre un fichier.",
  errorUnknown: "Quelque chose n'a pas marché. Réessaie.",
  errorWindowTooShort: "Choisis au moins {duration}.",
  errorNoSignal: "Pas de moteur régulier ici. Essaie une autre partie.",
  errorWorkerFailed: "L'analyse n'a pas pu démarrer. Recharge la page.",
  languageLabel: "Langue",
  settings: "Réglages",
  theme: "Thème",
  themeSystem: "Système",
  themeLight: "Clair",
  themeDark: "Sombre",
}
