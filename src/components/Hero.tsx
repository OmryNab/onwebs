import { useEffect, useRef } from "react";
import Chapter, { type ChapterData } from "./Chapter";
import { ParticleFilm } from "../lib/particles";
import { addFrame, frame } from "../lib/raf";
import { clamp, easeInOutCubic, range } from "../lib/easing";
import { isTouch } from "../lib/env";
import { scramble } from "../lib/scramble";
import { progressOf } from "../hooks/useScrollProgress";

const CHAPTERS: ChapterData[] = [
  {
    eyebrow: "ONWEBS — סטודיו לעיצוב ובניית אתרים",
    title: [{ text: "אתרים שנראים יקרים." }, { text: "בכוונה.", shiny: true, br: true }],
    titleClass: "display-xl",
    hint: true,
    h1: true,
  },
  {
    eyebrow: "01 — מי אנחנו",
    title: [{ text: "אנחנו לא בונים עוד אתר." }],
    lead: "אנחנו בונים את הרושם הראשון של העסק שלכם — זה שגורם ללקוח לעצור, לגלול, ולהתקשר.",
    titleClass: "display-lg",
  },
  {
    eyebrow: "02 — מה אנחנו עושים",
    title: [{ text: "עיצוב. פיתוח. תנועה." }],
    lead: "כל פיקסל מתוכנן וכל אנימציה מכוונת — מהסקיצה הראשונה ועד שהאתר עולה לאוויר.",
    titleClass: "display-lg",
  },
  {
    eyebrow: "03 — למי",
    title: [{ text: "מסעדות · בתי קפה · משרדים · מותגים" }],
    titleClass: "chapter-mid",
    low: true,
  },
  {
    eyebrow: "04 — העבודות",
    title: [{ text: "מוכנים לראות מה בנינו?" }],
    titleClass: "display-lg",
  },
];

/** [enter, leave] in hero progress; chapter 0 enters by time after the preloader. */
const WINDOWS: [number, number][] = [
  [0, 0.07],
  [0.19, 0.35],
  [0.43, 0.57],
  [0.64, 0.81],
  [0.9, 2],
];
const RAMP = 0.04;
const INTRO_MS = 1600;
const BLUR = isTouch ? 4 : 6;
const RISE = isTouch ? 24 : 40;

type ChapterState = {
  el: HTMLElement;
  words: HTMLElement[];
  fades: HTMLElement[];
  eyebrow: HTMLElement;
  text: string;
  cache: Int16Array;
  fade: number;
  visible: boolean | null;
  armed: boolean;
};

