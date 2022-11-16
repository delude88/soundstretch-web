import { ChangeEvent, useCallback, useEffect, useState } from 'react'

const useAudioFileChooser = (audioContext: AudioContext, initialUrl?: string) => {
  const [fileBuffer, setFileBuffer] = useState<ArrayBuffer>()
  const [audioBuffer, setAudioBuffer] = useState<AudioBuffer>()

  const handleFileInputChange = useCallback((event: ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files.length > 0) {
      const file = event.target.files[0]
      const reader = new FileReader()
      reader.onload = (event) => {
        if (event.target?.result && typeof event.target.result === 'object') {
          setFileBuffer(event.target.result)
        } else {
          setFileBuffer(undefined)
        }
      }
      reader.readAsArrayBuffer(file)
    }
  }, [])

  useEffect(() => {
    if (audioContext) {
      if (fileBuffer) {
        // Prefer file buffer
        audioContext.decodeAudioData(fileBuffer)
          .then(buffer => setAudioBuffer(buffer))
      } else if (initialUrl) {
        // Use initial url as fallback
        fetch(initialUrl)
          .then(response => {
            if (!response.ok) {
              throw new Error(`HTTP error, status = ${response.status}`)
            }
            return response.arrayBuffer()
          })
          .then(arrayBuffer => audioContext.decodeAudioData(arrayBuffer))
          .then(buffer => setAudioBuffer(buffer))
          .catch(err => console.error(err))
      }
      return () => {
        setAudioBuffer(undefined)
      }
    }
  }, [audioContext, fileBuffer, initialUrl])

  return {
    handleFileInputChange,
    audioBuffer
  }
}

export { useAudioFileChooser }