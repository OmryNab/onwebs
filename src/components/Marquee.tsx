import { useEffect, useRef } from "react";
import { addFrame, frame } from "../lib/raf";
import { clamp } from "../lib/easing";
import { reducedMotion } from "../lib/env";

const ROWS = [
  { text: "CREATE ✦ DESIGN ✦ DEVELOP ✦", outline: false, sign: 1, dir: "ltr" as const },
  { text: "מעצבים ✦ מפתחים ✦ מניעים ✦", outline: true, sign: -1, dir: "rtl" as const },
];
const REPEAT = 4;
const BASE_SPEED = 0.05;

export default function Marquee() {
  const sectionRef = useRef<HTMLElement>(null);
  const trackRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    if (reducedMotion) return;
    const tracks = trackRefs.current as HTMLDivElement[];
    const widths = tracks.map(() => 0);
    const offsets = tracks.map(() => 0);
    let skew = 0;
    let visible = false;

    const measure = () =>
      tracks.forEach((t, i) => {
        widths[i] = (t.firstElementChild as HTMLElement).offsetWidth;
      });
    measure();
    document.fonts?.ready.then(measure);
    window.addEventListener("resize", measure);

    const io = new IntersectionObserver(([e]) => (visible = e.isIntersecting), { rootMargin: "120px" });
    io.observe(sectionRef.current!);

    const stop = addFrame((_, dt) => {
      if (!visible) return;
      const v = frame.vel;
      const speed = BASE_SPEED + Math.min(Math.abs(v), 2.4) * 0.22;
      skew += (clamp(v * 1.4, -4.5, 4.5) - skew) * 0.08;
      tracks.forEach((t, i) => {
        const w = widths[i];
        if (!w) return;
        offsets[i] += speed * dt * ROWS[i].sign * frame.dir;
        offsets[i] = ((offsets[i] % w) + w) % w;
        t.style.transform = `translate3d(${-offsets[i]}px, 0, 0) skewX(${(-skew).toFixed(2)}deg)`;
      });
    });

    return () => {
      stop();
      io.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, []);

  return (
    <section ref={sectionRef} className="marquee" aria-label="CREATE · DESIGN · DEVELOP">
      {ROWS.map((row, i) => (
        <div key={i} className={`mq-row ${row.outline ? "mq-row--outline" : ""}`} dir="ltr" aria-hidden="true">
          <div
            className="mq-track"
            ref={(el) => {
              trackRefs.current[i] = el;
            }}
          >
            {[0, 1].map((g) => (
              <div key={g} className="mq-group" dir={row.dir}>
                {Array.from({ length: REPEAT }, (_, k) => (
                  <span key={k} className="mq-item">
                    {row.text}
                  </span>
                ))}
              </div>
            ))}
          </div>
        </div>
      ))}
    </section>
  );
}
