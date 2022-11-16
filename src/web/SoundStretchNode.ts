export interface SoundStretchNode extends AudioWorkletNode {
  setPitch(pitch: number): void;

  setTempo(tempo: number): void;

  setTempo(tempo: number): void;

  setHighQuality(enabled: boolean): void;

  close(): void;
}

const createNode = (context: BaseAudioContext, options?: AudioWorkletNodeOptions): SoundStretchNode => {
  const workletNode = new AudioWorkletNode(context, 'rubberband-realtime-processor', options)
  const node = workletNode as any
  node.setPitch = (pitch: number) => {
    node.port.postMessage(JSON.stringify(["pitch", pitch]));
  }
  node.setTempo = (pitch: number) => {
    node.port.postMessage(JSON.stringify(["tempo", pitch]));
  }
  node.setHighQuality = (pitch: number) => {
    node.port.postMessage(JSON.stringify(["quality", pitch]));
  }
  node.close = () => {
    node.port.postMessage(JSON.stringify(["close"]));
  }
  return node as SoundStretchNode
}


export { createNode }