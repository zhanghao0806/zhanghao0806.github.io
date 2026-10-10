import '../styles/reading-effects.css';

type Mode = 'quantum' | 'gravity' | 'patronum';
const labels: Record<Mode, string> = { quantum: '量子叠加', gravity: '重力失效', patronum: '呼神护卫' };
let lightOverlay: HTMLElement | undefined;
type Particle = { element: HTMLElement; phase: number; toc: boolean; x: number; y: number };
let mode: Mode | null = null;
let particles: Particle[] = [];
let visible = new Set<HTMLElement>();
let observer: IntersectionObserver | undefined;
let events: AbortController | undefined;
let frame = 0;
let cleanupTimer = 0;
let pointer = { x: -10000, y: -10000 };
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
const article = document.querySelector<HTMLElement>('.article-page');
const originalText = new Map<Text, string>();

function meowify() {
  if (!article) return;
  const excluded = 'pre, code, .katex, math, svg, script, style, button, textarea, input, select, [contenteditable], [aria-hidden="true"]';
  for (const scope of article.querySelectorAll('.article-header h1, .article-prose')) {
    const walker = document.createTreeWalker(scope, NodeFilter.SHOW_TEXT, {
      acceptNode(node) {
        return node.parentElement?.closest(excluded)
          ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT;
      },
    });
    let node: Node | null;
    while ((node = walker.nextNode())) {
      const text = node as Text;
      const replacement = text.data.replace(/[\p{L}\p{N}]/gu, '喵');
      if (replacement !== text.data) originalText.set(text, text.data);
    }
  }
  // Change text nodes only: preserve links, heading IDs and formula markup.
  originalText.forEach((value, node) => { node.data = value.replace(/[\p{L}\p{N}]/gu, '喵'); });
}

function restoreText() {
  originalText.forEach((value, node) => { node.data = value; });
  originalText.clear();
}

function clearElements() {
  particles.forEach(({ element }) => {
    element.classList.remove('reading-particle', 'reading-particle--return');
    element.style.removeProperty('--reading-x');
    element.style.removeProperty('--reading-y');
  });
  particles = [];
  visible.clear();
}

export function stopEffect() {
  const previous = mode;
  mode = null;
  cancelAnimationFrame(frame);
  frame = 0;
  observer?.disconnect();
  events?.abort();
  restoreText();
  lightOverlay?.remove();
  lightOverlay = undefined;
  document.documentElement.removeAttribute('data-reading-mode');
  document.querySelector('[data-cat-companion]')?.removeAttribute('data-reading-active');
  document.querySelectorAll<HTMLButtonElement>('[data-reading-effect]').forEach((button) => {
    button.setAttribute('aria-pressed', 'false');
    button.setAttribute('aria-label', `开启${labels[button.dataset.readingEffect as Mode]}`);
  });
  clearTimeout(cleanupTimer);
  if (previous === 'gravity' && !reducedMotion.matches) {
    particles.forEach(({ element }) => {
      element.classList.add('reading-particle--return');
      element.style.setProperty('--reading-x', '0px');
      element.style.setProperty('--reading-y', '0px');
    });
    cleanupTimer = window.setTimeout(clearElements, 450);
  } else clearElements();
}

export function toggleEffect(next: Mode, origin?: { x: number; y: number }) {
  const previous = mode;
  stopEffect();
  if (previous === next || !article) return;
  clearTimeout(cleanupTimer);
  clearElements();
  mode = next;
  pointer = { x: -10000, y: -10000 };
  document.documentElement.dataset.readingMode = mode;
  document.querySelector('[data-cat-companion]')?.setAttribute('data-reading-active', mode);
  const button = document.querySelector<HTMLButtonElement>(`[data-reading-effect="${mode}"]`);
  button?.setAttribute('aria-pressed', 'true');
  button?.setAttribute('aria-label', mode === 'quantum' ? '坍缩回原位' : mode === 'gravity' ? '恢复重力' : '结束呼神护卫');

  if (mode === 'patronum') {
    startPatronum(origin);
    return;
  }

  if (mode === 'quantum') meowify();

  // Select non-nested blocks: formulas, code and lists retain their own layout.
  const blocks = Array.from(article.querySelectorAll<HTMLElement>('.article-header > *, .article-prose > :not(hr):not(style):not(script)'));
  if (mode === 'gravity') blocks.push(...document.querySelectorAll<HTMLElement>('.article-toc__item'));
  particles = blocks.map((element, index) => ({ element, phase: index * 2.399, toc: element.classList.contains('article-toc__item'), x: 0, y: 0 }));
  particles.forEach(({ element }) => element.classList.add('reading-particle'));
  observer = new IntersectionObserver((entries) => {
    entries.forEach(({ target, isIntersecting }) => {
      if (isIntersecting) visible.add(target as HTMLElement);
      else visible.delete(target as HTMLElement);
    });
  });
  particles.forEach(({ element }) => observer!.observe(element));
  events = new AbortController();
  const signal = events.signal;
  if (mode === 'gravity') {
    window.addEventListener('pointermove', (event) => {
      if (event.pointerType !== 'touch') pointer = { x: event.clientX, y: event.clientY };
    }, { passive: true, signal });
    document.addEventListener('pointerleave', () => { pointer = { x: -10000, y: -10000 }; }, { signal });
    window.addEventListener('blur', () => { pointer = { x: -10000, y: -10000 }; }, { signal });
  }
  const restart = () => {
    cancelAnimationFrame(frame);
    frame = 0;
    if (!document.hidden && !reducedMotion.matches) frame = requestAnimationFrame(tick);
    else if (reducedMotion.matches) particles.forEach(({ element }) => {
      element.style.setProperty('--reading-x', '0px');
      element.style.setProperty('--reading-y', mode === 'gravity' ? '-3px' : '0px');
    });
  };
  document.addEventListener('visibilitychange', restart, { signal });
  reducedMotion.addEventListener('change', restart, { signal });
  window.addEventListener('pagehide', stopEffect, { signal });
  restart();
}

