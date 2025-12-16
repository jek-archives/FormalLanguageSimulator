
// Main Application Logic
const AppState = {
    wasmModule: null,
    currentNFA: null,
    currentDFA: null,
    activeDiagram: 'nfa', // 'nfa' or 'dfa'
    activeLog: 'nfa',     // 'nfa' or 'dfa'
    pdaMode: 'a^nb^n',      // 'anbn' or 'balanced'
    regex: '(a|b)*abb',
    testString: 'abb',
    dnaSequence: 'ball',
    maxErrors: 1,

    init: async function () {
        console.log("Initializing App... Version: UI_UPDATE_2");
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
            pdaInput: this.pdaInput,
            pdaMode: this.pdaMode
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
                if (state.pdaMode) this.pdaMode = state.pdaMode;

                // Update UI
                document.getElementById('regex-input-field').value = this.regex || '';
                document.getElementById('string-input-field').value = this.testString || '';
                document.getElementById('dna-sequence-field').value = this.dnaSequence || '';
                document.getElementById('max-errors-field').value = this.maxErrors || 1;
                document.getElementById('k-value-display').innerText = this.maxErrors || 1;
                document.getElementById('pda-input-field').value = this.pdaInput || '';

                // Update PDA Mode UI
                const modeSelect = document.getElementById('pda-mode-select');
                if (this.pdaMode && modeSelect) {
                    modeSelect.value = this.pdaMode;
                    // Trigger mode update logic (desc etc)
                    this.setPdaMode(this.pdaMode);
                }

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

            const resultBadge = isMatch
                ? '<span class="px-2 py-0.5 rounded bg-green-500/20 text-green-400 text-[10px] font-bold border border-green-500/30 tracking-wide">MATCH</span>'
                : '<span class="px-2 py-0.5 rounded bg-red-500/20 text-red-400 text-[10px] font-bold border border-red-500/30 tracking-wide">NO MATCH</span>';

            const resultDiv = document.createElement('div');
            resultDiv.className = 'bg-gray-800 rounded-lg border border-gray-700 mb-3 overflow-hidden shadow-sm';
            resultDiv.innerHTML = `
                <div class="px-3 py-2 bg-gray-900 border-b border-gray-800 flex justify-between items-center">
                    <div class="flex items-center">
                        <span class="text-xs bg-gray-700 text-gray-300 px-2 py-0.5 rounded font-mono border border-gray-600 flex items-center">
                            <span class="text-green-400 font-bold mr-2">DFA</span> "${this.testString}"
                        </span>
                    </div>
                    ${resultBadge}
                </div>
                <!-- Optional: Add specific transition trace here if available in future -->
                <div class="p-2 text-[10px] font-mono text-gray-500 italic">
                    Result via Deterministic Finite Automaton
                </div>
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
        resultDiv.className = 'bg-gray-800 rounded-lg border border-gray-700 mb-3 overflow-hidden shadow-sm';

        try {
            const isMatch = this.wasmModule.Matcher.approximateMatch(text, pattern, k);

            const resultBadge = isMatch
                ? '<span class="px-2 py-0.5 rounded bg-green-500/20 text-green-400 text-[10px] font-bold border border-green-500/30 tracking-wide">MATCH</span>'
                : '<span class="px-2 py-0.5 rounded bg-red-500/20 text-red-400 text-[10px] font-bold border border-red-500/30 tracking-wide">NO MATCH</span>';

            resultDiv.innerHTML = `
                <div class="px-3 py-2 bg-gray-900 border-b border-gray-800 flex justify-between items-center">
                    <div class="flex items-center">
                        <span class="text-xs bg-gray-700 text-gray-300 px-2 py-0.5 rounded font-mono border border-gray-600 flex items-center">
                            <span class="text-blue-400 font-bold mr-2">APPROX (k=${k})</span> "${text}"
                        </span>
                    </div>
                    ${resultBadge}
                </div>
                <div class="p-2 text-[10px] font-mono text-gray-400 whitespace-pre-wrap max-h-32 overflow-y-auto custom-scrollbar">Pattern: "${pattern}"</div>
            `;
            resultsContainer.insertBefore(resultDiv, resultsContainer.firstChild);

        } catch (e) {
            console.error(e);
            resultDiv.innerHTML = `<span class="text-red-500 p-3">Error: ${e.message}</span>`;
            resultsContainer.insertBefore(resultDiv, resultsContainer.firstChild);
        }
    },

    // --- PDA Simulation ---

    handlePdaInputChange: function (val) {
        this.pdaInput = val;
        this.saveState();
    },

    usePdaExample: function (str) {
        this.pdaInput = str;
        document.getElementById('pda-input-field').value = str;
        this.runPdaSimulation();
    },

    setPdaMode: function (mode) {
        this.pdaMode = mode;
        const desc = document.getElementById('pda-desc');
        if (mode === 'anbn') {
            desc.innerHTML = `Simulates <b>a<sup>n</sup>b<sup>n</sup></b> context-free language.`;
            document.getElementById('pda-input-field').placeholder = "e.g. aaabbb";
        } else {
            desc.innerHTML = `Checks for <b>XML Tags / RNA Loops</b> (Balanced Parentheses).`;
            document.getElementById('pda-input-field').placeholder = "e.g. ((...))";
        }
    },

    // --- Bioinformatics Helpers ---

    generateRandomDNA: function (length) {
        const chars = "ACGT";
        let result = "";
        for (let i = 0; i < length; i++) {
            result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return result;
    },

    injectPattern: function (background, pattern, errorRate = 0.0) {
        // Simple injection at random position
        const pos = Math.floor(Math.random() * (background.length - pattern.length));
        let seq = background.split('');

        // Mutate pattern?
        let finalPattern = pattern;
        if (Math.random() < errorRate) {
            // Introduce one mutation
            const mutPos = Math.floor(Math.random() * pattern.length);
            const chars = "ACGT";
            const original = pattern[mutPos];
            let replacement = chars.charAt(Math.floor(Math.random() * chars.length));
            while (replacement === original) {
                replacement = chars.charAt(Math.floor(Math.random() * chars.length));
            }
            finalPattern = pattern.substring(0, mutPos) + replacement + pattern.substring(mutPos + 1);
        }

        // Overlay
        for (let i = 0; i < finalPattern.length; i++) {
            if (pos + i < seq.length) {
                seq[pos + i] = finalPattern[i];
            }
        }
        return seq.join('');
    },

    setBioPreset: function (type) {
        let pattern = "";
        let text = "";

        // Generate random background noise (shorter now, ~12 chars)
        const bg = this.generateRandomDNA(12);

        if (type === 'START') {
            pattern = 'ATG';
            text = this.injectPattern(bg, 'ATG', 0.1);
        }
        if (type === 'TATA') {
            // Use a canonical consensus sequence for the pattern since Matcher uses Levenshtein on literals
            pattern = 'TATAAAA';
            const sample = 'TATAAAA';
            text = this.injectPattern(bg, sample, 0.2);
        }
        if (type === 'POLYA') {
            // Use a literal string for approximate matching, not regex
            pattern = 'AAAAAAAA';
            const sample = 'AAAAAAAA';
            text = this.injectPattern(bg, sample, 0.2);
        }

        this.handleRegexChange(pattern);
        this.handleDnaSequenceChange(text);

        document.getElementById('regex-input-field').value = pattern;
        document.getElementById('dna-sequence-field').value = text;

        // Auto-run
        setTimeout(() => this.runApproximateMatch(), 100);
    },

    setRandomTestString: function () {
        // Extract potential literals from regex
        // Simple heuristic: remove special chars
        const literals = this.regex.replace(/[^a-zA-Z0-9]/g, '');
        const distinctChars = [...new Set(literals.split(''))];

        // Default to a,b if no literals found (e.g. if regex is just '.*')
        const alphabet = distinctChars.length > 0 ? distinctChars.join('') : "ab";

        // Generate random string (length 5 to 10)
        const len = Math.floor(Math.random() * 6) + 5;
        let result = "";
        for (let i = 0; i < len; i++) {
            result += alphabet.charAt(Math.floor(Math.random() * alphabet.length));
        }

        this.setTestString(result);
    },

    runPdaSimulation: function () {
        let input = this.pdaInput || "";
        // Redirect to Main Execution Log
        const resultsContainer = document.getElementById('test-results-content');
        resultsContainer.style.display = 'block';
        document.getElementById('results-panel-empty').style.display = 'none';

        try {
            let resultHtml = "";
            let isAccepted = false;
            let stackTrace = "";

            if (this.pdaMode === 'balanced') {
                // simple JS simulation for Balanced Parentheses
                let stack = [];
                let trace = [];
                let failed = false;

                trace.push(`Start: Stack []`);

                // --- LEXER IMPL (XML -> Parens) ---
                if (input.includes('<') && input.includes('>')) {
                    trace.push(`Lexer: Detected XML tags.`);
                    // 1. Remove self-closing tags (e.g. <br/>) - they don't affect balance
                    let tokenized = input.replace(/<[^>]+\/>/g, '');
                    // 2. Replace closing tags </any> with ')'
                    tokenized = tokenized.replace(/<\/[^>]+>/g, ')');
                    // 3. Replace opening tags <any> with '('
                    tokenized = tokenized.replace(/<[^>]+>/g, '(');

                    if (tokenized !== input) {
                        trace.push(`Lexer: Tokenized "${input}" -> "${tokenized}"`);
                        // Use the tokenized string for simulation, but filter to just ( and ) to be safe from non-tag text?
                        // Actually the loop below ignores non-parens, so 'tokenized' containing garbage text is fine.
                        input = tokenized;
                    }
                }
                // ----------------------------------

                for (let i = 0; i < input.length; i++) {
                    const char = input[i];
                    if (char === '(') {
                        stack.push('(');
                        trace.push(`Read '(': Push '('. Stack: [${stack.join('')}]`);
                    } else if (char === ')') {
                        if (stack.length === 0) {
                            trace.push(`Read ')': Error (Empty Stack). REJECT.`);
                            failed = true;
                            break;
                        }
                        stack.pop();
                        trace.push(`Read ')': Pop '('. Stack: [${stack.join('')}]`);
                    } else {
                        trace.push(`Read '${char}': Ignore/Skip.`);
                    }
                }

                if (!failed && stack.length === 0) {
                    isAccepted = true;
                    trace.push(`End: Stack Empty. ACCEPT.`);
                } else if (!failed) {
                    trace.push(`End: Stack [${stack.join('')}] (Not Empty). REJECT.`);
                }

                stackTrace = trace.join('\n');

            } else {
                // Default: a^n b^n (WASM)
                if (this.wasmModule) {
                    const result = this.wasmModule.simulatePDA(input);
                    // result is { accepted: bool, log: vector<string> }
                    isAccepted = result.accepted;

                    // Convert vector to string
                    const logVec = result.log;
                    let traceLines = [];
                    for (let i = 0; i < logVec.size(); i++) {
                        traceLines.push(logVec.get(i));
                    }
                    stackTrace = traceLines.join('\n');
                }
            }

            const resultBadge = isAccepted
                ? '<span class="px-2 py-0.5 rounded bg-green-500/20 text-green-400 text-[10px] font-bold border border-green-500/30 tracking-wide">ACCEPTED</span>'
                : '<span class="px-2 py-0.5 rounded bg-red-500/20 text-red-400 text-[10px] font-bold border border-red-500/30 tracking-wide">REJECTED</span>';

            const resultDiv = document.createElement('div');
            resultDiv.className = 'bg-gray-800 rounded-lg border border-gray-700 mb-3 overflow-hidden shadow-sm';
            resultDiv.innerHTML = `
                <div class="px-3 py-2 bg-gray-900 border-b border-gray-800 flex justify-between items-center">
                    <div class="flex items-center">
                        <span class="text-xs bg-gray-700 text-gray-300 px-2 py-0.5 rounded font-mono border border-gray-600 flex items-center">
                            <span class="text-orange-400 font-bold mr-2">PDA (${this.pdaMode})</span> "${input}"
                        </span>
                    </div>
                    ${resultBadge}
                </div>
                <div class="p-2 text-[10px] font-mono text-gray-400 whitespace-pre-wrap max-h-32 overflow-y-auto custom-scrollbar">${stackTrace}</div>
            `;

            resultsContainer.insertBefore(resultDiv, resultsContainer.firstChild);

        } catch (e) {
            console.error(e);
            this.logError("PDA Error: " + e.message);
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

            // format DOT to use q0, q1...
            dotString = this.formatDotString(dotString);

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
        const grammarTab = document.getElementById('grammar-log-tab');

        // Log tabs are text-based: text-blue-400 font-bold VS text-gray-500 hover:text-gray-300
        const activeClass = ['text-blue-400', 'font-bold'];
        const inactiveClass = ['text-gray-500', 'hover:text-gray-300'];

        const setTabState = (tab, isActive) => {
            if (isActive) {
                tab.classList.add(...activeClass);
                tab.classList.remove(...inactiveClass);
            } else {
                tab.classList.remove(...activeClass);
                tab.classList.add(...inactiveClass);
            }
        };

        setTabState(nfaTab, type === 'nfa');
        setTabState(dfaTab, type === 'dfa');
        setTabState(grammarTab, type === 'grammar');

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

        let dot = "";
        try {
            // For Grammar, match the Active Diagram (NFA or DFA)
            // Otherwise use the tab's type (nfa/dfa)
            const targetType = (this.activeLog === 'grammar') ? this.activeDiagram : this.activeLog;

            // Update title to be specific
            if (this.activeLog === 'grammar') {
                titleEl.textContent = `${targetType.toUpperCase()} GRAMMAR PRODUCTION RULES`;
            } else {
                titleEl.textContent = targetType.toUpperCase() + " TRANSITIONS";
            }

            if (targetType === 'nfa' && this.currentNFA) {
                dot = this.wasmModule.generateDOT_NFA(this.currentNFA);
            } else if (targetType === 'dfa' && this.currentDFA) {
                dot = this.wasmModule.generateDOT_DFA(this.currentDFA);
            }
        } catch (e) { }

        if (!dot) {
            listEl.innerHTML = '<div class="text-gray-500 p-2">Not available</div>';
            return;
        }

        // Apply formatting globally
        dot = this.formatDotString(dot);

        if (this.activeLog === 'grammar') {
            this.updateGrammarPanel(dot);
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

    updateGrammarPanel: function (dot) {
        const listEl = document.getElementById('transition-list-container');
        const startStateEl = document.getElementById('start-state-output');
        const finalStatesEl = document.getElementById('final-states-output');

        if (!dot) {
            listEl.innerHTML = '<div class="text-gray-500 p-2">Not available</div>';
            return;
        }

        const lines = dot.split('\n');
        let rules = [];
        let startState = '--';
        let finalStates = [];

        // Helper to format state names (0 -> q0)
        const formatState = (s) => (s && !s.startsWith('q') && !isNaN(s)) ? `q${s}` : s;

        // Regex parsing
        const transitionRegex = /(\w+)\s*->\s*(\w+)\s*\[label="([^"]+)"\]/;
        const finalRegex = /(\w+)\s*\[shape=doublecircle\]/;
        const startRegex = /start\s*->\s*(\w+)/;

        lines.forEach(line => {
            let match = line.match(transitionRegex);
            if (match) {
                const [_, from, to, label] = match;
                // Production Rule: FROM -> input TO
                // e.g. Q0 -> aQ1

                // Clean up label if it's epsilon or complex
                let symbol = label;
                if (symbol === 'ε') symbol = '';

                rules.push({ from: formatState(from), to: formatState(to), symbol });
            }

            match = line.match(finalRegex);
            if (match) {
                finalStates.push(formatState(match[1]));
            }

            match = line.match(startRegex);
            if (match) {
                startState = formatState(match[1]);
            }
        });

        // Base rules
        let htmlContent = '';

        // Group by FROM state
        const rulesByState = {};
        rules.forEach(r => {
            if (!rulesByState[r.from]) rulesByState[r.from] = [];
            rulesByState[r.from].push(`${r.symbol}<strong class="text-white">${r.to}</strong>`);
        });

        // Also add epsilon rules for Final States: Q_final -> ε
        finalStates.forEach(fs => {
            if (!rulesByState[fs]) rulesByState[fs] = [];
            rulesByState[fs].push('ε');
        });

        // Render Logic
        let rows = '';
        // Sort keys to ensure q0, q1 order
        Object.keys(rulesByState).sort().forEach(state => {
            const productions = rulesByState[state];
            rows += `
                <div class="flex items-baseline border-b border-gray-800 last:border-0 py-2 hover:bg-gray-900 px-2 transition-colors">
                    <div class="w-16 font-bold text-gray-300 text-right mr-3">${state}</div>
                    <div class="text-gray-500 mr-3">→</div>
                    <div class="flex-grow font-mono text-blue-400">
                        ${productions.join('<span class="text-gray-600 mx-2">|</span>')}
                    </div>
                </div>
            `;
        });

        listEl.innerHTML = `<div class="p-2 space-y-1">${rows}</div>`;

        // Update Info
        startStateEl.textContent = startState;
        finalStatesEl.innerHTML = finalStates.map(fs =>
            `<span class="inline-block bg-red-500/10 text-red-400 border border-red-500/20 px-1.5 py-0.5 rounded text-[10px] font-mono mr-1 mb-1">${fs}</span>`
        ).join('') || '--';
    },

    formatDotString: function (dot) {
        if (!dot) return dot;
        // Replace numeric states 0, 1 with q0, q1
        // We look for numbers that are NOT part of a label="quoted string" if possible.
        // But our node IDs are just digits. 
        // Safer approach: 
        // 1. "0 -> 1" => "q0 -> q1"
        // 2. "0 [shape" => "q0 [shape"
        // 3. "start -> 0" => "start -> q0"

        // This regex targets digits that are whole words
        // We must be careful not to replace digits inside labels if we can avoid it.
        // Given our C++ output is simple, we can probably get away with replacing all \b\d+\b that are not labels.
        // Actually, labels are usually letters. 

        return dot.replace(/\b(\d+)\b/g, 'q$1');
    },

    clearError: function () {
        const el = document.getElementById('error-container');
        el.style.display = 'none';
        document.getElementById('error-message-text').textContent = '';
    },

    logError: function (msg) {
        console.error(msg);
        const el = document.getElementById('error-container');
        document.getElementById('error-message-text').innerText = msg;
        el.style.display = 'block';
    },

    clearLogs: function () {
        document.getElementById('test-results-content').innerHTML = '';
        document.getElementById('test-results-content').style.display = 'none';
        document.getElementById('results-panel-empty').style.display = 'block';
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
