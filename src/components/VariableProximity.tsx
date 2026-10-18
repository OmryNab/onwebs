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
    const shown = letters.map(() => -1);
    const centers = letters.map(() => ({ x: 0, y: 0 }));
    let mx = -1e5;
    let my = -1e5;
    let visible = false;
    let measuredGen = -1;
    let measuredY = 0;
    let acc = 0;

    const measure = () => {
      letters.forEach((el, i) => {
        const r = el.getBoundingClientRect();
        centers[i].x = r.left + r.width / 2;
        centers[i].y = r.top + r.height / 2;
      });
      measuredY = frame.y;
      measuredGen = frame.resizeGen;
    };

    const io = new IntersectionObserver(([e]) => {
      visible = e.isIntersecting;
      if (visible) measuredGen = -1;
    });
    io.observe(root);
    const onMove = (e: PointerEvent) => {
      mx = e.clientX;
      my = e.clientY;
    };
    if (!isTouch) window.addEventListener("pointermove", onMove, { passive: true });

    const set = (i: number, w: number) => {
      weights[i] = w;
      const q = Math.round(w / 25) * 25;
      if (q === shown[i]) return;
      shown[i] = q;
      letters[i].style.fontWeight = String(q);
    };

    const stop = addFrame((time, dt) => {
      if (!visible) return;
      acc += dt;
      if (acc < 32) return;
      acc = 0;
      if (isTouch) {
        letters.forEach((_, i) => set(i, 525 + 375 * Math.sin(time * 0.0012 - i * 0.8)));
        return;
      }
      if (measuredGen !== frame.resizeGen) measure();
      const dy = measuredY - frame.y;
      const radius = frame.vw * 0.28;
      letters.forEach((_, i) => {
        const t = clamp(1 - Math.hypot(mx - centers[i].x, my - (centers[i].y + dy)) / radius);
        const target = MIN_W + (MAX_W - MIN_W) * t;
        set(i, weights[i] + (target - weights[i]) * 0.22);
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
