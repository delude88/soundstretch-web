//
// Created by Tobias Hegemann on 25.10.22.
//

#ifndef SOUNDSTRETCH_WEB_STRETCHER_H
#define SOUNDSTRETCH_WEB_STRETCHER_H

#include "../lib/soundtouch/include/SoundTouch.h"
#include "../lib/soundtouch/include/FIFOSampleBuffer.h"

using soundtouch::SoundTouch;
using soundtouch::FIFOSampleBuffer;

class Stretcher {
public:
    explicit Stretcher(size_t sampleRate, size_t channel_count = 1);
    ~Stretcher();

    const char * getVersion();

    void setTempo(double tempo);

    void setPitch(double tempo);

    __attribute__((unused)) size_t getSamplesAvailable();

    void push(uintptr_t input_ptr, size_t sample_size);

    __attribute__((unused)) void pull(uintptr_t output_ptr, size_t sample_size);

private:
    void fetchProcessed();

    SoundTouch *sound_touch_;
    size_t sample_rate_;

    FIFOSampleBuffer *output_buffer_;
};


#endif //SOUNDSTRETCH_WEB_STRETCHER_H
