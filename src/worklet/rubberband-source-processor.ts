import { OfflineRubberBand, SoundStretchModule } from '../web/SoundStretchModule'
import * as createModule from '../../wasm/build/wasm.js'
import { Float32ChannelTransport } from '../web/Float32ChannelTransport'

const RENDER_QUANTUM_FRAMES = 128

class RubberbandSourceProcessor extends AudioWorkletProcessor {
  private module?: SoundStretchModule
  private api?: OfflineRubberBand
  private inputBuffer?: Float32ChannelTransport
  private outputBuffer?: Float32ChannelTransport
  private running: boolean = true
  private playing: boolean = false
  private sampleRate: number = sampleRate
  private pitchScale: number = 1
  private timeRatio: number = 1
  private channels: Float32Array[] = []

  constructor() {
    super()
    this.port.onmessage = ({ data }) => {
      if (typeof data === 'object' && data['event']) {
        const { event } = data
        switch (event) {
          case 'buffer': {
            if (!data.channels) throw new Error('Missing channels keys')
            if (!data.sampleRate) throw new Error('Missing sampleRate key')
            this.sampleRate = data.sampleRate
            this.channels = (data.channels as ArrayBuffer[]).map(buf => new Float32Array(buf))
            this.reInit()
            break
          }
          case 'start': {
            this.playing = true
            break
          }
          case 'stop': {
            this.playing = false
            break
          }
          case 'pitch': {
            if (!data.pitch) throw new Error('Missing pitch key')
            this.pitchScale = data.pitch
            if (this.api?.getPitchScale() !== this.pitchScale) {
              this.reInit()
            }
            break
          }
          case 'tempo': {
            if (!data.tempo) throw new Error('Missing tempo key')
            this.timeRatio = data.tempo
            if (this.api?.getTimeRatio() !== this.timeRatio) {
              this.reInit()
            }
            break
          }
          case 'close': {
            this.close()
            break
          }
        }
      }
    }
    createModule()
      .then((module: SoundStretchModule) => this.module = module)
  }

  private reInit() {
    if (this.module && this.channels.length > 0) {
      const sampleSize = this.channels[0].length
      this.api = new this.module.OfflineRubberBand(
        this.sampleRate,
        this.channels.length,
        this.timeRatio,
        this.pitchScale
      )
      this.inputBuffer = new Float32ChannelTransport(this.module, sampleSize, this.channels.length)
      this.outputBuffer = new Float32ChannelTransport(this.module, RENDER_QUANTUM_FRAMES, this.channels.length)
      this.inputBuffer.write(this.channels, sampleSize)
      this.api.setInput(this.inputBuffer.getPointer(), sampleSize)
    } else {
      this.inputBuffer?.close()
      this.outputBuffer?.close()
      this.inputBuffer = undefined
      this.outputBuffer = undefined
      this.api = undefined
    }
  }

  process(inputs: Float32Array[][], outputs: Float32Array[][]): boolean {
    if (this.playing) {
      const numChannels = inputs[0]?.length || outputs[0]?.length
      if (numChannels > 0) {
        if (outputs?.length > 0) {
          if (this.api && this.outputBuffer) {
            const available = this.api.available()
            if (available > 0) {
              this.api.pull(this.outputBuffer.getPointer(), available)
              this.outputBuffer.read(outputs[0], 0, available)
            }
          }
        }
      }
    }
    return this.running
  }

  close() {
    this.inputBuffer?.close()
    this.outputBuffer?.close()
    this.inputBuffer = undefined
    this.outputBuffer = undefined
    this.api = undefined
    this.port.onmessage = null
    this.running = false
  }
}

registerProcessor('rubberband-source-processor', RubberbandSourceProcessor)