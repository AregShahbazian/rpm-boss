import {css} from '@emotion/react'
import {useMemo, useState} from 'react'
import {useAnalysis} from '../state/useAnalysis'
import {useAudioInput} from '../state/useAudioInput'
import type {ExpectedRange} from '../dsp/types'
import {FEATURES} from '../features'
import {useI18n} from '../i18n'
import {saveClip} from '../audio/save'
import {SPLIT, TALL} from './breakpoints'
import {Button} from './kit'
import {LiveStage} from './LiveStage'
import {Player} from './Player'
import {RangeFields} from './RangeFields'
import {ResultView} from './ResultView'
import {RecordButton} from './RecordButton'
import {SampleButton} from './SampleButton'
import {SettingsButton} from './SettingsButton.tsx'
import {StatusLine} from './StatusLine'
import {UploadButton} from './UploadButton'
import {type Marks, WaveformBlock} from './WaveformBlock'

/*
 * One grid, one DOM order, two layouts. The DOM order is the stacked one, so
 * it is also the reading order for a screen reader; the split layout only
 * re-places the areas. Grid columns follow the inline direction, which is what
 * makes Urdu put the controls on the right for free.
 *
 * Each child names its own `grid-area`, so this block owns the shape and
 * nothing else owns a piece of it.
 */
/**
 * A grid row, or nothing at all.
 *
 * A named area with no element in it is still a row: it collapses to no
 * height, but the gap above and below it is still drawn, so switching the
 * fields off would leave a double gap where they used to be. Taking the row
 * out of the template is what actually removes it — and the track with it, in
 * the split layout, where the rows are listed explicitly.
 */
const withRange = (value: string) => (FEATURES.expectedRange ? value : '')

const SCREEN = css`
  display: grid;
  gap: var(--gap);
  max-inline-size: 480px;
  margin-inline: auto;
  padding-block: calc(24px + var(--safe-t)) calc(24px + var(--safe-b));
  padding-inline: calc(16px + var(--safe-l)) calc(16px + var(--safe-r));
  grid-template-areas: 'source' 'status' 'wave' 'transport' ${withRange("'range'")} 'calc' 'result';

  /*
   * The split needs width *and* a landscape shape. Width alone put a portrait
   * tablet — 1137 by 1707 — into the landscape layout, where the whole app
   * collapsed into a 289 px band across the middle of the screen with 693 px
   * of nothing above and below it. A waveform gains almost nothing from height
   * and everything from width, so a tall screen wants the stacked column, not
   * a squashed split.
   */
  @media ${SPLIT} {
    max-inline-size: none;
    block-size: 100dvh;
    /* Tighter than the stacked layout: a phone on its side has 360 px of
       height to hold everything the portrait screen holds in 640. */
    --gap: 8px;
    padding-block: calc(10px + var(--safe-t)) calc(10px + var(--safe-b));
    padding-inline: calc(10px + var(--safe-l)) calc(10px + var(--safe-r));
    /*
     * The leftover height goes to the result row, which means it goes to the
     * waveform too: the wave spans rows one to four, so its height is whatever
     * those rows come to. Centring a block of content-sized rows instead left
     * 60 % of a tablet empty and the waveform a 185 px strip. The control
     * column spreads out with it — buttons at the top, Calculate at the
     * bottom, the number with air around it — and the detail view carries the
     * cap that stops the waveform growing without limit.
     */
    grid-template-rows: auto auto minmax(0, 1fr) ${withRange('auto')} auto;
    /*
     * The control column is as wide as its widest control and no wider: four
     * icon buttons, or the rpm figure once there is one. It used to be a
     * clamp, sized for two labelled buttons on one line; the labels are gone,
     * and holding that width would have left a third of a landscape phone
     * empty beside the waveform.
     */
    grid-template-columns: auto minmax(0, 1fr);
    grid-template-areas:
      'source wave'
      'status wave'
      'result wave'
      ${withRange("'range  wave'")}
      'calc   transport';
  }

  /* Stacked on a big screen — a portrait tablet — the 480 px column is a
     ribbon. Give it room, and the waveform with it. "orientation" rather than
     a pair of aspect-ratio bounds, because min-aspect-ratio: 1/1 and
     max-aspect-ratio: 1/1 both match a square viewport and the two blocks
     would fight over it; portrait and landscape are exclusive by definition,
     and a square screen counts as portrait. */
  @media ${TALL} {
    max-inline-size: 720px;
  }
`

/*
 * The empty screen is the same two columns as the loaded one: the source row
 * on the left, the stage where the waveform goes. Nothing about it is a
 * special shape — only the right-hand column has different contents.
 *
 * The split rules are written out in full rather than inherited from the block
 * above, because every declaration outside a nested block is emitted in one
 * rule *before* the media rules, whatever the source order. A bare
 * `grid-template-areas` here would lose to the split layout's own instead of
 * overriding it, the `stage` area would not exist in landscape, and the
 * placeholder would land in an implicit row with no height.
 */
const SCREEN_EMPTY = css`
  min-block-size: 100dvh;
  grid-template-columns: minmax(0, 1fr);
  grid-template-rows: auto auto minmax(0, 1fr);
  grid-template-areas: 'source' 'status' 'stage';

  @media ${SPLIT} {
    grid-template-columns: auto minmax(0, 1fr);
    grid-template-rows: auto minmax(0, 1fr);
    grid-template-areas:
      'source stage'
      'status stage';
  }
`

