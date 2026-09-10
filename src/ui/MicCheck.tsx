import { useState } from 'react'

/**
 * Development only. Answers one question the phone cannot otherwise be asked
 * without a cable and a devtools session: is the microphone stream itself
 * silent, or is the app's capture path losing it?
 *
 * It opens the microphone twice, once with the voice processors off and once
 * with the browser defaults, and measures each stream two ways — through an
 * analyser node hung directly off the source, and through the same worklet the
 * recorder uses. Four numbers, and between them they say where the audio dies.
 */

interface Probe {
  label: string
  settings: string
  contextRate: number
  contextState: string
  analyserRms: string
  workletFrames: number
  workletPeak: number
  error?: string
}

const DURATION_MS = 3000

async function probe(label: string, audio: MediaTrackConstraints): Promise<Probe> {
  const result: Probe = {
    label,
    settings: '',
    contextRate: 0,
    contextState: '',
    analyserRms: '',
    workletFrames: 0,
    workletPeak: 0,
  }
  let stream: MediaStream | undefined
  let context: AudioContext | undefined
  try {
    stream = await navigator.mediaDevices.getUserMedia({ audio })
    const track = stream.getAudioTracks()[0]
    const s = track.getSettings() as Record<string, unknown>
    result.settings = ['echoCancellation', 'noiseSuppression', 'autoGainControl', 'sampleRate', 'channelCount']
      .map((k) => `${k}=${String(s[k])}`)
      .join(' ')

    context = new AudioContext()
    await context.resume()
    result.contextRate = context.sampleRate
    result.contextState = context.state

    const source = context.createMediaStreamSource(stream)
    const muted = context.createGain()
    muted.gain.value = 0
    muted.connect(context.destination)

    const analyser = context.createAnalyser()
    analyser.fftSize = 2048
    source.connect(analyser)
    analyser.connect(muted)

    await context.audioWorklet.addModule(new URL('../audio/capture-worklet.js', import.meta.url))
    const capture = new AudioWorkletNode(context, 'capture')
    capture.port.onmessage = (event: MessageEvent<Float32Array>) => {
      result.workletFrames += event.data.length
      for (const v of event.data) result.workletPeak = Math.max(result.workletPeak, Math.abs(v))
    }
    source.connect(capture)
    capture.connect(muted)

    const buf = new Float32Array(analyser.fftSize)
    const readings: number[] = []
    const started = performance.now()
    while (performance.now() - started < DURATION_MS) {
      await new Promise((r) => setTimeout(r, 250))
      analyser.getFloatTimeDomainData(buf)
      let sum = 0
      for (const v of buf) sum += v * v
      readings.push(Math.sqrt(sum / buf.length))
    }
    result.analyserRms = readings.map((r) => r.toFixed(4)).join(' ')
  } catch (e) {
    result.error = `${(e as Error)?.name ?? ''}: ${(e as Error)?.message ?? String(e)}`
  } finally {
    stream?.getTracks().forEach((t) => t.stop())
    void context?.close()
  }
  return result
}

export function MicCheck() {
  const [report, setReport] = useState<string>('')
  const [busy, setBusy] = useState(false)

  if (!import.meta.env.DEV) return null

  const run = async () => {
    setBusy(true)
    setReport('listening…')
    const probes = [
      await probe('all processors OFF', {
        echoCancellation: false,
        noiseSuppression: false,
        autoGainControl: false,
        channelCount: 1,
      }),
      // The phase 2 combination: echo cancellation left alone, the other two
      // off. This is what recorded audio that then faded after a second.
      await probe('echo cancel ON, rest off', {
        noiseSuppression: false,
        autoGainControl: false,
        channelCount: 1,
      }),
      await probe('browser defaults', {}),
    ]
    setReport(
      probes
        .map((p) =>
          [
            `— ${p.label}`,
            p.error ? `  ERROR ${p.error}` : '',
            `  granted   ${p.settings}`,
            `  context   ${p.contextRate} Hz, ${p.contextState}`,
            `  analyser  ${p.analyserRms || '(none)'}`,
            `  worklet   ${p.workletFrames} frames, peak ${p.workletPeak.toFixed(5)}`,
          ]
            .filter(Boolean)
            .join('\n'),
        )
        .join('\n\n'),
    )
    setBusy(false)
  }

  return (
    <div className="miccheck">
      <button type="button" className="link" disabled={busy} onClick={() => void run()}>
        Mic check (dev)
      </button>
      <span className="muted"> — play the engine sound while it runs (~9 s)</span>
      {report && <pre className="mono">{report}</pre>}
    </div>
  )
}
