export interface SoundTouch {
  new(): SoundTouch

  getVersionId(): number

  setPitch(pitch: number): void

  setPitchOctaves(pitch: number): void

  setPitchSemiTones(pitch: number): void

  setSampleRate(sampleRate: number): void

  setRate(rate: number): void

  setRateChange(rate: number): void

  setTempo(tempo: number): void

  setTempoChange(tempo: number): void

  setChannels(numChannels: number): void

  numChannels(): number

  numSamples(): number

  numUnprocessedSamples(): number

  getInputOutputSampleRatio(): number

  putSamples(ptr: number, length: number): void

  receiveSamples(ptr: number, length: number): number

  flush(): void

  clear(): void
}

export interface SoundStretch {
  new(sampleRate: number, numChannels: number): SoundStretch

  getVersion(): number

  setPitch(pitch: number): void

  setTempo(tempo: number): void

  push(ptr: number, length: number): void

  pull(ptr: number, length: number): void

  //getSamplesAvailable(): number
}

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

  available(): number

  push(ptr: number, numSamples: number): void

  pull(ptr: number, numSamples: number): number
}

export interface Test {
  new(size: number, numChannels: number): Test

  write(ptr: number, length: number): void

  modify(factor: number): void

  read(ptr: number, length: number): void
}

export interface BPMDetect {
  new(numChannels: number, sampleRate: number): BPMDetect

  inputSamples(ptr: number, length: number): number

  getBpm(): number

  getBeats(positionsPtr: number, strengthsPtr: number, length: number): number
}

export interface SoundStretchModule extends EmscriptenModule {
  BPMDetect: BPMDetect
  SoundTouch: SoundTouch
  SoundStretch: SoundStretch
  OfflineRubberBand: OfflineRubberBand
  RealtimeRubberBand: RealtimeRubberBand
  Test: Test
}