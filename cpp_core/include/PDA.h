#ifndef PDA_H
#define PDA_H

#include <stack>
#include <string>
#include <vector>

namespace FormalSystem {

class PDA {
public:
  /**
   * @brief Simulates a PDA for the language a^n b^n.
   * Logs stack operations for visualization.
   */
  bool simulate(const std::string &input, std::vector<std::string> &log);
};

} // namespace FormalSystem

#endif // PDA_H
