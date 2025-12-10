#include "Automaton.h"
#include <algorithm>
#include <iomanip>
#include <queue>

namespace FormalSystem {

// ====================== NFA Implementation ======================

NFA::NFA() : startState(nullptr) {}

void NFA::addState(std::shared_ptr<State> state) {
  allStates.push_back(state);
  if (state->isFinal) {
    finalStates.insert(state);
  }
}

void NFA::addTransition(std::shared_ptr<State> from, char symbol,
                        std::shared_ptr<State> to) {
  from->transitions[symbol].push_back(to);
  alphabet.insert(symbol);
}

void NFA::addEpsilonTransition(std::shared_ptr<State> from,
                               std::shared_ptr<State> to) {
  from->epsilonTransitions.push_back(to);
}

void NFA::getEpsilonClosure(std::set<std::shared_ptr<State>> &currentStates) {
  std::queue<std::shared_ptr<State>> q;
  for (const auto &s : currentStates) {
    q.push(s);
  }

  while (!q.empty()) {
    auto current = q.front();
    q.pop();

    for (const auto &next : current->epsilonTransitions) {
      if (currentStates.find(next) == currentStates.end()) {
        currentStates.insert(next);
        q.push(next);
      }
    }
  }
}

bool NFA::simulate(const std::string &input) {
  if (!startState)
    return false;

  std::set<std::shared_ptr<State>> currentStates;
  currentStates.insert(startState);
  getEpsilonClosure(currentStates);

  for (char c : input) {
    std::set<std::shared_ptr<State>> nextStates;
    for (const auto &s : currentStates) {
      if (s->transitions.count(c)) {
        for (const auto &next : s->transitions.at(c)) {
          nextStates.insert(next);
        }
      }
    }

    if (nextStates.empty())
      return false;

    getEpsilonClosure(nextStates);
    currentStates = nextStates;
  }

  for (const auto &s : currentStates) {
    if (s->isFinal)
      return true;
  }
  return false;
}

void NFA::printTransitions() const {
  std::cout << "\n=== NFA Transitions ===\n";
  for (const auto &state : allStates) {
    for (const auto &[symbol, nextStates] : state->transitions) {
      for (const auto &next : nextStates) {
        std::cout << "  State " << state->id << " --" << symbol << "--> State "
                  << next->id << "\n";
      }
    }
    for (const auto &next : state->epsilonTransitions) {
      std::cout << "  State " << state->id << " --(eps)--> State " << next->id
                << "\n";
    }
  }
  std::cout << "Start State: "
            << (startState ? std::to_string(startState->id) : "None") << "\n";
  std::cout << "Final States: ";
  for (const auto &s : finalStates)
    std::cout << s->id << " ";
  std::cout << "\n=======================\n";
}

// ====================== DFA Implementation ======================

DFA::DFA() : startStateId(-1) {}

bool DFA::simulate(const std::string &input) {
  if (startStateId == -1)
    return false;

  int current = startStateId;
  for (char c : input) {
    if (states.find(current) == states.end())
      return false;
    if (states.at(current).transitions.find(c) ==
        states.at(current).transitions.end()) {
      return false;
    }
    current = states.at(current).transitions.at(c);
  }
  return finalStateIds.count(current);
}

std::vector<int> DFA::getTrace(const std::string &input) {
  std::vector<int> trace;
  if (startStateId == -1)
    return trace;

  int current = startStateId;
  trace.push_back(current);

  for (char c : input) {
    if (states.find(current) == states.end())
      break;
    if (states.at(current).transitions.find(c) ==
        states.at(current).transitions.end()) {
      break;
    }
    current = states.at(current).transitions.at(c);
    trace.push_back(current);
  }
  return trace;
}

void DFA::printTransitions() const {
  std::cout << "\n=== DFA Transitions ===\n";
  for (const auto &[id, state] : states) {
    for (const auto &[symbol, nextId] : state.transitions) {
      std::cout << "  State " << id << " --" << symbol << "--> State " << nextId
                << "\n";
    }
  }
  std::cout << "Start State: " << startStateId << "\n";
  std::cout << "Final States: ";
  for (int id : finalStateIds)
    std::cout << id << " ";
  std::cout << "\n=======================\n";
}

} // namespace FormalSystem
