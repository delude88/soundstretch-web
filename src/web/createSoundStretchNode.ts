import { SoundStretchNode } from './SoundStretchNode'
import { convertToAudioBufferSourceNode } from './util/convertToAudioBufferSourceNode'

const createNode = (context: BaseAudioContext, options?: AudioWorkletNodeOptions): SoundStretchNode => {
  return convertToAudioBufferSourceNode(new AudioWorkletNode(context, 'soundstretch-processor', {
    numberOfOutputs: 1,
    outputChannelCount: [2],
    ...options,
  })) as SoundStretchNode
}

async function createSoundStretchNode(
  context: BaseAudioContext,
  url: string,
  options?: AudioWorkletNodeOptions
): Promise<SoundStretchNode> {
  // ensure audioWorklet has been loaded
  try {
    return createNode(context, options)
  } catch (err) {
    await context.audioWorklet.addModule(url)
    return createNode(context, options)
  }
}

export { createSoundStretchNode }