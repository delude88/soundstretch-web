import * as createModule from '../../../wasm/build/soundtouch.js'
import { HeapArray } from './HeapArray'
import { SoundStretchModule } from '../../web/SoundStretchModule'

const RENDER_QUANTUM_FRAMES = 128

class BPMCounter {
  private kernel: any
  private inputArray: HeapArray | undefined

  constructor(channelCount: number) {
    this.init(channelCount)
  }

  private init(channelCount: number) {
    this.inputArray?.close()
    createModule()
      .then((module: SoundStretchModule) => {
        this.kernel = new module.BPMDetect(channelCount, sampleRate)
        this.inputArray = new HeapArray(module, RENDER_QUANTUM_FRAMES, channelCount)
      })
  }

  public push(channels: Float32Array[]) {

  }
}

export {BPMCounter}