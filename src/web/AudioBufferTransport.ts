import { ChannelTransport } from './ChannelTransport'

class AudioBufferTransport implements ChannelTransport<AudioBuffer> {
  private readonly _module: EmscriptenModule
  private readonly _ptr: number
  private readonly _channelCount: number
  private readonly _sampleRate: number
  private readonly _sampleSize: number
  private _closed = false

  constructor(module: EmscriptenModule, sampleRate: number, sampleSize: number, numberOfChannels: number = 1) {
    this._module = module
    this._sampleRate = sampleRate
    this._sampleSize = sampleSize
    this._channelCount = numberOfChannels
    this._ptr = module._malloc(this._channelCount * this._sampleSize * Float32Array.BYTES_PER_ELEMENT)
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
    if (this._closed) throw new Error('Already closed')
    return new Float32Array(this._module.HEAPF32.buffer, this._ptr, this._channelCount * this._sampleSize)
  }

  public write(buffer: AudioBuffer): number {
    for (let c = 0; c < buffer.numberOfChannels; ++c) {
      const start = c * buffer.length
      const end = start + buffer.length
      buffer.copyFromChannel(this.current.subarray(start, end), c)
    }
    return buffer.length
  }

  public read(output?: AudioBuffer): AudioBuffer {
    const buffer = output || new AudioBuffer({
      length: this._sampleSize,
      numberOfChannels: this._channelCount,
      sampleRate: this._sampleRate
    })
    for (let c = 0; c < buffer.numberOfChannels; ++c) {
      const start = c * buffer.length
      const end = start + buffer.length
      buffer.copyToChannel(this.current.subarray(start, end), c)
    }
    return buffer
  }

  public close(): void {
    this._module._free(this._ptr)
    this._closed = true
  }
}

export {AudioBufferTransport}