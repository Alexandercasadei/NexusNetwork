
// Cookie Helpers
function setCookie(cname, cvalue, exdays) {
  const d = new Date();
  d.setTime(d.getTime() + (exdays*24*60*60*1000));
  let expires = "expires="+ d.toUTCString();
  document.cookie = cname + "=" + cvalue + ";" + expires + ";path=/";
  console.log("Cookie set:", cname);
}

function getCookie(cname) {
  let name = cname + "=";
  let decodedCookie = decodeURIComponent(document.cookie);
  let ca = decodedCookie.split(';');
  for(let i = 0; i <ca.length; i++) {
    let c = ca[i];
    while (c.charAt(0) == ' ') {
      c = c.substring(1);
    }
    if (c.indexOf(name) == 0) {
      return c.substring(name.length, c.length);
    }
  }
  return "";
}

// Check Admin Token on Load
document.addEventListener('DOMContentLoaded', () => {
    const adminLink = document.getElementById('admin-panel-link');
    
    // Backup: Se c'è in localStorage (vecchio metodo) ma non nei cookie, creiamo il cookie
    if (localStorage.getItem('adminToken') && !getCookie('adminToken')) {
        setCookie('adminToken', 'firebase-active', 3650);
    }

    const hasCookie = getCookie('adminToken');
    console.log("Admin Check - Cookie:", hasCookie);

    if (adminLink && hasCookie) {
        adminLink.classList.remove('hidden');
        adminLink.classList.add('flex');
    }
});
