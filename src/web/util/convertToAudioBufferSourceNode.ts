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
  let _reportInterval: NodeJS.Timeout | undefined = undefined

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

      _reportInterval = setInterval(() => {
        workletNode.port.postMessage({ event: 'report' })
      }, 2000)
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
      _start(0, duration)
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
      clearInterval(_reportInterval)
      _startTimeout = undefined
      _stopTimeout = undefined
      _reportInterval = undefined
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
        console.info("BUFFER", _buffer)
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
      } else if (event === 'report') {
        const report = data['report'] as { underruns: number, runs: number }
        const currentSampleRate = data['sampleRate'] as number
        const currentBufferSampleRate = data['bufferSampleRate'] as number
        console.log(`Quality: ${report.underruns}/${report.runs} underruns per run = ${(1 - (report.underruns / report.runs)) * 100}% quality. Worklet @ ${currentSampleRate}Hz, worklet buffer @ ${currentBufferSampleRate}Hz, buffer @ ${_buffer?.sampleRate || 'not set'} context @ ${workletNode.context.sampleRate}`)
      }
    }
  }
  return node as AudioBufferSourceNode
}

export { convertToAudioBufferSourceNode }