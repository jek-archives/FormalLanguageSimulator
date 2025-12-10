#ifndef REGEX_ENGINE_H
#define REGEX_ENGINE_H

#include "Automaton.h"
#include <string>

namespace FormalSystem {

class RegexEngine {
public:
  /**
   * @brief Converts a regex string to an NFA using Thompson's construction.
   * Supports:
   *  - Concatenation (implicit)
   *  - Union (|)
   *  - Kleene Star (*)
   *  - Parentheses ()
   */
  static NFA regexToNFA(const std::string &regex);

  /**
   * @brief Converts an NFA to a DFA using Subset Construction.
   */
  static DFA nfaToDFA(const NFA &nfa);

private:
  static std::string preprocessRegex(const std::string &regex);
  static std::string toPostfix(const std::string &regex);
  static int getPrecedence(char c);
};

} // namespace FormalSystem

#endif // REGEX_ENGINE_H
