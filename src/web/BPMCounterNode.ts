import { Beat } from './Beat'

interface BPMCounterNode extends AudioWorkletNode {
  getBpm(): Promise<number>;

  getBeats(limit: number): Promise<Beat[]>;
}

const enhanceAudioWorklet = (audioWorkletNode: AudioWorkletNode): BPMCounterNode => {
  const node = audioWorkletNode as BPMCounterNode

  audioWorkletNode.port.onmessage = ({ data }) => {
    if (typeof data === 'object' && data['event']) {
      const { event } = data
      if (event === 'error') {
        audioWorkletNode.dispatchEvent(new ErrorEvent(data.error))
      } else if (event === 'bpm') {
        console.log('Got bpm', data.bpm)
        audioWorkletNode.dispatchEvent(new CustomEvent('bpm', {
          detail: parseInt(data.bpm)
        }))
      } else if (event === 'beats') {
        console.log('Got beats', data.beats)
        audioWorkletNode.dispatchEvent(new CustomEvent('beats', {
          detail: parseInt(data.beats)
        }))
      }
    }
  }
  node.getBpm = (): Promise<number> => new Promise<number>(
    (resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Timed out'))
      }, 2000)
      const onBpm = (ev: Event) => {
        clearTimeout(timeout)
        audioWorkletNode.removeEventListener('bpm', onBpm)
        const bpm = (ev as CustomEvent).detail as number
        console.log('GOT BPM', bpm)
        return resolve(bpm)
      }
      audioWorkletNode.addEventListener('bpm', onBpm)
      audioWorkletNode.port.postMessage({event: 'bpm'})
    })

  node.getBeats = (limit: number): Promise<Beat[]> => new Promise<Beat[]>(
    (resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Timed out'))
      }, 2000)
      const onBpm = (ev: Event) => {
        clearTimeout(timeout)
        audioWorkletNode.removeEventListener('beats', onBpm)
        const beats = (ev as CustomEvent).detail as Beat[]
        console.log('GOT BEATS', beats)
        return resolve(beats)
      }
      audioWorkletNode.addEventListener('beats', onBpm)
      audioWorkletNode.port.postMessage({event: 'beats', limit: limit})
    }
  )
  return node
}

export { BPMCounterNode, enhanceAudioWorklet }