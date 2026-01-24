/**
 * NEXUS AI - Local Privacy-First Assistant
 * Nessuna API esterna. Tutto gira nel browser dell'utente.
 */

class NexusAI {
    constructor() {
        this.isOpen = false;
        this.apiUrl = (window.CONFIG && window.CONFIG.AI_API_URL) || "http://localhost:8000/chat";
        this.init();
    }

    init() {
        this.injectHTML();
        this.attachEvents();
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
                                <i class="fas fa-microchip"></i>
                            </div>
                            <div>
                                <h3 class="font-bold text-white text-sm tracking-wider">NEXUS AI</h3>
                                <p class="text-[10px] text-cyan-400 uppercase">Sistema Locale Sicuro</p>
                            </div>
                        </div>
                        <button id="nexus-ai-close" class="text-gray-400 hover:text-white transition-colors">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>

                    <div id="nexus-ai-messages" class="ai-messages">
                        <div class="message ai">
                            Inizializzazione protocollo... 🟩<br>
                            Sistema NEXUS 2.0 online. 🧠<br>Conosco segreti su OBS, crescita Twitch, hardware e molto altro. Mettimi alla prova!
                        </div>
                    </div>

                    <div class="ai-input-area">
                        <input type="text" id="nexus-ai-input" placeholder="Scrivi la tua domanda..." autocomplete="off" />
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

    handleUserMessage() {
        const text = this.input.value.trim();
        if (!text) return;

        // 1. Mostra messaggio utente
        this.addMessage(text, 'user');
        this.input.value = '';

        // 2. Simula "pensiero" AI
        const loadingId = this.addMessage('<i class="fas fa-circle-notch fa-spin"></i> Elaborazione neurale...', 'ai', true);

        // 3. Chiama il Backend Python
        this.fetchAnswer(text).then(response => {
            this.removeMessage(loadingId);
            this.addMessage(response, 'ai');
        }).catch(err => {
            this.removeMessage(loadingId);
            this.addMessage("⚠️ Errore di connessione al cervello Python. Assicurati di aver avviato 'js/bot.py'.", 'ai');
            console.error(err);
        });
    }

    async fetchAnswer(query) {
        try {
            const res = await fetch(this.apiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ text: query })
            });
            
            if (!res.ok) throw new Error("Server Error");
            
            const data = await res.json();
            return data.answer; // La risposta dal RAG Python
        } catch (e) {
            throw e;
        }
    }

    addMessage(text, sender, isTemp = false) {
        const msgDiv = document.createElement('div');
        const id = 'msg-' + Date.now();
        msgDiv.id = id;
        msgDiv.className = `message ${sender} ${isTemp ? 'temp' : ''}`;
        msgDiv.innerHTML = text;
        this.messagesContainer.appendChild(msgDiv);
        this.messagesContainer.scrollTop = this.messagesContainer.scrollHeight;
        return id;
    }

    removeMessage(id) {
        const el = document.getElementById(id);
        if (el) el.remove();
    }
}

// Avvia l'AI quando il DOM è pronto
document.addEventListener('DOMContentLoaded', () => {
    new NexusAI();
});