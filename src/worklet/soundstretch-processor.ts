import { SoundStretch, SoundTouchModule } from '../web/SoundTouchModule'
import * as createModule from '../../wasm/build/soundtouch.js'
import { Float32ChannelTransport } from '../web/Float32ChannelTransport'

const RENDER_QUANTUM_FRAMES = 128
const MAX_TEMPO = 10
const PRE_BUFFER_FACTOR = 32

class SoundStretchProcessor extends AudioWorkletProcessor {
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

  private detune: number = 0
  private playbackRate: number = 1
  private rate: number = 1
  private sampleRate: number = 1
  private channelCount: number = 1
  private buffer?: Float32Array[]
  private module?: SoundTouchModule
  private api?: SoundStretch
  private inputBuffer?: Float32ChannelTransport
  private outputBuffer?: Float32ChannelTransport
  private running: boolean = true
  private playing: boolean = false
  private bufferPosition: number = 0
  private bufferEndPosition: number = 0
  private playPosition: number = 0
  private playEndPosition: number = 0

  private quality: {
    underruns: number,
    runs: number,
  } = {
    underruns: 0,
    runs: 0
  }

  constructor() {
    super()
    this.port.onmessage = ({ data }) => {
      if (typeof data === 'object' && data['event']) {
        const { event } = data
        switch (event) {
          case 'buffer': {
            if (data.channels === undefined) throw new Error('Missing channels keys')
            if (data.channels <= 0) throw new Error(`Invalid channels key ${data.channels}`)
            if (data.sampleRate === undefined) throw new Error('Missing sampleRate key')
            if (data.sampleRate <= 0) throw new Error(`Invalid sampleRate key ${data.sampleRate}`)
            this.sampleRate = data.sampleRate
            this.buffer = (data.channels as ArrayBuffer[]).map(buf => new Float32Array(buf))
            this.channelCount = this.buffer.length
            this.bufferPosition = data.offset || 0
            this.bufferEndPosition = this.buffer.length > 0 ? this.buffer[0].length : 0
            this.playPosition = Math.round(this.bufferPosition / (this.playbackRate * this.rate))
            this.playEndPosition = Math.round(this.bufferEndPosition / (this.playbackRate * this.rate))
            this.reInit()
            break
          }
          case 'start': {
            console.log('[soundstretch-processor] this.playing = true')
            this.playing = true
            break
          }
          case 'stop': {
            console.log('[soundstretch-processor] this.playing = false')
            this.playing = false
            break
          }
          /*
          case 'pitch': {
            if (data.pitch === undefined) throw new Error('Missing pitch key')
            const value = parseFloat(data.pitch)
            if (value === Number.NaN) throw new Error(`Invalid pitch key ${data.pitch}`)
            this.pitch = value / 100
            console.log(`[soundstretch-processor] this.pitch = ${this.pitch}`)
            this.api?.setPitchSemiTones(this.pitch)
            const currentBufferPosition = Math.round(this.playPosition * this.tempo * this.rate)
            this.resetPlayback(currentBufferPosition)
            break
          }
          case 'tempo': {
            if (data.tempo === undefined) throw new Error('Missing tempo key')
            if (data.tempo <= 0) throw new Error(`Invalid tempo key ${data.tempo}`)
            const currentBufferPosition = Math.round(this.playPosition * this.tempo * this.rate)
            this.tempo = data.tempo
            this.api?.setTempo(this.tempo)
            this.resetPlayback(currentBufferPosition)
            break
          }*/
          case 'rate': {
            if (data.rate === undefined) throw new Error('Missing rate key')
            if (data.rate <= 0) throw new Error(`Invalid rate key ${data.rate}`)
            const currentBufferPosition = Math.round(this.playPosition * this.playbackRate * this.rate)
            this.rate = data.rate
            this.api?.setRate(this.rate)
            this.resetPlayback(currentBufferPosition)
            break
          }
          case 'close': {
            this.close()
            break
          }
        }
      }
    }
    createModule().then((module: SoundTouchModule) => {
      this.module = module
      this.reInit()
    })
  }

  private setDetune(value: number) {
    if (this.detune !== value) {
      this.detune = value
      this.api?.setPitchSemiTones(this.detune / 100)
    }
  }

  private setPlaybackRate(value: number) {
    if (this.playbackRate !== value) {
      const currentBufferPosition = Math.round(this.playPosition * this.playbackRate * this.rate)
      this.playbackRate = value
      this.api?.setTempo(this.playbackRate)
      this.resetPlayback(currentBufferPosition)
    }
  }

  requiredSamples(): number {
    if (this.playbackRate > 1) {
      return RENDER_QUANTUM_FRAMES * this.playbackRate
    }
    return RENDER_QUANTUM_FRAMES
  }

