import { BPMCounterNode, enhanceAudioWorklet } from './BPMCounterNode'

function createWorklet(context: BaseAudioContext, options?: AudioWorkletNodeOptions): BPMCounterNode {
  const node = new AudioWorkletNode(context, 'bpm-count-processor', options) as any
  return enhanceAudioWorklet(node)
}

async function createBPMCounterNode(
  context: BaseAudioContext,
  url: string,
  options?: AudioWorkletNodeOptions
): Promise<BPMCounterNode> {
  // ensure audioWorklet has been loaded
  try {
    return createWorklet(context, options)
  } catch (err) {
    await context.audioWorklet.addModule(url)
    return createWorklet(context, options)
  }
}

export { createBPMCounterNode }