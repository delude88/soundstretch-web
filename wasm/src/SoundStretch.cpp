//
// Created by Tobias Hegemann on 25.10.22.
//

#include "SoundStretch.h"
#include <iostream>

SoundStretch::SoundStretch(size_t sampleRate, size_t channel_count) : sound_touch_(new SoundTouch()) {
    sound_touch_->setSampleRate(sampleRate);
    sound_touch_->setChannels(channel_count);
}

SoundStretch::~SoundStretch() {
    delete sound_touch_;
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

void SoundStretch::push(uintptr_t input_ptr, size_t sample_size) {
    auto samples = reinterpret_cast<const soundtouch::SAMPLETYPE *>(input_ptr); // NOLINT(performance-no-int-to-ptr)
    std::cout << "Writing " << sample_size << " now ..." << std::endl;
    sound_touch_->putSamples(samples, sample_size / sound_touch_->numChannels());
    std::cout << "" << sample_size << " written!" << std::endl;
}

size_t SoundStretch::pull(uintptr_t output_ptr, size_t sample_size) {
    auto samples = reinterpret_cast<soundtouch::SAMPLETYPE *>(output_ptr); // NOLINT(performance-no-int-to-ptr)
    return sound_touch_->receiveSamples(samples, sample_size);
}
