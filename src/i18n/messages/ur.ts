/**
 * اردو (ur).
 *
 * Translated by Claude, not yet reviewed by a native speaker. "RPM Boss" and
 * "rpm" are left as they are: one is a name, the other is what the gauge says.
 */
import type { Messages } from '../en'

export const messages: Messages = {
  statusIdle: "ریکارڈنگ کھولیں، یا انجن ریکارڈ کریں۔",
  statusDecoding: "کارروائی جاری…",
  statusRecording: "ریکارڈ ہو رہا ہے۔ فون انجن کے قریب رکھیں۔",
  statusLoaded: "لوڈ ہو گیا: {name} · {duration}",
  dismiss: "بند کریں",
  openAudio: "آڈیو کھولیں",
  pickSample: "نمونہ آزمائیں",
  record: "ریکارڈ",
  stopRecording: "روکیں",
  play: "چلائیں",
  stopPlaying: "روکیں",
  rangeLegend: "متوقع حد (اختیاری)",
  rangeMin: "کم سے کم",
  rangeMax: "زیادہ سے زیادہ",
  calculate: "حساب لگائیں",
  analysing: "تجزیہ ہو رہا ہے…",
  rpm: "rpm",
  marked: "{count} دھماکے نشان زد",
  octaveUp: "آپ کی حد کے مطابق، ہر نشان دو دھماکے ہیں",
  octaveDown: "آپ کی حد کے مطابق، دو نشان ایک دھماکہ ہیں",
  errorTooLarge: "بہت بڑی ہے۔ 50 MB سے کم ریکارڈنگ لیں۔",
  errorUndecodable: "یہ فائل نہیں کھل سکتی۔ WAV، MP3، AAC/M4A یا OGG لیں۔",
  errorMicDenied: "مائیکروفون بند ہے۔ اجازت دیں، پھر کوشش کریں۔",
  errorNoMic: "اس ڈیوائس میں مائیکروفون نہیں۔",
  errorInsecureOrigin: "مائیکروفون کو محفوظ پتہ چاہیے (https)۔",
  errorTooShort: "کم از کم {duration} ریکارڈ کریں۔",
  errorNoAudio: "کچھ ریکارڈ نہیں ہوا۔ مائیکروفون استعمال کرنے والی دوسری ایپس بند کریں۔",
  errorRecordFailed: "ریکارڈنگ ناکام۔ دوبارہ کوشش کریں۔",
  errorCaptureBlocked: "یہ براؤزر انجن کی آواز ریکارڈ نہیں کر سکتا۔ Chrome استعمال کریں، یا فائل کھولیں۔",
  errorUnknown: "کچھ غلط ہو گیا۔ دوبارہ کوشش کریں۔",
  errorWindowTooShort: "کم از کم {duration} چنیں۔",
  errorNoSignal: "یہاں مسلسل انجن کی آواز نہیں۔ کوئی اور حصہ دیکھیں۔",
  errorWorkerFailed: "تجزیہ شروع نہ ہو سکا۔ صفحہ دوبارہ لوڈ کریں۔",
  languageLabel: "زبان",
  settings: "ترتیبات",
  theme: "تھیم",
  themeSystem: "سسٹم",
  themeLight: "روشن",
  themeDark: "گہرا",
}
