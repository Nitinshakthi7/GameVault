// Small anime.js (v4) helpers. All of them no-op under prefers-reduced-motion.
import { useLayoutEffect } from 'react';
import { animate, stagger } from 'animejs';
import { prefersReducedMotion } from '../lib/motion.js';

/**
 * Staggered entrance for every `[data-stagger]` element inside `containerRef`.
 * Re-runs whenever `trigger` changes (e.g. the data array or page number).
 */
export function useStaggerIn(containerRef, trigger, { distance = 18, step = 45, max = 24 } = {}) {
  useLayoutEffect(() => {
    const root = containerRef.current;
    if (!root || prefersReducedMotion()) return undefined;
    const els = Array.from(root.querySelectorAll('[data-stagger]')).slice(0, max);
    if (!els.length) return undefined;
    els.forEach((el) => {
      el.style.opacity = '0';
    });
    const anim = animate(els, {
      opacity: [0, 1],
      translateY: [distance, 0],
      duration: 520,
      delay: stagger(step),
      ease: 'outCubic',
      onComplete: () => els.forEach((el) => {
        el.style.opacity = '';
        el.style.transform = '';
      }),
    });
    return () => {
      anim.revert();
      els.forEach((el) => {
        el.style.opacity = '';
      });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trigger]);
}

/**
 * Animates the width of every `[data-bar]` inside the container to its `data-pct` value
 * (0-100) with a stagger. Elements render at their final width when motion is reduced.
 */
export function useBarFill(containerRef, trigger) {
  useLayoutEffect(() => {
    const root = containerRef.current;
    if (!root || prefersReducedMotion()) return undefined;
    const bars = Array.from(root.querySelectorAll('[data-bar]'));
    if (!bars.length) return undefined;
    const anims = bars.map((bar, i) => {
      const pct = Math.max(0, Math.min(100, Number(bar.dataset.pct) || 0));
      return animate(bar, {
        width: ['0%', `${pct}%`],
        duration: 900,
        delay: 120 + i * 70,
        ease: 'outExpo',
      });
    });
    return () => anims.forEach((a) => a.revert());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trigger]);
}

/** One-shot attention pulse for an element (e.g. status badge when it changes). */
export function pulse(el) {
  if (!el || prefersReducedMotion()) return;
  animate(el, {
    scale: [1, 1.18, 1],
    duration: 520,
    ease: 'outElastic(1, .6)',
  });
}

/** Count a number up from 0, calling `onTick(value)` each frame. Returns a cancel function. */
export function countUp(to, onTick, { duration = 900 } = {}) {
  if (prefersReducedMotion() || !Number.isFinite(to) || to === 0) {
    onTick(to);
    return () => {};
  }
  const state = { v: 0 };
  const anim = animate(state, {
    v: to,
    duration,
    ease: 'outExpo',
    onUpdate: () => onTick(state.v),
    onComplete: () => onTick(to),
  });
  return () => anim.revert();
}

/** Animate an SVG circle's stroke-dashoffset to the given fraction (0..1). */
export function fillRing(circle, circumference, fraction) {
  const target = circumference * (1 - Math.max(0, Math.min(1, fraction)));
  if (!circle) return () => {};
  if (prefersReducedMotion()) {
    circle.style.strokeDashoffset = String(target);
    return () => {};
  }
  const anim = animate(circle, {
    strokeDashoffset: [circumference, target],
    duration: 900,
    ease: 'outCubic',
  });
  return () => anim.revert();
}
