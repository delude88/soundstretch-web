import { HeapArray } from './HeapArray'
import * as createModule from '../../../wasm/build/wasm.js'

const RENDER_QUANTUM_FRAMES = 128

class SoundTouch {
  private kernel: any
  private inputArray: HeapArray | undefined
  private outputArray: HeapArray | undefined

  constructor() {
  }

  private init(channelCount: number) {
    this.inputArray?.close()
    this.outputArray?.close()
    createModule()
      .then((module: any) => {
        this.kernel = new module.BPMCounter()
        this.inputArray = new HeapArray(module, RENDER_QUANTUM_FRAMES, channelCount)
        this.outputArray = new HeapArray(module, RENDER_QUANTUM_FRAMES, channelCount)
      })
  }

  public push(channels: Float32Array[]) {

  }

  public pull(channels: Float32Array[]): Float32Array[] {

  }

}

export { SoundTouch }