import { useEffect, useRef } from 'react';

const SoftMathBackground = () => {
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

    class GridLine {
      offset: number;
      speed: number;
      isVertical: boolean;

      constructor(isVertical: boolean) {
        this.isVertical = isVertical;
        this.offset = 0;
        this.speed = 0.15;
      }

      draw() {
        ctx.strokeStyle = 'rgba(0, 150, 255, 0.04)';
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
        this.vx = (Math.random() - 0.5) * 0.25;
        this.vy = (Math.random() - 0.5) * 0.25;
        this.radius = 2.5;
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
        // Conexiones más sutiles
        this.connections.forEach(node => {
          const distance = Math.hypot(this.x - node.x, this.y - node.y);
          if (distance < 180) {
            const opacity = (1 - distance / 180) * 0.1;
            ctx.strokeStyle = `rgba(0, 150, 255, ${opacity})`;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(this.x, this.y);
            ctx.lineTo(node.x, node.y);
            ctx.stroke();
          }
        });

        // Nodo con glow más suave
        const gradient = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, this.radius * 2);
        gradient.addColorStop(0, 'rgba(0, 212, 255, 0.4)');
        gradient.addColorStop(1, 'rgba(0, 212, 255, 0)');
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius * 2, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = 'rgba(0, 255, 255, 0.6)';
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    const gridV = new GridLine(true);
    const gridH = new GridLine(false);

    // Crear menos nodos para un efecto más sutil
    const nodes: NetworkNode[] = [];
    for (let i = 0; i < 20; i++) {
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
      ctx.fillStyle = 'rgba(10, 14, 39, 0.15)';
      ctx.fillRect(0, 0, width, height);

      gridV.draw();
      gridH.draw();

      // Red neuronal
      nodes.forEach(node => {
        node.update();
        node.draw();
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
        opacity: 0.6
      }}
    />
  );
};

export default SoftMathBackground;