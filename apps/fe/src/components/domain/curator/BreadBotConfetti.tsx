import { useEffect, useRef } from "react";
import { cn } from "@/utils/cn";

type Particle = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  rotation: number;
  rotationSpeed: number;
  color: string;
  life: number;
};

type BreadBotConfettiProps = {
  active: boolean;
  className?: string;
  onComplete?: () => void;
};

const COLORS = ["#ff8648", "#ffb347", "#ffd166", "#06d6a0", "#118ab2", "#ef476f", "#8338ec"];

function createParticle(width: number): Particle {
  return {
    x: width * (0.25 + Math.random() * 0.5),
    y: -12,
    vx: (Math.random() - 0.5) * 7,
    vy: 2 + Math.random() * 4,
    size: 5 + Math.random() * 7,
    rotation: Math.random() * 360,
    rotationSpeed: (Math.random() - 0.5) * 12,
    color: COLORS[Math.floor(Math.random() * COLORS.length)]!,
    life: 1,
  };
}

export default function BreadBotConfetti({ active, className, onComplete }: BreadBotConfettiProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const onCompleteRef = useRef(onComplete);

  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  useEffect(() => {
    if (!active) return undefined;

    const canvas = canvasRef.current;
    if (!canvas) return undefined;

    const context = canvas.getContext("2d");
    if (!context) return undefined;

    let animationId = 0;
    let cancelled = false;
    const particles: Particle[] = [];
    const startedAt = performance.now();
    const durationMs = 3200;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    resize();
    window.addEventListener("resize", resize);

    for (let i = 0; i < 120; i++) {
      particles.push(createParticle(canvas.width));
    }

    const tick = (now: number) => {
      if (cancelled) return;

      context.clearRect(0, 0, canvas.width, canvas.height);

      for (const particle of particles) {
        particle.x += particle.vx;
        particle.y += particle.vy;
        particle.vy += 0.12;
        particle.vx *= 0.99;
        particle.rotation += particle.rotationSpeed;
        particle.life = Math.max(0, 1 - (now - startedAt) / durationMs);

        context.save();
        context.translate(particle.x, particle.y);
        context.rotate((particle.rotation * Math.PI) / 180);
        context.globalAlpha = particle.life;
        context.fillStyle = particle.color;
        context.fillRect(-particle.size / 2, -particle.size / 4, particle.size, particle.size / 2);
        context.restore();
      }

      if (now - startedAt < durationMs) {
        animationId = window.requestAnimationFrame(tick);
      } else {
        context.clearRect(0, 0, canvas.width, canvas.height);
        onCompleteRef.current?.();
      }
    };

    animationId = window.requestAnimationFrame(tick);

    return () => {
      cancelled = true;
      window.cancelAnimationFrame(animationId);
      window.removeEventListener("resize", resize);
    };
  }, [active]);

  if (!active) return null;

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      className={cn("pointer-events-none fixed inset-0 z-[80]", className)}
    />
  );
}
