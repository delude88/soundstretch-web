import { useCallback, useEffect, useState } from 'react'
// @ts-ignore
import * as createModule from 'soundstretch-web/wasm'
import { SoundStretchModule } from 'soundstretch-web'
import { Float32ChannelTransport } from 'soundstretch-web'

const useTest = () => {
  const [module, setModule] = useState<SoundStretchModule>()

  useEffect(() => {
    createModule().then((m: SoundStretchModule) => setModule(m))
  }, [])

  return useCallback(() => {
    if (module) {
      console.log("RUNNING TEST NOW")
      const sampleSize = 28000
      const channelCount = 2
      const factor = 0.2
      const inputArrays: Float32Array[] = [new Float32Array(sampleSize), new Float32Array(sampleSize)]
      for (let i = 0; i < sampleSize; i++) {
        inputArrays[0][i] = i * 0.1
        inputArrays[1][i] = i * 1.1
      }
      const input = new Float32ChannelTransport(module, sampleSize, channelCount)
      const output = new Float32ChannelTransport(module, sampleSize, channelCount)
      const test = new module.Test(sampleSize, channelCount)

      input.write(inputArrays)

      console.log(input.read())

      test.write(input.getPointer(), sampleSize)

      test.modify(factor)

      test.read(output.getPointer(), sampleSize)

      const result = output.read()

      console.log(result)
    }
  }, [module])
}
export { useTest }