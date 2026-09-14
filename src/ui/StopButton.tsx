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
 * is narrow enough to fit on the line above. A full-width wrapper breaks the
 * line and the button keeps its size inside it.
 *
 * And the line has to break, or the control column — which is as wide as its
 * widest row — grows by this button the moment live mode starts, with the
 * stage shrinking under it.
 */
export function StopButton({onStop}: { onStop: () => void }) {
  const {t} = useI18n()
  return (
    <div className="split:w-full">
      <Button shape="stop" tone="record" aria-label={t('stopListening')} onClick={onStop}>
        <Icon icon="mdi:stop"/>
      </Button>
    </div>
  )
}
