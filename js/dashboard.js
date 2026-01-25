
import { 
    auth, db, storage, 
    collection, getDocs, addDoc, deleteDoc, doc, updateDoc, 
    ref, uploadBytes, getDownloadURL, 
    onAuthStateChanged, signOut,
    setPersistence, browserSessionPersistence
} from './firebase-init.js';
import { INITIAL_STAFF, INITIAL_CREATORS, INITIAL_STREAMERS } from './seeds-data.js';
import { openImagePicker, closeImagePicker } from './image-picker.js';

// State locale
let currentSection = 'staff';

const COLLECTIONS = {
    'staff': 'staff',
    'creators': 'creators',
    'knowledge': 'knowledge'
};

// 1. Inizializza Dashboard
async function initDashboard() {
    
    // Auth Check e Setup
    onAuthStateChanged(auth, (user) => {
        if (!user) {
            window.location.href = 'login.html';
        } else {
            let adminName = user.email.split('@')[0];
            let roleTitle = 'Amministratore';
            const adminEmail = user.email.toLowerCase();

            if (adminEmail === 'therealsam@nexusfounder.it') {
                adminName = 'TheRealSam';
                roleTitle = 'Founder'; 
            } else if (adminEmail === 'shadowstrike@nexusdev.it') {
                adminName = 'ShadowStrike';
                roleTitle = 'Developer';
            }

            const nameEl = document.getElementById('adminUsername');
            if (nameEl) nameEl.innerText = adminName;
            
            const roleEl = document.getElementById('adminRole');
            if (roleEl) {
                if (roleTitle) roleEl.innerText = roleTitle;
                else roleEl.style.display = 'none';
            }

            switchView('dashboard');
        }
    });

    // Navigation Listeners
    document.querySelectorAll('.sidebar-link').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const targetSection = e.currentTarget.dataset.section;
            
            document.querySelectorAll('.sidebar-link').forEach(l => {
                l.classList.remove('bg-purple-600', 'text-white', 'active');
                l.classList.add('text-gray-400', 'hover:bg-gray-800');
            });
            e.currentTarget.classList.remove('text-gray-400', 'hover:bg-gray-800');
            e.currentTarget.classList.add('bg-purple-600', 'text-white', 'active');

            currentSection = targetSection;
            switchView(targetSection);
        });
    });

    document.getElementById('logoutBtn').addEventListener('click', () => {
        signOut(auth).then(() => {
            window.location.href = '../../index.html';
        });
    });
}

function switchView(section) {
    document.querySelectorAll('.page-view').forEach(el => el.classList.add('hidden'));
    
    const viewId = `view-${section}`;
    const viewEl = document.getElementById(viewId);
    if(viewEl) viewEl.classList.remove('hidden');

    if (section === 'dashboard') {
        loadDashboardStats();
    } else {
        loadData(section);
    }
}

async function loadDashboardStats() {
    try {
        const staffSnap = await getDocs(collection(db, 'staff'));
        const creatorsSnap = await getDocs(collection(db, 'creators'));
        const knowledgeSnap = await getDocs(collection(db, 'knowledge'));

        document.getElementById('statsStaff').innerText = staffSnap.size;
        document.getElementById('statsCreators').innerText = creatorsSnap.size;
        document.getElementById('statsKnowledge').innerText = knowledgeSnap.size;
    } catch (e) {
        console.error("Errore stats:", e);
    }
}

// Funzione per caricare i dati nelle tabelle (ora include knowledge)
async function loadData(section) {
    const tableId = `${section}TableBody`;
    const tableBody = document.getElementById(tableId);
    if (!tableBody) return;

    tableBody.innerHTML = '<tr><td colspan="4" class="text-center py-8"><i class="fas fa-spinner fa-spin text-2xl"></i></td></tr>';

    try {
        const querySnapshot = await getDocs(collection(db, COLLECTIONS[section]));
        
        tableBody.innerHTML = '';
        if (querySnapshot.empty) {
            tableBody.innerHTML = `<tr><td colspan="4" class="text-center py-8 text-gray-500">Nessun elemento trovato in ${section}. Aggiungine uno!</td></tr>`;
            return;
        }

        querySnapshot.forEach((doc) => {
            const item = doc.data();
            item._id = doc.id; 
            const row = createRow(item, section);
            tableBody.innerHTML += row;
        });

    } catch (error) {
        console.error("Errore caricamento dati:", error);
        tableBody.innerHTML = '<tr><td colspan="4" class="text-center py-8 text-red-500">Errore: ' + error.message + '</td></tr>';
    }
}

