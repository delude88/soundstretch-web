import { RealtimeRubberBand, RubberBandModule } from '../web/RubberBandModule'
import * as createModule from '../../wasm/build/rubberband.js'
import { Float32ChannelTransport } from '../web/Float32ChannelTransport'

const MAXIMUM_INPUT_SIZE = 8196
const RENDER_QUANTUM_FRAMES = 128
const DEBUG = true
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
  private bufferSampleRate: number = sampleRate
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
        console.log(`[rubberband-realtime-processor] ${event}`, data)
        switch (event) {
          case 'buffer': {
            if (data.channels === undefined) throw new Error('Missing channels key')
            if (data.channels <= 0) throw new Error(`Invalid channels key ${data.channels}`)
            if (data.sampleRate === undefined) throw new Error('Missing sampleRate key')
            if (data.sampleRate <= 0) throw new Error(`Invalid sampleRate key ${data.sampleRate}`)
            this.bufferSampleRate = data.sampleRate
            this.buffer = (data.channels as ArrayBuffer[]).map(buf => new Float32Array(buf))
            this.channelCount = this.buffer.length
            if (data.loop !== undefined) {
              this.loop = data.loop
            }
            if (data.loopStart) {
              this.loopStart = data.loopStart * this.bufferSampleRate // seconds to samples
            }
            if (data.loopEnd) {
              this.loopEnd = data.loopEnd * this.bufferSampleRate // seconds to samples
            }
            if (data.duration) {
              this.duration = data.duration
            }
            this.offset = data.offset ? Math.round(data.offset) : 0
            this.bufferPosition = this.offset
            this.playPosition = Math.round(this.offset / this.playbackRate)
            this.bufferEndPosition = this.buffer.length > 0 ? this.buffer[0].length : 0
            this.playEndPosition = Math.round(this.bufferEndPosition / this.playbackRate)
            this.reInit()
            break
          }
          case 'start': {
            this.playing = true
            if (data.offset === undefined) throw new Error('Missing offset key')
            if (data.offset < 0) throw new Error(`Invalid offset key ${data.offset}`)
            this.offset = Math.round(data.offset)
            this.bufferPosition = this.offset
            this.playPosition = Math.round(this.offset / this.playbackRate)
            if (data.loop !== undefined) {
              this.loop = data.loop
            }
            if (data.loopStart) {
              this.loopStart = data.loopStart * this.bufferSampleRate // seconds to samples
            }
            if (data.loopEnd) {
              this.loopEnd = data.loopEnd * this.bufferSampleRate // seconds to samples
            }
            if (data.duration) {
              if (data.duration < 0) throw new Error(`Invalid duration key ${data.duration}`)
              this.duration = data.duration
            }
            break
          }
          case 'stop': {
            this.playing = false
            break
          }
          case 'loop': {
            if (data.loop === undefined) throw new Error('Missing loop key')
            this.loop = data.loop
            break
          }
          case 'loopStart': {
            if (data.loopStart === undefined) throw new Error('Missing loopStart key')
            this.loopStart = data.loopStart * this.bufferSampleRate
            break
          }
          case 'loopEnd': {
            if (data.loopEnd === undefined) throw new Error('Missing loopEnd key')
            this.loopEnd = data.loopEnd * this.bufferSampleRate
            break
          }
          case 'preserve': {
            if (data.preserve === undefined) throw new Error('Missing preserve key')
            this.preserve = data.preserve
            this.api?.preserveFormantShave(this.preserve || false)
            break
          }
          case 'report': {
            this.port.postMessage({ event: 'report', report: this.quality, sampleRate: sampleRate, bufferSampleRate: this.bufferSampleRate })
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
      this.inputBuffer = new Float32ChannelTransport(this.module, MAXIMUM_INPUT_SIZE, this.channelCount)
      this.outputBuffer = new Float32ChannelTransport(this.module, RENDER_QUANTUM_FRAMES, this.channelCount)

      this.api = new this.module.RealtimeRubberBand(
        this.bufferSampleRate,
        this.channelCount
      )

      if (this.playbackRate !== 1) {
        this.api.setTimeRatio(1 / this.playbackRate)
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
      this.detune = value
      if (this.api) {
        const pitchScale = Math.pow(2.0, this.detune / 1200.0) || 1
        this.api.setPitchScale(pitchScale)
      }
    }
  }

  private setPlaybackRate(value: number) {
    if (this.playbackRate !== value) {
      const relativePlayPosition = this.playPosition * this.playbackRate
      this.playbackRate = value
      this.playPosition = Math.round(relativePlayPosition / this.playbackRate)
      this.playEndPosition = Math.round(this.bufferEndPosition / this.playbackRate)
      if (this.api) {
        this.api.setTimeRatio(1 / this.playbackRate)
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
        const bufferPositionBefore = this.bufferPosition
        this.bufferPosition += actual
        // CHECK THIS OUT
        if (this.loop && this.loopEnd && this.bufferPosition >= this.loopEnd && bufferPositionBefore <= this.loopEnd) {
          this.bufferPosition = this.loopStart
          console.log(`[rubberband-realtime-processor] Looping buffer position}`)
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
            //if (this.playPosition >= this.loopEnd) {
            if (this.playPosition >= this.loopEnd && (this.playPosition - RENDER_QUANTUM_FRAMES) <= this.loopEnd) {
              // Go back to loopStart
              console.log(`[rubberband-realtime-processor] Looping play position}`)
              this.playPosition = this.loopStart
            }
          }

          if (this.api && this.outputBuffer) {
            if (this.startDelay > 0) {
              const available = this.api.available()
              if (available > 0) {
                const actual = this.api.pull(this.outputBuffer.getPointer(), RENDER_QUANTUM_FRAMES)
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
                this.outputBuffer.read(outputs[0])
                this.playPosition += actual
              } else {
                if(this.bufferPosition >= this.bufferEndPosition) {
                  // This is the end my friend
                  this.port.postMessage({ event: 'ended' })
                  this.close()
                  return false
                } else {
                  this.quality.underruns++
                }
              }
            }
          }
        } else {
          this.port.postMessage({ event: 'ended' })
          this.close()
          return false
        }
        this.feedBuffer()

        this.quality.runs++
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
          } else {
            this.quality.underruns++
          }
        }

        this.quality.runs++
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