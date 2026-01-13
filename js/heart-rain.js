class HeartRain {
  constructor(containerId = 'tsparticles') {
    this.container = document.getElementById(containerId);
    if (!this.container) return;

    // SETUP CONTENITORE: Deve essere relative per ospitare il canvas absolute
    this.container.style.position = 'absolute'; 
    this.container.style.overflow = 'hidden';
    this.container.style.inset = '0'; // Copre tutto il genitore

    this.canvas = document.createElement('canvas');
    this.ctx = this.canvas.getContext('2d', { alpha: true });
    
    // SETUP CANVAS: Copertura totale millimetrica
    Object.assign(this.canvas.style, {
      position: 'absolute',
      top: '0',
      left: '0',
      width: '100%',
      height: '100%',
      pointerEvents: 'none',
      zIndex: '0' // Dietro al testo (che dovrà avere z-index superiore)
    });

    this.container.appendChild(this.canvas);
    this.hearts = [];
    this.resizeCanvas();
    
    window.addEventListener('resize', () => this.resizeCanvas());
    this.startAnimationLoop();
    this.start(250); 
  }

  resizeCanvas() {
    this.canvas.width = this.container.offsetWidth * window.devicePixelRatio;
    this.canvas.height = this.container.offsetHeight * window.devicePixelRatio;
    this.ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
  }

  drawVectorHeart(ctx, x, y, size, opacity, zFactor) {
    ctx.save();
    ctx.globalAlpha = opacity;
    if (zFactor > 0.6) {
      ctx.shadowColor = 'rgba(255, 75, 75, 0.4)';
      ctx.shadowBlur = 10 * zFactor;
    }
    ctx.translate(x, y);
    ctx.beginPath();
    const d = size;
    ctx.moveTo(0, d / 4);
    ctx.quadraticCurveTo(0, 0, d / 4, 0);
    ctx.quadraticCurveTo(d / 2, 0, d / 2, d / 4);
    ctx.quadraticCurveTo(d / 2, 0, d * 3/4, 0);
    ctx.quadraticCurveTo(d, 0, d, d / 4);
    ctx.quadraticCurveTo(d, d / 2, d / 2, d * 3/4);
    ctx.quadraticCurveTo(0, d / 2, 0, d / 4);
    ctx.fillStyle = '#ff4b4b'; 
    ctx.fill();
    ctx.restore();
  }

  addHeart() {
    const zFactor = Math.random(); 
    const size = 6 + (zFactor * 10);
    const x = Math.random() * (this.canvas.width / window.devicePixelRatio);
    this.hearts.push({
      x, y: -20, zFactor,
      vy: 0.6 + (zFactor * 1.2),
      size, opacity: 0.15 + (zFactor * 0.4),
      startTime: performance.now(),
      duration: 7000 + (Math.random() * 5000),
      swayDistance: 15 + (zFactor * 25),
      swayFreq: 0.001 + (Math.random() * 0.001)
    });
  }

  trigger(count = 15) {
    for (let i = 0; i < count; i++) setTimeout(() => this.addHeart(), i * 100);
  }

  startAnimationLoop() {
    const animate = (now) => {
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
      this.hearts = this.hearts.filter(h => {
        const elapsed = now - h.startTime;
        const progress = elapsed / h.duration;
        if (progress >= 1) return false;
        h.y += h.vy;
        const swayX = Math.sin(now * h.swayFreq) * h.swayDistance;
        let op = h.opacity;
        if (progress > 0.8) op *= (1 - progress) * 5;
        this.drawVectorHeart(this.ctx, h.x + swayX, h.y, h.size, op, h.zFactor);
        return true;
      });
      requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
  }

  start(freq) { setInterval(() => this.addHeart(), freq); }
}