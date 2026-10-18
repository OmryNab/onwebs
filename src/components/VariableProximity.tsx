import { useEffect, useRef } from "react";
import { addFrame, frame } from "../lib/raf";
import { clamp } from "../lib/easing";
import { isTouch, reducedMotion } from "../lib/env";

const MIN_W = 150;
const MAX_W = 900;
const BASE_W = 200;

/** Each letter's variable weight follows cursor distance; a slow wave on touch. */
export default function VariableProximity({ text, className = "" }: { text: string; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (reducedMotion) return;
    const root = ref.current!;
    const letters = Array.from(root.querySelectorAll<HTMLSpanElement>("span"));
    const weights = letters.map(() => BASE_W);
    const centers = letters.map(() => ({ x: 0, y: 0 }));
    let mx = -1e5;
    let my = -1e5;
    let visible = false;
    let stale = true;

    const io = new IntersectionObserver(([e]) => {
      visible = e.isIntersecting;
      stale = true;
    });
    io.observe(root);
    const onMove = (e: PointerEvent) => {
      mx = e.clientX;
      my = e.clientY;
      stale = true;
    };
    if (!isTouch) window.addEventListener("pointermove", onMove, { passive: true });

    const set = (i: number, w: number) => {
      if (Math.abs(w - weights[i]) < 0.5) return;
      weights[i] = w;
      letters[i].style.fontWeight = String(Math.round(w));
    };

    const stop = addFrame((time) => {
      if (!visible) return;
      if (isTouch) {
        letters.forEach((_, i) => set(i, 525 + 375 * Math.sin(time * 0.0012 - i * 0.8)));
        return;
      }
      if (stale || frame.changed) {
        letters.forEach((el, i) => {
          const r = el.getBoundingClientRect();
          centers[i].x = r.left + r.width / 2;
          centers[i].y = r.top + r.height / 2;
        });
        stale = false;
      }
      const radius = frame.vw * 0.28;
      letters.forEach((_, i) => {
        const t = clamp(1 - Math.hypot(mx - centers[i].x, my - centers[i].y) / radius);
        const target = MIN_W + (MAX_W - MIN_W) * t;
        set(i, weights[i] + (target - weights[i]) * 0.15);
      });
    });

    return () => {
      stop();
      io.disconnect();
      window.removeEventListener("pointermove", onMove);
    };
  }, []);

  return (
    <div ref={ref} className={`vp ${className}`} aria-label={text} dir="ltr">
      {Array.from(text).map((c, i) => (
        <span key={i} aria-hidden="true">
          {c}
        </span>
      ))}
    </div>
  );
}
