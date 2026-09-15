/**
 * The simulated engine: a synthesiser where the microphone usually is.
 *
 * Kept apart from `mock.ts` for one reason — this is the only module that names
 * `engine-worklet.js`, and a `new URL(…, import.meta.url)` emits its asset for
 * any module the bundler can reach. `mock.ts` reaches this one through a
 * dynamic import inside `if (__MOCK__)`, so in a build with the flag off the
 * branch is dead, this module is never in the graph, and no worklet is emitted.
 *
 * The graph is the whole design:
 *
 *   engine ─┬─→ gain ─────────→ destination      what the visitor hears
 *           └─→ capture tail ─→ onChunk          what the dial reads
 *
 * The tap is before the speakers, so a muted phone changes what is heard and
 * nothing about what is measured. One context and one generator, so the sound
 * and the samples are the same samples rather than two clocks that have to be
 * kept in step.
 */
import {InputError} from '../audio/types'
import {captureFrom, type LiveOptions} from './stream'
import type {MockEngine} from './mock'

/**
 * Not a `LiveCapture`: this one is always told the whole engine. Merging a
 * half-stated change onto what is running is `mock.ts`'s job, and it is the one
 * that survives the graph being torn down and rebuilt.
 */
export interface MockHandle {
  stop: () => void
  tune: (engine: MockEngine) => void
}

/**
 * How loud, both to the ear and to the analysis — they are the same signal, so
 * this is one number and not two. The DSP normalises, so it is a comfort
 * decision: enough to be heard over a laptop fan, short of the clipping the
 * processor's own `tanh` would otherwise be asked to do.
 */
const LEVEL = 0.5

/** `AudioParam` rather than a message: k-rate, so it lands within a render quantum. */
function apply(node: AudioWorkletNode, {rpm, revsPerPulse}: MockEngine): void {
  const set = (name: string, value: number) => {
    const param = node.parameters.get(name)
    if (param) param.value = value
  }
  set('rpm', rpm)
  set('revsPerPulse', revsPerPulse)
}

export async function openMockEngine(
  options: LiveOptions,
  engine: MockEngine,
  alive: () => boolean,
): Promise<MockHandle> {
  const context = new AudioContext()
  let node: AudioWorkletNode | undefined
  let stopped = false

  const stop = () => {
    if (stopped) return
    stopped = true
    // The processor returns false once it has been told, which is what takes it
    // off the render thread; closing the context is what takes the rest.
    node?.port.postMessage('stop')
    node?.disconnect()
    void context.close()
  }

  try {
    await context.audioWorklet.addModule(new URL('./engine-worklet.js', import.meta.url))
    if (!alive()) {
      stop()
      return {stop, tune: () => undefined}
    }
    node = new AudioWorkletNode(context, 'engine')
    apply(node, engine)
    const level = node.parameters.get('level')
    if (level) level.value = LEVEL

    const out = context.createGain()
    out.gain.value = 1
    node.connect(out).connect(context.destination)

    await captureFrom(context, node, options, 'mock-engine', () => alive() && !stopped)
  } catch (e) {
    stop()
    throw e instanceof InputError ? e : new InputError('listen-failed', e)
  }

  return {
    stop,
    tune: (next) => {
      if (node && !stopped) apply(node, next)
    },
  }
}
