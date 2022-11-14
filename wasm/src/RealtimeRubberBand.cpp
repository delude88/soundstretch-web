//
// Created by Tobias Hegemann on 11.11.22.
//

#include "RealtimeRubberBand.h"
//#include <iostream>

// See: https://breakfastquay.com/rubberband/integration.html
const RubberBand::RubberBandStretcher::Options kOptions = RubberBand::RubberBandStretcher::OptionProcessRealTime |
                                                          RubberBand::RubberBandStretcher::OptionEngineFiner |
                                                          RubberBand::RubberBandStretcher::OptionWindowShort |
                                                          RubberBand::RubberBandStretcher::OptionPitchHighConsistency |
                                                          RubberBand::RubberBandStretcher::OptionFormantPreserved;

const size_t RENDER_QUANTUM_FRAMES = 128;
const size_t MIN_BUFFER_SIZE = RENDER_QUANTUM_FRAMES;


RealtimeRubberBand::RealtimeRubberBand(size_t sample_rate, size_t channel_count) {
    _stretcher = new RubberBand::RubberBandStretcher(sample_rate, channel_count, kOptions);
    _scratch = new float *[channel_count];
#if defined(USE_QUEUE)
    _queue = new std::queue<float> *[channel_count];
#elif defined(USE_BUFFER)
    _buffer = new RubberBand::RingBuffer<float> *[channel_count];
#endif
    for (size_t c = 0; c < channel_count; ++c) {
        _scratch[c] = new float[_kBlockSize + _kReserve];
#if defined(USE_QUEUE)
        _queue[c] = new std::queue<float>();
#elif defined(USE_BUFFER)
        _buffer[c] = new RubberBand::RingBuffer<float>(MIN_BUFFER_SIZE);
#endif
    }
#if !defined(USE_QUEUE) && !defined(USE_BUFFER)
    _stretcher->setMaxProcessSize(RENDER_QUANTUM_FRAMES);
#endif
}

RealtimeRubberBand::~RealtimeRubberBand() {
    delete[] _stretcher;
#if defined(USE_QUEUE)
    delete[] _queue;
#elif defined(USE_QUEUE)
    delete[] _buffer;
#endif
}

size_t RealtimeRubberBand::available() {
#if defined(USE_QUEUE)
    return _stretcher->available() + _queue[0]->size();
#elif defined(USE_BUFFER)
    return _stretcher->available() + _buffer[0]->getReadSpace();
#else
    return _stretcher->available();
#endif
}

void RealtimeRubberBand::setPitchScale(double pitch_scale) {
    _stretcher->setPitchScale(pitch_scale);
}

void RealtimeRubberBand::setTimeRatio(double time_ratio) {
    _stretcher->setTimeRatio(time_ratio);
}

void RealtimeRubberBand::push(uintptr_t input_ptr, size_t input_size) {
    auto input = reinterpret_cast<const float *const>(input_ptr);
    for (size_t c = 0; c < getChannelCount(); ++c) {
        for (size_t s = 0; s < input_size; ++s) {
            _scratch[c][s] = input[s + c * input_size];
        }
    }
    _stretcher->process(_scratch, input_size, false);

#if defined(USE_QUEUE) || defined(USE_BUFFER)
    buffer();
#endif
}

#if defined(USE_QUEUE) || defined(USE_BUFFER)

void RealtimeRubberBand::buffer() {
    const size_t available = _stretcher->available();
    if (available) {
#if defined(USE_QUEUE)
        const auto actual = _stretcher->retrieve(_scratch, available);
        for (size_t c = 0; c < getChannelCount(); ++c) {
            for (size_t s = 0; s < actual; ++s) {
                _queue[c]->push(_scratch[c][s]);
            }
        }
#elif defined(USE_BUFFER)
        const size_t writable = _buffer[0]->getWriteSpace();
        const auto actual = _stretcher->retrieve(_scratch, std::min(writable, available));
        for (size_t c = 0; c < getChannelCount(); ++c) {
            _buffer[c]->write(_scratch[c], (int) actual);
        }
#endif
    }
}

#endif

size_t RealtimeRubberBand::getChannelCount() const {
    return _stretcher->getChannelCount();
}

size_t RealtimeRubberBand::getSamplesRequired() const {
#ifdef USE_QUEUE
    if (_queue[0]->size() >= MIN_BUFFER_SIZE) {
        return 0;
    }
#elif defined(USE_BUFFER)
    if (_buffer[0]->getReadSpace() >= _buffer[0]->getSize()) {
        return 0;
    }
#endif
    return _stretcher->getSamplesRequired();
}

size_t RealtimeRubberBand::getPreferredStartPad() const {
    return _stretcher->getPreferredStartPad();
}

size_t RealtimeRubberBand::getStartDelay() const {
    return _stretcher->getStartDelay();
}

double RealtimeRubberBand::getTimeRatio() const {
    return _stretcher->getTimeRatio();
}

double RealtimeRubberBand::getPitchScale() const {
    return _stretcher->getPitchScale();
}

size_t RealtimeRubberBand::pull(uintptr_t output_ptr, size_t output_size) {
    auto output = reinterpret_cast<float *>(output_ptr);
#if defined(USE_QUEUE) || defined(USE_BUFFER)
#if defined(USE_QUEUE)
    const auto actual = std::min(output_size, _queue[0]->size());
    for (size_t c = 0; c < getChannelCount(); ++c) {
        for (size_t s = 0; s < actual; ++s) {
            output[s + c * output_ptr] = _queue[c]->front();
            _queue[c]->pop();
        }
    }
#elif defined(USE_BUFFER)
    const auto actual = std::min(output_size, (size_t) _buffer[0]->getReadSpace());
    for (size_t c = 0; c < getChannelCount(); ++c) {
        _buffer[c]->read(&output[c * output_size], (int) actual);
    }
#endif
    buffer();
#else
    const auto actual = _stretcher->retrieve(_scratch, std::min(output_size, available()));
    for (size_t c = 0; c < getChannelCount(); ++c) {
        for (size_t s = 0; s < actual; ++s) {
            output[s + c * output_size] = _scratch[c][s];
        }
    }
#endif
    return actual;
}