import { useEffect, useRef } from "react";
import { addFrame } from "../lib/raf";
import { isTouch } from "../lib/env";

export default function Cursor() {
  const ringRef = useRef<HTMLDivElement>(null);
  const dotRef = useRef<HTMLDivElement>(null);
  const labelRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (isTouch) return;
    const ring = ringRef.current!;
    const dot = dotRef.current!;
    const label = labelRef.current!;
    let mx = -100;
    let my = -100;
    let rx = -100;
    let ry = -100;
    let target: Element | null = null;

    const onMove = (e: PointerEvent) => {
      mx = e.clientX;
      my = e.clientY;
      dot.style.transform = `translate3d(${mx}px, ${my}px, 0)`;
      ring.classList.add("is-on");
      dot.classList.add("is-on");
    };

    const onOver = (e: PointerEvent) => {
      const el = (e.target as Element | null)?.closest("[data-cursor]") ?? null;
      if (el === target) return;
      target = el;
      if (el) {
        label.textContent = el.getAttribute("data-cursor");
        ring.classList.add("is-big");
      } else {
        ring.classList.remove("is-big");
      }
    };

    const onLeave = () => {
      ring.classList.remove("is-on");
      dot.classList.remove("is-on");
    };

    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("pointerover", onOver, { passive: true });
    document.documentElement.addEventListener("pointerleave", onLeave);
    const stop = addFrame(() => {
      const dx = mx - rx;
      const dy = my - ry;
      if (dx * dx + dy * dy < 0.04) return;
      rx += dx * 0.22;
      ry += dy * 0.22;
      ring.style.transform = `translate3d(${rx.toFixed(1)}px, ${ry.toFixed(1)}px, 0)`;
    });

    return () => {
      stop();
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerover", onOver);
      document.documentElement.removeEventListener("pointerleave", onLeave);
    };
  }, []);

  if (isTouch) return null;
  return (
    <>
      <div className="cursor-ring" ref={ringRef} aria-hidden="true">
        <span className="cursor-label" ref={labelRef} />
      </div>
      <div className="cursor-dot" ref={dotRef} aria-hidden="true" />
    </>
  );
}
