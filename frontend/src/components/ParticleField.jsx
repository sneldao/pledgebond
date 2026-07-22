import React, { useEffect, useRef, useImperativeHandle, forwardRef } from "react";

/**
 * ParticleField — canvas-based ember/particle backdrop.
 *
 * Gold + burgundy embers drift upward from the seal area, react to mouse
 * (repel), and burst outward on click/tap via a shockwave. Replaces the
 * stale CSS-only AmbientBackdrop with something alive and interactive.
 *
 * Bright aesthetic: parchment background, warm particles, soft glow.
 * No Three.js — pure canvas 2D, ~300 particles, GPU-friendly.
 *
 * Imperative API (via ref):
 *   burst(x, y) — trigger a shockwave from screen coordinates
 *
 * Props:
 *   density — particle count multiplier (default 1)
 *   glowColor — glow color for particles (default gold)
 */

const COLORS = [
  { r: 196, g: 154, b: 58 },   // gold
  { r: 224, g: 192, b: 106 },  // gold light
  { r: 154, g: 31, b: 61 },    // burgundy
  { r: 123, g: 23, b: 48 },    // burgundy dark
  { r: 212, g: 175, b: 55 },   // wax gold
];

const PARTICLE_BASE_COUNT = 80;
const MOUSE_REPEL_RADIUS = 60;
const MOUSE_REPEL_STRENGTH = 0.6;
const SHOCKWAVE_SPEED = 5;
const SHOCKWAVE_MAX_RADIUS = 350;
const EMBER_RISE_SPEED = 0.2;

