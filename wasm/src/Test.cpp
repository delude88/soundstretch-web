//
// Created by Tobias Hegemann on 08.11.22.
//

#include <iostream>
#include "Test.h"

Test::Test(size_t size, size_t channel_count)
        : ChannelBuffer(size, channel_count) {
}

void Test::modify(float factor) {
    const size_t num_samples = _first_channel_end_ptr - _buffer;
    const size_t num_samples_available = _first_channel_write_ptr - _buffer;
    for (size_t c = 0; c < _channel_count; ++c) {
        for (size_t s = 0; s < num_samples_available; ++s) {
            _buffer[s + c * num_samples] = _buffer[s + c * num_samples] * factor;
        }
    }
    std::cout << "Modified " << _channel_count << " * " << num_samples_available << "/" << num_samples << std::endl;
}
