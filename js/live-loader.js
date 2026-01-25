import { db, collection, getDocs, query, where } from './firebase-init.js';

let streamers = [];
let streamerStates = {}; 
const avatarCache = {};

// Sostituisci questo URL con quello fornito da Cloudflare dopo il deploy
const WORKER_URL = (window.CONFIG && window.CONFIG.WORKER_URL) || "https://il-tuo-worker.tuonome.workers.dev";

async function initLive() {
    const grid = document.getElementById('streamerGrid');
    if (!grid) return;
    
    if(grid.children.length === 0) {
        grid.innerHTML = '<div class="text-center py-20"><i class="fas fa-spinner fa-spin text-4xl text-cyan-400"></i><p class="mt-4 text-gray-500">Caricamento streamers...</p></div>';
    }

    try {
        const creatorsRef = collection(db, 'creators');
        const snapshot = await getDocs(creatorsRef);

        if (snapshot.empty) {
            grid.innerHTML = '<div class="text-center text-gray-500 py-20">Nessun creator trovato.</div>';
            return;
        }

        streamers = [];
        snapshot.forEach(doc => {
            const data = doc.data();
            // Solo creator Twitch possono andare in live
            if (data.platform === 'Twitch' || (data.url && data.url.includes('twitch.tv'))) {
                const username = (data.url || '').split('/').pop().toLowerCase();
                if (username) {
                    streamers.push({
                        name: username,
                        label: data.name || username,
                        imageUrl: data.imageUrl // Usiamo l'immagine caricata se presente
                    });
                }
            }
        });

        await updateAndRender();

        const searchInput = document.getElementById('searchInput');
        if(searchInput) {
            searchInput.addEventListener('input', (e) => {
                 renderStreamers(e.target.value);
            });
        }

        // Aggiorna ogni 60 secondi
        setInterval(async () => {
            await updateAndRender();
        }, 60000);

    } catch (e) {
        console.error("Errore live:", e);
        grid.innerHTML = '<div class="text-center text-red-500">Errore caricamento. Riprova.</div>';
    }
}

async function updateAndRender() {
    await updateAllStates();
    const searchInput = document.getElementById('searchInput');
    renderStreamers(searchInput ? searchInput.value : '');
}

/**
 * NUOVA LOGICA: Chiama il Worker per controllare chi è live in un colpo solo
 */
async function updateAllStates() {
    if (streamers.length === 0) return;

    const usernames = streamers.map(s => s.name).join(',');

    // FALLBACK: Se il Worker non è configurato (URL placeholder), usa Decapi.me
    if (WORKER_URL.includes("il-tuo-worker") || !WORKER_URL) {
        // console.log("Worker non configurato, uso fallback Decapi...");
        const promises = streamers.map(async (s) => {
            try {
                const response = await fetch(`https://decapi.me/twitch/uptime/${s.name}`);
                const text = await response.text();
                streamerStates[s.name] = !text.toLowerCase().includes('offline');
            } catch (e) {
                streamerStates[s.name] = false;
            }
        });
        await Promise.all(promises);
        return;
    }

    try {
        // Chiamata al Worker Cloudflare
        const response = await fetch(`${WORKER_URL}?users=${usernames}`);
        const liveStreams = await response.json(); 
        // liveStreams è l'array 'data' che arriva dalle API di Twitch

        // Reset stati
        streamers.forEach(s => streamerStates[s.name] = false);

        // Imposta a true solo chi è nell'array dei live
        liveStreams.forEach(stream => {
            const login = stream.user_login.toLowerCase();
            streamerStates[login] = true;
            
            // Opzionale: salviamo l'avatar se Twitch lo restituisce (già pronto all'uso)
            if (stream.thumbnail_url) {
                avatarCache[login] = stream.thumbnail_url.replace('{width}', '300').replace('{height}', '300');
            }
        });
    } catch (e) {
        console.error("Errore Worker Twitch:", e);
    }
}

function renderStreamers(filter = "") {
    const grid = document.getElementById('streamerGrid');
    const noResults = document.getElementById('noResults');
    if (!grid) return;
    
    if(grid.querySelector('.fa-spinner')) grid.innerHTML = '';
    
    const filtered = streamers.filter(s => 
      s.label.toLowerCase().includes(filter.toLowerCase()) || 
      s.name.toLowerCase().includes(filter.toLowerCase())
    );

    if (filtered.length === 0) {
      if(noResults) noResults.classList.remove('hidden');
      grid.innerHTML = ''; 
      return;
    } 
    
    if(noResults) noResults.classList.add('hidden');

    const validUsers = filtered.map(s => s.name);

    // Rimuovi card non più necessarie (filtro)
    Array.from(grid.children).forEach(child => {
        if (!validUsers.includes(child.dataset.user)) {
            child.remove();
        }
    });

    filtered.forEach(s => {
        const isLive = streamerStates[s.name] || false;
        let card = grid.querySelector(`div[data-user="${s.name}"]`);

        if (card) {
            updateCardEstado(card, s, isLive);
        } else {
            card = createCardElement(s, isLive);
            grid.appendChild(card);
            loadAvatar(s.name);
        }
    });
    
    // Ordinamento: Live per primi
    const cards = Array.from(grid.children);
    cards.sort((a, b) => {
        const aLive = a.dataset.live === 'true';
        const bLive = b.dataset.live === 'true';
        if (aLive && !bLive) return -1;
        if (!aLive && bLive) return 1;
        return 0;
    });
    cards.forEach(card => grid.appendChild(card));
}

