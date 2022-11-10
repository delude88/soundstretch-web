import { RubberBandSourceNode } from './RubberBandSourceNode'

function cloneArrayBuffer(src: ArrayBuffer): ArrayBuffer  {
  const dst = new ArrayBuffer(src.byteLength);
  new Uint8Array(dst).set(new Uint8Array(src));
  return dst;
}

function createWorkletAsRubberNode(context: BaseAudioContext, options?: AudioWorkletNodeOptions): RubberBandSourceNode {
  const node = new AudioWorkletNode(context, 'rubberband-source-processor', options) as any
  node.setBuffer = (buffer: AudioBuffer) => {
    const channels: ArrayBuffer[] = []
    for (let channel = 0; channel < buffer.numberOfChannels; channel++) {
      const source = cloneArrayBuffer(buffer.getChannelData(channel).buffer)
      channels.push(source)
    }
    node.port.postMessage({
        event: 'buffer',
        length: buffer.length,
        sampleRate: buffer.sampleRate,
        numberOfChannels: buffer.numberOfChannels,
        channels: channels
      },
      channels
    )
  }
  node.start = () => {
    node.port.postMessage({ event: 'start' })
  }
  node.stop = () => {
    node.port.postMessage({ event: 'stop' })
  }
  node.setPitch = (pitch: number) => {
    node.port.postMessage({ event: 'pitch', pitch: pitch })
  }
  node.setTempo = (tempo: number) => {
    node.port.postMessage({ event: 'tempo', pitch: tempo })
  }
  node.setHighQuality = (enabled: boolean) => {
    node.port.postMessage({ event: 'quality', quality: enabled })
  }
  node.close = () => {
    node.port.postMessage({ event: 'close' })
  }
  return node as RubberBandSourceNode
}

async function createRubberBandSourceNode(
  context: BaseAudioContext,
  url: string,
  options?: AudioWorkletNodeOptions
): Promise<RubberBandSourceNode> {
  // ensure audioWorklet has been loaded
  try {
    return createWorkletAsRubberNode(context, options)
  } catch (err) {
    await context.audioWorklet.addModule(url)
    return createWorkletAsRubberNode(context, options)
  }
}

export { createRubberBandSourceNode }