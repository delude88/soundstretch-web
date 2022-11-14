//
// Created by Tobias Hegemann on 11.11.22.
//

#ifndef WASM_REALTIMERUBBERBAND_H
#define WASM_REALTIMERUBBERBAND_H

#include <RubberBandStretcher.h>
#include <queue>
#include "../lib/rubberband-3.0.0/src/common/RingBuffer.h"

#define USE_BUFFER
//#define USE_QUEUE

#if defined(USE_QUEUE) || defined(USE_BUFFER)
#define BUFFERING
#endif

class RealtimeRubberBand {
public:
    explicit RealtimeRubberBand(size_t sample_rate, size_t channel_count = 1);

    ~RealtimeRubberBand();

    [[nodiscard]] size_t getChannelCount() const;

    [[nodiscard]] size_t getSamplesRequired() const;

    [[nodiscard]] size_t getPreferredStartPad() const;

    [[nodiscard]] size_t getStartDelay() const;

    [[nodiscard]] double getTimeRatio() const;

    [[nodiscard]] double getPitchScale() const;

    size_t available();

    void setPitchScale(double pitch_scale);

    void setTimeRatio(double time_ratio);

    void push(uintptr_t input_ptr, size_t input_size);

    size_t pull(uintptr_t output_ptr, size_t output_size);

private:
#if defined(USE_QUEUE) || defined(USE_BUFFER)
    void buffer();
#endif

#if defined(USE_QUEUE)
    std::queue<float> **_queue;
#elif defined(USE_BUFFER)
    RubberBand::RingBuffer<float> **_buffer;
#endif

    float **_scratch;

    RubberBand::RubberBandStretcher *_stretcher;

    static const size_t _kBlockSize = 1024;
    static const size_t _kReserve = 8192;
};


#endif //WASM_REALTIMERUBBERBAND_H