export default function Hero({ introAt }: { introAt: number | null }) {
  const sectionRef = useRef<HTMLElement>(null);
  const stickyRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const chapterRefs = useRef<(HTMLDivElement | null)[]>([]);
  const introRef = useRef(introAt);
  introRef.current = introAt;

  useEffect(() => {
    const section = sectionRef.current!;
    const sticky = stickyRef.current!;
    const film = new ParticleFilm(canvasRef.current!, isTouch);

    const states: ChapterState[] = chapterRefs.current.map((el) => {
      const words = Array.from(el!.querySelectorAll<HTMLElement>(".w"));
      const eyebrow = el!.querySelector<HTMLElement>(".chapter-eyebrow")!;
      return {
        el: el!,
        words,
        fades: Array.from(el!.querySelectorAll<HTMLElement>(".chapter-fade")),
        eyebrow,
        text: eyebrow.dataset.text ?? "",
        cache: new Int16Array(words.length).fill(-999),
        fade: -1,
        visible: null,
        armed: false,
      };
    });

    let ready = false;
    let size = { w: 0, h: 0 };
    const sizeFilm = () => {
      const w = sticky.clientWidth;
      const h = sticky.clientHeight;
      if (isTouch && ready && w === size.w) return;
      size = { w, h };
      film.resize(w, h);
      ready = true;
    };
    let resizeTimer = 0;
    const onResize = () => {
      clearTimeout(resizeTimer);
      resizeTimer = window.setTimeout(sizeFilm, 150);
    };
    const fontLoad = document.fonts ? document.fonts.load("900 100px Heebo") : Promise.resolve();
    fontLoad.catch(() => undefined).then(() => {
      ready = false;
      sizeFilm();
    });
    window.addEventListener("resize", onResize);

    let dimTarget = 1;
    let dim = 1;

    const updateChapters = (p: number, now: number) => {
      let dimLevel = 0;
      const intro = introRef.current;
      states.forEach((c, ci) => {
        let enter: number;
        let exit: number;
        if (ci === 0) {
          enter = intro === null ? 0 : clamp((now - intro) / INTRO_MS);
          exit = range(p, 0.012, WINDOWS[0][1]);
        } else {
          const [a, b] = WINDOWS[ci];
          enter = range(p, a, a + RAMP);
          exit = ci === CHAPTERS.length - 1 ? 0 : range(p, b - RAMP, b);
        }
        const level = enter * (1 - exit);
        if (ci === 1 || ci === 2) dimLevel = Math.max(dimLevel, level);

        const n = c.words.length;
        let any = false;
        for (let i = 0; i < n; i++) {
          const o = n > 1 ? i / (n - 1) : 0;
          const ei = clamp(enter * 1.6 - o * 0.6);
          const xi = clamp(exit * 1.6 - o * 0.6);
          const s = easeInOutCubic(Math.min(ei, 1 - xi));
          const leaving = xi > 0;
          const q = Math.round(s * 100) * (leaving ? -1 : 1);
          if (s > 0) any = true;
          if (c.cache[i] === q) continue;
          c.cache[i] = q;
          const st = c.words[i].style;
          if (s >= 1) {
            st.opacity = "1";
            st.filter = "none";
            st.transform = "none";
          } else {
            const blur = (1 - s) * BLUR;
            st.opacity = s.toFixed(3);
            st.filter = blur > 0.6 ? `blur(${blur.toFixed(1)}px)` : "none";
            st.transform = `translate3d(0, ${((1 - s) * RISE * (leaving ? -1 : 1)).toFixed(1)}px, 0)`;
          }
        }

        const f = Math.round(level * 100);
        if (f !== c.fade) {
          c.fade = f;
          c.fades.forEach((el) => (el.style.opacity = String(f / 100)));
        }
        const visible = any || level > 0;
        if (visible !== c.visible) {
          c.visible = visible;
          c.el.style.visibility = visible ? "visible" : "hidden";
        }
        if (enter > 0.05 && exit < 0.5 && !c.armed) {
          c.armed = true;
          scramble(c.eyebrow, c.text, 900);
        }
        if (level === 0) c.armed = false;
      });
      dimTarget = 1 - 0.45 * dimLevel;
    };

    let p = 0;
    let visible = true;
    let first = true;
    const stop = addFrame((time) => {
      const now = performance.now();
      const intro = introRef.current;
      const introRunning = intro !== null && now - intro < INTRO_MS + 200;
      if (frame.changed || first || introRunning) {
        first = false;
        const res = progressOf(section, sticky);
        p = res.p;
        visible = res.rect.bottom > 0 && res.rect.top < frame.vh;
        updateChapters(p, now);
      }
      dim += (dimTarget - dim) * 0.14;
      if (visible && ready) film.render(time, p, dim);
    });

    return () => {
      stop();
      clearTimeout(resizeTimer);
      window.removeEventListener("resize", onResize);
    };
  }, []);

  return (
    <section id="hero" ref={sectionRef} className="hero" aria-label="ONWEBS">
      <div ref={stickyRef} className="hero-sticky">
        <canvas ref={canvasRef} className="hero-canvas" aria-hidden="true" />
        {CHAPTERS.map((c, i) => (
          <Chapter
            key={i}
            data={c}
            ref={(el) => {
              chapterRefs.current[i] = el;
            }}
          />
        ))}
      </div>
    </section>
  );
}
