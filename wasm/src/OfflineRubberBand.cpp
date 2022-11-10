//
// Created by Tobias Hegemann on 09.11.22.
//

#include "OfflineRubberBand.h"
#include <iostream>
#include <cmath>

const RubberBand::RubberBandStretcher::Options kOptions = RubberBand::RubberBandStretcher::OptionProcessOffline |
                                                          RubberBand::RubberBandStretcher::OptionPitchHighConsistency |
                                                          RubberBand::RubberBandStretcher::OptionEngineFiner;

OfflineRubberBand::OfflineRubberBand(size_t sample_rate, size_t channel_count,
                                     double time_ratio, double pitch_scale) {
    _stretcher = new RubberBand::RubberBandStretcher(sample_rate, channel_count, kOptions);
    _stretcher->setTimeRatio(time_ratio);
    _stretcher->setPitchScale(pitch_scale);
    _scratch = new float *[channel_count];
    for (size_t channel = 0; channel < channel_count; ++channel) {
        _scratch[channel] = new float[8196];
    }
}

OfflineRubberBand::~OfflineRubberBand() {
    delete _stretcher;
    delete[] _output;
    delete[] _scratch;
}

void OfflineRubberBand::setInput(uintptr_t input_ptr, size_t numSamples) {
    _input = reinterpret_cast<float **>(input_ptr);
    _input_size = numSamples;
    _output_size = lround((double) _input_size * _stretcher->getTimeRatio());
    _output = new float *[_stretcher->getChannelCount()];
    for (size_t channel = 0; channel < _stretcher->getChannelCount(); ++channel) {
        _output[channel] = new float[_output_size];
    }
    _input_process_ptr = _input;
    _output_write_ptr = _output;
    _output_read_ptr = _output;
    std::cout << "Studying" << std::endl;
    _stretcher->study(_input, _input_size, true);
    std::cout << "Preprocessing" << std::endl;
    process();
}

size_t OfflineRubberBand::pull(uintptr_t output_ptr, size_t numSamples) {
    auto output = reinterpret_cast<float **>(output_ptr);
    const size_t numActualSamples = std::min(numSamples, available());
    size_t numSamplesAvailableNow = _output_write_ptr - _output_read_ptr;
    while (numSamplesAvailableNow < numActualSamples) {
        auto numSamplesAvailableBefore = numSamplesAvailableNow;
        process();
        numSamplesAvailableNow = _output_write_ptr - _output_read_ptr;
        if (numSamplesAvailableBefore == numSamplesAvailableNow) {
            std::cerr << "Nothing fetched?!? Maybe timeout?" << std::endl;
            return 0;
        }
    }
    for (size_t c = 0; c < _stretcher->getChannelCount(); ++c) {
        output[c] = _output_read_ptr[c];
    }
    _output_read_ptr += numActualSamples;
    return numActualSamples;
}

void OfflineRubberBand::process() {
    auto samples_required = _stretcher->getSamplesRequired();
    while (samples_required > 0) {
        _stretcher->process(_input_process_ptr, samples_required,
                            _input_process_ptr - _input + 1 >= _input_size);
        _input_process_ptr += samples_required;
        samples_required = _stretcher->getSamplesRequired();
    }
    fetch();
}

void OfflineRubberBand::fetch() {
    auto samples_available = _stretcher->available();
    while (samples_available > 0) {
        auto actual = _stretcher->retrieve(_output_write_ptr, samples_available);
        _output_write_ptr += actual;
        samples_available = _stretcher->available();
    }
}

double OfflineRubberBand::getTimeRatio() const {
    return _stretcher->getTimeRatio();
}


double OfflineRubberBand::getPitchScale() const {
    return _stretcher->getPitchScale();
}

size_t OfflineRubberBand::available() const {
    if (_output_size > 0) {
        auto num_samples_read = _output_read_ptr - _output;
        return _output_size - num_samples_read;
    }
    return 0;
}