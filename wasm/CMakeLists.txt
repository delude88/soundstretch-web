cmake_minimum_required(VERSION 3.21)
project(wasm)

#if(NOT CMAKE_CXX_COMPILER MATCHES "/em\\+\\+(-[a-zA-Z0-9.])?$")
#    message(FATAL_ERROR "You need to use emscripten for this")
#endif ()

set(CMAKE_CXX_STANDARD 17)
set(OPTIMIZATION_FLAGS "-O3 -flto -std=c++17")
if (CMAKE_CXX_COMPILER MATCHES "/em\\+\\+(-[a-zA-Z0-9.])?$")
    set(OPTIMIZATION_FLAGS "${OPTIMIZATION_FLAGS} -Wno-warn-absolute-paths  --profiling")
endif ()
set(CMAKE_CXX_FLAGS "${CMAKE_CXX_FLAGS} ${OPTIMIZATION_FLAGS}")
set(CMAKE_C_FLAGS "${CMAKE_C_FLAGS} ${OPTIMIZATION_FLAGS}")

add_subdirectory(lib/soundtouch)

add_library(soundtouchclasses
        src/SoundStretch.cpp
        src/SoundStretch.h
        src/BPMDetector.cpp
        src/BPMDetector.h
        )
target_include_directories(soundtouchclasses
        PUBLIC
        lib/soundtouch/include
        )

target_link_libraries(soundtouchclasses
        PUBLIC
        SoundTouch
        )

add_library(rubberbandofficial
        lib/rubberband-3.0.0/single/RubberBandSingle.cpp
        )
target_include_directories(rubberbandofficial
        PUBLIC
        lib/rubberband-3.0.0/rubberband)

add_library(rubberbandclasses
        src/RealtimeRubberBand.cpp
        src/RealtimeRubberBand.h
        )
target_include_directories(rubberbandclasses
        PUBLIC
        lib/rubberband-3.0.0/rubberband
        )
target_link_libraries(rubberbandclasses
        PUBLIC
        rubberbandofficial
        )

# Build test executable for cpp
add_executable(demo
        src/demo.cc
        )

target_compile_definitions(
        demo
        PUBLIC
        HAVE_VDSP)

if (APPLE)
    message(INFO "Using VDSP on macOS")
    target_link_libraries(
            demo
            PUBLIC
            "-framework Accelerate"
    )
endif (APPLE)

target_link_libraries(demo
        PUBLIC
        soundtouchclasses
        rubberbandclasses
        )

# Build final wasm executable
add_executable(soundtouch
        src/soundtouch.cc
        )

target_link_libraries(soundtouch
        PUBLIC
        soundtouchclasses
        embind
        )

set_target_properties(soundtouch
        PROPERTIES
        LINK_FLAGS
        "${OPTIMIZATION_FLAGS} \
        -s WASM=1 \
        -s ALLOW_MEMORY_GROWTH=1 \
        -s ERROR_ON_UNDEFINED_SYMBOLS=1 \
        -s ENVIRONMENT=web \
        -s AUTO_JS_LIBRARIES=0 \
        -s FILESYSTEM=0 \
        -s ASSERTIONS=0 \
        -s MODULARIZE=1 \
        -s SINGLE_FILE=1"
        )

# Build final wasm executable
add_executable(rubberband
        src/rubberband.cc
        )

target_link_libraries(rubberband
        PUBLIC
        rubberbandclasses
        embind
        )

set_target_properties(rubberband
        PROPERTIES
        LINK_FLAGS
        "${OPTIMIZATION_FLAGS} \
        -s WASM=1 \
        -s ALLOW_MEMORY_GROWTH=1 \
        -s ERROR_ON_UNDEFINED_SYMBOLS=1 \
        -s ENVIRONMENT=web \
        -s AUTO_JS_LIBRARIES=0 \
        -s FILESYSTEM=0 \
        -s ASSERTIONS=0 \
        -s MODULARIZE=1 \
        -s SINGLE_FILE=1"
        )
