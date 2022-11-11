import { useEffect, useMemo, useState } from 'react'
// @ts-ignore
import * as createModule from 'soundstretch-web/wasm'
import { SoundStretchModule } from 'soundstretch-web'
import { SharedAudioBuffer } from './SharedAudioBuffer'
import debounce from 'lodash/debounce'
import {
  createRubberBandSourceNode,
  createRubberBandRealtimeNode,
  RubberBandSourceNode,
  RubberBandRealtimeNode
} from 'soundstretch-web'

const DEBOUNCE_DELAY = 500

interface PlaybackSettings {
  volume: number,
  pitch: number,
  tempo: number
}

const usePlayer = (url: string, audioContext: AudioContext) => {
  const [method, setMethod] = useState<'offline' | 'realtime' | 'soundtouch'>('realtime')
  const [volume, setVolume] = useState<number>(1)
  const [pitch, setPitch] = useState<number>(1)
  const [tempo, setTempo] = useState<number>(1)
  const [playing, setPlaying] = useState<boolean>(false)
  const [audioBuffer, setAudioBuffer] = useState<AudioBuffer>()
  const [module, setModule] = useState<SoundStretchModule>()
  const [playbackSettings, setPlaybackSettings] = useState<PlaybackSettings>({
    volume,
    pitch,
    tempo
  })
  const debouncePlaybackSettings = useMemo(() => debounce((s) => setPlaybackSettings(s), DEBOUNCE_DELAY), [])

  useEffect(() => {
    createModule().then((m: SoundStretchModule) => setModule(m))
  }, [])

  useEffect(() => {
    debouncePlaybackSettings({
      volume,
      pitch,
      tempo
    })
  }, [volume, pitch, tempo])

  useEffect(() => {
    if (module && audioBuffer && playing) {
      let abort = false
      let audioBufferSourceNode: RubberBandSourceNode | RubberBandRealtimeNode
      (async () => {
        let buffer = audioBuffer
        if (playbackSettings.volume !== 1) {
          console.info('Changing volume of track')
          const input = new SharedAudioBuffer(module, buffer)
          input.write()
          const test = new module.Test(buffer.length, buffer.numberOfChannels)
          test.write(input.pointer, input.length)
          test.modify(playbackSettings.volume)
          test.read(input.pointer, input.length)
          buffer = input.read()
          input.close()
        }

        if (abort) return
        audioBufferSourceNode = method === 'realtime'
          ? await createRubberBandRealtimeNode(audioContext, './rubberband-realtime-processor.js')
          : await createRubberBandSourceNode(audioContext, './rubberband-source-processor.js')
        audioBufferSourceNode.connect(audioContext.destination)
        audioBufferSourceNode.setPitch(pitch)
        audioBufferSourceNode.setTempo(tempo)
        audioBufferSourceNode.setBuffer(buffer)
        audioBufferSourceNode.start()
        console.log('Started')
      })()
      return () => {
        abort = true
        if (audioBufferSourceNode) {
          audioBufferSourceNode.stop()
          audioBufferSourceNode.close()
          console.log('Stopped')
        }
      }
    }
  }, [module, audioBuffer, playing, audioContext, playbackSettings, method])

  useEffect(() => {
    // Load file
    fetch(url)
      .then(result => result.arrayBuffer())
      .then(arrayBuffer => audioContext.decodeAudioData(arrayBuffer))
      .then(audioBuffer => setAudioBuffer(audioBuffer))
  }, [])


  return {
    method,
    setMethod,
    playing,
    volume,
    pitch,
    tempo,
    setPitch,
    setTempo,
    setVolume,
    setPlaying
  }
}
export { usePlayer }