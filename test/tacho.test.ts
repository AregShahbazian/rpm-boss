import {describe, expect, it} from 'vitest'
import {faceIn, FLOOR_RPM, rpmToAngle} from '../src/ui/dial'
import {MAX_RPM} from '../src/dsp/types'

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
    const angles = [0, 1000, 5000, 9000, 12_000].map(rpmToAngle)
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
