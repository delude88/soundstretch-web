import * as Tone from "tone"
import { USE_TONE } from './config'
/**
 *
 * @param data The raw audio data array, probably several million samples long
 * @param spp Samples per pixel, this is your zoom level
 * @param scroll You will need virtual scrolling for performance, this is the scroll position in px
 * @param width Draw area width in pixels, max is screen width
 * @param resolution Number of samples to take per pixel sample range, tweak for performance vs accuracy.
 */
const reduceAudioPeak = (data: Float32Array, spp: number, scroll: number, width: number, resolution: number): number[][] => {
  let drawData = new Array(width)
  let startSample = scroll * spp
  let skip = Math.ceil(spp / resolution)

  // For each pixel in draw area
  for (let i = 0; i < width; i++) {
    let min = 0 // minimum value in sample range
    let max = 0 // maximum value in sample range
    let pixelStartSample = startSample + (i * spp)

    // Iterate over the sample range for this pixel (spp)
    // and find the min and max values.
    for (let j = 0; j < spp; j += skip) {
      const index = pixelStartSample + j
      if (index < data.length) {
        let val = data[index]
        if (val > max) {
          max = val
        } else if (val < min) {
          min = val
        }
      }
    }

    drawData[i] = [min, max]
  }
  return drawData
}

export type CreateAudioBufferSourceNodeFunc = (context: BaseAudioContext) => AudioBufferSourceNode | Promise<AudioBufferSourceNode>

class WaveDraw {
  private readonly _createBuffer: CreateAudioBufferSourceNodeFunc
  private readonly _context: BaseAudioContext
  private readonly _container: HTMLElement
  private readonly _innerContainer: HTMLDivElement
  private readonly _playCanvasWrapper: HTMLDivElement
  private readonly _playCanvas: HTMLCanvasElement
  private readonly _trackCanvas: HTMLCanvasElement
  private readonly _clickArea: HTMLDivElement
  private readonly _resizeObserver: ResizeObserver
  private _sourceNode?: AudioBufferSourceNode
  private _playColor: string = 'purple'
  private _trackColor: string = 'violet'
  private _width: number
  private _buffer?: AudioBuffer | null
  private _playing: boolean = false
  private _playMark: number = 0
  private _detune: number = 0
  private _playbackRate: number = 1

