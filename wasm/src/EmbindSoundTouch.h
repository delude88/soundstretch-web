//
// Created by Tobias Hegemann on 09.11.22.
//

#ifndef WASM_EMBINDSOUNDTOUCH_H
#define WASM_EMBINDSOUNDTOUCH_H

#include "../lib/soundtouch/include/SoundTouch.h"

using soundtouch::SoundTouch;

class EmbindSoundTouch : public SoundTouch {
public:
    virtual void putSamples(uintptr_t ptr, size_t nSamples);

    virtual  size_t receiveSamples(uintptr_t ptr, size_t nSamples);
};


#endif //WASM_EMBINDSOUNDTOUCH_H
