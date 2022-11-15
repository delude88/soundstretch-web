function cloneArrayBuffer(src: ArrayBuffer): ArrayBuffer {
  const dst = new ArrayBuffer(src.byteLength)
  new Uint8Array(dst).set(new Uint8Array(src))
  return dst
}

/*
class RubberBandRealtimeNodeImpl extends AudioWorkletNode implements AudioWorkletNode, AudioBufferSourceNode {
  public onended: ((ev: Event) => any) | null = null
  public loop: boolean = false
  public loopEnd: number = 0
  public loopStart: number = 0

  private _buffer: AudioBuffer | null = null
  private _startTimeout?: NodeJS.Timeout
  private _stopTimeout?: NodeJS.Timeout

  public get buffer() {
    return this._buffer
  }

  public set buffer(buffer: AudioBuffer | null) {
    this._buffer = buffer
    if (this._buffer) {
      const channels: ArrayBuffer[] = []
      for (let channel = 0; channel < this._buffer.numberOfChannels; channel++) {
        const source = cloneArrayBuffer(this._buffer.getChannelData(channel).buffer)
        channels.push(source)
      }
      this.port.postMessage({
          event: 'buffer',
          length: this._buffer.length,
          sampleRate: this._buffer.sampleRate,
          numberOfChannels: this._buffer.numberOfChannels,
          channels: channels
        },
        channels
      )
    }
  }

  readonly detune: AudioParam
  readonly playbackRate: AudioParam

  constructor(context: BaseAudioContext, options?: AudioWorkletNodeOptions) {
    super(context, 'rubberband-realtime-processor', options)
    this.port.onmessage = ({ data }) => {
      if (typeof data === 'object' && data['event']) {
        const { event } = data
        if (event === 'ended') {
          const eventObj = new Event('ended')
          this.dispatchEvent(eventObj)
          if (this.onended) {
            this.onended(eventObj)
          }
          this.close()
        }
      }
    }
  }

  close(): void {
    this.port.postMessage({ event: 'close' })
  }


  start(when?: number, offset?: number, duration?: number): void
  start(when?: number): void
  start(when: number = 0, offset: number = 0, duration?: number): void {
    if (this._startTimeout) {
      throw new DOMException('Already started', 'InvalidStateError')
    }
    if (when === 0 || when < this.context.currentTime) {
      // Start directly
      this._start(offset, duration)
    } else {
      // Start delayed
      const timeout = (when - this.context.currentTime) * 1000
      this._startTimeout = setTimeout(() => {
        this._start(offset, duration)
      }, timeout)
    }
  }

  _start(offset: number = 0, duration?: number) {
    if (this._buffer) {
      // offset is in seconds, convert it, 1s = sampleRate, 2s = 2* sampleRate
      const sampleRate = this._buffer?.sampleRate
      const offsetInSamples = offset * sampleRate
      const durationInSamples = duration ? (duration * sampleRate) : undefined
      this.port.postMessage({
        event: 'start',
        offset: offsetInSamples,
        duration: durationInSamples,
        loop: this.loop,
        loopStart: this.loopStart,
        loopEnd: this.loopEnd
      })
    }
  }

  private _setPitch(pitch: number) {
    this.port.postMessage({ event: 'pitch', pitch: pitch })
  }

  private _setTempo(tempo: number) {
    this.port.postMessage({ event: 'tempo', tempo: tempo })
  }

  stop(when: number = 0): void {
    if (!this._startTimeout) {
      throw new DOMException('Node has not been started', 'InvalidStateError')
    }
    if (when === 0 || when < this.context.currentTime) {
      clearTimeout(this._startTimeout)
      this.port.postMessage({ event: 'stop' })
    } else {
      const timeout = (when - this.context.currentTime) * 1000
      this._stopTimeout = setTimeout(() => {
        clearTimeout(this._startTimeout)
        this.port.postMessage({ event: 'stop' })
      }, timeout)
    }
  }
}*/

export interface RubberBandRealtimeNode extends AudioBufferSourceNode {
  close(): void
}

