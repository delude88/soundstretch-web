import { ChannelTransport } from './ChannelTransport'

class Float32ChannelTransport implements ChannelTransport<Float32Array[]> {
  private readonly _module: EmscriptenModule
  private readonly _ptr: number
  private readonly _channelCount: number
  private readonly _sampleSize: number
  private _closed = false

  constructor(module: EmscriptenModule, sampleSize: number, channelCount: number = 1) {
    if (sampleSize < 1) throw new Error('Invalid sampleSize')
    this._sampleSize = sampleSize
    if (channelCount < 1) throw new Error('Invalid channelCount')
    this._channelCount = channelCount
    this._module = module
    this._ptr = this._module._malloc(this._channelCount * this._sampleSize * Float32Array.BYTES_PER_ELEMENT)
  }

  public getPointer(channel?: number): number {
    if (this._closed) throw new Error('Already closed')
    if (channel) {
      if (channel < 0 || channel > this._channelCount) throw new Error('Channel out of bounce')
      return this._ptr + channel * this._sampleSize
    }
    return this._ptr
  }

  private get current(): Float32Array {
    if (this._closed) {
      throw new Error('Already closed')
    }
    return new Float32Array(this._module.HEAPF32.buffer, this._ptr, this._channelCount * this._sampleSize)
  }

  write(input: Float32Array[], offset: number = 0, len: number = 0): void {
    if (offset > this._sampleSize) throw new Error('Invalid offset')
    const channelCount = Math.min(input.length, this._channelCount)
    for (let c = 0; c < channelCount; ++c) {
      const length = len || Math.min(input[c].length, this._sampleSize - offset)
      const output = this.current
      output.set(input[c].subarray(0, length), c * length)
    }
  }

  read(output?: Float32Array[], offset: number = 0, len: number = 0): Float32Array[] {
    if (offset > this._sampleSize) throw new Error('Invalid offset')
    if (!output) {
      output = []
      for (let c = 0; c < this._channelCount; ++c) {
        output.push(new Float32Array(this._sampleSize))
      }
    }
    if (output.length > 0) {
      const input = this.current
      for (let c = 0; c < output.length; ++c) {
        const start = Math.min(c, this._channelCount - 1) * this._sampleSize
        const length = len || Math.min(output[c].length - offset, this._sampleSize)
        const end = start + length
        output[c].set(input.subarray(start, end), offset)
      }
    }
    return output
  }

  close() {
    this._closed = true
    this._module._free(this._ptr)
  }
}

export { Float32ChannelTransport }