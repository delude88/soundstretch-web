#!/bin/bash
# Build the wasm module

# macOS: Install dependencies via brew
if [[ $OSTYPE == 'darwin'* ]]; then
  fetch_brew_dependency() {
      FORMULA_NAME=$1

      echo "Fetching Brew dependency: '$FORMULA_NAME'."

      if brew ls --versions $FORMULA_NAME > /dev/null; then
          echo "Dependency '$FORMULA_NAME' is already installed, continuing ..."
      else
          echo "Dependency '$FORMULA_NAME' is not installed, installing via Homebrew ..."
          brew install $FORMULA_NAME
      fi
  }

  # Install required toolset
  fetch_brew_dependency "cmake"
  fetch_brew_dependency "emscripten"
fi

# Make sure we have a 'build' folder.
mkdir -p build

# Fix SoundTouch COMPILE_OPTIONS (-Ofast is not supported by em++)
sed -i '' 's/ set(COMPILE_OPTIONS -Ofast)/ #set(COMPILE_OPTIONS -Ofast)/g' lib/soundtouch/CMakeLists.txt

# Now build
emcmake cmake -B build -S .
echo "Building project ..."
cmake --build build --target wasm