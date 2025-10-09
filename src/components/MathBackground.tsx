import { useEffect, useRef } from 'react';

const MathBackground = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = window.innerWidth;
    let height = window.innerHeight;

    const resize = () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };

    resize();
    window.addEventListener('resize', resize);

    // Símbolos y ecuaciones
    const symbols = ['∑', 'π', '∫', '√', 'α', 'β', 'θ', 'λ', '∞', '≈', '≤', '≥', 'Δ', 'Ω', 'φ', 'ψ'];
    const equations = [
      'E=mc²',
      'a²+b²=c²',
      'F=ma',
      'x²+y²=r²',
      'sin²+cos²=1',
      '∫f(x)dx',
      'lim x→∞',
      'dy/dx',
      'Σx²',
      '∇·F=0'
    ];

    class Particle {
      x: number;
      y: number;
      speed: number;
      size: number;
      text: string;
      color: string;
      drift: number;
      opacity: number;

      constructor() {
        this.opacity = Math.random() * 0.5 + 0.2;
        this.reset();
        this.y = Math.random() * height;
      }

      reset() {
        this.x = Math.random() * width;
        this.y = -50;
        this.speed = Math.random() * 0.5 + 0.2;
        this.size = Math.random() * 20 + 12;
        this.text = Math.random() > 0.5 
          ? symbols[Math.floor(Math.random() * symbols.length)]
          : equations[Math.floor(Math.random() * equations.length)];
        this.color = Math.random() > 0.5 
          ? `rgba(0, 212, 255, ${this.opacity})`
          : `rgba(0, 102, 255, ${this.opacity})`;
        this.drift = (Math.random() - 0.5) * 0.3;
      }

      update() {
        this.y += this.speed;
        this.x += this.drift;
        
        if (this.y > height + 50) {
          this.reset();
        }
      }

      draw() {
        ctx.save();
        ctx.font = `${this.size}px 'Courier New', monospace`;
        ctx.fillStyle = this.color;
        ctx.fillText(this.text, this.x, this.y);
        ctx.restore();
      }
    }

    class GridLine {
      offset: number;
      speed: number;
      isVertical: boolean;

      constructor(isVertical: boolean) {
        this.isVertical = isVertical;
        this.offset = 0;
        this.speed = 0.2;
      }

      draw() {
        ctx.strokeStyle = 'rgba(0, 150, 255, 0.05)';
        ctx.lineWidth = 1;
        ctx.beginPath();

        if (this.isVertical) {
          for (let x = this.offset; x < width; x += 60) {
            ctx.moveTo(x, 0);
            ctx.lineTo(x, height);
          }
        } else {
          for (let y = this.offset; y < height; y += 60) {
            ctx.moveTo(0, y);
            ctx.lineTo(width, y);
          }
        }
        
        ctx.stroke();
        this.offset += this.speed;
        if (this.offset > 60) this.offset = 0;
      }
    }

    class PulsingCircle {
      x: number;
      y: number;
      baseRadius: number;
      radius: number;
      phase: number;
      speed: number;

      constructor(x: number, y: number, baseRadius: number) {
        this.x = x;
        this.y = y;
        this.baseRadius = baseRadius;
        this.radius = baseRadius;
        this.phase = Math.random() * Math.PI * 2;
        this.speed = 0.02;
      }

      update() {
        this.phase += this.speed;
        this.radius = this.baseRadius + Math.sin(this.phase) * 10;
      }

      draw() {
        ctx.strokeStyle = 'rgba(0, 102, 255, 0.2)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.stroke();

        ctx.fillStyle = 'rgba(0, 102, 255, 0.05)';
        ctx.fill();
      }
    }

    // Red Neuronal
    class NetworkNode {
      x: number;
      y: number;
      vx: number;
      vy: number;
      radius: number;
      connections: NetworkNode[];

      constructor(x: number, y: number) {
        this.x = x;
        this.y = y;
        this.vx = (Math.random() - 0.5) * 0.3;
        this.vy = (Math.random() - 0.5) * 0.3;
        this.radius = 3;
        this.connections = [];
      }

      update() {
        this.x += this.vx;
        this.y += this.vy;

        if (this.x < 0 || this.x > width) this.vx *= -1;
        if (this.y < 0 || this.y > height) this.vy *= -1;

        this.x = Math.max(0, Math.min(width, this.x));
        this.y = Math.max(0, Math.min(height, this.y));
      }

      draw() {
        // Conexiones
        this.connections.forEach(node => {
          const distance = Math.hypot(this.x - node.x, this.y - node.y);
          if (distance < 180) {
            const opacity = (1 - distance / 180) * 0.15;
            ctx.strokeStyle = `rgba(0, 150, 255, ${opacity})`;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(this.x, this.y);
            ctx.lineTo(node.x, node.y);
            ctx.stroke();
          }
        });

        // Nodo con glow
        const gradient = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, this.radius * 2);
        gradient.addColorStop(0, 'rgba(0, 212, 255, 0.6)');
        gradient.addColorStop(1, 'rgba(0, 212, 255, 0)');
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius * 2, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = 'rgba(0, 255, 255, 0.8)';
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    const particles = Array.from({ length: 30 }, () => new Particle());
    const gridV = new GridLine(true);
    const gridH = new GridLine(false);
    const circles = [
      new PulsingCircle(width * 0.2, height * 0.3, 80),
      new PulsingCircle(width * 0.8, height * 0.3, 100),
      new PulsingCircle(width * 0.5, height * 0.25, 60)
    ];

    // Crear nodos de red neuronal
    const nodes: NetworkNode[] = [];
    for (let i = 0; i < 25; i++) {
      nodes.push(new NetworkNode(Math.random() * width, Math.random() * height));
    }
    
    // Conectar cada nodo con sus 3 vecinos más cercanos
    nodes.forEach(node => {
      const nearby = nodes
        .filter(n => n !== node)
        .sort((a, b) => {
          const distA = Math.hypot(node.x - a.x, node.y - a.y);
          const distB = Math.hypot(node.x - b.x, node.y - b.y);
          return distA - distB;
        })
        .slice(0, 3);
      
      node.connections = nearby;
    });

    const animate = () => {
      ctx.fillStyle = 'rgba(10, 14, 39, 0.1)';
      ctx.fillRect(0, 0, width, height);

      gridV.draw();
      gridH.draw();

      circles.forEach(circle => {
        circle.update();
        circle.draw();
      });

      // Red neuronal
      nodes.forEach(node => {
        node.update();
        node.draw();
      });

      particles.forEach(particle => {
        particle.update();
        particle.draw();
      });

      animationFrameId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 w-full h-full pointer-events-none"
      style={{
        background: 'linear-gradient(135deg, #0a0e27 0%, #1a1f3a 50%, #0f1729 100%)',
        zIndex: 0,
        filter: 'blur(2px)',
        opacity: 0.7
      }}
    />
  );
};

export default MathBackground;