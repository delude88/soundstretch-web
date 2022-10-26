//
// Created by Tobias Hegemann on 25.10.22.
//

#include "SoundStretch.h"
#include <iostream>

#define BUFFER_SIZE           6720

SoundStretch::SoundStretch(size_t sampleRate, size_t channel_count) : sound_touch_(new SoundTouch()),
                                                                      output_buffer_(
                                                                              new FIFOSampleBuffer(
                                                                                      channel_count)) // NOLINT(cppcoreguidelines-narrowing-conversions)
{
    sound_touch_->setSampleRate(sampleRate);
    sound_touch_->setChannels(channel_count);
}

SoundStretch::~SoundStretch() {
    delete sound_touch_;
    delete output_buffer_;
}

void SoundStretch::setTempo(double tempo) {
    sound_touch_->setTempo(tempo);
}

void SoundStretch::setPitch(double pitch) {
    sound_touch_->setPitch(pitch);
}

size_t SoundStretch::getVersion() {
    return SoundTouch::getVersionId();
}

size_t SoundStretch::getSamplesAvailable() {
    return output_buffer_->numSamples();
}

void SoundStretch::push(uintptr_t input_ptr, size_t sample_size) {
    auto num_channels = sound_touch_->numChannels();
    auto input = reinterpret_cast<float *>(input_ptr); // NOLINT(performance-no-int-to-ptr)

    uint input_size = num_channels * sample_size;
    sound_touch_->putSamples(input, input_size);
    fetchProcessed();
}

void SoundStretch::pull(uintptr_t output_ptr, size_t sample_size) {
    fetchProcessed();
    auto num_channels = output_buffer_->getChannels();
    // Enough samples for all channels?
    auto num_samples = output_buffer_->numSamples();
    if (num_samples >= num_channels * sample_size) {
        // Enough samples ;)
        auto *output = reinterpret_cast<float *>(output_ptr); // NOLINT(performance-no-int-to-ptr)
        for (size_t channel = 0; channel < num_channels; ++channel) {
            float *destination = output + channel * sample_size;
            output_buffer_->receiveSamples(destination, sample_size /*std::min<size_t>(num_samples, sample_size)*/);
        }
    } else {
        std::cerr << "Output buffer too low" << std::endl;
    }
}

void SoundStretch::fetchProcessed() {
    //std::cout << "Fetching " << output_buffer_->numSamples() << " samples" << std::endl;
    output_buffer_->moveSamples(*sound_touch_);
}