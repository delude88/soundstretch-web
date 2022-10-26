import { BPMCounterNode } from './BPMCounterNode'

function createWorklet(context: BaseAudioContext, options?: AudioWorkletNodeOptions): BPMCounterNode {
  const node = new AudioWorkletNode(context, 'bpm-count-processor', options) as any
  node.getBpm = (): Promise<number> => new Promise<number>(
    (resolve, reject) => {
      const onMessage = (message: MessageEvent) => {
        node.port.removeEventListener('message', onMessage)
        const [event, payload] = JSON.parse(message.data)
        if (event === 'error') {
          reject(new Error(payload))
        } else if (event === 'bpm') {
          resolve(payload)
        } else {
          reject(new Error(`Unknown event ${event}`))
        }
      }
      node.port.addEventListener('message', onMessage)
      node.port.postMessage('bpm')
    }
  )
  node.close = () => {
    node.port.postMessage('close')
  }
  return node as BPMCounterNode
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