// ============================================================================
// MODAL CREATOR - Apri modal con dati creator/staff
// ============================================================================

const creatorModal = document.getElementById("creatorModal");

function openCreator(data) {
  if (!creatorModal) return;
  creatorModal.classList.remove("hidden");
  creatorModal.classList.add("flex");

  const modalImg = document.getElementById("mImg");
  const modalName = document.getElementById("mName");
  const modalRole = document.getElementById("mRole");
  const modalDesc = document.getElementById("mDesc");
  const modalFollowers = document.getElementById("mFollowers");
  const modalInstagramStats = document.getElementById("mInstagramStats");
  const modalGithubStats = document.getElementById("mGithubStats");

  if (modalImg) modalImg.src = data.img;
  if (modalName) modalName.innerText = data.name;
  if (modalRole) modalRole.innerText = data.role;
  if (modalDesc) modalDesc.innerText = data.desc;

  if (modalFollowers) modalFollowers.innerHTML = "";
  if (modalInstagramStats) modalInstagramStats.innerHTML = "";
  if (modalGithubStats) modalGithubStats.innerHTML = "";

  if (data.twitch && modalFollowers) {
    modalFollowers.innerHTML =
      '<i class="fas fa-circle-notch fa-spin mr-2"></i>Twitch...';
    fetchTwitchFollowers(data.twitch);
  }

  if (data.instagram && modalInstagramStats) {
    modalInstagramStats.innerHTML =
      '<i class="fas fa-circle-notch fa-spin mr-2"></i>Instagram...';
    fetchInstagramFollowers(data.instagram);
  }

  if (data.github && modalGithubStats) {
    modalGithubStats.innerHTML =
      '<i class="fas fa-circle-notch fa-spin mr-2"></i>GitHub...';
    fetchGithubStars(data.github);
  }

  toggleLink("mTwitch", data.twitch);
  toggleLink("mGithub", data.github);
  toggleLink("mInstagram", data.instagram);
}

// ============================================================================
// SOCIAL STATS - Fetch followers/stats da Twitch, Instagram, GitHub
// ============================================================================

async function fetchGithubStars(githubUrl) {
  const modalGithubStats = document.getElementById("mGithubStats");
  try {
    const username = githubUrl.split("/").pop();
    const response = await fetch(
      `https://api.github.com/users/${username}/repos?per_page=100`
    );
    const repos = await response.json();

    if (Array.isArray(repos)) {
      const totalStars = repos.reduce(
        (acc, repo) => acc + (repo.stargazers_count || 0),
        0
      );

      if (modalGithubStats) {
        modalGithubStats.innerHTML = `<i class="fas fa-star mr-2 text-yellow-500"></i><span class="font-bold text-white">${totalStars}</span>&nbsp;stelle GitHub`;
      }
    } else {
      console.warn("La risposta di GitHub non è un array:", repos);
      if (modalGithubStats) modalGithubStats.innerHTML = "";
    }
  } catch (err) {
    console.error("Errore GitHub Stars:", err);
    if (modalGithubStats) modalGithubStats.innerText = "";
  }
}

async function fetchInstagramFollowers(instagramUrl) {
  const modalInstagramStats = document.getElementById("mInstagramStats");
  if (!modalInstagramStats) return;

  try {
    // Estrazione pulita dell'username (gestisce slash finali e query string)
    const cleanUrl = instagramUrl.replace(/\/$/, "").split("?")[0];
    const username = cleanUrl.split("/").pop().replace("@", "");
    
    const response = await fetch(`https://decapi.me/instagram/followcount/${username}`);
    const count = await response.text();
    
    // Decapi.me restituisce spesso messaggi di errore come testo semplice
    const isError = !count || count.toLowerCase().includes("error") || count.toLowerCase().includes("not found") || count.toLowerCase().includes("could not");

    if (!isError && !isNaN(count.replace(/,/g, ""))) {
      modalInstagramStats.innerHTML = `<i class="fab fa-instagram mr-2 text-pink-500"></i><span class="font-bold text-white">${count}</span>&nbsp;follower`;
      modalInstagramStats.classList.remove("hidden");
    } else {
      console.warn("Instagram API Error or Private Account:", count);
      // In caso di errore, nascondiamo la riga per non sporcare la UI
      modalInstagramStats.innerHTML = "";
      modalInstagramStats.classList.add("hidden");
    }
  } catch (err) {
    console.error("Errore fetch Instagram:", err);
    if (modalInstagramStats) {
      modalInstagramStats.innerHTML = "";
      modalInstagramStats.classList.add("hidden");
    }
  }
}

