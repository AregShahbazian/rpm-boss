/**
 * Handing a clip back to the user as a file.
 *
 * The app never keeps the bytes it was given: a recording arrives as raw PCM
 * from the microphone and a file is decoded and resampled on the way in, so
 * there is no original to hand back. What there is, is 16 kHz mono samples,
 * and the honest container for those is 16-bit PCM WAV — the same format the
 * test fixtures are in, playable by every browser and every Android player,
 * and lossless with respect to what the app actually holds. Ten seconds is
 * about 320 kB, which is small enough that compressing it would buy nothing
 * and would need an encoder the app does not otherwise carry.
 *
 * The two platforms want opposite things. A browser downloads: an anchor with
 * `download` set puts the file where downloads go and says so. A Capacitor
 * WebView has no download handler at all — the same anchor does nothing, in
 * silence — so Android writes the file into the app's own cache and opens the
 * share sheet on it, which is where "Save to Files", Drive and everything else
 * live. Neither path needs a permission, and the cache copy is the system's to
 * reclaim.
 */
import {Capacitor} from '@capacitor/core'
import {Directory, Filesystem} from '@capacitor/filesystem'
import {Share} from '@capacitor/share'
import {encodeWav} from '../dsp/wav'
import type {AudioClip} from './types'

/** Anything a file name should not carry, including the colons in a timestamp. */
const UNSAFE = /[^A-Za-z0-9._-]+/g

export function wavFilename(name: string): string {
  const base = name.replace(UNSAFE, '-').replace(/^-+|-+$/g, '')
  return `${base || 'recording'}.wav`
}

/**
 * `btoa` takes a binary string, and a string is built here rather than passed
 * through `String.fromCharCode(...bytes)` in one go: ten seconds is 320 000
 * arguments, which is past what an argument list holds.
 */
function toBase64(bytes: Uint8Array): string {
  const CHUNK = 0x8000
  let binary = ''
  for (let i = 0; i < bytes.length; i += CHUNK) {
    binary += String.fromCharCode(...bytes.subarray(i, i + CHUNK))
  }
  return btoa(binary)
}

export async function saveClip(clip: AudioClip): Promise<void> {
  const bytes = new Uint8Array(encodeWav(clip.samples, clip.sampleRate))
  const path = wavFilename(clip.source.name)

  if (Capacitor.isNativePlatform()) {
    const {uri} = await Filesystem.writeFile({path, data: toBase64(bytes), directory: Directory.Cache})
    await Share.share({files: [uri]})
    return
  }

  const url = URL.createObjectURL(new Blob([bytes], {type: 'audio/wav'}))
  const link = document.createElement('a')
  link.href = url
  link.download = path
  link.click()
  // Revoking in the same tick cancels the download in some browsers: the URL
  // has to outlive the click that started it.
  setTimeout(() => URL.revokeObjectURL(url), 0)
}
