import { useCallback, useEffect, useState } from 'react'
// @ts-ignore
import * as createModule from 'soundstretch-web/wasm/soundtouch'
import { SoundStretchModule } from 'soundstretch-web'
import { Float32ChannelTransport } from './Float32ChannelTransport'

const useTest = () => {
  const [module, setModule] = useState<SoundStretchModule>()

  useEffect(() => {
    createModule().then((m: SoundStretchModule) => setModule(m))
  }, [])

  return useCallback(() => {
    if (module) {
      console.log('RUNNING TEST NOW')
      const sampleSize = 28000
      const channelCount = 2
      const factor = 0.2
      const inputArrays: Float32Array[] = [new Float32Array(sampleSize), new Float32Array(sampleSize)]
      let sum1 = 0
      let sum2 = 0
      for (let i = 0; i < sampleSize; i++) {
        inputArrays[0][i] = 1 + i * 0.1
        inputArrays[1][i] = 2 + i * 1.1
        sum1 += inputArrays[0][i]
        sum2 += inputArrays[1][i]
      }
      const input = new Float32ChannelTransport(module, sampleSize, channelCount)
      const output = new Float32ChannelTransport(module, sampleSize, channelCount)
      const test = new module.Test(sampleSize, channelCount)

      input.write(inputArrays)

      test.write(input.getPointer(), sampleSize)

      test.modify(factor)

      test.read(output.getPointer(), sampleSize)

      const result = output.read()

      console.log(result)
    }
  }, [module])
}
export { useTest }