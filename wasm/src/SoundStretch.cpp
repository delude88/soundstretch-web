//
// Created by Tobias Hegemann on 25.10.22.
//

#include "SoundStretch.h"
#include <iostream>

SoundStretch::SoundStretch(size_t sampleRate, size_t channel_count) : _sound_touch(new SoundTouch()) {
    _sound_touch->setSampleRate(sampleRate);
    _sound_touch->setChannels(channel_count);
    _scratch = new float[4096 * channel_count];
    _queue = new std::queue<float> *[channel_count];
    for (size_t c = 0; c < channel_count; ++c) {
        _queue[c] = new std::queue<float>();
    }
}

SoundStretch::~SoundStretch() {
    delete[] _scratch;
    delete[] _queue;
    delete _sound_touch;
}

void SoundStretch::setTempo(double tempo) {
    _sound_touch->setTempo(tempo);
}

void SoundStretch::setPitch(double pitch) {
    _sound_touch->setPitch(pitch);
}

void SoundStretch::setPitchSemiTones(double pitch) {
    _sound_touch->setPitchSemiTones(pitch);
}

void SoundStretch::setRate(double rate) {
    _sound_touch->setRate(rate);
}

size_t SoundStretch::getVersion() {
    return SoundTouch::getVersionId();
}

void SoundStretch::push(uintptr_t input_ptr, size_t input_size) {
    auto samples = reinterpret_cast<const soundtouch::SAMPLETYPE *>(input_ptr); // NOLINT(performance-no-int-to-ptr)
    std::cout << "Writing " << input_size << " now ..." << std::endl;
    _sound_touch->putSamples(samples, input_size / _sound_touch->numChannels());
    std::cout << "" << input_size << " written!" << std::endl;
    buffer();
}

size_t SoundStretch::pull(uintptr_t output_ptr, size_t output_size) {
    buffer();
    auto output = reinterpret_cast<soundtouch::SAMPLETYPE *>(output_ptr); // NOLINT(performance-no-int-to-ptr)
    const auto actual = std::min(output_size, _queue[0]->size());
    for (size_t c = 0; c < _sound_touch->numChannels(); ++c) {
        for (size_t s = 0; s < actual; ++s) {
            output[s + c * output_size] = _queue[c]->front();
            _queue[c]->pop();
        }
    }
    return actual;
}

void SoundStretch::buffer() {
    uint actual;
    do {
        actual = _sound_touch->receiveSamples(_scratch, 4096);
        for (size_t c = 0; c < _sound_touch->numChannels(); ++c) {
            for (size_t s = 0; s < actual; ++s) {
                _queue[c]->push(_scratch[s + c * actual]);
            }
        }
    } while (actual != 0);
}

size_t SoundStretch::available() const {
    return _queue[0]->size();
}
