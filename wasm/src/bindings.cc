#include "emscripten/bind.h"
#include "Stretcher.h"

using namespace emscripten;

EMSCRIPTEN_BINDINGS(CLASS_Stretcher) {
        class_<Stretcher>("Stretcher")
}