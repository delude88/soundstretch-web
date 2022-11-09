export interface SoundTouch {
  new(numChannels: number, sampleRate: number): SoundTouch

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

export interface Test {
  new(size: number): Test

  write(ptr: number, length: number): boolean

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
  Test: Test
}