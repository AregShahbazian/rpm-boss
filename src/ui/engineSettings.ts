/**
 * What the rider says about the engine itself, as opposed to the gauge.
 *
 * The stroke is the one that matters: the analysis counts combustions, and
 * how many of those make one revolution is the difference between a
 * two-stroke and a four-stroke — the same sound is half the rpm on one of
 * them, and it arrives twice as fast. It sits outside the tachometer section
 * in the settings for that reason: it describes the motorcycle, not the
 * needle, and it is the one thing here a rider with a two-stroke must change
 * before the app is right for them.
 */
import {REVS_PER_PULSE, type RevsPerPulse} from '../dsp/types'
import {readChoice, useChoice} from './prefs'

/** Combustions per revolution: two-stroke fires once, four-stroke every other turn. */
export type Stroke = '2' | '4'

export const STROKES: readonly Stroke[] = ['2', '4']

/** Nearly every motorcycle still running is one. */
export const DEFAULT_STROKE: Stroke = '4'

const STROKE_KEY = 'rpm-boss.engine.stroke'

export const readStroke = (): Stroke => readChoice(STROKE_KEY, STROKES, DEFAULT_STROKE)

export const useStroke = (): [Stroke, (next: Stroke) => void] => useChoice(STROKE_KEY, STROKES, DEFAULT_STROKE)

/**
 * The stroke as the analysis wants it: revolutions per combustion. The only
 * place the two vocabularies meet — the dialog counts strokes, the DSP counts
 * turns per firing, and neither needs the other's word for it.
 */
export const revsPerPulse = (stroke: Stroke): RevsPerPulse => (stroke === '2' ? 1 : REVS_PER_PULSE)

/**
 * How many cylinders the engine has. One, and nothing else, for now.
 *
 * Not a preference: there is nothing to store, because there is nothing to
 * choose. The analysis finds a rhythm of combustions, and on a twin or a four
 * that rhythm is two or four times the one a single makes — an engine the app
 * would read as turning twice or four times as fast as it is. Until that
 * arithmetic exists the honest answer is that this works on singles, and the
 * settings say so by showing the row answered and greyed rather than by
 * leaving it out and letting a twin give a confident wrong number.
 */
export type Cylinders = '1' | '2' | '4'

export const CYLINDER_COUNTS: readonly Cylinders[] = ['1', '2', '4']

/** The only one the analysis is right for. */
export const CYLINDERS: Cylinders = '1'
