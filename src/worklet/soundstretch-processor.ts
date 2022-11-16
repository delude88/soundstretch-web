import { HeapArray } from '../web/HeapArray'
import { SoundStretch, SoundTouchModule } from '../web/SoundTouchModule'
import * as createModule from '../../wasm/build/soundtouch.js'

const RENDER_QUANTUM_FRAMES = 128

class SoundStretchProcessor extends AudioWorkletProcessor {
  private pitch: number = 1
  private tempo: number = 1
  private rate: number = 1
  private sampleRate: number = 1
  private channelCount: number = 1
  private buffer?: Float32Array[]
  private module?: SoundTouchModule
  private api?: SoundStretch
  private inputArray?: HeapArray
  private outputArray?: HeapArray
  private running: boolean = true
  private playing: boolean = false
  private bufferPosition: number = 0
  private bufferEndPosition: number = 0
  private playPosition: number = 0
  private playEndPosition: number = 0

  constructor() {
    super()
    this.port.onmessage = ({ data }) => {
      if (typeof data === 'object' && data['event']) {
        const { event } = data
        console.info(`[soundstretch-processor] Received event=${event}`)
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
            this.playPosition = data.offset || 0
            this.bufferEndPosition = this.buffer.length > 0 ? this.buffer[0].length : 0
            this.playEndPosition = this.bufferEndPosition * this.tempo
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
          case 'pitch': {
            if (data.pitch === undefined) throw new Error('Missing pitch key')
            if (data.pitch <= 0) throw new Error(`Invalid pitch key ${data.pitch}`)
            this.pitch = data.pitch
            console.log(`[soundstretch-processor] this.pitch = ${this.pitch}`)
            this.api?.setPitch(this.pitch)
            break
          }
          case 'rate': {
            if (data.rate === undefined) throw new Error('Missing rate key')
            if (data.rate <= 0) throw new Error(`Invalid rate key ${data.rate}`)
            this.rate = data.rate
            console.log(`[soundstretch-processor] this.rate = ${this.rate}`)
            this.api?.setRate(this.pitch)
            break
          }
          case 'tempo': {
            if (data.tempo === undefined) throw new Error('Missing tempo key')
            if (data.tempo <= 0) throw new Error(`Invalid tempo key ${data.tempo}`)
            this.tempo = data.tempo
            console.log(`[soundstretch-processor] this.tempo = ${this.tempo}`)
            this.api?.setTempo(this.tempo)
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

  reInit() {
    if (this.module) {
      console.log(`[soundstretch-processor] reInit sampleRate=${this.sampleRate} channelCount=${this.channelCount}`)
      this.inputArray = new HeapArray(this.module, RENDER_QUANTUM_FRAMES, this.channelCount)
      this.outputArray = new HeapArray(this.module, RENDER_QUANTUM_FRAMES, this.channelCount)
      this.api = new this.module.SoundStretch(this.sampleRate, this.channelCount)
    }
  }

  close() {
    this.port.onmessage = null
    this.running = false
  }

  process(inputs: Float32Array[][], outputs: Float32Array[][]): boolean {
    if (this.api && this.inputArray && this.outputArray) {
      if (this.buffer) {
        // BUFFER MODE
        if (this.playing) {
          if (this.bufferPosition < this.bufferEndPosition) {
            // Write
            const start = this.bufferPosition
            const end = Math.min(this.bufferPosition + RENDER_QUANTUM_FRAMES, this.bufferEndPosition)
            for (let c = 0; c < this.channelCount; ++c) {
              this.inputArray.getChannelArray(c).set(this.buffer[c].subarray(start, end))
            }
            this.api.push(this.inputArray.getHeapAddress(), end - start)
          }
          if (this.playPosition < this.playEndPosition) {
            // Read
            if (this.api.available() >= RENDER_QUANTUM_FRAMES) {
              const actual = this.api.pull(this.outputArray.getHeapAddress(), RENDER_QUANTUM_FRAMES)
              console.assert(actual === RENDER_QUANTUM_FRAMES, 'should be same')
              for (let c = 0; c < this.channelCount; ++c) {
                outputs[0][c].set(this.inputArray.getChannelArray(c))
              }
              this.playPosition += actual
            }
          } else {
            this.playing = false
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