/**
 * NEXUS AI - Nyra Alt Widget
 * Integrato con Firebase Firestore e OpenRouter.
 */

import { db, collection, getDocs, onSnapshot } from './firebase-init.js';

class NexusAI {
    constructor() {
        this.isOpen = false;
        this.apiUrl = "https://openrouter.ai/api/v1/chat/completions";
        this.apiKey = "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";
        this.model = "deepseek/deepseek-r1-0528:free";
        this.knowledgeBase = [];
        this.isThinking = false;
        this.init();
    }

    async init() {
        this.loadKnowledgeBase(); // Ora asincrono con listener
        this.injectHTML();
        this.attachEvents();
        this.loadScripts();
    }

    loadKnowledgeBase() {
        // Listener in tempo reale: se aggiungi una domanda in dashboard, l'IA la impara SUBITO
        onSnapshot(collection(db, 'knowledge'), (snapshot) => {
            this.knowledgeBase = snapshot.docs.map(doc => doc.data());
            console.log(`Nexus AI: Knowledge Base aggiornata (${this.knowledgeBase.length} elementi).`);
        }, (error) => {
            console.error("Errore listener KB:", error);
        });
    }

    async loadScripts() {
        if (!window.marked) {
            const script = document.createElement('script');
            script.src = "https://cdn.jsdelivr.net/npm/marked/marked.min.js";
            document.head.appendChild(script);
        }
    }

