
#include <iostream>
#include "Stretcher.h"

int main(const int nParams, const char *const paramStr[]) {
    auto *stretcher = new Stretcher();
    std::cout << "Hello stretcher " << stretcher->getVersion() << std::endl;
    stretcher->setPitch(1.2);
    stretcher->setTempo(1.2);
    delete stretcher;
}