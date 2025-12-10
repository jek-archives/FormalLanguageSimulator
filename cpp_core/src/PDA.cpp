#include "PDA.h"
#include <iostream>

namespace FormalSystem {

bool PDA::simulate(const std::string &input, std::vector<std::string> &log) {
  std::stack<char> st;
  int i = 0;
  log.clear();
  log.push_back("Start: Stack empty");

  // Push phase: read a's
  while (i < input.size() && input[i] == 'a') {
    st.push('A');
    log.push_back("Read 'a': Push 'A' -> Stack size: " +
                  std::to_string(st.size()));
    i++;
  }

  // Pop phase: read b's
  while (i < input.size() && input[i] == 'b') {
    if (st.empty()) {
      log.push_back("Read 'b': Stack empty! REJECT");
      return false;
    }
    st.pop();
    log.push_back("Read 'b': Pop 'A' -> Stack size: " +
                  std::to_string(st.size()));
    i++;
  }

  // Check if we consumed all input and stack is empty
  if (i == input.size() && st.empty()) {
    log.push_back("End: Stack empty. ACCEPT");
    return true;
  } else {
    if (i != input.size())
      log.push_back("End: Input not fully consumed. REJECT");
    if (!st.empty())
      log.push_back("End: Stack not empty. REJECT");
    return false;
  }
}

} // namespace FormalSystem
