import { useEffect, useState } from 'react'

export interface Size {
  width: number
  height: number
}

/**
 * The rendered size of an element, in whole CSS pixels.
 *
 * The waveform canvases used to observe themselves. They cannot any more: the
 * block above them needs the width to decide how many seconds the detail view
 * spans, and that decision has to be made before the canvas is told what to
 * draw. Measuring in the parent and passing the numbers down keeps one
 * observer per canvas and one source of truth for the size.
 *
 * This returns a *callback ref* rather than taking a `useRef` object, and that
 * is the whole point of its shape. A ref object never changes identity, so an
 * effect keyed on it runs once, when the component mounts — and the overview
 * strip is not mounted then. It appears only after the detail canvas has been
 * measured and the clip turns out to be longer than the view. With a ref
 * object the observer would never attach to it and it would stay 0 by 0 and
 * draw nothing. A callback ref fires on the element itself, whenever it
 * arrives or leaves.
 *
 * The state is only replaced when a rounded dimension actually changes, so a
 * sub-pixel reflow does not redraw the waveform.
 */
export function useElementSize(): [(el: HTMLElement | null) => void, Size] {
  const [el, setEl] = useState<HTMLElement | null>(null)
  const [size, setSize] = useState<Size>({ width: 0, height: 0 })

  useEffect(() => {
    if (!el) return
    const read = (width: number, height: number) => {
      const next = { width: Math.round(width), height: Math.round(height) }
      setSize((prev) => (prev.width === next.width && prev.height === next.height ? prev : next))
    }
    // `observe` delivers a first entry of its own, so there is no separate
    // read here: doing one would be a synchronous setState inside the effect,
    // and a second render for a number the observer is about to supply.
    const ro = new ResizeObserver(([entry]) => read(entry.contentRect.width, entry.contentRect.height))
    ro.observe(el)
    return () => ro.disconnect()
  }, [el])

  return [setEl, size]
}
