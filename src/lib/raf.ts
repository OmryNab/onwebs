import type Lenis from "lenis";

type FrameCallback = (time: number, dt: number) => void;

const callbacks = new Set<FrameCallback>();

/** Shared per-frame scroll state; read it inside frame callbacks. */
export const frame = {
  y: 0,
  prevY: -1,
  changed: true,
  /** smoothed scroll velocity in px/ms */
  vel: 0,
  dir: 1 as 1 | -1,
  vw: 0,
  vh: 0,
  lenis: null as Lenis | null,
};

let started = false;
let last = 0;

function tick(time: number) {
  const dt = last ? Math.min(time - last, 64) : 16.7;
  last = time;

  frame.lenis?.raf(time);

  const y = window.scrollY;
  const prev = frame.prevY < 0 ? y : frame.prevY;
  frame.changed = frame.prevY < 0 || y !== frame.prevY;
  const v = (y - prev) / dt;
  frame.vel += (v - frame.vel) * 0.2;
  if (Math.abs(v) > 0.02) frame.dir = v > 0 ? 1 : -1;
  frame.prevY = y;
  frame.y = y;
  frame.vw = window.innerWidth;
  frame.vh = window.innerHeight;

  callbacks.forEach((cb) => cb(time, dt));
  requestAnimationFrame(tick);
}

export function addFrame(cb: FrameCallback) {
  callbacks.add(cb);
  if (!started) {
    started = true;
    window.addEventListener("resize", () => {
      frame.prevY = -1;
    });
    requestAnimationFrame(tick);
  }
  return () => {
    callbacks.delete(cb);
  };
}
