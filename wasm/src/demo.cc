
#include <iostream>
#include <chrono>
#include <thread>
#include "SoundStretch.h"
#include "RealtimeRubberBand.h"

void testRubberBand() {
    auto sample_rate = 48000;
    auto buffer_size = 128;
    auto channel_count = 2;
    auto length = 4;
    auto samples_count = sample_rate * length;
    auto rubberBand = new RealtimeRubberBand(sample_rate, channel_count, buffer_size);

    auto input = new float[channel_count * samples_count];
    float max_sample_value = (float) samples_count * channel_count;
    for (size_t channel = 0; channel < channel_count; ++channel) {
        for (size_t sample = 0; sample < samples_count; ++sample) {
            float sample_value = (float) sample + channel * samples_count;
            input[sample + channel * samples_count] = sample_value / max_sample_value;
        }
    }

    std::cout << "Reading and writing "<< channel_count <<" with " << samples_count << " samples each" << std::endl;

    // Simulating writing 128 at each frame and reading 128 at each frame
    size_t write_pos = 0;
    size_t read_pos = 0;
    auto output = new float[channel_count * samples_count];


    auto start_pad = rubberBand->getPreferredStartPad();
    auto start_delay = rubberBand->getStartDelay();
    std::cout << "start_pad=" << start_pad << " start_delay=" << start_delay << std::endl;

    do {
        // Add start pad if applicable
        if(start_pad > 0) {
            auto pad = new float[channel_count * start_pad];
            rubberBand->push(reinterpret_cast<uintptr_t>(&pad[0]), start_pad);
            delete[] pad;
            std::cout << "Written " << start_pad << " start pad samples" << std::endl;
            start_pad = 0;
        }

        // Write
        if(write_pos < samples_count) {
            rubberBand->push(reinterpret_cast<uintptr_t>(&input[write_pos]), buffer_size);
            write_pos += buffer_size;
        }

        if(start_delay > 0) {
            // Skip start delay first
            if(rubberBand->available() >= start_delay) {
                auto actual = rubberBand->pull(reinterpret_cast<uintptr_t>(&output[0]), start_delay);
                std::cout << "Skipped " << actual << " of " << start_delay << " start delay samples!" << std::endl;
                start_delay -= actual;
            }
        } else {
            // Read
            if(rubberBand->available() >= buffer_size) {
                read_pos += rubberBand->pull(reinterpret_cast<uintptr_t>(&output[read_pos]), buffer_size);
            }
        }

    } while( write_pos < samples_count);

    std::this_thread::sleep_for(std::chrono::milliseconds(100));

    // Finally read again
    while(rubberBand->available() > 0) {
        read_pos += rubberBand->pull(reinterpret_cast<uintptr_t>(&output[read_pos]), buffer_size);
    }

    std::cout << "done!" << std::endl;

    std::cout << "readpos=" << read_pos << " writepos=" << write_pos << " difference=" << write_pos - read_pos << std::endl;

    delete rubberBand;
}

void testSoundStretch() {
    auto buffer_size = 128;
    auto channel_count = 2;
    auto *stretcher = new SoundStretch(48000, channel_count);
    std::cout << "Hello stretcher " << SoundStretch::getVersion() << std::endl;
    stretcher->setPitch(1.2);
    stretcher->setTempo(1.2);
    auto my_samples = new float *[channel_count];
    for (size_t channel = 0; channel < channel_count; ++channel) {
        my_samples[channel] = new float[128];
        for (size_t sample = 0; sample < buffer_size; ++sample) {
            my_samples[channel][sample] = sample / buffer_size;
        }
    }
    auto my_sample_pointer = reinterpret_cast<uintptr_t>(my_samples);
    stretcher->push(my_sample_pointer, buffer_size);
    stretcher->push(my_sample_pointer, buffer_size);
    stretcher->push(my_sample_pointer, buffer_size);
    stretcher->push(my_sample_pointer, buffer_size);
    std::cout << "Have now " << stretcher->available() << " samples" << std::endl;
    delete stretcher;
}

int main(const int nParams, const char *const paramStr[]) {
    testRubberBand();
    return 0;
}