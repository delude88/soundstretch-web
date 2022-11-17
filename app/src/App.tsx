import React, { useCallback, useMemo } from 'react'
import logo from './logo.svg'
import './App.css'
import { Method, usePlayer } from './usePlayer'
import { IoPlayOutline, IoStopOutline } from 'react-icons/io5'
import { useTest } from './useTest'
import { useAudioFileChooser } from './useAudioFileChooser'
import Wavesurfer from './Wavesurfer'
import ReactWaveDraw from './wavedraw/ReactWaveDraw'

const USE_WAVESURFER = true

function App() {
  const audioContext = useMemo(() => new AudioContext(), [])
  const { audioBuffer, handleFileInputChange } = useAudioFileChooser(audioContext, `${process.env.PUBLIC_URL}/song.mp3`)
  const {
    preserved,
    method,
    playing,
    pitch,
    tempo,
    setPreserved,
    setTempo,
    setPitch,
    setPlaying,
    setMethod
  } = usePlayer(audioContext, audioBuffer)

  const runTest = useTest()

  const handlePlaybackButton = useCallback(() => {
    audioContext.resume()
      .then(() => setPlaying(prev => !prev))
  }, [setPlaying, audioContext])

  return (
    <div className='App'>
      <header className='App-header'>
        <img src={logo} className='App-logo' alt='logo' />
        <ReactWaveDraw audioContext={audioContext} audioBuffer={audioBuffer} />
        {USE_WAVESURFER && <Wavesurfer audioContext={audioContext} />}
        <label>
          <input type='file' accept='audio/*' multiple={false} onChange={handleFileInputChange} />
        </label>
        <label>
          <h3>Method</h3>
          <select value={method} onChange={(e) => setMethod(e.currentTarget.value as Method)}>
            <option value='original'>Original</option>
            <option value='realtime'>Rubberband</option>
            <option value='soundtouch'>Soundtouch</option>
          </select>
        </label>
        {method === 'realtime' && (
          <p className='micro'>
            <label>
              <input type='checkbox' checked={preserved} onChange={(e) => setPreserved(e.currentTarget.checked)} />
              Preserve the spectral envelope of the unshifted signal. This permits shifting the note frequency without
              so substantially affecting the perceived pitch profile of the voice or instrument.
            </label>
          </p>
        )}
        <label>
          <h3>Tempo</h3>
          <input type='range'
                 onChange={(e) => setTempo(parseFloat(e.currentTarget.value))}
                 value={tempo}
                 min={0.5}
                 max={2.0}
                 step={0.05}
          />
          {Math.round(tempo * 100)}%
        </label>
        <label>
          <h3>Pitch</h3>
          <input type='range'
                 onChange={(e) => setPitch(parseInt(e.currentTarget.value))}
                 value={pitch}
                 min={-12}
                 max={12}
                 step={1}
          />
          {Math.round(pitch)} semitones
        </label>
        <p>
          <button className='playbackButton' onClick={handlePlaybackButton}>
            {playing ? <IoStopOutline /> : <IoPlayOutline />}
          </button>
        </p>
        <p>
          <button onClick={runTest}>
            <h1>
              Run test
            </h1>
          </button>
        </p>
      </header>
    </div>
  )
}

export default App
