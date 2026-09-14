import {useRef} from 'react'
import {useI18n} from '../i18n'
import {Button} from './kit'
import {Icon} from './Icon.tsx';

interface Props {
  disabled?: boolean
  onFile: (file: File) => void
}

export function UploadButton({disabled, onFile}: Props) {
  const input = useRef<HTMLInputElement>(null)
  const {t} = useI18n()
  return (
    <>
      <input
        ref={input}
        type="file"
        accept="audio/*,.wav,.mp3,.m4a,.aac,.ogg"
        hidden
        onChange={(e) => {
          const f = e.target.files?.[0]
          e.target.value = ''
          if (f) onFile(f)
        }}
      />
      <Button shape={'icon'} aria-label={t('openAudio')} disabled={disabled} onClick={() => input.current?.click()}>
        <Icon icon={'ant-design:file-add-filled'}/>
      </Button>
    </>
  )
}
