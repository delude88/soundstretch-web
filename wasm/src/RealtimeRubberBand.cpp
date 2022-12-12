//
// Created by Tobias Hegemann on 11.11.22.
//

#include "RealtimeRubberBand.h"

// See: https://breakfastquay.com/rubberband/integration.html
const RubberBand::RubberBandStretcher::Options kOptions = RubberBand::RubberBandStretcher::OptionProcessRealTime |
                                                          RubberBand::RubberBandStretcher::OptionEngineFiner |
                                                          //                                                          RubberBand::RubberBandStretcher::OptionWindowShort |
                                                          RubberBand::RubberBandStretcher::OptionPitchHighConsistency;

RealtimeRubberBand::RealtimeRubberBand(size_t sample_rate, size_t channel_count, size_t buffer_size) {
    _stretcher = new RubberBand::RubberBandStretcher(sample_rate, channel_count, kOptions);
    _scratch = new float *[channel_count];
#if defined(USE_QUEUE)
    _queue = new std::queue<float> *[channel_count];
    _buffer_size = buffer_size;
#else
    _buffer = new RubberBand::RingBuffer<float> *[channel_count];
#endif
    for (size_t c = 0; c < channel_count; ++c) {
        _scratch[c] = new float[_kBlockSize + _kReserve];
#if defined(USE_QUEUE)
        _queue[c] = new std::queue<float>();
#else
        _buffer[c] = new RubberBand::RingBuffer<float>((int) buffer_size);
#endif
    }
}

RealtimeRubberBand::~RealtimeRubberBand() {
    delete _stretcher;
    delete[] _scratch;
#if defined(USE_QUEUE)
    delete[] _queue;
#else
    delete[] _buffer;
#endif
}

size_t RealtimeRubberBand::available() {
#if defined(USE_QUEUE)
    return _stretcher->available() + _queue[0]->size();
#else
    return _stretcher->available() + _buffer[0]->getReadSpace();
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

    buffer();
}

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
#else
        const size_t writable = _buffer[0]->getWriteSpace();
        const auto actual = _stretcher->retrieve(_scratch, std::min(writable, available));
        for (size_t c = 0; c < getChannelCount(); ++c) {
            _buffer[c]->write(_scratch[c], (int) actual);
        }
#endif
    }
}

size_t RealtimeRubberBand::getChannelCount() const {
    return _stretcher->getChannelCount();
}

size_t RealtimeRubberBand::getSamplesRequired() const {
#ifdef USE_QUEUE
    if (_queue[0]->size() >= _buffer_size) {
      return 0;
    }
#else
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
#if defined(USE_QUEUE)
    const auto actual = std::min(output_size, _queue[0]->size());
    for (size_t c = 0; c < getChannelCount(); ++c) {
      float sum = 0;
      for (size_t s = 0; s < actual; ++s) {
        output[s + c * output_size] = _queue[c]->front();
        sum += output[s + c * output_size];
        _queue[c]->pop();
      }
     }
#else
    const auto actual = std::min(output_size, (size_t) _buffer[0]->getReadSpace());
    for (size_t c = 0; c < getChannelCount(); ++c) {
        _buffer[c]->read(&output[c * output_size], (int) actual);
    }
#endif
    buffer();
    return actual;
}

void RealtimeRubberBand::preserveFormantShave(bool enabled) {
    _stretcher->setFormantOption(enabled ? RubberBand::RubberBandStretcher::OptionFormantPreserved
                                         : RubberBand::RubberBandStretcher::OptionFormantShifted);
}
