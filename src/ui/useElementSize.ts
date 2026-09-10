import { useEffect, useState, type RefObject } from 'react'

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
 * The state is only replaced when a rounded dimension actually changes, so a
 * sub-pixel reflow does not redraw the waveform.
 */
export function useElementSize(ref: RefObject<HTMLElement | null>): Size {
  const [size, setSize] = useState<Size>({ width: 0, height: 0 })

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const read = (width: number, height: number) => {
      const next = { width: Math.round(width), height: Math.round(height) }
      setSize((prev) => (prev.width === next.width && prev.height === next.height ? prev : next))
    }
    const ro = new ResizeObserver(([entry]) => read(entry.contentRect.width, entry.contentRect.height))
    ro.observe(el)
    const rect = el.getBoundingClientRect()
    read(rect.width, rect.height)
    return () => ro.disconnect()
  }, [ref])

  return size
}
