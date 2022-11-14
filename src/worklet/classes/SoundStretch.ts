import { HeapArray } from './HeapArray'
import * as createModule from '../../../wasm/build/soundtouch.js'

const RENDER_QUANTUM_FRAMES = 128

export interface SoundStretchOptions {
  numSamples?: number,
  pitch?: number,
  tempo?: number
}

class SoundStretch {
  private kernel: any
  private readonly channelCount: number
  private readonly numSamples: number
  private tempo: number = 1
  private pitch: number = 1
  private inputArray: HeapArray | undefined
  private outputArray: HeapArray | undefined

  public constructor(channelCount: number, options?: SoundStretchOptions) {
    this.numSamples = options?.numSamples || RENDER_QUANTUM_FRAMES
    this.channelCount = channelCount
    this.pitch = options?.pitch || 1
    this.tempo = options?.tempo || 1
    this.init(channelCount)
  }

  private init(channelCount: number) {
    //this.inputArray?.close()
    //this.outputArray?.close()
    createModule()
      .then((module: any) => {
        this.kernel = new module.SoundStretch(sampleRate, channelCount)
        this.inputArray = new HeapArray(module, RENDER_QUANTUM_FRAMES, channelCount)
        this.outputArray = new HeapArray(module, RENDER_QUANTUM_FRAMES, channelCount)
        if(this.pitch !== 1) {
          this.kernel.setPitch(this.pitch)
        }
        if(this.tempo !== 1) {
          this.kernel.setTempo(this.tempo)
        }
      })
  }

  public setTempo(tempo: number) {
    this.tempo = tempo
    if (this.kernel)
      this.kernel.setTempo(this.tempo)
  }

  public setPitch(pitch: number) {
    this.pitch = pitch
    if (this.kernel)
      this.kernel.setPitch(pitch)
  }

  public get samplesAvailable(): number {
    return this.kernel?.getSamplesAvailable() || 0
  }

  public push(channels: Float32Array[]) {
    if (this.kernel && this.inputArray) {
      const channelCount = channels.length
      if (channelCount > 0) {
        for (let channel = 0; channel < channels.length; ++channel) {
          this.inputArray.getChannelArray(channel).set(channels[channel])
        }
        this.kernel.push(this.inputArray.getHeapAddress(), this.numSamples)
      }
    }
  }

  public pull(channels: Float32Array[]): Float32Array[] {
    if (this.kernel && this.outputArray) {
      const channelCount = channels.length
      if (channelCount > 0) {
        const available = this.kernel.getSamplesAvailable()
        if (available >= this.numSamples) {
          this.kernel.pull(this.outputArray.getHeapAddress(), this.numSamples)
          for (let channel = 0; channel < channels.length; ++channel) {
            channels[channel].set(this.outputArray.getChannelArray(channel))
          }
        }
      }
    }
    return channels
  }

  public getVersion(): number {
    return this.kernel?.getVersion() || 0
  }

  public getChannelCount(): number {
    return this.channelCount
  }
}

export { SoundStretch }