const ParticleField = forwardRef(function ParticleField(
  { density = 1, className = "" },
  ref
) {
  const canvasRef = useRef(null);
  const particlesRef = useRef([]);
  const shockwavesRef = useRef([]);
  const mouseRef = useRef({ x: -1000, y: -1000, active: false });
  const rafRef = useRef(null);
  const reducedMotionRef = useRef(false);

  // spawnEmber lives at module scope of the component so both the
  // imperative burst() and the effect's animation loop can call it.
  function spawnEmber(x, y, fromBurst = false) {
    const color = COLORS[Math.floor(Math.random() * COLORS.length)];
    const angle = fromBurst ? Math.random() * Math.PI * 2 : -Math.PI / 2 + (Math.random() - 0.5) * 0.6;
    const speed = fromBurst ? 2 + Math.random() * 3 : EMBER_RISE_SPEED + Math.random() * 0.5;
    particlesRef.current.push({
      x, y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      size: 0.8 + Math.random() * 2.5,
      color,
      opacity: 0,
      targetOpacity: 0.15 + Math.random() * 0.25,
      life: 1,
      decay: fromBurst ? 0.008 : 0.003 + Math.random() * 0.002,
      wobble: Math.random() * Math.PI * 2,
      wobbleSpeed: 0.02 + Math.random() * 0.03,
    });
  }

  useImperativeHandle(ref, () => ({
    burst: (clientX, clientY) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const x = clientX - rect.left;
      const y = clientY - rect.top;
      shockwavesRef.current.push({
        x, y, radius: 0, life: 1,
      });
      // Also spawn extra embers at burst point
      for (let i = 0; i < 12; i++) {
        spawnEmber(x, y, true);
      }
    },
  }));

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");

    reducedMotionRef.current = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let width = 0, height = 0;

    function resize() {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = canvas.clientWidth;
      height = canvas.clientHeight;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    resize();
    window.addEventListener("resize", resize);

    // Initialize particles across the full viewport
    const count = Math.floor(PARTICLE_BASE_COUNT * density);
    particlesRef.current = [];
    for (let i = 0; i < count; i++) {
      spawnEmber(Math.random() * width, Math.random() * height);
    }

    // Spawn new embers over time (rise from bottom to replace expired ones)
    let spawnTimer = 0;

    function onMouseMove(e) {
      mouseRef.current.x = e.clientX;
      mouseRef.current.y = e.clientY;
      mouseRef.current.active = true;
    }

    function onMouseLeave() {
      mouseRef.current.active = false;
      mouseRef.current.x = -1000;
      mouseRef.current.y = -1000;
    }

    function onTouchMove(e) {
      if (e.touches.length > 0) {
        mouseRef.current.x = e.touches[0].clientX;
        mouseRef.current.y = e.touches[0].clientY;
        mouseRef.current.active = true;
      }
    }

    function onTouchEnd() {
      mouseRef.current.active = false;
    }

    // Use window listeners since canvas has pointer-events: none
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseleave", onMouseLeave);
    window.addEventListener("touchmove", onTouchMove, { passive: true });
    window.addEventListener("touchend", onTouchEnd);

    function animate() {
      rafRef.current = requestAnimationFrame(animate);

      // Clear with slight trail (creates motion blur effect)
      ctx.fillStyle = "rgba(255, 251, 242, 0.12)";
      ctx.fillRect(0, 0, width, height);

      // Spawn new embers from bottom to replace expired ones
      spawnTimer++;
      if (spawnTimer > 3 && particlesRef.current.length < count * 1.3) {
        spawnTimer = 0;
        spawnEmber(Math.random() * width, height + Math.random() * 50);
      }

      const mouse = mouseRef.current;
      const reduced = reducedMotionRef.current;

      // Update + draw shockwaves
      shockwavesRef.current = shockwavesRef.current.filter((sw) => {
        sw.radius += SHOCKWAVE_SPEED;
        sw.life = 1 - sw.radius / SHOCKWAVE_MAX_RADIUS;
        if (sw.life <= 0) return false;

        // Draw shockwave ring
        ctx.beginPath();
        ctx.arc(sw.x, sw.y, sw.radius, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(196, 154, 58, ${sw.life * 0.3})`;
        ctx.lineWidth = 2;
        ctx.stroke();

        // Inner glow ring
        ctx.beginPath();
        ctx.arc(sw.x, sw.y, sw.radius * 0.85, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(224, 192, 106, ${sw.life * 0.15})`;
        ctx.lineWidth = 4;
        ctx.stroke();

        return true;
      });

      // Update + draw particles
      const particles = particlesRef.current;
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];

        // Fade in
        if (p.opacity < p.targetOpacity) {
          p.opacity += 0.02;
        }

        // Decay
        p.life -= p.decay;
        if (p.life <= 0 || p.y < -20) {
          particles.splice(i, 1);
          continue;
        }

        // Wobble (horizontal drift)
        p.wobble += p.wobbleSpeed;
        const wobbleX = Math.sin(p.wobble) * 0.3;

        // Mouse repel
        if (mouse.active && !reduced) {
          const dx = p.x - mouse.x;
          const dy = p.y - mouse.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < MOUSE_REPEL_RADIUS && dist > 0) {
            const force = (1 - dist / MOUSE_REPEL_RADIUS) * MOUSE_REPEL_STRENGTH;
            p.vx += (dx / dist) * force;
            p.vy += (dy / dist) * force;
          }
        }

        // Shockwave push
        for (const sw of shockwavesRef.current) {
          const dx = p.x - sw.x;
          const dy = p.y - sw.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          const waveProximity = Math.abs(dist - sw.radius);
          if (waveProximity < 30 && dist > 0) {
            const force = (1 - waveProximity / 30) * sw.life * 4;
            p.vx += (dx / dist) * force;
            p.vy += (dy / dist) * force;
          }
        }

        // Friction (particles slow back down)
        p.vx *= 0.96;
        p.vy *= 0.96;

        // Ember rise tendency (unless burst)
        if (p.decay < 0.005) {
          p.vy -= 0.01; // gentle upward pull
        }

        // Apply velocity
        p.x += p.vx + wobbleX;
        p.y += p.vy;

        // Draw particle with glow
        const alpha = p.opacity * p.life;
        const c = p.color;

        // Glow halo
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * 3, 0, Math.PI * 2);
        const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size * 3);
        grad.addColorStop(0, `rgba(${c.r}, ${c.g}, ${c.b}, ${alpha * 0.4})`);
        grad.addColorStop(1, `rgba(${c.r}, ${c.g}, ${c.b}, 0)`);
        ctx.fillStyle = grad;
        ctx.fill();

        // Core
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${c.r}, ${c.g}, ${c.b}, ${alpha})`;
        ctx.fill();
      }
    }

    if (reducedMotionRef.current) {
      // Static: draw a few particles once, no animation
      ctx.fillStyle = "rgba(255, 251, 242, 1)";
      ctx.fillRect(0, 0, width, height);
      for (let i = 0; i < 30; i++) {
        const x = Math.random() * width;
        const y = Math.random() * height;
        const c = COLORS[Math.floor(Math.random() * COLORS.length)];
        ctx.beginPath();
        ctx.arc(x, y, 1 + Math.random() * 2, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${c.r}, ${c.g}, ${c.b}, 0.2)`;
        ctx.fill();
      }
    } else {
      animate();
    }

    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener("resize", resize);
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseleave", onMouseLeave);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("touchend", onTouchEnd);
    };
  }, [density]);

  return (
    <canvas
      ref={canvasRef}
      className={`particle-field ${className}`}
      data-testid="particle-field"
    />
  );
});

export default ParticleField;
