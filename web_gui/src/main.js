let wasmModule = null;
let currentNFA = null;
let currentDFA = null;

// Initialize WASM
const initWasm = async () => {
    try {
        if (typeof createFormalSimModule === 'undefined') {
            log("WASM module not found. Please compile the project.", "error");
            return;
        }

        wasmModule = await createFormalSimModule();
        document.getElementById('wasm-status').classList.add('ready');
        document.querySelector('#wasm-status .text').textContent = "Core Ready";
        log("WASM Core initialized successfully.", "success");
    } catch (e) {
        log("Failed to initialize WASM: " + e.message, "error");
    }
};

// Logger
const log = (msg, type = "info") => {
    const consoleEl = document.getElementById('console-output');
    const entry = document.createElement('div');
    entry.className = `log-entry ${type}`;
    entry.textContent = `> ${msg}`;
    consoleEl.appendChild(entry);
    consoleEl.scrollTop = consoleEl.scrollHeight;
};

// Graph Visualization
const renderGraph = (dotString, containerId) => {
    const viz = new Viz();
    viz.renderSVGElement(dotString)
        .then(element => {
            const container = document.getElementById(containerId);
            container.innerHTML = '';
            container.appendChild(element);
        })
        .catch(error => {
            log("Graph rendering failed: " + error, "error");
        });
};

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    initWasm();

    // Tabs
    document.querySelectorAll('.tab').forEach(tab => {
        tab.addEventListener('click', () => {
            document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
            document.querySelectorAll('.graph-view').forEach(v => v.classList.remove('active'));

            tab.classList.add('active');
            document.getElementById(tab.dataset.target).classList.add('active');
        });
    });

    // Build NFA
    document.getElementById('btn-build-nfa').addEventListener('click', () => {
        if (!wasmModule) return;
        const regex = document.getElementById('regex-input').value;
        if (!regex) return;

        try {
            log(`Building NFA for regex: ${regex}`);
            // Clean up previous
            if (currentNFA) currentNFA.delete();

            currentNFA = wasmModule.RegexEngine.regexToNFA(regex);
            const dot = wasmModule.generateDOT_NFA(currentNFA);
            renderGraph(dot, 'nfa-view');

            // Switch to NFA tab
            document.querySelector('[data-target="nfa-view"]').click();
            log("NFA built successfully.", "success");
        } catch (e) {
            log("Error building NFA: " + e.message, "error");
        }
    });

    // Convert to DFA
    document.getElementById('btn-nfa-to-dfa').addEventListener('click', () => {
        if (!wasmModule || !currentNFA) {
            log("Build NFA first.", "error");
            return;
        }

        try {
            log("Converting NFA to DFA...");
            if (currentDFA) currentDFA.delete();

            currentDFA = wasmModule.RegexEngine.nfaToDFA(currentNFA);
            const dot = wasmModule.generateDOT_DFA(currentDFA);
            renderGraph(dot, 'dfa-view');

            // Switch to DFA tab
            document.querySelector('[data-target="dfa-view"]').click();
            log("DFA conversion complete.", "success");
        } catch (e) {
            log("Error converting to DFA: " + e.message, "error");
        }
    });

    // Approximate Match
    document.getElementById('btn-match-approx').addEventListener('click', () => {
        if (!wasmModule) return;
        const pat = document.getElementById('regex-input').value;
        const txt = document.getElementById('test-string').value;
        const k = 1; // Hardcoded for demo, could be input

        if (!pat || !txt) {
            log("Please provide regex and test string.", "error");
            return;
        }

        try {
            const result = wasmModule.Matcher.approximateMatch(txt, pat, k);
            log(`Approx match (k=${k}) '${txt}' vs '${pat}': ${result ? "MATCH" : "NO MATCH"}`, result ? "success" : "error");
        } catch (e) {
            log("Error in approx match: " + e.message, "error");
        }
    });

    // PDA Simulation
    document.getElementById('btn-pda-sim').addEventListener('click', () => {
        if (!wasmModule) return;
        const input = document.getElementById('test-string').value;

        try {
            log(`Simulating PDA (a^n b^n) for input: ${input}`);
            const result = wasmModule.simulatePDA(input);

            // Log trace
            const trace = result.log;
            for (let i = 0; i < trace.size(); i++) {
                log("PDA: " + trace.get(i), "system");
            }

            log(`PDA Result: ${result.accepted ? "ACCEPTED" : "REJECTED"}`, result.accepted ? "success" : "error");
        } catch (e) {
            log("Error in PDA sim: " + e.message, "error");
        }
    });
});
