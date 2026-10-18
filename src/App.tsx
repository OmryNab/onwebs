import { useState } from "react";
import Preloader from "./components/Preloader";
import Grain from "./components/Grain";
import Cursor from "./components/Cursor";
import Nav from "./components/Nav";
import Hero from "./components/Hero";
import Marquee from "./components/Marquee";
import Work from "./components/Work";
import Contact from "./components/Contact";
import Footer from "./components/Footer";
import { useLenis } from "./hooks/useLenis";
import { useMagnet } from "./hooks/useMagnet";

type Phase = "loading" | "wipe" | "done";

export default function App() {
  const [phase, setPhase] = useState<Phase>("loading");
  const [introAt, setIntroAt] = useState<number | null>(null);

  useLenis(phase !== "loading");
  useMagnet();

  const startIntro = () => {
    document.documentElement.classList.remove("is-loading");
    setIntroAt(performance.now());
    setPhase("wipe");
  };

  return (
    <>
      {phase !== "done" && <Preloader onWipe={startIntro} onDone={() => setPhase("done")} />}
      <Grain />
      <Cursor />
      <Nav />
      <main>
        <Hero introAt={introAt} />
        <Marquee />
        <Work />
        <Contact />
      </main>
      <Footer />
    </>
  );
}
