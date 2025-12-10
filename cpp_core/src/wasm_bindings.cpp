#include "Matcher.h"
#include "PDA.h"
#include "RegexEngine.h"
#include "Utils.h"
#include <emscripten/bind.h>

using namespace emscripten;
using namespace FormalSystem;

// Wrapper for PDA simulation to return result and log easily
struct PDAResult {
  bool accepted;
  std::vector<std::string> log;
};

PDAResult simulatePDAWrapper(const std::string &input) {
  PDA pda;
  std::vector<std::string> log;
  bool res = pda.simulate(input, log);
  return {res, log};
}

// Helper to disambiguate overloaded functions
std::string generateDOT_NFA(const NFA &nfa) { return Utils::generateDOT(nfa); }

std::string generateDOT_DFA(const DFA &dfa) { return Utils::generateDOT(dfa); }

EMSCRIPTEN_BINDINGS(formal_system) {
  register_vector<std::string>("StringList");
  register_vector<int>("IntList");

  value_object<PDAResult>("PDAResult")
      .field("accepted", &PDAResult::accepted)
      .field("log", &PDAResult::log);

  // Register opaque handles for NFA and DFA
  // We use smart pointers in the C++ code, but here we just need to pass the
  // objects around. RegexEngine returns objects by value, so we register them
  // as value types or classes. Since they are copyable, class_ is fine.
  class_<NFA>("NFA").function("simulate", &NFA::simulate);
  class_<DFA>("DFA")
      .function("simulate", &DFA::simulate)
      .function("getTrace", &DFA::getTrace);

  class_<RegexEngine>("RegexEngine")
      .class_function("regexToNFA", &RegexEngine::regexToNFA)
      .class_function("nfaToDFA", &RegexEngine::nfaToDFA);

  class_<Matcher>("Matcher").class_function("approximateMatch",
                                            &Matcher::approximateMatch);

  // Utils is a static class, but we can expose functions directly or as class
  // functions Exposing as free functions for simplicity in JS, or attached to a
  // Utils object. Let's attach to a Utils-like namespace in JS or just export
  // functions. emscripten::function exports to Module.functionName

  function("generateDOT_NFA", &generateDOT_NFA);
  function("generateDOT_DFA", &generateDOT_DFA);
  function("simulatePDA", &simulatePDAWrapper);
}
