import { useCallback, useEffect, useState } from 'react'
import './Test.css'
import * as Tone from 'tone'

const SINUS_PLAYER_PROCESSOR_URL = `${process.env.PUBLIC_URL}/player-worklet.js`

const Test = ({
                audioContext,
                url,
                useWorklet,
                useTone
              }: { audioContext?: AudioContext, url?: string, useWorklet?: boolean, useTone?: boolean }) => {
  const [audioBuffer, setAudioBuffer] = useState<AudioBuffer>()
  const [running, setRunning] = useState<boolean>(false)
  const [output, setOutput] = useState<string[]>([])

  const log = useCallback((msg: string) => {
    console.log(`[Test] ${msg}`)
    setOutput(prev => [...prev, msg])
  }, [])

  useEffect(() => {
    if (audioContext && url) {
      fetch(url)
        .then(response => {
          if (!response.ok) {
            throw new Error(`HTTP error, status = ${response.status}`)
          }
          return response.arrayBuffer()
        })
        .then(arrayBuffer => {
          return audioContext.decodeAudioData(arrayBuffer)
        })
        .then(buffer => {
          log(`Read and decoded audio to buffer @ ${buffer.sampleRate}Hz`)
          setAudioBuffer(buffer)
        })
        .catch(err => console.error(err))
    }
  }, [audioContext, url, log])

  const runOriginal = useCallback(() => {
    if (audioContext && audioBuffer) {
      log('Creating plain AudioBufferSourceNode')
      const sourceNode = new AudioBufferSourceNode(audioContext, {
        buffer: audioBuffer
      })
      //sourceNode.buffer = audioBuffer
      sourceNode.connect(audioContext.destination)
      log(`Created plain AudioBufferSourceNode with playbackRate=${sourceNode.playbackRate.value}, it's buffers sample rate is ${sourceNode.buffer?.sampleRate}Hz`)
      return new Promise<void>((resolve) => {
        sourceNode.onended = () => {
          log('AudioBufferSourceNode ended')
          resolve()
        }
        log('Let AudioBufferSourceNode play')
        sourceNode.start()
      })
    }
  }, [audioContext, audioBuffer, log])

  const runSinusPlayer = useCallback(() => {
    if (audioContext) {
      if (useTone) {
        log('Loading sinus player worklet via Tone.js')
        return Tone.context.addAudioWorkletModule(SINUS_PLAYER_PROCESSOR_URL, 'player-worklet')
          .then(() => {
            const sourceNode = Tone.context.createAudioWorkletNode('player-worklet')
            Tone.connect(sourceNode, Tone.getDestination())
            return new Promise<void>((resolve) => {
              setTimeout(() => {
                sourceNode.port.postMessage({ type: 'stop' })
                sourceNode.disconnect()
                log('Stopped playing sinus wave')
                resolve()
              }, 2000)
              log('Playing sinus wave')
              sourceNode.port.postMessage({ type: 'play' })
            })
          })
      } else {
        log('Loading sinus player worklet via plain web audio')
        return audioContext.audioWorklet.addModule(SINUS_PLAYER_PROCESSOR_URL)
          .then(() => {
            const sourceNode = new AudioWorkletNode(audioContext, 'player-worklet')
            sourceNode.connect(audioContext.destination)
            return new Promise<void>((resolve) => {
              setTimeout(() => {
                sourceNode.port.postMessage({ type: 'stop' })
                sourceNode.disconnect()
                log('Stopped playing sinus wave')
                resolve()
              }, 2000)
              log('Playing sinus wave')
              sourceNode.port.postMessage({ type: 'play' })
            })
          })
      }
    }
  }, [audioContext, audioBuffer, log, useTone])

  const onClicked = useCallback(async () => {
    try {
      setOutput([])
      log('Running sequential tests')
      setRunning(true)
      if (useWorklet) {
        await runSinusPlayer()
      }
      await runOriginal()
    } finally {
      log('Finished ALL tests')
      setRunning(false)
    }
  }, [runOriginal, runSinusPlayer, log])

  if (audioBuffer) {
    return (
      <>
        <button className='test-button' onClick={onClicked} disabled={running}>
          {running ? `RUNNING` : `RUN TEST`}
        </button>
        <textarea readOnly value={output.join("\n")} rows={10} cols={80}/>
      </>
    )
  }

  return null
}
export default Test