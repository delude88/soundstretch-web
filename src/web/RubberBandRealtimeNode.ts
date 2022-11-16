import { convertToBufferSourceNode } from './util/convertToBufferSourceNode'

export interface RubberBandRealtimeNode extends AudioBufferSourceNode {
  close(): void
}

const createNode = (context: BaseAudioContext, options?: AudioWorkletNodeOptions): RubberBandRealtimeNode => {
  return convertToBufferSourceNode(new AudioWorkletNode(context, 'rubberband-realtime-processor', options)) as RubberBandRealtimeNode
}

export { createNode }