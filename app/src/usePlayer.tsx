import { useEffect, useMemo, useState } from 'react'
// @ts-ignore
import * as createModule from 'soundstretch-web/wasm/rubberband'
import {
  RubberBandModule,
  createRubberBandNode,
  createRubberBandNodeForTone,
  createSoundStretchNode,
  RubberBandRealtimeNode,
  BPMCounterNode,
  createBPMCounterNode,
  createBPMCounterNodeForTone,
  createSoundStretchNodeForTone
} from 'soundstretch-web'
import debounce from 'lodash/debounce'
import * as Tone from 'tone'

const DEBOUNCE_DELAY = 500
const BPM_ENABLED = false

interface PlaybackSettings {
  pitch: number,
  timeRatio: number
}

const RUBBERBAND_REALTIME_PROCESSOR_URL = `${process.env.PUBLIC_URL}/rubberband-realtime-processor.js`
const SOUNDSTRETCH_PROCESSOR_URL = `${process.env.PUBLIC_URL}/soundstretch-processor.js`
const BPM_COUNT_PROCESSOR_URL = `${process.env.PUBLIC_URL}/bpm-count-processor.js`

export type Engine = 'webaudio' | 'tonejs'
export type Method = 'original' | 'realtime' | 'soundtouch'

const usePlayer = (audioContext: AudioContext, audioBuffer?: AudioBuffer) => {
  const [engine, setEngine] = useState<Engine>('webaudio')
  const [method, setMethod] = useState<Method>('realtime')
  const [bpm, setBpm] = useState<number>()
  const [pitch, setPitch] = useState<number>(0)
  const [tempo, setTempo] = useState<number>(1)
  const [preserved, setPreserved] = useState<boolean>(false)
  const [playing, setPlaying] = useState<boolean>(false)
  const [sourceNode, setSourceNode] = useState<AudioBufferSourceNode>()
  const [counterNode, setCounterNode] = useState<BPMCounterNode>()
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
    if (BPM_ENABLED && sourceNode) {
      if (engine === 'tonejs') {
        createBPMCounterNodeForTone(BPM_COUNT_PROCESSOR_URL)
          .then(node => {
            setCounterNode(node)
          })
      } else if (audioContext) {
        createBPMCounterNode(audioContext, BPM_COUNT_PROCESSOR_URL)
          .then(node => {
            setCounterNode(node)
          })
      }
      return () => {
        setCounterNode(undefined)
      }
    }
  }, [engine, audioContext, sourceNode])

  useEffect(() => {
    if (sourceNode && counterNode) {
      if (engine === 'tonejs') {
        Tone.connect(sourceNode, counterNode)
        return () => {
          Tone.disconnect(sourceNode, counterNode)
        }
      } else {
        sourceNode.connect(counterNode)
        return () => {
          sourceNode.disconnect(counterNode)
        }
      }
    }
  }, [sourceNode, counterNode, engine])

  useEffect(() => {
    if (counterNode && playing) {
      const interval = setInterval(() => {
        counterNode.getBpm()
          .then(value => setBpm(value))
      }, 1000)
      return () => {
        clearInterval(interval)
      }
    }
  })

  useEffect(() => {
    debouncePlaybackSettings({
      pitch: pitch,
      timeRatio: tempo
    })
  }, [pitch, tempo, debouncePlaybackSettings])

  useEffect(() => {
    // CREATE AUDIO SOURCE NODE
    if (module && audioBuffer) {
      console.info("usePlayer: init audio")
      let audioBufferSourceNode: AudioBufferSourceNode | undefined
      (async () => {
        if (engine === 'tonejs') {
          await Tone.start()
          // The tone.js way
          if (method === 'realtime') {
            audioBufferSourceNode = await createRubberBandNodeForTone(RUBBERBAND_REALTIME_PROCESSOR_URL)
          } else if (method === 'soundtouch') {
            audioBufferSourceNode = await createSoundStretchNodeForTone(SOUNDSTRETCH_PROCESSOR_URL)
          } else {
            // NOT SUPPORTED
            //audioBufferSourceNode = Tone.context.createBufferSource()
            audioBufferSourceNode = undefined
          }
          if (audioBufferSourceNode) {
            Tone.connect(audioBufferSourceNode, Tone.getDestination())
          }
        } else if (audioContext) {
          // The Web Audio API way
          if (method === 'realtime') {
            audioBufferSourceNode = await createRubberBandNode(audioContext, RUBBERBAND_REALTIME_PROCESSOR_URL)
          } else if (method === 'soundtouch') {
            audioBufferSourceNode = await createSoundStretchNode(audioContext, SOUNDSTRETCH_PROCESSOR_URL)
          } else {
            audioBufferSourceNode = new AudioBufferSourceNode(audioContext)
          }
          audioBufferSourceNode?.connect(audioContext.destination)
        }
        if (audioBufferSourceNode) {
          audioBufferSourceNode.buffer = audioBuffer
          /*audioBufferSourceNode.loopStart = 2
          audioBufferSourceNode.loopEnd = 4
          audioBufferSourceNode.loop = true*/
        }
        setSourceNode(audioBufferSourceNode)
      })()
        .catch(err => console.error(err))
      return () => {
        if (engine === 'tonejs') {
          if (audioBufferSourceNode) {
            Tone.disconnect(audioBufferSourceNode, Tone.getDestination())
          }
        } else {
          audioBufferSourceNode?.disconnect(audioContext.destination)
        }
        setSourceNode(undefined)
      }
    }
  }, [module, audioBuffer, playing, audioContext, method, engine])

  useEffect(() => {
    if (sourceNode && playing) {
      const node = sourceNode
      node.loop = true
      node.loopStart = 9
      node.loopEnd = 12
      node.start(0, 8)
      return () => {
        node.stop()
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

  useEffect(() => {
    if (sourceNode && method === 'realtime') {
      if ((sourceNode as any).preserveFormantShave) {
        const func = (sourceNode as RubberBandRealtimeNode).preserveFormantShave
        func(preserved)
      }
    }
  }, [sourceNode, method, preserved])

  return {
    ready,
    method,
    setMethod,
    preserved,
    setPreserved,
    playing,
    pitch,
    tempo,
    setPitch,
    setTempo,
    setPlaying,
    bpm,
    engine,
    setEngine
  }
}
export { usePlayer }