import React, { useCallback, useMemo } from 'react'
import logo from './logo.svg'
import './App.css'
import { runTest } from './util'
import { usePlayer } from './usePlayer'
import { IoPlayOutline, IoStopOutline } from 'react-icons/io5'

function App() {
  const audioContext = useMemo(() => new AudioContext(), [])
  const { playing, volume, pitch, tempo, setTempo, setPitch, setPlaying, setVolume } = usePlayer('song.mp3', audioContext)

  const run = useCallback(() => {
    audioContext.resume()
      .then(() => runTest(audioContext))
  }, [audioContext])

  return (
    <div className='App'>
      <header className='App-header'>
        <img src={logo} className='App-logo' alt='logo' />
        <h3>Volume</h3>
        <label>
          <input type='range'
                 onChange={(e) => setVolume(parseFloat(e.currentTarget.value))}
                 value={volume}
                 min={0.0}
                 max={3.0}
                 step={0.2}
          />
          {Math.round(volume * 100)}%
        </label>
        <h3>Tempo</h3>
        <label>
          <input type='range'
                 onChange={(e) => setTempo(parseFloat(e.currentTarget.value))}
                 value={tempo}
                 min={0.9}
                 max={1.1}
                 step={0.05}
          />
          {Math.round(tempo * 100)}%
        </label>
        <h3>Pitch</h3>
        <label>
          <input type='range'
                 onChange={(e) => setPitch(parseFloat(e.currentTarget.value))}
                 value={pitch}
                 min={0.9}
                 max={1.1}
                 step={0.05}
          />
          {Math.round(pitch * 100)}%
        </label>
        <p>
          <a className='playbackButton' onClick={() => setPlaying(prev => !prev)}>
            {playing ? <IoStopOutline /> : <IoPlayOutline />}
          </a>
        </p>
        <button onClick={run}>
          <h1>
            RUN TEST
          </h1>
        </button>
      </header>
    </div>
  )
}

export default App
