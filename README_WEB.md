# Formal Language Simulator - Web GUI

This project now includes a modern Web GUI powered by WebAssembly (WASM).

## Prerequisites

- **Emscripten**: Required to compile the C++ core to WASM.
  - Install: https://emscripten.org/docs/getting_started/downloads.html
- **Python 3**: To run a local development server.

## Quick Start

1. **Make the build script executable:**
   ```bash
   chmod +x build_wasm.sh
   ```

2. **Build the WASM module:**
   ```bash
   ./build_wasm.sh
   ```
   *Note: This requires Emscripten (`emsdk`) to be installed and active in your shell.*

3. **Run the server:**
   ```bash
   python3 -m http.server 8000
   ```

4. **Launch the app:**
   Open [http://localhost:8000/web_gui/public/](http://localhost:8000/web_gui/public/) in your browser.

## Features

- **Regex Engine**: Build NFA and DFA from regular expressions.
- **Visualization**: Interactive Graphviz rendering of automata.
- **Approximate Matching**: Bio-sequence analysis with Levenshtein distance.
- **PDA Simulation**: Stack visualization for `a^n b^n` and Balanced Parentheses.
- **Academic Tools**: Formal Definitions, State Counters, and Theory mapping.

## Presentation Helper

We have included a **Presentation Script** (`PRESENTATION_SCRIPT.md`) in the root directory. Use this step-by-step guide to demonstrate the project requirements (Search, Bio, PDA) to your professor.

## Project Structure

- `cpp_core/`: C++ source code (Engine, Automata, Bindings).
- `web_gui/public/`: Web frontend (HTML, JS, CSS, WASM).
- `build_wasm.sh`: One-click compilation script.
