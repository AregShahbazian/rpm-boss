/**
 * हिन्दी (hi).
 *
 * Translated by Claude, not yet reviewed by a native speaker. "RPM Boss" and
 * "rpm" are left as they are: one is a name, the other is what the gauge says.
 */
import type { Messages } from '../en'

export const messages: Messages = {
  statusIdle: "रिकॉर्डिंग खोलें, या इंजन रिकॉर्ड करें।",
  statusDecoding: "प्रोसेस हो रहा है…",
  statusRecording: "रिकॉर्ड हो रहा है। फ़ोन इंजन के पास रखें।",
  statusLoaded: "लोड हुआ: {name} · {duration}",
  dismiss: "बंद करें",
  openAudio: "ऑडियो खोलें",
  pickSample: "नमूना आज़माएँ",
  record: "रिकॉर्ड",
  stopRecording: "रोकें",
  play: "चलाएँ",
  stopPlaying: "रोकें",
  rangeLegend: "अपेक्षित सीमा (वैकल्पिक)",
  rangeMin: "न्यूनतम",
  rangeMax: "अधिकतम",
  calculate: "गणना करें",
  analysing: "विश्लेषण हो रहा है…",
  rpm: "rpm",
  marked: "{count} दहन चिह्नित",
  octaveUp: "आपकी सीमा के अनुसार, हर निशान दो दहन है",
  octaveDown: "आपकी सीमा के अनुसार, दो निशान एक दहन हैं",
  errorTooLarge: "बहुत बड़ी है। 50 MB से छोटी रिकॉर्डिंग लें।",
  errorUndecodable: "यह फ़ाइल नहीं खुल सकती। WAV, MP3, AAC/M4A या OGG लें।",
  errorMicDenied: "माइक्रोफ़ोन रुका है। अनुमति दें, फिर कोशिश करें।",
  errorNoMic: "इस डिवाइस में माइक्रोफ़ोन नहीं है।",
  errorInsecureOrigin: "माइक्रोफ़ोन को सुरक्षित पता चाहिए (https)।",
  errorTooShort: "कम से कम {duration} रिकॉर्ड करें।",
  errorNoAudio: "कुछ रिकॉर्ड नहीं हुआ। माइक्रोफ़ोन इस्तेमाल कर रहे दूसरे ऐप बंद करें।",
  errorRecordFailed: "रिकॉर्डिंग विफल रही। फिर कोशिश करें।",
  errorCaptureBlocked: "यह ब्राउज़र इंजन की आवाज़ रिकॉर्ड नहीं कर सकता। Chrome लें, या फ़ाइल खोलें।",
  errorUnknown: "कुछ गड़बड़ हुई। फिर कोशिश करें।",
  errorWindowTooShort: "कम से कम {duration} चुनें।",
  errorNoSignal: "यहाँ लगातार इंजन की आवाज़ नहीं है। दूसरा हिस्सा चुनें।",
  errorWorkerFailed: "विश्लेषण शुरू नहीं हो सका। पेज दोबारा लोड करें।",
  languageLabel: "भाषा",
}
