class BpmCountProcessor extends AudioWorkletProcessor {
  process(inputs: Float32Array[][], outputs: Float32Array[][]): boolean {
    return true
  }
}

registerProcessor('bpm-count-processor', BpmCountProcessor)