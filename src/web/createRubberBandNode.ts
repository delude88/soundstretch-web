import { RubberBandRealtimeNode } from './RubberBandRealtimeNode'
import { convertToAudioBufferSourceNode } from './util/convertToAudioBufferSourceNode'

const createNode = (context: BaseAudioContext, options?: AudioWorkletNodeOptions): RubberBandRealtimeNode => {
  const workletNode = new AudioWorkletNode(context, 'rubberband-realtime-processor', {
    ...options
  })

  workletNode.parameters

  const node = convertToAudioBufferSourceNode(workletNode) as any
  node.preserveFormantShave = (enabled: boolean) => {
    workletNode.port.postMessage({ event: 'preserve', preserve: enabled })
  }
  return node as RubberBandRealtimeNode
}

async function createRubberBandNode(
  context: BaseAudioContext,
  url: string,
  options?: AudioWorkletNodeOptions
): Promise<RubberBandRealtimeNode> {
  // ensure audioWorklet has been loaded
  try {
    return createNode(context, options) as any
  } catch (err) {
    await context.audioWorklet.addModule(url)
    return createNode(context, options) as any
  }
}

export { createRubberBandNode }