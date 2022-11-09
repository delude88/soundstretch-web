//
// Created by Tobias Hegemann on 08.11.22.
//

#ifndef WASM_TEST_H
#define WASM_TEST_H

#include <cstddef>
#include <cstdint>

class Test {
 public:
  explicit Test(size_t size);
  ~Test();

  bool write(uintptr_t ptr, size_t length);

  void read(uintptr_t ptr, size_t length);

 private:
  float *_buffer;
  float *_writePtr;
  float *_readPtr;
  const float* _endPtr;
};

#endif //WASM_TEST_H