const createNode = (context: BaseAudioContext, options?: AudioWorkletNodeOptions): RubberBandRealtimeNode => {
  // Sadly we cannot just extend AudioWorkletNode as class (see approach above). Instead, we have to create and extend it
  const workletNode = new AudioWorkletNode(context, 'rubberband-realtime-processor', options)
  const node = workletNode as any
  let _buffer: AudioBuffer | null = null
  let _started: boolean = false
  let _startTimeout: NodeJS.Timeout | undefined = undefined
  let _stopTimeout: NodeJS.Timeout | undefined = undefined
  let _loop: boolean = false
  let _loopStart: number = 0
  let _loopEnd: number = 0
  const _start = (offset: number = 0, duration?: number) => {
    console.info('[RubberBandRealtimeNode] _start')
    if (_buffer) {
      // offset is in seconds, convert it, 1s = sampleRate, 2s = 2* sampleRate
      const sampleRate = _buffer?.sampleRate
      const offsetInSamples = offset * sampleRate
      const durationInSamples = duration ? (duration * sampleRate) : undefined
      const msg = {
        event: 'start',
        offset: offsetInSamples,
        duration: durationInSamples,
        loop: _loop,
        loopStart: _loopStart,
        loopEnd: _loopEnd
      }
      console.info('[RubberBandRealtimeNode] _start, msg=', msg)
      workletNode.port.postMessage(msg)
    }
  }

  // START
  node.start = (when: number = 0, offset: number = 0, duration?: number): void => {
    console.info('[RubberBandRealtimeNode] start')
    if (_started) {
      throw new DOMException('Already started', 'InvalidStateError')
    }
    _started = true
    if (when === 0 || when < context.currentTime) {
      // Start directly
      _start(offset, duration)
    } else {
      // Start delayed
      const timeout = (when - context.currentTime) * 1000
      _startTimeout = setTimeout(() => {
        _start(offset, duration)
      }, timeout)
    }
  }

  // PLAYBACK RATE
  const _playbackRateChangeTasks: NodeJS.Timeout[] = []
  const _playbackRateCancelTasks: NodeJS.Timeout[] = []
  node.playbackRate = {
    automationRate: 'a-rate',
    defaultValue: 0,
    maxValue: 0,
    minValue: 0,
    value: 0,
    cancelAndHoldAtTime: function(cancelTime: number): AudioParam {
      throw new Error('Function not implemented.')
    },
    cancelScheduledValues: function(cancelTime: number): AudioParam {
      if (cancelTime === 0 || cancelTime < context.currentTime) {
        _playbackRateChangeTasks.map(task => clearTimeout(task))
      } else {
        const timeout = (cancelTime - context.currentTime) * 1000
        _playbackRateCancelTasks.push(setTimeout(() => {
          _playbackRateChangeTasks.map(task => clearTimeout(task))
        }, timeout))
      }
      return this
    },
    exponentialRampToValueAtTime: function(value: number, endTime: number): AudioParam {
      throw new Error('Function not implemented.')
    },
    linearRampToValueAtTime: function(value: number, endTime: number): AudioParam {
      throw new Error('Function not implemented.')
    },
    setTargetAtTime: function(target: number, startTime: number, timeConstant: number): AudioParam {
      throw new Error('Function not implemented.')
    },
    setValueAtTime: function(value: number, startTime: number): AudioParam {
      const tempo = (100 / value) / 100
      if (startTime === 0 || startTime < context.currentTime) {
        workletNode.port.postMessage({ event: 'tempo', tempo: tempo })
      } else {
        const timeout = (startTime - context.currentTime) * 1000
        _playbackRateChangeTasks.push(setTimeout(() => {
          workletNode.port.postMessage({ event: 'tempo', tempo: tempo })
        }, timeout))
      }
      return this
    },
    setValueCurveAtTime: function(values: Float32Array | number[], startTime: number, duration: number): AudioParam {
      throw new Error('Function not implemented.')
    }
  } as AudioParam

  // DETUNE
  const _detuneChangeTasks: NodeJS.Timeout[] = []
  const _detuneCancelTasks: NodeJS.Timeout[] = []
  node.detune = {
    automationRate: 'a-rate',
    defaultValue: 0,
    maxValue: 0,
    minValue: 0,
    value: 0,
    cancelAndHoldAtTime: function(cancelTime: number): AudioParam {
      throw new Error('Function not implemented.')
    },
    cancelScheduledValues: function(cancelTime: number): AudioParam {
      if (cancelTime === 0 || cancelTime < context.currentTime) {
        _detuneChangeTasks.map(task => clearTimeout(task))
      } else {
        const timeout = (cancelTime - context.currentTime) * 1000
        _detuneCancelTasks.push(setTimeout(() => {
          _detuneChangeTasks.map(task => clearTimeout(task))
        }, timeout))
      }
      return this
    },
    exponentialRampToValueAtTime: function(value: number, endTime: number): AudioParam {
      throw new Error('Function not implemented.')
    },
    linearRampToValueAtTime: function(value: number, endTime: number): AudioParam {
      throw new Error('Function not implemented.')
    },
    setTargetAtTime: function(target: number, startTime: number, timeConstant: number): AudioParam {
      throw new Error('Function not implemented.')
    },
    setValueAtTime: function(value: number, startTime: number): AudioParam {
      const pitch = Math.pow(2.0, value / 1200.0)
      if (startTime === 0 || startTime < context.currentTime) {
        workletNode.port.postMessage({ event: 'pitch', pitch: pitch })
      } else {
        const timeout = (startTime - context.currentTime) * 1000
        _detuneChangeTasks.push(setTimeout(() => {
          workletNode.port.postMessage({ event: 'pitch', pitch: pitch })
        }, timeout))
      }
      return this
    },
    setValueCurveAtTime: function(values: Float32Array | number[], startTime: number, duration: number): AudioParam {
      throw new Error('Function not implemented.')
    }
  } as AudioParam

  // STOP
  node.stop = (when: number = 0) => {
    console.info('[RubberBandRealtimeNode] stop')
    if (!_started) {
      throw new DOMException('Node has not been started', 'InvalidStateError')
    }
    const _stop = () => {
      console.info('[RubberBandRealtimeNode] _stop')
      clearTimeout(_startTimeout)
      _playbackRateChangeTasks.map(task => clearTimeout(task))
      _playbackRateCancelTasks.map(task => clearTimeout(task))
      _detuneChangeTasks.map(task => clearTimeout(task))
      _detuneCancelTasks.map(task => clearTimeout(task))
      _startTimeout = undefined
      _stopTimeout = undefined
      workletNode.port.postMessage({ event: 'stop' })
    }
    if (when === 0 || when < context.currentTime) {
      _stop()
    } else {
      const timeout = (when - context.currentTime) * 1000
      _stopTimeout = setTimeout(() => _stop(), timeout)
    }
  }

  // Close
  node.close = () => {
    console.info('[RubberBandRealtimeNode] close')
    workletNode.port.postMessage({ event: 'close' })
  }

  // Buffer setter/getter
  Object.defineProperty(node, 'buffer', {
    get() {
      return _buffer
    },
    set(buff: AudioBuffer | null) {
      console.log('[RubberBandRealtimeNode] set buffer')
      _buffer = buff
      if (_buffer) {
        const channels: ArrayBuffer[] = []
        for (let channel = 0; channel < _buffer.numberOfChannels; channel++) {
          const source = cloneArrayBuffer(_buffer.getChannelData(channel).buffer)
          channels.push(source)
        }
        workletNode.port.postMessage({
            event: 'buffer',
            length: _buffer.length,
            sampleRate: _buffer.sampleRate,
            numberOfChannels: _buffer.numberOfChannels,
            channels: channels
          },
          channels
        )
      }
    }
  })
  Object.defineProperty(node, 'loop', {
    get() {
      return _loop
    },
    set(loop: boolean) {
      _loop = loop
    }
  })
  Object.defineProperty(node, 'loopStart', {
    get() {
      return _loopStart
    },
    set(seconds: number) {
      console.log('[RubberBandRealtimeNode] set loopStart')
      _loopStart = seconds
    }
  })
  Object.defineProperty(node, 'loopEnd', {
    get() {
      return _loopEnd
    },
    set(seconds: number) {
      console.log('[RubberBandRealtimeNode] set loopEnd')
      _loopEnd = seconds
    }
  })

  // Callbacks
  workletNode.port.onmessage = ({ data }) => {
    if (typeof data === 'object' && data['event']) {
      const { event } = data
      if (event === 'ended') {
        const eventObj = new Event('ended')
        node.dispatchEvent(eventObj)
        if (node.onended) {
          node.onended(eventObj)
        }
        node.close()
      }
    }
  }
  return node as RubberBandRealtimeNode
}

export { createNode }