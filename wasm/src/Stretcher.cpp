//
// Created by Tobias Hegemann on 25.10.22.
//

#include "Stretcher.h"

Stretcher::Stretcher(size_t sampleRate, size_t channel_count) : sound_touch_(new SoundTouch()),
                                                                output_buffer_(new FIFOSampleBuffer(channel_count)),
                                                                sample_rate_(sampleRate) {
    sound_touch_->setChannels(channel_count);
}

Stretcher::~Stretcher() {
    delete sound_touch_;
}

void Stretcher::setTempo(double tempo) {
    sound_touch_->setTempo(tempo);
}

void Stretcher::setPitch(double pitch) {
    sound_touch_->setPitch(pitch);
}

const char *Stretcher::getVersion() {
    return SoundTouch::getVersionString();
}

void Stretcher::push(uintptr_t input_ptr, size_t sample_size) {
    auto num_channels = sound_touch_->numChannels();
    auto *input = reinterpret_cast<float *>(input_ptr); // NOLINT(performance-no-int-to-ptr)
    auto **channel_sample_buffer = new soundtouch::SAMPLETYPE *[num_channels];

    for (size_t channel = 0; channel < num_channels; ++channel) {
        float *source = input + channel * sample_size;
        channel_sample_buffer[channel] = source;
        sound_touch_->putSamples(channel_sample_buffer[channel], sample_size);
    }
    fetchProcessed();
}

size_t Stretcher::getSamplesAvailable() {
    return sound_touch_->numSamples();
}

void Stretcher::fetchProcessed() {
    auto available = getSamplesAvailable();
    if (available > 0) {

    }


    size_t nSamples;
    do {
        nSamples = sound_touch_->receiveSamples(sampleBuffer, buffSizeSamples);
        outFile->write(sampleBuffer, nSamples * nChannels);
    } while (nSamples != 0);

}
