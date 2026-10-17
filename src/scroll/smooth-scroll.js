import Lenis from 'lenis';

export const ENABLE_SMOOTH_SCROLL = true;

let lenisInstance = null;
let rafId = null;
let mediaQueryList = null;
let isScrollLocked = false;

function onRaf(time) {
  if (lenisInstance) {
    lenisInstance.raf(time);
    rafId = requestAnimationFrame(onRaf);
  }
}

function handleReducedMotionChange(e) {
  if (e.matches) {
    stopSmoothScroll();
  } else {
    startSmoothScroll();
  }
}

export function getLenis() {
  return lenisInstance;
}

export function startSmoothScroll() {
  if (!ENABLE_SMOOTH_SCROLL) return;
  if (typeof window === 'undefined') return;

  if (!mediaQueryList) {
    mediaQueryList = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (mediaQueryList.addEventListener) {
      mediaQueryList.addEventListener('change', handleReducedMotionChange);
    } else if (mediaQueryList.addListener) {
      mediaQueryList.addListener(handleReducedMotionChange);
    }
  }

  if (mediaQueryList.matches) {
    return;
  }

  // Guard against double-start
  if (lenisInstance) return;

  lenisInstance = new Lenis({
    duration: 1.2,
    easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    smoothWheel: true,
    syncTouch: false,
    wheelMultiplier: 0.9,
    anchors: false // Anchors handled manually via scrollToTarget
  });

  if (isScrollLocked) {
    lenisInstance.stop();
  }

  rafId = requestAnimationFrame(onRaf);
}

export function stopSmoothScroll() {
  if (rafId) {
    cancelAnimationFrame(rafId);
    rafId = null;
  }

  if (lenisInstance) {
    lenisInstance.destroy();
    lenisInstance = null;
  }

  // Remove Lenis classes from <html>
  if (typeof document !== 'undefined' && document.documentElement) {
    document.documentElement.classList.remove(
      'lenis',
      'lenis-smooth',
      'lenis-scrolling',
      'lenis-stopped'
    );
  }
}

export function scrollToTarget(target) {
  if (!target) return;
  let element = target;
  if (typeof target === 'string') {
    if (target === '#' || target === '') return;
    try {
      element = document.querySelector(target);
    } catch (_) {
      return;
    }
  }

  if (!element || !(element instanceof Element)) return;

  if (lenisInstance) {
    lenisInstance.scrollTo(element, { offset: -80, duration: 1.4 });
  } else {
    element.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}

export function lockScroll() {
  isScrollLocked = true;
  document.body.style.overflow = 'hidden';
  if (lenisInstance) {
    lenisInstance.stop();
  }
}

export function unlockScroll() {
  isScrollLocked = false;
  document.body.style.overflow = '';
  if (lenisInstance) {
    lenisInstance.start();
  }
}
