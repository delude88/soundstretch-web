//
// Created by Tobias Hegemann on 09.11.22.
//

#ifndef WASM_CHANNELBUFFER_H
#define WASM_CHANNELBUFFER_H

#include <cstddef>
#include <cstdint>

class ChannelBuffer {
public:
    ChannelBuffer(size_t size, size_t channel_count);

    ~ChannelBuffer();

    [[nodiscard]] float *buffer() const;

    [[nodiscard]] size_t numSamples() const;

    [[nodiscard]] size_t numChannels() const;

    virtual size_t write(uintptr_t ptr, size_t length);

    virtual size_t write(const float *input, size_t length);

    size_t numSamplesWritten();

    size_t numSamplesWritable();

    virtual size_t read(uintptr_t ptr, size_t length);

    virtual size_t read(float *arr, size_t length);

    size_t numSamplesRead();

    size_t numSamplesReadable();

protected:
    float *_buffer;
    float *_first_channel_write_ptr;
    float *_first_channel_read_ptr;
    const float *_first_channel_end_ptr;
    const size_t _channel_count;
};


#endif //WASM_CHANNELBUFFER_H
