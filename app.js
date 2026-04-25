// DOM Elements - Disguise Mode
const disguiseMode = document.getElementById('disguise-mode');
const calcDisplay = document.getElementById('calc-display');
const calcBtns = document.querySelectorAll('.calc-btn');
const secretTrigger = document.getElementById('secret-trigger');

// DOM Elements - Vault Mode
const vaultMode = document.getElementById('vault-mode');
const bodyBg = document.getElementById('body-bg');
const lockBtn = document.getElementById('lock-btn');

// DOM Elements - Settings
const settingsBtn = document.getElementById('settings-btn');
const settingsModal = document.getElementById('settings-modal');
const closeSettingsBtn = document.getElementById('close-settings');
const saveSettingsBtn = document.getElementById('save-settings');
const groqKeyInput = document.getElementById('groq-key');

// DOM Elements - Voice Capture
const recordBtn = document.getElementById('record-btn');
const recordIcon = document.getElementById('record-icon');
const recordStatus = document.getElementById('record-status');
const transcriptDisplay = document.getElementById('transcript-display');
const micPulse = document.getElementById('mic-pulse');

// DOM Elements - Evidence Log
const evidenceTableBody = document.getElementById('evidence-table-body');
const emptyState = document.getElementById('empty-state');
const exportPdfBtn = document.getElementById('export-pdf-btn');

// State
let currentCalcInput = '';
let isRecording = false;
let finalTranscript = '';
let recognition = null;

// Initialization
document.addEventListener('DOMContentLoaded', () => {
    loadEvidence();
    loadSettings();
    initSpeechRecognition();
});

// --- DISGUISE LOGIC ---
calcBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        const val = btn.getAttribute('data-val');
        
        if (val === 'C') {
            currentCalcInput = '';
            calcDisplay.textContent = '0';
        } else if (val === '=') {
            // Secret PIN check
            if (currentCalcInput === '2025') {
                unlockVault();
            } else {
                try {
                    // Simple eval for realism, replace X and division signs
                    let toEval = currentCalcInput.replace(/×/g, '*').replace(/÷/g, '/');
                    calcDisplay.textContent = eval(toEval) || '0';
                    currentCalcInput = calcDisplay.textContent;
                } catch {
                    calcDisplay.textContent = 'Error';
                    currentCalcInput = '';
                }
            }
        } else {
            if (currentCalcInput === '0' || currentCalcInput === 'Error') currentCalcInput = '';
            currentCalcInput += val;
            calcDisplay.textContent = currentCalcInput;
        }
    });
});

// Hidden trigger in the corner
secretTrigger.addEventListener('click', unlockVault);

function unlockVault() {
    disguiseMode.classList.add('opacity-0');
    setTimeout(() => {
        disguiseMode.classList.add('hidden');
        vaultMode.classList.remove('hidden');
        // Add a small delay before removing opacity if we added it, but vault doesn't have opacity-0
        bodyBg.classList.remove('bg-gray-100');
        bodyBg.classList.add('bg-vault-900');
    }, 500);
    currentCalcInput = '';
    calcDisplay.textContent = '0';
}

lockBtn.addEventListener('click', () => {
    vaultMode.classList.add('hidden');
    disguiseMode.classList.remove('hidden', 'opacity-0');
    bodyBg.classList.remove('bg-vault-900');
    bodyBg.classList.add('bg-gray-100');
});

// --- SETTINGS LOGIC ---
function loadSettings() {
    const key = localStorage.getItem('groqApiKey');
    if (key) {
        groqKeyInput.value = key;
    }
}

settingsBtn.addEventListener('click', () => {
    settingsModal.classList.remove('hidden');
});

closeSettingsBtn.addEventListener('click', () => {
    settingsModal.classList.add('hidden');
});

saveSettingsBtn.addEventListener('click', () => {
    const key = groqKeyInput.value.trim();
    if (key) {
        localStorage.setItem('groqApiKey', key);
    } else {
        localStorage.removeItem('groqApiKey');
    }
    settingsModal.classList.add('hidden');
});

