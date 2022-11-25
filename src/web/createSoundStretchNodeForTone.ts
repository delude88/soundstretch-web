import { SoundStretchNode, createToneNode } from './SoundStretchNode'
import * as Tone from 'tone'

async function createSoundStretchNodeForTone(
  url: string
): Promise<SoundStretchNode> {
  // ensure audioWorklet has been loaded
  try {
    return createToneNode()
  } catch (err) {
    await Tone.context.addAudioWorkletModule(url, 'soundstretch-processor')
    return createToneNode()
  }
}

export { createSoundStretchNodeForTone }