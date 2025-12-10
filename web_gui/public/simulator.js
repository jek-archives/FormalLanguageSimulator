
// Main Application Logic
const AppState = {
    wasmModule: null,
    currentNFA: null,
    currentDFA: null,
    activeDiagram: 'nfa', // 'nfa' or 'dfa'
    activeLog: 'nfa',     // 'nfa' or 'dfa'
    regex: '(a|b)*abb',
    testString: 'abb',
    dnaSequence: 'ball',
    maxErrors: 1,

    init: async function () {
        console.log("Initializing App...");
        try {
            if (typeof createFormalSimModule === 'undefined') {
                this.logError("WASM module not found. Please compile the project.");
                return;
            }
            this.wasmModule = await createFormalSimModule();
            console.log("WASM Core Ready");

            // Enable buttons
            document.getElementById('generate-automata-button').disabled = false;
            document.getElementById('test-match-button').disabled = false;

        } catch (e) {
            console.error("WASM Init Error:", e);
            this.logError("Failed to initialize WASM core.");
        }
    },

    saveState: function () {
        const state = {
            regex: this.regex,
            testString: this.testString,
            dnaSequence: this.dnaSequence,
            maxErrors: this.maxErrors,
            pdaInput: this.pdaInput
        };
        localStorage.setItem('formalSimState', JSON.stringify(state));
    },

    downloadDiagram: function () {
        const svgDiv = document.getElementById("automata-svg");
        // Get the SVG element or innerHTML
        // Vis.js creates an SVG element.
        const svgEl = svgDiv.querySelector('svg');
        if (!svgEl) {
            alert("No diagram to download");
            return;
        }

        // Serialize
        const serializer = new XMLSerializer();
        const svgString = serializer.serializeToString(svgEl);

        const blob = new Blob([svgString], { type: "image/svg+xml" });
        const url = URL.createObjectURL(blob);

        const link = document.createElement("a");
        link.href = url;
        link.download = "automata_diagram.svg";
        link.click();

        URL.revokeObjectURL(url);
    },

    generateExamples: function () {
        const regex = this.regex;
        let out = [];

        // Simple heuristic for now as requested
        if (regex === "(a|b)*abb") {
            out = ["abb", "aabb", "babb", "abababb"];
        } else if (regex === "(ab)*") {
            out = ["", "ab", "abab", "ababab"];
        } else if (regex.includes("*")) {
            out = ["(Try variations of the repeated part)"];
        } else {
            out = ["(Enter a known pattern like (a|b)*abb for suggestions)"];
        }

        // Just display nicely
        alert("Suggested Strings:\n" + out.join("\n"));
    },

    explainRegex: function (pattern) {
        if (!pattern) return "Waiting for input...";
        if (pattern.includes("abb")) return "Matches any string ending in 'abb'";
        if (pattern === "(ab)*") return "Matches 'ab' repeated zero or more times";
        if (pattern === "a(a|b)*b") return "Starts with 'a' and ends with 'b'";
        return "Pattern loaded.";
    },

    loadState: function () {
        const saved = localStorage.getItem('formalSimState');
        if (saved) {
            try {
                const state = JSON.parse(saved);
                if (state.regex) this.regex = state.regex;
                if (state.testString) this.testString = state.testString;
                if (state.dnaSequence) this.dnaSequence = state.dnaSequence;
                if (state.maxErrors) this.maxErrors = state.maxErrors;
                if (state.pdaInput) this.pdaInput = state.pdaInput;

                // Update UI
                document.getElementById('regex-input-field').value = this.regex || '';
                document.getElementById('string-input-field').value = this.testString || '';
                document.getElementById('dna-sequence-field').value = this.dnaSequence || '';
                document.getElementById('max-errors-field').value = this.maxErrors || 1;
                document.getElementById('k-value-display').innerText = this.maxErrors || 1;
                document.getElementById('pda-input-field').value = this.pdaInput || '';

            } catch (e) { console.error("Error loading state", e); }
        }
    },

    // --- Actions ---

    handleRegexChange: function (val) {
        this.regex = val;
        this.saveState();

        // 3. Highlight Invalid Regex
        const field = document.getElementById("regex-input-field");
        try {
            new RegExp(val); // basic JS check
            field.style.border = "2px solid #4CAF50"; // green
        } catch (e) {
            field.style.border = "2px solid #FF5252"; // red
        }

        // 4. Real-Time Explanation
        document.getElementById("regex-explanation").textContent = this.explainRegex(val);
    },

    handleTestStringChange: function (val) {
        this.testString = val;
        this.saveState();
    },

    handleDnaSequenceChange: function (val) {
        this.dnaSequence = val;
        this.saveState();
    },

    handleMaxErrorsChange: function (val) {
        this.maxErrors = parseInt(val, 10);
        document.getElementById('k-value-display').innerText = this.maxErrors;
        this.saveState();
    },

    handlePdaInputChange: function (val) {
        this.pdaInput = val;
        this.saveState();
    },

    useExample: function (regex, testStr) {
        // Update State
        this.regex = regex;
        this.testString = testStr;
        this.saveState();

        // Update UI Inputs
        document.getElementById('regex-input-field').value = regex;
        document.getElementById('string-input-field').value = testStr;

        // Trigger validation/explanation
        this.handleRegexChange(regex);

        // Trigger generation
        this.generateAutomata();
    },

    setTestString: function (str) {
        this.testString = str;
        document.getElementById('string-input-field').value = str;
        this.saveState();
        this.runTests();
    },

    useApproxExample: function (pattern, text, k) {
        // Update State
        this.regex = pattern;
        this.dnaSequence = text;
        this.maxErrors = k;
        this.saveState();

        // Update UI Inputs
        document.getElementById('regex-input-field').value = pattern;
        document.getElementById('dna-sequence-field').value = text;
        document.getElementById('max-errors-field').value = k;
        document.getElementById('k-value-display').innerText = k;

        // Trigger validation
        this.handleRegexChange(pattern);

        // Trigger run
        this.runApproximateMatch();
    },

    usePdaExample: function (str) {
        this.pdaInput = str;
        document.getElementById('pda-input-field').value = str;
        this.saveState();
        this.runPdaSimulation();
    },


    generateAutomata: function () {
        this.clearError();
        if (!this.wasmModule) return;
        if (!this.regex) {
            this.logError("Please enter a regular expression.");
            return;
        }

        try {
            // Clean up old objects
            if (this.currentNFA) this.currentNFA.delete();
            if (this.currentDFA) this.currentDFA.delete();

            // 1. Build NFA
            this.currentNFA = this.wasmModule.RegexEngine.regexToNFA(this.regex);

            // 2. Build DFA
            this.currentDFA = this.wasmModule.RegexEngine.nfaToDFA(this.currentNFA);

            // Update UI
            this.renderDiagram();
            this.updateTransitionsPanel();

            // Show diagram container if hidden
            document.getElementById('diagram-container').style.display = 'block';

            // Switch tabs to active
            this.setActiveDiagramTab(this.activeDiagram);

        } catch (e) {
            console.error(e);
            this.logError("Error generating automata: " + e.message);
        }
    },

    runTests: function () {
        this.clearError();
        if (!this.wasmModule || !this.currentDFA) {
            this.logError("Please generate automata first.");
            return;
        }

        const resultsContainer = document.getElementById('test-results-content');
        resultsContainer.style.display = 'block';
        document.getElementById('results-panel-empty').style.display = 'none';

        try {
            // Run simulation for Result
            let isMatch = this.currentDFA.simulate(this.testString);

            const resultDiv = document.createElement('div');
            resultDiv.className = 'p-3 bg-gray-800 rounded border border-gray-700 mb-2';
            resultDiv.innerHTML = `
            <div class="flex justify-between items-center mb-1">
                <span class="text-xs font-bold text-green-400">EXACT MATCH (DFA)</span>
                <span class="font-bold border px-2 py-0.5 rounded text-xs ${isMatch ? 'text-green-400 border-green-500/30 bg-green-500/10' : 'text-red-400 border-red-500/30 bg-red-500/10'}">
                    ${isMatch ? 'MATCH' : 'NO MATCH'}
                </span>
            </div>
            <div class="text-sm text-gray-300">"${this.testString}"</div>
        `;
            resultsContainer.insertBefore(resultDiv, resultsContainer.firstChild);

        } catch (e) {
            console.error(e);
            this.logError("Error running test: " + e.message);
        }
    },

    runApproximateMatch: function () {
        this.clearError();
        if (!this.wasmModule) return;

        const pattern = this.regex;
        const text = this.dnaSequence;
        const k = this.maxErrors;

        const resultsContainer = document.getElementById('test-results-content');
        resultsContainer.style.display = 'block';
        document.getElementById('results-panel-empty').style.display = 'none';

        const resultDiv = document.createElement('div');
        resultDiv.className = 'p-3 bg-gray-800 rounded border border-gray-700 mb-2';

        try {
            const isMatch = this.wasmModule.Matcher.approximateMatch(text, pattern, k);

            resultDiv.innerHTML = `
                <div class="flex justify-between items-center mb-1">
                    <span class="text-xs font-bold text-blue-400">APPROX MATCH (k=${k})</span>
                <span class="font-bold border px-2 py-0.5 rounded text-xs ${isMatch ? 'text-green-400 border-green-500/30 bg-green-500/10' : 'text-red-400 border-red-500/30 bg-red-500/10'}">
                    ${isMatch ? 'MATCH' : 'NO MATCH'}
                </span>
            </div>
                <div class="text-sm text-gray-300">
                    <div>Text: "${text}"</div>
                    <div>Pattern: "${pattern}"</div>
                </div>
            `;
            resultsContainer.insertBefore(resultDiv, resultsContainer.firstChild);

        } catch (e) {
            console.error(e);
            resultDiv.innerHTML = `<span class="text-red-500">Error: ${e.message}</span>`;
            resultsContainer.insertBefore(resultDiv, resultsContainer.firstChild);
        }
    },

    // --- PDA Simulation ---

    handlePdaInputChange: function (val) {
        this.pdaInput = val;
    },

    usePdaExample: function (str) {
        this.pdaInput = str;
        document.getElementById('pda-input-field').value = str;
        this.runPdaSimulation();
    },

    runPdaSimulation: function () {
        this.clearError();
        if (!this.wasmModule) return;
        const input = this.pdaInput || '';

        const resultsContainer = document.getElementById('test-results-content');
        resultsContainer.style.display = 'block';
        document.getElementById('results-panel-empty').style.display = 'none';

        const resultDiv = document.createElement('div');
        resultDiv.className = 'p-3 bg-gray-800 rounded border border-gray-700 mb-2';

        try {
            // Call WASM
            const result = this.wasmModule.simulatePDA(input);
            const accepted = result.accepted;
            const log = result.log; // vector<string> -> JS Array

            // Format Log
            let logHtml = '<div class="mt-2 pl-2 border-l-2 border-gray-600 text-xs text-gray-400 font-mono">';
            for (let i = 0; i < log.size(); i++) {
                logHtml += `<div>${log.get(i)}</div>`;
            }
            logHtml += '</div>';

            resultDiv.innerHTML = `
                <div class="flex justify-between items-center mb-1">
                <span class="text-xs font-bold text-purple-400">PDA SIMULATION (a<sup>n</sup>b<sup>n</sup>)</span>
                <span class="font-bold border px-2 py-0.5 rounded text-xs ${accepted ? 'text-green-400 border-green-500/30 bg-green-500/10' : 'text-red-400 border-red-500/30 bg-red-500/10'}">
                    ${accepted ? 'ACCEPTED' : 'REJECTED'}
                </span>
            </div>
                <div class="text-sm text-gray-300">
                    <div>Input: "${input}"</div>
                </div>
                ${logHtml}
            `;

            // Clean up vector view if needed, though Emscripten handles small return by value well.
            // But 'log' depends on how vector is bound. register_vector("StringList") was used.
            // We should call .delete() if we own it, but here it's property of returned object.
            // Actually, simulatePDAWrapper returns object by value. 
            // We'll let JS GC handle it unless it's a raw pointer. 

            resultsContainer.insertBefore(resultDiv, resultsContainer.firstChild);

        } catch (e) {
            console.error(e);
            resultDiv.innerHTML = `<span class="text-red-500">Error: ${e.message}</span>`;
            resultsContainer.insertBefore(resultDiv, resultsContainer.firstChild);
        }
    },

    reset: function () {
        this.regex = '';
        this.testString = '';
        document.getElementById('regex-input-field').value = '';
        document.getElementById('string-input-field').value = '';

        if (this.currentNFA) this.currentNFA.delete();
        if (this.currentDFA) this.currentDFA.delete();
        this.currentNFA = null;
        this.currentDFA = null;

        document.getElementById('automata-svg').innerHTML = 'No diagram';
        document.getElementById('transitions-panel-empty').style.display = 'block';
        document.getElementById('transitions-panel-content').style.display = 'none';
        document.getElementById('results-panel-empty').style.display = 'block';
        document.getElementById('test-results-content').style.display = 'none';
        document.getElementById('test-results-content').innerHTML = '';
    },

    // --- Visualization & Tabs ---

    // --- Visualization & Tabs ---

    setActiveDiagramTab: function (type) {
        this.activeDiagram = type; // 'nfa' or 'dfa'

        const nfaTab = document.getElementById('nfa-tab');
        const dfaTab = document.getElementById('dfa-tab');

        // Styles
        const activeClasses = ['text-blue-400', 'bg-gray-800', 'shadow-sm'];
        const inactiveClasses = ['text-gray-400', 'hover:text-white'];

        if (type === 'nfa') {
            nfaTab.classList.add(...activeClasses);
            nfaTab.classList.remove(...inactiveClasses);

            dfaTab.classList.remove(...activeClasses);
            dfaTab.classList.add(...inactiveClasses);
        } else {
            dfaTab.classList.add(...activeClasses);
            dfaTab.classList.remove(...inactiveClasses);

            nfaTab.classList.remove(...activeClasses);
            nfaTab.classList.add(...inactiveClasses);
        }

        this.renderDiagram();
    },

    renderDiagram: function () {
        if (!this.wasmModule) return;
        const container = document.getElementById('automata-svg');

        let dotString = "";
        try {
            if (this.activeDiagram === 'nfa' && this.currentNFA) {
                dotString = this.wasmModule.generateDOT_NFA(this.currentNFA);
            } else if (this.activeDiagram === 'dfa' && this.currentDFA) {
                dotString = this.wasmModule.generateDOT_DFA(this.currentDFA);
            } else {
                // Keep the placeholder icon if possible, or just text
                // But renderDiagram usually clears innerHTML. 
                // Let's iterate: if no NFA/DFA, do nothing or show partial?
                // The reset function puts back the placeholder.
                // If we have objects but logic fails, we show error. 
                // If we have no objects, we usually don't call this unless switching tabs with empty state.
                // If empty state, just return.
                if (!this.currentNFA && !this.currentDFA) return;
            }

            if (!dotString) return;

            const viz = new Viz();
            viz.renderSVGElement(dotString)
                .then(element => {
                    element.setAttribute('width', '100%');
                    element.setAttribute('height', '100%'); // Fill container
                    element.style.maxWidth = "100%";
                    container.innerHTML = '';
                    container.appendChild(element);
                })
                .catch(error => {
                    console.error("Graphviz Error", error);
                    container.innerHTML = '<span class="text-red-500">Error rendering graph</span>';
                });

        } catch (e) {
            console.error("Generation Error", e);
        }
    },

    setActiveTab: function (type) {
        this.activeLog = type;
        const nfaTab = document.getElementById('nfa-log-tab');
        const dfaTab = document.getElementById('dfa-log-tab');

        // Log tabs are text-based: text-blue-400 font-bold VS text-gray-500 hover:text-gray-300
        const activeClass = ['text-blue-400', 'font-bold'];
        const inactiveClass = ['text-gray-500', 'hover:text-gray-300'];

        if (type === 'nfa') {
            nfaTab.classList.add(...activeClass);
            nfaTab.classList.remove(...inactiveClass);

            dfaTab.classList.remove(...activeClass);
            dfaTab.classList.add(...inactiveClass);
        } else {
            dfaTab.classList.add(...activeClass);
            dfaTab.classList.remove(...inactiveClass);

            nfaTab.classList.remove(...activeClass);
            nfaTab.classList.add(...inactiveClass);
        }

        this.updateTransitionsPanel();
    },

    updateTransitionsPanel: function () {
        const titleEl = document.getElementById('current-automata-title');
        const listEl = document.getElementById('transition-list-container');
        const emptyEl = document.getElementById('transitions-panel-empty');
        const contentEl = document.getElementById('transitions-panel-content');
        const startStateEl = document.getElementById('start-state-output');
        const finalStatesEl = document.getElementById('final-states-output');

        if (!this.currentNFA && !this.currentDFA) {
            emptyEl.style.display = 'block';
            contentEl.style.display = 'none';
            return;
        }

        emptyEl.style.display = 'none';
        contentEl.style.display = 'flex'; // Flex for column layout

        titleEl.textContent = this.activeLog.toUpperCase() + " Transitions";

        let dot = "";
        try {
            if (this.activeLog === 'nfa' && this.currentNFA) {
                dot = this.wasmModule.generateDOT_NFA(this.currentNFA);
            } else if (this.activeLog === 'dfa' && this.currentDFA) {
                dot = this.wasmModule.generateDOT_DFA(this.currentDFA);
            }
        } catch (e) { }

        if (!dot) {
            listEl.innerHTML = '<div class="text-gray-500 p-2">Not available</div>';
            return;
        }

        // Parse DOT lines
        const lines = dot.split('\n');
        let htmlRows = '';
        let startState = '--';
        let finalStates = [];

        // Regex parsing
        const transitionRegex = /(\w+)\s*->\s*(\w+)\s*\[label="([^"]+)"\]/;
        const finalRegex = /(\w+)\s*\[shape=doublecircle\]/;
        const startRegex = /start\s*->\s*(\w+)/;

        lines.forEach(line => {
            let match = line.match(transitionRegex);
            if (match) {
                const [_, from, to, label] = match;
                htmlRows += `
                    <tr class="border-b border-gray-800 hover:bg-gray-900 transition-colors">
                        <td class="px-4 py-2 text-gray-300 font-bold">${from}</td>
                        <td class="px-4 py-2 text-blue-400 font-mono text-center">${label}</td>
                        <td class="px-4 py-2 text-gray-300 font-bold text-right">${to}</td>
                    </tr>
                `;
            }

            match = line.match(finalRegex);
            if (match) {
                finalStates.push(match[1]);
            }

            match = line.match(startRegex);
            if (match) {
                startState = match[1];
            }
        });

        // Wrap in table
        if (htmlRows) {
            listEl.innerHTML = `
                <table class="w-full text-left text-xs">
                    <thead class="bg-gray-900 text-gray-500 uppercase font-bold sticky top-0">
                        <tr>
                            <th class="px-4 py-2">From</th>
                            <th class="px-4 py-2 text-center">Input</th>
                            <th class="px-4 py-2 text-right">To</th>
                        </tr>
                    </thead>
                    <tbody class="divide-y divide-gray-800">
                        ${htmlRows}
                    </tbody>
                </table>
            `;
        } else {
            listEl.innerHTML = '<div class="p-4 text-center text-gray-500">No explicit transitions found</div>';
        }

        // Update Start/Final Info
        startStateEl.textContent = startState;
        finalStatesEl.innerHTML = finalStates.map(fs =>
            `<span class="inline-block bg-red-500/10 text-red-400 border border-red-500/20 px-1.5 py-0.5 rounded text-[10px] font-mono mr-1 mb-1">${fs}</span>`
        ).join('') || '--';
    },

    clearError: function () {
        const el = document.getElementById('error-container');
        el.style.display = 'none';
        document.getElementById('error-message-text').innerText = '';
    },

    logError: function (msg) {
        console.error(msg);
        const el = document.getElementById('error-container');
        document.getElementById('error-message-text').innerText = msg;
        el.style.display = 'block';
    },

    reset: function () {
        this.clearError();
        this.regex = '';
        this.testString = '';
        document.getElementById('regex-input-field').value = '';
        document.getElementById('string-input-field').value = '';

        if (this.currentNFA) this.currentNFA.delete();
        if (this.currentDFA) this.currentDFA.delete();
        this.currentNFA = null;
        this.currentDFA = null;

        document.getElementById('automata-svg').innerHTML = 'No diagram';
        document.getElementById('transitions-panel-empty').style.display = 'block';
        document.getElementById('transitions-panel-content').style.display = 'none';
        document.getElementById('results-panel-empty').style.display = 'block';
        document.getElementById('test-results-content').style.display = 'none';
        document.getElementById('test-results-content').innerHTML = '';
    }
};

// Start
window.addEventListener('load', () => {
    AppState.init();
});
