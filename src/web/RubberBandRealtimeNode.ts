import { convertToBufferSourceNode } from './util/convertToBufferSourceNode'
import * as Tone from 'tone'

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

const createToneNode = (): RubberBandRealtimeNode => {
  const workletNode = Tone.context.createAudioWorkletNode('rubberband-realtime-processor')
  const node = convertToBufferSourceNode(workletNode) as any
  node.preserveFormantShave = (enabled: boolean) => {
    workletNode.port.postMessage({ event: 'preserve', preserve: enabled })
  }
  return node as RubberBandRealtimeNode
}

export { createNode, createToneNode }