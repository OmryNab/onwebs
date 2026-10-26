import VariableProximity from "./VariableProximity";

export default function Footer() {
  return (
    <footer className="footer">
      <VariableProximity text="ONWEBS" />
      <p className="mono footer-eyebrow">עיצוב · פיתוח · אנימציה</p>
      <nav className="footer-links" aria-label="קישורים">
        <a href="#hero">בית</a>
        <a href="#work">עבודות</a>
        <a href="/guide/">המדריך לאתר הראשון</a>
        <a href="#contact">צור קשר</a>
        <a href="https://wa.me/972504060536" target="_blank" rel="noopener noreferrer">
          וואטסאפ
        </a>
      </nav>
      <p className="footer-copy">© 2026 ONWEBS. כל הזכויות שמורות.</p>
    </footer>
  );
}
