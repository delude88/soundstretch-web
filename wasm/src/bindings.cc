#include "emscripten/bind.h"
#include "SoundTouch.h"
#include "BPMDetect.h"

using namespace emscripten;

using soundtouch::SoundTouch;
using soundtouch::BPMDetect;

EMSCRIPTEN_BINDINGS(CLASS_SoundTouch) {
        class_<SoundTouch>("SoundTouch")
                .constructor()

                .class_function("getVersionId", &SoundTouch::getVersionId)
                //.class_function("getVersionString", &SoundTouch::getVersionString)

                .function("setPitch",
                          &SoundTouch::setPitch)
                .function("setPitchOctaves",
                          &SoundTouch::setPitchOctaves)
                .function("setPitchSemiTones",
                          select_overload<void(int)>(&SoundTouch::setPitchSemiTones))
                .function("setSampleRate",
                          &SoundTouch::setSampleRate)
                .function("setRate",
                          &SoundTouch::setRate)
                .function("setRateChange",
                          &SoundTouch::setRateChange)
                .function("setTempo",
                          &SoundTouch::setTempo)
                .function("setTempoChange",
                          &SoundTouch::setTempoChange)
                .function("setChannels",
                          &SoundTouch::setChannels)
                .function("numChannels",
                          &SoundTouch::numChannels)
                .function("numSamples",
                          &SoundTouch::numSamples)
                .function("numUnprocessedSamples",
                          &SoundTouch::numUnprocessedSamples)
                .function("getInputOutputSampleRatio",
                          &SoundTouch::getInputOutputSampleRatio)
                .function("putSamples",
                          &SoundTouch::putSamples,
                          allow_raw_pointers())
                .function("receiveSamples",
                          select_overload<uint(soundtouch::SAMPLETYPE*, uint)>(&SoundTouch::receiveSamples),
                          allow_raw_pointers())
                .function("flush",
                          &SoundTouch::flush)
                .function("clear",
                          &SoundTouch::clear);
}


EMSCRIPTEN_BINDINGS(CLASS_BPMDetect) {
        class_<BPMDetect>("BPMDetect")
                .constructor<int, int>()

                .function("inputSamples",
                          &BPMDetect::inputSamples,
                          allow_raw_pointers())
                .function("getBpm",
                          &BPMDetect::getBpm)
                .function("getBeats",
                          &BPMDetect::getBeats,
                          allow_raw_pointers());
}