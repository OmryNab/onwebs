import { useEffect } from "react";
import { isTouch, reducedMotion } from "../lib/env";

const offset = new WeakMap<HTMLElement, { x: number; y: number }>();

/** Delegated magnetic effect for every element marked with data-magnet. */
export function useMagnet() {
  useEffect(() => {
    if (isTouch || reducedMotion) return;
    let active: HTMLElement | null = null;

    const release = (el: HTMLElement) => {
      el.style.transition = "transform .8s cubic-bezier(.2,1.6,.4,1)";
      el.style.transform = "";
      offset.delete(el);
    };

    const onMove = (e: PointerEvent) => {
      const el = (e.target as Element | null)?.closest<HTMLElement>("[data-magnet]") ?? null;
      if (active && active !== el) release(active);
      active = el;
      if (!el) return;
      const r = el.getBoundingClientRect();
      const o = offset.get(el) ?? { x: 0, y: 0 };
      const cx = r.left + r.width / 2 - o.x;
      const cy = r.top + r.height / 2 - o.y;
      const x = (e.clientX - cx) * 0.3;
      const y = (e.clientY - cy) * 0.4;
      offset.set(el, { x, y });
      el.style.transition = "transform .25s ease-out";
      el.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0)`;
    };

    const onLeaveWindow = () => {
      if (active) release(active);
      active = null;
    };

    window.addEventListener("pointermove", onMove, { passive: true });
    document.documentElement.addEventListener("pointerleave", onLeaveWindow);
    return () => {
      window.removeEventListener("pointermove", onMove);
      document.documentElement.removeEventListener("pointerleave", onLeaveWindow);
    };
  }, []);
}
