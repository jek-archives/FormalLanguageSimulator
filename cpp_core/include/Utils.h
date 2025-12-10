#ifndef UTILS_H
#define UTILS_H

#include "Automaton.h"
#include <string>

namespace FormalSystem {

class Utils {
public:
  static void exportToDOT(const NFA &nfa, const std::string &filename);
  static void exportToDOT(const DFA &dfa, const std::string &filename);

  // WASM-friendly string generation
  static std::string generateDOT(const NFA &nfa);
  static std::string generateDOT(const DFA &dfa);
};

} // namespace FormalSystem

#endif // UTILS_H