// --- VOICE CAPTURE LOGIC ---
function initSpeechRecognition() {
    if (!('webkitSpeechRecognition' in window)) {
        recordStatus.textContent = "Speech recognition not supported in this browser.";
        recordBtn.disabled = true;
        recordBtn.classList.add('opacity-50', 'cursor-not-allowed');
        return;
    }

    recognition = new webkitSpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onstart = function() {
        isRecording = true;
        finalTranscript = '';
        transcriptDisplay.textContent = '';
        
        recordBtn.classList.add('recording-active');
        micPulse.classList.add('recording-pulse');
        recordIcon.classList.remove('fa-microphone');
        recordIcon.classList.add('fa-stop');
        recordStatus.textContent = "Listening... Tap to stop and analyze";
    };

    recognition.onerror = function(event) {
        console.error("Speech recognition error", event.error);
        stopRecording();
        recordStatus.textContent = `Error: ${event.error}`;
    };

    recognition.onend = function() {
        if (isRecording) {
            // Unexpected end, restart
            recognition.start();
        }
    };

    recognition.onresult = function(event) {
        let interimTranscript = '';
        
        for (let i = event.resultIndex; i < event.results.length; ++i) {
            if (event.results[i].isFinal) {
                finalTranscript += event.results[i][0].transcript + ' ';
            } else {
                interimTranscript += event.results[i][0].transcript;
            }
        }
        
        transcriptDisplay.innerHTML = finalTranscript + '<i class="text-gray-500">' + interimTranscript + '</i>';
    };
}

recordBtn.addEventListener('click', () => {
    if (!recognition) return;
    
    if (isRecording) {
        stopRecording();
        processAudioText(finalTranscript);
    } else {
        recognition.start();
    }
});

function stopRecording() {
    isRecording = false;
    if (recognition) {
        recognition.stop();
    }
    
    recordBtn.classList.remove('recording-active');
    micPulse.classList.remove('recording-pulse');
    recordIcon.classList.remove('fa-stop');
    recordIcon.classList.add('fa-microphone');
    recordStatus.textContent = "Ready to record";
}

// --- AI INTEGRATION LOGIC ---
async function processAudioText(text) {
    if (!text || text.trim() === '') {
        recordStatus.textContent = "No speech detected. Try again.";
        return;
    }

    const apiKey = localStorage.getItem('groqApiKey');
    if (!apiKey) {
        alert("Please set your Groq API Key in Settings first.");
        settingsModal.classList.remove('hidden');
        return;
    }

    recordStatus.textContent = "Analyzing threat level...";
    transcriptDisplay.innerHTML = `<span class="text-vault-accent"><i class="fa-solid fa-spinner fa-spin mr-2"></i>AI is processing evidence...</span>`;

    const systemPrompt = `You are an AI assistant for a secure evidence locker app for women in unsafe environments. 
Your task is to analyze the user's spoken text and classify the threat.
You MUST respond with a valid JSON object only, with no markdown formatting or other text.
Format:
{
  "threat_type": "Brief description of the threat (e.g., Domestic Violence, Stalking, Verbal Abuse)",
  "urgency_score": <integer from 1-5, where 5 is immediate physical danger>,
  "redacted_summary": "A concise summary of the incident with sensitive PII (names, exact locations) replaced with [REDACTED]",
  "tags": ["tag1", "tag2"]
}`;

    try {
        const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: "llama3-8b-8192",
                messages: [
                    { role: "system", content: systemPrompt },
                    { role: "user", content: `Analyze this transcript: "${text}"` }
                ],
                temperature: 0.1,
                response_format: { type: "json_object" }
            })
        });

        if (!response.ok) {
            throw new Error(`API returned ${response.status}`);
        }

        const data = await response.json();
        let aiResult;
        try {
            aiResult = JSON.parse(data.choices[0].message.content);
        } catch (e) {
            console.error("Failed to parse JSON from AI", data.choices[0].message.content);
            throw new Error("Invalid AI response format");
        }

        saveEvidence(text, aiResult);
        recordStatus.textContent = "Analysis complete. Evidence saved.";
        transcriptDisplay.innerHTML = `<strong>Final Transcript:</strong><br>${text}`;
        
    } catch (error) {
        console.error("AI Analysis Error:", error);
        recordStatus.textContent = "Analysis failed. Saved raw transcript.";
        
        // Fallback save if AI fails
        saveEvidence(text, {
            threat_type: "Unclassified (Error)",
            urgency_score: 0,
            redacted_summary: "AI classification failed. Raw transcript saved.",
            tags: ["error", "raw"]
        });
    }
}

// --- EVIDENCE LOG LOGIC ---
function loadEvidence() {
    const logs = JSON.parse(localStorage.getItem('herlock_evidence') || '[]');
    renderEvidence(logs);
}

function saveEvidence(originalText, aiResult) {
    const logs = JSON.parse(localStorage.getItem('herlock_evidence') || '[]');
    
    const newLog = {
        id: Date.now().toString(),
        timestamp: new Date().toISOString(),
        originalText: originalText,
        aiResult: aiResult
    };
    
    logs.unshift(newLog); // Add to beginning
    localStorage.setItem('herlock_evidence', JSON.stringify(logs));
    
    renderEvidence(logs);
}

