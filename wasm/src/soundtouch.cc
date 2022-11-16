#include "emscripten/bind.h"
#include "BPMDetect.h"
#include "SoundStretch.h"
#include "SoundTouch.h"
#include "Test.h"

using namespace emscripten;

using soundtouch::SoundTouch;
using soundtouch::BPMDetect;

EMSCRIPTEN_BINDINGS(CLASS_SoundStretch) {
        class_<SoundStretch>("SoundStretch")

                .constructor<size_t, size_t>()

                .class_function("getVersion", &SoundStretch::getVersion)

                .function("setPitch",
                          &SoundStretch::setPitch)

                .function("setPitchSemiTones",
                          &SoundStretch::setPitchSemiTones)

                .function("setTempo",
                          &SoundStretch::setTempo)

                .function("setRate",
                          &SoundStretch::setRate)

                .function("available",
                          &SoundStretch::available)

                .function("pull",
                          &SoundStretch::pull,
                          allow_raw_pointers())

                .function("push",
                          &SoundStretch::push,
                          allow_raw_pointers());
}

/*
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
                          select_overload<void(uintptr_t, size_t)>(&SoundTouch::putSamples),
                          allow_raw_pointers())
                .function("receiveSamples",
                          select_overload<size_t(uintptr_t, size_t)>(&SoundTouch::receiveSamples),
                          allow_raw_pointers())
                .function("flush",
                          &SoundTouch::flush)
                .function("clear",
                          &SoundTouch::clear);
}
 */

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

EMSCRIPTEN_BINDINGS(CLASS_Test) {
        class_<Test>("Test")
                .constructor<size_t, size_t>()

                .function("write",
                          &Test::write,
                          allow_raw_pointers())

                .function("modify",
                          &Test::modify)

                .function("read",
                          &Test::read,
                          allow_raw_pointers());
}