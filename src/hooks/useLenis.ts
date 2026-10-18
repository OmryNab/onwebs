import { useEffect } from "react";
import Lenis from "lenis";
import { frame } from "../lib/raf";
import { isTouch, reducedMotion } from "../lib/env";

/** Desktop-only smooth scroll, plus smooth in-page anchor links everywhere. */
export function useLenis(running: boolean) {
  useEffect(() => {
    if (isTouch || reducedMotion) return;
    const lenis = new Lenis({
      duration: 1.05,
      easing: (t) => Math.min(1, 1.001 - 2 ** (-10 * t)),
      smoothWheel: true,
      wheelMultiplier: 0.9,
    });
    frame.lenis = lenis;
    return () => {
      lenis.destroy();
      frame.lenis = null;
    };
  }, []);

  useEffect(() => {
    if (running) frame.lenis?.start();
    else frame.lenis?.stop();
  }, [running]);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      const a = (e.target as Element | null)?.closest<HTMLAnchorElement>('a[href^="#"]');
      if (!a) return;
      const hash = a.getAttribute("href")!;
      const target = hash === "#" || hash === "#hero" ? 0 : document.querySelector<HTMLElement>(hash);
      if (target === null) return;
      e.preventDefault();
      if (frame.lenis) {
        frame.lenis.scrollTo(target, { duration: 1.6 });
      } else {
        const top = typeof target === "number" ? target : target.getBoundingClientRect().top + window.scrollY;
        window.scrollTo({ top, behavior: reducedMotion ? "auto" : "smooth" });
      }
    };
    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, []);
}
