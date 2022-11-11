//
// Created by Tobias Hegemann on 11.11.22.
//
#include "ChannelTransport.h"

[[maybe_unused]] ChannelTransport::ChannelTransport(size_t sample_size, size_t channel_count) : _sample_size(
        sample_size),
                                                                                                _channel_count(
                                                                                                        channel_count) {
    _buffer = new float[channel_count * sample_size];
    _current = _buffer;
}


ChannelTransport::~ChannelTransport() {
    delete[] _buffer;
}

void ChannelTransport::replace(uintptr_t ptr) {
    auto input = reinterpret_cast<float *>(ptr);
    _current = input;
}

void ChannelTransport::from(uintptr_t ptr, size_t num_samples, size_t offset) {
    _current = _buffer;
    auto input = reinterpret_cast<const float *>(ptr);
    for (size_t c = 0; c < _channel_count; ++c) {
        for (size_t s = 0; s < num_samples; ++s) {
            _current[s + c * _sample_size + offset] = input[s + c * num_samples];
        }
    }
}

void ChannelTransport::clone(uintptr_t ptr) {
    clone(ptr, _sample_size);
}

void ChannelTransport::clone(uintptr_t ptr, size_t num_samples) {
    auto output = reinterpret_cast<float *>(ptr);
    clone(output, num_samples);
}

void ChannelTransport::clone(float *arr) {
    clone(arr, _sample_size);
}

void ChannelTransport::clone(float *target, size_t num_samples) {
    for (size_t c = 0; c < _channel_count; ++c) {
        for (size_t s = 0; s < num_samples; ++s) {
            target[s + c * num_samples] = _buffer[s + c * _sample_size];
        }
    }
}

float *ChannelTransport::array() const {
    return _current;
}

void ChannelTransport::clone(float **arr) {
    clone(arr, _sample_size);
}

void ChannelTransport::clone(float **arr, size_t num_samples) {
    for (size_t c = 0; c < _channel_count; ++c) {
        for (size_t s = 0; s < num_samples; ++s) {
            arr[c][s] = _buffer[s + c * _sample_size];
        }
    }
}
