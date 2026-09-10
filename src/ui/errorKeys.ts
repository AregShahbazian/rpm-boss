import type { InputErrorCode } from '../audio/types'
import type { AnalysisErrorCode } from '../dsp/types'
import type { MessageKey } from '../i18n'

/**
 * Errors travel as codes and are turned into words here, at the edge. The
 * modules that raise them have no business knowing what language the user
 * reads, and a code survives a worker boundary where a translated string would
 * arrive already in the wrong language.
 */
export const INPUT_ERROR_KEYS: Record<InputErrorCode, MessageKey> = {
  'too-large': 'errorTooLarge',
  undecodable: 'errorUndecodable',
  'mic-denied': 'errorMicDenied',
  'no-mic': 'errorNoMic',
  'insecure-origin': 'errorInsecureOrigin',
  'too-short': 'errorTooShort',
  'no-audio': 'errorNoAudio',
  'record-failed': 'errorRecordFailed',
  'capture-blocked': 'errorCaptureBlocked',
}

export const ANALYSIS_ERROR_KEYS: Record<AnalysisErrorCode, MessageKey> = {
  'too-short': 'errorWindowTooShort',
  'no-signal': 'errorNoSignal',
  'worker-failed': 'errorWorkerFailed',
}
