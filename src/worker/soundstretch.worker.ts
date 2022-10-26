onmessage = ({ data }: MessageEvent) => {
  const [event, payload] = JSON.parse(data)

  console.log(event, payload)

  switch(event) {
    case "stretch": {
      const task = payload as {
        pitch: number
        tempo: number
        channels: Float32Array[]
      }
      console.log("Got channels", task.channels.length)
      break;
    }
    case "bpm": {
      // Return current bpm
      postMessage(JSON.stringify(["bpm", 128]))
      break;
    }
  }

  // postMessage(JSON.stringify([event, payload]))
}