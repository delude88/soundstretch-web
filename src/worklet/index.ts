class SoundStretchProcessor extends AudioWorkletProcessor {
  process(inputs: Float32Array[][], outputs: Float32Array[][]): boolean {
    return true
  }
}

registerProcessor('soundstretch-processor', SoundStretchProcessor)