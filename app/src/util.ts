import { SharedAudioBuffer } from './SharedAudioBuffer'
import { SoundStretchModule } from 'soundstretch-web'
// @ts-ignore
import * as createModule from 'soundstretch-web/wasm'

const areAudioBufferEqual = (a: AudioBuffer, b: AudioBuffer): boolean => {
  if (a.length !== b.length) {
    return false
  }
  if (a.sampleRate !== b.sampleRate) {
    return false
  }
  if (a.numberOfChannels !== b.numberOfChannels) {
    return false
  }
  for (let c = 0; c < a.numberOfChannels; ++c) {
    for (let s = 0; s < a.length; ++s) {
      if (a.getChannelData(c)[s] !== b.getChannelData(c)[s]) {
        return false
      }
    }
  }
  return true
}


const runTest = async (audioContext: AudioContext): Promise<AudioBufferSourceNode> => {
  // Step 1: Read file from
  const fileBuffer = await fetch('song.mp3').then(result => result.arrayBuffer())
  const originAudioBuffer = await audioContext.decodeAudioData(fileBuffer)

  // Step 2: Init WASM test module
  const module = await createModule() as SoundStretchModule
  const test = new module.Test(originAudioBuffer.length, originAudioBuffer.numberOfChannels)
  const sliceTest = new module.Test(originAudioBuffer.length, originAudioBuffer.numberOfChannels)

  // Step 3: Create write buffer
  const writeBuffer = new SharedAudioBuffer(module, originAudioBuffer)
  const writePtr = writeBuffer.pointer
  const writeArray = writeBuffer.array as any
  writeBuffer.write()
  for (let c = 0; c < originAudioBuffer.numberOfChannels; ++c) {
    const start = c * originAudioBuffer.length
    const end = start + originAudioBuffer.length
    const center = start + Math.round(originAudioBuffer.length / 2 - 1)
    console.log(`channel=${c} first(${start})=${writeArray[start]} center(${center})=${writeArray[center]} last(${end - 1})=${writeArray[end - 1]} size=${originAudioBuffer.length} (js)`)
  }

  // Step 4: Write whole audio buffer at once
  console.info('WRITING AT ONCE')
  const result = test.write(writePtr, writeArray.length)
  if (!result) {
    throw new Error('Test failed')
  }

  // Step 5: Write audio buffer in chunks
  const numWriteSlices = 12
  const writeSliceLength = writeArray.length / numWriteSlices
  console.info(`WRITING ${numWriteSlices} SLICES OF EACH ${writeSliceLength}`)
  for (let s = 0; s < numWriteSlices; ++s) {
    const ptr = writePtr + s * writeSliceLength * Float32Array.BYTES_PER_ELEMENT
    sliceTest.write(ptr, writeSliceLength)
  }

  // Step 6: Modify
  const factor = 10
  test.modify(factor)
  sliceTest.modify(factor)

  // Step 7: Create read buffer
  const readBuffer = new SharedAudioBuffer(module, originAudioBuffer)
  const readPtr = readBuffer.pointer
  const readArray = readBuffer.array

  // Step 8: Read at once
  console.info('READING AT ONCE')
  test.read(readPtr, readArray.length)
  const modifiedAudioBuffer = readBuffer.read()
  console.assert(!areAudioBufferEqual(originAudioBuffer, modifiedAudioBuffer), 'Origin and modified buffer are not equal')

  // Step 9: Read in chunks
  const numReadSlices = 1
  const sliceReadLength = writeArray.length / numReadSlices
  console.info(`READING ${numReadSlices} SLICES OF EACH ${sliceReadLength}`)
  for (let s = 0; s < numReadSlices; ++s) {
    const ptr = readPtr + s * sliceReadLength * Float32Array.BYTES_PER_ELEMENT
    sliceTest.read(ptr, sliceReadLength)
  }
  const anotherModifiedAudioBuffer = readBuffer.read()
  console.assert(!areAudioBufferEqual(originAudioBuffer, anotherModifiedAudioBuffer), 'Origin and another modified buffer are not equal')

  // Step 10: Cleanup
  readBuffer.close()
  writeBuffer.close()

  // Step 11: Finally play modified audio buffer
  const buffer = new AudioBufferSourceNode(audioContext)
  buffer.connect(audioContext.destination)
  buffer.buffer = modifiedAudioBuffer
  buffer.loop = true
  return buffer
}


export { areAudioBufferEqual, runTest }