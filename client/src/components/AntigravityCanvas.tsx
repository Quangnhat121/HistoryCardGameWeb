import { useEffect, useRef } from "react";

export interface AntigravityConfig {
  /** Number of particles (default: 40) */
  particleCount?: number;
  /** Speed multiplier (default: 0.8) */
  speedFactor?: number;
  /** Array of hex color strings (default: gold/amber palette) */
  colors?: string[];
  /** "circle" | "square" | "triangle" | "mixed" (default: "mixed") */
  shape?: "circle" | "square" | "triangle" | "mixed";
  /** Gravity direction/force. Negative = antigravity (up). (default: -0.05) */
  gravity?: number;
  /** If true, uses GPU-optimized sprite cache + pattern mode (default: false) */
  usePattern?: boolean;
  /** Mouse repel interaction radius (default: 150) */
  interactionRadius?: number;
  /** Friction / air resistance (default: 0.97) */
  friction?: number;
  /** Canvas z-index (default: 0) */
  zIndex?: number;
  /** Global opacity of the canvas (default: 1) */
  opacity?: number;
}

const DEFAULT_COLORS = [
  "#e9bd67", // gold
  "#f5e8ca", // parchment
  "#b08a3e", // dark gold
  "#d4a843", // amber
  "#f0c86a", // light gold
  "#8b6c2e", // bronze
];

/**
 * AntigravityCanvas
 *
 * Renders an animated canvas of floating geometric particles behind page
 * content. Ported from davidpelayo/antigravity-animation with React lifecycle
 * management (starts on mount, cleans up on unmount).
 */
