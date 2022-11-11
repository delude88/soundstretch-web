import { RubberBandRealtimeNode } from './RubberBandRealtimeNode'

function cloneArrayBuffer(src: ArrayBuffer): ArrayBuffer  {
  const dst = new ArrayBuffer(src.byteLength);
  new Uint8Array(dst).set(new Uint8Array(src));
  return dst;
}

function createWorkletAsRubberNode(context: BaseAudioContext, options?: AudioWorkletNodeOptions): RubberBandRealtimeNode {
  const node = new AudioWorkletNode(context, 'rubberband-realtime-processor', options) as any
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
    console.info("START?!?")
    node.port.postMessage({ event: 'start' })
  }
  node.stop = () => {
    console.info("STOP?!?")
    node.port.postMessage({ event: 'stop' })
  }
  node.setPitch = (pitch: number) => {
    node.port.postMessage({ event: 'pitch', pitch: pitch })
  }
  node.setTempo = (tempo: number) => {
    node.port.postMessage({ event: 'tempo', tempo: tempo })
  }
  node.close = () => {
    node.port.postMessage({ event: 'close' })
  }
  return node as RubberBandRealtimeNode
}

async function createRubberBandRealtimeNode(
  context: BaseAudioContext,
  url: string,
  options?: AudioWorkletNodeOptions
): Promise<RubberBandRealtimeNode> {
  // ensure audioWorklet has been loaded
  try {
    return createWorkletAsRubberNode(context, options)
  } catch (err) {
    await context.audioWorklet.addModule(url)
    return createWorkletAsRubberNode(context, options)
  }
}

export { createRubberBandRealtimeNode }