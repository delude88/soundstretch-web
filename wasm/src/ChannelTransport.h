//
// Created by Tobias Hegemann on 11.11.22.
//

#ifndef WASM_CHANNELTRANSPORT_H
#define WASM_CHANNELTRANSPORT_H

#include <cstddef>
#include <cstdint>

class ChannelTransport {
public:
    [[maybe_unused]] ChannelTransport(size_t sample_size, size_t channel_count);

    ~ChannelTransport();

    void replace(uintptr_t ptr);

    void from(uintptr_t ptr, size_t num_samples, size_t offset = 0);

    void clone(uintptr_t ptr);

    void clone(uintptr_t ptr, size_t num_samples);

    [[nodiscard]] float *array() const;

    void clone(float *arr);

    void clone(float *arr, size_t num_samples);

    void clone(float **arr);

    void clone(float **arr, size_t num_samples);

private:
    size_t _channel_count;
    size_t _sample_size;
    float *_current;
    float *_buffer;
};

#endif //WASM_CHANNELTRANSPORT_H
