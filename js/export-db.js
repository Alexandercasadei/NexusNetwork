
import { db, collection, getDocs } from './firebase-init.js';

async function exportDatabase() {
    const data = {
        staff: [],
        creators: [],
        streamers: []
    };

    try {
        const staffSnap = await getDocs(collection(db, 'staff'));
        staffSnap.forEach(doc => data.staff.push(doc.data()));

        const creatorsSnap = await getDocs(collection(db, 'creators'));
        creatorsSnap.forEach(doc => data.creators.push(doc.data()));

        const streamersSnap = await getDocs(collection(db, 'streamers'));
        streamersSnap.forEach(doc => data.streamers.push(doc.data()));

        // Download JSON
        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(data, null, 2));
        const downloadAnchorNode = document.createElement('a');
        downloadAnchorNode.setAttribute("href", dataStr);
        downloadAnchorNode.setAttribute("download", "nexus_database_backup.json");
        document.body.appendChild(downloadAnchorNode);
        downloadAnchorNode.click();
        downloadAnchorNode.remove();

    } catch (e) {
        console.error("Errore export:", e);
        alert("Errore durante l'export dei dati");
    }
}

// Aggiungo tasto export alla dashboard globalmente
window.exportDatabase = exportDatabase;
