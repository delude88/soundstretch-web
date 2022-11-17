import WaveSurfer from 'wavesurfer.js'
import { useEffect, useRef, useState } from 'react'
import './Wavesurfer.css'
import { FiPause, FiPlay } from 'react-icons/fi'

const Wavesurfer = ({ audioContext }: { audioContext?: AudioContext }) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const [waveSurfer, setWaveSurfer] = useState<WaveSurfer>()
  const [playing, setPlaying] = useState<boolean>(false)

  useEffect(() => {
    if (containerRef.current && audioContext) {
      const ref = containerRef.current
      const ws = WaveSurfer.create({
        container: ref,
        waveColor: 'violet',
        progressColor: 'purple',
        audioContext
      })
      ws.load(`${process.env.PUBLIC_URL}/song.mp3`)
      setWaveSurfer(ws)
      return () => {
        ws.destroy()
        setWaveSurfer(undefined)
      }
    }
  }, [audioContext])

  useEffect(() => {
    if (waveSurfer && playing) {
      waveSurfer.play()
      return () => {
        waveSurfer.pause()
      }
    }
  }, [waveSurfer, playing])

  return (
    <div className='container'>
      <div ref={containerRef} />
      <button onClick={() => setPlaying(prev => !prev)}>
        {playing
          ? <FiPause />
          : <FiPlay />}
      </button>
    </div>
  )
}
export default Wavesurfer