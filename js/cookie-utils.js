import { auth, onAuthStateChanged, signOut } from './firebase-init.js';

const ALLOWED_EMAILS = [
    'therealsam@nexusfounder.it',
    'shadowstrike@nexusdev.it',
    'lucifer@nexusdev.it'
];

document.addEventListener('DOMContentLoaded', () => {
    const adminLinkContainer = document.getElementById('admin-panel-link');
    const authLink = document.getElementById('auth-link');

    onAuthStateChanged(auth, (user) => {
        // 0. Protezione Sito: Se non loggato, reindirizza al login
        if (!user) {
            // Calcola il percorso relativo per il login
            const isInPages = window.location.pathname.includes('/pages/');
            // Evita loop se siamo già nella pagina di login (anche se questo script non dovrebbe esserci lì)
            if (!window.location.pathname.includes('login.html')) {
                window.location.replace(isInPages ? '../dashboard/login.html' : 'pages/dashboard/login.html');
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
            authLink.classList.add('text-red-400', 'hover:text-red-300', 'font-bold');
            
            if (!authLink.dataset.loginHref) {
                authLink.dataset.loginHref = authLink.getAttribute('href');
            }
            authLink.removeAttribute('href');
            authLink.style.cursor = 'pointer';

            authLink.onclick = (e) => {
                e.preventDefault();
                signOut(auth).then(() => {
                    // Il reload attiverà il redirect al login (punto 0)
                    window.location.reload();
                });
            };
        }
    });
});
