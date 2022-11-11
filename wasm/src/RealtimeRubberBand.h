//
// Created by Tobias Hegemann on 11.11.22.
//

#ifndef WASM_REALTIMERUBBERBAND_H
#define WASM_REALTIMERUBBERBAND_H

#include <RubberBandStretcher.h>

class RealtimeRubberBand {
public:
    explicit RealtimeRubberBand(size_t sample_rate, size_t channel_count = 1);

    ~RealtimeRubberBand();

    [[nodiscard]] size_t getChannelCount() const;

    [[nodiscard]] double getTimeRatio() const;

    [[nodiscard]] double getPitchScale() const;

    size_t available();

    void setPitchScale(double pitch_scale);

    void setTimeRatio(double time_ratio);

    void push(uintptr_t input_ptr, size_t input_size);

    size_t pull(uintptr_t output_ptr, size_t output_size);

private:
    void updateRatio();

    size_t _num_start_pad_samples = 0;
    size_t _num_start_delay_samples = 0;

    float **_scratch;

    RubberBand::RubberBandStretcher *_stretcher;

    static const size_t _kBlockSize = 1024;
    static const size_t _kReserve = 8192;
};


#endif //WASM_REALTIMERUBBERBAND_H
