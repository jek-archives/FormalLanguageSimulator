# Project Defense Q&A Cheat Sheet

**Purpose:** Prepare for questions your professor might ask during the demo.

---

## 🏛️ Theoretical Questions (The Basics)

**Q: Why do we convert NFA to DFA? Why not just use the NFA?**
**A:** "Performance. Searching with an NFA requires tracking a *set* of active states at every step (slow, O(m*n)), or backtracking. A DFA has exactly one active state at a time, making search extremely fast (O(n), linear to input length), which is critical for search engines."

**Q: What is the downside of converting to DFA?**
**A:** "State Explosion. In the worst case, the number of DFA states can be $2^n$ (exponential) relative to the NFA. For complex regular expressions, the DFA might use too much memory."

**Q: Why is `a^n b^n` or Balanced Parentheses NOT a Regular Language?**
**A:** "Because Finite Automata have limited memory (finite states). They cannot 'count' to infinity to ensure the number of $a$'s matches the number of $b$'s.
*   **Analogy:** It's like trying to pair socks without a basket—you need a place to hold them.
*   **RNA Context:** In biology, this validates **Dot-Bracket Notation** (`((...))`). The PDA's **Stack** 'remembers' the opening bases to ensure they are properly closed by a matching base later in the sequence."

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

---

## 💀 DEAN / HARD MODE QUESTIONS (Technical & Limits)

**Q: "This is nice for a toy example. But if I give you a 4GB FASTA file (Human Genome), your browser will crash. How do you handle REAL scale?"**
**A:** "You are absolutely correct. My current implementation loads the entire string into RAM for the Levenshtein Matrix ($O(m*n)$ space).
*   **The Problem:** A 4GB string $\times$ 100-char pattern = 400GB matrix. Crash.
*   **The Solution:** For production, I would not use dynamic programming. I would use **BLAST (Basic Local Alignment Search Tool)** heuristics or verify matches using **Bit-Parallelism (Myers' Algorithm)** which packs rows into 64-bit integers, speeding it up by 64x and reducing memory drastically."

**Q: "Your PDA validates parentheses. But real XML has tags like `<foo>` and `</foo>`. A PDA can't match arbitrary strings on the stack, only symbols. How do you explain that?"**
**A:** "That is a subtle but excellent point. A pure theoretical PDA pushes single symbols. To validate XML tags:
1.  We need a **Lexer** first to tokenize `<foo>` into a symbol like `A` and `</foo>` into `A'`.
2.  Then the PDA checks the structure `A A'`.
3.  Without a Lexer, checking if string $w$ matches string $w^R$ (reversal) over an infinite alphabet is actually harder, but for a known set of tags, tokenization maps it back to the Context-Free problem I demonstrated."

**Q: "Show me a case where your Levenshtein algorithm fails or gives a 'wrong' biological answer."**
**A:** "The Levenshtein algorithm strictly minimizes *edits*. It treats a Transition ($A \leftrightarrow G$) the same cost as a Transversion ($A \leftrightarrow T$). In real biology, Transitions are much more common. My engine would say they are equal distance, but a biologist would say the Transition is a 'better' match. To fix this, I would need a **Weighted Scoring Matrix** (like BLOSUM62) instead of simple +1 cost."

**Q: "What is the Time Complexity of your Regex Engine? Can I ReDoS (Regex Denial of Service) it?"**
**A:** "Actually, **NO**, you cannot ReDoS my engine!
*   **My Engine:** Uses **Thompson's Construction**, which guarantees simulation in $O(m \times n)$ time (where $m$ is regex length, $n$ is string length). It is immune to catastrophic backtracking."

**Q: "Can I type actual XML tags like `<div>` instead of just `(`?"**
**A:** "In this demo, we map tags to parentheses abstractly: `<tag>` becomes `(` and `</tag>` becomes `)`. To support raw XML text, I would simply add a **Lexer** (Tokenizer) step before the PDA to convert the string `<div class='foo'>` into a single token `OPEN_TAG`. The underlying PDA logic remains exactly the same."

---

## 📚 Deep Dive: Pushdown Automata (PDA)

**Q: "I see you have two PDA modes. Why is the ^n b^n$ mode in C++ but the XML mode in JavaScript?"**
**A:** "A keen observation. I designed it this way to demonstrate two different architectural approaches:
1.  **Strict Performance (^n b^n$):** The C++ backend implements a rigorous, symbol-by-symbol PDA. This is ideal for millions of operations where every CPU cycle counts.
2.  **Practical Application (XML):** The XML validator requires *tokenization* (converting `<tag>` to tokens) before the PDA logic. Doing this in JavaScript allows for immediate, responsive user feedback in the UI without the overhead of round-tripping strings to WebAssembly for simple text transformation."

**Q: "Why can't I just use a simple integer counter to validate parentheses? Why do I need a stack?"**
**A:** "If we only had one type of parenthesis `(`, a counter would suffice (Increment on `(`, Decrement on `)`).
*   **HOWEVER:** As soon as we introduce multiple types (like `[]` and `()`), a counter fails. `([)]` would pass a counter check (1 open `(`, 1 open `[`, then closed both), but it is structurally invalid.
*   A **Stack** enforces *order*: The last item opened MUST be the first item closed (LIFO), which is mathematically required for Context-Free Languages."

**Q: "Walk me through the error states. How does the PDA know *exactly* why it failed?"**
**A:** "There are three distinct failure modes my simulation detects:
1.  **Mismatch Error:** We read a closing character `)` but the top of the stack matches a different type (e.g., `[`). *Immediate Reject.*
2.  **Empty Stack Error:** We read a closing character `)` but the stack is already empty. *Means: Too many closing tags.*
3.  **Input Consumed Error:** We finished reading the input, but the stack is NOT empty. *Means: Unclosed tags remaining.*"

**Q: "Is HTML a Context-Free Language? Can your PDA validate it?"**
**A:** "Strictly speaking, **No**. HTML5 is Context-Sensitive (and messy!) because of features like 'void tags' (<br> has no closing tag) and forgiving parsing rules.
*   **However:** My PDA perfectly validates **XHTML** or strictly-formed XML, which *is* a Context-Free Language because every tag must be strictly nested."

**Q: "Why do I have to type structure like `((...))`? Why can't I just type `CCCAAAGGG` and have you tell me the folding?"**
**A:** "That would require strictly *predicting* the fold, which is the **RNA Folding Problem** (solved by the Nussinov Algorithm using (n^3)$ dynamic programming).
*   **Our Scope:** This project demonstrates **Automata Theory**. A PDA is inherently a *Validator*, not an optimization solver. Its job is to take a proposed structure (dot-bracket notation) and verify if it is topologically possible (i.e., balanced and context-free)."
