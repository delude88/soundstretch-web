//
// Created by Tobias Hegemann on 25.10.22.
//

#ifndef SOUNDSTRETCH_WEB_STRETCHER_H
#define SOUNDSTRETCH_WEB_STRETCHER_H

#include "../lib/soundtouch/include/SoundTouch.h"
#include <queue>

using soundtouch::SoundTouch;

class SoundStretch {
public:
    explicit SoundStretch(size_t sampleRate, size_t channel_count = 1);

    ~SoundStretch();

    static size_t getVersion();

    void setTempo(double tempo);

    void setPitch(double pitch);

    void setPitchSemiTones(double pitch);

    void setRate(double rate);

    void push(uintptr_t input_ptr, size_t sample_size);

    size_t pull(uintptr_t output_ptr, size_t sample_size);

    size_t available() const;

private:
    void buffer();

    soundtouch::SAMPLETYPE *_scratch;
    std::queue<float> **_queue;

    SoundTouch *_sound_touch;
};


#endif //SOUNDSTRETCH_WEB_STRETCHER_H
