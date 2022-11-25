interface RubberBandRealtimeNode extends AudioBufferSourceNode {
  preserveFormantShave(enabled: boolean): void

  close(): void
}

export { RubberBandRealtimeNode }