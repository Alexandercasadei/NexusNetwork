/**
 * NEXUS NETWORK - High Performance Viewer Engine
 * Sostituisce i cuori con icone spettatore stilizzate (Twitch Style).
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
    this.resizeCanvas();
    
    window.addEventListener('resize', () => this.resizeCanvas());
    this.startAnimationLoop();
    this.start(280); 
  }

  resizeCanvas() {
    this.canvas.width = this.container.offsetWidth * window.devicePixelRatio;
    this.canvas.height = this.container.offsetHeight * window.devicePixelRatio;
    this.ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
  }

  // DISEGNO VETTORIALE: Lo "Spettatore" (User Icon)
  drawVectorHeart(ctx, x, y, size, opacity, zFactor) {
    ctx.save();
    ctx.translate(x, y);
    ctx.globalAlpha = opacity;
    
    // Colore Cyan Nexus per la testa e Purple Twitch per il corpo (Sinergia)
    const primaryColor = zFactor > 0.5 ? '#ff4646' : '#ff4646';
    ctx.fillStyle = primaryColor;

    if (zFactor > 0.7) {
      ctx.shadowColor = primaryColor;
      ctx.shadowBlur = 12 * zFactor;
    }

    const r = size * 0.35; // Raggio della testa
    
    // 1. Disegno Testa (Cerchio)
    ctx.beginPath();
    ctx.arc(0, -size * 0.2, r, 0, Math.PI * 2);
    ctx.fill();

    // 2. Disegno Spalle/Corpo (Arco di cerchio)
    ctx.beginPath();
    ctx.arc(0, size * 0.6, size * 0.6, Math.PI, 0); // Semicerchio per le spalle
    ctx.fill();

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
      vy: 0.7 + (zFactor * 1.5),
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