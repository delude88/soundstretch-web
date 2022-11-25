import { convertToBufferSourceNode } from './util/convertToBufferSourceNode'
import * as Tone from 'tone'

export interface SoundStretchNode extends AudioBufferSourceNode {
  close(): void;
}

const createNode = (context: BaseAudioContext, options?: AudioWorkletNodeOptions): SoundStretchNode => {
  return convertToBufferSourceNode(new AudioWorkletNode(context, 'soundstretch-processor', options)) as SoundStretchNode
}

const createToneNode = (): SoundStretchNode => {
  const workletNode = Tone.context.createAudioWorkletNode('soundstretch-processor')
  const node = convertToBufferSourceNode(workletNode) as any
  node.preserveFormantShave = (enabled: boolean) => {
    workletNode.port.postMessage({ event: 'preserve', preserve: enabled })
  }
  return node as SoundStretchNode
}

export { createNode, createToneNode }