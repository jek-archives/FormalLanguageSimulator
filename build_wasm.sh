#!/bin/bash

# Source Emscripten environment
source ./emsdk/emsdk_env.sh

# Create output directory
mkdir -p web_gui/public/wasm

# Compile C++ to WASM
# We exclude main.cpp because we don't want the CLI entry point
echo "Compiling C++ to WASM..."

emcc -Icpp_core/include \
    cpp_core/src/Automaton.cpp \
    cpp_core/src/Matcher.cpp \
    cpp_core/src/PDA.cpp \
    cpp_core/src/RegexEngine.cpp \
    cpp_core/src/Utils.cpp \
    cpp_core/src/wasm_bindings.cpp \
    -o web_gui/public/wasm/formal_sim.js \
    -s WASM=1 \
    -s MODULARIZE=1 \
    -s EXPORT_NAME="createFormalSimModule" \
    -s "EXPORTED_RUNTIME_METHODS=['FS']" \
    -s ALLOW_MEMORY_GROWTH=1 \
    -s NO_DISABLE_EXCEPTION_CATCHING \
    --bind \
    -std=c++17 \
    -O3

echo "Compilation complete."
