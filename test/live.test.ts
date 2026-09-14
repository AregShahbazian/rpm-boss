import {describe, expect, it} from 'vitest'
import {displayRpm, type LiveState} from '../src/state/useLive'

const listening = (over: Partial<LiveState> = {}): LiveState => ({
  status: 'listening',
  quiet: false,
  ...over,
})

describe('displayRpm', () => {
  it('says nothing before live mode is running', () => {
    expect(displayRpm({status: 'off', quiet: false})).toBeUndefined()
    expect(displayRpm({status: 'starting', quiet: false, reading: 1600})).toBeUndefined()
  })

  it('shows the reading while the engine is heard', () => {
    expect(displayRpm(listening({reading: 1603}))).toBe(1603)
  })

  it('drops the reading on a quiet window', () => {
    expect(displayRpm(listening({reading: 1603, quiet: true}))).toBeUndefined()
  })

  it('says nothing when there has been no reading at all', () => {
    expect(displayRpm(listening({quiet: true}))).toBeUndefined()
  })
})

