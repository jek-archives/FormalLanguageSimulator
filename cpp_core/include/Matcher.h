#ifndef MATCHER_H
#define MATCHER_H

#include <string>

namespace FormalSystem {

class Matcher {
public:
  /**
   * @brief Checks if the pattern matches the text with at most maxErrors
   * (Levenshtein distance).
   */
  static bool approximateMatch(const std::string &text,
                               const std::string &pattern, int maxErrors);
};

} // namespace FormalSystem

#endif // MATCHER_H
