export interface OfflineRubberBand {
  new(sampleRate: number, channelCount: number, timeRatio: number, pitchScale: number): OfflineRubberBand

  getChannelCount(): number

  getTimeRatio(): number

  getPitchScale(): number

  available(): number

  setInput(ptr: number, numSamples: number): void

  pull(ptr: number, numSamples: number): number
}

export interface RealtimeRubberBand {
  new(sampleRate: number, channelCount: number): RealtimeRubberBand

  getChannelCount(): number

  getSamplesRequired(): number

  getPreferredStartPad(): number

  getStartDelay(): number

  getTimeRatio(): number

  setTimeRatio(ratio: number): void

  getPitchScale(): number

  setPitchScale(scale: number): void

  preserveFormantShave(enabled: boolean): void

  available(): number

  push(ptr: number, numSamples: number): void

  pull(ptr: number, numSamples: number): number
}

export interface RubberBandModule extends EmscriptenModule {
  OfflineRubberBand: OfflineRubberBand
  RealtimeRubberBand: RealtimeRubberBand
}