// Funzione Speciale: Importa Knowledge Base da JSON locale a Firebase
window.importKnowledgeBase = async function(e) {
    if (!confirm("Vuoi importare tutte le domande dal file JSON locale su Firebase?")) return;
    
    try {
        const response = await fetch('../../js/knowledge_base.json');
        const data = await response.json();
        
        const btn = e ? e.target : null;
        if (btn) {
            btn.disabled = true;
            btn.innerText = "Importazione in corso...";
        }

        for (const item of data) {
            await addDoc(collection(db, 'knowledge'), {
                question: item.question,
                answer: item.answer,
                createdAt: new Date()
            });
        }

        alert("Importazione completata con successo!");
        loadData('knowledge');
    } catch (e) {
        console.error("Errore importazione:", e);
        alert("Errore durante l'importazione.");
    }
};

// Helper per creare righe tabella
function createRow(item, section) {
    if (section === 'knowledge') {
        return `
            <tr class="border-b border-gray-800 hover:bg-gray-800/50 transition-colors">
                <td class="py-4 px-4 font-bold text-cyan-400">${item.question}</td>
                <td class="py-4 px-4 text-gray-300">${item.answer}</td>
                <td class="py-4 px-4 text-right">
                    <button onclick='window.openModal(${JSON.stringify(item).replace(/'/g, "&#39;")})' class="text-gray-500 hover:text-cyan-400 transition-colors p-2 mr-2"><i class="fas fa-edit"></i></button>
                    <button onclick="window.deleteItem('${item._id}')" class="text-gray-500 hover:text-red-400 transition-colors p-2"><i class="fas fa-trash"></i></button>
                </td>
            </tr>
        `;
    }

    let imageCell = '';
    let statusCell = '';

    if (item.imageUrl) {
        imageCell = `<img src="${item.imageUrl}" class="w-10 h-10 rounded-full object-cover border border-gray-700">`;
    } else {
        imageCell = `<div class="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center text-xs text-gray-400">N/A</div>`;
    }

    const statusId = `status-${item._id}`;
    let name = item.name || item.username || 'No Name';
    let extraInfo = '';
    
    if (section === 'staff') {
         extraInfo = item.role || 'Staff';
         let socialsHtml = '<div class="flex gap-2 text-lg">';
         if (item.instagram) socialsHtml += `<a href="${item.instagram}" target="_blank" class="text-pink-500 hover:text-pink-400"><i class="fab fa-instagram"></i></a>`;
         if (item.twitch) socialsHtml += `<a href="${item.twitch}" target="_blank" class="text-purple-500 hover:text-purple-400"><i class="fab fa-twitch"></i></a>`;
         if (item.github) socialsHtml += `<a href="${item.github}" target="_blank" class="text-white hover:text-gray-300"><i class="fab fa-github"></i></a>`;
         socialsHtml += '</div>';
         statusCell = socialsHtml;
    }

    if (section === 'creators') {
        extraInfo = item.platform || 'Creator';
        statusCell = `<span id="${statusId}" class="text-gray-500 text-xs italic">Verifica...</span>`;
        if (item.url && item.url.includes('twitch.tv')) {
            const username = item.url.split('/').pop();
            fetchLiveStatus(username, statusId);
        } else {
             statusCell = `<span class="text-gray-600 text-xs">-</span>`;
        }
    }
    
    if (section === 'streamers') {
        extraInfo = item.platform || 'Twitch';
        statusCell = `<span id="${statusId}" class="text-gray-500 text-xs italic">Verifica...</span>`;
        if (item.username) {
             fetchLiveStatus(item.username, statusId);
        }
    }

    return `
        <tr class="border-b border-gray-800 hover:bg-gray-800/50 transition-colors group">
            <td class="py-4 px-4">${imageCell}</td>
            <td class="py-4 px-4">
                <div class="font-bold text-white">${name}</div>
                <div class="text-xs text-gray-500">${extraInfo}</div>
            </td>
            <td class="py-4 px-4">${statusCell}</td>
            <td class="py-4 px-4 text-right">
                <button onclick='window.openModal(${JSON.stringify(item).replace(/'/g, "&#39;")})' class="text-gray-500 hover:text-cyan-400 transition-colors p-2 mr-2">
                    <i class="fas fa-edit"></i>
                </button>
                <button onclick="window.deleteItem('${item._id}')" class="text-gray-500 hover:text-red-400 transition-colors p-2">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        </tr>
    `;
}

