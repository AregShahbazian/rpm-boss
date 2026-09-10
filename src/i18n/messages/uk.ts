/**
 * Українська (uk).
 *
 * Translated by Claude, not yet reviewed by a native speaker. "RPM Boss" and
 * "rpm" are left as they are: one is a name, the other is what the gauge says.
 */
import type { Messages } from '../en'

export const messages: Messages = {
  statusIdle: "Відкрийте запис або запишіть двигун.",
  statusDecoding: "Обробка…",
  statusRecording: "Триває запис. Тримайте телефон біля двигуна.",
  statusLoaded: "Завантажено: {name} · {duration}",
  dismiss: "Закрити",
  openAudio: "Відкрити аудіо",
  pickSample: "Спробувати приклад",
  record: "Записати",
  stopRecording: "Стоп",
  play: "Прослухати",
  stopPlaying: "Стоп",
  rangeLegend: "Очікуваний діапазон (необов'язково)",
  rangeMin: "Мін",
  rangeMax: "Макс",
  calculate: "Обчислити",
  analysing: "Аналіз…",
  rpm: "rpm",
  marked: "позначено спалахів: {count}",
  octaveUp: "за вашим діапазоном кожна позначка — два спалахи",
  octaveDown: "за вашим діапазоном дві позначки — один спалах",
  errorTooLarge: "Завеликий. Візьміть запис менший за 50 МБ.",
  errorUndecodable: "Не вдається відкрити цей файл. Візьміть WAV, MP3, AAC/M4A або OGG.",
  errorMicDenied: "Мікрофон заблоковано. Дозвольте його та повторіть.",
  errorNoMic: "На цьому пристрої немає мікрофона.",
  errorInsecureOrigin: "Мікрофону потрібна захищена адреса (https).",
  errorTooShort: "Запишіть щонайменше {duration}.",
  errorNoAudio: "Нічого не записано. Закрийте інші програми, що використовують мікрофон.",
  errorRecordFailed: "Запис не вдався. Повторіть.",
  errorCaptureBlocked: "Цей браузер не записує звук двигуна. Скористайтеся Chrome або відкрийте файл.",
  errorUnknown: "Щось пішло не так. Повторіть.",
  errorWindowTooShort: "Виберіть щонайменше {duration}.",
  errorNoSignal: "Тут немає рівного звуку двигуна. Спробуйте іншу частину.",
  errorWorkerFailed: "Аналіз не запустився. Перезавантажте сторінку.",
  languageLabel: "Мова",
}
