import { RubberBandRealtimeNode } from './RubberBandRealtimeNode'
import { convertToAudioBufferSourceNode } from './util/convertToAudioBufferSourceNode'
import * as Tone from 'tone'

const createToneNode = (): RubberBandRealtimeNode => {
  const workletNode = Tone.context.createAudioWorkletNode('rubberband-realtime-processor')
  const node = convertToAudioBufferSourceNode(workletNode) as any
  node.preserveFormantShave = (enabled: boolean) => {
    workletNode.port.postMessage({ event: 'preserve', preserve: enabled })
  }
  return node as RubberBandRealtimeNode
}

const createRubberBandNodeForTone = async (
  url: string
): Promise<RubberBandRealtimeNode> => {
  try {
    return createToneNode()
  } catch (err) {
    await Tone.context.addAudioWorkletModule(url, 'rubberband-realtime-processor')
    return createToneNode()
  }
}

export { createRubberBandNodeForTone }