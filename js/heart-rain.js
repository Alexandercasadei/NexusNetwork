/**
 * NEXUS NETWORK - High Performance Viewer Engine
 * Sostituisce i cuori con il logo di Twitch viola che cade.
 */
class HeartRain {
  constructor(containerId = 'heart-rain-container') {
    this.container = document.getElementById(containerId);
    if (!this.container) return;

    // Confinamento nella sezione tramite CSS injection
    this.container.style.position = 'absolute'; 
    this.container.style.inset = '0';
    this.container.style.overflow = 'hidden';
    this.container.style.pointerEvents = 'none';

    this.canvas = document.createElement('canvas');
    this.ctx = this.canvas.getContext('2d', { alpha: true });
    
    Object.assign(this.canvas.style, {
      position: 'absolute',
      top: '0',
      left: '0',
      width: '100%',
      height: '100%',
      zIndex: '0'
    });

    this.container.appendChild(this.canvas);
    this.hearts = []; // Manteniamo il nome per compatibilità HTML
    this.twitchLogo = null;
    
    // Carica l'immagine del logo Twitch
    this.loadTwitchLogo();
    this.resizeCanvas();
    
    window.addEventListener('resize', () => this.resizeCanvas());
    this.startAnimationLoop();
    this.start(120); 
  }

  loadTwitchLogo() {
    const img = new Image();
    img.onload = () => {
      this.twitchLogo = img;
    };
    
    // Soluzione robusta per i percorsi: cerca di risalire alla root
    const path = window.location.pathname;
    let prefix = "";
    if (path.includes("/pages/")) {
       // Se siamo in una sottocartella dentro /pages/ (es. /pages/live/...)
       prefix = "../../";
    }
    img.src = prefix + 'assets/images/twitch-logo.svg';
  }

  resizeCanvas() {
    this.canvas.width = this.container.offsetWidth * window.devicePixelRatio;
    this.canvas.height = this.container.offsetHeight * window.devicePixelRatio;
    this.ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
  }

  // DISEGNO: Logo Twitch Viola
  drawVectorHeart(ctx, x, y, size, opacity, zFactor) {
    ctx.save();
    ctx.globalAlpha = opacity;

    if (this.twitchLogo) {
      ctx.drawImage(this.twitchLogo, x - size / 2, y - size / 2, size, size);
    } else {
      // Fallback: disegna un cerchio viola mentre carica l'immagine
      ctx.fillStyle = '#9146FF';
      ctx.beginPath();
      ctx.arc(x, y, size / 2, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }

  addHeart() {
    const zFactor = Math.random(); 
    const size = 8 + (zFactor * 16);
    const x = Math.random() * (this.container.offsetWidth);
    
    this.hearts.push({
      x, 
      y: -40, 
      zFactor,
      vy: 0.3 + (zFactor * 0.6),  // Velocità ridotta della metà
      size, 
      opacity: 0.15 + (zFactor * 0.4),
      startTime: performance.now(),
      duration: 7000 + (Math.random() * 5000),
      sway: 10 + (zFactor * 20),
      swayFreq: 0.001 + (Math.random() * 0.0005)
    });
  }

  trigger(count = 15) {
    for (let i = 0; i < count; i++) setTimeout(() => this.addHeart(), i * 120);
  }

  startAnimationLoop() {
    const animate = (now) => {
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
      this.hearts = this.hearts.filter(p => {
        const elapsed = now - p.startTime;
        const progress = elapsed / p.duration;
        if (progress >= 1) return false;
        
        p.y += p.vy;
        const swayX = Math.sin(now * p.swayFreq) * p.sway;
        let op = p.opacity;
        if (progress > 0.8) op *= (1 - progress) * 5;
        
        this.drawVectorHeart(this.ctx, p.x + swayX, p.y, p.size, op, p.zFactor);
        return true;
      });
      requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
  }

  start(freq) { setInterval(() => this.addHeart(), freq); }
}