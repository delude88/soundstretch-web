interface RubberBandRealtimeNode extends AudioWorkletNode {
  //TODO: Replace with ScheduledAudioWorkletNode implementation
  start(): void

  stop(): void

  setBuffer(audioBuffer: AudioBuffer): void

  setPitch(pitch: number): void

  setTempo(tempo: number): void

  close(): void
}

export { RubberBandRealtimeNode }