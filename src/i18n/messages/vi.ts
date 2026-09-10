/**
 * Tiếng Việt (vi).
 *
 * Translated by Claude, not yet reviewed by a native speaker. "RPM Boss" and
 * "rpm" are left as they are: one is a name, the other is what the gauge says.
 */
import type { Messages } from '../en'

export const messages: Messages = {
  statusIdle: "Mở một bản ghi, hoặc ghi âm động cơ.",
  statusDecoding: "Đang xử lý…",
  statusRecording: "Đang ghi. Đưa điện thoại lại gần động cơ.",
  statusLoaded: "Đã tải: {name} · {duration}",
  dismiss: "Đóng",
  openAudio: "Mở âm thanh",
  pickSample: "Thử một mẫu",
  record: "Ghi âm",
  stopRecording: "Dừng",
  play: "Phát",
  stopPlaying: "Dừng",
  rangeLegend: "Khoảng dự kiến (tùy chọn)",
  rangeMin: "Nhỏ nhất",
  rangeMax: "Lớn nhất",
  calculate: "Tính",
  analysing: "Đang phân tích…",
  rpm: "rpm",
  marked: "{count} lần nổ được đánh dấu",
  octaveUp: "theo khoảng của bạn, mỗi dấu là hai lần nổ",
  octaveDown: "theo khoảng của bạn, hai dấu là một lần nổ",
  errorTooLarge: "Quá lớn. Dùng bản ghi dưới 50 MB.",
  errorUndecodable: "Không mở được tệp đó. Dùng WAV, MP3, AAC/M4A hoặc OGG.",
  errorMicDenied: "Micrô bị chặn. Hãy cho phép rồi thử lại.",
  errorNoMic: "Thiết bị này không có micrô.",
  errorInsecureOrigin: "Micrô cần địa chỉ an toàn (https).",
  errorTooShort: "Ghi ít nhất {duration}.",
  errorNoAudio: "Không ghi được gì. Đóng các ứng dụng khác đang dùng micrô.",
  errorRecordFailed: "Ghi âm thất bại. Thử lại.",
  errorCaptureBlocked: "Trình duyệt này không ghi được tiếng động cơ. Dùng Chrome, hoặc mở tệp.",
  errorUnknown: "Có lỗi xảy ra. Thử lại.",
  errorWindowTooShort: "Chọn ít nhất {duration}.",
  errorNoSignal: "Không có tiếng động cơ đều ở đây. Thử phần khác.",
  errorWorkerFailed: "Không khởi động được phân tích. Tải lại trang.",
  languageLabel: "Ngôn ngữ",
  settings: "Cài đặt",
  theme: "Giao diện",
  themeSystem: "Hệ thống",
  themeLight: "Sáng",
  themeDark: "Tối",
}
