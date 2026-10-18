import { useCallback, type RefObject } from "react";
import { clamp } from "../lib/easing";

/**
 * Progress through a pinned section: 0 when its top hits the viewport top,
 * 1 when the sticky stage is about to unpin. Uses the sticky element's height
 * (not innerHeight) so the mobile URL bar doesn't skew it.
 */
export function progressOf(section: HTMLElement, sticky: HTMLElement) {
  const rect = section.getBoundingClientRect();
  const total = Math.max(1, section.offsetHeight - sticky.clientHeight);
  return { p: clamp(-rect.top / total), rect };
}

export function useScrollProgress(section: RefObject<HTMLElement>, sticky: RefObject<HTMLElement>) {
  return useCallback(() => progressOf(section.current!, sticky.current!), [section, sticky]);
}
