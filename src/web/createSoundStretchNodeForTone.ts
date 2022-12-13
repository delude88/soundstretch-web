import { SoundStretchNode } from './SoundStretchNode'
import * as Tone from 'tone'
import { convertToAudioBufferSourceNode } from './util/convertToAudioBufferSourceNode'

const createToneNode = (options?: AudioWorkletNodeOptions): SoundStretchNode => {
  const workletNode = Tone.context.createAudioWorkletNode('soundstretch-processor', {
    numberOfOutputs: 1,
    outputChannelCount: [2],
    ...options,
  })
  const node = convertToAudioBufferSourceNode(workletNode) as any
  node.preserveFormantShave = (enabled: boolean) => {
    workletNode.port.postMessage({ event: 'preserve', preserve: enabled })
  }
  return node as SoundStretchNode
}

async function createSoundStretchNodeForTone(
  url: string,
  options?: AudioWorkletNodeOptions
): Promise<SoundStretchNode> {
  // ensure audioWorklet has been loaded
  try {
    return createToneNode(options)
  } catch (err) {
    await Tone.context.addAudioWorkletModule(url, 'soundstretch-processor')
    return createToneNode(options)
  }
}

export { createSoundStretchNodeForTone }