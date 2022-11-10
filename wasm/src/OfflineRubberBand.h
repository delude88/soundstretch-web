//
// Created by Tobias Hegemann on 09.11.22.
//

#ifndef WASM_OFFLINERUBBERBAND_H
#define WASM_OFFLINERUBBERBAND_H

#include <RubberBandStretcher.h>
#include "ChannelBuffer.h"

class OfflineRubberBand {
public:
    explicit OfflineRubberBand(size_t sample_rate,
                               size_t channel_count = 1,
                               double time_ratio = 1,
                               double pitch_scale = 1
    );

    ~OfflineRubberBand();

    [[nodiscard]] double getTimeRatio() const;

    [[nodiscard]] double getPitchScale() const;

    [[nodiscard]] size_t available() const;

    void setInput(uintptr_t input_ptr, size_t sample_size);

    size_t pull(uintptr_t output_ptr, size_t sample_size);

protected:
    void process();

    void fetch();

    float **_input = nullptr;
    float **_input_process_ptr = nullptr;
    size_t _input_size = 0;

    float **_output = nullptr;
    float **_output_write_ptr = nullptr;
    float **_output_read_ptr = nullptr;
    size_t _output_size = 0;

    float **_scratch;

    RubberBand::RubberBandStretcher *_stretcher;
};


#endif //WASM_OFFLINERUBBERBAND_H
