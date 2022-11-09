//
// Created by Tobias Hegemann on 08.11.22.
//

#ifndef WASM_TEST_H
#define WASM_TEST_H

#include <cstddef>
#include <cstdint>
#include "ChannelBuffer.h"

class Test : public ChannelBuffer {
public:
    explicit Test(size_t size, size_t channel_count = 1);

    void modify(float factor);

    using ChannelBuffer::write;
    
    using ChannelBuffer::read;
};

#endif //WASM_TEST_H
