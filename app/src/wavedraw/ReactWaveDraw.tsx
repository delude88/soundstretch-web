import React, { useCallback, useEffect, useRef, useState } from 'react'
import './ReactWaveDraw.css'
import WaveDraw from './WaveDraw'
import { createRubberBandNode } from 'soundstretch-web'
import { IoPlayOutline, IoStopOutline } from 'react-icons/io5'

const ReactWaveDraw = ({ audioContext, audioBuffer, playbackRate, detune }: { audioContext?: AudioContext, audioBuffer?: AudioBuffer, playbackRate?: number, detune?: number }) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const [waveSurfer, setWaveSurfer] = useState<WaveDraw>()
  const [playing, setPlaying] = useState<boolean>(false)

  useEffect(() => {
    if (containerRef.current && audioContext) {
      const container = containerRef.current
      const ws = new WaveDraw({
        container,
        audioContext,
        createBuffer: (ctx) => createRubberBandNode(ctx, `${process.env.PUBLIC_URL}/rubberband-realtime-processor.js`, {
          //outputChannelCount: [2]
        }),
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

  useEffect(() => {
    if (waveSurfer && detune) {
      waveSurfer.setDetune(detune)
    }
  }, [waveSurfer, detune])

  useEffect(() => {
    if (waveSurfer && playbackRate) {
      waveSurfer.setPlaybackRate(playbackRate)
    }
  }, [waveSurfer, playbackRate])

  const handlePlaybackButton = useCallback(() => {
    if(audioContext) {
      audioContext.resume()
        .then(() => setPlaying(prev => !prev))
    }
  }, [setPlaying, audioContext])

  return (
    <div className='wrapper'>
      <div ref={containerRef} className='container' />
      <button className='playbackButton' onClick={handlePlaybackButton}>
        {playing ? <IoStopOutline /> : <IoPlayOutline />}
      </button>
    </div>
  )
}
export default ReactWaveDraw