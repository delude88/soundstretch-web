//
// Created by Tobias Hegemann on 09.11.22.
//

#ifndef WASM_RUBBERBANDSTRETCHER_H
#define WASM_RUBBERBANDSTRETCHER_H

#include <RubberBandStretcher.h>
#include "ChannelBuffer.h"

class RubberBandStretcher {
public:
    explicit RubberBandStretcher(size_t sample_rate,
                                 size_t sample_size,
                                 size_t channel_count = 1,
                                 double time_ratio = 1,
                                 double pitch_scale = 1
    );

    ~RubberBandStretcher();

    void push(uintptr_t input_ptr, size_t sample_size);

    size_t pull(uintptr_t output_ptr, size_t sample_size);

protected:
    void process();
    void fetch();

    ChannelBuffer* _input;
    ChannelBuffer* _output;

    float** _scratch;

    RubberBand::RubberBandStretcher *_stretcher;
};


#endif //WASM_RUBBERBANDSTRETCHER_H
