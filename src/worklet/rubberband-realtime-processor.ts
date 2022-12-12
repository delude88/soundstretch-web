import { RealtimeRubberBand, RubberBandModule } from '../web/RubberBandModule'
import * as createModule from '../../wasm/build/rubberband.js'
import { Float32ChannelTransport } from '../web/Float32ChannelTransport'

const MAXIMUM_INPUT_SIZE = 8196
const RENDER_QUANTUM_FRAMES = 128
const DEBUG = false

class RubberbandRealtimeProcessor extends AudioWorkletProcessor {
  static get parameterDescriptors() {
    return [
      {
        name: 'detune',
        defaultValue: 0,
        minValue: -3.4028234663852886e+38,
        maxValue: 3.4028234663852886e+38,
        automationRate: 'k-rate'
      },
      {
        name: 'playbackRate',
        defaultValue: 1,
        minValue: 0.00000000001,
        maxValue: 3.4028234663852886e+38,
        automationRate: 'k-rate'
      }
    ]
  }

  private module?: RubberBandModule
  private api?: RealtimeRubberBand
  private inputBuffer?: Float32ChannelTransport
  private outputBuffer?: Float32ChannelTransport
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
  private loop: boolean = false
  private loopStart: number = 0
  private loopEnd?: number
  private preserve?: boolean
  private sampleRate: number = sampleRate

  private offset: number = 0
  private duration?: number

  private detune: number = 0
  private playbackRate: number = 1