async function fetchTwitchFollowers(twitchUrl) {
  const modalFollowers = document.getElementById("mFollowers");
  try {
    const username = twitchUrl.split("/").pop().toLowerCase();
    const response = await fetch(
      `https://decapi.me/twitch/followcount/${username}`
    );
    const count = await response.text();
    if (modalFollowers) {
      modalFollowers.innerHTML = `<i class="fas fa-users mr-2 text-cyan-400"></i><span class="font-bold text-white">${count}</span>&nbsp;follower`;
    }
  } catch (err) {
    console.error("Errore follower:", err);
    if (modalFollowers) modalFollowers.innerText = "Info non disponibile";
  }
}

function toggleLink(id, link) {
  const el = document.getElementById(id);
  if (link) {
    el.href = link;
    el.classList.remove("hidden");
  } else {
    el.classList.add("hidden");
  }
}

function closeCreator() {
  creatorModal.classList.add("hidden");
}

// Chiudi modale cliccando fuori
window.addEventListener("click", (e) => {
  if (e.target === creatorModal) {
    closeCreator();
  }
});

// ============================================================================
// SCROLL ANIMATIONS - Intersection Observer per effetti al scroll
// ============================================================================

const observer = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("visible");
      }
    });
  },
  { threshold: 0.2 }
);

document
  .querySelectorAll(".scroll-animate, .creator")
  .forEach((el) => observer.observe(el));

// ============================================================================
// TWITCH LIVE STATUS - Verifica stato live dei streamer
// ============================================================================

const STREAMERS = [
  { name: "TheRealSam", username: "therealsamtv" },
  { name: "Darius", username: "itsdariuus" },
];

async function checkTwitchStatus() {
  for (const streamer of STREAMERS) {
    try {
      const response = await fetch(
        `https://decapi.me/twitch/uptime/${streamer.username}`
      );
      const text = await response.text();
      const isLive = !text.toLowerCase().includes("offline");
      updateLiveStatus(streamer.name, isLive, streamer.username);
    } catch (err) {
      console.error(`Errore fetch Twitch per ${streamer.name}:`, err);
    }
  }
}

function updateLiveStatus(name, isLive, username) {
  const cards = document.querySelectorAll(
    `[onclick*="'${name}'"], [onclick*='"${name}"']`
  );

  cards.forEach((card) => {
    let badge = card.querySelector(".live-badge");

    if (isLive) {
      if (!badge) {
        badge = document.createElement("div");
        badge.className = "live-badge";
        badge.innerHTML = "LIVE";
        badge.onclick = (e) => {
          e.stopPropagation();
          window.open(`https://twitch.tv/${username}`, "_blank");
        };
        card.appendChild(badge);
      }
    } else if (badge) {
      badge.remove();
    }
  });
}

checkTwitchStatus();
setInterval(checkTwitchStatus, 60000);

// ============================================================================
// NAVBAR & THEME - Scroll effects e toggle tema light/dark
// ============================================================================

const nav = document.querySelector(".nav-container");
window.addEventListener("scroll", () => {
  if (nav) {
    if (window.scrollY > 50) {
      nav.classList.add("nav-hidden");
    } else {
      nav.classList.remove("nav-hidden");
    }
  }
});

const themeToggle = document.getElementById("theme-toggle");

if (themeToggle) {
  const savedTheme = localStorage.getItem("theme") || "dark";
  updateToggleUI(savedTheme);

  themeToggle.addEventListener("click", () => {
    const currentTheme = document.documentElement.getAttribute("data-theme");
    const newTheme = currentTheme === "dark" ? "light" : "dark";

    document.documentElement.setAttribute("data-theme", newTheme);
    localStorage.setItem("theme", newTheme);
    updateToggleUI(newTheme);
  });
}

