//
// Created by Tobias Hegemann on 25.11.22.
//

#include "BPMDetector.h"

BPMDetector::~BPMDetector() {
    delete _bpmDetect;
}

BPMDetector::BPMDetector(int numChannels, int sampleRate) : _bpmDetect(
        new soundtouch::BPMDetect(numChannels, sampleRate)) {
}

void BPMDetector::inputSamples(uintptr_t input_ptr, int input_size) {
    auto samples = reinterpret_cast<const soundtouch::SAMPLETYPE *>(input_ptr);
    _bpmDetect->inputSamples(samples, input_size);
}

float BPMDetector::getBpm() {
    return _bpmDetect->getBpm();
}

int BPMDetector::getBeats(uintptr_t beat_position_array_ptr, uintptr_t strength_array_ptr, int max_num) {
    auto beat_positions = reinterpret_cast<float *>(beat_position_array_ptr);
    auto strengths = reinterpret_cast<float *>(strength_array_ptr);
    return _bpmDetect->getBeats(beat_positions, strengths, max_num);
}
