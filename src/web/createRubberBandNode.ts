import { RubberBandRealtimeNode } from './RubberBandRealtimeNode'
import { convertToAudioBufferSourceNode } from './util/convertToAudioBufferSourceNode'


const createNode = (context: BaseAudioContext, options?: AudioWorkletNodeOptions): RubberBandRealtimeNode => {
  const workletNode = new AudioWorkletNode(context, 'rubberband-realtime-processor', {
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