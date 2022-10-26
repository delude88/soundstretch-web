import { HeapArray } from './HeapArray'
import * as createModule from '../../../wasm/build/wasm.js'

const RENDER_QUANTUM_FRAMES = 128

class SoundTouch {
  private kernel: any
  private inputArray: HeapArray | undefined
  private outputArray: HeapArray | undefined

  constructor(channelCount: number) {
    this.init(channelCount)
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
    if (this.kernel && this.inputArray) {
      const channelCount = channels.length
      if (channelCount > 0) {
        for (let channel = 0; channel < channels.length; ++channel) {
          this.inputArray.getChannelArray(channel).set(channels[channel])

        }
        this.kernel.push(this.inputArray.getHeapAddress(), RENDER_QUANTUM_FRAMES * channelCount)
      }
    }
  }

  public pull(channels: Float32Array[]): Float32Array[] {
    if (this.kernel && this.outputArray) {
      const channelCount = channels.length
      if (channelCount > 0) {
        const arrLength = RENDER_QUANTUM_FRAMES * channelCount
        const available = this.kernel.get
        if (available >= arrLength) {
          this.kernel.pull(this.outputArray.getHeapAddress(), RENDER_QUANTUM_FRAMES * channelCount)
          for (let channel = 0; channel < channels.length; ++channel) {
            channels[channel].set(this.outputArray.getChannelArray(channel))
          }
        }
      }
    }
    return channels
  }

}

export { SoundTouch }