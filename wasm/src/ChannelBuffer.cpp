//
// Created by Tobias Hegemann on 09.11.22.
//

#include "ChannelBuffer.h"
#include <iomanip>

ChannelBuffer::ChannelBuffer(size_t size, size_t channel_count)
        : _buffer(new float[size * channel_count]),
          _first_channel_read_ptr(&_buffer[0]),
          _first_channel_write_ptr(&_buffer[0]),
          _first_channel_end_ptr(&_buffer[size - 1]),
          _channel_count(channel_count) {
}

ChannelBuffer::~ChannelBuffer() {
    delete[] _buffer;
}

size_t ChannelBuffer::write(uintptr_t ptr, size_t length) {
    auto input = reinterpret_cast<const float *>(ptr);
    return write(input, length);
}

size_t ChannelBuffer::write(const float *input, size_t length) {
    const size_t channel_length = length / _channel_count;
    const size_t actual_channel_length = std::min(channel_length,
                                                  (size_t) (_first_channel_end_ptr - _first_channel_write_ptr + 1));
    for (size_t c = 0; c < _channel_count; ++c) {
        const size_t start = c * channel_length;
        // Write
        for (size_t i = 0; i < actual_channel_length; ++i) {
            _first_channel_write_ptr[start + i] = input[start + i];
        }
    }
    _first_channel_write_ptr += actual_channel_length;

    return actual_channel_length * _channel_count;
}

size_t ChannelBuffer::numSamplesWritten() {
    return _first_channel_write_ptr - _buffer;
}

size_t ChannelBuffer::numSamplesWritable() {
    return _first_channel_end_ptr - _first_channel_write_ptr + 1;
}

size_t ChannelBuffer::read(uintptr_t ptr, size_t length) {
    auto output = reinterpret_cast<float *>(ptr);
    return read(output, length);
}

size_t ChannelBuffer::read(float *output, size_t length) {
    // Read
    const size_t channel_length = length / _channel_count;
    const size_t actual_channel_length = std::min(channel_length,
                                                  (size_t) (_first_channel_end_ptr - _first_channel_read_ptr));
    for (size_t c = 0; c < _channel_count; ++c) {
        const size_t start = c * channel_length;
        for (size_t i = 0; i < actual_channel_length; ++i) {
            output[start + i] = _first_channel_read_ptr[start + i];
        }
    }
    _first_channel_read_ptr += actual_channel_length;
    return actual_channel_length * _channel_count;
}

size_t ChannelBuffer::numSamplesRead() {
    return _first_channel_read_ptr - _buffer;
}

size_t ChannelBuffer::numSamplesReadable() {
    return std::min(numSamplesWritten(), (size_t)(_first_channel_end_ptr - _first_channel_read_ptr + 1));
}

float *ChannelBuffer::buffer() const {
    return _buffer;
}

size_t ChannelBuffer::numSamples() const {
    return _first_channel_end_ptr + 1 - _buffer;
}

size_t ChannelBuffer::numChannels() const {
    return _channel_count;
}
