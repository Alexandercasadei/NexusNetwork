const creatorModal = document.getElementById("creatorModal");

function openCreator(data) {
  if (!creatorModal) return;
  creatorModal.classList.remove("hidden");
  creatorModal.classList.add("flex");

  // Selezioniamo gli elementi all'apertura in caso non siano stati trovati all'avvio
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

  // Reset dei segnaposto per le statistiche
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

async function fetchGithubStars(githubUrl) {
  const modalGithubStats = document.getElementById("mGithubStats");
  try {
    const username = githubUrl.split("/").pop();
    // Recupera tutti i repository pubblici per contare le stelle totali (limite 100 per semplicità)
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

// Intersection Observer per animazioni scroll
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

// Integrazione dello stato LIVE di Twitch
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
  // Trova tutte le card che contengono il nome dello streamer nel parametro dell'onclick
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

// Controllo ogni minuto
checkTwitchStatus();
setInterval(checkTwitchStatus, 60000);

// Effetto di scorrimento Navbar intelligente
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

// Logica di cambio tema (semplice e affidabile)
const themeToggle = document.getElementById("theme-toggle");

if (themeToggle) {
  const savedTheme = localStorage.getItem("theme") || "dark";
  // Il tema viene già impostato in Head per evitare flash,
  // qui aggiorniamo solo l'icona e aggiungiamo il listener.
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
    themeToggle.style.color = "#eab308"; // Giallo sole
  } else {
    icon.className = "fas fa-moon";
    themeToggle.style.color = ""; // Torna al default (grigio)
  }
}
// Chiudi il modale cliccando fuori dalla card
window.addEventListener("click", (e) => {
  if (e.target === creatorModal) {
    closeCreator();
  }
});

// Gestione Form Contatti
const contactForm = document.getElementById("contactForm");
const formStatus = document.getElementById("formStatus");

if (contactForm) {
  contactForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const submitBtn = contactForm.querySelector('button[type="submit"]');
    const originalText = submitBtn.innerHTML;

    // Stato caricamento
    submitBtn.disabled = true;
    submitBtn.innerHTML =
      '<i class="fas fa-circle-notch fa-spin mr-2"></i>Invio in corso...';

    try {
      // Simuliamo un invio (mockup)
      // Qui andrebbe la logica reale (fetch a un endpoint backend o servizio email)
      await new Promise((resolve) => setTimeout(resolve, 1500));

      // Successo
      formStatus.textContent =
        "Messaggio inviato con successo! Ti risponderemo al più presto.";
      formStatus.className = "success p-4 rounded-xl font-medium mt-4";
      formStatus.classList.remove("hidden");
      contactForm.reset();
    } catch (err) {
      // Errore
      formStatus.textContent = "Si è verificato un errore. Riprova più tardi.";
      formStatus.className = "error p-4 rounded-xl font-medium mt-4";
      formStatus.classList.remove("hidden");
    } finally {
      submitBtn.disabled = false;
      submitBtn.innerHTML = originalText;

      // Nascondi lo stato dopo 5 secondi
      setTimeout(() => {
        formStatus.classList.add("hidden");
      }, 5000);
    }
  });
}
