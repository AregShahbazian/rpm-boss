/**
 * ไทย (th).
 *
 * Translated by Claude, not yet reviewed by a native speaker. "RPM Boss" and
 * "rpm" are left as they are: one is a name, the other is what the gauge says.
 */
import type { Messages } from '../en'

export const messages: Messages = {
  statusIdle: "เปิดไฟล์เสียง หรืออัดเสียงเครื่องยนต์",
  statusDecoding: "กำลังประมวลผล…",
  statusRecording: "กำลังอัด ถือโทรศัพท์ใกล้เครื่องยนต์",
  statusLoaded: "โหลดแล้ว: {name} · {duration}",
  dismiss: "ปิด",
  openAudio: "เปิดไฟล์เสียง",
  record: "อัดเสียง",
  stopRecording: "หยุด",
  play: "เล่น",
  stopPlaying: "หยุด",
  rangeLegend: "ช่วงที่คาดไว้ (ไม่บังคับ)",
  rangeMin: "ต่ำสุด",
  rangeMax: "สูงสุด",
  calculate: "คำนวณ",
  analysing: "กำลังวิเคราะห์…",
  rpm: "rpm",
  marked: "ทำเครื่องหมายการจุดระเบิด {count} ครั้ง",
  octaveUp: "ตามช่วงที่ตั้งไว้ หนึ่งจุดคือการจุดระเบิดสองครั้ง",
  octaveDown: "ตามช่วงที่ตั้งไว้ สองจุดคือการจุดระเบิดหนึ่งครั้ง",
  errorTooLarge: "ใหญ่เกินไป ใช้ไฟล์ต่ำกว่า 50 MB",
  errorUndecodable: "เปิดไฟล์นี้ไม่ได้ ใช้ WAV, MP3, AAC/M4A หรือ OGG",
  errorMicDenied: "ไมโครโฟนถูกบล็อก อนุญาตแล้วลองใหม่",
  errorNoMic: "เครื่องนี้ไม่มีไมโครโฟน",
  errorInsecureOrigin: "ไมโครโฟนต้องใช้ที่อยู่ที่ปลอดภัย (https)",
  errorTooShort: "อัดอย่างน้อย {duration}",
  errorNoAudio: "ไม่ได้อัดอะไรเลย ปิดแอปอื่นที่ใช้ไมโครโฟน",
  errorRecordFailed: "อัดเสียงไม่สำเร็จ ลองใหม่",
  errorCaptureBlocked: "เบราว์เซอร์นี้อัดเสียงเครื่องยนต์ไม่ได้ ใช้ Chrome หรือเปิดไฟล์แทน",
  errorUnknown: "มีบางอย่างผิดพลาด ลองใหม่",
  errorWindowTooShort: "เลือกอย่างน้อย {duration}",
  errorNoSignal: "ตรงนี้ไม่มีเสียงเครื่องยนต์ที่สม่ำเสมอ ลองส่วนอื่น",
  errorWorkerFailed: "เริ่มการวิเคราะห์ไม่ได้ โหลดหน้าใหม่",
  languageLabel: "ภาษา",
  settings: "การตั้งค่า",
  theme: "ธีม",
  themeSystem: "ระบบ",
  themeLight: "สว่าง",
  themeDark: "มืด",
}
