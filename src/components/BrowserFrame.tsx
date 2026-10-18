import { forwardRef, useState } from "react";
import type { Project } from "../data/projects";

const BrowserFrame = forwardRef<HTMLAnchorElement, { project: Project; index: number }>(function BrowserFrame(
  { project, index },
  ref,
) {
  const [loaded, setLoaded] = useState(false);
  return (
    <a
      ref={ref}
      className="frame"
      href={project.url}
      target="_blank"
      rel="noopener noreferrer"
      data-cursor="צפייה ↗"
      aria-label={`${project.title} — צפייה באתר`}
      style={{ zIndex: index + 1 }}
    >
      <span className="frame-bar" aria-hidden="true">
        <i />
        <i />
        <i />
      </span>
      <picture>
        <source media="(max-width: 699px)" srcSet={`/work/${project.id}-mobile.jpg`} />
        <img
          src={`/work/${project.id}-desktop.jpg`}
          alt={`צילום מסך של ${project.title}`}
          className={loaded ? "is-loaded" : ""}
          onLoad={() => setLoaded(true)}
          ref={(img) => {
            if (img?.complete && img.naturalWidth) setLoaded(true);
          }}
          decoding="async"
        />
      </picture>
    </a>
  );
});

export default BrowserFrame;
