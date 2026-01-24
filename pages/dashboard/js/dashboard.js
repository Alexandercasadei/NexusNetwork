
import { 
    auth, db, storage, 
    collection, getDocs, addDoc, deleteDoc, doc, updateDoc, 
    ref, uploadBytes, getDownloadURL, 
    onAuthStateChanged, signOut,
    setPersistence, browserSessionPersistence
} from '../../../js/firebase-init.js';
import { INITIAL_STAFF, INITIAL_CREATORS, INITIAL_STREAMERS } from '../../../js/seeds-data.js';
import { openImagePicker, closeImagePicker } from './image-picker.js';

// State locale
let currentSection = 'staff';

const COLLECTIONS = {
    'staff': 'staff',
    'creators': 'creators',
    'streamers': 'streamers'
};

// 1. Inizializza Dashboard
async function initDashboard() {
    // Imposta persistenza SESSION (Il login dura solo finché il browser è aperto)
    try {
        await setPersistence(auth, browserSessionPersistence);
    } catch (error) {
        console.error("Errore persistenza:", error);
    }

    // Auth Check e Setup
    onAuthStateChanged(auth, (user) => {
        if (!user) {
            // Vogliamo che il sito ricordi che siamo Dev (icona visibile), 
            // ma ci chieda il login per entrare (redirect).
            window.location.href = '/login';
        } else {
            // Conferma che siamo Dev con COOKIE (Scadenza 10 anni - "Per sempre")
            const d = new Date();
            d.setTime(d.getTime() + (3650*24*60*60*1000));
            document.cookie = "adminToken=firebase-active; expires=" + d.toUTCString() + "; path=/";

            // Nomi custom
            let adminName = user.email.split('@')[0];
            let roleTitle = 'Amministratore';
            const adminEmail = user.email.toLowerCase();

            if (adminEmail === 'therealsam@nexusfounder.it') {
                adminName = 'TherealSamTV';
                roleTitle = ''; 
            } else if (adminEmail === 'shadowstrike@nexusdev.it') {
                adminName = 'ShadowStrike';
                roleTitle = 'Lead Developer';
            }
            
            const nameEl = document.getElementById('adminUsername');
            if (nameEl) nameEl.innerText = adminName;
            
            const roleEl = document.getElementById('adminRole');
            if (roleEl) {
                if (roleTitle) roleEl.innerText = roleTitle;
                else roleEl.style.display = 'none';
            }

            // Primo caricamento
            switchView('dashboard');
        }
    });

    // Navigation Listeners
    document.querySelectorAll('.sidebar-link').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const targetSection = e.currentTarget.dataset.section;
            
            // Validazione sezione
            const validSections = ['dashboard', 'staff', 'creators', 'streamers'];
            if (!targetSection || !validSections.includes(targetSection)) {
                console.error(`Sezione non valida dal click: ${targetSection}`);
                return;
            }
            
            // UI Sidebar Active State
            document.querySelectorAll('.sidebar-link').forEach(l => {
                l.classList.remove('bg-purple-600', 'text-white', 'active');
                l.classList.add('text-gray-400', 'hover:bg-gray-800');
            });
            e.currentTarget.classList.remove('text-gray-400', 'hover:bg-gray-800');
            e.currentTarget.classList.add('bg-purple-600', 'text-white', 'active');

            // Switch Logica
            currentSection = targetSection;
            switchView(targetSection);
        });
    });

    document.getElementById('logoutBtn').addEventListener('click', () => {
        signOut(auth).then(() => {
            // Non rimuoviamo adminToken: l'utente vuole che l'icona resti visibile
            // localStorage.removeItem('adminToken'); 
            window.location.href = '../../index.html';
        });
    });
}