export function InputScreen() {
  const {state, getWindowClip, upload, startRecording, stopRecording, clear, dismissError, togglePlay, setSelection} =
    useAudioInput()
  const [range, setRange] = useState({minRpm: '', maxRpm: ''})
  const {t} = useI18n()
  // Any change to the clip or the window clears the last result.
  const windowKey = `${state.clipId}:${state.selection.startS}:${state.selection.endS}`
  const {analysis, analyse} = useAnalysis(windowKey)

  const busy = state.status === 'decoding' || state.status === 'recording'
  const running = analysis.status === 'running'

  // The window the marks belong to, held so they are drawn against what was
  // analysed rather than whatever the crop is now. It is replaced on each
  // Calculate; `useAnalysis` drops the result the moment the clip or the
  // window changes, which is what takes the marks off the waveform again.
  const [analysedWindow, setAnalysedWindow] = useState<{ offsetS: number; windowS: number } | undefined>(undefined)

  const marks = useMemo<Marks | undefined>(
    () =>
      analysis.status === 'done' && analysis.result && analysedWindow
        ? {timesS: analysis.result.pulseTimesS, offsetS: analysedWindow.offsetS, windowS: analysedWindow.windowS}
        : undefined,
    [analysis, analysedWindow],
  )

  const onSave = () => {
    // Nothing to say if it fails: the browser's own download UI reports its
    // problems, and on Android a dismissed share sheet rejects the same way a
    // failed write does. Worth seeing while developing, not worth a line of
    // the screen.
    if (state.clip) void saveClip(state.clip).catch((e) => import.meta.env.DEV && console.error('save failed', e))
  }

  const onCalculate = () => {
    const clip = getWindowClip()
    if (!clip) return
    setAnalysedWindow({offsetS: state.selection.startS, windowS: clip.durationS})
    void analyse(clip, windowKey, parseRange(range))
  }

  // Nothing to split until there is something to show in the second column.
  const loaded = state.clip !== undefined && state.status !== 'recording'

  // The stage belongs to the resting screen only. It keeps its room while a
  // recording runs, a file decodes or an error stands — the layout does not
  // move under the counter or the message — but shows nothing: a tachometer
  // reading zero next to "recording too short" would look like its answer.
  const stage = state.status === 'idle'

  return (
    <main css={loaded ? SCREEN : [SCREEN, SCREEN_EMPTY]}>
      {/* No title: the launcher, the tab and the app switcher all carry the
          name already, and on a phone the screen is short enough that a
          heading costs more than it says. */}
      <div className="flex flex-wrap gap-3 [grid-area:source] split:gap-2">
        <RecordButton
          recording={state.status === 'recording'}
          disabled={state.status === 'decoding'}
          onStart={startRecording}
          onStop={stopRecording}
        />
        <UploadButton disabled={busy} onFile={upload}/>
        <SampleButton disabled={busy} onFile={upload}/>
        <SettingsButton/>
      </div>
      {/* Zero wide, then at least as wide as its area. The column beside the
          stage is sized to the buttons, and an `auto` track takes the widest
          thing in it — so a sentence-long error would push the stage across
          the screen. A width of zero is what the track sees; the minimum is
          what the text gets, and it wraps inside it. */}
      <div className="w-0 min-w-full [grid-area:status]">
        <StatusLine state={state} onDismiss={dismissError} onClear={clear} onSave={onSave}/>
      </div>
      {stage && (
        <div className="min-h-0 [grid-area:stage]">
          <LiveStage/>
        </div>
      )}
      {state.clip && state.status !== 'recording' && (
        <>
          <div className="min-w-0 [grid-area:wave]">
            <WaveformBlock
              clip={state.clip}
              selection={state.selection}
              onChange={setSelection}
              positionS={state.playing ? state.positionS : undefined}
              marks={marks}
            />
          </div>
          <div className="[grid-area:transport]">
            <Player
              playing={state.playing}
              positionS={state.playing ? state.positionS - state.selection.startS : 0}
              durationS={state.selection.endS - state.selection.startS}
              onToggle={togglePlay}
            />
          </div>
          {FEATURES.expectedRange && (
            <div className="[grid-area:range]">
              <RangeFields {...range} disabled={running} onChange={setRange}/>
            </div>
          )}
          <div className="flex [grid-area:calc]">
            <Button disabled={busy || running} onClick={onCalculate}>
              {t('calculate')}
            </Button>
          </div>
          <div className="[grid-area:result] split:self-center">
            <ResultView analysis={analysis}/>
          </div>
        </>
      )}
    </main>
  )
}

/** Both fields filled and sane, or no range at all. */
function parseRange(fields: { minRpm: string; maxRpm: string }): ExpectedRange | undefined {
  const minRpm = Number(fields.minRpm)
  const maxRpm = Number(fields.maxRpm)
  if (!fields.minRpm || !fields.maxRpm || !(minRpm > 0) || !(maxRpm > minRpm)) return undefined
  return {minRpm, maxRpm}
}
