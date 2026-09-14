import {describe, expect, it} from 'vitest'
import {faceIn, FLOOR_RPM, rpmToAngle} from '../src/ui/dial'
import {MAX_RPM, REDLINE_RPM} from '../src/dsp/types'
import {MAX_RPM_BOUNDS, REDLINE_MIN, redlineBounds} from '../src/ui/liveSettings'

describe('rpmToAngle', () => {
  it('starts and ends where the face does', () => {
    expect(rpmToAngle(0)).toBe(150)
    expect(rpmToAngle(MAX_RPM)).toBe(390)
  })

  it('clamps rather than sweeping past the stop', () => {
    expect(rpmToAngle(MAX_RPM * 2)).toBe(rpmToAngle(MAX_RPM))
    expect(rpmToAngle(-500)).toBe(rpmToAngle(0))
  })

  it('rises with the reading', () => {
    // Not `.map(rpmToAngle)`: the face is its second argument, and `map`
    // would hand it the index.
    const angles = [0, 1000, 5000, 9000, 12_000].map((rpm) => rpmToAngle(rpm))
    const sorted = [...angles].sort((a, b) => a - b)
    expect(angles).toEqual(sorted)
    expect(new Set(angles).size).toBe(angles.length)
  })

  it('puts the middle of the range in the middle of the sweep', () => {
    expect(rpmToAngle(MAX_RPM / 2)).toBe(270)
  })

  it('agrees with the estimator about where it stops being able to read', () => {
    expect(FLOOR_RPM).toBe(600)
  })

  it('fits the sweep to whatever face it is given', () => {
    expect(rpmToAngle(0, 9000)).toBe(150)
    expect(rpmToAngle(9000, 9000)).toBe(390)
    expect(rpmToAngle(4500, 9000)).toBe(270)
  })

  it('pins the needle at a reading past the end of a smaller face', () => {
    // The needle stops; the figure under the dial is not clamped and says by
    // how much it was passed.
    expect(rpmToAngle(10_200, 9000)).toBe(rpmToAngle(9000, 9000))
  })
})

describe('the face a rider may ask for', () => {
  it('is never smaller than the class the app is for revs to', () => {
    // A Click, a Sniper and a Raider redline at 9,500 to 11,000; a dial that
    // stopped below that would have its stop inside the working range.
    expect(MAX_RPM_BOUNDS.min).toBe(9000)
  })

  it('is never bigger than what the analysis can read', () => {
    expect(MAX_RPM_BOUNDS.max).toBe(MAX_RPM)
    expect(MAX_RPM_BOUNDS.fallback).toBe(MAX_RPM)
  })

  it('starts at the values the app shipped with', () => {
    expect(MAX_RPM_BOUNDS.fallback).toBe(MAX_RPM)
    expect(redlineBounds(MAX_RPM).fallback).toBe(REDLINE_RPM)
  })

  it('never lets the redline off the end of the dial', () => {
    expect(redlineBounds(9000).max).toBe(9000)
    // Shrinking the dial past the default redline brings the default down too.
    expect(redlineBounds(9000).fallback).toBe(9000)
    expect(redlineBounds(12_000).fallback).toBe(REDLINE_RPM)
  })

  it('lets the redline go down to the bottom of what can be read', () => {
    expect(REDLINE_MIN).toBe(600)
    expect(redlineBounds(12_000).min).toBe(600)
  })
})

describe('faceIn', () => {
  it('fills the width of a box wider than it is tall', () => {
    // 240 degrees is two radii wide and 1.87 tall, so a 400x300 box is
    // height-limited and the dial is bigger than a circle in it would be.
    const {r} = faceIn(400, 300, 0)
    expect(r).toBeCloseTo(300 / 1.866, 1)
    expect(r).toBeGreaterThan(150)
  })

  it('is limited by width when the box is tall', () => {
    const {r, cx} = faceIn(200, 900, 0)
    expect(r).toBe(100)
    expect(cx).toBe(100)
  })

  it('leaves the margin it is given', () => {
    expect(faceIn(200, 900, 10).r).toBe(90)
  })

  it('centres the drawing, not the circle', () => {
    const {r, cy} = faceIn(200, 900, 0)
    // The sweep reaches r above the centre and 0.866r below it, so the centre
    // sits below the middle of the box by half the difference.
    expect(cy).toBeCloseTo(450 + (r * (1 - Math.cos(Math.PI / 6))) / 2, 5)
  })
})
