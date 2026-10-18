import { useEffect, useRef } from "react";
import StepForm from "./StepForm";
import { BlurWords, RiseChars, ScrambleText } from "./TextEffects";
import { addFrame, frame } from "../lib/raf";
import { clamp, easeOutCubic } from "../lib/easing";
import { DIGIT_POOL } from "../lib/scramble";
import { scrambleOnHover } from "../hooks/useScramble";

export default function Contact() {
  const wrapRef = useRef<HTMLElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const wrap = wrapRef.current!;
    const card = cardRef.current!;
    let first = true;
    return addFrame(() => {
      if (!frame.changed && !first) return;
      first = false;
      const r = wrap.getBoundingClientRect();
      if (r.top > frame.vh * 1.2 || r.bottom < 0) return;
      const e = easeOutCubic(clamp((frame.vh - r.top) / (frame.vh * 0.85)));
      if (e >= 1) {
        card.style.transform = "none";
        card.style.borderRadius = "0";
        return;
      }
      const radius = (48 * (1 - e)).toFixed(1);
      card.style.transform = `scale(${(0.9 + 0.1 * e).toFixed(4)})`;
      card.style.borderRadius = `${radius}px ${radius}px 0 0`;
    });
  }, []);

  return (
    <section id="contact" ref={wrapRef} className="contact-wrap" aria-label="צור קשר">
      <div ref={cardRef} className="contact-card on-light">
        <ScrambleText as="p" className="mono contact-eyebrow" text="צור קשר — Let’s talk" />
        <RiseChars
          as="h2"
          className="contact-title"
          parts={[
            { text: "יש לכם עסק?" },
            { text: "בואו נבנה לו", className: "outline-text" },
            { text: "אתר שנראה יקר." },
          ]}
        />
        <BlurWords
          className="contact-sub"
          text="ספרו לנו בכמה מילים מה אתם צריכים — ונחזור אליכם תוך יום עסקים אחד."
        />
        <StepForm />
        <div className="talk">
          <p className="talk-label">מעדיפים לדבר?</p>
          <a className="talk-phone" href="tel:0504060536" dir="ltr" onMouseEnter={scrambleOnHover(700, DIGIT_POOL)}>
            050-406-0536
          </a>
        </div>
      </div>
    </section>
  );
}