export function AntigravityCanvas({
  particleCount = 40,
  speedFactor = 0.8,
  colors = DEFAULT_COLORS,
  shape = "mixed",
  gravity = -0.05,
  usePattern = false,
  interactionRadius = 150,
  friction = 0.97,
  zIndex = 0,
  opacity = 1,
}: AntigravityConfig) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d", {
      alpha: true,
      desynchronized: true,
      willReadFrequently: false,
    } as CanvasRenderingContext2DSettings);
    if (!ctx) return;

    let width = 0;
    let height = 0;
    let animFrameId: number;
    let mouseX = -1000;
    let mouseY = -1000;

    // ---------- Sprite Cache (GPU-optimised path) ----------
    const spriteCache: Record<string, HTMLCanvasElement> = {};
    function getSprite(color: string, shapeType: number): HTMLCanvasElement {
      const key = `${color}-${shapeType}`;
      if (spriteCache[key]) return spriteCache[key];

      const size = 64;
      const center = size / 2;
      const drawSize = 30;

      const c = document.createElement("canvas");
      c.width = size;
      c.height = size;
      const cx = c.getContext("2d")!;

      cx.shadowColor = "rgba(0,0,0,0.10)";
      cx.shadowBlur = 14;
      cx.shadowOffsetX = 4;
      cx.shadowOffsetY = 4;
      cx.fillStyle = color;
      cx.translate(center, center);

      cx.beginPath();
      if (shapeType === 0) {
        cx.arc(0, 0, drawSize / 2, 0, Math.PI * 2);
      } else if (shapeType === 1) {
        cx.rect(-drawSize / 2, -drawSize / 2, drawSize, drawSize);
      } else {
        cx.moveTo(0, -drawSize / 2);
        cx.lineTo(drawSize / 2, drawSize / 2);
        cx.lineTo(-drawSize / 2, drawSize / 2);
        cx.closePath();
      }
      cx.fill();

      spriteCache[key] = c;
      return c;
    }

    // ---------- Canvas resize ----------
    function resize() {
      const dpr = window.devicePixelRatio || 1;
      width = window.innerWidth;
      height = window.innerHeight;
      canvas!.width = width * dpr;
      canvas!.height = height * dpr;
      canvas!.style.width = `${width}px`;
      canvas!.style.height = `${height}px`;
      ctx!.scale(dpr, dpr);
      ctx!.imageSmoothingEnabled = true;
      ctx!.imageSmoothingQuality = "high";
    }

    // ---------- Particle class ----------
    class Particle {
      index: number;
      x = 0;
      y = 0;
      vx = 0;
      vy = 0;
      visualSize = 0;
      color = "";
      rotation = 0;
      rotationSpeed = 0;
      type = 0;
      depth = 0;
      sprite!: HTMLCanvasElement;

      constructor(index: number) {
        this.index = index;
        this.init(true);
      }

      init(randomY = false) {
        this.x = Math.random() * width;
        this.y = randomY ? Math.random() * height : height + 50;
        this.visualSize = Math.random() * 15 + 5;
        this.vx = (Math.random() - 0.5) * 2 * speedFactor;
        this.vy = (Math.random() - 0.5) * 2 * speedFactor;

        if (!usePattern) {
          if (gravity < 0) {
            this.vy -= Math.random() * Math.abs(gravity);
          } else {
            this.y = randomY ? Math.random() * height : -50;
          }
        } else if (!randomY) {
          this.x = width / 2;
          this.y = height / 2;
        }

        this.color = colors[Math.floor(Math.random() * colors.length)];
        this.rotation = Math.random() * Math.PI * 2;
        this.rotationSpeed = (Math.random() - 0.5) * 0.05;
        this.type = this.getShapeType();
        this.sprite = getSprite(this.color, this.type);
        this.depth = Math.random() * 1 + 0.5;
      }

      getShapeType(): number {
        if (shape === "circle") return 0;
        if (shape === "square") return 1;
        if (shape === "triangle") return 2;
        return Math.floor(Math.random() * 3);
      }

      getPatternTarget(): { x: number; y: number } {
        const cx = width / 2;
        const cy = height / 2;
        const r = Math.min(width, height) * 0.35;
        const t = this.index / particleCount;

        const patternType: string = shape === "mixed" ? "circle" : shape;
        let tx = cx;
        let ty = cy;

        if (patternType === "circle") {
          const angle = t * Math.PI * 2 - Math.PI / 2;
          tx = cx + Math.cos(angle) * r;
          ty = cy + Math.sin(angle) * r;
        } else if (patternType === "square") {
          const side = Math.floor(t * 4);
          const subT = (t * 4) % 1;
          switch (side) {
            case 0: tx = cx - r + 2 * r * subT; ty = cy - r; break;
            case 1: tx = cx + r; ty = cy - r + 2 * r * subT; break;
            case 2: tx = cx + r - 2 * r * subT; ty = cy + r; break;
            default: tx = cx - r; ty = cy + r - 2 * r * subT; break;
          }
        } else if (patternType === "triangle") {
          const sides = 3;
          const sideIdx = Math.floor(t * sides);
          const subT = (t * sides) % 1;
          const angles = [
            -Math.PI / 2,
            -Math.PI / 2 + (Math.PI * 2) / 3,
            -Math.PI / 2 + (2 * Math.PI * 2) / 3,
          ];
          const a1 = angles[sideIdx];
          const a2 = angles[(sideIdx + 1) % 3];
          const x1 = cx + Math.cos(a1) * r;
          const y1 = cy + Math.sin(a1) * r;
          const x2 = cx + Math.cos(a2) * r;
          const y2 = cy + Math.sin(a2) * r;
          tx = x1 + (x2 - x1) * subT;
          ty = y1 + (y2 - y1) * subT;
        }
        return { x: tx, y: ty };
      }

      update(mx: number, my: number) {
        if (usePattern) {
          const target = this.getPatternTarget();
          this.vx += (target.x - this.x) * 0.003;
          this.vy += (target.y - this.y) * 0.003;
          this.vx += (Math.random() - 0.5) * 0.05;
          this.vy += (Math.random() - 0.5) * 0.05;
        } else {
          this.vy += gravity * 0.05 * this.depth;
        }

        this.x += this.vx * this.depth;
        this.y += this.vy * this.depth;
        this.rotation += this.rotationSpeed;

        // Mouse/touch repel
        const dx = this.x - mx;
        const dy = this.y - my;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < interactionRadius) {
          const force = (interactionRadius - dist) / interactionRadius;
          const angle = Math.atan2(dy, dx);
          const push = force * 4;
          this.vx += Math.cos(angle) * push;
          this.vy += Math.sin(angle) * push;
        }

        this.vx *= friction;
        this.vy *= friction;

        if (!usePattern) {
          if (this.x < -50) this.x = width + 50;
          if (this.x > width + 50) this.x = -50;
          if (gravity < 0) {
            if (this.y < -60) this.init(false);
          } else {
            if (this.y > height + 60) this.init(false);
          }
        }
      }

      draw() {
        ctx!.save();
        ctx!.translate(this.x, this.y);
        ctx!.rotate(this.rotation);
        const scaleFactor = (this.visualSize * this.depth) / 30;
        const renderSize = 64 * scaleFactor;
        ctx!.drawImage(
          this.sprite,
          -renderSize / 2,
          -renderSize / 2,
          renderSize,
          renderSize
        );
        ctx!.restore();
      }
    }

    // ---------- Bootstrap ----------
    resize();

    const particles: Particle[] = [];
    for (let i = 0; i < particleCount; i++) {
      particles.push(new Particle(i));
    }

    function onMouseMove(e: MouseEvent) {
      mouseX = e.clientX;
      mouseY = e.clientY;
    }
    function onTouchMove(e: TouchEvent) {
      mouseX = e.touches[0].clientX;
      mouseY = e.touches[0].clientY;
    }

    function animate() {
      ctx!.clearRect(0, 0, width, height);
      for (let i = 0; i < particles.length; i++) {
        particles[i].update(mouseX, mouseY);
        particles[i].draw();
      }
      animFrameId = requestAnimationFrame(animate);
    }

    window.addEventListener("resize", resize);
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("touchmove", onTouchMove, { passive: true });
    animFrameId = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(animFrameId);
      window.removeEventListener("resize", resize);
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("touchmove", onTouchMove);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // run once on mount; config is captured via closure

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      style={{
        position: "fixed",
        inset: 0,
        width: "100%",
        height: "100%",
        zIndex,
        opacity,
        pointerEvents: "none",
        willChange: "transform",
      }}
    />
  );
}
