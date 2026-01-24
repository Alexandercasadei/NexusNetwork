import { auth, onAuthStateChanged, signOut } from './firebase-init.js';

const ALLOWED_EMAILS = [
    'therealsam@nexusfounder.it',
    'shadowstrike@nexusdev.it'
];

function initAuth() {
    const adminLinkContainer = document.getElementById('admin-panel-link');
    const authLink = document.getElementById('auth-link');

    // Se gli elementi non esistono, non continuare
    if (!authLink) {
        console.warn('auth-link non trovato');
        return;
    }

    onAuthStateChanged(auth, (user) => {
        // 0. Se non loggato, mostra il bottone di login
        if (!user) {
            // Mostra il bottone di login
            if (authLink) {
                authLink.innerHTML = '<i class="fas fa-sign-in-alt mr-2"></i>Login';
                authLink.classList.remove('text-red-400', 'hover:text-red-300', 'font-bold');
                authLink.setAttribute('href', window.location.pathname.includes('/pages/') ? '../dashboard/login.html' : 'pages/dashboard/login.html');
                authLink.style.cursor = 'pointer';
                authLink.onclick = null;
            }
            // Nascondi il pannello admin
            if (adminLinkContainer) {
                adminLinkContainer.classList.add('hidden');
            }
            return;
        }

        // 1. Gestione Icona Dashboard (Solo Admin)
        if (adminLinkContainer) {
            if (user && ALLOWED_EMAILS.includes(user.email.toLowerCase())) {
                adminLinkContainer.classList.remove('hidden');
                adminLinkContainer.classList.add('flex');
                
                // Aggiorna il link per puntare alla dashboard
                const link = adminLinkContainer.querySelector('a');
                if (link && link.getAttribute('href').includes('login.html')) {
                    link.setAttribute('href', link.getAttribute('href').replace('login.html', 'dashboard.html'));
                }
            } else {
                adminLinkContainer.classList.add('hidden');
                adminLinkContainer.classList.remove('flex');
            }
        }

        // 2. Gestione Tasto Logout (Sempre Logout perché il login è obbligatorio)
        if (authLink) {
            authLink.innerHTML = '<i class="fas fa-sign-out-alt mr-2"></i>Logout';
            authLink.classList.remove('text-red-400', 'hover:text-red-300', 'font-bold');
            authLink.style.cursor = 'pointer';
            
            if (!authLink.dataset.loginHref) {
                authLink.dataset.loginHref = authLink.getAttribute('href');
            }
            authLink.removeAttribute('href');

            authLink.onclick = (e) => {
                e.preventDefault();
                signOut(auth).then(() => {
                    // Il reload attiverà il redirect al login (punto 0)
                    window.location.reload();
                });
            };
        }
    });
}

// Aspetta che il DOM sia pronto
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAuth);
} else {
    // Se lo script è caricato dopo che il DOMContentLoaded è già stato triggerato
    initAuth();
}