function deleteEvidence(id) {
    if(!confirm("Are you sure you want to permanently delete this evidence?")) return;
    
    let logs = JSON.parse(localStorage.getItem('herlock_evidence') || '[]');
    logs = logs.filter(log => log.id !== id);
    localStorage.setItem('herlock_evidence', JSON.stringify(logs));
    
    renderEvidence(logs);
}

function renderEvidence(logs) {
    evidenceTableBody.innerHTML = '';
    
    if (logs.length === 0) {
        emptyState.classList.remove('hidden');
    } else {
        emptyState.classList.add('hidden');
        
        logs.forEach(log => {
            const date = new Date(log.timestamp);
            const formattedDate = date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
            
            const tr = document.createElement('tr');
            tr.className = 'hover:bg-vault-700/50 transition-colors';
            
            // Risk Level Badge formatting
            let riskClass = 'bg-gray-500/20 text-gray-400';
            if (log.aiResult.urgency_score >= 4) {
                riskClass = 'bg-red-500/20 text-red-400 border border-red-500/30';
            } else if (log.aiResult.urgency_score == 3) {
                riskClass = 'bg-orange-500/20 text-orange-400 border border-orange-500/30';
            } else if (log.aiResult.urgency_score > 0) {
                riskClass = 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30';
            }

            const tagsHtml = (log.aiResult.tags || []).map(tag => 
                `<span class="inline-block px-2 py-0.5 bg-vault-900 border border-vault-700 rounded text-xs text-gray-400 mr-1 mt-1">#${tag}</span>`
            ).join('');

            tr.innerHTML = `
                <td class="p-3 align-top whitespace-nowrap text-gray-400 text-xs">
                    ${formattedDate}
                </td>
                <td class="p-3 align-top">
                    <div class="font-medium text-white mb-1">${log.aiResult.threat_type}</div>
                    <div class="text-xs text-gray-400 mb-2">${log.aiResult.redacted_summary}</div>
                    <div class="flex flex-wrap">${tagsHtml}</div>
                </td>
                <td class="p-3 align-top">
                    <span class="px-2 py-1 rounded text-xs font-semibold ${riskClass}">
                        Level ${log.aiResult.urgency_score} / 5
                    </span>
                </td>
                <td class="p-3 align-top text-center pdf-exclude">
                    <button onclick="deleteEvidence('${log.id}')" class="text-gray-500 hover:text-red-400 transition-colors" title="Delete Evidence">
                        <i class="fa-solid fa-trash-can"></i>
                    </button>
                </td>
            `;
            
            evidenceTableBody.appendChild(tr);
        });
    }
}

// --- PDF EXPORT LOGIC ---
exportPdfBtn.addEventListener('click', async () => {
    const logs = JSON.parse(localStorage.getItem('herlock_evidence') || '[]');
    if (logs.length === 0) {
        alert("No evidence to export.");
        return;
    }

    const originalBtnText = exportPdfBtn.innerHTML;
    exportPdfBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin mr-2"></i> Generating...';
    exportPdfBtn.disabled = true;

    try {
        const pdfContainer = document.getElementById('pdf-container');
        const pdfHeader = document.getElementById('pdf-header');
        const pdfFooter = document.getElementById('pdf-footer');
        const timestampSpan = document.getElementById('pdf-timestamp');
        
        // Setup for PDF capture
        const now = new Date();
        timestampSpan.textContent = now.toLocaleString() + " (UTC " + now.getTimezoneOffset()/-60 + ")";
        
        pdfHeader.classList.remove('hidden');
        pdfFooter.classList.remove('hidden');
        pdfContainer.classList.add('pdf-export-mode');
        
        // Exclude action column
        document.querySelectorAll('.pdf-exclude').forEach(el => el.style.display = 'none');

        const canvas = await html2canvas(pdfContainer, {
            scale: 2,
            backgroundColor: '#0f172a',
            logging: false
        });

        // Revert UI changes
        pdfHeader.classList.add('hidden');
        pdfFooter.classList.add('hidden');
        pdfContainer.classList.remove('pdf-export-mode');
        document.querySelectorAll('.pdf-exclude').forEach(el => el.style.display = '');

        // Create PDF
        const { jsPDF } = window.jspdf;
        const pdf = new jsPDF('p', 'mm', 'a4');
        
        const imgData = canvas.toDataURL('image/png');
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
        
        pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
        
        const fileName = `HerLock_Evidence_${now.toISOString().split('T')[0]}.pdf`;
        pdf.save(fileName);
        
    } catch (error) {
        console.error("PDF Generation Error:", error);
        alert("Failed to generate PDF. Check console for details.");
    } finally {
        exportPdfBtn.innerHTML = originalBtnText;
        exportPdfBtn.disabled = false;
    }
});
