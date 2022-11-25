import { SoundStretchNode } from './SoundStretchNode'
import * as Tone from 'tone'
import { convertToAudioBufferSourceNode } from './util/convertToAudioBufferSourceNode'

const createToneNode = (): SoundStretchNode => {
  const workletNode = Tone.context.createAudioWorkletNode('soundstretch-processor')
  const node = convertToAudioBufferSourceNode(workletNode) as any
  node.preserveFormantShave = (enabled: boolean) => {
    workletNode.port.postMessage({ event: 'preserve', preserve: enabled })
  }
  return node as SoundStretchNode
}

async function createSoundStretchNodeForTone(
  url: string
): Promise<SoundStretchNode> {
  // ensure audioWorklet has been loaded
  try {
    return createToneNode()
  } catch (err) {
    await Tone.context.addAudioWorkletModule(url, 'soundstretch-processor')
    return createToneNode()
  }
}

export { createSoundStretchNodeForTone }