#include "emscripten/bind.h"
#include "BPMDetect.h"
//#include "EmbindSoundTouch.h"
#include "SoundStretch.h"
#include "OfflineRubberBand.h"
#include "RealtimeRubberBand.h"
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

EMSCRIPTEN_BINDINGS(CLASS_OfflineRubberBand) {
        class_<OfflineRubberBand>("OfflineRubberBand")

                .constructor<size_t, size_t, double, double>()

                .function("getChannelCount",
                          &OfflineRubberBand::getChannelCount)

                .function("getTimeRatio",
                          &OfflineRubberBand::getTimeRatio)

                .function("getPitchScale",
                          &OfflineRubberBand::getPitchScale)

                .function("available",
                          &OfflineRubberBand::available)

                .function("setInput",
                          &OfflineRubberBand::setInput,
                          allow_raw_pointers())

                .function("pull",
                          &OfflineRubberBand::pull,
                          allow_raw_pointers())
        ;
}

EMSCRIPTEN_BINDINGS(CLASS_RealtimeRubberBand) {
        class_<RealtimeRubberBand>("RealtimeRubberBand")

                .constructor<size_t, size_t>()

                .function("getChannelCount",
                          &RealtimeRubberBand::getChannelCount)

                .function("getTimeRatio",
                          &RealtimeRubberBand::getTimeRatio)

                .function("getPitchScale",
                          &RealtimeRubberBand::getPitchScale)

                .function("setTimeRatio",
                          &RealtimeRubberBand::setTimeRatio)

                .function("setPitchScale",
                          &RealtimeRubberBand::setPitchScale)

                .function("available",
                          &RealtimeRubberBand::available)

                .function("push",
                          &RealtimeRubberBand::push,
                          allow_raw_pointers())

                .function("pull",
                          &RealtimeRubberBand::pull,
                          allow_raw_pointers())
        ;
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