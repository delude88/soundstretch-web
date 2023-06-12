#!/bin/bash
# Install required dependencies
if [ ! -d "soundtouch" ]; then
  git submodule update --init --recursive
fi

# Download and extract rubberband
export RUBBERBAND_VERSION="3.2.1"
if [ ! -d "rubberband-${RUBBERBAND_VERSION}" ]; then
  echo "Fetching rubberband"
  curl https://breakfastquay.com/files/releases/rubberband-${RUBBERBAND_VERSION}.tar.bz2 | tar -xj
fi