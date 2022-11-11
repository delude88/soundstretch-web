//
// Created by Tobias Hegemann on 08.11.22.
//

#include <iostream>
#include <cmath>
#include "Test.h"

Test::Test(size_t sample_count, size_t channel_count) : _sample_count(sample_count), _channel_count(channel_count) {
    _buffer = new float *[channel_count];
    for (size_t c = 0; c < channel_count; ++c) {
        _buffer[c] = new float[sample_count];
    }
    _buffer_write_pos = _buffer;
    _buffer_read_pos = _buffer;

    /*
    // Some other test
    int **myArray = new int *[2];
    for (int c = 0; c < 2; ++c) {
        myArray[c] = new int[20];
        for (int j = 0; j < 20; ++j) {
            myArray[c][j] = c + j;
            std::cout << "myArray[" << c << "][" << j << "]=" << myArray[c][j] << std::endl;
        }
    }
    int **otherArray = new int *[2];
    for (int c = 0; c < 2; ++c) {
        otherArray[c] = &myArray[c][5];
    }
    for (int c = 0; c < 2; ++c) {
        for (int j = 0; j < 10; ++j) {
            std::cout << "otherArray[" << c << "][" << j << "]=" << otherArray[c][j] << " ==? " << myArray[c][j + 5]
                      << std::endl;
        }
    }
    delete[] otherArray;
    delete[] myArray;*/
}

Test::~Test() {
    delete[] _buffer;
}


void Test::modify(float factor) {
    auto sample_available = _buffer_write_pos - _buffer;
    std::cout << "Modifying now " << _channel_count << " * " << sample_available << "/" << _sample_count
              << " of _buffer with size=" << sizeof(_buffer) << std::endl;
    for (size_t c = 0; c < _channel_count; ++c) {
        for (size_t s = 0; s < sample_available; ++s) {
            _buffer[c][s] = _buffer[c][s] * factor;
        }
    }
    std::cout << "Modified " << _channel_count << " * " << sample_available << "/" << _sample_count << std::endl;
}

void Test::write(uintptr_t ptr, size_t num_samples) {
    size_t num_samples_written = _buffer_write_pos - _buffer;
    size_t num_samples_writable = _sample_count - num_samples_written;

    if (num_samples_writable > 0) {
        auto input = reinterpret_cast<float *>(ptr);
        const size_t num_samples_writing = std::min(num_samples, num_samples_writable);
        for (size_t c = 0; c < _channel_count; ++c) {
            for (size_t s = 0; s < num_samples_writing; ++s) {
                _buffer[c][s] = input[s + c * num_samples];
            }
            std::cout << "Copied " << num_samples_writing << " into channel " << c << std::endl;
        }
        _buffer_write_pos += num_samples_writing;

        // BEGIN Verify
        const size_t num_samples_actual_written = std::min(num_samples, num_samples_writable);
        float sum1 = 0;
        float sum2 = 0;
        for (size_t c = 0; c < _channel_count; ++c) {
            for (size_t s = 0; s < num_samples_actual_written; ++s) {
                sum1 += input[s + c * num_samples];
                sum2 += _buffer[c][s];
            }
            std::cout << "Test::write channel " << c << "'s sum should now be sum1=" << round(sum1) << " and is sum2="
                      << round(sum2)
                      << std::endl;
        }
        // END Verify
    } else {
        std::cerr << "Out of range" << std::endl;
    }
}

void Test::read(uintptr_t ptr, size_t num_samples) {
    auto output = reinterpret_cast<float *>(ptr);
    size_t num_samples_read = _buffer_read_pos - _buffer;
    size_t num_samples_readable = _sample_count - num_samples_read;
    if (num_samples_readable > 0) {
        const size_t num_samples_reading = std::min(num_samples, num_samples_readable);
        for (size_t c = 0; c < _channel_count; ++c) {
            for (size_t s = 0; s < num_samples_reading; ++s) {
                output[s + c * num_samples] = _buffer_read_pos[c][s];
            }
            std::cout << "Read " << num_samples_reading << " from channel " << c << std::endl;

            // BEGIN Verify
            float sum1 = 0;
            float sum2 = 0;
            for (size_t s = 0; s < num_samples_reading; ++s) {
                sum1 += _buffer_read_pos[c][s];
                sum2 += output[s + c * num_samples];
            }
            std::cout << "Test::read channel " << c << "'s sum should now be sum1=" << round(sum1) << " and is sum2="
                      << round(sum2)
                      << std::endl;
            // END Verify
        }
        _buffer_read_pos += num_samples_reading;
    } else {
        std::cerr << "Out of range" << std::endl;
    }
}
