import { useEffect, useRef, useState } from 'react'
import './ReactWaveDraw.css'
import { FiPause, FiPlay } from 'react-icons/fi'
import WaveDraw from './WaveDraw'
import { createRubberBandNode } from 'soundstretch-web'

const ReactWaveDraw = ({ audioContext, audioBuffer }: { audioContext?: AudioContext, audioBuffer?: AudioBuffer }) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const [waveSurfer, setWaveSurfer] = useState<WaveDraw>()
  const [playing, setPlaying] = useState<boolean>(false)

  useEffect(() => {
    if (containerRef.current && audioContext) {
      const container = containerRef.current
      const ws = new WaveDraw({
        container,
        audioContext,
        createBuffer: (ctx) => createRubberBandNode(ctx, `${process.env.PUBLIC_URL}/rubberband-realtime-processor.js`),
      })
      setWaveSurfer(ws)
      return () => {
        ws.destroy()
        setWaveSurfer(undefined)
      }
    }
  }, [audioContext])

  useEffect(() => {
    if (waveSurfer && audioBuffer) {
      waveSurfer.setBuffer(audioBuffer)
    }
  }, [waveSurfer, audioBuffer])

  useEffect(() => {
    if (waveSurfer && playing) {
      waveSurfer.play()
      return () => {
        waveSurfer.pause()
      }
    }
  }, [waveSurfer, playing])

  return (
    <div className='wrapper'>
      <div ref={containerRef} className='container' />
        <button onClick={() => setPlaying(prev => !prev)}>
          {playing
            ? <FiPause />
            : <FiPlay />}
        </button>
    </div>
  )
}
export default ReactWaveDraw