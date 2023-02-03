//
// Created by Tobias Hegemann on 09.11.22.
//

#include "OfflineRubberBand.h"
#include <cmath>

const RubberBand::RubberBandStretcher::Options kOptions = RubberBand::RubberBandStretcher::OptionProcessOffline |
                                                          RubberBand::RubberBandStretcher::OptionEngineFaster |
                                                          RubberBand::RubberBandStretcher::OptionPitchHighSpeed;

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

void OfflineRubberBand::setInput(uintptr_t input_ptr, size_t input_size) {
    // Init all buffers and copy input into it
    auto input = reinterpret_cast<float *>(input_ptr);
    _input_sample_size = input_size;
    _output_sample_size = lround((double) _input_sample_size * _stretcher->getTimeRatio());
    delete[] _output;
    auto channel_count = getChannelCount();
    _input = new float *[channel_count];
    _output = new float *[channel_count];
    for (size_t c = 0; c < channel_count; ++c) {
        _input[c] = new float[_input_sample_size];
        _output[c] = new float[_output_sample_size];
        float sum1 = 0;
        float sum2 = 0;
        for (size_t s = 0; s < _input_sample_size; ++s) {
            _input[c][s] = input[s + c * _input_sample_size];
            sum1 += input[s + c * _input_sample_size];
            sum2 += _input[c][s];
        }
    }
    _stretcher->study(_input, _input_sample_size, true);
    process();
}

size_t OfflineRubberBand::pull(uintptr_t output_ptr, size_t output_size) {
    auto output = reinterpret_cast<float *>(output_ptr);
    const size_t num_samples = std::min(output_size, available());

    size_t num_samples_pullable = _num_samples_processed - _num_samples_pulled;
    while (num_samples_pullable < num_samples) {
        auto num_samples_pullable_before = num_samples_pullable;
        process();
        num_samples_pullable = _num_samples_processed - _num_samples_pulled;
        if (num_samples_pullable_before <= num_samples_pullable) {
            return 0;
        }
    }
    for (size_t c = 0; c < getChannelCount(); ++c) {
        for (size_t s = 0; s < num_samples; ++s) {
            output[s + c * output_size] = _output[c][_num_samples_pulled + s];
        }
    }
    _num_samples_pulled += num_samples;
    return num_samples;
}

void OfflineRubberBand::process() {
    auto samples_required = _stretcher->getSamplesRequired();
    while (samples_required > 0) {
        for (size_t c = 0; c < getChannelCount(); ++c) {
            //TODO: CHECK IF THIS WORKS
            _scratch[c] = &_input[c][_num_samples_processed];
        }
        _stretcher->process(_scratch, samples_required,
                            _num_samples_processed >= _input_sample_size);
        _num_samples_processed += samples_required;
        samples_required = _stretcher->getSamplesRequired();
    }
    retrieve();
}

void OfflineRubberBand::retrieve() {
    auto samples_available = _stretcher->available();
    while (samples_available > 0) {
        auto actual = _stretcher->retrieve(_scratch, samples_available);
        for (size_t c = 0; c < getChannelCount(); ++c) {
            for (size_t s = 0; s < actual; ++s) {
                _output[c][_num_samples_retrieved + s] = _scratch[c][s];
            }
        }
        _num_samples_retrieved += actual;
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
    if (_output_sample_size > 0) {
        return _output_sample_size - _num_samples_pulled;
    }
    return 0;
}

size_t OfflineRubberBand::getChannelCount() const {
    return _stretcher->getChannelCount();
}
