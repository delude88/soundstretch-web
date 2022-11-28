import { Beat } from '../web/Beat'
import { Float32ChannelTransport } from '../web/Float32ChannelTransport'
import { BPMDetector, SoundTouchModule } from '../web/SoundTouchModule'
import * as createModule from '../../wasm/build/soundtouch.js'

const RENDER_QUANTUM_FRAMES = 128

class BpmCountProcessor extends AudioWorkletProcessor {
  private module?: SoundTouchModule
  private api?: BPMDetector
  private inputBuffer?: Float32ChannelTransport
  private channelCount: number = 1

  constructor() {
    super()
    this.port.onmessageerror = (err) => {
      console.error('onmessageerror', err)
    }
    this.port.onmessage = ({ data }) => {
      if (typeof data === 'object' && data['event']) {
        const { event } = data
        switch (event) {
          case 'bpm': {
            console.log(`[bpm-count-processor] bpm requested`)
            this.port.postMessage({ event: 'bpm', bpm: this.api?.getBpm() || 0 })
            break
          }
          case 'beats': {
            console.log(`[bpm-count-processor] beats requested`)
            if (data.limit === undefined) throw new Error('Missing limit key')
            const limit = parseInt(data.limit)
            if (limit === Number.NaN) throw new Error(`Invalid limit key ${data.limit}`)
            if (this.api && this.module) {
              const beats: Beat[] = []
              const positionBuffer = new Float32ChannelTransport(this.module, limit, 1)
              const strengthBuffer = new Float32ChannelTransport(this.module, limit, 1)
              const actual = this.api.getBeats(positionBuffer.getPointer(), strengthBuffer.getPointer(), limit)
              const positionArray = positionBuffer.read()
              const strengthArray = strengthBuffer.read()
              positionBuffer.close()
              strengthBuffer.close()
              for (let i = 0; i < actual; ++i) {
                beats.push({
                  position: positionArray[0][i],
                  strength: strengthArray[0][i]
                })
              }
              this.port.postMessage({ event: 'beats', beats: beats })
            } else {
              this.port.postMessage({ event: 'beats', beats: [] })
            }
            break
          }
        }
      }
    }
    createModule()
      .then((module: SoundTouchModule) => {
        this.module = module
        this.init(1)
      })
  }

  init(channelCount: number) {
    this.channelCount = channelCount
    if (this.module) {
      this.api = new this.module.BPMDetector(channelCount, sampleRate)
      this.inputBuffer = new Float32ChannelTransport(this.module, RENDER_QUANTUM_FRAMES, channelCount)
    }
  }

  process(inputs: Float32Array[][], outputs: Float32Array[][]): boolean {
    if (inputs.length > 0 && inputs[0].length > 0) {
      const channelCount = inputs[0].length
      if (!this.api || this.channelCount !== channelCount) {
        this.init(channelCount)
      }

      if (this.api && this.inputBuffer) {
        // Feed
        this.inputBuffer.write(inputs[0])
        this.api.inputSamples(this.inputBuffer.getPointer(), RENDER_QUANTUM_FRAMES)
      }
    }

    // Just forward
    const sourceLimit = Math.min(inputs.length, outputs.length)
    for (let inputNum = 0; inputNum < sourceLimit; inputNum++) {
      const input = inputs[inputNum]
      const output = outputs[inputNum]

      const channelCount = Math.min(input.length, output.length)
      for (let channelNum = 0; channelNum < channelCount; channelNum++) {
        input[channelNum].forEach((sample, i) => {
          output[channelNum][i] = sample
        })
      }
    }

    return true
  }
}

registerProcessor('bpm-count-processor', BpmCountProcessor)