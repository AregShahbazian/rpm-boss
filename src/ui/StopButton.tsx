import {useI18n} from '../i18n'
import {Icon} from './Icon'
import {Button} from './kit'

/**
 * Ends live mode, and says so by being the wrong size.
 *
 * It joins the source row rather than the stage, because it belongs with the
 * things that decide what the app is listening to. Twice an icon button wide
 * in portrait, so it is not mistaken for a fifth source; the full width of the
 * row in landscape, where the row wraps and this takes the line below — see
 * the `stop` shape in `kit.tsx`.
 */
export function StopButton({onStop}: { onStop: () => void }) {
  const {t} = useI18n()
  return (
    <Button shape="stop" tone="record" aria-label={t('stopListening')} onClick={onStop}>
      <Icon icon="mdi:stop"/>
    </Button>
  )
}
