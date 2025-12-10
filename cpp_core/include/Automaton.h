#ifndef AUTOMATON_H
#define AUTOMATON_H

#include <iostream>
#include <map>
#include <memory>
#include <set>
#include <string>
#include <unordered_map>
#include <vector>

namespace FormalSystem {

/**
 * @brief Represents a state in an automaton.
 */
struct State {
  int id;
  bool isFinal;
  // Transitions: char -> list of next states (for NFA)
  std::unordered_map<char, std::vector<std::shared_ptr<State>>> transitions;
  // Epsilon transitions
  std::vector<std::shared_ptr<State>> epsilonTransitions;

  State(int id, bool isFinal = false) : id(id), isFinal(isFinal) {}
};

/**
 * @brief Abstract base class for automata.
 */
class Automaton {
public:
  virtual ~Automaton() = default;
  virtual bool simulate(const std::string &input) = 0;
  virtual void printTransitions() const = 0;
};

/**
 * @brief Nondeterministic Finite Automaton.
 */
class NFA : public Automaton {
public:
  std::shared_ptr<State> startState;
  std::set<std::shared_ptr<State>> finalStates;
  std::set<char> alphabet;
  std::vector<std::shared_ptr<State>> allStates; // Keep track of all states

  NFA();
  void addState(std::shared_ptr<State> state);
  void addTransition(std::shared_ptr<State> from, char symbol,
                     std::shared_ptr<State> to);
  void addEpsilonTransition(std::shared_ptr<State> from,
                            std::shared_ptr<State> to);

  bool simulate(const std::string &input) override;
  void printTransitions() const override;

private:
  void getEpsilonClosure(std::set<std::shared_ptr<State>> &currentStates);
};

/**
 * @brief Deterministic Finite Automaton.
 */
class DFA : public Automaton {
public:
  struct DFAState {
    int id;
    bool isFinal;
    std::map<char, int> transitions; // char -> next state ID
  };

  std::map<int, DFAState> states;
  int startStateId;
  std::set<int> finalStateIds;
  std::set<char> alphabet;

  DFA();
  bool simulate(const std::string &input) override;
  std::vector<int> getTrace(const std::string &input);
  void printTransitions() const override;
};

} // namespace FormalSystem

#endif // AUTOMATON_H
