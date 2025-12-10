#include "RegexEngine.h"
#include <algorithm>
#include <iostream>
#include <map>
#include <queue>
#include <set>
#include <stack>
#include <stdexcept>
#include <vector>

namespace FormalSystem {

// Helper to generate unique state IDs
static int stateCounter = 0;
static int generateStateId() { return stateCounter++; }

static void resetStateCounter() { stateCounter = 0; }

// ====================== Regex Preprocessing ======================

// Insert explicit concatenation operators '.'
std::string RegexEngine::preprocessRegex(const std::string &regex) {
  // Simple check for empty regex
  if (regex.empty())
    return "";

  std::string result;
  for (size_t i = 0; i < regex.length(); ++i) {
    char c1 = regex[i];
    result += c1;

    if (i + 1 < regex.length()) {
      char c2 = regex[i + 1];
      // Add '.' if:
      // 1. c1 is NOT '(' or '|'
      // 2. c2 is NOT ')' or '|' or '*'
      bool c1_is_operand = (c1 != '(' && c1 != '|');
      bool c2_is_operand = (c2 != ')' && c2 != '|' && c2 != '*');

      if (c1_is_operand && c2_is_operand) {
        result += '.';
      } else if (c1 == '*' && c2_is_operand) {
        result += '.';
      } else if (c1 == ')' && c2_is_operand) {
        result += '.';
      }
    }
  }
  return result;
}

int RegexEngine::getPrecedence(char c) {
  if (c == '*')
    return 3;
  if (c == '.')
    return 2;
  if (c == '|')
    return 1;
  return 0;
}

std::string RegexEngine::toPostfix(const std::string &regex) {
  std::string postfix;
  std::stack<char> operators;
  std::string processed = preprocessRegex(regex);

  for (char c : processed) {
    if (isalnum(c)) {
      postfix += c;
    } else if (c == '(') {
      operators.push(c);
    } else if (c == ')') {
      while (!operators.empty() && operators.top() != '(') {
        postfix += operators.top();
        operators.pop();
      }
      if (operators.empty()) {
        throw std::runtime_error("Mismatched parentheses: Missing '('");
      }
      operators.pop(); // Pop '('
    } else {
      while (!operators.empty() &&
             getPrecedence(operators.top()) >= getPrecedence(c)) {
        postfix += operators.top();
        operators.pop();
      }
      operators.push(c);
    }
  }

  while (!operators.empty()) {
    if (operators.top() == '(') {
      throw std::runtime_error("Mismatched parentheses: Missing ')'");
    }
    postfix += operators.top();
    operators.pop();
  }
  return postfix;
}

// ====================== Thompson's Construction ======================

NFA RegexEngine::regexToNFA(const std::string &regex) {
  resetStateCounter();
  std::string postfix = toPostfix(regex);
  std::stack<NFA> stack;

  for (char c : postfix) {
    if (isalnum(c)) {
      // Base case: Single character transition
      NFA nfa;
      auto start = std::make_shared<State>(generateStateId());
      auto end = std::make_shared<State>(generateStateId(), true);
      nfa.addState(start);
      nfa.addState(end);
      nfa.addTransition(start, c, end);
      nfa.startState = start;
      nfa.finalStates.insert(end);
      stack.push(nfa);
    } else if (c == '.') {
      // Concatenation
      if (stack.size() < 2)
        throw std::runtime_error(
            "Invalid regex: concatenation missing operands");
      NFA right = stack.top();
      stack.pop();
      NFA left = stack.top();
      stack.pop();

      // Connect left's final states to right's start state via epsilon
      for (auto &finalState : left.finalStates) {
        finalState->isFinal = false;
        left.addEpsilonTransition(finalState, right.startState);
      }

      // Merge states
      left.allStates.insert(left.allStates.end(), right.allStates.begin(),
                            right.allStates.end());
      left.finalStates = right.finalStates;
      left.alphabet.insert(right.alphabet.begin(), right.alphabet.end());

      stack.push(left);

    } else if (c == '|') {
      // Union
      if (stack.size() < 2)
        throw std::runtime_error("Invalid regex: union '|' missing operands");
      NFA bottom = stack.top();
      stack.pop();
      NFA top = stack.top();
      stack.pop();

      NFA result;
      auto start = std::make_shared<State>(generateStateId());
      auto end = std::make_shared<State>(generateStateId(), true);
      result.addState(start);
      result.addState(end);

      // Connect new start to both starts
      result.addEpsilonTransition(start, top.startState);
      result.addEpsilonTransition(start, bottom.startState);

      // Connect both finals to new end
      for (auto &s : top.finalStates) {
        s->isFinal = false;
        top.addEpsilonTransition(s, end);
      }
      for (auto &s : bottom.finalStates) {
        s->isFinal = false;
        bottom.addEpsilonTransition(s, end);
      }

      // Merge all
      result.allStates.insert(result.allStates.end(), top.allStates.begin(),
                              top.allStates.end());
      result.allStates.insert(result.allStates.end(), bottom.allStates.begin(),
                              bottom.allStates.end());
      result.alphabet.insert(top.alphabet.begin(), top.alphabet.end());
      result.alphabet.insert(bottom.alphabet.begin(), bottom.alphabet.end());
      result.finalStates.insert(end);
      result.startState = start;

      stack.push(result);

    } else if (c == '*') {
      // Kleene Star
      if (stack.empty())
        throw std::runtime_error("Invalid regex: '*' missing operand");
      NFA inner = stack.top();
      stack.pop();

      NFA result;
      auto start = std::make_shared<State>(generateStateId());
      auto end = std::make_shared<State>(generateStateId(), true);
      result.addState(start);
      result.addState(end);

      // Epsilon from new start to inner start
      result.addEpsilonTransition(start, inner.startState);
      // Epsilon from new start to new end (0 occurrences)
      result.addEpsilonTransition(start, end);

      // Epsilon from inner finals to inner start (loop)
      // Epsilon from inner finals to new end
      for (auto &s : inner.finalStates) {
        s->isFinal = false;
        inner.addEpsilonTransition(s, inner.startState);
        inner.addEpsilonTransition(s, end);
      }

      result.allStates.insert(result.allStates.end(), inner.allStates.begin(),
                              inner.allStates.end());
      result.alphabet = inner.alphabet;
      result.finalStates.insert(end);
      result.startState = start;

      stack.push(result);
    }
  }

  if (stack.empty())
    return NFA(); // Should ideally handle empty regex more gracefully or above

  NFA result = stack.top();

  // Renumber states: Start efficient BFS to assign IDs 0, 1, 2...
  // This ensures Start State is always 0 and graph looks ordered Left-to-Right.
  if (result.startState) {
    std::set<std::shared_ptr<State>> visited;
    std::queue<std::shared_ptr<State>> q;
    int newId = 0;

    // First pass: Reachable states via BFS
    q.push(result.startState);
    visited.insert(result.startState);
    result.startState->id = newId++;

    while (!q.empty()) {
      auto curr = q.front();
      q.pop();

      // Collect neighbors to visit in a stable order (optional but nice)
      // Epsilon transitions first
      for (auto &next : curr->epsilonTransitions) {
        if (visited.find(next) == visited.end()) {
          visited.insert(next);
          next->id = newId++;
          q.push(next);
        }
      }
      // Symbol transitions
      // iterate over map, maybe sort by char? map is sorted by key (char)
      for (auto &[symbol, nextStates] : curr->transitions) {
        for (auto &next : nextStates) {
          if (visited.find(next) == visited.end()) {
            visited.insert(next);
            next->id = newId++;
            q.push(next);
          }
        }
      }
    }

    // Second pass: Any unreachable states (shouldn't happen in standard regex
    // NFA but for safety)
    for (auto &s : result.allStates) {
      if (visited.find(s) == visited.end()) {
        s->id = newId++;
      }
    }
  }

  return result;
}

// ====================== Subset Construction ======================

DFA RegexEngine::nfaToDFA(const NFA &nfa) {
  DFA dfa;
  dfa.alphabet = nfa.alphabet;

  // Helper to convert set of state IDs to a unique key (sorted vector)
  auto getSetKey = [](const std::set<std::shared_ptr<State>> &states) {
    std::vector<int> ids;
    for (const auto &s : states)
      ids.push_back(s->id);
    std::sort(ids.begin(), ids.end());
    return ids;
  };

  std::map<std::vector<int>, int> dfaStateMap; // Key -> DFA State ID
  std::queue<std::set<std::shared_ptr<State>>> queue;

  // Initial state closure
  std::set<std::shared_ptr<State>> startSet;
  if (nfa.startState)
    startSet.insert(nfa.startState);

  // We need a way to call getEpsilonClosure from here.
  // Since it's private in NFA, we can either make it public or duplicate logic.
  // For cleaner code, let's assume we can use a helper or modify NFA.
  // Actually, NFA::simulate does it. Let's duplicate the logic briefly or make
  // it static helper. For now, I'll implement a local helper.

  auto epsilonClosure = [](std::set<std::shared_ptr<State>> &states) {
    std::queue<std::shared_ptr<State>> q;
    for (auto s : states)
      q.push(s);
    while (!q.empty()) {
      auto curr = q.front();
      q.pop();
      for (auto next : curr->epsilonTransitions) {
        if (states.find(next) == states.end()) {
          states.insert(next);
          q.push(next);
        }
      }
    }
  };

  epsilonClosure(startSet);

  int dfaIdCounter = 0;
  dfaStateMap[getSetKey(startSet)] = dfaIdCounter;
  dfa.startStateId = dfaIdCounter;
  dfa.states[dfaIdCounter] = {dfaIdCounter, false, {}};

  // Check if start state is final
  for (auto s : startSet) {
    if (s->isFinal) {
      dfa.states[dfaIdCounter].isFinal = true;
      dfa.finalStateIds.insert(dfaIdCounter);
      break;
    }
  }

  queue.push(startSet);
  dfaIdCounter++;

  while (!queue.empty()) {
    auto currentSet = queue.front();
    queue.pop();
    int currentDfaId = dfaStateMap[getSetKey(currentSet)];

    for (char symbol : dfa.alphabet) {
      std::set<std::shared_ptr<State>> nextSet;
      for (const auto &s : currentSet) {
        if (s->transitions.count(symbol)) {
          for (const auto &next : s->transitions.at(symbol)) {
            nextSet.insert(next);
          }
        }
      }

      if (nextSet.empty())
        continue;
      epsilonClosure(nextSet);

      auto key = getSetKey(nextSet);
      if (dfaStateMap.find(key) == dfaStateMap.end()) {
        dfaStateMap[key] = dfaIdCounter;
        dfa.states[dfaIdCounter] = {dfaIdCounter, false, {}};

        for (auto s : nextSet) {
          if (s->isFinal) {
            dfa.states[dfaIdCounter].isFinal = true;
            dfa.finalStateIds.insert(dfaIdCounter);
            break;
          }
        }

        queue.push(nextSet);
        dfaIdCounter++;
      }

      dfa.states[currentDfaId].transitions[symbol] = dfaStateMap[key];
    }
  }

  return dfa;
}

} // namespace FormalSystem
