#include "emscripten/bind.h"
#include "OfflineRubberBand.h"
#include "RealtimeRubberBand.h"

using namespace emscripten;

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

                .function("getSamplesRequired",
                          &RealtimeRubberBand::getSamplesRequired)

                .function("getPreferredStartPad",
                          &RealtimeRubberBand::getPreferredStartPad)

                .function("getStartDelay",
                          &RealtimeRubberBand::getStartDelay)

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
