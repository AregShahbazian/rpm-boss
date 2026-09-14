import {useI18n} from '../i18n'
import {Icon} from './Icon'
import {Button} from './kit'

/**
 * Ends live mode, and says so by being the wrong size: 96 px wide in a row of
 * 48 px squares, so it is not mistaken for a fifth source. It joins the source
 * row rather than the stage, because it belongs with the things that decide
 * what the app is listening to.
 *
 * The wrapper is what puts it on the line below in landscape. Width on the
 * button itself cannot do it: a flex line breaks on the item's basis *after*
 * its own max-width has clamped it, so anything narrow enough to look right
 * is narrow enough to fit on the line above.
 *
 * Zero wide, then at least as wide as the row. The control column is sized to
 * its widest row, and a plain full-width wrapper is still measured at the
 * button's 104 px while that happens — so the column came out as the icons
 * *plus* this button, and the tachometer beside it shrank by exactly that when
 * live mode started. A width of zero is what the measurement sees; the minimum
 * is what the layout gets, and it is what breaks the line.
 */
export function StopButton({onStop}: { onStop: () => void }) {
  const {t} = useI18n()
  return (
    <div className="split:w-0 split:min-w-full">
      <Button shape="stop" tone="record" aria-label={t('stopListening')} onClick={onStop}>
        <Icon icon="mdi:stop"/>
      </Button>
    </div>
  )
}
