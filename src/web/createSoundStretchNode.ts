import { createNode, SoundStretchNode } from './SoundStretchNode'

async function createSoundStretchNode(
    context: BaseAudioContext,
    url: string,
    options?: AudioWorkletNodeOptions
): Promise<SoundStretchNode> {
    // ensure audioWorklet has been loaded
    try {
        return createNode(context, options);
    } catch (err) {
        await context.audioWorklet.addModule(url)
        return createNode(context, options);
    }
}

export {createSoundStretchNode}