function createCardElement(s, isLive) {
    const row = document.createElement('div');
    row.className = "group relative glass rounded-2xl p-4 md:p-6 flex flex-col md:flex-row items-center gap-6 hover:bg-white/10 transition-all duration-300 border border-white/5 hover:border-cyan-400/30 overflow-hidden bg-black/40";
    row.dataset.user = s.name;
    row.dataset.live = isLive;

    row.innerHTML = `
        <div class="absolute -right-20 -top-20 w-64 h-64 bg-cyan-400/5 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
        <div class="relative flex-shrink-0">
            <div class="w-16 h-16 md:w-20 md:h-20 rounded-full overflow-hidden border-2 border-white/10 group-hover:border-cyan-400/50 transition-colors duration-500 bg-gray-900 flex items-center justify-center">
                <img id="avatar-${s.name}" class="w-full h-full object-cover opacity-0 transition-opacity duration-500" alt="${s.label}">
                <div id="loader-${s.name}" class="absolute inset-0 flex items-center justify-center">
                    <div class="w-6 h-6 border-2 border-cyan-400/20 border-t-cyan-400 rounded-full animate-spin"></div>
                </div>
            </div>
        </div>

        <div class="flex-1 text-center md:text-left min-w-0">
            <div class="flex items-center justify-center md:justify-start gap-3 mb-1">
                <h3 class="streamer-name-text text-xl md:text-2xl font-bold group-hover:text-cyan-400 transition-colors truncate">
                    ${s.label}
                </h3>
                <span class="status-badge inline-flex items-center px-2 py-0.5 rounded text-xs font-bold ${isLive ? 'bg-red-500/20 text-red-500 border border-red-500/50 animate-pulse' : 'hidden'}">LIVE</span>
            </div>
            <p class="text-gray-400 text-sm md:text-base group-hover:text-gray-300 transition-colors truncate">Twitch Streamer</p>
        </div>

        <div class="flex-shrink-0 w-full md:w-auto mt-4 md:mt-0">
            <a href="./player.html?user=${s.name}" class="action-btn block w-full md:w-auto text-center px-8 py-3 rounded-xl font-bold transition-all duration-300 transform hover:scale-105 ${isLive ? 'bg-cyan-500 text-black hover:bg-cyan-400 hover:shadow-[0_0_20px_rgba(34,211,238,0.4)]' : 'bg-white/5 text-gray-400 hover:bg-white/10'}">
                ${isLive ? '<i class="fas fa-play mr-2"></i>Guarda Ora' : 'Offline'}
            </a>
        </div>
    `;
    return row;
}

function updateCardEstado(card, s, isLive) {
    if (card.dataset.live === String(isLive)) return; 
    card.dataset.live = isLive;
    
    const badge = card.querySelector('.status-badge');
    if(badge) {
        if(isLive) {
            badge.className = 'status-badge inline-flex items-center px-2 py-0.5 rounded text-xs font-bold bg-red-500/20 text-red-500 border border-red-500/50 animate-pulse';
            badge.innerText = 'LIVE';
            badge.classList.remove('hidden');
        } else {
            badge.classList.add('hidden');
        }
    }

    const btn = card.querySelector('.action-btn');
    if(btn) {
        if(isLive) {
            btn.className = 'action-btn block w-full md:w-auto text-center px-8 py-3 rounded-xl font-bold transition-all duration-300 transform hover:scale-105 bg-cyan-500 text-black hover:bg-cyan-400 hover:shadow-[0_0_20px_rgba(34,211,238,0.4)]';
            btn.innerHTML = '<i class="fas fa-play mr-2"></i>Guarda Ora';
        } else {
            btn.className = 'action-btn block w-full md:w-auto text-center px-8 py-3 rounded-xl font-bold transition-all duration-300 transform hover:scale-105 bg-white/5 text-gray-400 hover:bg-white/10';
            btn.innerHTML = 'Offline';
        }
    }
}

async function loadAvatar(username) {
    const img = document.getElementById(`avatar-${username}`);
    const loader = document.getElementById(`loader-${username}`);
    if (!img) return;

    const streamerData = streamers.find(s => s.name === username);

    try {
        let url = "";

        // 1. Priorità all'immagine caricata nel database
        if (streamerData && streamerData.imageUrl) {
            url = streamerData.imageUrl;
        } 
        // 2. Cache worker
        else if (avatarCache[username]) {
            url = avatarCache[username];
        } 
        // 3. Fallback Decapi/Twitch
        else {
            const res = await fetch(`https://decapi.me/twitch/avatar/${username}`);
            url = await res.text();
            avatarCache[username] = url;
        }

        img.onload = () => {
            img.classList.remove('opacity-0');
            if (loader) loader.remove();
        };
        img.src = url;
    } catch {
        if (loader) loader.remove();
    }
}

document.addEventListener('DOMContentLoaded', initLive);