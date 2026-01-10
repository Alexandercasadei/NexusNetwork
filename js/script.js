const creatorModal = document.getElementById("creatorModal");

// Definiamo mImg ecc. se il modal esiste, per evitare errori globali su alcune pagine
const mImg = document.getElementById("mImg");
const mName = document.getElementById("mName");
const mRole = document.getElementById("mRole");
const mDesc = document.getElementById("mDesc");

function openCreator(data) {
  if (!creatorModal) return;
  creatorModal.classList.remove("hidden");
  creatorModal.classList.add("flex");

  if (mImg) mImg.src = data.img;
  if (mName) mName.innerText = data.name;
  if (mRole) mRole.innerText = data.role;
  if (mDesc) mDesc.innerText = data.desc;

  toggleLink("mTwitch", data.twitch);
  toggleLink("mGithub", data.github);
  toggleLink("mInstagram", data.instagram);
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

document.querySelectorAll(".scroll-animate, .creator").forEach((el) => observer.observe(el));

// Twitch LIVE status integration
const STREAMERS = [
    { name: 'TheRealSam', username: 'therealsamtv' },
    { name: 'Darius', username: 'itsdariuus' }
];

async function checkTwitchStatus() {
    for (const streamer of STREAMERS) {
        try {
            const response = await fetch(`https://decapi.me/twitch/uptime/${streamer.username}`);
            const text = await response.text();
            const isLive = !text.toLowerCase().includes('offline');
            updateLiveStatus(streamer.name, isLive, streamer.username);
        } catch (err) {
            console.error(`Errore fetch Twitch per ${streamer.name}:`, err);
        }
    }
}

function updateLiveStatus(name, isLive, username) {
    // Trova tutte le card che contengono il nome dello streamer nel parametro dell'onclick
    const cards = document.querySelectorAll(`[onclick*="'${name}'"], [onclick*='"${name}"']`);
    
    cards.forEach(card => {
        let badge = card.querySelector('.live-badge');
        
        if (isLive) {
            if (!badge) {
                badge = document.createElement('div');
                badge.className = 'live-badge';
                badge.innerHTML = 'LIVE';
                badge.onclick = (e) => {
                    e.stopPropagation();
                    window.open(`https://twitch.tv/${username}`, '_blank');
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

// Smart Navbar Scroll Effect
const nav = document.querySelector('.nav-container');
window.addEventListener('scroll', () => {
    if (nav) {
        if (window.scrollY > 50) {
            nav.classList.add('nav-hidden');
        } else {
            nav.classList.remove('nav-hidden');
        }
    }
});

// Theme Switching Logic (Simple & Reliable)
const themeToggle = document.getElementById('theme-toggle');

if (themeToggle) {
    const savedTheme = localStorage.getItem('theme') || 'dark';
    // Il tema viene già impostato in Head per evitare flash, 
    // qui aggiorniamo solo l'icona e aggiungiamo il listener.
    updateToggleUI(savedTheme);

    themeToggle.addEventListener('click', () => {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        
        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
        updateToggleUI(newTheme);
    });
}

function updateToggleUI(theme) {
    const icon = themeToggle?.querySelector('i');
    if (!icon) return;
    
    if (theme === 'light') {
        icon.className = 'fas fa-sun';
        themeToggle.style.color = '#eab308'; // Giallo sole
    } else {
        icon.className = 'fas fa-moon';
        themeToggle.style.color = ''; // Torna al default (grigio)
    }
}
