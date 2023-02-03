import { useCallback, useEffect, useState } from 'react'
import {
  createRubberBandNode
} from 'soundstretch-web'

const RUBBERBAND_REALTIME_PROCESSOR_URL = `${process.env.PUBLIC_URL}/rubberband-realtime-processor.js`
const Test = ({ audioContext, url }: { audioContext?: AudioContext, url?: string }) => {
  const [audioBuffer, setAudioBuffer] = useState<AudioBuffer>()
  const [running, setRunning] = useState<boolean>(false)

  useEffect(() => {
    if (audioContext && url) {
      console.log(`[TEST] Reading audio buffer with context @${audioContext.sampleRate}Hz`)
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
          setAudioBuffer(buffer)
        })
        .catch(err => console.error(err))
    }
  }, [audioContext, url])

  const runOriginal = useCallback(() => {
    if (audioContext && audioBuffer) {
      console.info("[TEST] Running original AudioBufferSourceNode test")
      // Create original AudioBufferSourceNode
      const sourceNode = new AudioBufferSourceNode(audioContext)
      console.log(`[TEST] Created original AudioBufferSourceNode with playbackRate=${sourceNode.playbackRate}`, sourceNode)
      sourceNode.buffer = audioBuffer
      sourceNode.connect(audioContext.destination)
      return new Promise<void>((resolve) => {
        sourceNode.onended = () => {
          console.info("[TEST] Finished original AudioBufferSourceNode test")
          resolve()
        }
        sourceNode.start()
      })
    }
  }, [audioContext, audioBuffer])

  const runRubberBand = useCallback(() => {
    if (audioContext && audioBuffer) {
      console.info("[TEST] Running RubberBandNode test")
      // Create RubberBandNode
      return createRubberBandNode(audioContext, RUBBERBAND_REALTIME_PROCESSOR_URL)
        .then((sourceNode) => {
          console.log(`[TEST] Created RubberBandNode with playbackRate=${sourceNode.playbackRate}`, sourceNode)
          sourceNode.buffer = audioBuffer
          sourceNode.connect(audioContext.destination)
          return new Promise<void>((resolve) => {
            sourceNode.onended = () => {
              console.info("[TEST] Finished RubberBandNode test")
              resolve()
            }
            sourceNode.start()
          })
        })
    }
  }, [audioContext, audioBuffer])

  const onClicked = useCallback(async () => {
    try {
      console.info("[TEST] Running sequential tests")
      setRunning(true)
      // First run original
      await runOriginal()
      // Now with rubberband
      await runRubberBand()
    } finally {
      console.info("[TEST] Finished ALL tests")
      setRunning(false)
    }
  }, [])

  return (
    <button onClick={onClicked} disabled={running}>
      {running ? `RUNNING` : `RUN TEST`}
    </button>
  )
}
export default Test