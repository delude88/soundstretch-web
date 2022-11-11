//
// Created by Tobias Hegemann on 11.11.22.
//

#include "RealtimeRubberBand.h"
#include <iostream>

const RubberBand::RubberBandStretcher::Options kOptions = RubberBand::RubberBandStretcher::OptionProcessRealTime |
                                                          RubberBand::RubberBandStretcher::OptionPitchHighConsistency |
                                                          RubberBand::RubberBandStretcher::OptionEngineFiner;

RealtimeRubberBand::RealtimeRubberBand(size_t sample_rate, size_t channel_count) {
    _stretcher = new RubberBand::RubberBandStretcher(sample_rate, channel_count, kOptions);
    _scratch = new float *[channel_count];
    for (size_t c = 0; c < channel_count; ++c) {
        _scratch[c] = new float[_kBlockSize + _kReserve];
    }
    updateRatio();
}

RealtimeRubberBand::~RealtimeRubberBand() {
    delete _stretcher;
}

size_t RealtimeRubberBand::available() {
    return _stretcher->available();
}

void RealtimeRubberBand::setPitchScale(double pitch_scale) {
    _stretcher->setPitchScale(pitch_scale);
    updateRatio();
}

void RealtimeRubberBand::setTimeRatio(double time_ratio) {
    _stretcher->setTimeRatio(time_ratio);
    updateRatio();
}

void RealtimeRubberBand::push(uintptr_t input_ptr, size_t input_size) {
    auto *input = reinterpret_cast<const float *const>(input_ptr);
    //float sum = 0;
    for (size_t c = 0; c < getChannelCount(); ++c) {
        for (size_t s = 0; s < input_size; ++s) {
            _scratch[c][s] = input[s + c * input_size];
            //sum += input[s + c * input_size];
        }
    }
    _stretcher->process(_scratch, input_size, false);
    //std::cout << "sum=" << sum << std::endl;
}

void RealtimeRubberBand::updateRatio() {
    _num_start_pad_samples = _stretcher->getPreferredStartPad();
    _num_start_delay_samples = _stretcher->getStartDelay();
}

size_t RealtimeRubberBand::getChannelCount() const {
    return _stretcher->getChannelCount();
}

double RealtimeRubberBand::getTimeRatio() const {
    return _stretcher->getTimeRatio();
}

double RealtimeRubberBand::getPitchScale() const {
    return _stretcher->getPitchScale();
}

size_t RealtimeRubberBand::pull(uintptr_t output_ptr, size_t output_size) {
    auto *output = reinterpret_cast<float *>(output_ptr);
    const auto actual = _stretcher->retrieve(_scratch, std::min(output_size, available()));
    for (size_t c = 0; c < getChannelCount(); ++c) {
        for (size_t s = 0; s < actual; ++s) {
            output[s + c * output_size] = _scratch[c][s];
        }
    }
    return actual;
}

