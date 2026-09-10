/**
 * Հայերեն (hy).
 *
 * Translated by Claude, not yet reviewed by a native speaker. "RPM Boss" and
 * "rpm" are left as they are: one is a name, the other is what the gauge says.
 */
import type { Messages } from '../en'

export const messages: Messages = {
  statusIdle: "Բացեք ձայնագրություն կամ ձայնագրեք շարժիչը։",
  statusDecoding: "Մշակվում է…",
  statusRecording: "Ձայնագրվում է։ Հեռախոսը մոտ պահեք շարժիչին։",
  statusLoaded: "Բեռնված է՝ {name} · {duration}",
  dismiss: "Փակել",
  openAudio: "Բացել ձայնագրություն",
  pickSample: "Փորձել նմուշը",
  record: "Ձայնագրել",
  stopRecording: "Կանգ",
  play: "Նվագարկել",
  stopPlaying: "Կանգ",
  rangeLegend: "Սպասվող միջակայք (ըստ ցանկության)",
  rangeMin: "Նվազ.",
  rangeMax: "Առավ.",
  calculate: "Հաշվել",
  analysing: "Վերլուծվում է…",
  rpm: "rpm",
  marked: "նշված է {count} բռնկում",
  octaveUp: "ըստ ձեր միջակայքի՝ յուրաքանչյուր նշան երկու բռնկում է",
  octaveDown: "ըստ ձեր միջակայքի՝ երկու նշանը մեկ բռնկում է",
  errorTooLarge: "Չափազանց մեծ է։ Վերցրեք 50 ՄԲ-ից փոքր ձայնագրություն։",
  errorUndecodable: "Այդ ֆայլը չի բացվում։ Վերցրեք WAV, MP3, AAC/M4A կամ OGG։",
  errorMicDenied: "Խոսափողն արգելափակված է։ Թույլատրեք և կրկնեք։",
  errorNoMic: "Այս սարքում խոսափող չկա։",
  errorInsecureOrigin: "Խոսափողին անհրաժեշտ է անվտանգ հասցե (https)։",
  errorTooShort: "Ձայնագրեք առնվազն {duration}։",
  errorNoAudio: "Ոչինչ չի ձայնագրվել։ Փակեք խոսափողն օգտագործող այլ հավելվածները։",
  errorRecordFailed: "Ձայնագրումը ձախողվեց։ Կրկնեք։",
  errorCaptureBlocked: "Այս դիտարկիչը չի ձայնագրում շարժիչի ձայնը։ Օգտագործեք Chrome կամ բացեք ֆայլ։",
  errorUnknown: "Ինչ-որ բան սխալ գնաց։ Կրկնեք։",
  errorWindowTooShort: "Ընտրեք առնվազն {duration}։",
  errorNoSignal: "Այստեղ շարժիչի կայուն ձայն չկա։ Փորձեք այլ հատված։",
  errorWorkerFailed: "Վերլուծությունը չմեկնարկեց։ Վերբեռնեք էջը։",
  languageLabel: "Լեզու",
}
