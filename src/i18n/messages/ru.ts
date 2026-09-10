/**
 * Русский (ru).
 *
 * Translated by Claude, not yet reviewed by a native speaker. "RPM Boss" and
 * "rpm" are left as they are: one is a name, the other is what the gauge says.
 */
import type { Messages } from '../en'

export const messages: Messages = {
  statusIdle: "Откройте запись или запишите двигатель.",
  statusDecoding: "Обработка…",
  statusRecording: "Идёт запись. Держите телефон у двигателя.",
  statusLoaded: "Загружено: {name} · {duration}",
  dismiss: "Закрыть",
  openAudio: "Открыть аудио",
  record: "Записать",
  stopRecording: "Стоп",
  play: "Прослушать",
  stopPlaying: "Стоп",
  rangeLegend: "Ожидаемый диапазон (необязательно)",
  rangeMin: "Мин",
  rangeMax: "Макс",
  calculate: "Рассчитать",
  analysing: "Анализ…",
  rpm: "rpm",
  marked: "отмечено вспышек: {count}",
  octaveUp: "по вашему диапазону каждая метка — две вспышки",
  octaveDown: "по вашему диапазону две метки — одна вспышка",
  errorTooLarge: "Слишком большой. Возьмите запись меньше 50 МБ.",
  errorUndecodable: "Не удаётся открыть этот файл. Возьмите WAV, MP3, AAC/M4A или OGG.",
  errorMicDenied: "Микрофон заблокирован. Разрешите его и повторите.",
  errorNoMic: "На этом устройстве нет микрофона.",
  errorInsecureOrigin: "Микрофону нужен защищённый адрес (https).",
  errorTooShort: "Запишите не менее {duration}.",
  errorNoAudio: "Ничего не записано. Закройте другие приложения, использующие микрофон.",
  errorRecordFailed: "Запись не удалась. Повторите.",
  errorCaptureBlocked: "Этот браузер не записывает звук двигателя. Используйте Chrome или откройте файл.",
  errorUnknown: "Что-то пошло не так. Повторите.",
  errorWindowTooShort: "Выберите не менее {duration}.",
  errorNoSignal: "Здесь нет ровного звука двигателя. Попробуйте другой участок.",
  errorWorkerFailed: "Анализ не запустился. Перезагрузите страницу.",
  languageLabel: "Язык",
}
