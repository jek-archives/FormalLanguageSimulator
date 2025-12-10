#include "Utils.h"
#include <fstream>
#include <iostream>
#include <sstream>

namespace FormalSystem {

void Utils::exportToDOT(const NFA &nfa, const std::string &filename) {
  std::ofstream out(filename);
  if (!out) {
    std::cerr << "Error opening file: " << filename << "\n";
    return;
  }

  out << "digraph NFA {\n";
  out << "  rankdir=LR;\n";
  out << "  node [shape=circle];\n";

  // Highlight final states
  for (const auto &s : nfa.finalStates) {
    out << "  " << s->id << " [shape=doublecircle];\n";
  }

  out << "  start [shape=none, label=\"\"];\n";
  if (nfa.startState) {
    out << "  start -> " << nfa.startState->id << ";\n";
  }

  for (const auto &state : nfa.allStates) {
    for (const auto &[symbol, nextStates] : state->transitions) {
      for (const auto &next : nextStates) {
        out << "  " << state->id << " -> " << next->id << " [label=\"" << symbol
            << "\"];\n";
      }
    }
    for (const auto &next : state->epsilonTransitions) {
      out << "  " << state->id << " -> " << next->id << " [label=\"ε\"];\n";
    }
  }

  out << "}\n";
  out.close();
  std::cout << "Exported NFA to " << filename << "\n";
}

void Utils::exportToDOT(const DFA &dfa, const std::string &filename) {
  std::ofstream out(filename);
  if (!out) {
    std::cerr << "Error opening file: " << filename << "\n";
    return;
  }

  out << "digraph DFA {\n";
  out << "  rankdir=LR;\n";
  out << "  node [shape=circle];\n";

  for (int id : dfa.finalStateIds) {
    out << "  " << id << " [shape=doublecircle];\n";
  }

  out << "  start [shape=none, label=\"\"];\n";
  if (dfa.startStateId != -1) {
    out << "  start -> " << dfa.startStateId << ";\n";
  }

  for (const auto &[id, state] : dfa.states) {
    for (const auto &[symbol, nextId] : state.transitions) {
      out << "  " << id << " -> " << nextId << " [label=\"" << symbol
          << "\"];\n";
    }
  }

  out << "}\n";
  out.close();
  std::cout << "Exported DFA to " << filename << "\n";
}

std::string Utils::generateDOT(const NFA &nfa) {
  std::stringstream ss;
  ss << "digraph NFA {\n";
  ss << "  rankdir=LR;\n";
  ss << "  node [shape=circle];\n";

  for (const auto &s : nfa.finalStates) {
    ss << "  " << s->id << " [shape=doublecircle];\n";
  }

  ss << "  start [shape=none, label=\"\"];\n";
  if (nfa.startState) {
    ss << "  start -> " << nfa.startState->id << ";\n";
  }

  for (const auto &state : nfa.allStates) {
    for (const auto &[symbol, nextStates] : state->transitions) {
      for (const auto &next : nextStates) {
        ss << "  " << state->id << " -> " << next->id << " [label=\"" << symbol
           << "\"];\n";
      }
    }
    for (const auto &next : state->epsilonTransitions) {
      ss << "  " << state->id << " -> " << next->id << " [label=\"ε\"];\n";
    }
  }

  ss << "}\n";
  return ss.str();
}

std::string Utils::generateDOT(const DFA &dfa) {
  std::stringstream ss;
  ss << "digraph DFA {\n";
  ss << "  rankdir=LR;\n";
  ss << "  node [shape=circle];\n";

  for (int id : dfa.finalStateIds) {
    ss << "  " << id << " [shape=doublecircle];\n";
  }

  ss << "  start [shape=none, label=\"\"];\n";
  if (dfa.startStateId != -1) {
    ss << "  start -> " << dfa.startStateId << ";\n";
  }

  for (const auto &[id, state] : dfa.states) {
    for (const auto &[symbol, nextId] : state.transitions) {
      ss << "  " << id << " -> " << nextId << " [label=\"" << symbol
         << "\"];\n";
    }
  }

  ss << "}\n";
  return ss.str();
}

} // namespace FormalSystem
