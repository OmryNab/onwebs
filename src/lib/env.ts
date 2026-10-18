const mq = (q: string) => typeof window !== "undefined" && window.matchMedia(q).matches;

export const isTouch = mq("(hover: none), (pointer: coarse)");

export const reducedMotion = mq("(prefers-reduced-motion: reduce)");

export const isMobileWidth = () => window.innerWidth < 700;
