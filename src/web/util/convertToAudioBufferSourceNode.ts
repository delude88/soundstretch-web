import { cloneArrayBuffer } from './cloneArrayBuffer'

const convertToAudioBufferSourceNode = (workletNode: AudioWorkletNode): AudioBufferSourceNode => {
  let node = workletNode as any
  let _buffer: AudioBuffer | null = null
  let _started: boolean = false
  let _startTimeout: NodeJS.Timeout | undefined = undefined
  let _stopTimeout: NodeJS.Timeout | undefined = undefined
  let _loop: boolean = false
  let _loopStart: number = 0
  let _loopEnd: number = 0
  const _start = (offset: number = 0, duration?: number) => {
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
      workletNode.port.postMessage(msg)
    }
  }

  // PLAYBACK RATE
  node.playbackRate = node.parameters.get('playbackRate')


  // DETUNE
  node.detune = node.parameters.get('detune')


  // START
  node.start = (when: number = 0, offset: number = 0, duration?: number): void => {
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


  // STOP
  node.stop = (when: number = 0) => {
    if (!_started) {
      throw new DOMException('Node has not been started', 'InvalidStateError')
    }
    const _stop = () => {
      clearTimeout(_startTimeout)
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
      workletNode.port.postMessage({
        event: 'loop',
        loop: _loop
      })
    }
  })
  Object.defineProperty(node, 'loopStart', {
    get() {
      return _loopStart
    },
    set(seconds: number) {
      _loopStart = seconds
      workletNode.port.postMessage({
        event: 'loopStart',
        loopStart: _loopStart
      })
    }
  })
  Object.defineProperty(node, 'loopEnd', {
    get() {
      return _loopEnd
    },
    set(seconds: number) {
      _loopEnd = seconds
      workletNode.port.postMessage({
        event: 'loopEnd',
        loopEnd: _loopEnd
      })
    }
  })

  /*
  Object.defineProperty(node, 'outputChannelCount', {
    get() {
      if(_buffer) {
        return _buffer.numberOfChannels * workletNode.numberOfOutputs;
      }
      return [0];
    }
  })
  */

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

export { convertToAudioBufferSourceNode }