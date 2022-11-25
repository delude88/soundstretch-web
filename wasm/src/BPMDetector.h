//
// Created by Tobias Hegemann on 25.11.22.
//

#ifndef WASM_BPMDETECTOR_H
#define WASM_BPMDETECTOR_H

#include "BPMDetect.h"

class BPMDetector {
public:
    BPMDetector(int numChannels, int sampleRate);

    ~BPMDetector();

    void inputSamples(uintptr_t input_ptr, int input_size);

    float getBpm();

    int getBeats(uintptr_t output_ptr, uintptr_t strength_ptr, int max_num);

private:
    soundtouch::BPMDetect *_bpmDetect;
};


#endif //WASM_BPMDETECTOR_H
