
import { db, collection, getDocs } from '../../../js/firebase-init.js';

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

        // Download JSON (Use Blob for large data support)
        const jsonString = JSON.stringify(data, null, 2);
        const blob = new Blob([jsonString], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        
        const downloadAnchorNode = document.createElement('a');
        downloadAnchorNode.href = url;
        downloadAnchorNode.download = "nexus_database_backup.json";
        document.body.appendChild(downloadAnchorNode);
        downloadAnchorNode.click();
        
        // Cleanup
        document.body.removeChild(downloadAnchorNode);
        URL.revokeObjectURL(url);

    } catch (e) {
        console.error("Errore export:", e);
        alert("Errore durante l'export dei dati");
    }
}

// Aggiungo tasto export alla dashboard globalmente
window.exportDatabase = exportDatabase;