async function fetchLiveStatus(username, elementId) {
    try {
        const response = await fetch(`https://decapi.me/twitch/uptime/${username}`);
        const text = await response.text();
        const el = document.getElementById(elementId);
        if (!el) return;
        const isOffline = text.toLowerCase().includes('offline') || text.toLowerCase().includes('not found') || text.toLowerCase().includes('error') || !text;
        if (!isOffline) {
            el.innerHTML = `<span class="bg-red-600/20 text-red-500 border border-red-500/50 px-2 py-1 rounded text-xs font-bold tracking-wider animate-pulse">LIVE</span>`;
        } else {
            el.innerHTML = `<span class="text-gray-500 text-xs font-medium">Offline</span>`;
        }
    } catch (e) {
        const el = document.getElementById(elementId);
        if(el) el.innerHTML = `<span class="text-gray-700 text-xs">Err</span>`;
    }
}

window.openModal = function(item = null) {
    document.getElementById('modal').classList.remove('hidden');
    document.getElementById('modal').classList.add('flex');
    renderFormFields(item);
    document.getElementById('modalTitle').innerText = item ? 'Modifica Elemento' : 'Aggiungi Elemento';
};

window.closeModal = function() {
    document.getElementById('modal').classList.add('hidden');
    document.getElementById('modal').classList.remove('flex');
    document.getElementById('crudForm').reset();
};