  private quality: {
    underruns: number,
    runs: number,
  } = {
    underruns: 0,
    runs: 0
  }

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
            if (DEBUG) console.log(`[rubberband-realtime-processor] buffer`, data)
            if (data.channels === undefined) throw new Error('Missing channels key')
            if (data.channels <= 0) throw new Error(`Invalid channels key ${data.channels}`)
            if (data.sampleRate === undefined) throw new Error('Missing sampleRate key')
            if (data.sampleRate <= 0) throw new Error(`Invalid sampleRate key ${data.sampleRate}`)
            this.sampleRate = data.sampleRate
            this.buffer = (data.channels as ArrayBuffer[]).map(buf => new Float32Array(buf))
            this.channelCount = this.buffer.length
            if (data.loop !== undefined) {
              this.loop = data.loop
            }
            if (data.loopStart) {
              this.loopStart = data.loopStart * this.sampleRate // seconds to samples
            }
            if (data.loopEnd) {
              this.loopEnd = data.loopEnd * this.sampleRate // seconds to samples
            }
            if (data.duration) {
              this.duration = data.duration
            }
            this.offset = data.offset || 0
            this.bufferPosition = this.offset
            this.playPosition = this.offset
            this.bufferEndPosition = this.buffer.length > 0 ? this.buffer[0].length : 0
            const timeRatio = ((100 / this.playbackRate) / 100) || 1
            this.playEndPosition = this.bufferEndPosition * timeRatio
            this.reInit()
            break
          }
          case 'start': {
            if (DEBUG) console.log(`[rubberband-realtime-processor] start`, data)
            this.playing = true
            if (data.offset === undefined) throw new Error('Missing offset key')
            if (data.offset < 0) throw new Error(`Invalid offset key ${data.offset}`)
            this.offset = data.offset || 0
            this.bufferPosition = this.offset
            this.playPosition = this.offset
            if (data.loop !== undefined) {
              this.loop = data.loop
            }
            if (data.loopStart) {
              this.loopStart = data.loopStart * this.sampleRate // seconds to samples
            }
            if (data.loopEnd) {
              this.loopEnd = data.loopEnd * this.sampleRate // seconds to samples
            }
            if (data.duration) {
              if (data.duration < 0) throw new Error(`Invalid duration key ${data.duration}`)
              this.duration = data.duration
            }
            break
          }
          case 'stop': {
            if (DEBUG) console.log(`[rubberband-realtime-processor] stop`)
            this.playing = false
            break
          }
          case 'loop': {
            if (data.loop === undefined) throw new Error('Missing loop key')
            this.loop = data.loop
            if (DEBUG) console.log(`[rubberband-realtime-processor] loop=${this.loop}`)
            break
          }
          case 'loopStart': {
            if (data.loopStart === undefined) throw new Error('Missing loopStart key')
            this.loopStart = data.loopStart * this.sampleRate
            if (DEBUG) console.log(`[rubberband-realtime-processor] loopStart=${this.loopStart}samples or ${this.loopStart / this.sampleRate}s`)
            break
          }
          case 'loopEnd': {
            if (data.loopEnd === undefined) throw new Error('Missing loopEnd key')
            this.loopEnd = data.loopEnd * this.sampleRate
            if (DEBUG) console.log(`[rubberband-realtime-processor] loopEnd=${this.loopEnd}samples or ${this.loopEnd / this.sampleRate}s`)
            break
          }
          case 'preserve': {
            if (data.preserve === undefined) throw new Error('Missing preserve key')
            this.preserve = data.preserve
            this.api?.preserveFormantShave(this.preserve || false)
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
      if (DEBUG) console.info(`[rubberband-realtime-processor] reInit() ${this.buffer ? 'in buffered mode' : 'in live mode'} with ${this.channelCount} channels, sampleRate=${this.sampleRate}, playbackRate=${this.playbackRate}, detune=${this.detune}`)

      this.inputBuffer = new Float32ChannelTransport(this.module, MAXIMUM_INPUT_SIZE, this.channelCount)
      this.outputBuffer = new Float32ChannelTransport(this.module, RENDER_QUANTUM_FRAMES, this.channelCount)

      this.api = new this.module.RealtimeRubberBand(
        this.sampleRate,
        this.channelCount
      )

      if (this.playbackRate !== 1) {
        const timeRatio = ((100 / this.playbackRate) / 100) || 1
        this.api.setTimeRatio(timeRatio)
      }
      if (this.detune !== 0) {
        const pitchScale = Math.pow(2.0, this.detune / 1200.0) || 1
        this.api.setPitchScale(pitchScale)
      }
      this.api.preserveFormantShave(!!this.preserve)

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

  private setDetune(value: number) {
    if (this.detune !== value) {
      if (DEBUG) console.log(`[rubberband-realtime-processor] Set detune from ${this.detune} to ${value}`)
      this.detune = value
      if (this.api) {
        const pitchScale = Math.pow(2.0, this.detune / 1200.0) || 1
        this.api.setPitchScale(pitchScale)
      }
    }
  }

  private setPlaybackRate(value: number) {
    if (this.playbackRate !== value) {
      if (DEBUG) console.log(`[rubberband-realtime-processor] Set playbackRate from ${this.playbackRate} to ${value}`)
      this.playbackRate = value
      const timeRatio = ((100 / this.playbackRate) / 100) || 1
      this.playEndPosition = this.bufferEndPosition * timeRatio
      if (this.api) {
        this.api.setTimeRatio(timeRatio)
      }
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
        this.api.push(this.inputBuffer.getPointer(), this.preferredStartPad)
        this.preferredStartPad = 0
      }

      const samplesRequired = this.api.getSamplesRequired()
      const required = samplesRequired || minSamples
      if (required > 0) {
        const actual = Math.min(this.bufferEndPosition - this.bufferPosition, required)
        this.inputBuffer.write(
          this.buffer.map(channelBuffer => channelBuffer.subarray(this.bufferPosition)),
          0,
          actual
        )
        this.api.push(this.inputBuffer.getPointer(), actual)
        this.bufferPosition += actual
        // CHECK THIS OUT
        if (this.loop && this.loopEnd && this.bufferPosition >= this.loopEnd) {
          if (DEBUG) console.log(`[rubberband-realtime-processor] Set buffer to loopStart@${this.loopStart}, reached ${this.loopEnd / this.sampleRate}s`)
          this.bufferPosition = this.loopStart
        }
      }
    }
  }

  process(inputs: Float32Array[][], outputs: Float32Array[][], parameters: Record<string, Float32Array>): boolean {
    this.setDetune(parameters['detune'][0])
    this.setPlaybackRate(parameters['playbackRate'][0])

    if (this.buffer) {
      // Buffered chain
      if (this.playing) {
        if (this.playPosition < this.playEndPosition) {
          // Loop?
          if (this.loop && this.loopEnd) {
            if (this.playPosition >= this.loopEnd) {
              // Go back to loopStart
              if (DEBUG) console.log(`[rubberband-realtime-processor] Set play mark to loopStart@${this.loopStart}, reached ${this.loopEnd / this.sampleRate}s`)
              this.playPosition = this.loopStart
            }
          }

          if (this.api && this.outputBuffer) {
            if (this.startDelay > 0) {
              const available = this.api.available()
              if (available > 0) {
                const actual = this.api.pull(this.outputBuffer.getPointer(), RENDER_QUANTUM_FRAMES)
                if (DEBUG) console.log(`[rubberband-realtime-processor] Skipped ${actual} (was ${available} available) of ${this.startDelay} start delay samples`)
                this.startDelay -= actual
              }
            }

            if (this.startDelay <= 0) {
              const available = this.api.available()
              if (available >= RENDER_QUANTUM_FRAMES) {
                const actual = this.api.pull(this.outputBuffer.getPointer(), RENDER_QUANTUM_FRAMES)
                for (const output of outputs) {
                  this.outputBuffer.read(output)
                }
                this.playPosition += actual
              } else {
                this.quality.underruns++
              }
            }
          }
        } else {
          this.playing = false
          this.port.postMessage({ event: 'ended' })
        }
        this.feedBuffer()

        if (this.quality.runs++ % 2048 === 0) {
          if (DEBUG) console.log(`[rubberband-realtime-processor] Under run ratio: ${this.quality.underruns}/${this.quality.runs}, ${this.bufferPosition} samples written, ${this.playPosition} samples read, currently ${this.api?.available() || 0} samples available`)
        }
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
            for (const output of outputs) {
              this.outputBuffer.read(output)
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
    this.playing = false
    this.running = false
  }
}

registerProcessor('rubberband-realtime-processor', RubberbandRealtimeProcessor)