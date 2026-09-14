import {describe, expect, it} from 'vitest'
import {wavFilename} from '../src/audio/save'

describe('wavFilename', () => {
  it('takes the colons out of a recording name', () => {
    // What `timeLabel` produces. Colons are legal in neither a Windows path
    // nor an Android MediaStore display name.
    expect(wavFilename('Recording 17:30:05')).toBe('Recording-17-30-05.wav')
  })

  it('keeps a file name that is already safe', () => {
    expect(wavFilename('sample-1.m4a')).toBe('sample-1.m4a.wav')
  })

  it('falls back rather than producing a bare extension', () => {
    expect(wavFilename('///')).toBe('recording.wav')
    expect(wavFilename('')).toBe('recording.wav')
  })
})
