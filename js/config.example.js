// ============================================================================
// CONFIGURAZIONE TEMPLATE - Rinomina in config.js e inserisci i tuoi dati
// ============================================================================

const CONFIG = {
  // Webhook Discord per il form contatti (NON condividere pubblicamente)
  DISCORD_WEBHOOK_URL: "INSERISCI_QUI_IL_TUO_WEBHOOK",
  // URL del Cloudflare Worker per le API Twitch
  WORKER_URL: "https://il-tuo-worker.tuonome.workers.dev",
  // URL del Backend Python AI (Locale o Remoto)
  AI_API_URL: "http://localhost:8000/chat"
};

window.CONFIG = CONFIG;