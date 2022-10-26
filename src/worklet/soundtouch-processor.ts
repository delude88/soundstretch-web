import { SoundStretch } from './classes/SoundStretch'

class SoundStretchProcessor extends AudioWorkletProcessor {
  private api: SoundStretch | undefined;
  private running: boolean = true;
  private pitch: number = 1;
  private tempo: number = 1;

  constructor() {
    super();
    this.port.onmessage = (e) => {
      const [event, payload] = JSON.parse(e.data)
      //const event = data[0] as string
      //const payload = data[1]
      console.log("port.onmessage", event, payload)
      switch (event) {
        case "pitch": {
          this.pitch = payload
          if (this.api)
            this.api.setPitch(this.pitch)
          break;
        }
        case "tempo": {
          this.tempo = payload
          if (this.api)
            this.api.setTempo(this.tempo)
          break;
        }
        case "close": {
          this.close();
          break;
        }
      }
    }
  }


  getApi(channelCount: number): SoundStretch {
    if (
      !this.api ||
      this.api.getChannelCount() !== channelCount
    ) {
      this.api = new SoundStretch(channelCount, {
        pitch: this.pitch,
        tempo: this.tempo
      })
      this.api.setTempo(this.tempo)

      console.info("SoundStretch engine version", this.api.getVersion())
    }
    return this.api
  }

  close() {
    this.port.onmessage = null
    this.running = false;
  }

  process(inputs: Float32Array[][], outputs: Float32Array[][]): boolean {
    const numChannels = inputs[0]?.length || outputs[0]?.length
    if (numChannels > 0) {
      const api = this.getApi(numChannels)

      if (inputs?.length > 0) {
        api.push(inputs[0])
      }

      if (outputs?.length > 0) {
        const outputLength = outputs[0][0].length
        if (api.samplesAvailable >= outputLength) {
          api.pull(outputs[0])
        }
      }
    }
    return this.running;
  }
}

registerProcessor('soundstretch-processor', SoundStretchProcessor)