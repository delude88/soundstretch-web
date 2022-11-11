//
// Created by Tobias Hegemann on 09.11.22.
//

#ifndef WASM_OFFLINERUBBERBAND_H
#define WASM_OFFLINERUBBERBAND_H

#include <RubberBandStretcher.h>

class OfflineRubberBand {
public:
    explicit OfflineRubberBand(size_t sample_rate,
                               size_t channel_count = 1,
                               double time_ratio = 1,
                               double pitch_scale = 1
    );

    ~OfflineRubberBand();

    size_t getChannelCount() const;

    [[nodiscard]] double getTimeRatio() const;

    [[nodiscard]] double getPitchScale() const;

    [[nodiscard]] size_t available() const;

    void setInput(uintptr_t input_ptr, size_t input_size);

    size_t pull(uintptr_t output_ptr, size_t output_size);

protected:
    void process();

    void retrieve();

    float **_input = nullptr;
    size_t _input_sample_size = 0;
    float **_output = nullptr;
    size_t _output_sample_size = 0;

    size_t _num_samples_processed = 0;
    size_t _num_samples_retrieved = 0;
    size_t _num_samples_pulled = 0;

    float **_scratch;

    RubberBand::RubberBandStretcher *_stretcher;
};


#endif //WASM_OFFLINERUBBERBAND_H
