/**
 * Audio worklet that forwards raw microphone frames to the main thread.
 *
 * Plain JavaScript, and loaded by URL rather than imported, because that is
 * what `AudioWorklet.addModule` takes. It runs in its own global scope with no
 * access to the rest of the app.
 */
class CaptureProcessor extends AudioWorkletProcessor {
  process(inputs) {
    const channel = inputs[0]?.[0]
    // A copy, because the render quantum's buffer is reused on the next call.
    if (channel && channel.length) this.port.postMessage(channel.slice())
    return true
  }
}

registerProcessor('capture', CaptureProcessor)
