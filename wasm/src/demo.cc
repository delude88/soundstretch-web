
#include <iostream>
#include "SoundStretch.h"

int main(const int nParams, const char *const paramStr[]) {
    auto buffer_size = 128;
    auto channel_count = 2;
    auto *stretcher = new SoundStretch(channel_count);
    std::cout << "Hello stretcher " << stretcher->getVersion() << std::endl;
    stretcher->setPitch(1.2);
    stretcher->setTempo(1.2);
    auto my_samples = new float *[channel_count];
    for (size_t channel = 0; channel < channel_count; ++channel) {
        my_samples[channel] = new float[128];
        for(size_t sample = 0; sample < buffer_size; ++sample) {
            my_samples[channel][sample] = sample / buffer_size;
        }
    }
    auto my_sample_pointer = reinterpret_cast<uintptr_t>(my_samples);
    stretcher->push(my_sample_pointer, buffer_size);
    stretcher->push(my_sample_pointer, buffer_size);
    stretcher->push(my_sample_pointer, buffer_size);
    stretcher->push(my_sample_pointer, buffer_size);
    std::cout << "Have now " << stretcher->getSamplesAvailable() << " samples" << std::endl;
    delete stretcher;
}