//
// Created by Tobias Hegemann on 25.10.22.
//

#include "SoundStretch.h"
#include <algorithm>

SoundStretch::SoundStretch(size_t sampleRate, size_t channel_count) : _sound_touch(
        new SoundTouch()) {
    _sound_touch->setSampleRate(sampleRate);
    _sound_touch->setChannels(channel_count);
    _scratch_size = (8196);
    _scratch = new float[_scratch_size * channel_count];
    _queue = new std::queue<float>[channel_count];
    for (size_t c = 0; c < channel_count; ++c) {
        _queue[c] = std::queue<float>();
    }
}

SoundStretch::~SoundStretch() {
    delete[] _scratch;
    delete[] _queue;
    delete _sound_touch;
}

void SoundStretch::setTempo(double tempo) {
    _sound_touch->setTempo(tempo);
    clear();
}

void SoundStretch::setPitch(double pitch) {
    _sound_touch->setPitch(pitch);
    clear();
}

void SoundStretch::setPitchSemiTones(double pitch) {
    _sound_touch->setPitchSemiTones(pitch);
    clear();
}

void SoundStretch::setRate(double rate) {
    _sound_touch->setRate(rate);
    clear();
}

size_t SoundStretch::getVersion() {
    return SoundTouch::getVersionId();
}

void SoundStretch::push(uintptr_t input_ptr, size_t input_size) {
    auto input = reinterpret_cast<const soundtouch::SAMPLETYPE *>(input_ptr); // NOLINT(performance-no-int-to-ptr
    // Soundtouch requires array to be interleaved
    const auto channel_count = getChannelCount();
    auto *interleaved = new float[input_size * channel_count];
    for (size_t c = 0; c < channel_count; ++c) {
        for (size_t s = 0; s < input_size; ++s) {
            interleaved[c + s * channel_count] = input[s + c * channel_count];
        }
    }
    _sound_touch->putSamples(interleaved, input_size);
    buffer();
}

size_t SoundStretch::pull(uintptr_t output_ptr, size_t output_size) {
    buffer();
    auto output = reinterpret_cast<soundtouch::SAMPLETYPE *>(output_ptr); // NOLINT(performance-no-int-to-ptr)
    const auto av = available();
    const auto actual = std::min(output_size, av);
    for (size_t c = 0; c < getChannelCount(); ++c) {
        for (size_t s = 0; s < actual; ++s) {
            output[s + c * output_size] = _queue[c].front();
            _queue[c].pop();
        }
    }
    return actual;
}

void SoundStretch::buffer() {
    uint actual;
    const auto channel_count = getChannelCount();
    do {
        actual = _sound_touch->receiveSamples(_scratch, _scratch_size);
        for (size_t c = 0; c < channel_count; ++c) {
            for (size_t s = 0; s < actual; ++s) {
                // Interleaves (!)
                _queue[c].push(_scratch[c + s * channel_count]);
            }
        }
    } while (actual != 0);
}

size_t SoundStretch::available() const {
    return _queue[0].size();
}

void SoundStretch::flush() {
    _sound_touch->flush();
}

size_t SoundStretch::getChannelCount() {
    return _sound_touch->numChannels();
}

void SoundStretch::clear() {
    for (size_t c = 0; c < getChannelCount(); ++c) {
        _queue[c] = std::queue<float>();
    }
    _sound_touch->flush();
}
