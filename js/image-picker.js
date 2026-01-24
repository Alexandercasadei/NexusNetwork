// Image Picker - Carica immagini locali senza Firebase Storage

const AVAILABLE_IMAGES = {
    staff: [
        'Gio.png', 'jhonnygg_.png', 'kv_vinix.png', 'lamspeed.png', 'Pam.png',
        'ruskalancik.png', 'Sam.png', 'shadowstrike.PNG', 'Simma.jpg', 'ZioSirvio.png'
    ],
    creators: [
        'Alebenignoo.png', 'Darius.png', 'Ghost.png', 'Sam.png'
    ]
};

export function openImagePicker(section, callback) {
    const modal = document.getElementById('imagePicker');
    
    const images = AVAILABLE_IMAGES[section] || [];
    const grid = modal.querySelector('#imageGrid');
    grid.innerHTML = '';
    
    images.forEach(imageName => {
        const img = document.createElement('div');
        img.className = 'relative cursor-pointer group rounded-lg overflow-hidden border-2 border-gray-700 hover:border-cyan-400 transition-all';
        img.innerHTML = `
            <img src="../../assets/images/${section === 'staff' ? 'Staff' : 'Creator'}/${imageName}" 
                 alt="${imageName}"
                 class="w-24 h-24 object-cover group-hover:scale-110 transition-transform">
            <div class="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all flex items-center justify-center">
                <i class="fas fa-check text-cyan-400 text-2xl opacity-0 group-hover:opacity-100 transition-opacity"></i>
            </div>
        `;
        
        img.addEventListener('click', () => {
            callback(`../../assets/images/${section === 'staff' ? 'Staff' : 'Creator'}/${imageName}`);
            window.closeImagePicker();
        });
        
        grid.appendChild(img);
    });
    
    modal.classList.remove('hidden');
    modal.classList.add('flex');
}

export function closeImagePicker() {
    const modal = document.getElementById('imagePicker');
    if (modal) {
        modal.classList.add('hidden');
        modal.classList.remove('flex');
    }
}

// Export globalmente per onclick
window.closeImagePicker = closeImagePicker;
