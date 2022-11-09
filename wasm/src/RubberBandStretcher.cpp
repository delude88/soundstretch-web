//
// Created by Tobias Hegemann on 09.11.22.
//

#include "RubberBandStretcher.h"
#include <iostream>
#include <cmath>

const RubberBand::RubberBandStretcher::Options kOptions = RubberBand::RubberBandStretcher::OptionProcessOffline |
                                                          RubberBand::RubberBandStretcher::OptionPitchHighConsistency |
                                                          RubberBand::RubberBandStretcher::OptionEngineFiner;

RubberBandStretcher::RubberBandStretcher(size_t sample_rate, size_t sample_size, size_t channel_count,
                                         double time_ratio, double pitch_scale) {
    _stretcher = new RubberBand::RubberBandStretcher(sample_rate, channel_count, kOptions);
    _stretcher->setTimeRatio(time_ratio);
    _stretcher->setPitchScale(pitch_scale);
    _input = new ChannelBuffer(sample_size, channel_count);
    const size_t output_size = lround(sample_size * time_ratio);
    _output = new ChannelBuffer(output_size, channel_count);
    std::cout << sample_size << "*" << time_ratio << " = " << output_size << std::endl;
    _scratch = new float *[channel_count];
    for (size_t channel = 0; channel < channel_count; ++channel) {
        _scratch[channel] = new float[8196];
    }
}

RubberBandStretcher::~RubberBandStretcher() {
    delete _stretcher;
    delete _input;
    delete _output;
    delete[] _scratch;
}

void RubberBandStretcher::push(uintptr_t input_ptr, size_t length) {
    _input->write(input_ptr, length);
    if (_input->numSamplesWritable() == 0) {
        // Study all
        std::cout << "Studying" << std::endl;
        _stretcher->study(reinterpret_cast<const float *const *>(_input->buffer()), _input->numSamples(), true);
        process();
    }
}

size_t RubberBandStretcher::pull(uintptr_t output_ptr, size_t length) {
    const size_t sample_size = length / _stretcher->getChannelCount();
    if (_output->numSamples() >= sample_size) {
        while (_output->numSamplesReadable() < sample_size) {
            auto before = _output->numSamplesReadable();
            process();
            if (before == _output->numSamplesReadable()) {
                std::cerr << "Nothing fetched?!?" << std::endl;
                break;
            }
        }
        std::cout << "Processed enough" << std::endl;
        return _output->read(output_ptr, length);
    } else {
        std::cerr << "Requested sample_size=" << sample_size << " is larger than actual=" << _output->numSamples()
                  << std::endl;
    }
    return 0;
}

void RubberBandStretcher::process() {
    size_t counter = 0;
    auto samples_required = _stretcher->getSamplesRequired();
    while (samples_required > 0) {
        _input->read(_scratch[0], samples_required);
        _stretcher->process(_scratch, samples_required,
                            _input->numSamplesReadable() == 0);
        counter += samples_required;
        samples_required = _stretcher->getSamplesRequired();
    }
    fetch();
}

void RubberBandStretcher::fetch() {
    size_t counter = 0;
    auto samples_available = _stretcher->available();
    while (samples_available > 0) {
        auto actual = _stretcher->retrieve(_scratch, samples_available);
        _output->write(_scratch[0], actual);
        counter += actual;
        samples_available = _stretcher->available();
    }
}

