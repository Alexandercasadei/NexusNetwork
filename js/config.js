// ============================================================================
// CONFIGURAZIONE GLOBALE - Discord Webhook & API Keys
// ============================================================================
// ⚠️ IMPORTANTE: Non committare secrets in git!
// Usa variabili d'ambiente in produzione

const CONFIG = {
  DISCORD_WEBHOOK_URL: "https://discord.com/api/webhooks/1460715234330149024/wrzBHJd6x-EwbUDdGBW77y9SnA_lqXZt7tD26P8l7TjwUTskI4Ed-EG9rEJq8ZCXYl_O",
};

if (typeof module !== "undefined" && module.exports) {
  module.exports = CONFIG;
}
