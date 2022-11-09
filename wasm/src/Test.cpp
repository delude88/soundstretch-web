//
// Created by Tobias Hegemann on 08.11.22.
//

#include <iostream>
#include "Test.h"
Test::Test(size_t size)
    : _buffer(new float[size]), _readPtr(&_buffer[0]), _writePtr(&_buffer[0]), _endPtr(&_buffer[size - 1]) {
}
Test::~Test() {
  delete[] _buffer;
}
bool Test::write(uintptr_t ptr, size_t length) {
  auto input = reinterpret_cast<const float *const>(ptr);
  std::cout << "first=" << input[0] << " center=" << input[(length / 2) - 1] << " last=" << input[length - 1]
            << " size=" << length
            << std::endl;
  // Validate
  for (size_t i = 0; i < length; ++i) {
    if (input[i] != input[i]) {
      return false;
    }
  }
  // Write
  const size_t actual = std::min(length, (size_t) (_endPtr - _writePtr));
  for (size_t i = 0; i < actual; ++i) {
    _writePtr[0] = input[i];
    _writePtr++;
  }
  std::cout << "Written " << actual << std::endl;
  return true;
}
void Test::read(uintptr_t ptr, size_t length) {
  auto output = reinterpret_cast<float *>(ptr);
  // Read
  const size_t actual = std::min(length, (size_t) (_endPtr - _readPtr));
  for (size_t i = 0; i < actual; ++i) {
    output[0] = _readPtr[i];
    _readPtr++;
  }
  std::cout << "Read " << actual << std::endl;
}
