import { addFrame } from "./raf";
import { reducedMotion } from "./env";

export const SCRAMBLE_POOL = "אבגדהוזחטיכלמנסעפצקרשת#%&*+=<>/01";
export const DIGIT_POOL = "0123456789";

const running = new WeakMap<HTMLElement, () => void>();

/** Decrypt effect: characters resolve in logical order, spaces stay put. */
export function scramble(el: HTMLElement, text: string, duration = 900, pool = SCRAMBLE_POOL) {
  running.get(el)?.();
  if (reducedMotion) {
    el.textContent = text;
    return;
  }

  const chars = Array.from(text);
  const n = chars.length;
  const start = performance.now();
  let lastSwap = 0;

  const stop = addFrame(() => {
    const now = performance.now();
    const e = (now - start) / duration;
    if (e >= 1) {
      el.textContent = text;
      cancel();
      return;
    }
    if (now - lastSwap < 45) return;
    lastSwap = now;
    let out = "";
    for (let i = 0; i < n; i++) {
      const c = chars[i];
      if (c === " " || c === "\n") {
        out += c;
        continue;
      }
      const resolveAt = 0.12 + (i / n) * 0.82;
      out += e >= resolveAt ? c : pool[(Math.random() * pool.length) | 0];
    }
    el.textContent = out;
  });

  const cancel = () => {
    stop();
    running.delete(el);
  };
  running.set(el, cancel);
}
