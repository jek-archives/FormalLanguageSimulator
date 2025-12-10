# Formal Language Simulator - Web GUI

This project now includes a modern Web GUI powered by WebAssembly (WASM).

## Prerequisites

- **Emscripten**: Required to compile the C++ core to WASM.
  - Install: https://emscripten.org/docs/getting_started/downloads.html
- **Python 3**: To run a local development server.

## Building the WASM Module

1. Open a terminal in the project root.
2. Run the build script:
   ```
   ./build_wasm.sh
   ```
   This will generate `web_gui/public/wasm/formal_sim.js` and `formal_sim.wasm`.

## Running the Web GUI

1. Start a local server:
   ```
   python3 -m http.server 8000
   ```
2. Open your browser to:
   [http://localhost:8000/web_gui/public/](http://localhost:8000/web_gui/public/)

## Features

- **Regex Engine**: Build NFA and DFA from regular expressions.
- **Visualization**: Interactive Graphviz rendering of automata.
- **Approximate Matching**: Test strings with Levenshtein distance.
- **PDA Simulation**: Visualize stack operations for Context-Free Grammars (e.g., $a^n b^n$).
- **Premium UI**: Dark mode, glassmorphism, and responsive design.

## Project Structure

- `cpp_core/src/wasm_bindings.cpp`: C++ bindings for Emscripten.
- `web_gui/public/`: Static assets (HTML, WASM).
- `web_gui/src/`: Frontend source (CSS, JS).
- `build_wasm.sh`: Compilation script.
