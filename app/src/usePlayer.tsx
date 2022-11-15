import { useEffect, useMemo, useState } from 'react'
// @ts-ignore
import * as createModule from 'soundstretch-web/wasm/rubberband'
import { SoundStretchModule } from 'soundstretch-web'
import debounce from 'lodash/debounce'
import {
  createRubberBandSourceNode,
  createRubberBandRealtimeNode,
  RubberBandSourceNode,
  RubberBandRealtimeNode
} from 'soundstretch-web'

const DEBOUNCE_DELAY = 500

interface PlaybackSettings {
  pitch: number,
  timeRatio: number
}

const usePlayer = (url: string, audioContext: AudioContext) => {
  const [method, setMethod] = useState<'offline' | 'realtime' | 'soundtouch'>('realtime')
  const [pitch, setPitch] = useState<number>(0)
  const [tempo, setTempo] = useState<number>(1)
  const [playing, setPlaying] = useState<boolean>(false)
  const [audioBuffer, setAudioBuffer] = useState<AudioBuffer>()
  const [sourceNode, setSourceNode] = useState<RubberBandSourceNode | RubberBandRealtimeNode>()
  const [module, setModule] = useState<SoundStretchModule>()
  const [playbackSettings, setPlaybackSettings] = useState<PlaybackSettings>({
    pitch: 1,
    timeRatio: 1
  })
  const debouncePlaybackSettings = useMemo(() => debounce((s) => setPlaybackSettings(s), DEBOUNCE_DELAY), [])

  useEffect(() => {
    createModule().then((m: SoundStretchModule) => setModule(m))
  }, [])

  useEffect(() => {
    debouncePlaybackSettings({
      pitch: pitch ? Math.pow(2.0, pitch / 12.0) : 1,
      timeRatio: (100 / tempo) / 100
    })
  }, [pitch, tempo, debouncePlaybackSettings])

  useEffect(() => {
    // CREATE AUDIO SOURCE NODE
    if (module && audioBuffer) {
      let audioBufferSourceNode: RubberBandSourceNode | RubberBandRealtimeNode
      (async () => {
        audioBufferSourceNode = method === 'realtime'
          ? await createRubberBandRealtimeNode(audioContext, './rubberband-realtime-processor.js')
          : await createRubberBandSourceNode(audioContext, './rubberband-source-processor.js')
        audioBufferSourceNode.connect(audioContext.destination)
        audioBufferSourceNode.setBuffer(audioBuffer)
        console.log('Started')
        setSourceNode(audioBufferSourceNode)
      })()
      return () => {
        if (audioBufferSourceNode) {
          audioBufferSourceNode.stop()
          audioBufferSourceNode.close()
          console.log('Stopped')
          setSourceNode(undefined)
        }
      }
    }
  }, [module, audioBuffer, playing, audioContext, method])

  useEffect(() => {
    if (sourceNode) {
      if (playing) {
        const node = sourceNode
        node.start()
        return () => {
          node.stop()
        }
      }
    }
  }, [sourceNode, playing])

  useEffect(() => {
    if (sourceNode) {
      sourceNode.setTempo(playbackSettings.timeRatio)
    }
  }, [sourceNode, playbackSettings.timeRatio])

  useEffect(() => {
    if (sourceNode) {
      sourceNode.setPitch(playbackSettings.pitch)
    }
  }, [sourceNode, playbackSettings.pitch])

  useEffect(() => {
    // Load file
    if(audioContext) {
      fetch(url)
        .then(result => result.arrayBuffer())
        .then(arrayBuffer => audioContext.decodeAudioData(arrayBuffer))
        .then(audioBuffer => setAudioBuffer(audioBuffer))
    }
  }, [audioContext, url])


  return {
    method,
    setMethod,
    playing,
    pitch,
    tempo,
    setPitch,
    setTempo,
    setPlaying
  }
}
export { usePlayer }