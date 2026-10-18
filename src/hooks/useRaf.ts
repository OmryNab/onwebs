import { useEffect, useRef } from "react";
import { addFrame } from "../lib/raf";

/** Subscribe to the shared animation loop for the component's lifetime. */
export function useRaf(cb: (time: number, dt: number) => void, enabled = true) {
  const ref = useRef(cb);
  ref.current = cb;
  useEffect(() => {
    if (!enabled) return;
    return addFrame((t, dt) => ref.current(t, dt));
  }, [enabled]);
}
