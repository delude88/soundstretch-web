import { cloneArrayBuffer } from './cloneArrayBuffer'

const convertToBufferSourceNode = (workletNode: AudioWorkletNode): AudioBufferSourceNode => {
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
    if (when === 0 || when < workletNode.context.currentTime) {
      // Start directly
      _start(offset, duration)
    } else {
      // Start delayed
      const timeout = (when - workletNode.context.currentTime) * 1000
      _startTimeout = setTimeout(() => {
        _start(offset, duration)
      }, timeout)
    }
  }

  // PLAYBACK RATE
  const _playbackRateChangeTasks: NodeJS.Timeout[] = []
  const _playbackRateCancelTasks: NodeJS.Timeout[] = []
  let _playbackRate = 1
  node.playbackRate = {
    automationRate: 'k-rate',
    defaultValue: 1,
    maxValue: 3.4028234663852886e+38,
    minValue: 0.00000000001,
    value: _playbackRate,
    cancelAndHoldAtTime: function(cancelTime: number): AudioParam {
      throw new Error('Function not implemented.')
    },
    cancelScheduledValues: function(cancelTime: number): AudioParam {
      if (cancelTime === 0 || cancelTime < workletNode.context.currentTime) {
        _playbackRateChangeTasks.map(task => clearTimeout(task))
      } else {
        const timeout = (cancelTime - workletNode.context.currentTime) * 1000
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
      if (startTime === 0 || startTime < workletNode.context.currentTime) {
        _playbackRate = value
        workletNode.port.postMessage({ event: 'tempo', tempo: value })
      } else {
        const timeout = (startTime - workletNode.context.currentTime) * 1000
        _playbackRateChangeTasks.push(setTimeout(() => {
          _playbackRate = value
          workletNode.port.postMessage({ event: 'tempo', tempo: value })
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
  let _detuneValue = 0
  node.detune = {
    automationRate: 'k-rate',
    defaultValue: 0,
    maxValue: 3.4028234663852886e+38,
    minValue: -3.4028234663852886e+38,
    value: _detuneValue,
    cancelAndHoldAtTime: function(cancelTime: number): AudioParam {
      throw new Error('Function not implemented.')
    },
    cancelScheduledValues: function(cancelTime: number): AudioParam {
      if (cancelTime === 0 || cancelTime < workletNode.context.currentTime) {
        _detuneChangeTasks.map(task => clearTimeout(task))
      } else {
        const timeout = (cancelTime - workletNode.context.currentTime) * 1000
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
      if (startTime === 0 || startTime < workletNode.context.currentTime) {
        _detuneValue = value
        workletNode.port.postMessage({ event: 'pitch', pitch: value })
      } else {
        const timeout = (startTime - workletNode.context.currentTime) * 1000
        _detuneChangeTasks.push(setTimeout(() => {
          _detuneValue = value
          workletNode.port.postMessage({ event: 'pitch', pitch: value })
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
    if (!_started) {
      throw new DOMException('Node has not been started', 'InvalidStateError')
    }
    const _stop = () => {
      clearTimeout(_startTimeout)
      _playbackRateChangeTasks.map(task => clearTimeout(task))
      _playbackRateCancelTasks.map(task => clearTimeout(task))
      _detuneChangeTasks.map(task => clearTimeout(task))
      _detuneCancelTasks.map(task => clearTimeout(task))
      _startTimeout = undefined
      _stopTimeout = undefined
      workletNode.port.postMessage({ event: 'stop' })
    }
    if (when === 0 || when < workletNode.context.currentTime) {
      _stop()
    } else {
      const timeout = (when - workletNode.context.currentTime) * 1000
      _stopTimeout = setTimeout(() => _stop(), timeout)
    }
  }

  // Close
  node.close = () => {
    workletNode.port.postMessage({ event: 'close' })
  }

  // Buffer setter/getter
  Object.defineProperty(node, 'buffer', {
    get() {
      return _buffer
    },
    set(buff: AudioBuffer | null) {
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
  return node as AudioBufferSourceNode
}

export {convertToBufferSourceNode}