# Topic 3: Testing & Verification Guide

This guide covers how to verify the three key requirements for **Topic 3: Text Search Engine and Bioinformatics**.

Open the simulator in your browser (http://localhost:8000) to begin.

---

## 1. Text Search Engine (Regular Languages)
**Objective:** Verify Regex compilation (Regex → NFA → DFA) and exact string matching.

### Step 1: Regex Compilation
1.  Locate the **Regex Engine** card (Top Left).
2.  Enter the pattern: `(a|b)*abb`
    *   *Explanation:* Matches any string of a's and b's that ends in "abb".
3.  Click **"Generate Automata"**.
4.  **Verify Visualization:**
    *   Look at the **Main Diagram** (Right Panel). It should show a graph of nodes and arrows.
    *   Click the **"NFA Diagram"** tab: You should see a larger graph with ε (epsilon) transitions.
    *   Click the **"DFA Diagram"** tab: You should see a minimized graph (fewer states) with no ε-transitions.

### Step 2: Exact Matching
1.  Locate the **Test Matching** card (Middle Left).
2.  Enter a matching string: `aaabb` -> Click **"Test Match"**.
    *   **Result:** Should show a green **MATCH** badge in the Execution Log.
3.  Enter a non-matching string: `aaaba` -> Click **"Test Match"**.
    *   **Result:** Should show a red **NO MATCH** badge.

---

## 2. Bioinformatics (Approximate Matching)
**Objective:** Verify finding patterns in DNA sequences with errors (Levenshtein Distance).

### Step 1: Approximate Search
1.  Locate the **Approximate Match** card (Middle Left, purple icon).
2.  **Scenario:** We want to find the pattern "TAG" in the DNA sequence "GATTACA", allowing for 1 error.
    *   **Search Text:** `GATTACA`
    *   **Max Errors (k):** `1`
    *   (Note: The UI Regex field is used as the *Pattern* for this mode, but it treats the input as a **literal string**, not a Regex). Enter `TAG` in the **Regex Engine** input field.
3.  Click **"Run Match (Levenshtein)"**.
4.  **Verify Result:**
    *   Check the Execution Log. It should likely return **MATCH** because "TAC" (substring of GATTACA) is 1 edit distance from "TAG".

### Step 2: Bio Presets
1.  Click the **"TATA Box"** button under "Bioinformatics" in the Regex card.
    *   This auto-fills a TATA-like pattern and a random DNA sequence with a mutation.
2.  The system will auto-run.

    *   **Search Text:** `CCGGTATAAAAGGC`
    *   **Max Errors (k):** `1`
    *   **Pattern:** The preset will auto-fill `TATAAAA` (a literal string) into the Regex field.
3.  **Verify Result:** You should see a **MATCH (k=...* results in the log used for biological signal detection.

---

## 3. Structural Analysis (Pushdown Automata)
**Objective:** Verify parsing of Context-Free Languages (nested structures) which Regular Expressions cannot handle.

### Step 1: Classical `a^n b^n`
1.  Locate the **PDA Simulation** card (Bottom Left, orange icon).
2.  Ensure dropdown is set to **aⁿbⁿ**.
3.  Enter: `aaabbb` (3 a's, 3 b's). Click **Run**.
    *   **Result:** **ACCEPTED**.
4.  Enter: `aaabb` (3 a's, 2 b's). Click **Run**.
    *   **Result:** **REJECTED**.

### Step 2: RNA Secondary Structure (Dot-Bracket Notation)
1.  Change the dropdown to **Balanced ()**.
    *   **Scientific Context:** This simulates validating **RNA folding**. In bioinformatics "Dot-Bracket Notation", a `(` represents a base pairing with a `)`, and `.` represents an unpaired loop.
    *   *Regular Expressions cannot validate this because they cannot count or ensure nesting.*
2.  **Scenario:** Simulate a "Hairpin Loop".
3.  Enter: `((...))` -> Click **Run**.
    *   **Result:** **ACCEPTED**.
    *   *Explanation:* The outer `(` match the outer `)`, and the inner `...` are the loop (ignored/unpaired).
4.  **Scenario:** Simulate a Broken Fold (Mismatched).
5.  Enter: `((...)` -> Click **Run**.
    *   **Result:** **REJECTED** (Missing closing base).
6.  **Verify Stack Trace:** The log shows how the computer uses a **Stack** to "remember" the open bases until it finds their partners.
