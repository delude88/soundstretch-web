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

class WaveDraw {
  private readonly _context: BaseAudioContext
  private readonly _container: HTMLElement
  private readonly _canvasWrapper: HTMLDivElement
  private readonly _trackCanvas: HTMLCanvasElement
  private readonly _playCanvas: HTMLCanvasElement
  private _sourceNode?: AudioBufferSourceNode
  private _playColor: string = 'black'
  private _trackColor: string = 'black'

  constructor({
                container,
                audioContext,
                height = 128
              }: { container: HTMLElement, audioContext: BaseAudioContext, height?: number }) {
    this._container = container
    this._context = audioContext

    this._canvasWrapper = document.createElement('div')
    this._trackCanvas = document.createElement('canvas')
    this._playCanvas = document.createElement('canvas')

    this._canvasWrapper.style.cssText += `display:block;position:relative;width:100%;height:${height}px;`
    this._trackCanvas.style.cssText += 'position:absolute;top:0;left:0;width:100%;max-height: 100%;'
    this._playCanvas.style.cssText += 'position:absolute;top:0;left:0;width:100%;max-height: 100%;'
    this._canvasWrapper.appendChild(this._trackCanvas)
    this._canvasWrapper.appendChild(this._playCanvas)
    this._container.appendChild(this._canvasWrapper)
  }

  play() {
    this._sourceNode?.start()
  }

  pause() {
    this._sourceNode?.stop()
  }

  setBuffer(audioBuffer: AudioBuffer) {
    const sourceNode = new AudioBufferSourceNode(this._context)
    sourceNode.buffer = audioBuffer
    this.setSourceNode(sourceNode)
  }

  setSourceNode(sourceNode: AudioBufferSourceNode) {
    this._sourceNode = sourceNode
    this.init()
  }

  init() {
    console.log('[WaveDraw] init')
    // Draw wave form
    if (this._sourceNode?.buffer && this._sourceNode.buffer.numberOfChannels > 0) {
      const leftChannel = this._sourceNode.buffer.getChannelData(0)
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
    this._canvasWrapper.removeChild(this._trackCanvas)
    this._canvasWrapper.removeChild(this._playCanvas)
    this._container.removeChild(this._canvasWrapper)
    this._trackCanvas.remove()
    this._playCanvas.remove()
    this._canvasWrapper.remove()
  }
}

export default WaveDraw