    injectHTML() {
        const widgetHTML = `
            <div id="nexus-ai-widget" class="nexus-ai-closed">
                <button id="nexus-ai-toggle" class="glow">
                    <i class="fas fa-robot text-2xl"></i>
                </button>

                <div id="nexus-ai-window" class="glass">
                    <div class="ai-header">
                        <div class="flex items-center gap-3">
                            <div class="w-8 h-8 rounded-full bg-cyan-400/20 flex items-center justify-center text-cyan-400 border border-cyan-400">
                                <i class="fas fa-brain"></i>
                            </div>
                            <div>
                                <h3 class="font-bold text-white text-sm tracking-wider">NEXUS AI</h3>
                                <p class="text-[10px] text-cyan-400 uppercase">Attiva 24/24h</p>
                            </div>
                        </div>
                        <button id="nexus-ai-close" class="text-gray-400 hover:text-white transition-colors">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>

                    <div id="nexus-ai-messages" class="ai-messages">
                        <div class="message ai">
                            Ciao! Sono <b>Nexus AI</b>. 🟩<br>
                            Posso aiutarti con info su OBS, crescita Twitch e hardware. Chiedimi pure!
                        </div>
                    </div>

                    <div class="ai-input-area">
                        <input type="text" id="nexus-ai-input" placeholder="Scrivi una domanda..." autocomplete="off" />
                        <button id="nexus-ai-send">
                            <i class="fas fa-paper-plane"></i>
                        </button>
                    </div>
                </div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', widgetHTML);
    }

    attachEvents() {
        this.widget = document.getElementById('nexus-ai-widget');
        this.toggleBtn = document.getElementById('nexus-ai-toggle');
        this.closeBtn = document.getElementById('nexus-ai-close');
        this.input = document.getElementById('nexus-ai-input');
        this.sendBtn = document.getElementById('nexus-ai-send');
        this.messagesContainer = document.getElementById('nexus-ai-messages');

        this.toggleBtn.addEventListener('click', () => this.toggleChat());
        this.closeBtn.addEventListener('click', () => this.toggleChat());
        this.sendBtn.addEventListener('click', () => this.handleUserMessage());
        this.input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.handleUserMessage();
        });
    }

    toggleChat() {
        this.isOpen = !this.isOpen;
        if (this.isOpen) {
            this.widget.classList.remove('nexus-ai-closed');
            this.widget.classList.add('nexus-ai-open');
            setTimeout(() => this.input.focus(), 300);
        } else {
            this.widget.classList.remove('nexus-ai-open');
            this.widget.classList.add('nexus-ai-closed');
        }
    }

    async handleUserMessage() {
        if (this.isThinking) return;
        
        const text = this.input.value.trim();
        if (!text) return;

        this.isThinking = true;
        this.input.disabled = true;
        this.sendBtn.style.opacity = "0.5";
        this.sendBtn.style.cursor = "not-allowed";

        this.addMessage(text, 'user');
        this.input.value = '';

        // Mostra sempre il caricamento per almeno 1.5 secondi per un feedback naturale
        const loadingId = this.addMessage('<i class="fas fa-circle-notch fa-spin"></i> Nexus AI sta ragionando...', 'ai', true);
        const startTime = Date.now();

        // 1. Cerca nella Knowledge Base locale/firebase
        const localAnswer = this.findLocalAnswer(text);

        if (localAnswer) {
            const elapsedTime = Date.now() - startTime;
            const remainingTime = Math.max(0, 1500 - elapsedTime);
            
            setTimeout(() => {
                this.removeMessage(loadingId);
                this.addMessage(localAnswer, 'ai');
                this.finalizeThinking();
            }, remainingTime);
            return;
        }

        // 2. Se non presente in KB, vai su OpenRouter AI
        try {
            const response = await this.fetchAnswer(text);
            const elapsedTime = Date.now() - startTime;
            const remainingTime = Math.max(0, 1500 - elapsedTime);

            setTimeout(() => {
                this.removeMessage(loadingId);
                this.addMessage(response, 'ai');
                this.finalizeThinking();
            }, remainingTime);
        } catch (err) {
            this.removeMessage(loadingId);
            this.addMessage("⚠️ Errore di connessione. Riprova.", 'ai');
            this.finalizeThinking();
            console.error(err);
        }
    }

    finalizeThinking() {
        this.isThinking = false;
        this.input.disabled = false;
        this.sendBtn.style.opacity = "1";
        this.sendBtn.style.cursor = "pointer";
        this.input.focus();
    }

    findLocalAnswer(query) {
        if (!this.knowledgeBase.length) return null;

        const normalize = (text) => {
            return text.toLowerCase()
                .replace(/['’]/g, " ") // Trasforma apostrofi in spazi (es. Qual'è -> Qual è)
                .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?]/g, "")
                .split(/\s+/)
                .filter(w => w.length > 2);
        };

        const userWords = normalize(query);
        if (userWords.length === 0) return null;

        let bestMatch = null;
        let highestScore = 0;

        for (const item of this.knowledgeBase) {
            const kbWords = normalize(item.question);
            if (kbWords.length === 0) continue;

            let matches = 0;
            userWords.forEach(uWord => {
                // 1. Match esatto parola per parola
                if (kbWords.includes(uWord)) {
                    matches += 1;
                } else {
                    // 2. Match parziale (es. "streamer" match "streaming")
                    const partialMatch = kbWords.some(kW => kW.includes(uWord) || uWord.includes(kW));
                    if (partialMatch) matches += 0.5;
                }
            });

            // Calcolo punteggio: quanto dell'intento principale è coperto?
            const score = (matches / kbWords.length) * 100;

            // Soglia abbassata al 30% per essere molto più permissivi
            if (score > highestScore && score >= 30) {
                highestScore = score;
                bestMatch = item.answer;
            }
        }

        if (bestMatch) {
            console.log(`Nexus AI: Match locale! Confidenza: ${highestScore.toFixed(0)}%`);
        }
        
        return bestMatch;
    }

    async fetchAnswer(query) {
        try {
            const res = await fetch(this.apiUrl, {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${this.apiKey}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    "model": this.model,
                    "messages": [
                        { "role": "system", "content": "Sei Nexus AI, assistente di Nexus Network. Rispondi in modo conciso in Italiano. Massima priorità a OBS, Twitch e crescita streamer. Se un utente ha problemi tecnici o domande complesse non presenti nel network, digli di APRIRE UN TICKET sul server Discord ufficiale: https://discord.gg/mG6qGfKeXp. Non menzionare email di supporto." },
                        { "role": "user", "content": query }
                    ],
                    "temperature": 0.4
                })
            });
            const data = await res.json();
            return data.choices[0].message.content.trim();
        } catch (e) { throw e; }
    }

    addMessage(text, sender, isTemp = false) {
        const msgDiv = document.createElement('div');
        msgDiv.id = 'msg-' + Date.now();
        msgDiv.className = `message ${sender} ${isTemp ? 'temp' : ''}`;
        if (window.marked && !isTemp) {
            msgDiv.innerHTML = marked.parse(text);
        } else {
            msgDiv.innerHTML = text;
        }
        this.messagesContainer.appendChild(msgDiv);
        this.messagesContainer.scrollTop = this.messagesContainer.scrollHeight;
        return msgDiv.id;
    }

    removeMessage(id) {
        const el = document.getElementById(id);
        if (el) el.remove();
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new NexusAI();
});
