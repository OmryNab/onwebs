import { Fragment, useRef, type CSSProperties, type ElementType } from "react";
import { useInView } from "../hooks/useInView";
import { useScramble } from "../hooks/useScramble";
import { isTouch } from "../lib/env";
import { splitChars, splitWords } from "../lib/textSplit";

type Tag = "p" | "span" | "h1" | "h2" | "h3" | "div";

export function ScrambleText({
  text,
  as = "span",
  className = "",
  duration = 900,
  trigger = "view",
}: {
  text: string;
  as?: Tag;
  className?: string;
  duration?: number;
  trigger?: "view" | "mount";
}) {
  const ref = useScramble<HTMLElement>(text, { trigger, duration });
  const Comp = as as ElementType;
  return (
    <Comp ref={ref} className={className} aria-label={text}>
      {text}
    </Comp>
  );
}

export function BlurWords({
  text,
  as = "p",
  className = "",
  blur = 14,
  y = 30,
  play,
}: {
  text: string;
  as?: Tag;
  className?: string;
  blur?: number;
  y?: number;
  play?: boolean;
}) {
  const ref = useRef<HTMLElement>(null);
  const inView = useInView(ref, 0.3);
  const on = play ?? inView;
  const words = splitWords(text);
  const Comp = as as ElementType;
  const style = { "--b": `${isTouch ? blur * 0.6 : blur}px`, "--y": `${y}px` } as CSSProperties;
  return (
    <Comp ref={ref} className={`bw ${on ? "is-in" : ""} ${className}`} style={style}>
      {words.map((w, i) => (
        <Fragment key={i}>
          <span className="w" style={{ "--i": i } as CSSProperties}>
            {w}
          </span>
          {i < words.length - 1 ? " " : null}
        </Fragment>
      ))}
    </Comp>
  );
}

export type RisePart = { text: string; className?: string };

export function RiseChars({
  parts,
  as = "h2",
  className = "",
}: {
  parts: RisePart[];
  as?: Tag;
  className?: string;
}) {
  const ref = useRef<HTMLElement>(null);
  const inView = useInView(ref, 0.3);
  const Comp = as as ElementType;
  let index = 0;
  const label = parts.map((p) => p.text).join(" ");
  return (
    <Comp ref={ref} className={`rc ${inView ? "is-in" : ""} ${className}`} aria-label={label}>
      {parts.map((part, pi) => {
        const words = splitWords(part.text);
        return (
          <Fragment key={pi}>
            <span className={part.className} aria-hidden="true">
              {words.map((w, wi) => (
                <Fragment key={wi}>
                  <span className="mask">
                    {splitChars(w).map((c, ci) => (
                      <span key={ci} className="ch" style={{ "--i": index++ } as CSSProperties}>
                        {c}
                      </span>
                    ))}
                  </span>
                  {wi < words.length - 1 ? " " : null}
                </Fragment>
              ))}
            </span>
            {pi < parts.length - 1 ? " " : null}
          </Fragment>
        );
      })}
    </Comp>
  );
}

export function ShinyText({ text, className = "" }: { text: string; className?: string }) {
  return <span className={`shiny ${className}`}>{text}</span>;
}
