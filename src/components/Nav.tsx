import { scrambleOnHover } from "../hooks/useScramble";

export default function Nav() {
  const onHover = scrambleOnHover(600);
  return (
    <nav className="nav" aria-label="ניווט ראשי">
      <a href="#contact" onMouseEnter={onHover}>
        צור קשר
      </a>
      <a href="#hero" className="nav-logo" aria-label="ONWEBS — לראש העמוד">
        ONWEBS
      </a>
      <a href="#work" onMouseEnter={onHover}>
        עבודות
      </a>
    </nav>
  );
}
