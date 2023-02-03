import React, { useCallback, useEffect, useState } from 'react'
import logo from './logo.svg'
import './App.css'
import Test from './Test'
import getAudioContextFromTone from './getAudioContextFromTone'
import * as Tone from "tone";

const INITIAL_AUDIO_URL = `${process.env.PUBLIC_URL}/laugh44100.wav`

function App() {
  const [started, setStarted] = useState<boolean>()
  const [audioContext, setAudioContext] = useState<AudioContext>()
  const [useTone, setUseTone] = useState<boolean>(false)
  const [useWorklet, setUseWorklet] = useState<boolean>(false)

  useEffect(() => {
    if(started) {
      if(useTone) {
        Tone.start()
          .then(() => {
            const context = getAudioContextFromTone()
            console.info('Started tone context', context)
            setAudioContext(context)
          })
      } else {
        const context = new AudioContext({
          sampleRate: 44100
        })
        context.resume()
          .then(() => {
            console.info('Started web audio context', context)
            setAudioContext(context)
          })
      }
    }
  }, [started, useTone, useWorklet])

  const onOverlayClicked = useCallback(() => {
    setStarted(true)
  }, [])

  return (
    <div className='App'>
      <header className='App-header'>
        <img src={logo} className='App-logo' alt='logo' />
        <label>
          Tone.js
          <input type="checkbox" checked={useTone} onChange={(e) => setUseTone(e.currentTarget.checked)} />
        </label>
        <label>
          Worklet
          <input type="checkbox" checked={useWorklet} onChange={(e) => setUseWorklet(e.currentTarget.checked)} />
        </label>
        <Test audioContext={audioContext} url={INITIAL_AUDIO_URL} useTone={useTone} useWorklet={useWorklet} />
        {!audioContext && (
          <div className='overlay' onClick={onOverlayClicked}>
            <button className='overlay-button'>
              <svg stroke='currentColor' fill='currentColor' strokeWidth='0' viewBox='0 0 448 512' height='1em'
                   width='1em' xmlns='http://www.w3.org/2000/svg'>
                <path
                  d='M424.4 214.7L72.4 6.6C43.8-10.3 0 6.1 0 47.9V464c0 37.5 40.7 60.1 72.4 41.3l352-208c31.4-18.5 31.5-64.1 0-82.6z' />
              </svg>
            </button>
          </div>
        )}
      </header>
    </div>
  )
}

export default App