  printCurrentPlayMark(prefix?: string) {
    const bufferPositionInSeconds = this.bufferPosition / this.sampleRate
    const bufferTotalInSeconds = Math.round(this.bufferEndPosition / this.sampleRate)
    const playPositionInSeconds = this.playPosition / this.sampleRate
    const playTotalInSeconds = Math.round(this.playEndPosition / this.sampleRate)

    const bufferPercentage = Math.round(this.bufferPosition / this.bufferEndPosition * 100)
    const playPercentage = Math.round(this.playPosition / this.playEndPosition * 100)

    console.log(`${prefix || ''} buffer@${bufferPositionInSeconds}/${bufferTotalInSeconds}s (${bufferPercentage}%) play@${playPositionInSeconds}/${playTotalInSeconds}s (${playPercentage}%)`)
  }

  resetPlayback(bufferPositon: number) {
    this.printCurrentPlayMark('BEFORE')

    this.bufferPosition = bufferPositon
    this.playPosition = Math.round(this.bufferPosition / (this.playbackRate * this.rate))
    this.playEndPosition = Math.round(this.bufferEndPosition / (this.playbackRate * this.rate))

    this.printCurrentPlayMark('AFTER')

    if (this.api && this.inputBuffer && this.buffer) {
      const bufferSize = Math.min(this.buffer[0].length, Math.round(this.requiredSamples() * PRE_BUFFER_FACTOR))
      if (bufferSize > 0) {
        do {
          this.inputBuffer.write(
            this.buffer.map(channelBuffer => channelBuffer.subarray(this.bufferPosition)),
            0,
            RENDER_QUANTUM_FRAMES
          )
          this.api.push(this.inputBuffer.getPointer(), RENDER_QUANTUM_FRAMES)
          this.bufferPosition += RENDER_QUANTUM_FRAMES
        } while (this.bufferPosition < bufferSize)
        console.log(`Pre-buffered ${bufferSize} samples`)
      }
    }

  }

  reInit() {
    if (this.module && this.channelCount > 0) {
      console.log(`[soundstretch-processor] reInit sampleRate=${this.sampleRate} channelCount=${this.channelCount} globalSampleRate=${sampleRate}`)
      this.inputBuffer = new Float32ChannelTransport(this.module, RENDER_QUANTUM_FRAMES * MAX_TEMPO, this.channelCount)
      this.outputBuffer = new Float32ChannelTransport(this.module, RENDER_QUANTUM_FRAMES, this.channelCount)
      this.api = new this.module.SoundStretch(this.sampleRate, this.channelCount)
      this.resetPlayback(0)
    }
  }

  close() {
    this.port.onmessage = null
    this.running = false
  }

  process(inputs: Float32Array[][], outputs: Float32Array[][], parameters: Record<string, Float32Array>): boolean {
    this.setDetune(parameters['detune'][0])
    this.setPlaybackRate(parameters['playbackRate'][0])

    if (this.api && this.inputBuffer && this.outputBuffer) {
      if (this.buffer) {
        // BUFFER MODE
        if (this.playing) {
          if (this.bufferPosition < this.bufferEndPosition) {
            // Write
            const start = this.bufferPosition
            const end = Math.min(this.bufferPosition + this.requiredSamples(), this.bufferEndPosition)
            const length = end - start
            const final = end === this.bufferEndPosition
            this.inputBuffer.write(
              this.buffer.map(channelBuffer => channelBuffer.subarray(this.bufferPosition))
            )
            this.api.push(this.inputBuffer.getPointer(), length)
            this.bufferPosition = end
            if (final) {
              this.api.flush()
            }
          }
          if (this.playPosition < this.playEndPosition) {
            // Read
            if (this.api.available() >= RENDER_QUANTUM_FRAMES) {
              const actual = this.api.pull(this.outputBuffer.getPointer(), RENDER_QUANTUM_FRAMES)
              for (const output of outputs) {
                this.outputBuffer.read(output)
              }
              this.playPosition += actual

            } else {
              this.quality.underruns++
            }
          } else {
            this.playing = false
          }

          if (this.quality.runs++ % 2048 === 0) {
            console.log(`[soundstretch-processor] Underrun ratio: ${this.quality.underruns}/${this.quality.runs}, ${this.bufferPosition} samples written, ${this.playPosition} samples read, currently ${this.api.available()} samples available`)
          }
        }
      } else {
        // LIVE MODE
        const channelCount = inputs[0].length
        if (this.channelCount !== channelCount || sampleRate !== this.sampleRate) {
          this.channelCount = channelCount
          this.sampleRate = sampleRate
          this.reInit()
        }
      }
    }

    return this.running
  }
}

registerProcessor('soundstretch-processor', SoundStretchProcessor)