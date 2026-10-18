import { Fragment, forwardRef, type ReactNode } from "react";
import { splitWords } from "../lib/textSplit";

export type ChapterPart = { text: string; shiny?: boolean; br?: boolean };

export type ChapterData = {
  eyebrow: string;
  title: ChapterPart[];
  lead?: string;
  titleClass: string;
  low?: boolean;
  hint?: boolean;
  h1?: boolean;
};

function words(parts: ChapterPart[]) {
  const out: ReactNode[] = [];
  parts.forEach((part, pi) => {
    if (part.br) out.push(<br key={`br${pi}`} />);
    else if (pi > 0) out.push(" ");
    splitWords(part.text).forEach((w, wi, all) => {
      out.push(
        <span key={`${pi}-${wi}`} className="w">
          {part.shiny ? <span className="shiny">{w}</span> : w}
        </span>,
      );
      if (wi < all.length - 1) out.push(<Fragment key={`${pi}-${wi}s`}> </Fragment>);
    });
  });
  return out;
}

/** Hero chapter overlay. Word styles are driven by Hero's scroll loop. */
const Chapter = forwardRef<HTMLDivElement, { data: ChapterData }>(function Chapter({ data }, ref) {
  const Title = data.h1 ? "h1" : "h2";
  const label = data.title.map((p) => p.text).join(" ");
  return (
    <div ref={ref} className={`chapter ${data.low ? "chapter--low" : ""}`}>
      <p className="mono chapter-eyebrow chapter-fade" data-text={data.eyebrow}>
        {data.eyebrow}
      </p>
      <Title className={data.titleClass} aria-label={label}>
        <span aria-hidden="true">{words(data.title)}</span>
      </Title>
      {data.lead && <p className="chapter-lead">{words([{ text: data.lead }])}</p>}
      {data.hint && (
        <div className="scroll-hint chapter-fade">
          <span className="mono">גללו כדי להפעיל</span>
          <span className="drip" />
        </div>
      )}
    </div>
  );
});

export default Chapter;
