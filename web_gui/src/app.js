let wasmModule = null;
let automataSession = null;
let currentTab = 'nfa';

// Initialize WASM Module
Module.onRuntimeInitialized = async _ => {
    wasmModule = Module;
    document.getElementById('status-bar').textContent = "WASM Ready";
    automataSession = new wasmModule.AutomataSession();
    console.log("WASM Module Initialized");
};

// UI Event Listeners
document.addEventListener('DOMContentLoaded', () => {

    // Build Automata
    document.getElementById('btn-build').addEventListener('click', () => {
        if (!automataSession) return;
        const regex = document.getElementById('regex-input').value;
        const result = automataSession.buildRegex(regex);

        if (result === "Success") {
            renderAutomata();
            showStatus("Automata built successfully", "success");
        } else {
            showStatus(result, "error");
        }
    });

    // Exact Match
    document.getElementById('btn-match').addEventListener('click', () => {
        if (!automataSession) return;
        const text = document.getElementById('test-input').value;

        const nfaResult = automataSession.matchNFA(text);
        const dfaResult = automataSession.matchDFA(text);

        const resultBox = document.getElementById('match-result');
        const isMatch = nfaResult && dfaResult; // Should be consistent

        resultBox.textContent = isMatch ? "MATCH FOUND" : "NO MATCH";
        resultBox.className = `result-box ${isMatch ? 'result-success' : 'result-error'}`;
    });

    // Approximate Match
    document.getElementById('btn-approx').addEventListener('click', () => {
        if (!wasmModule) return;
        const pat = document.getElementById('approx-pattern').value;
        const txt = document.getElementById('approx-text').value;
        const k = parseInt(document.getElementById('approx-k').value);

        const result = wasmModule.runApproxMatch(txt, pat, k);
        const resultBox = document.getElementById('approx-result');

        resultBox.textContent = result ? "MATCH FOUND" : "NO MATCH";
        resultBox.className = `result-box ${result ? 'result-success' : 'result-error'}`;
    });

    // PDA Simulation
    document.getElementById('btn-pda').addEventListener('click', () => {
        if (!wasmModule) return;
        const input = document.getElementById('pda-input').value;

        const result = wasmModule.runPDA(input);
        const resultBox = document.getElementById('pda-result');
        const traceBox = document.getElementById('pda-trace');

        resultBox.textContent = result.accepted ? "ACCEPTED" : "REJECTED";
        resultBox.className = `result-box ${result.accepted ? 'result-success' : 'result-error'}`;
        traceBox.textContent = result.trace;
    });

    // Tab Switching
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
            currentTab = e.target.dataset.tab;
            renderAutomata();
        });
    });
});

function renderAutomata() {
    if (!automataSession) return;

    let dot = "";
    if (currentTab === 'nfa') {
        dot = automataSession.getNFA_DOT();
    } else {
        dot = automataSession.getDFA_DOT();
    }

    if (dot) {
        d3.select("#graph-viz").graphviz()
            .width(window.innerWidth - 400)
            .height(window.innerHeight - 100)
            .fit(true)
            .renderDot(dot);
    } else {
        document.getElementById('graph-viz').innerHTML = '<div style="padding:2rem; color:#666">No automata generated yet</div>';
    }
}

function showStatus(msg, type) {
    const el = document.getElementById('status-bar');
    el.textContent = msg;
    el.style.color = type === 'error' ? 'var(--error)' : 'var(--success)';
    setTimeout(() => {
        el.style.color = 'var(--text-secondary)';
        el.textContent = "Ready";
    }, 3000);
}