function updateToggleUI(theme) {
  const icon = themeToggle?.querySelector("i");
  if (!icon) return;

  if (theme === "light") {
    icon.className = "fas fa-sun";
    themeToggle.style.color = "#eab308";
  } else {
    icon.className = "fas fa-moon";
    themeToggle.style.color = "";
  }
}

// ============================================================================
// CONTACT FORM - Gestione form contatti/candidature con Discord Webhook
// ============================================================================

const contactForm = document.getElementById("contactForm");
const formStatus = document.getElementById("formStatus");

if (contactForm) {
  contactForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const submitBtn = contactForm.querySelector('button[type="submit"]');
    const originalText = submitBtn.innerHTML;

    submitBtn.disabled = true;
    submitBtn.innerHTML =
      '<i class="fas fa-circle-notch fa-spin mr-2"></i>Invio in corso...';

    try {
      // Raccogli dati dal form
      const formData = new FormData(contactForm);
      const data = {
        name: formData.get("name"),
        discord: formData.get("discord"),
        subject: formData.get("subject"),
        message: formData.get("message")
      };

      // Validazione base
      if (!data.name || !data.discord || !data.subject || !data.message) {
        throw new Error("Compila tutti i campi obbligatori");
      }

      // Manda a Discord Webhook
      await sendToDiscord(data);

      // Successo
      formStatus.textContent =
        "✅ Messaggio inviato con successo! Ti risponderemo al più presto.";
      formStatus.className = "success p-4 rounded-xl font-medium mt-4 bg-green-500/10 text-green-400 border border-green-500/30";
      formStatus.classList.remove("hidden");
      contactForm.reset();
    } catch (err) {
      console.error("Errore invio:", err);
      // Errore
      formStatus.textContent = `❌ Errore: ${err.message || "Riprova più tardi."}`;
      formStatus.className = "error p-4 rounded-xl font-medium mt-4 bg-red-500/10 text-red-400 border border-red-500/30";
      formStatus.classList.remove("hidden");
    } finally {
      submitBtn.disabled = false;
      submitBtn.innerHTML = originalText;

      // Nascondi lo stato dopo 8 secondi
      setTimeout(() => {
        formStatus.classList.add("hidden");
      }, 8000);
    }
  });
}

// Invia il messaggio a Discord tramite Webhook
async function sendToDiscord(data) {
  // Leggi il webhook da config (da aggiungere prima di questo script)
  const webhookUrl = typeof CONFIG !== "undefined" ? CONFIG.DISCORD_WEBHOOK_URL : null;
  
  if (!webhookUrl || webhookUrl.includes("YOUR_WEBHOOK")) {
    throw new Error("⚠️ Webhook Discord non configurato. Contatta l'amministratore del sito.");
  }

  // Crea l'embed per Discord (formato bello)
  const embed = {
    title: `📝 Nuovo Messaggio da ${data.name}`,
    color: 0x22d3ee, // Cyan
    fields: [
      {
        name: "🎮 Discord",
        value: data.discord,
        inline: true
      },
      {
        name: "📌 Oggetto",
        value: capitalizeSubject(data.subject),
        inline: true
      },
      {
        name: "💬 Messaggio",
        value: data.message || "N/A",
        inline: false
      }
    ],
    timestamp: new Date().toISOString(),
    footer: {
      text: "Nexus Network - Contact Form"
    }
  };

  // POST al webhook Discord
  const response = await fetch(webhookUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      username: "Nexus Candidature",
      avatar_url: "https://nexus-network.it/Logo.png",
      embeds: [embed]
    })
  });

  if (!response.ok) {
    throw new Error(`Discord API: ${response.statusText}`);
  }
}

function capitalizeSubject(subject) {
  const labels = {
    "collaborazione": "🤝 Collaborazione",
    "supporto": "🔧 Supporto Tecnico",
    "altro": "📬 Altro"
  };
  return labels[subject] || subject;
}
