import { Beat } from './Beat'

interface BPMCounterNode extends AudioWorkletNode {
  getBpm(): Promise<number>;

  getBeats(limit: number): Promise<Beat[]>;
}

const enhanceAudioWorklet = (audioWorkletNode: AudioWorkletNode): BPMCounterNode => {
  const node = audioWorkletNode as any
  node.getBpm = (): Promise<number> => new Promise<number>(
    (resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Timed out'))
      }, 2000)
      const onMessage = ({ data }: MessageEvent) => {
        if (typeof data === 'object' && data['event']) {
          const { event } = data
          if (event === 'error') {
            node.port.removeEventListener('message', onMessage)
            clearTimeout(timeout)
            return reject(new Error(data.error))
          } else if (event === 'bpm') {
            node.port.removeEventListener('message', onMessage)
            clearTimeout(timeout)
            return resolve(data.bpm)
          }
          return  // might be intercepting
        }
        node.port.removeEventListener('message', onMessage)
        clearTimeout(timeout)
        reject(new Error(`Unknown data delivered by node: ${data}`))
      }
      node.port.addEventListener('message', onMessage)
      node.port.postMessage({ event: 'bpm' })
    }
  )

  node.getBeats = (limit: number): Promise<Beat[]> => new Promise<Beat[]>(
    (resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Timed out'))
      }, 2000)
      const onMessage = ({ data }: MessageEvent) => {
        if (typeof data === 'object' && data['event']) {
          const { event } = data
          if (event === 'error') {
            node.port.removeEventListener('message', onMessage)
            clearTimeout(timeout)
            return reject(new Error(data.error))
          } else if (event === 'beats') {
            node.port.removeEventListener('message', onMessage)
            clearTimeout(timeout)
            return resolve(data.beats)
          }
          return  // might be intercepting
        }
        node.port.removeEventListener('message', onMessage)
        clearTimeout(timeout)
        reject(new Error(`Unknown data delivered by node: ${data}`))
      }
      node.port.addEventListener('message', onMessage)
      node.port.postMessage({ event: 'beats', limit: limit })
    }
  )
  return node as BPMCounterNode
}

export { BPMCounterNode, enhanceAudioWorklet }