function renderFormFields(item = null) {
    const fieldsContainer = document.getElementById('formFields');
    fieldsContainer.innerHTML = '';
    
    let idField = '';
    if (item && item._id) {
        idField = `<input type="hidden" name="id" value="${item._id}">`;
    }

    if (currentSection === 'knowledge') {
        fieldsContainer.innerHTML = idField + `
            <div>
                <label class="block text-gray-400 text-sm mb-2">Domanda</label>
                <input type="text" name="question" value="${item ? item.question : ''}" required class="w-full bg-gray-900 border border-gray-700 rounded p-2 text-white focus:border-cyan-500 focus:outline-none" placeholder="Es. Come configuro OBS?">
            </div>
            <div>
                <label class="block text-gray-400 text-sm mb-2">Risposta</label>
                <textarea name="answer" rows="4" required class="w-full bg-gray-900 border border-gray-700 rounded p-2 text-white focus:border-cyan-500 focus:outline-none" placeholder="La risposta dell'AI...">${item ? item.answer : ''}</textarea>
            </div>
        `;
        return;
    }

    let commonFields = `
         <div>
             <label class="block text-gray-400 text-sm mb-2">Nome</label>
             <input type="text" name="name" value="${item ? item.name : ''}" required class="w-full bg-gray-900 border border-gray-700 rounded p-2 text-white focus:border-purple-500">
         </div>
         <div>
             <label class="block text-gray-400 text-sm mb-2">Immagine Profilo</label>
             <div class="flex items-center gap-4">
                 <div id="imagePreview" class="relative w-16 h-16 rounded-lg bg-gray-800 border border-white/10 overflow-hidden flex items-center justify-center">
                     ${item && item.imageUrl ? `<img src="${item.imageUrl}" class="w-full h-full object-cover">` : '<i class="fas fa-user text-gray-600 text-xl"></i>'}
                 </div>
                 <div class="flex-1">
                     <div class="flex gap-2 items-center">
                        <input type="file" id="imageUpload" accept="image/*" class="hidden" onchange="window.previewImage(this)">
                        <label for="imageUpload" class="inline-block px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-xs font-bold cursor-pointer hover:bg-white/10 transition-colors">
                            <i class="fas fa-upload mr-2"></i> Carica Foto
                        </label>
                        <button type="button" onclick="window.removeImage()" class="px-3 py-2 bg-red-500/10 text-red-500 rounded-lg text-xs font-bold hover:bg-red-500/20 transition-colors" title="Rimuovi immagine">
                            <i class="fas fa-trash-alt"></i>
                        </button>
                     </div>
                     <p class="text-[10px] text-gray-500 mt-2">Se vuoto, verrà usata la foto di Twitch</p>
                 </div>
             </div>
             <input type="hidden" name="imageUrl" value="${item ? (item.imageUrl || '') : ''}">
         </div>
    `;

    let specificFields = '';
    if (currentSection === 'staff') {
        specificFields = `
            <div>
                <label class="block text-gray-400 text-sm mb-2">Dipartimento</label>
                <select name="department" required class="w-full bg-gray-900 border border-gray-700 rounded p-2 text-white">
                    <option value="" disabled ${!item ? 'selected' : ''}>Seleziona Dipartimento</option>
                    <option value="Manager" ${item && item.department === 'Manager' ? 'selected' : ''}>Manager</option>
                    <option value="Developer" ${item && item.department === 'Developer' ? 'selected' : ''}>Developer</option>
                    <option value="Grafico" ${item && item.department === 'Grafico' ? 'selected' : ''}>Grafico</option>
                    <option value="HR" ${item && item.department === 'HR' ? 'selected' : ''}>HR</option>
                </select>
            </div>
            <div>
                <label class="block text-gray-400 text-sm mb-2">Link Social</label>
                <input type="url" name="instagram" value="${item ? (item.instagram || '') : ''}" placeholder="Instagram URL" class="w-full bg-gray-900 border border-gray-700 rounded p-2 text-white mb-2">
                <input type="url" name="twitch" value="${item ? (item.twitch || '') : ''}" placeholder="Twitch URL" class="w-full bg-gray-900 border border-gray-700 rounded p-2 text-white mb-2">
                <input type="url" name="github" value="${item ? (item.github || '') : ''}" placeholder="Github URL" class="w-full bg-gray-900 border border-gray-700 rounded p-2 text-white">
            </div>
        `;
    } else if (currentSection === 'creators') {
        specificFields = `
             <input type="hidden" name="platform" value="Twitch">
            <div>
                <label class="block text-gray-400 text-sm mb-2">Link Canale Twitch</label>
                <input type="url" name="url" value="${item ? item.url : ''}" required class="w-full bg-gray-900 border border-gray-700 rounded p-2 text-white" placeholder="https://twitch.tv/nomeutente">
            </div>
            <div>
                <label class="block text-gray-400 text-sm mb-2">Descrizione Streamer (Passaggio Mouse)</label>
                <textarea name="desc" rows="3" class="w-full bg-gray-900 border border-gray-700 rounded p-2 text-white focus:border-cyan-500 focus:outline-none" placeholder="Es. Appassionato di gaming e tecnologia...">${item ? (item.desc || '') : ''}</textarea>
            </div>
        `;
    } else if (currentSection === 'streamers') {
        specificFields = `
             <div>
                <label class="block text-gray-400 text-sm mb-2">Link Canale Twitch</label>
                <input type="url" name="username" value="${item ? (item.username || '') : ''}" required class="w-full bg-gray-900 border border-gray-700 rounded p-2 text-white" placeholder="https://twitch.tv/nomeutente">
            </div>
        `;
    }

    fieldsContainer.innerHTML = idField + commonFields + specificFields;
}

// Helper per Anteprima Immagine e Conversione Base64
window.previewImage = function(input) {
    const preview = document.getElementById('imagePreview');
    const hiddenInput = document.querySelector('input[name="imageUrl"]');
    
    if (input.files && input.files[0]) {
        const file = input.files[0];
        
        // Controllo dimensione (Firestore ha un limite di 1MB per documento, meglio stare bassi)
        if (file.size > 500000) { // 500KB
            alert("L'immagine è troppo grande! Carica un file inferiore a 500KB per salvarlo nel database.");
            input.value = "";
            return;
        }

        const reader = new FileReader();
        reader.onload = function(e) {
            const base64String = e.target.result;
            preview.innerHTML = `<img src="${base64String}" class="w-full h-full object-cover">`;
            hiddenInput.value = base64String; // Salva la stringa qui per il submit
        }
        reader.readAsDataURL(file);
    }
}

