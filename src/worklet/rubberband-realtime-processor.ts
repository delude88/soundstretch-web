import { RealtimeRubberBand, SoundStretchModule } from '../web/SoundStretchModule'
import * as createModule from '../../wasm/build/wasm.js'
import { Float32ChannelTransport } from '../web/Float32ChannelTransport'

const RENDER_QUANTUM_FRAMES = 128

class RubberbandRealtimeProcessor extends AudioWorkletProcessor {
  private module?: SoundStretchModule
  private api?: RealtimeRubberBand
  private inputBuffer?: Float32ChannelTransport
  private outputBuffer?: Float32ChannelTransport
  private settings: {
    sampleRate: number
    pitchScale: number
    timeRatio: number
  } = {
    sampleRate: sampleRate,
    pitchScale: 1,
    timeRatio: 1
  }
  private buffer?: Float32Array[]
  private channelCount: number = 1
  private running: boolean = true
  private playing: boolean = false
  private position: number = 0
  private endPosition: number = Number.MAX_VALUE

  constructor() {
    super()
    this.port.onmessage = ({ data }) => {
      if (typeof data === 'object' && data['event']) {
        const { event } = data
        console.info("GOT EVENT", event)
        switch (event) {
          case 'buffer': {
            if (!data.channels) throw new Error('Missing channels keys')
            if (!data.sampleRate) throw new Error('Missing sampleRate key')
            this.settings.sampleRate = data.sampleRate
            this.buffer = (data.channels as ArrayBuffer[]).map(buf => new Float32Array(buf))
            this.channelCount = this.buffer.length
            this.position = 0
            this.endPosition = this.buffer.length > 0 ? this.buffer[0].length : 0
            this.reInit()
            break
          }
          case 'start': {
            console.info("this.playing = true")
            this.playing = true
            break
          }
          case 'stop': {
            console.info("this.playing = false")
            this.playing = false
            break
          }
          case 'pitch': {
            if (!data.pitch) throw new Error('Missing pitch key')
            this.settings.pitchScale = data.pitch
            this.api?.setPitchScale(this.settings.pitchScale)
            break
          }
          case 'tempo': {
            if (!data.tempo) throw new Error('Missing tempo key')
            this.settings.timeRatio = data.tempo
            this.api?.setTimeRatio(this.settings.timeRatio)
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
      .then((module: SoundStretchModule) => {
        this.module = module
        this.reInit()
      })
  }

  private reInit() {
    if (this.module && this.channelCount > 0) {
      console.info(`reInit() ${this.buffer ? 'in buffered mode' : 'in live mode'} with ${this.channelCount} channels, sampleRate=${this.settings.sampleRate}, timeRatio=${this.settings.timeRatio}, pitchScale=${this.settings.pitchScale}`)

      this.inputBuffer = new Float32ChannelTransport(this.module, RENDER_QUANTUM_FRAMES, this.channelCount)
      this.outputBuffer = new Float32ChannelTransport(this.module, RENDER_QUANTUM_FRAMES, this.channelCount)

      this.api = new this.module.RealtimeRubberBand(
        this.settings.sampleRate,
        this.channelCount
      )
      this.api.setPitchScale(this.settings.pitchScale)
      this.api.setTimeRatio(this.settings.timeRatio)
    } else {
      this.inputBuffer?.close()
      this.outputBuffer?.close()
      this.inputBuffer = undefined
      this.outputBuffer = undefined
      this.api = undefined
    }
  }

  process(inputs: Float32Array[][], outputs: Float32Array[][]): boolean {
    // Prepare
    if (!this.buffer && this.channelCount !== inputs[0].length) {
      this.channelCount = inputs[0].length
      this.reInit()
    }

    if (this.api) {
      if (this.inputBuffer) {
        if (!this.buffer) {
          // Push live input samples
          this.inputBuffer.write(inputs[0])
          this.api.push(this.inputBuffer.getPointer(), RENDER_QUANTUM_FRAMES)
        } else if (this.playing && this.position < this.endPosition) {
          console.log("Pushing")
          // Push RENDER_QUANTUM_FRAMES samples of buffer
          const slice: Float32Array[] = this.buffer.map(channelBuffer => channelBuffer.slice(this.position))
          this.inputBuffer.write(slice)

          this.api.push(this.inputBuffer.getPointer(), RENDER_QUANTUM_FRAMES)
          this.position += RENDER_QUANTUM_FRAMES
        }
      }

      // Pull samples if available
      if (this.outputBuffer) {
        if (this.api.available() >= RENDER_QUANTUM_FRAMES) {
          const actual = this.api.pull(this.outputBuffer.getPointer(), RENDER_QUANTUM_FRAMES)
          this.outputBuffer.read(outputs[0])
          console.log(`${this.api.available()} were available, read ${actual}`)
          //console.log(outputs[0][0][0], outputs[0][0][Math.round((RENDER_QUANTUM_FRAMES - 1) / 2)], outputs[0][0][RENDER_QUANTUM_FRAMES - 1])
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
    //this.port.onmessage = null
    this.running = false
  }
}

registerProcessor('rubberband-realtime-processor', RubberbandRealtimeProcessor)