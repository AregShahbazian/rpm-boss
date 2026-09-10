/**
 * The source language, and the type every other file must satisfy.
 *
 * Each key carries a note saying what the user just did. A translator seeing
 * "Too short" alone cannot tell whether it is about a recording, a password or
 * a name; one line of context is the difference between a translation that
 * reads naturally and one that reads like a manual.
 *
 * Two things are never translated: the app's name, and `rpm`, which is a unit
 * printed on the tachometers these riders already know.
 */
export const en = {
  // Nothing loaded yet. Both ways in are on screen above this line.
  statusIdle: 'Open a recording, or record the engine.',
  // A file or a recording is being decoded. Lasts under a second.
  statusDecoding: 'Decoding…',
  // The microphone is live and the countdown is running.
  statusRecording: 'Recording. Hold the phone near the engine.',
  // A recording is loaded. {name} is the file name, {duration} its length.
  statusLoaded: 'Loaded: {name} · {duration}',
  // Clears an error message so the user can try again.
  dismiss: 'Dismiss',

  // Opens the device's file picker. Not "upload": nothing is sent anywhere.
  openAudio: 'Open audio',
  // Starts recording from the microphone.
  record: 'Record',
  // Ends the recording early. {elapsed} and {max} are seconds.
  stopRecording: 'Stop {elapsed} / {max} s',
  // Plays back the selected part of the recording.
  play: 'Play',
  // Stops playback.
  stopPlaying: 'Stop',

  // Optional minimum and maximum the engine is expected to be turning at.
  rangeLegend: 'Expected range (optional)',
  rangeMin: 'Min',
  rangeMax: 'Max',
  // Runs the analysis on the selected part.
  calculate: 'Calculate',
  // The analysis is running. Usually well under a second.
  analysing: 'Analysing…',

  // The unit beside the result. Never translate: it is what the gauge says.
  rpm: 'rpm',
  // How many combustions were found. {count} is a whole number.
  marked: '{count} marked',
  // The expected range doubled the reading, so each mark is two combustions.
  octaveUp: 'your range says each mark is two combustions',
  // The expected range halved the reading, so two marks are one combustion.
  octaveDown: 'your range says two marks are one combustion',

  // The chosen file is bigger than the app will read.
  errorTooLarge: 'Too big. Use a recording under 50 MB.',
  // The chosen file is not audio the browser can decode.
  errorUndecodable: 'Cannot open that file. Use WAV, MP3, AAC/M4A or OGG.',
  // The user refused the microphone permission.
  errorMicDenied: 'Microphone blocked. Allow it, then try again.',
  // The device has no microphone at all.
  errorNoMic: 'No microphone on this device.',
  // The page is on http, where browsers refuse microphone access.
  errorInsecureOrigin: 'The microphone needs a secure address (https).',
  // The recording or file is shorter than the analysis needs. {duration} is a length.
  errorTooShort: 'Record at least {duration}.',
  // The microphone was open but delivered nothing.
  errorNoAudio: 'Nothing was recorded. Close other apps using the microphone.',
  // Recording failed for a reason we cannot name.
  errorRecordFailed: 'Recording failed. Try again.',
  // This browser grants unprocessed recording and then delivers silence.
  errorCaptureBlocked: 'This browser cannot record engine sound. Use Chrome, or open a file.',

  // The selected part is shorter than the analysis needs. {duration} is a length.
  errorWindowTooShort: 'Choose at least {duration}.',
  // The audio has no steady rhythm in it, so no rpm can be given.
  errorNoSignal: 'No steady engine sound here. Try another part.',
  // The analysis worker could not be started at all.
  errorWorkerFailed: 'Analysis could not start. Reload the page.',

  // Labels the language chooser for someone who cannot read the current language.
  languageLabel: 'Language',
} as const

export type MessageKey = keyof typeof en
export type Messages = Record<MessageKey, string>
