//
// Created by Tobias Hegemann on 11.11.22.
//

#ifndef WASM_REALTIMERUBBERBAND_H
#define WASM_REALTIMERUBBERBAND_H

#include <RubberBandStretcher.h>
#include <queue>
#include "../lib/rubberband-3.0.0/src/common/RingBuffer.h"

// USE_QUEUE = [12001.] Average push time: 2.9186851211072664 Average pull time: 0.002585272287548995
// DISABLED  = [12001.] Average push time: 2.887927304197317 Average pull time: 0.0040877617418870445
//#define USE_QUEUE

class RealtimeRubberBand {
public:
    explicit RealtimeRubberBand(size_t sample_rate, size_t channel_count = 1, size_t buffer_size = 128);

    ~RealtimeRubberBand();

    [[nodiscard]] size_t getChannelCount() const;

    [[nodiscard]] size_t getSamplesRequired() const;

    [[nodiscard]] size_t getPreferredStartPad() const;

    [[nodiscard]] size_t getStartDelay() const;

    [[nodiscard]] double getTimeRatio() const;

    [[nodiscard]] double getPitchScale() const;

    void preserveFormantShave(bool enabled);

    size_t available();

    void setPitchScale(double pitch_scale);

    void setTimeRatio(double time_ratio);

    void push(uintptr_t input_ptr, size_t input_size);

    size_t pull(uintptr_t output_ptr, size_t output_size);

private:
    void buffer();

#if defined(USE_QUEUE)
    std::queue<float> **_queue;
    size_t _buffer_size;
#else
    RubberBand::RingBuffer<float> **_buffer;
#endif

    float **_scratch;

    RubberBand::RubberBandStretcher *_stretcher;

    static const size_t _kBlockSize = 1024;
    static const size_t _kReserve = 8192;
};

#endif //WASM_REALTIMERUBBERBAND_H
