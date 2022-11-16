import { useEffect, useMemo, useState } from 'react'
// @ts-ignore
import * as createModule from 'soundstretch-web/wasm/rubberband'
import { RubberBandModule, createRubberBandRealtimeNode, createSoundStretchNode } from 'soundstretch-web'
import debounce from 'lodash/debounce'

const DEBOUNCE_DELAY = 500
const USE_FETCH = true

interface PlaybackSettings {
  pitch: number,
  timeRatio: number
}

export type Method = 'original' | 'realtime' | 'soundtouch'

const usePlayer = (audioContext: AudioContext, audioBuffer?: AudioBuffer) => {
  const [method, setMethod] = useState<Method>('soundtouch')
  const [pitch, setPitch] = useState<number>(0)
  const [tempo, setTempo] = useState<number>(1)
  const [playing, setPlaying] = useState<boolean>(false)
  const [sourceNode, setSourceNode] = useState<AudioBufferSourceNode>()
  const [module, setModule] = useState<RubberBandModule>()
  const [playbackSettings, setPlaybackSettings] = useState<PlaybackSettings>({
    pitch: 1,
    timeRatio: 1
  })
  const debouncePlaybackSettings = useMemo(() => debounce((s) => setPlaybackSettings(s), DEBOUNCE_DELAY), [])
  const ready = useMemo<boolean>(() => !!audioBuffer, [audioBuffer])

  useEffect(() => {
    createModule().then((m: RubberBandModule) => setModule(m))
  }, [])

  useEffect(() => {
    debouncePlaybackSettings({
      pitch: pitch,
      timeRatio: tempo
    })
  }, [pitch, tempo, debouncePlaybackSettings])

  useEffect(() => {
    // CREATE AUDIO SOURCE NODE
    if (module && audioBuffer) {
      let audioBufferSourceNode: AudioBufferSourceNode | undefined
      (async () => {
        if (method === 'original') {
          audioBufferSourceNode = new AudioBufferSourceNode(audioContext)
          audioBufferSourceNode.loopStart = 20
          audioBufferSourceNode.loopEnd = 25
          console.log(audioBufferSourceNode.detune)
          console.log(audioBufferSourceNode.playbackRate)
        } else if (method === 'realtime') {
          audioBufferSourceNode = await createRubberBandRealtimeNode(audioContext, `${process.env.PUBLIC_URL}/rubberband-realtime-processor.js`)
        } else if (method === 'soundtouch') {
          audioBufferSourceNode = await createSoundStretchNode(audioContext, `${process.env.PUBLIC_URL}/soundstretch-processor.js`)
        }
        if (audioBufferSourceNode) {
          audioBufferSourceNode.connect(audioContext.destination)
          audioBufferSourceNode.buffer = audioBuffer
          setSourceNode(audioBufferSourceNode)
        }
      })()
      return () => {
        if (audioBufferSourceNode) {
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
      sourceNode.playbackRate.setValueAtTime(playbackSettings.timeRatio, 0)
    }
  }, [sourceNode, playbackSettings.timeRatio])

  useEffect(() => {
    if (sourceNode) {
      sourceNode.detune.setValueAtTime(playbackSettings.pitch * 100, 0)
    }
  }, [sourceNode, playbackSettings.pitch])

  return {
    ready,
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