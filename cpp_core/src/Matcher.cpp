#include "Matcher.h"
#include <algorithm>
#include <iostream>
#include <vector>

namespace FormalSystem {

bool Matcher::approximateMatch(const std::string &text,
                               const std::string &pattern, int maxErrors) {
  int n = text.size();
  int m = pattern.size();

  // DP table: dp[i][j] = min edits to match pattern[0..j-1] with text ending at
  // i Note: Standard Levenshtein is for full string. For substring search, we
  // initialize first row to 0. However, the requirement says "Approximate
  // Pattern Matching", usually implying substring search. But the previous
  // implementation was: for (int j = 0; j <= m; j++) dp[0][j] = j; for (int i =
  // 1; i <= n; i++) dp[i][0] = 0; This looks like it allows starting anywhere
  // in text (cost 0) but must match full pattern.

  std::vector<std::vector<int>> dp(n + 1, std::vector<int>(m + 1));

  for (int j = 0; j <= m; j++) {
    dp[0][j] = j; // Cost to match pattern prefix with empty text prefix
  }

  for (int i = 1; i <= n; i++) {
    dp[i][0] = 0; // Cost to match empty pattern with text prefix (0 because we
                  // can start match anywhere)
    for (int j = 1; j <= m; j++) {
      if (text[i - 1] == pattern[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1];
      } else {
        dp[i][j] = 1 + std::min({
                           dp[i - 1][j],    // Deletion
                           dp[i][j - 1],    // Insertion
                           dp[i - 1][j - 1] // Substitution
                       });
      }
    }
  }

  // Check if any ending position in text satisfies the maxErrors constraint
  for (int i = m; i <= n;
       i++) { // Must match at least m chars roughly? No, i can be anything >= 0
              // technically but usually >= m-k
    // Actually, we just check the last column for any row i
    if (dp[i][m] <= maxErrors) {
      return true;
    }
  }

  // Also check smaller prefixes if pattern is longer than text? No, usually not
  // for search. But let's stick to the logic: "Can we find pattern in text with
  // <= k errors?" The loop `for (int i = 0; i <= n; i++)` checking `dp[i][m]`
  // is correct for substring search. The previous code started loop at m, which
  // is a safe optimization.

  for (int i = 0; i <= n; i++) {
    if (dp[i][m] <= maxErrors)
      return true;
  }

  return false;
}

} // namespace FormalSystem