function switchView(section) {
    // Validazione della sezione
    const validSections = ['dashboard', 'staff', 'creators', 'streamers'];
    if (!validSections.includes(section)) {
        console.error(`Sezione non valida: ${section}`);
        section = 'dashboard';
    }

    // Nascondi tutte le views
    document.querySelectorAll('.page-view').forEach(el => el.classList.add('hidden'));
    
    // Mostra quella target
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
        const streamersSnap = await getDocs(collection(db, 'streamers'));

        document.getElementById('statsStaff').innerText = staffSnap.size;
        document.getElementById('statsCreators').innerText = creatorsSnap.size;
        document.getElementById('statsStreamers').innerText = streamersSnap.size;
    } catch (e) {
        console.error("Errore stats:", e);
    }
}

// Funzione per caricare i dati nelle tabelle
async function loadData(section) {
    // Determina il body tabella corretto
    const tableId = `${section}TableBody`;
    const tableBody = document.getElementById(tableId);
    if (!tableBody) return;

    tableBody.innerHTML = '<tr><td colspan="4" class="text-center py-8"><i class="fas fa-spinner fa-spin text-2xl"></i></td></tr>';

    try {
        const collectionName = COLLECTIONS[section];
        if (!collectionName || collectionName.trim() === '') {
            throw new Error(`Collection name is empty for section: ${section}`);
        }
        
        const querySnapshot = await getDocs(collection(db, collectionName));
        
        // AUTO-SEEDING se vuoto
        if (querySnapshot.empty) {
            console.log(`Collezione ${section} vuota. Inizializzazione dati...`);
            let seedData = [];
            if (section === 'staff') seedData = INITIAL_STAFF;
            if (section === 'creators') seedData = INITIAL_CREATORS;
            if (section === 'streamers') seedData = INITIAL_STREAMERS;

            if (seedData && seedData.length > 0) {
                tableBody.innerHTML = '<tr><td colspan="4" class="text-center py-8 text-yellow-500">Inizializzazione database locale... (Refresh tra poco)</td></tr>';
                const promises = seedData.map(item => addDoc(collection(db, COLLECTIONS[section]), item));
                await Promise.all(promises);
                // Ricarica ricorsiva
                return loadData(section); 
            }
        }

        // Render
        tableBody.innerHTML = '';
        if (querySnapshot.empty) {
            tableBody.innerHTML = '<tr><td colspan="4" class="text-center py-8 text-gray-500">Nessun elemento trovato. Aggiungine uno!</td></tr>';
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
        if (error.code === 'permission-denied') {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="4" class="text-center py-8 text-red-500">
                        <i class="fas fa-lock text-3xl mb-2"></i><br>
                        <strong>Permesso Negato</strong><br>
                        Vai su Firebase Console > Firestore > Regole e imposta: <br>
                        <code>allow read, write: if true;</code>
                    </td>
                </tr>`;
        } else {
            tableBody.innerHTML = '<tr><td colspan="4" class="text-center py-8 text-red-500">Errore caricamento dati: ' + error.message + '</td></tr>';
        }
    }
}

// Helper per creare righe tabella
function createRow(item, section) {
    let imageCell = '';
    let statusCell = '';

    if (item.imageUrl) {
        imageCell = `<img src="${item.imageUrl}" class="w-10 h-10 rounded-full object-cover border border-gray-700">`;
    } else {
        imageCell = `<div class="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center text-xs text-gray-400">N/A</div>`;
    }

    if (section === 'streamers') {
        const statusColor = item.status === 'live' ? 'text-red-500' : 'text-gray-500';
        statusCell = `<span class="${statusColor} font-bold text-xs uppercase">${item.status || 'offline'}</span>`;
    } else {
        statusCell = `<span class="text-gray-400">-</span>`;
    }

    // Campi differenziati per sezione
    let name = item.name || item.username || 'No Name';
    
    // Per creators/streamers, mostriamo la piattaforma o link se c'è
    let extraInfo = '';
    
    // Status ID univoco per aggiornamento asincrono
    const statusId = `status-${item._id}`;
    
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
        
        // Default "Checking..."
        statusCell = `<span id="${statusId}" class="text-gray-500 text-xs italic">Verifica...</span>`;

        // Lanciamo verifica asincrona se c'è un link Twitch
        if (item.url && item.url.includes('twitch.tv')) {
            const username = item.url.split('/').pop();
            fetchLiveStatus(username, statusId);
        } else {
             // Se non è twitch, mostriamo badge statico o nulla
             statusCell = `<span class="text-gray-600 text-xs">-</span>`;
        }
    }
    
    if (section === 'streamers') {
        extraInfo = item.platform || 'Twitch';
        // Default "Checking..."
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

// Funzione Nuova: Check Live Status (Decapi)
async function fetchLiveStatus(username, elementId) {
    try {
        const response = await fetch(`https://decapi.me/twitch/uptime/${username}`);
        const text = await response.text();
        const el = document.getElementById(elementId);
        
        if (!el) return;

        // Se offline, decapi restituisce "username is offline" oppure vuoto
        const isOffline = text.toLowerCase().includes('offline') || !text;

        if (!isOffline) {
            // LIVE
            el.innerHTML = `<span class="bg-red-600/20 text-red-500 border border-red-500/50 px-2 py-1 rounded text-xs font-bold tracking-wider animate-pulse shadow-[0_0_10px_rgba(239,68,68,0.4)]">LIVE</span>`;
        } else {
            // OFFLINE
            el.innerHTML = `<span class="text-gray-500 text-xs font-medium">Offline</span>`;
        }
    } catch (e) {
        console.error("Err check live:", e);
        const el = document.getElementById(elementId);
        if(el) el.innerHTML = `<span class="text-gray-700 text-xs">Err</span>`;
    }
}

// Gestione Modale e Form (Add & Edit)
window.openImagePickerForSection = function() {
    openImagePicker(currentSection, (imagePath) => {
        document.getElementById('selectedImageUrl').value = imagePath;
        const preview = document.getElementById('imagePreview');
        preview.innerHTML = `<img src="${imagePath}" class="w-16 h-16 rounded object-cover">`;
    });
};

window.openModal = function(item = null) {
    document.getElementById('modal').classList.remove('hidden');
    document.getElementById('modal').classList.add('flex');
    renderFormFields(item);
    
    if (item) {
        document.getElementById('modalTitle').innerText = 'Modifica Elemento';
    } else {
        document.getElementById('modalTitle').innerText = 'Aggiungi Elemento';
    }
};

window.closeModal = function() {
    document.getElementById('modal').classList.add('hidden');
    document.getElementById('modal').classList.remove('flex');
    document.getElementById('crudForm').reset();
    document.getElementById('modalTitle').innerText = 'Aggiungi Elemento';
};

function renderFormFields(item = null) {
    const fieldsContainer = document.getElementById('formFields');
    fieldsContainer.innerHTML = '';
    
    // Campo nascosto per ID (se edit mode)
    if (item) {
        fieldsContainer.innerHTML += `<input type="hidden" name="id" value="${item._id}">`;
    }

     const commonFields = `
         <div>
             <label class="block text-gray-400 text-sm mb-2">Nome</label>
             <input type="text" name="name" value="${item ? item.name : ''}" required class="w-full bg-gray-900 border border-gray-700 rounded p-2 text-white focus:border-purple-500 focus:outline-none placeholder-gray-600">
         </div>
         <div>
             <label class="block text-gray-400 text-sm mb-2">Immagine Profilo</label>
             <div class="flex gap-2">
                 <button type="button" onclick="window.openImagePickerForSection()" class="flex-1 px-6 py-3 bg-gradient-to-r from-cyan-500 to-cyan-600 text-black rounded-xl font-bold hover:from-cyan-400 hover:to-cyan-500 transition-all shadow-[0_0_15px_rgba(34,211,238,0.3)] hover:shadow-[0_0_25px_rgba(34,211,238,0.5)]">
                     <i class="fas fa-folder mr-2"></i>Seleziona Immagine
                 </button>
             </div>
             <input type="hidden" name="imageUrl" id="selectedImageUrl" value="${item ? (item.imageUrl || '') : ''}">
             <div id="imagePreview" class="mt-2 text-xs text-gray-500">
                 ${item && item.imageUrl ? `<img src="${item.imageUrl}" class="w-16 h-16 rounded object-cover border border-cyan-400/30">` : ''}
             </div>
         </div>
     `;

    let specificFields = '';

    if (currentSection === 'staff') {
        specificFields = `
            <div>
                <label class="block text-gray-400 text-sm mb-2">Dipartimento (Cruciale per la visualizzazione)</label>
                <select name="department" required class="w-full bg-gray-900 border border-gray-700 rounded p-2 text-white">
                    <option value="" disabled ${!item ? 'selected' : ''}>Seleziona Dipartimento</option>
                    <option value="Manager" ${item && item.department === 'Manager' ? 'selected' : ''}>Manager</option>
                    <option value="Developer" ${item && item.department === 'Developer' ? 'selected' : ''}>Developer</option>
                    <option value="Grafico" ${item && item.department === 'Grafico' ? 'selected' : ''}>Grafico</option>
                    <option value="HR" ${item && item.department === 'HR' ? 'selected' : ''}>HR</option>
                </select>
            </div>
            <div>
                <label class="block text-gray-400 text-sm mb-2">Descrizione</label>
                <textarea name="desc" rows="2" class="w-full bg-gray-900 border border-gray-700 rounded p-2 text-white placeholder-gray-600" placeholder="Breve bio...">${item ? (item.desc || '') : ''}</textarea>
            </div>
            <div>
                <label class="block text-gray-400 text-sm mb-2">Link Social (Instagram/Twitch/Github)</label>
                <div class="grid grid-cols-1 gap-2">
                    <input type="url" name="instagram" value="${item ? (item.instagram || '') : ''}" placeholder="Instagram URL" class="w-full bg-gray-900 border border-gray-700 rounded p-2 text-white placeholder-gray-600">
                    <input type="url" name="twitch" value="${item ? (item.twitch || '') : ''}" placeholder="Twitch URL" class="w-full bg-gray-900 border border-gray-700 rounded p-2 text-white placeholder-gray-600">
                    <input type="url" name="github" value="${item ? (item.github || '') : ''}" placeholder="Github URL" class="w-full bg-gray-900 border border-gray-700 rounded p-2 text-white placeholder-gray-600">
                </div>
            </div>
        `;
    }else if (currentSection === 'creators') {
        specificFields = `
             <div>
                <label class="block text-gray-400 text-sm mb-2">Piattaforma</label>
                <select name="platform" class="w-full bg-gray-900 border border-gray-700 rounded p-2 text-white">
                    <option value="Twitch" ${item && item.platform === 'Twitch' ? 'selected' : ''}>Twitch</option>
                    <option value="Youtube" ${item && item.platform === 'Youtube' ? 'selected' : ''}>Youtube</option>
                    <option value="Instagram" ${item && item.platform === 'Instagram' ? 'selected' : ''}>Instagram</option>
                    <option value="TikTok" ${item && item.platform === 'TikTok' ? 'selected' : ''}>TikTok</option>
                </select>
            </div>
            <div>
                <label class="block text-gray-400 text-sm mb-2">Descrizione</label>
                <textarea name="desc" rows="2" class="w-full bg-gray-900 border border-gray-700 rounded p-2 text-white placeholder-gray-600" placeholder="Descrizione del creator...">${item ? (item.desc || '') : ''}</textarea>
            </div>
            <div>
                <label class="block text-gray-400 text-sm mb-2">Link Canale</label>
                <input type="url" name="url" value="${item ? (item.url || '') : ''}" placeholder="https://..." required class="w-full bg-gray-900 border border-gray-700 rounded p-2 text-white placeholder-gray-600">
            </div>
             <div>
                <label class="block text-gray-400 text-sm mb-2">Link Instagram (Opzionale)</label>
                <input type="url" name="instagram" value="${item ? (item.instagram || '') : ''}" placeholder="https://instagram.com/..." class="w-full bg-gray-900 border border-gray-700 rounded p-2 text-white placeholder-gray-600">
            </div>
            <div class="flex items-center gap-2 mt-2">
                <input type="checkbox" name="isFeatured" id="isFeatured" ${item && item.isFeatured ? 'checked' : ''} class="w-4 h-4 bg-gray-900 border-gray-700 rounded">
                <label for="isFeatured" class="text-gray-400 text-sm">In Evidenza (Home Page)</label>
            </div>
        `;
    } else if (currentSection === 'streamers') {
        const isChecked = item ? item.active : true; 
        specificFields = `
             <div>
                <label class="block text-gray-400 text-sm mb-2">Username Twitch (Esatto)</label>
                <input type="text" name="username" value="${item ? (item.username || '') : ''}" placeholder="es. therealsamtv" required class="w-full bg-gray-900 border border-gray-700 rounded p-2 text-white placeholder-gray-600">
            </div>
            <div>
                 <label class="flex items-center space-x-3 cursor-pointer mt-4">
                    <input type="checkbox" name="active" ${isChecked ? 'checked' : ''} class="form-checkbox h-5 w-5 text-green-500 bg-gray-900 border-gray-700 rounded focus:ring-green-500 focus:ring-opacity-50">
                    <span class="text-white font-bold">Attivo (Mostra in elenco)</span>
                 </label>
            </div>
        `;
    }

    fieldsContainer.innerHTML = commonFields + specificFields;
}

// Gestione Submit Form (Create & Update)
window.handleFormSubmit = async function(e) {
    e.preventDefault();
    const btn = e.target.querySelector('button[type="submit"]');
    const originalText = btn.innerHTML;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Salvataggio...';
    btn.disabled = true;

    try {
        const formData = new FormData(e.target);
        // Converti in oggetto e TRIM delle stringhe per evitare spazi vuoti
        const data = {};
        for (const [key, value] of formData.entries()) {
            data[key] = (typeof value === 'string') ? value.trim() : value;
        }

        const editId = data.id; // Recupera ID se esiste

        if (editId) delete data.id; // Non vogliamo salvare l'ID nei dati del documento

        // Se l'immagine è già selezionata dal picker (non caricata da file)
        if (data.imageUrl && data.imageUrl.startsWith('../../assets/images/')) {
            // È già una path locale, non fare nulla
        } else if (data.imageUrl) {
            // Se viene passato un URL (da edit), mantenilo
        } else {
            delete data.imageUrl; // Rimuovi se vuoto
        }

        // Rimuovi il campo 'image' se esiste (file input non caricato)
        delete data.image;

        // Checkbox handling (form data non include checkbox unchecked)
        if (currentSection === 'creators') {
            data.isFeatured = e.target.isFeatured.checked;
        }
        if (currentSection === 'streamers') {
            data.active = e.target.active.checked;
        }

        if (editId) {
            // UPDATE
            await updateDoc(doc(db, COLLECTIONS[currentSection], editId), data);
            // alert("Elemento aggiornato con successo!");
        } else {
            // CREATE
            data.createdAt = new Date();
            await addDoc(collection(db, COLLECTIONS[currentSection]), data);
            // alert("Elemento aggiunto con successo!");
        }

        closeModal();
        loadData(currentSection); // Ricarica tabella

    } catch (error) {
        console.error("Errore salvataggio:", error);
        if (error.code === 'permission-denied') {
            alert("PERMESSO NEGATO!\n\nVai su Firebase Console > Firestore > Regole e imposta: allow write: if request.auth != null;");
        } else {
            console.error(error.message);
        }
    } finally {
        btn.innerHTML = originalText;
        btn.disabled = false;
    }
};

window.deleteItem = async function(id) {
    // Conferma rimossa come richiesto
    
    try {
        await deleteDoc(doc(db, COLLECTIONS[currentSection], id));
        loadData(currentSection);
    } catch (error) {
        console.error("Errore eliminazione:", error);
        if (error.code === 'permission-denied') {
            alert("PERMESSO NEGATO! Controlla le regole di Firebase.");
        }
    }
};

function capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
}

// Avvio
initDashboard();
