import * as Tone from 'tone'

import { createToneNode, RubberBandRealtimeNode } from './RubberBandRealtimeNode'

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