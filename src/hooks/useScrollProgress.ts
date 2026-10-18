import { useCallback, type RefObject } from "react";
import { clamp } from "../lib/easing";
import { frame } from "../lib/raf";

type Pin = { top: number; height: number; total: number };
const pins = new WeakMap<HTMLElement, { gen: number; pin: Pin }>();

/**
 * Progress through a pinned section: 0 when its top hits the viewport top,
 * 1 when the sticky stage is about to unpin. Geometry is measured once per
 * resize, then progress comes from the smoothed scroll position.
 */
export function progressOf(section: HTMLElement, sticky: HTMLElement) {
  let entry = pins.get(section);
  if (!entry || entry.gen !== frame.resizeGen) {
    const rect = section.getBoundingClientRect();
    const height = rect.height;
    entry = {
      gen: frame.resizeGen,
      pin: {
        top: rect.top + frame.y,
        height,
        total: Math.max(1, height - sticky.clientHeight),
      },
    };
    pins.set(section, entry);
  }
  const top = entry.pin.top - frame.y;
  return {
    p: clamp(-top / entry.pin.total),
    rect: { top, bottom: top + entry.pin.height },
  };
}

export function useScrollProgress(section: RefObject<HTMLElement>, sticky: RefObject<HTMLElement>) {
  return useCallback(() => progressOf(section.current!, sticky.current!), [section, sticky]);
}
