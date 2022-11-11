//
// Created by Tobias Hegemann on 08.11.22.
//

#ifndef WASM_TEST_H
#define WASM_TEST_H

#include <cstddef>
#include <cstdint>

class Test {
public:
    explicit Test(size_t sample_count, size_t channel_count = 1);

    ~Test();

    void modify(float factor);

    void write(uintptr_t ptr, size_t num_samples);

    void read(uintptr_t ptr, size_t num_samples);

private:
    size_t _channel_count;
    size_t _sample_count;

    float **_buffer;
    float **_buffer_write_pos;
    float **_buffer_read_pos;
};

#endif //WASM_TEST_H
