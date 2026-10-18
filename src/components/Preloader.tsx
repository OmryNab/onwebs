import { useEffect, useRef } from "react";
import { addFrame } from "../lib/raf";
import { scramble } from "../lib/scramble";

const MIN_MS = 1700;
const MAX_MS = 2500;
const WIPE_MS = 1100;

export default function Preloader({ onWipe, onDone }: { onWipe: () => void; onDone: () => void }) {
  const rootRef = useRef<HTMLDivElement>(null);
  const countRef = useRef<HTMLSpanElement>(null);
  const barRef = useRef<HTMLElement>(null);
  const wordRef = useRef<HTMLSpanElement>(null);
  const cbs = useRef({ onWipe, onDone });
  cbs.current = { onWipe, onDone };

  useEffect(() => {
    let fontsReady = false;
    document.fonts?.ready.then(() => {
      fontsReady = true;
    });
    if (!document.fonts) fontsReady = true;

    const start = performance.now();
    let shown = 0;
    let done = false;
    const timers: number[] = [];
    if (wordRef.current) scramble(wordRef.current, "ONWEBS", 1500);

    const stop = addFrame(() => {
      const elapsed = performance.now() - start;
      let target = Math.min(elapsed / MIN_MS, 1);
      if (!fontsReady && elapsed < MAX_MS) target = Math.min(target, 0.92);
      shown += (target - shown) * 0.2;
      if (target === 1 && 1 - shown < 0.005) shown = 1;
      countRef.current!.textContent = String(Math.round(shown * 100)).padStart(3, "0");
      barRef.current!.style.transform = `scaleX(${shown})`;
      if (shown === 1 && !done) {
        done = true;
        stop();
        timers.push(
          window.setTimeout(() => {
            rootRef.current?.classList.add("is-out");
            cbs.current.onWipe();
            timers.push(window.setTimeout(() => cbs.current.onDone(), WIPE_MS + 50));
          }, 180),
        );
      }
    });

    return () => {
      stop();
      timers.forEach(clearTimeout);
    };
  }, []);

  return (
    <div className="loader" ref={rootRef} aria-hidden="true">
      <span className="loader-count" ref={countRef}>
        000
      </span>
      <span className="loader-bar">
        <i ref={barRef} />
      </span>
      <span className="loader-word" ref={wordRef}>
        ONWEBS
      </span>
    </div>
  );
}
