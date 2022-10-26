interface BPMCounterNode extends AudioWorkletNode {
  getBpm(): number;
  close(): void;
}
export {BPMCounterNode}