function tick(now: number) {
  if (!mode) return;
  const active = particles.filter(({ element }) => visible.has(element));
  // Read geometry before any writes; only the nearest three blocks are pushed.
  const nearby = mode === 'gravity' && pointer.x > -1000
    ? active.map((particle) => {
      const rect = particle.element.getBoundingClientRect();
      // Remove our translation so repulsion doesn't chase its own moving target.
      const left = rect.left - particle.x, top = rect.top - particle.y;
      const dx = pointer.x - Math.max(left, Math.min(pointer.x, left + rect.width));
      const dy = pointer.y - Math.max(top, Math.min(pointer.y, top + rect.height));
      return { particle, distance: Math.hypot(dx, dy), cx: left + rect.width / 2, cy: top + rect.height / 2 };
    }).filter(({ distance }) => distance < 100).sort((a, b) => a.distance - b.distance).slice(0, 3)
    : [];
  const time = now / 1000;
  active.forEach((particle) => {
    const { element, phase, toc } = particle;
    const quantum = mode === 'quantum';
    const amplitude = quantum ? 3 : toc ? 2.5 : 12;
    let x = Math.sin(time * 0.72 + phase) * amplitude;
    let y = quantum ? Math.cos(time * 0.9 + phase) * 2.2 : -amplitude + Math.cos(time * 0.85 + phase) * amplitude;
    const hit = nearby.find(({ particle: candidate }) => candidate === particle);
    if (hit) {
      const dx = hit.cx - pointer.x, dy = hit.cy - pointer.y;
      const length = Math.hypot(dx, dy) || 1;
      const force = (1 - hit.distance / 100) * (toc ? 1.5 : 12);
      x += dx / length * force;
      y += (dy || -1) / length * force;
    }
    particle.x += (x - particle.x) * 0.055;
    particle.y += (y - particle.y) * 0.055;
    element.style.setProperty('--reading-x', `${particle.x.toFixed(2)}px`);
    element.style.setProperty('--reading-y', `${particle.y.toFixed(2)}px`);
  });
  frame = requestAnimationFrame(tick);
}

// A single non-interactive veil reveals the original page, including its links.
// Frames run only while the light is catching up with the pointer.
function startPatronum(origin?: { x: number; y: number }) {
  const veil = document.createElement('div');
  veil.className = 'reading-patronum';
  veil.setAttribute('aria-hidden', 'true');
  lightOverlay = veil;
  let target = origin ?? { x: innerWidth / 2, y: innerHeight / 2 };
  let light = { ...target };
  const paint = () => {
    veil.style.setProperty('--light-x', `${light.x.toFixed(1)}px`);
    veil.style.setProperty('--light-y', `${light.y.toFixed(1)}px`);
  };
  paint();
  document.body.append(veil);
  events = new AbortController();
  const signal = events.signal;
  const follow = () => {
    frame = 0;
    if (document.hidden || mode !== 'patronum') return;
    const distance = Math.hypot(target.x - light.x, target.y - light.y);
    if (reducedMotion.matches || distance < 0.5) light = { ...target };
    else {
      light.x += (target.x - light.x) * 0.24;
      light.y += (target.y - light.y) * 0.24;
    }
    paint();
    if (!reducedMotion.matches && distance >= 0.5) frame = requestAnimationFrame(follow);
  };
  const schedule = () => {
    if (!frame && !document.hidden) frame = requestAnimationFrame(follow);
  };
  const move = (event: PointerEvent) => {
    target = { x: event.clientX, y: event.clientY };
    schedule();
  };
  window.addEventListener('pointermove', move, { passive: true, signal });
  window.addEventListener('pointerdown', move, { passive: true, signal });
  // Touch scrolling may cancel pointer events; keep the light on the finger.
  window.addEventListener('touchmove', (event) => {
    const touch = event.touches[0];
    if (touch) { target = { x: touch.clientX, y: touch.clientY }; schedule(); }
  }, { passive: true, signal });
  window.addEventListener('resize', () => {
    target = { x: Math.min(target.x, innerWidth), y: Math.min(target.y, innerHeight) };
    schedule();
  }, { signal });
  document.addEventListener('visibilitychange', () => {
    cancelAnimationFrame(frame);
    frame = 0;
    if (!document.hidden) schedule();
  }, { signal });
  reducedMotion.addEventListener('change', schedule, { signal });
  window.addEventListener('pagehide', stopEffect, { signal });
}
