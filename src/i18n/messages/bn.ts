/**
 * বাংলা (bn).
 *
 * Translated by Claude, not yet reviewed by a native speaker. "RPM Boss" and
 * "rpm" are left as they are: one is a name, the other is what the gauge says.
 */
import type { Messages } from '../en'

export const messages: Messages = {
  statusIdle: "রেকর্ডিং খুলুন, বা ইঞ্জিন রেকর্ড করুন।",
  statusDecoding: "প্রক্রিয়া চলছে…",
  statusRecording: "রেকর্ড হচ্ছে। ফোনটি ইঞ্জিনের কাছে ধরুন।",
  statusLoaded: "লোড হয়েছে: {name} · {duration}",
  dismiss: "বন্ধ",
  openAudio: "অডিও খুলুন",
  record: "রেকর্ড",
  stopRecording: "থামান",
  play: "বাজান",
  stopPlaying: "থামান",
  rangeLegend: "প্রত্যাশিত সীমা (ঐচ্ছিক)",
  rangeMin: "সর্বনিম্ন",
  rangeMax: "সর্বোচ্চ",
  calculate: "হিসাব করুন",
  analysing: "বিশ্লেষণ চলছে…",
  rpm: "rpm",
  marked: "{count} দহন চিহ্নিত",
  octaveUp: "আপনার সীমা অনুযায়ী, প্রতিটি চিহ্ন দুটি দহন",
  octaveDown: "আপনার সীমা অনুযায়ী, দুটি চিহ্ন একটি দহন",
  errorTooLarge: "অনেক বড়। ৫০ MB-র কম রেকর্ডিং নিন।",
  errorUndecodable: "এই ফাইল খোলা যাচ্ছে না। WAV, MP3, AAC/M4A বা OGG নিন।",
  errorMicDenied: "মাইক্রোফোন বন্ধ। অনুমতি দিন, তারপর আবার চেষ্টা করুন।",
  errorNoMic: "এই ডিভাইসে মাইক্রোফোন নেই।",
  errorInsecureOrigin: "মাইক্রোফোনের জন্য নিরাপদ ঠিকানা লাগে (https)।",
  errorTooShort: "অন্তত {duration} রেকর্ড করুন।",
  errorNoAudio: "কিছুই রেকর্ড হয়নি। মাইক্রোফোন ব্যবহার করা অন্য অ্যাপ বন্ধ করুন।",
  errorRecordFailed: "রেকর্ডিং ব্যর্থ হয়েছে। আবার চেষ্টা করুন।",
  errorCaptureBlocked: "এই ব্রাউজার ইঞ্জিনের শব্দ রেকর্ড করতে পারে না। Chrome ব্যবহার করুন, বা ফাইল খুলুন।",
  errorUnknown: "কিছু একটা ভুল হয়েছে। আবার চেষ্টা করুন।",
  errorWindowTooShort: "অন্তত {duration} বাছুন।",
  errorNoSignal: "এখানে স্থির ইঞ্জিনের শব্দ নেই। অন্য অংশ দেখুন।",
  errorWorkerFailed: "বিশ্লেষণ শুরু হয়নি। পাতা আবার লোড করুন।",
  languageLabel: "ভাষা",
}
