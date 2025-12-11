# Project Defense Q&A Cheat Sheet

**Purpose:** Prepare for questions your professor might ask during the demo.

---

## 🏛️ Theoretical Questions (The Basics)

**Q: Why do we convert NFA to DFA? Why not just use the NFA?**
**A:** "Performance. Searching with an NFA requires tracking a *set* of active states at every step (slow, O(m*n)), or backtracking. A DFA has exactly one active state at a time, making search extremely fast (O(n), linear to input length), which is critical for search engines."

**Q: What is the downside of converting to DFA?**
**A:** "State Explosion. In the worst case, the number of DFA states can be $2^n$ (exponential) relative to the NFA. For complex regular expressions, the DFA might use too much memory."

**Q: Why is `a^n b^n` or Balanced Parentheses NOT a Regular Language?**
**A:** "Because Finite Automata have limited memory (finite states). They cannot 'count' to infinity to ensure the number of $a$'s matches the number of $b$'s. A Pushdown Automaton (PDA) solves this by adding a **Stack** (infinite memory)."

---

## 🧬 Bioinformatics & Algorithms

**Q: How does your 'Approximate Matching' work?**
**A:** "It uses the **Levenshtein Distance** algorithm (or Edit Distance). We count the minimum number of insertions, deletions, or substitutions needed to transform the substring into the pattern. If this cost is $\le k$, it's a match."

**Q: Why use a formal grammar for Regex?**
**A:** "It proves the language structure. By converting our automaton transitions ($q_0 \xrightarrow{a} q_1$) into production rules ($Q_0 \rightarrow aQ_1$), we demonstrate that every NFA/DFA corresponds to a Type-3 Right-Linear Grammar in the Chomsky Hierarchy."

---

## 🛠️ Implementation & "Outside the Box" Questions

**Q: Why did you use C++ and WebAssembly instead of just JavaScript?**
**A:** "Two reasons: **Performance** and **Portability**.
1. C++ gives us raw memory control for the automaton graph structures.
2. Compiling to WebAssembly (WASM) allows this high-performance code to run in the browser at near-native speed, which would be essential if we were processing gigabytes of DNA data."

**Q: Can your system recognize *any* language?**
**A:** "No. It is strictly for **Regular** (Regex) and **Context-Free** (PDA) languages. It cannot handle **Context-Sensitive** languages (like $a^n b^n c^n$) which require a Linear Bounded Automaton, or undecidable problems which require a Turing Machine."

**Q: How would you scale this to search the entire Human Genome (3 billion letters)?**
**A:** "A standard DFA might be too big. We would likely switch to an **Aho-Corasick** automaton for multi-pattern searching, or use an indexed approach like a **Suffix Tree** or **Burrows-Wheeler Transform**, which are industry standards for bio-indexing."

**Q: What happens if I put a 'Lookahead' or 'Backreference' in your Regex?**
**A:** "Our engine supports *mathematical* Regular Expressions (Concat, Union, Kleene Star). Features like 'backreferences' actually make regex non-regular (NP-Complete). Our system strictly implements the Formal Language definition, not the PCRE (Perl) extended definition."

---

## 💡 Quick Definitions

*   **$\epsilon$-transition:** Moving to a new state without consuming any input character.
*   **Alphabet ($\Sigma$):** The set of allowed symbols (e.g., $\{a, b\}$ or $\{A, C, G, T\}$).
*   **Trap State:** A non-final state from which you can never escape (used in DFAs for invalid inputs).
