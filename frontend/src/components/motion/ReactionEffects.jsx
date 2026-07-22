import confetti from "canvas-confetti";

/**
 * ReactionEffects — particle bursts, confetti, and screen shake for key moments.
 * 
 * Provides utility functions for consistent reaction animations across the app.
 */

/**
 * Trigger gold/burgundy confetti burst from element center
 */
export function confettiBurst(element, options = {}) {
  if (!element) return;
  
  const rect = element.getBoundingClientRect();
  const x = (rect.left + rect.width / 2) / window.innerWidth;
  const y = (rect.top + rect.height / 2) / window.innerHeight;

  confetti({
    particleCount: options.particleCount || 80,
    spread: options.spread || 70,
    origin: { x, y },
    colors: options.colors || ["#C49A3A", "#E0C06A", "#9A1F3D", "#1F6B4E"],
    ...options,
  });
}

/**
 * Trigger subtle screen shake effect
 */
export function screenShake(intensity = 6, duration = 400) {
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduced) return;

  const body = document.body;
  let startTime = Date.now();
  
  const shake = () => {
    const elapsed = Date.now() - startTime;
    if (elapsed > duration) {
      body.style.transform = "";
      return;
    }

    const progress = elapsed / duration;
    const currentIntensity = intensity * (1 - progress);
    const x = (Math.random() - 0.5) * currentIntensity;
    const y = (Math.random() - 0.5) * currentIntensity;
    
    body.style.transform = `translate(${x}px, ${y}px)`;
    requestAnimationFrame(shake);
  };

  requestAnimationFrame(shake);
}

/**
 * Trigger particle burst via custom event (for BackdropProvider)
 */
export function particleBurst(x, y) {
  const event = new CustomEvent('particle-burst', { detail: { x, y } });
  window.dispatchEvent(event);
}

/**
 * Combined celebration: confetti + screen shake + particles
 */
export function celebrate(element) {
  confettiBurst(element, { particleCount: 120, spread: 90 });
  screenShake(8, 500);
  if (element) {
    const rect = element.getBoundingClientRect();
    particleBurst(rect.left + rect.width / 2, rect.top + rect.height / 2);
  }
}
