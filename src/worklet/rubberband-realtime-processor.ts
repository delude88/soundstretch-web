import { RealtimeRubberBand, SoundStretchModule } from '../web/SoundStretchModule'
import * as createModule from '../../wasm/build/wasm.js'
import { Float32ChannelTransport } from '../web/Float32ChannelTransport'

const RENDER_QUANTUM_FRAMES = 128

const TRACE = true

const trace = (message: string) => TRACE ? console.log(message) : undefined

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
  private startDelay: number = 0
  private playing: boolean = false
  private position: number = 0
  private endPosition: number = Number.MAX_VALUE


  constructor() {
    super()
    this.port.onmessageerror = (err) => {
      console.error('onmessageerror', err)
    }
    this.port.onmessage = ({ data }) => {
      if (typeof data === 'object' && data['event']) {
        const { event } = data
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
            this.playing = true
            break
          }
          case 'stop': {
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

      this.inputBuffer = new Float32ChannelTransport(this.module, 8196, this.channelCount)
      this.outputBuffer = new Float32ChannelTransport(this.module, RENDER_QUANTUM_FRAMES, this.channelCount)

      this.api = new this.module.RealtimeRubberBand(
        this.settings.sampleRate,
        this.channelCount
      )
      this.api.setPitchScale(this.settings.pitchScale)
      this.api.setTimeRatio(this.settings.timeRatio)

      // Push start pad
      const preferredStartPad = this.api.getPreferredStartPad()
      if (preferredStartPad > 0) {
        const startPad: Float32Array[] = []
        for (let c = 0; c < this.channelCount; ++c) {
          startPad[c] = new Float32Array(preferredStartPad)
        }
        this.inputBuffer.write(startPad)
        console.log(`Feeding ${preferredStartPad} start pad samples`)
        this.api.push(this.inputBuffer.getPointer(), preferredStartPad)
      }
      this.startDelay = this.api.getStartDelay()
      this.feedBuffer(RENDER_QUANTUM_FRAMES)
      //console.log(`API requires now ${this.api.getSamplesRequired()} samples, start pad of of ${this.api.getPreferredStartPad()} and start delay of ${this.api.getStartDelay()}`)
    } else {
      this.inputBuffer?.close()
      this.outputBuffer?.close()
      this.inputBuffer = undefined
      this.outputBuffer = undefined
      this.api = undefined
    }
  }

  private feedBuffer(minSamples: number = 0) {
    if (this.buffer && this.api && this.inputBuffer) {
      const samplesRequired = this.api.getSamplesRequired()
      const required = samplesRequired || minSamples
      if (required > 0) {
        const actual = Math.min(this.endPosition - this.position, required)
        trace(`Feeding ${actual} of ${samplesRequired} required samples`)
        this.inputBuffer.write(
          this.buffer.map(channelBuffer => channelBuffer.subarray(this.position))
        )
        this.api.push(this.inputBuffer.getPointer(), actual)
        this.position += actual
      }
    }
  }

  process(inputs: Float32Array[][], outputs: Float32Array[][]): boolean {
    // Prepare

    if (!this.buffer) {
      // Live chain (no buffer given)

      // Assure channel count
      if (this.channelCount !== inputs[0].length) {
        this.channelCount = inputs[0].length
        this.reInit()
      }

      if (this.api) {
        // Push live input samples
        if (this.inputBuffer && inputs[0].length > 0 && inputs[0][0].length > 0) {
          this.inputBuffer.write(inputs[0])
          this.api.push(this.inputBuffer.getPointer(), RENDER_QUANTUM_FRAMES)
        }

        // Pull output
        if (this.outputBuffer) {
          if (this.api?.available() >= RENDER_QUANTUM_FRAMES) {
            this.api.pull(this.outputBuffer.getPointer(), RENDER_QUANTUM_FRAMES)
            this.outputBuffer.read(outputs[0])
          }
        }
      }
    } else {
      // Buffered chain
      if (this.playing && this.position < this.endPosition) {
        // Playing
        if (this.api && this.inputBuffer && this.outputBuffer) {
          // Feed

          // Apply start delay
          if (this.startDelay > 0) {
            const available = this.api.available()
            if (available >= this.startDelay) {
              trace(`Skipping start delay of ${this.startDelay} samples`)
              this.api.pull(this.outputBuffer.getPointer(), this.startDelay)
              this.startDelay = 0
            }
          }

          // Read at least RENDER_QUANTUM_FRAMES samples
          const available = this.api.available()
          if (available >= RENDER_QUANTUM_FRAMES) {
            trace(`Fetching ${RENDER_QUANTUM_FRAMES} of ${available} available samples`)
            this.api.pull(this.outputBuffer.getPointer(), RENDER_QUANTUM_FRAMES)
            this.outputBuffer.read(outputs[0])
          }
          this.feedBuffer()
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

registerProcessor('rubberband-realtime-processor', RubberbandRealtimeProcessor)