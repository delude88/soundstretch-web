import { RubberBandRealtimeNode } from './RubberBandRealtimeNode'
import { convertToAudioBufferSourceNode } from './util/convertToAudioBufferSourceNode'
import * as Tone from 'tone'

const createToneNode = (options?: AudioWorkletNodeOptions): RubberBandRealtimeNode => {
  const workletNode = Tone.context.createAudioWorkletNode('rubberband-realtime-processor', {
    numberOfOutputs: 1,
    outputChannelCount: [2],
    ...options,
  })
  const node = convertToAudioBufferSourceNode(workletNode) as any
  node.preserveFormantShave = (enabled: boolean) => {
    workletNode.port.postMessage({ event: 'preserve', preserve: enabled })
  }
  node.printStatistic = (enabled: boolean) => {
    workletNode.port.postMessage({ event: 'stats', stats: enabled })
  }
  return node as RubberBandRealtimeNode
}

const createRubberBandNodeForTone = async (
  url: string,
  options?: AudioWorkletNodeOptions
): Promise<RubberBandRealtimeNode> => {
  try {
    return createToneNode(options)
  } catch (err) {
    await Tone.context.addAudioWorkletModule(url, 'rubberband-realtime-processor')
    return createToneNode(options)
  }
}

export { createRubberBandNodeForTone }