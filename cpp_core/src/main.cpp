#include <iostream>
#include <sstream>
#include <string>
#include <vector>

#include "../include/Matcher.h"
#include "../include/PDA.h"
#include "../include/RegexEngine.h"
#include "../include/Utils.h"

using namespace FormalSystem;
using namespace std;

void printHelp() {
  cout << "\nCommands:\n";
  cout << "  regex <pattern>       Build NFA and DFA from regex\n";
  cout << "  match <string>        Test string against current automata\n";
  cout << "  approx <pat> <txt> <k> Approximate match pattern in text with k "
          "errors\n";
  cout << "  pda <string>          Run PDA simulation (a^n b^n)\n";
  cout << "  export                Export current automata to DOT files\n";
  cout << "  help                  Show this help\n";
  cout << "  exit                  Exit\n";
}

int main() {
  cout << "=== Formal Language Simulator CLI ===\n";

  NFA currentNFA;
  DFA currentDFA;
  bool hasAutomata = false;
  string currentRegex = "";

  string line;
  while (true) {
    cout << "\n> ";
    if (!getline(cin, line))
      break;
    if (line.empty())
      continue;

    stringstream ss(line);
    string cmd;
    ss >> cmd;

    if (cmd == "exit") {
      break;
    } else if (cmd == "help") {
      printHelp();
    } else if (cmd == "regex") {
      string pattern;
      ss >> pattern;
      if (pattern.empty()) {
        cout << "Usage: regex <pattern>\n";
        continue;
      }
      currentRegex = pattern;
      cout << "Building automata for: " << pattern << " ...\n";
      try {
        currentNFA = RegexEngine::regexToNFA(pattern);
        currentDFA = RegexEngine::nfaToDFA(currentNFA);
        hasAutomata = true;
        cout << "Done. Use 'export' to visualize or 'match' to test.\n";
      } catch (const exception &e) {
        cout << "Error: " << e.what() << "\n";
      }

    } else if (cmd == "match") {
      if (!hasAutomata) {
        cout << "No automata built. Use 'regex' first.\n";
        continue;
      }
      string text;
      ss >> text;
      cout << "Testing '" << text << "':\n";
      cout << "  NFA: " << (currentNFA.simulate(text) ? "ACCEPT" : "REJECT")
           << "\n";
      cout << "  DFA: " << (currentDFA.simulate(text) ? "ACCEPT" : "REJECT")
           << "\n";

    } else if (cmd == "approx") {
      string pat, txt;
      int k;
      ss >> pat >> txt >> k;
      if (pat.empty() || txt.empty()) {
        cout << "Usage: approx <pattern> <text> <max_errors>\n";
        continue;
      }
      bool result = Matcher::approximateMatch(txt, pat, k);
      cout << "Approximate match (" << k
           << " errors): " << (result ? "FOUND" : "NOT FOUND") << "\n";

    } else if (cmd == "pda") {
      string input;
      ss >> input;
      PDA pda;
      vector<string> log;
      bool result = pda.simulate(input, log);
      cout << "PDA Result: " << (result ? "ACCEPT" : "REJECT") << "\n";
      cout << "Trace:\n";
      for (const auto &entry : log) {
        cout << "  " << entry << "\n";
      }

    } else if (cmd == "export") {
      if (!hasAutomata) {
        cout << "No automata built.\n";
        continue;
      }
      Utils::exportToDOT(currentNFA, "nfa.dot");
      Utils::exportToDOT(currentDFA, "dfa.dot");
      cout << "Exported to nfa.dot and dfa.dot\n";

    } else {
      cout << "Unknown command. Type 'help'.\n";
    }
  }

  return 0;
}
