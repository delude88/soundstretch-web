export interface ReadonlyFloat32Array extends Omit<Float32Array, 'copyWithin' | 'fill' | 'reverse' | 'set' | 'sort'> {
  readonly [n: number]: number;
}

class SharedAudioBuffer {
  private readonly _module: EmscriptenModule
  private readonly _ptr: number
  private readonly _buffer: AudioBuffer
  private _closed = false

  constructor(module: EmscriptenModule, audioBuffer: AudioBuffer) {
    this._module = module
    this._buffer = audioBuffer
    this._ptr = module._malloc(audioBuffer.numberOfChannels * audioBuffer.length * Float32Array.BYTES_PER_ELEMENT)
  }

  public get pointer(): number {
    if (this._closed) {
      throw new Error('SharedAudioBuffer already closed')
    }
    return this._ptr
  }

  public get numberOfChannels(): number {
    return this._buffer.numberOfChannels
  }

  public get sampleRate(): number {
    return this._buffer.sampleRate
  }

  public get sampleCount(): number {
    return this._buffer.length
  }

  public get length(): number {
    return this._buffer.length * this._buffer.numberOfChannels
  }

  private get current(): Float32Array {
    if (this._closed) {
      throw new Error('SharedAudioBuffer already closed')
    }
    return new Float32Array(this._module.HEAPF32.buffer, this._ptr, this._buffer.numberOfChannels * this._buffer.length)
  }

  public get array(): ReadonlyFloat32Array {
    if (this._closed) {
      throw new Error('SharedAudioBuffer already closed')
    }
    // Return copy instead
    return new Float32Array(this._module.HEAPF32.buffer, this._ptr, this._buffer.numberOfChannels * this._buffer.length).slice(0)
  }

  public read(useOrigin?: boolean): AudioBuffer {
    const buffer = useOrigin ? this._buffer : new AudioBuffer({
      length: this._buffer.length,
      numberOfChannels: this._buffer.numberOfChannels,
      sampleRate: this._buffer.sampleRate
    })
    const bla = new Float32Array(this._module.HEAPF32.buffer, this._ptr, this._buffer.numberOfChannels * this._buffer.length)
    for (let c = 0; c < buffer.numberOfChannels; ++c) {
      const start = c * buffer.length
      const end = start + buffer.length
      buffer.copyToChannel(this.current.subarray(start, end), c)
    }
    return buffer
  }

  public write(buffer?: AudioBuffer): number {
    const buf = buffer || this._buffer
    for (let c = 0; c < buf.numberOfChannels; ++c) {
      const start = c * buf.length
      const end = start + buf.length
      buf.copyFromChannel(this.current.subarray(start, end), c)
    }
    return buf.length
  }

  public close(): void {
    this._module._free(this._ptr)
    this._closed = true
  }
}

export { SharedAudioBuffer }