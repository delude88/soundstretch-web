//
// Created by Tobias Hegemann on 08.11.22.
//

#include <iostream>
#include "Test.h"

Test::Test(size_t sample_count, size_t channel_count) : _sample_count(sample_count), _channel_count(channel_count) {
    _buffer = new float *[channel_count];
    for (size_t c = 0; c < channel_count; ++c) {
        _buffer[c] = new float[sample_count];
    }
    _buffer_write_pos = _buffer;
    _buffer_read_pos = _buffer;
}

Test::~Test() {
    delete[] _buffer;
}


void Test::modify(float factor) {
    auto sample_available = _buffer_write_pos - _buffer;
    std::cout << "Modifying now " << _channel_count << " * " << sample_available << "/" << _sample_count << std::endl;
    for (size_t c = 0; c < _channel_count; ++c) {
        for (size_t s = 0; s < sample_available; ++s) {
            _buffer[c][s] = _buffer[c][s] * factor;
        }
    }
    std::cout << "Modified " << _channel_count << " * " << sample_available << "/" << _sample_count << std::endl;
}

void Test::write(uintptr_t ptr, size_t num_samples) {
    auto input = reinterpret_cast<float **>(ptr);
    if (_buffer_write_pos - _buffer < _sample_count) {
        for (size_t c = 0; c < _channel_count; ++c) {
            _buffer_write_pos[c] = input[c];
        }
        _buffer_write_pos += num_samples;
    } else {
        std::cerr << "Out of range" << std::endl;
    }
}

void Test::read(uintptr_t ptr, size_t num_samples) {
    auto output = reinterpret_cast<float **>(ptr);
    if (_buffer_read_pos - _buffer < _sample_count) {
        for (size_t c = 0; c < _channel_count; ++c) {
            output[c] = _buffer_read_pos[c];
        }
        _buffer_read_pos += num_samples;
    } else {
        std::cerr << "Out of range" << std::endl;
    }
}
