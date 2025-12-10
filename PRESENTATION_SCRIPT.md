# Formal Language Simulator - Presentation Script

**Goal:** Demonstrate how the project satisfies "Topic 3: Text Search Engine and Bioinformatics".

---

## 1. Introduction (The Hook)
**Do:** Open the web app. Ensure the "About / Theory" modal is closed.
**Say:** 
> "Good morning/afternoon. For our project, we implemented a **Formal Language Simulator** that explores two main domains: **Text Search Engines** and **Bioinformatics**.
> We built a high-performance C++ core compiled to WebAssembly, wrapped in a modern web interface to visualize how different automata handle pattern recognition."

---

## 2. Text Search & Regular Grammars (Requirement: Regex -> NFA -> DFA)
**Do:** 
1. Point to the **Regex Input** card (Top Left).
2. Keep the default regex `(a|b)*abb`.
3. Click **"Generate Automata"**.
4. Point to the **NFA Diagram** (Center).

**Say:**
> "First, for the Search Engine component, we interpret user queries as **Regular Expressions**. 
> Here, the regex `(a|b)*abb` is compiled into an **NFA** (Non-deterministic Finite Automaton) using Thompson's Construction. You can see the states and epsilon transitions here."

**Do:** 
1. Click the **"DFA Diagram"** tab (Top of Visualization).
2. Point to the simplified graph.

**Say:**
> "For performance optimization, as permitted by the requirements, we convert this NFA into a **DFA** (Deterministic Finite Automaton). This minimizes the graph for O(n) search complexity."

**Do:**
1. Click the **"GRAMMAR"** tab (Bottom Right, Transitions Panel).

**Say:**
> "We also generate the **Regular Grammar** production rules for this automaton, proving mathematically that the language is indeed Regular."

---

## 3. DNA Sequence Analysis (Requirement: Approximate Matching)
**Do:**
1. Scroll to the **"Approximate Match"** card (Left Column).
2. Click the **"Start Codon"** preset (if available) or type `ATG`.
3. Set **Max Errors (k)** to `1`.
4. Type a DNA sequence like `GAT TG AAC` in the input field.
5. Click **"Run Match"**.

**Say:**
> "Moving to Bioinformatics, exact matching isn't always enough due to mutations. 
> We implemented an **Approximate Matching** engine using Levenshtein distance. This allows us to find DNA patterns (like Start Codons) even with errors, demonstrating how finite state machines extend to biological analysis."

---

## 4. Structural Analysis & Context-Free Languages (Requirement: PDA / XML)
**Do:**
1. Scroll to the **"PDA Simulation"** card (Bottom Left).
2. Select **"Balanced ()"** mode from the dropdown.
3. Type a nested string: `((()))`.
4. Click **Play** (Run).

**Say:**
> "Finally, we address structural analysis, such as validating XML documents or RNA hairpins. 
> Regular grammars cannot handle nested structures. For this, we implemented a **Pushdown Automaton (PDA)**.
> This simulation uses a stack to validate balanced delimiters, demonstrating the power of Context-Free Languages where simple Finite Automata fail."

---

## 5. Conclusion
**Do:** Click the **"About / Theory"** button in the top header.

**Say:**
> "To summarize, our application successfully implements the full hierarchy of formal languages required by Topic 3: from NFA/DFA for search, to Approximate Matching for biology, and PDAs for structural parsing."

> "Thank you. Do you have any questions?"
