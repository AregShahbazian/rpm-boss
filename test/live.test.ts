import {describe, expect, it} from 'vitest'
import {displayRpm, type LiveState} from '../src/state/useLive'

const listening = (over: Partial<LiveState> = {}): LiveState => ({
  status: 'listening',
  quiet: false,
  ...over,
})

describe('displayRpm', () => {
  it('says nothing before live mode is running', () => {
    expect(displayRpm({status: 'off', quiet: false}, 'hold')).toBeUndefined()
    expect(displayRpm({status: 'starting', quiet: false, reading: 1600}, 'hold')).toBeUndefined()
  })

  it('shows the reading while the engine is heard', () => {
    expect(displayRpm(listening({reading: 1603}), 'zero')).toBe(1603)
    expect(displayRpm(listening({reading: 1603}), 'hold')).toBe(1603)
  })

  it('drops the reading on a quiet window when asked to', () => {
    expect(displayRpm(listening({reading: 1603, quiet: true}), 'zero')).toBeUndefined()
  })

  it('keeps it on a quiet window when asked to hold', () => {
    expect(displayRpm(listening({reading: 1603, quiet: true}), 'hold')).toBe(1603)
  })

  it('has nothing to hold before the first reading arrives', () => {
    expect(displayRpm(listening({quiet: true}), 'hold')).toBeUndefined()
  })
})
