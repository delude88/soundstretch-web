interface RubberBandRealtimeNode extends AudioBufferSourceNode {
  preserveFormantShave(enabled: boolean): void

  printStatistic(enabled: boolean): void;

  close(): void
}

export { RubberBandRealtimeNode }