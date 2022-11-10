interface RubberBandSourceNode extends AudioWorkletNode {
  //TODO: Replace with ScheduledAudioWorkletNode implementation
  start(): void

  stop(): void

  setBuffer(audioBuffer: AudioBuffer): void

  setPitch(pitch: number): void

  setTempo(tempo: number): void

  setHighQuality(enabled: boolean): void

  close(): void
}

export { RubberBandSourceNode }