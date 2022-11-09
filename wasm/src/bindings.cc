#include "emscripten/bind.h"
#include "BPMDetect.h"
//#include "EmbindSoundTouch.h"
#include "SoundStretch.h"
#include "RubberBandStretcher.h"
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

                .function("setTempo",
                          &SoundStretch::setTempo)

                .function("pull",
                          &SoundStretch::pull,
                          allow_raw_pointers())

                .function("push",
                          &SoundStretch::push,
                          allow_raw_pointers());
}

/*
EMSCRIPTEN_BINDINGS(CLASS_SoundTouch) {
        class_<EmbindSoundTouch>("SoundTouch")
                .constructor()

                .class_function("getVersionId", &EmbindSoundTouch::getVersionId)
                        //.class_function("getVersionString", &EmbindSoundTouch::getVersionString)

                .function("setPitch",
                          &EmbindSoundTouch::setPitch)
                .function("setPitchOctaves",
                          &EmbindSoundTouch::setPitchOctaves)
                .function("setPitchSemiTones",
                          select_overload<void(int)>(&EmbindSoundTouch::setPitchSemiTones))
                .function("setSampleRate",
                          &EmbindSoundTouch::setSampleRate)
                .function("setRate",
                          &EmbindSoundTouch::setRate)
                .function("setRateChange",
                          &EmbindSoundTouch::setRateChange)
                .function("setTempo",
                          &EmbindSoundTouch::setTempo)
                .function("setTempoChange",
                          &EmbindSoundTouch::setTempoChange)
                .function("setChannels",
                          &EmbindSoundTouch::setChannels)
                .function("numChannels",
                          &EmbindSoundTouch::numChannels)
                .function("numSamples",
                          &EmbindSoundTouch::numSamples)
                .function("numUnprocessedSamples",
                          &EmbindSoundTouch::numUnprocessedSamples)
                .function("getInputOutputSampleRatio",
                          &EmbindSoundTouch::getInputOutputSampleRatio)
                .function("putSamples",
                          select_overload<void(uintptr_t, size_t)>(&EmbindSoundTouch::putSamples),
                          allow_raw_pointers())
                .function("receiveSamples",
                          select_overload<size_t(uintptr_t, size_t)>(&EmbindSoundTouch::receiveSamples),
                          allow_raw_pointers())
                .function("flush",
                          &EmbindSoundTouch::flush)
                .function("clear",
                          &EmbindSoundTouch::clear);
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

EMSCRIPTEN_BINDINGS(CLASS_RubberBandStretcher) {
        class_<RubberBandStretcher>("RubberBandStretcher")

                .constructor<size_t, size_t, size_t, double, double>()

                .function("pull",
                          &RubberBandStretcher::pull,
                          allow_raw_pointers())

                .function("push",
                          &RubberBandStretcher::push,
                          allow_raw_pointers());
}

EMSCRIPTEN_BINDINGS(CLASS_Test) {
        class_<Test>("Test")
                .constructor<size_t, size_t>()

                .function("write",
                          select_overload<size_t(uintptr_t, size_t)>(&Test::write),
                          allow_raw_pointers())

                .function("modify",
                          &Test::modify)

                .function("read",
                          select_overload<size_t(uintptr_t, size_t)>(&Test::read),
                          allow_raw_pointers());
}