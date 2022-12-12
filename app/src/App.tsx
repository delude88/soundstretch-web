import React, { useCallback, useEffect, useMemo, useState } from 'react'
import logo from './logo.svg'
import './App.css'
import { Engine, Method, usePlayer } from './usePlayer'
import { useAudioFileChooser } from './useAudioFileChooser'
import ReactWaveDraw from './wavedraw/ReactWaveDraw'
import { IoPlayOutline, IoStopOutline } from 'react-icons/io5'

function App() {
  const audioContext = useMemo(() => new AudioContext(), [])
  const { audioBuffer, handleFileInputChange } = useAudioFileChooser(audioContext, `${process.env.PUBLIC_URL}/stereo.mp3`)
  const {
    method,
    engine,
    bpm,
    playing,
    setPreserved: setPreservedInPlayer,
    setTempo: setTempoInPlayer,
    setPitch: setPitchInPlayer,
    setPlaying,
    setMethod,
    setEngine
  } = usePlayer(audioContext, audioBuffer)
  const [preserved, setPreserved] = useState<boolean>(false)
  const [tempo, setTempo] = useState<number>(1)
  const [pitch, setPitch] = useState<number>(0)

  useEffect(() => {
    setTempoInPlayer(tempo)
  }, [setTempoInPlayer, tempo])

  useEffect(() => {
    setPitchInPlayer(pitch)
  }, [setPitchInPlayer, pitch])

  useEffect(() => {
    setPreservedInPlayer(preserved)
  }, [setPreservedInPlayer, preserved])

  const handlePlaybackButton = useCallback(() => {
    audioContext.resume()
      .then(() => setPlaying(prev => !prev))
  }, [setPlaying, audioContext])

  return (
    <div className='App'>
      <header className='App-header'>
        <img src={logo} className='App-logo' alt='logo' />
        <label>
          <input type='file' accept='audio/*' multiple={false} onChange={handleFileInputChange} />
        </label>
        <div className='row'>
          <ReactWaveDraw audioContext={audioContext} audioBuffer={audioBuffer} detune={pitch * 100} playbackRate={tempo} />
        </div>
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
        <p className='micro'>
          <label>
            <input type='checkbox' checked={preserved} onChange={(e) => setPreserved(e.currentTarget.checked)} />
            Preserve the spectral envelope of the unshifted signal. This permits shifting the note frequency without
            so substantially affecting the perceived pitch profile of the voice or instrument.
            This has only affect on RubberBand based pitch shifting.
          </label>
        </p>
        <h1>
          Test methods
        </h1>
        <h3>Method</h3>
        <select value={engine} onChange={(e) => setEngine(e.currentTarget.value as Engine)}>
          <option value='webaudio'>Web Audio API</option>
          <option value='tonejs'>Tone.js</option>
        </select>
        <select value={method} onChange={(e) => setMethod(e.currentTarget.value as Method)}>
          <option value='original'>Original</option>
          <option value='realtime'>Rubberband</option>
          <option value='soundtouch'>Soundtouch</option>
        </select>
        <p>
          <button className='playbackButton' onClick={handlePlaybackButton}>
            {playing ? <IoStopOutline /> : <IoPlayOutline />}
          </button>
        </p>
        <p>
          {bpm ? `${bpm} beats per minute` : ''}
        </p>
      </header>
    </div>
  )
}

export default App
