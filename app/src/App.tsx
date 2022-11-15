import React, { useCallback, useMemo } from 'react'
import logo from './logo.svg'
import './App.css'
import { usePlayer } from './usePlayer'
import { IoPlayOutline, IoStopOutline } from 'react-icons/io5'
import { useTest } from './useTest'

function App() {
  const audioContext = useMemo(() => new AudioContext(), [])
  const {
    playing,
    pitch,
    tempo,
    setTempo,
    setPitch,
    setPlaying
  } = usePlayer('song.mp3', audioContext)
  const runTest = useTest()

  const handlePlaybackButton = useCallback(() => {
    audioContext.resume()
      .then(() => setPlaying(prev => !prev))
  }, [setPlaying, audioContext])

  return (
    <div className='App'>
      <header className='App-header'>
        <img src={logo} className='App-logo' alt='logo' />
        <h3>Tempo</h3>
        <label>
          <input type='range'
                 onChange={(e) => setTempo(parseFloat(e.currentTarget.value))}
                 value={tempo}
                 min={0.5}
                 max={2.0}
                 step={0.05}
          />
          {Math.round(tempo * 100)}%
        </label>
        <h3>Pitch</h3>
        <label>
          <input type='range'
                 onChange={(e) => setPitch(parseFloat(e.currentTarget.value))}
                 value={pitch}
                 min={-12}
                 max={12}
                 step={0.05}
          />
          {Math.round(pitch)} semitones
        </label>
        <p>
          <a className='playbackButton' onClick={handlePlaybackButton}>
            {playing ? <IoStopOutline /> : <IoPlayOutline />}
          </a>
        </p>
        <button onClick={runTest}>
          <h1>
            RUN TEST
          </h1>
        </button>
      </header>
    </div>
  )
}

export default App
