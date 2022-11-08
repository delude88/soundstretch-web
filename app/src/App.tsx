import React, { useCallback, useMemo } from 'react'
import logo from './logo.svg'
import './App.css'

const test = async (audioContext: AudioContext): Promise<AudioBufferSourceNode> => {
  // Step 1: Read file from
  const fileBuffer = await fetch('song.mp3').then(result => result.arrayBuffer())
  const audioBuffer = await audioContext.decodeAudioData(fileBuffer)
  console.log(audioBuffer.length)

  // Step 2: Init WASM test module

  // Step 3: Try to transport whole file at once to wasm

  // Step 4: Try to transport file by slices to wasm

  // Step 5: Try to transport file back from wasm at once

  // Step 6: Try to transport file back in slices


  // Step 7: Finally play file
  const buffer = new AudioBufferSourceNode(audioContext)
  buffer.connect(audioContext.destination)
  buffer.buffer = audioBuffer
  buffer.loop = true
  return buffer
}
export { test }

function App() {
  const context = useMemo(() => new AudioContext(), [])

  const run = useCallback(() => {
    context.resume()
      .then(() => {
        test(context)
          .then(buffer => {
            buffer.start()
            console.log("Started")
          })
      })
  }, [context])

  return (
    <div className='App'>
      <header className='App-header'>
        <img src={logo} className='App-logo' alt='logo' />
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
