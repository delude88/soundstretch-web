import { SoundStretchWorker } from './SoundStretchWorker'

const createSoundStretchWorker = (url: string): SoundStretchWorker => {
  const worker = new Worker(url) as any
  worker.stretch = (audioBuffer: AudioBuffer, pitch: number, tempo: number): Promise<AudioBuffer> => {
    return new Promise<AudioBuffer>((resolve, reject) => {
      // subscribe and transfer
      const onMessage = ({ data }: MessageEvent) => {
        worker.port.removeEventListener('message', onMessage)
        const [event, payload] = JSON.parse(data)
        if (event === 'stretched') {
          const stretchedBuffer = payload as AudioBuffer
          resolve(stretchedBuffer)
        } else if (event === 'error') {
          reject(new Error(payload))
        } else {
          reject(new Error(`Unexpected event ${event}`))
        }
      }
      worker.port.addEventListener('message', onMessage)
      const channels: Float32Array[] = []
      for(let channel = 0; channel < audioBuffer.numberOfChannels; channel++) {
        channels.push(audioBuffer.getChannelData(channel))
      }
      worker.port.postMessage(JSON.stringify(['stretch', {
        pitch: pitch,
        tempo: tempo,
        channels: channels
      }]))
    })
  }
  return worker as SoundStretchWorker
}

export { createSoundStretchWorker }