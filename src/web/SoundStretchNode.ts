import { convertToBufferSourceNode } from './util/convertToBufferSourceNode'

export interface SoundStretchNode extends AudioBufferSourceNode {
  close(): void;
}

const createNode = (context: BaseAudioContext, options?: AudioWorkletNodeOptions): SoundStretchNode => {
  return convertToBufferSourceNode(new AudioWorkletNode(context, 'soundstretch-processor', options)) as SoundStretchNode
}


export { createNode }