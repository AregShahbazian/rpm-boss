/**
 * Keeping the screen alive while the app is being watched rather than touched.
 *
 * Live mode is the one screen nobody touches: the phone is propped against the
 * engine and the rider is turning a screw. Android's own timeout would put the
 * display out mid-measurement, and the standard answer — a wake lock — needs
 * no permission on either platform and no native code: the Screen Wake Lock
 * API is in the Android WebView as well as in Chrome.
 *
 * Every failure is swallowed. A browser without the API, a secure-origin rule,
 * a battery saver refusing the request — none of them is a reason to fail a
 * measurement, and none is worth a line of a screen that has one error line.
 */
interface Sentinel {
  release: () => Promise<void>
}

interface WakeLockCapable {
  wakeLock?: { request: (type: 'screen') => Promise<Sentinel> }
}

/**
 * Holds the screen awake until the returned function is called.
 *
 * The request is asynchronous and the caller is not: `stop` may well run
 * before the lock arrives, so the sentinel is released on arrival if it is no
 * longer wanted rather than leaked until the tab closes.
 */
export function keepScreenAwake(): () => void {
  let wanted = true
  let sentinel: Sentinel | undefined

  void (navigator as WakeLockCapable).wakeLock
    ?.request('screen')
    .then((lock) => {
      sentinel = lock
      if (!wanted) void lock.release().catch(() => undefined)
    })
    .catch(() => undefined)

  return () => {
    wanted = false
    void sentinel?.release().catch(() => undefined)
    sentinel = undefined
  }
}
