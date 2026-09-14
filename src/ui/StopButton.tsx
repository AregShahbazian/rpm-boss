import {useI18n} from '../i18n'
import {Icon} from './Icon'
import {Button} from './kit'

/**
 * Ends live mode, and says so by being the wrong size: 104 px — two icon
 * buttons and the gap between them — in a row of 48 px squares, so it is not
 * mistaken for a fifth source. It belongs with the things that decide what the
 * app is listening to, which is why it is up there and not on the stage.
 *
 * Where it sits is a layout decision with a history:
 *
 * - **Portrait** it joins the source row, wrapping to the next line only if it
 *   does not fit.
 * - **Landscape** it cannot be in that row at all. The control column is as
 *   wide as its widest row, so anything added to the row widens the column and
 *   the tachometer beside it shrinks by that much the moment live mode starts.
 *   Zero width was not enough: a flex gap is drawn before the item whether or
 *   not the item has any width, and eight pixels of tachometer still went.
 *
 * So there are two of it, one per layout, each hidden in the other — rather
 * than one that negative margins and percentage minimums shuffle into place.
 * Only ever one is in the tree that a screen reader or a test walks, because
 * `display: none` takes the other out of it entirely.
 */
export function StopButton({placement, onStop}: { placement: 'row' | 'own-row'; onStop: () => void }) {
  const {t} = useI18n()
  return (
    <div
      className={
        placement === 'row'
          ? 'split:hidden'
          : // Its own row in the control column. It shares the status area,
            // which is empty for as long as live mode runs: the idle status
            // says nothing, and an error is what stops live mode rather than
            // something that appears beside it.
            'hidden [grid-area:status] split:block'
      }
    >
      <Button shape="stop" tone="record" aria-label={t('stopListening')} onClick={onStop}>
        <Icon icon="mdi:stop"/>
      </Button>
    </div>
  )
}
