import { SoundStretchNode } from './SoundStretchNode'

function createWorkletAsRubberNode(context: BaseAudioContext, options?: AudioWorkletNodeOptions): SoundStretchNode {
    const node = new AudioWorkletNode(context, "soundstretch-processor", options) as any
    node.setPitch = (pitch: number) => {
        node.port.postMessage(JSON.stringify(["pitch", pitch]));
    }
    node.setTempo = (pitch: number) => {
        node.port.postMessage(JSON.stringify(["tempo", pitch]));
    }
    node.setHighQuality = (pitch: number) => {
        node.port.postMessage(JSON.stringify(["quality", pitch]));
    }
    node.close = () => {
        node.port.postMessage(JSON.stringify(["close"]));
    }
    return node as SoundStretchNode
}

async function createSoundStretchNode(
    context: BaseAudioContext,
    url: string,
    options?: AudioWorkletNodeOptions
): Promise<SoundStretchNode> {
    // ensure audioWorklet has been loaded
    try {
        return createWorkletAsRubberNode(context, options);
    } catch (err) {
        await context.audioWorklet.addModule(url)
        return createWorkletAsRubberNode(context, options);
    }
}

export {createSoundStretchNode}