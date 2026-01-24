
import { db, collection, getDocs, addDoc } from './firebase-init.js';
import { INITIAL_CREATORS } from './seeds-data.js';

async function initCreators() {
    try {
        const creatorsRef = collection(db, 'creators');
        const snapshot = await getDocs(creatorsRef);

        if (snapshot.empty) {
            console.warn("Database Creators vuoto. Accedi alla Dashboard per inizializzare i dati.");
            return;
        }

        const container = document.getElementById('creators-grid');
        if (!container) return;

        snapshot.forEach(doc => {
            const creator = doc.data();
            
            const card = `
            <div 
                class="creator glass glow rounded-2xl scroll-animate visible"
                onclick="openCreator({
                    name:'${creator.name}',
                    role:'${creator.role || 'Creator'}',
                    desc:'${creator.desc || ''}',
                    img:'${creator.imageUrl}', 
                    twitch:'${creator.url}',
                    instagram:'${creator.instagram || ''}'
                })"
            >
                <img src="${creator.imageUrl}" alt="${creator.name}" loading="lazy" class="w-full h-auto object-cover aspect-square rounded-t-2xl">
                <div class="creator-bio">
                    <h3 class="text-2xl font-bold text-cyan-400 mb-2">${creator.name}</h3>
                    <p class="text-gray-300 text-sm line-clamp-3">${creator.desc || ''}</p>
                </div>
                <div class="creator-info absolute bottom-0 p-5 z-10 w-full bg-gradient-to-t from-black/90 to-transparent">
                    <h3 class="text-xl font-bold text-white">${creator.name}</h3>
                    <p class="text-cyan-400 text-sm">${creator.role || 'Creator'}</p>
                    <div class="flex gap-3 mt-4">
                        ${creator.platform === 'Twitch' ? '<i class="fab fa-twitch text-xl text-white hover:text-purple-500 transition-colors"></i>' : ''}
                        ${creator.platform === 'Youtube' ? '<i class="fab fa-youtube text-xl text-white hover:text-red-500 transition-colors"></i>' : ''}
                        ${creator.instagram ? '<i class="fab fa-instagram text-xl text-white hover:text-pink-500 transition-colors"></i>' : ''}
                    </div>
                </div>
            </div>`;

            container.insertAdjacentHTML('beforeend', card);
        });

    } catch (e) {
        console.error("Errore caricamento creators:", e);
    }
}

initCreators();
