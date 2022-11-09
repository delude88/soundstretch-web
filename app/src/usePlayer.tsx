import { useEffect, useMemo, useState } from 'react'
// @ts-ignore
import * as createModule from 'soundstretch-web/wasm'
import { SoundStretchModule } from 'soundstretch-web'
import { SharedAudioBuffer } from './SharedAudioBuffer'
import debounce from 'lodash/debounce'

const DEBOUNCE_DELAY = 500

interface PlaybackSettings {
  volume: number,
  pitch: number,
  tempo: number
}

const usePlayer = (url: string, audioContext: AudioContext) => {
  const [method, setMethod] = useState<'rubberband' | 'soundtouch'>('rubberband')
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
      let audioBufferSourceNode: AudioBufferSourceNode | undefined
      (async () => {
        console.log(module)
        let buffer = audioBuffer
        const input = new SharedAudioBuffer(module, audioBuffer)
        input.write()
        if (playbackSettings.volume !== 1) {
          console.info('Changing volume of track')
          const test = new module.Test(audioBuffer.length, audioBuffer.numberOfChannels)
          test.write(input.pointer, input.length)
          test.modify(playbackSettings.volume)
          test.read(input.pointer, input.length)
        }

        if (playbackSettings.pitch !== 1 || playbackSettings.tempo !== 1) {
          console.info('Changing pitch and/or tempo of track')
          const outputLength = Math.round(buffer.length * tempo)
          console.log(`${buffer.length} * ${tempo} = ${outputLength}`)
          const output = new SharedAudioBuffer(module, new AudioBuffer({
            sampleRate: buffer.sampleRate,
            numberOfChannels: buffer.numberOfChannels,
            length: outputLength
          }))
          if (method === 'rubberband') {
            const rubberBandStretcher = new module.RubberBandStretcher(input.sampleRate, input.sampleCount, input.numberOfChannels, tempo, pitch)
            console.log('Writing')
            rubberBandStretcher.push(input.pointer, input.length)
            console.log('Reading')
            const samplesRead = rubberBandStretcher.pull(output.pointer, output.length)
            console.log('Read ' + samplesRead)
          } else {
            const soundStretch = new module.SoundStretch(input.sampleRate, input.numberOfChannels)
            soundStretch.setTempo(tempo)
            soundStretch.setPitch(pitch)
            console.log('Writing')
            soundStretch.push(input.pointer, input.length)
            console.log('Written')
            console.log('Reading')
            soundStretch.pull(output.pointer, output.length)
            console.log('Read')
          }
          buffer = output.read()
          output.close()
          console.log(buffer.getChannelData(0))
        } else {
          buffer = input.read()
        }

        input.close()
        if (abort) return
        audioBufferSourceNode = new AudioBufferSourceNode(audioContext)
        audioBufferSourceNode.connect(audioContext.destination)
        audioBufferSourceNode.buffer = buffer
        audioBufferSourceNode.start()
        console.log('Playing')
      })()
      return () => {
        abort = true
        if (audioBufferSourceNode) {
          audioBufferSourceNode.stop()
          console.log('Stopped')
        }
      }
    }
  }, [module, audioBuffer, playing, audioContext, playbackSettings])

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