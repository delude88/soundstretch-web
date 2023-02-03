import { useCallback, useState } from 'react'
import * as Tone from "tone"
const PlayOverlay = ({audioContext}: {audioContext?: AudioContext}) => {
  const [running, setRunning] = useState<boolean>(audioContext?.state === "running")
  const start = useCallback(() => {
    if(audioContext) {
      // Start also TONE
      Promise.any([
        audioContext.resume(),
        Tone.start()
        ])
        .then(() => setRunning(true))
        .catch(() => setRunning(false))
    }
  }, [])
  if(!running) {
    return (
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        bottom: 0,
        right: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '2rem',
        color: 'white',
        background: 'rgba(168,0,168,0.3)',
        width: '100vw',
        height: '100vh',
        zIndex:  9999,
      }} onClick={start}>
        START
      </div>
    )
  }
  return null
}

export {PlayOverlay}