// Helper per Rimuovere Immagine
window.removeImage = function() {
    const preview = document.getElementById('imagePreview');
    const hiddenInput = document.querySelector('input[name="imageUrl"]');
    const fileInput = document.getElementById('imageUpload');
    
    if (preview) preview.innerHTML = '<i class="fas fa-user text-gray-600 text-xl"></i>';
    if (hiddenInput) hiddenInput.value = "";
    if (fileInput) fileInput.value = "";
};

window.handleFormSubmit = async function(e) {
    e.preventDefault();
    const btn = e.target.querySelector('button[type="submit"]');
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Elaborazione...';
    btn.disabled = true;

    try {
        const formData = new FormData(e.target);
        const data = {};
        for (const [key, value] of formData.entries()) {
            data[key] = (typeof value === 'string') ? value.trim() : value;
        }

        const editId = data.id; 
        if (editId) delete data.id; 

        // 1. Validazione Immagine/Social (Solo link accettati per l'auto-recupero)
        const hasTwitchLink = data.twitch?.includes('twitch.tv') || data.url?.includes('twitch.tv') || data.username?.includes('twitch.tv');
        
        if (!data.imageUrl && !hasTwitchLink && currentSection !== 'knowledge') {
            alert("⚠️ Per favore, carica una foto oppure inserisci il LINK di Twitch per recuperare l'avatar automaticamente.");
            btn.innerHTML = 'Salva';
            btn.disabled = false;
            return;
        }

        // 2. Fallback Social (se non c'è stringa Base64 presente e non c'è URL esistente)
        if (!data.imageUrl && currentSection !== 'knowledge') {
            const twitchUsername = data.username || 
                                 (data.twitch ? data.twitch.split('/').pop() : 
                                 (data.url && data.url.includes('twitch.tv') ? data.url.split('/').pop() : null));
            
            if (twitchUsername) {
                try {
                    const res = await fetch(`https://decapi.me/twitch/avatar/${twitchUsername}`);
                    const avatarUrl = await res.text();
                    if (avatarUrl && avatarUrl.startsWith('http')) {
                        data.imageUrl = avatarUrl;
                    }
                } catch(err) {
                    console.error("Errore recupero avatar Twitch:", err);
                }
            }
        }

        // 2. Salvataggio su Firestore
        if (editId) {
            await updateDoc(doc(db, COLLECTIONS[currentSection], editId), data);
        } else {
            data.createdAt = new Date();
            await addDoc(collection(db, COLLECTIONS[currentSection]), data);
        }

        closeModal();
        loadData(currentSection); 

    } catch (error) {
        console.error("Errore salvataggio:", error);
        alert("Errore nel salvataggio: " + error.message);
    } finally {
        btn.innerHTML = 'Salva';
        btn.disabled = false;
    }
};

window.deleteItem = async function(id) {
    if(!confirm("Sicuro di voler eliminare?")) return;
    try {
        await deleteDoc(doc(db, COLLECTIONS[currentSection], id));
        loadData(currentSection);
    } catch (error) {
        console.error("Errore eliminazione:", error);
    }
};

// Funzione per filtrare le tabelle (Search Bar)
window.filterTable = function(input, tableBodyId) {
    const filter = input.value.toLowerCase().trim();
    const tableBody = document.getElementById(tableBodyId);
    if (!tableBody) return;

    const rows = Array.from(tableBody.getElementsByTagName('tr'));
    
    rows.forEach(row => {
        // Ignora le righe di caricamento o "nessun elemento" (che hanno 1 sola cella con colspan)
        if (row.cells.length < 2) return;

        let match = false;
        // Cicla attraverso tutte le celle tranne l'ultima (quella dei bottoni Modifica/Elimina)
        for (let i = 0; i < row.cells.length - 1; i++) {
            const cellText = row.cells[i].innerText.toLowerCase();
            if (cellText.includes(filter)) {
                match = true;
                break;
            }
        }
        
        row.style.display = match ? "" : "none";
    });
};

initDashboard();
