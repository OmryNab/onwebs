import { useEffect, useLayoutEffect, useRef, useState } from "react";
import BrowserFrame from "./BrowserFrame";
import { projects } from "../data/projects";
import { addFrame, frame } from "../lib/raf";
import { clamp, easeInOutCubic } from "../lib/easing";
import { scramble } from "../lib/scramble";
import { progressOf } from "../hooks/useScrollProgress";

const BAR = 34;
const count = projects.length;
const pad = (n: number) => String(n).padStart(2, "0");

export default function Work() {
  const sectionRef = useRef<HTMLElement>(null);
  const stickyRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const stackRef = useRef<HTMLDivElement>(null);
  const frameRefs = useRef<(HTMLAnchorElement | null)[]>([]);
  const bgRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const barRefs = useRef<(HTMLElement | null)[]>([]);
  const nameRef = useRef<HTMLHeadingElement>(null);
  const catRef = useRef<HTMLParagraphElement>(null);
  const counterRef = useRef<HTMLParagraphElement>(null);
  const btnRef = useRef<HTMLAnchorElement>(null);
  const [size, setSize] = useState({ w: 0, h: 0 });

  useLayoutEffect(() => {
    const measure = () => {
      const avail = stageRef.current!.clientHeight;
      const vw = window.innerWidth;
      let w: number;
      let h: number;
      if (vw < 700) {
        w = Math.min(vw * 0.8, (avail - BAR) * 0.6);
        h = w / 0.6 + BAR;
      } else {
        w = Math.min(vw * 0.8, 1180, (avail - BAR) * 1.6);
        h = w / 1.6 + BAR;
      }
      setSize({ w: Math.max(0, Math.round(w)), h: Math.max(0, Math.round(h)) });
    };
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, []);

  useEffect(() => {
    const section = sectionRef.current!;
    const sticky = stickyRef.current!;
    const stack = stackRef.current!;
    const frames = frameRefs.current as HTMLAnchorElement[];
    const words = bgRefs.current as HTMLSpanElement[];
    const bars = barRefs.current as HTMLElement[];
    nameRef.current!.textContent = projects[0].title;
    catRef.current!.textContent = projects[0].category;

    let active = 0;
    let first = true;
    const reveal = new Float32Array(count);

    const stop = addFrame(() => {
      if (!frame.changed && !first) return;
      first = false;
      const { p, rect } = progressOf(section, sticky);
      if (rect.bottom < -50 || rect.top > frame.vh + 50) return;
      const q = p * count;

      const intro = easeInOutCubic(clamp(q / 0.45));
      stack.style.transform = `scale(${(0.7 + 0.3 * intro).toFixed(4)})`;
      stack.style.opacity = (0.2 + 0.8 * intro).toFixed(3);

      reveal[0] = 1;
      for (let i = 1; i < count; i++) reveal[i] = easeInOutCubic(clamp((q - (i - 0.4)) / 0.5));
      let next = 0;
      for (let i = 0; i < count; i++) if (reveal[i] >= 0.5) next = i;

      frames.forEach((el, i) => {
        const under = i + 1 < count ? reveal[i + 1] : 0;
        el.style.clipPath = i === 0 ? "none" : `inset(${((1 - reveal[i]) * 100).toFixed(2)}% 0 0 0 round 14px)`;
        el.style.transform = `translate3d(0, ${(-3 * under).toFixed(2)}%, 0) scale(${(1 - 0.07 * under).toFixed(4)})`;
        el.style.filter = under > 0.001 ? `brightness(${(1 - 0.6 * under).toFixed(3)})` : "none";
        el.style.pointerEvents = i === next ? "auto" : "none";
      });

      words.forEach((el, i) => {
        const center = i + 0.35;
        const o = clamp(1 - Math.abs(q - center) / 0.75) * intro;
        el.style.opacity = o.toFixed(3);
        el.style.transform = `translate3d(${((center - q) * 22).toFixed(2)}vw, 0, 0)`;
      });

      bars.forEach((el, i) => {
        const span = i === count - 1 ? 1.15 : 1;
        el.style.transform = `scaleX(${clamp((q - (i - 0.15)) / span).toFixed(4)})`;
      });

      if (next !== active) {
        active = next;
        const pr = projects[active];
        scramble(nameRef.current!, pr.title, 800);
        scramble(catRef.current!, pr.category, 800);
        counterRef.current!.textContent = `${pad(active + 1)} / ${pad(count)}`;
        btnRef.current!.href = pr.url;
      }
    });
    return stop;
  }, []);

  return (
    <section id="work" ref={sectionRef} className="work" aria-label="עבודות נבחרות">
      <div ref={stickyRef} className="work-sticky">
        <div className="work-bg" aria-hidden="true">
          {projects.map((p, i) => (
            <span
              key={p.id}
              className="work-bg-word"
              ref={(el) => {
                bgRefs.current[i] = el;
              }}
            >
              {p.en}
            </span>
          ))}
        </div>

        <header className="work-head">
          <p className="mono work-eyebrow">Selected work — 2026</p>
          <h2 className="work-title">עבודות נבחרות</h2>
          <p className="mono work-counter" ref={counterRef} dir="ltr">
            {`01 / ${pad(count)}`}
          </p>
        </header>

        <div className="work-stage" ref={stageRef}>
          <div className="work-stack" ref={stackRef} style={{ width: size.w, height: size.h }}>
            {projects.map((p, i) => (
              <BrowserFrame
                key={p.id}
                project={p}
                index={i}
                ref={(el) => {
                  frameRefs.current[i] = el;
                }}
              />
            ))}
          </div>
        </div>

        <div className="work-info">
          <h3 className="work-name" ref={nameRef} />
          <p className="work-cat" ref={catRef} />
          <a
            ref={btnRef}
            className="btn"
            href={projects[0].url}
            target="_blank"
            rel="noopener noreferrer"
            data-magnet
          >
            לצפייה באתר ↗
          </a>
          <div className="bars" aria-hidden="true">
            {projects.map((p, i) => (
              <span key={p.id}>
                <i
                  ref={(el) => {
                    barRefs.current[i] = el;
                  }}
                />
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
