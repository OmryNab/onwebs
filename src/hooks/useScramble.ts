import { useEffect, useRef, type MouseEvent } from "react";
import { scramble, SCRAMBLE_POOL } from "../lib/scramble";
import { useInView } from "./useInView";

type Options = { trigger?: "view" | "mount"; duration?: number; pool?: string };

export function useScramble<T extends HTMLElement>(
  text: string,
  { trigger = "view", duration = 900, pool = SCRAMBLE_POOL }: Options = {},
) {
  const ref = useRef<T>(null);
  const inView = useInView(ref);
  useEffect(() => {
    if (trigger === "view" && !inView) return;
    if (ref.current) scramble(ref.current, text, duration, pool);
  }, [text, inView, trigger, duration, pool]);
  return ref;
}

/** Scramble an element's own text when hovered. */
export function scrambleOnHover(duration = 650, pool = SCRAMBLE_POOL) {
  return (e: MouseEvent<HTMLElement>) => {
    const el = e.currentTarget;
    const text = el.dataset.text ?? el.textContent ?? "";
    el.dataset.text = text;
    scramble(el, text, duration, pool);
  };
}
