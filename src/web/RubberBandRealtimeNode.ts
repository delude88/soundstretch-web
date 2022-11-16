import { convertToBufferSourceNode } from './util/convertToBufferSourceNode'

export interface RubberBandRealtimeNode extends AudioBufferSourceNode {
  preserveFormantShave(enabled: boolean): void
  close(): void
}

const createNode = (context: BaseAudioContext, options?: AudioWorkletNodeOptions): RubberBandRealtimeNode => {
  const workletNode = new AudioWorkletNode(context, 'rubberband-realtime-processor', options)
  const node = convertToBufferSourceNode(workletNode) as any
  node.preserveFormantShave = (enabled: boolean) => {
    workletNode.port.postMessage({ event: 'preserve', preserve: enabled })
  }
  return node as RubberBandRealtimeNode
}

export { createNode }