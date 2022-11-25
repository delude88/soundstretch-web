import { BPMCounterNode, enhanceAudioWorklet } from './BPMCounterNode'
import * as Tone from 'tone'

const createToneNode = (): BPMCounterNode => {
  const node = Tone.context.createAudioWorkletNode('bpm-count-processor')
  return enhanceAudioWorklet(node)
}

async function createBPMCounterNodeForTone(
  url: string
): Promise<BPMCounterNode> {
  try {
    return createToneNode()
  } catch (err) {
    await Tone.context.addAudioWorkletModule(url, 'bpm-count-processor')
    return createToneNode()
  }
}

export { createBPMCounterNodeForTone }