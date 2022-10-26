cmake_minimum_required(VERSION 3.21)
project(wasm)

#if(NOT CMAKE_CXX_COMPILER MATCHES "/em\\+\\+(-[a-zA-Z0-9.])?$")
#    message(FATAL_ERROR "You need to use emscripten for this")
#endif ()

set(CMAKE_CXX_STANDARD 17)
set(OPTIMIZATION_FLAGS "-O3 -flto -std=c++17")
if(CMAKE_CXX_COMPILER MATCHES "/em\\+\\+(-[a-zA-Z0-9.])?$")
    set(OPTIMIZATION_FLAGS "${OPTIMIZATION_FLAGS} -Wno-warn-absolute-paths  --profiling")
endif ()
set(CMAKE_CXX_FLAGS "${CMAKE_CXX_FLAGS} ${OPTIMIZATION_FLAGS}")
set(CMAKE_C_FLAGS "${CMAKE_C_FLAGS} ${OPTIMIZATION_FLAGS}")

add_subdirectory(lib/soundtouch)

# Common library providing simplified soundtouch classes
add_library(stretcher
        src/SoundStretch.cpp
        src/SoundStretch.h
)

target_include_directories(stretcher
        PUBLIC
        lib/soundtouch/include
        )

target_link_libraries(stretcher
        PUBLIC
        SoundTouch
        )

# Build test executable for cpp
add_executable(demo
        src/demo.cc
        )

target_link_libraries(demo
        PUBLIC
        stretcher
        )

# Build final wasm executable
add_executable(wasm
        src/bindings.cc
        )

target_link_libraries(wasm
        PUBLIC
        stretcher
        embind
        )

set_target_properties(wasm
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