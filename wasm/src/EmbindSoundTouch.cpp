//
// Created by Tobias Hegemann on 09.11.22.
//
#include "EmbindSoundTouch.h"

void EmbindSoundTouch::putSamples(uintptr_t ptr, size_t nSamples) {
    auto samples = reinterpret_cast<const soundtouch::SAMPLETYPE *>(ptr);
    SoundTouch::putSamples(samples, (uint) nSamples);
}

size_t EmbindSoundTouch::receiveSamples(uintptr_t ptr, size_t nSamples) {
    auto samples = reinterpret_cast<soundtouch::SAMPLETYPE *const>(ptr);
    return SoundTouch::receiveSamples(samples, nSamples);
}