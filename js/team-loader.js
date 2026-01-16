
import { db, collection, getDocs, addDoc } from './firebase-init.js';
import { INITIAL_STAFF } from './seeds-data.js';

// Mapping Department -> ID Grid
const GRID_MAP = {
    'Direzione': 'founders-grid',
    'Manager': 'managers-grid',
    'Tecnico': 'dev-grid',
    'HR': 'hr-grid',
    'Grafico': 'grafico-grid',
};

async function initTeam() {
    try {
        const staffRef = collection(db, 'staff');
        const snapshot = await getDocs(staffRef);

        if (snapshot.empty) {
            console.warn("Database Staff vuoto. Accedi alla Dashboard per inizializzare i dati.");
            return;
        }

        snapshot.forEach(doc => {
            const member = doc.data();
            renderMember(member);
        });

    } catch (e) {
        console.error("Errore caricamento team:", e);
    }
}

function renderMember(member) {
    // Determina la griglia target
    // Se department non esiste, fallback basato su ruolo o default manager
    let targetId = 'managers-grid';
    
    // Logica di mapping semplice
    if (member.department) {
        targetId = GRID_MAP[member.department] || 'managers-grid';
    } else if (member.role.toLowerCase().includes('founder')) targetId = 'founders-grid';
    else if (member.role.toLowerCase().includes('devel') || member.role.toLowerCase().includes('tecnico')) targetId = 'dev-grid';
    else if (member.role.toLowerCase().includes('hr') || member.role.toLowerCase().includes('risorse')) targetId = 'hr-grid';

    const container = document.getElementById(targetId);
    if (!container) return; // Griglia non trovata

    // Fix path immagini relative vs url storage
    // Se inizia con http (storage) ok, se no ../.. (path relativo asset)
    // Ma attenzione: dashboard carica su storage (http). Seeding usa path relativi (../../)
    // Il path deve essere corretto rispetto a dove si trova la pagina (pages/team/index.html)
    // Se il seeding ha messo `../../assets...` va bene.
    
    const card = `
        <div 
            class="creator glass glow rounded-2xl scroll-animate visible"
            onclick="openCreator({
                name:'${member.name}',
                role:'${member.role}',
                desc:'${member.desc || ''}',
                img:'${member.imageUrl}',
                twitch:'${member.twitch || ''}',
                instagram:'${member.instagram || ''}',
                github:'${member.github || ''}'
            })"
        >
            <img src="${member.imageUrl}" alt="${member.name}" loading="lazy" class="w-full h-auto object-cover aspect-square rounded-t-2xl">
            <div class="creator-bio">
                <h3 class="text-2xl font-bold text-cyan-400 mb-2">${member.name}</h3>
                <p class="text-gray-300 text-sm line-clamp-3">${member.desc || ''}</p>
            </div>
            <div class="creator-info absolute bottom-0 p-5 z-10 w-full bg-gradient-to-t from-black/90 to-transparent">
                <h3 class="text-xl font-bold text-white">${member.name}</h3>
                <p class="text-cyan-400 text-sm">${member.role}</p>
                <div class="flex gap-3 mt-4">
                    ${member.twitch ? '<i class="fab fa-twitch text-xl text-white hover:text-purple-500 transition-colors"></i>' : ''}
                    ${member.instagram ? '<i class="fab fa-instagram text-xl text-white hover:text-pink-500 transition-colors"></i>' : ''}
                    ${member.github ? '<i class="fab fa-github text-xl text-white hover:text-gray-500 transition-colors"></i>' : ''}
                </div>
            </div>
        </div>
    `;

    container.insertAdjacentHTML('beforeend', card);
}
// Inizializza
initTeam();
