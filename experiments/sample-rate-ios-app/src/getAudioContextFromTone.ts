import * as Tone from 'tone'
import { BaseContext } from 'tone'

const getAudioContextFromToneBaseContext = (baseContext: BaseContext): AudioContext => {
  return (baseContext.rawContext as unknown as any)['_nativeAudioContext'] as AudioContext
}

const getAudioContextFromTone = (): AudioContext => {
  return getAudioContextFromToneBaseContext(Tone.getContext())
}

export { getAudioContextFromToneBaseContext }
export default getAudioContextFromTone