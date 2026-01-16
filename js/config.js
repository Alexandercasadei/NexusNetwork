// ============================================================================
// CONFIGURAZIONE GLOBALE - Discord Webhook & API Keys
// ============================================================================
// ⚠️ IMPORTANTE: Non committare secrets in git!
// Usa variabili d'ambiente in produzione

const CONFIG = {
  DISCORD_WEBHOOK_URL: "https://discord.com/api/webhooks/1460715234330149024/wrzBHJd6x-EwbUDdGBW77y9SnA_lqXZt7tD26P8l7TjwUTskI4Ed-EG9rEJq8ZCXYl_O",
  WORKER_URL: "https://il-tuo-worker.tuonome.workers.dev",
  AI_API_URL: "http://localhost:8000/chat"
};

window.CONFIG = CONFIG;