  constructor({
                container,
                audioContext,
                height = 128,
                createBuffer = (context) => new AudioBufferSourceNode(context)
              }: {
    container: HTMLElement,
    audioContext: BaseAudioContext,
    height?: number,
    createBuffer?: CreateAudioBufferSourceNodeFunc
  }) {
    this._container = container
    this._context = audioContext
    this._createBuffer = createBuffer

    this._innerContainer = document.createElement('div')
    this._playCanvasWrapper = document.createElement('div')
    this._playCanvas = document.createElement('canvas')
    this._trackCanvas = document.createElement('canvas')
    this._clickArea = document.createElement('div')

    this._innerContainer.style.cssText += `display:block;position:relative;width:100%;${height ? `height:${height}px;` : ''}`
    this._trackCanvas.style.cssText += 'position:absolute;top:0;left:0;height: 100%;'
    this._playCanvasWrapper.style.cssText += 'position:absolute;top:0;left:0;width:100%;height: 100%;overflow: hidden;'
    this._playCanvas.style.cssText += 'position:absolute;top:0;left:0;height: 100%;'
    this._clickArea.style.cssText += 'position:absolute;top:0;left:0;width:100%;height: 100%;'
    this._playCanvasWrapper.appendChild(this._playCanvas)
    this._innerContainer.appendChild(this._trackCanvas)
    this._innerContainer.appendChild(this._playCanvasWrapper)
    this._innerContainer.appendChild(this._clickArea)
    this._container.appendChild(this._innerContainer)

    this._clickArea.onclick = (ev) => {
      const x = ev.x - this._innerContainer.getBoundingClientRect().x
      void this.seekTo(Math.round(this.length / this.width * x))
    }
    this._resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        if (entry.contentBoxSize) {
          //const contentBoxSize = Array.isArray(entry.contentBoxSize) ? entry.contentBoxSize[0] : entry.contentBoxSize
          this.width = entry.contentRect.width
        }
      }
    })
    this._resizeObserver.observe(this._container)
    this._width = container.getBoundingClientRect().width
  }

  public get length() {
    return this._buffer?.length || 0
  }

  public get width() {
    return this._width
  }

  private set width(width: number) {
    this._width = width
    this._trackCanvas.style.width = `${width}px`
    this._playCanvas.style.width = `${width}px`
    this.seekTo(this._playMark)
      .catch(err => console.error(err))
  }

  private async playInternal() {
    if (this._buffer) {
      console.info('[WaveDraw] play: Disconnect')
      this._sourceNode?.disconnect()
      console.info('[WaveDraw] play: Stop')
      this._sourceNode?.stop()
      this._sourceNode = undefined
      console.info('[WaveDraw] play: Creating')
      this._sourceNode = await this._createBuffer(this._context)
      console.info('[WaveDraw] play: Set values')
      if(this._playbackRate !== 1) this._sourceNode.playbackRate.setValueAtTime(this._playbackRate, 0)
      if(this._detune !== 0) this._sourceNode.detune.setValueAtTime(this._detune, 0)
      if(USE_TONE) {
        console.info('[WaveDraw] play: Connect using TONE')
        Tone.connect(this._sourceNode, Tone.getDestination())
      } else{
        console.info('[WaveDraw] play: Connect using native')
        this._sourceNode.connect(this._context.destination)
      }
      this._sourceNode.buffer = this._buffer
      console.info('[WaveDraw] play: Start')
      this._sourceNode.start(0, this._playMark / this._buffer.sampleRate)
      console.info('[WaveDraw] play: Finished')
    }
  }

  async play() {
    this._playing = true
    await this.playInternal()
  }

  setDetune(detune: number) {
    this._detune = detune
    this._sourceNode?.detune.setValueAtTime(this._detune, 0)
  }

  setPlaybackRate(playbackRate: number) {
    this._playbackRate = playbackRate
    this._sourceNode?.playbackRate.setValueAtTime(this._playbackRate, 0)
  }

  pause() {
    this._playing = false
    console.info('[WaveDraw] pause: disconnect')
    this._sourceNode?.disconnect()
    console.info('[WaveDraw] pause: stop')
    this._sourceNode?.stop()
    this._sourceNode = undefined
  }

  stop() {
    this._playing = false
    console.info('[WaveDraw] stop: disconnect')
    this._sourceNode?.disconnect()
    console.info('[WaveDraw] stop: stop')
    this._sourceNode?.stop()
    this._sourceNode = undefined
    this._playMark = 0
    this._playCanvasWrapper.style.width = `${this.width / this.length * this._playMark}px`
  }

  async seekTo(sample: number) {
    console.log(`[WaveDraw] Seek to ${sample}`)
    this._playMark = sample
    this._playCanvasWrapper.style.width = `${this.width / this.length * this._playMark}px`
    if (this._playing) {
      await this.playInternal()
    }
  }

  async setBuffer(audioBuffer: AudioBuffer) {
    this._buffer = audioBuffer
    this.init()
    if (this._playing) {
      await this.playInternal()
    }
  }

  init() {
    console.log('[WaveDraw] init')
    // Draw wave form
    if (this._buffer && this._buffer.numberOfChannels > 0) {
      const leftChannel = this._buffer.getChannelData(0)
      /*const rightChannel = this._sourceNode.buffer.numberOfChannels > 1
        ? this._sourceNode.buffer.getChannelData(0)
        : leftChannel*/
      this.draw(this._trackCanvas.getContext('2d'), leftChannel, this._trackColor)
      this.draw(this._playCanvas.getContext('2d'), leftChannel, this._playColor)
    }
  }

  draw(ctx: CanvasRenderingContext2D | null, channel: Float32Array, color: string) {
    if (ctx) {
      const drawHeight = this._trackCanvas.height / 2
      const width = this._trackCanvas.width
      const spp = Math.round(channel.length / width)  // = 100%
      const data = reduceAudioPeak(channel, spp, 0, width, 32)

      ctx.clearRect(0, 0, this._trackCanvas.width, this._trackCanvas.height)
      ctx.fillStyle = color

      for (let i = 0; i < width; i++) {
        // transform data points to pixel height and move to centre
        let minPixel = data[i][0] * drawHeight + drawHeight
        let maxPixel = data[i][1] * drawHeight + drawHeight
        let pixelHeight = maxPixel - minPixel

        ctx.fillRect(i, minPixel, 1, pixelHeight)
      }
    }
  }

  destroy() {
    console.log('[WaveDraw] destroy')
    this._resizeObserver.disconnect()
    this._trackCanvas.remove()
    this._playCanvas.remove()
    this._playCanvasWrapper.remove()
    this._clickArea.remove()
    this._innerContainer.remove()
  }
}

export default WaveDraw