
module.exports = {
    "files": ["**/*.css", "**/*.js", "**/*.html"],
    "server": {
        "baseDir": "./",
        "middleware": [
            function(req, res, next) {
                // Semplice parsing URL
                var url = req.url.split('?')[0];
                var search = req.url.split('?')[1] || '';
                var query = search ? '?' + search : '';

                // Rimuovi slash finale per normalizzare (es. /dashboard/ -> /dashboard)
                if (url.length > 1 && url.endsWith('/')) {
                    url = url.slice(0, -1);
                }

                // Mappa dei Rewrites (Copia di serve.json)
                var rewrites = {
                    '/team': '/pages/team/index.html',
                    '/creators': '/pages/creators/index.html',
                    '/live': '/pages/live/index.html',
                    '/dashboard': '/pages/dashboard/index.html',
                    '/contacts': '/pages/contacts/index.html',
                    '/services': '/pages/services/index.html',
                    '/login': '/pages/dashboard/login.html',
                    '/admin': '/pages/dashboard/login.html',
                    '/player': '/pages/live/player.html',
                    '/favicon.ico': '/Favicon/favicon.ico'
                };

                if (rewrites[url]) {
                    req.url = rewrites[url] + query;
                }
                
                next();
            }
        ]
    },
    "port": 3000,
    "notify": true, // Mostra notifica "Connected"
    "ui": false,
    "open": true // Apre automaticamente il browser
};
