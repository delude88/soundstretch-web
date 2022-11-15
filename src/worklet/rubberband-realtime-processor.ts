import { RealtimeRubberBand, RubberBandModule } from '../web/RubberBandModule'
import * as createModule from '../../wasm/build/rubberband.js'
import { Float32ChannelTransport } from '../web/Float32ChannelTransport'

const RENDER_QUANTUM_FRAMES = 128

class RubberbandRealtimeProcessor extends AudioWorkletProcessor {
  private module?: RubberBandModule
  private api?: RealtimeRubberBand
  private inputBuffer?: Float32ChannelTransport
  private outputBuffer?: Float32ChannelTransport
  private settings: {
    sampleRate: number
    pitchScale: number
    timeRatio: number
    loop: boolean,
    loopStart?: number,
    loopEnd?: number,
    offset: number,
    duration?: number,
  } = {
    sampleRate: sampleRate,
    pitchScale: 1,
    timeRatio: 1,
    loop: false,
    offset: 0
  }
  private buffer?: Float32Array[]
  private channelCount: number = 1
  private running: boolean = true
  private preferredStartPad: number = 0
  private startDelay: number = 0
  private playing: boolean = false
  private bufferPosition: number = 0
  private bufferEndPosition: number = 0
  private playPosition: number = 0
  private playEndPosition: number = 0

  constructor() {
    super()
    this.port.onmessageerror = (err) => {
      console.error('onmessageerror', err)
    }
    this.port.onmessage = ({ data }) => {
      if (typeof data === 'object' && data['event']) {
        const { event } = data
        console.info(`[rubberband-realtime-processor] Received event=${event}`)
        switch (event) {
          case 'buffer': {
            if (data.channels === undefined) throw new Error('Missing channels keys')
            if (data.channels <= 0) throw new Error(`Invalid channels key ${data.channels}`)
            if (data.sampleRate === undefined) throw new Error('Missing sampleRate key')
            if (data.sampleRate <= 0) throw new Error(`Invalid sampleRate key ${data.sampleRate}`)
            this.settings.sampleRate = data.sampleRate
            this.buffer = (data.channels as ArrayBuffer[]).map(buf => new Float32Array(buf))
            this.channelCount = this.buffer.length
            this.settings.loop = data.loop
            this.settings.duration = data.duration
            this.settings.offset = data.offset || 0
            this.bufferPosition = this.settings.offset
            this.playPosition = this.settings.offset
            this.bufferEndPosition = this.buffer.length > 0 ? this.buffer[0].length : 0
            this.playEndPosition = this.bufferEndPosition * this.settings.timeRatio
            this.reInit()
            break
          }
          case 'start': {
            console.log("[rubberband-realtime-processor] this.playing = true")
            this.playing = true
            break
          }
          case 'stop': {
            console.log("[rubberband-realtime-processor] this.playing = false")
            this.playing = false
            break
          }
          case 'pitch': {
            if (data.pitch === undefined) throw new Error('Missing pitch key')
            if (data.pitch <= 0) throw new Error(`Invalid pitch key ${data.pitch}`)
            this.settings.pitchScale = data.pitch || 1
            console.log(`[rubberband-realtime-processor] pitch = ${this.settings.pitchScale}`)
            this.api?.setPitchScale(this.settings.pitchScale)
            break
          }
          case 'tempo': {
            if (data.tempo === undefined) throw new Error('Missing tempo key')
            if (data.tempo <= 0) throw new Error(`Invalid tempo key ${data.tempo}`)
            this.settings.timeRatio = data.tempo || 1
            this.playEndPosition = this.bufferEndPosition * this.settings.timeRatio
            console.log(`[rubberband-realtime-processor] timeRatio = ${this.settings.timeRatio}`)
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
      .then((module: RubberBandModule) => {
        this.module = module
        this.reInit()
      })
  }

  private reInit() {
    if (this.module && this.channelCount > 0) {
      console.info(`[rubberband-realtime-processor] reInit() ${this.buffer ? 'in buffered mode' : 'in live mode'} with ${this.channelCount} channels, sampleRate=${this.settings.sampleRate}, timeRatio=${this.settings.timeRatio}, pitchScale=${this.settings.pitchScale}`)

      this.inputBuffer = new Float32ChannelTransport(this.module, 8196, this.channelCount)
      this.outputBuffer = new Float32ChannelTransport(this.module, RENDER_QUANTUM_FRAMES, this.channelCount)

      this.api = new this.module.RealtimeRubberBand(
        this.settings.sampleRate,
        this.channelCount
      )
      this.api.setPitchScale(this.settings.pitchScale)
      this.api.setTimeRatio(this.settings.timeRatio)

      // Push start pad
      this.preferredStartPad = this.api.getPreferredStartPad()
      this.startDelay = this.api.getStartDelay()
      this.feedBuffer()
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
      // Feed preferred start pad (if applicable)
      if (this.preferredStartPad > 0) {
        const startPad: Float32Array[] = []
        for (let c = 0; c < this.channelCount; ++c) {
          startPad[c] = new Float32Array(this.preferredStartPad)
        }
        this.inputBuffer.write(startPad)
        console.log(`Feeding ${this.preferredStartPad} start pad samples`)
        this.api.push(this.inputBuffer.getPointer(), this.preferredStartPad)
        this.preferredStartPad = 0
      }

      const samplesRequired = this.api.getSamplesRequired()
      const required = samplesRequired || minSamples
      if (required > 0) {
        const actual = Math.min(this.bufferEndPosition - this.bufferPosition, required)
        this.inputBuffer.write(
          this.buffer.map(channelBuffer => channelBuffer.subarray(this.bufferPosition))
        )
        this.api.push(this.inputBuffer.getPointer(), actual)
        this.bufferPosition += actual
      }
    }
  }

  process(inputs: Float32Array[][], outputs: Float32Array[][]): boolean {
    if (this.buffer) {
      // Buffered chain
      if (this.playing) {
        if (this.playPosition < this.playEndPosition) {
          if (this.api && this.outputBuffer && this.startDelay > 0) {
            // Apply start delay
            const available = this.api.available()
            if (available >= this.startDelay) {
              this.api.pull(this.outputBuffer.getPointer(), this.startDelay)
              this.startDelay = 0
            }
          }

          if (this.api && this.outputBuffer) {
            // Read at least RENDER_QUANTUM_FRAMES samples
            const available = this.api.available()
            if (available >= RENDER_QUANTUM_FRAMES) {
              const actual = this.api.pull(this.outputBuffer.getPointer(), RENDER_QUANTUM_FRAMES)
              this.outputBuffer.read(outputs[0])
              this.playPosition += actual
            }
          }
        } else {
          this.playing = false
          this.port.postMessage({ event: 'ended' })
        }
        this.feedBuffer()
      }
    } else {
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
    }
    return this.running
  }

  close() {
    console.log(`[rubberband-realtime-processor] close()`)
    this.inputBuffer?.close()
    this.outputBuffer?.close()
    this.inputBuffer = undefined
    this.outputBuffer = undefined
    this.api = undefined
    this.port.onmessage = null
    this.playing = false
    this.running = false
  }
}

registerProcessor('rubberband-realtime-processor', RubberbandRealtimeProcessor)