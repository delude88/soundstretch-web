import { createNode, RubberBandRealtimeNode } from './RubberBandRealtimeNode'

async function createRubberBandNode(
  context: BaseAudioContext,
  url: string,
  options?: AudioWorkletNodeOptions
): Promise<RubberBandRealtimeNode> {
  // ensure audioWorklet has been loaded
  try {
    return createNode(context,  options) as any
  } catch (err) {
    await context.audioWorklet.addModule(url)
    return createNode(context, options) as any
  }
}

export { createRubberBandNode }