import { mountGridDustField } from "./components/background/GridDustField.js";

const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const scroller = document.getElementById("scroller");
const heroEl = document.getElementById("hero");
const siteField = document.getElementById("site-field");
const panels = [...document.querySelectorAll("[data-panel]")];
const scrollerPanels = [...document.querySelectorAll("#scroller [data-panel]")];
const segs = [...document.querySelectorAll(".page-progress__seg")];
const panelOrder = ["hero", "work", "contact"];
const HERO_COLOR_UNTIL = 0.68;
const phoneQuery = window.matchMedia("(max-width: 760px), (hover: none) and (pointer: coarse)");
function isPhone() {
  return phoneQuery.matches;
}
let heroExit = 0;
let heroPainted = 0;
let heroRaf = 0;
let heroCoast = 0;
let reelsArmed = true;

const I18N = {
  he: {
    title: "OnWebs — אתרים שנראים יקרים בכוונה",
    desc: "אונוובס בונים אתרים מהירים וחדים למותגים שמסרבים להיראות ממוצעים.",
    page: "עמוד",
    intro: "פתיח",
    work: "עבודות",
    contact: "יצירת קשר",
    idx1: "01 / 03 — פתיח",
    idx2: "02 / 03 — עבודות",
    idx3: "03 / 03 — יצירת קשר",
    kicker: "ONWEBS",
    line1: "אתרים שנראים",
    line2: "יקרים בכוונה.",
    subhead: "אונוובס עוזרים לעסקים — מסעדות, בתי קפה, עורכי דין... להציג את העסק שלהם בצורה מקצועית ברשת ומחזקים את הנוכחות הדיגיטלית.",
    heroDemo: "תגלגלו לדף האחרון בשביל אתר דמו חינם לגמרי.",
    ctaWork: "לצפות בעבודות",
    ctaStart: "קבלת אתר דימו",
    workTitle: "אתרים נבחרים",
    metaBarista: "קפה / תפריט",
    metaNevoani: "צילום / דיוקן",
    metaPeak: "אופניים / קבוצה",
    metaBamitzpe: "קפה / נוף",
    ctaNext: "רוצים אחד כזה?",
    tw: "בואו נבנה את ",
    slam: "שלכם",
    lede: "ספרו לנו על האתר. נחזור תוך יום עסקים.",
    name: "שם",
    phone: "מספר טלפון",
    type: "סוג פרויקט",
    budget: "טווח תקציב",
    message: "הודעה",
    select: "בחירה",
    optLanding: "דף נחיתה",
    optBrand: "אתר מותג",
    optApp: "אפליקציית ווב",
    optOther: "אחר",
    send: "שליחה",
    sent: "נשלח.",
    error: "מלאו את כל השדות.",
  },
};

const lang = "he";

function t(key) {
  return I18N[lang][key];
}

function glyphPool(sample) {
  if (sample && /^[\x00-\x7F]*$/.test(sample)) {
    return "ABCDEFGHIJKLMNOPQRSTUVWXYZ#%&0123456789";
  }
  return lang === "he"
    ? "אבגדהוזחטיכלמנסעפצקרשתךםןףץ#%&0123456789"
    : "ABCDEFGHIJKLMNOPQRSTUVWXYZ#%&0123456789";
}

let holdHero = !!document.querySelector(".site-loader");
let activeId = "hero";
let firstLoad = true;
let lastPlayed = null;
let typeTimer = 0;

function prefersCalm() {
  return reduced || window.matchMedia("(max-width: 760px)").matches;
}

function splitLines(root) {
  root.querySelectorAll(".line").forEach((line) => {
    const text = line.textContent;
    line.textContent = "";
    text.split(/(\s+)/).forEach((token) => {
      if (!token) return;
      if (/^\s+$/.test(token)) {
        const space = document.createElement("span");
        space.className = "char char--space";
        space.innerHTML = "&nbsp;";
        line.append(space);
        return;
      }
      const word = document.createElement("span");
      word.className = "word";
      [...token].forEach((ch) => {
        const wrap = document.createElement("span");
        wrap.className = "char";
        const inner = document.createElement("span");
        inner.className = "char-inner";
        inner.textContent = ch;
        wrap.append(inner);
        word.append(wrap);
      });
      line.append(word);
    });
  });
}

function splitWords(el) {
  if (!el || el.dataset.wordSplit === "1") return;
  const text = el.textContent.trim();
  el.textContent = "";
  text.split(/\s+/).forEach((token, i, arr) => {
    const wrap = document.createElement("span");
    wrap.className = "w";
    const inner = document.createElement("span");
    inner.className = "w-inner";
    inner.textContent = token;
    wrap.append(inner);
    el.append(wrap);
    if (i < arr.length - 1) el.append(document.createTextNode(" "));
  });
  el.dataset.wordSplit = "1";
}

function applyCopy() {
  document.querySelectorAll("[data-i18n]").forEach((el) => {
    const value = t(el.dataset.i18n);
    el.textContent = value;
    if (el.hasAttribute("data-final")) el.dataset.final = value;
    delete el.dataset.label;
    delete el.dataset.wordSplit;
  });
  document.querySelectorAll("[data-i18n-aria]").forEach((el) => {
    el.setAttribute("aria-label", t(el.dataset.i18nAria));
  });
  document.querySelectorAll("[data-split-lines]").forEach(splitLines);
  document.querySelectorAll("[data-words]").forEach(splitWords);
}

function applyLang() {
  document.documentElement.lang = "he";
  document.documentElement.dir = "rtl";
  document.title = t("title");
  const meta = document.querySelector('meta[name="description"]');
  if (meta) meta.setAttribute("content", t("desc"));
  document.querySelector(".page-progress")?.setAttribute("aria-label", t("page"));
  applyCopy();
  const send = document.querySelector("[data-submit-label]");
  if (send) send.dataset.base = t("send");
}

function cancelHeroCoast() {
  if (heroCoast) cancelAnimationFrame(heroCoast);
  heroCoast = 0;
}

function syncWorkReels(show) {
  if (show === reelsArmed) return;
  reelsArmed = show;
  document.querySelectorAll("video.mock-reel").forEach((video) => {
    if (show) {
      video.playbackRate = 2.5;
      const play = video.play();
      if (play) play.catch(() => {});
      return;
    }
    video.pause();
  });
}

function paintHeroExit() {
  const p = heroExit;
  const was = heroPainted;
  heroPainted = p;
  const until = isPhone() ? 0.12 : HERO_COLOR_UNTIL;
  const mix = Math.min(1, p / until);
  const wipe = p <= until ? 0 : (p - until) / (1 - until);
  document.documentElement.style.setProperty("--hero-mix", mix.toFixed(4));
  document.documentElement.style.setProperty("--site-dim", "0");
  if (heroEl) {
    heroEl.style.setProperty("--hero-wipe", wipe.toFixed(4));
  }
  heroEl?.classList.toggle("is-wiping", isPhone() && p > 0.01 && p < 0.999);
  heroEl?.classList.toggle("is-away", p >= 0.999);
  siteField?.classList.toggle("is-away", p < 0.999);
  if (p >= 0.999) heroEl?.setAttribute("aria-hidden", "true");
  else heroEl?.removeAttribute("aria-hidden");

  if (p < 1 && scroller && scroller.scrollTop !== 0) scroller.scrollTop = 0;

  syncWorkReels(p >= 0.999);

  if (p >= 0.999 && was < 0.999) {
    if (activeId === "hero") activate("work");
  } else if (p < 0.999 && was >= 0.999) {
    activate("hero");
  }
}

function applyHeroExit(next, immediate = false) {
  heroExit = Math.min(1, Math.max(0, next));
  const snap = immediate || heroExit <= 0 || heroExit >= 1;
  if (snap) {
    if (heroRaf) {
      cancelAnimationFrame(heroRaf);
      heroRaf = 0;
    }
    paintHeroExit();
    return;
  }
  if (heroRaf) return;
  heroRaf = requestAnimationFrame(() => {
    heroRaf = 0;
    paintHeroExit();
  });
}

function tweenHeroTo(target, ms = 360) {
  cancelHeroCoast();
  const from = heroExit;
  if (Math.abs(from - target) < 0.001) {
    applyHeroExit(target, true);
    return;
  }
  const start = performance.now();
  const frame = (now) => {
    const t = Math.min(1, (now - start) / ms);
    applyHeroExit(from + (target - from) * easeInOutSine(t), true);
    if (t < 1) {
      heroCoast = requestAnimationFrame(frame);
      return;
    }
    heroCoast = 0;
  };
  heroCoast = requestAnimationFrame(frame);
}

function heroCovering() {
  return heroExit < 0.999;
}

const PAGE_MS = 3400;
let pageAnim = 0;
let pagingTo = null;

function easeInOutSine(t) {
  return -(Math.cos(Math.PI * t) - 1) / 2;
}

function animateScrollerTo(top, ms = PAGE_MS) {
  if (!scroller) return;
  if (reduced) {
    scroller.scrollTop = top;
    pagingTo = null;
    return;
  }
  const from = scroller.scrollTop;
  if (Math.abs(from - top) < 2) {
    scroller.scrollTop = top;
    pagingTo = null;
    return;
  }
  const id = ++pageAnim;
  pagingTo = top;
  const dist = top - from;
  const start = performance.now();
  scroller.style.scrollSnapType = "none";

  function frame(now) {
    if (id !== pageAnim) return;
    const t = Math.min(1, (now - start) / ms);
    scroller.scrollTop = from + dist * easeInOutSine(t);
    if (t < 1) {
      requestAnimationFrame(frame);
      return;
    }
    scroller.scrollTop = top;
    scroller.style.scrollSnapType = "";
    pagingTo = null;
  }
  requestAnimationFrame(frame);
}

function goTo(id) {
  if (id === "hero") {
    applyHeroExit(0);
    animateScrollerTo(0);
    activate("hero");
    return;
  }
  applyHeroExit(1);
  const el = document.getElementById(id);
  if (!el) return;
  animateScrollerTo(el.offsetTop);
}

document.querySelectorAll("[data-target]").forEach((el) => {
  el.addEventListener("click", (e) => {
    e.preventDefault();
    goTo(el.dataset.target);
  });
});

function setActive(id) {
  activeId = id;
  const current = panelOrder.indexOf(id);
  segs.forEach((seg, n) => {
    seg.classList.toggle("is-done", n < current);
    seg.classList.toggle("is-on", n === current);
  });
}

function slamHeadline(section) {
  const chars = [...section.querySelectorAll(".char-inner")];
  const stagger = prefersCalm() ? 48 : 72;
  chars.forEach((ch, i) => {
    ch.animate(
      [
        { transform: "translateY(115%) skewX(0deg)" },
        { transform: "translateY(-12%) skewX(0deg)", offset: 0.58 },
        { transform: "translateY(0%) skewX(12deg)", offset: 0.72 },
        { transform: "translateY(0%) skewX(-10deg)", offset: 0.84 },
        { transform: "translateY(0%) skewX(0deg)" },
      ],
      {
        duration: prefersCalm() ? 1480 : 2000,
        delay: i * stagger,
        easing: "cubic-bezier(0.16, 1, 0.3, 1)",
        fill: "forwards",
      }
    );
  });
  return chars.length * stagger + 2000;
}

function expandKicker(section) {
  const kicker = section.querySelector("[data-kicker]");
  if (!kicker) return;
  const label = kicker.dataset.label || kicker.textContent.trim();
  kicker.dataset.label = label;
  scrambleText(kicker, label, 1480);
  kicker.animate(
    [
      { letterSpacing: "0em", opacity: 0.35 },
      { letterSpacing: "0.18em", opacity: 1 },
    ],
    { duration: 2400, easing: "cubic-bezier(0.16, 1, 0.3, 1)", fill: "forwards" }
  );
}

function wipeSubhead(section, delay) {
  const sub = section.querySelector("[data-wipe]");
  if (!sub) return;
  sub.animate([{ clipPath: "inset(0 0 0 100%)" }, { clipPath: "inset(0 0 0 0)" }], {
    duration: 2000,
    delay,
    easing: "cubic-bezier(0.16, 1, 0.3, 1)",
    fill: "forwards",
  });
  slamWords(sub, delay + 160);
}

function slamWords(root, delay = 0) {
  root.querySelectorAll(".w-inner").forEach((inner, i) => {
    inner.animate(
      [
        { transform: "translateY(110%) skewX(8deg)", opacity: 0.2 },
        { transform: "translateY(-8%) skewX(-6deg)", offset: 0.62 },
        { transform: "translateY(0) skewX(0deg)", opacity: 1 },
      ],
      {
        duration: prefersCalm() ? 1180 : 1560,
        delay: delay + i * (prefersCalm() ? 72 : 110),
        easing: "cubic-bezier(0.16, 1, 0.3, 1)",
        fill: "forwards",
      }
    );
  });
}

function playChrome(section) {
  section.querySelectorAll("[data-scramble-plain]").forEach((el, i) => {
    const label = el.dataset.label || el.textContent.trim();
    el.dataset.label = label;
    setTimeout(() => scrambleText(el, label, 1320), i * 220);
    el.animate(
      [
        { transform: "translateY(80%)", opacity: 0 },
        { transform: "translateY(0)", opacity: 1 },
      ],
      { duration: 1400, delay: i * 220, easing: "cubic-bezier(0.16, 1, 0.3, 1)", fill: "forwards" }
    );
  });
  section.querySelectorAll(".index[data-tick]").forEach((el) => {
    const finalText = el.dataset.final;
    scrambleText(el, finalText, 1760);
  });
}

function scrambleText(el, finalText, duration = 1900) {
  const start = performance.now();
  const upper = finalText.toUpperCase();
  function frame(now) {
    const t = Math.min(1, (now - start) / duration);
    if (t < 1) {
      el.textContent = [...upper]
        .map((ch, i) => {
          if (ch === " " || ch === "?" || t > i / upper.length + 0.25) return finalText[i];
          return glyphPool(finalText)[(Math.random() * glyphPool(finalText).length) | 0];
        })
        .join("");
      requestAnimationFrame(frame);
    } else {
      el.textContent = finalText;
    }
  }
  requestAnimationFrame(frame);
}

function scrambleButtons(section) {
  section.querySelectorAll("[data-scramble]").forEach((btn, i) => {
    const label = btn.dataset.label || btn.textContent.trim();
    btn.dataset.label = label;
    setTimeout(() => scrambleText(btn, label, 1760), 600 + i * 320);
  });
}

function flashOnce() {
  const flash = document.querySelector(".flash");
  if (!flash || reduced) return;
  flash.classList.add("is-on");
  setTimeout(() => flash.classList.remove("is-on"), 520);
}

async function playHero(section) {
  const headline = section.querySelector(".headline");
  headline?.classList.remove("is-idle");
  section.querySelectorAll(".char-inner").forEach((ch) => {
    ch.style.transform = "translateY(115%)";
  });
  const sub = section.querySelector("[data-wipe]");
  if (sub) sub.style.clipPath = "inset(0 0 0 100%)";

  if (firstLoad && !reduced) flashOnce();
  firstLoad = false;

  if (reduced) {
    section.querySelectorAll(".char-inner").forEach((ch) => {
      ch.style.transform = "none";
    });
    if (sub) sub.style.clipPath = "none";
    return;
  }

  expandKicker(section);
  playChrome(section);
  const total = slamHeadline(section);
  wipeSubhead(section, Math.max(560, total - 840));
  scrambleButtons(section);
  setTimeout(() => headline?.classList.add("is-idle"), total + 400);
}

function playWork(section) {
  playChrome(section);
  lockProject(1400);
  const first = projectCards()[0];
  const track = document.getElementById("projects");
  if (first && track) {
    const trackBox = track.getBoundingClientRect();
    const cardBox = first.getBoundingClientRect();
    const shift = cardBox.left - trackBox.left;
    if (Math.abs(shift) > 2) track.scrollLeft += shift;
  }
  const enterDelay = 780;
  const title = section.querySelector("[data-slam-title]");
  if (title && !reduced) {
    title.style.transform = "none";
    title.style.opacity = "1";
    title.animate(
      [
        { clipPath: "inset(0 100% 0 0)", filter: "blur(10px)", opacity: 1 },
        { clipPath: "inset(0 0 0 0)", filter: "blur(0px)", opacity: 1 },
      ],
      { duration: 2000, delay: enterDelay, easing: "cubic-bezier(0.16, 1, 0.3, 1)", fill: "forwards" }
    );
  } else if (title) {
    title.style.transform = "none";
    title.style.opacity = "1";
  }

  section.querySelectorAll("[data-mask]").forEach((name, i) => {
    let inner = name.querySelector(".mask-inner");
    if (!inner) {
      inner = document.createElement("span");
      inner.className = "mask-inner";
      inner.textContent = name.textContent;
      name.textContent = "";
      name.append(inner);
    }
    if (reduced) {
      inner.style.transform = "none";
      inner.style.filter = "none";
      inner.style.opacity = "1";
      return;
    }
    inner.animate(
      [
        { transform: "translateX(40px)", filter: "blur(8px)", opacity: 0 },
        { transform: "translateX(0)", filter: "blur(0px)", opacity: 1 },
      ],
      {
        duration: 1540,
        delay: enterDelay + 400 + i * 190,
        easing: "cubic-bezier(0.16, 1, 0.3, 1)",
        fill: "forwards",
      }
    );
  });

  section.querySelectorAll("[data-tick]").forEach((stat, i) => {
    const finalText = stat.dataset.final;
    stat.textContent = finalText;
    if (reduced) return;
    stat.animate(
      [
        { opacity: 0, transform: "translateY(16px)" },
        { opacity: 1, transform: "translateY(0)" },
      ],
      {
        duration: 1260,
        delay: enterDelay + 700 + i * 190,
        easing: "cubic-bezier(0.16, 1, 0.3, 1)",
        fill: "forwards",
      }
    );
  });

  section.querySelectorAll("[data-scramble]").forEach((btn, i) => {
    if (reduced) return;
    btn.animate(
      [
        { opacity: 0, transform: "translateY(12px)" },
        { opacity: 1, transform: "translateY(0)" },
      ],
      {
        duration: 1120,
        delay: enterDelay + 980 + i * 160,
        easing: "cubic-bezier(0.16, 1, 0.3, 1)",
        fill: "forwards",
      }
    );
  });
}

function playContact(section) {
  playChrome(section);
  const tw = section.querySelector("[data-typewriter]");
  const slam = section.querySelector("[data-slam-word]");
  const full = t("tw");
  const labels = [...section.querySelectorAll("[data-label] span")];
  section.querySelectorAll(".caret").forEach((c) => c.remove());
  clearInterval(typeTimer);

  if (tw) tw.textContent = full;
  if (slam) {
    slam.style.opacity = "1";
    slam.style.transform = "none";
  }

  const heading = section.querySelector(".contact-title");
  if (heading && !reduced) {
    heading.animate(
      [
        { opacity: 0, filter: "blur(14px)", transform: "translateY(24px)" },
        { opacity: 1, filter: "blur(0px)", transform: "translateY(0)" },
      ],
      { duration: 1680, easing: "cubic-bezier(0.16, 1, 0.3, 1)", fill: "forwards" }
    );
  }

  const lede = section.querySelector("[data-words]");
  if (lede && !reduced) {
    lede.querySelectorAll(".w-inner").forEach((inner, i) => {
      inner.animate(
        [
          { opacity: 0, transform: "translateY(0)" },
          { opacity: 1, transform: "translateY(0)" },
        ],
        {
          duration: 980,
          delay: 560 + i * 120,
          easing: "ease-out",
          fill: "forwards",
        }
      );
    });
  }

  const email = section.querySelector(".email[data-scramble]");
  if (email && !reduced) {
    email.animate(
      [
        { opacity: 0, letterSpacing: "0.28em" },
        { opacity: 1, letterSpacing: "0.08em" },
      ],
      { duration: 1540, delay: 980, easing: "cubic-bezier(0.16, 1, 0.3, 1)", fill: "forwards" }
    );
  }

  const copy = section.querySelector("[data-track]");
  if (copy && !reduced) {
    copy.animate(
      [
        { opacity: 0 },
        { opacity: 1 },
      ],
      { duration: 1120, delay: 1400, easing: "ease-out", fill: "forwards" }
    );
  }

  labels.forEach((l) => {
    l.style.filter = "none";
    l.style.opacity = "1";
  });
  if (reduced) return;

  labels.forEach((label, i) => {
    label.animate(
      [
        { opacity: 1, transform: "translateY(8px)" },
        { opacity: 1, transform: "translateY(0)" },
      ],
      {
        duration: 980,
        delay: 280 + i * 170,
        easing: "cubic-bezier(0.16, 1, 0.3, 1)",
        fill: "forwards",
      }
    );
  });
}

function play(id) {
  const section = document.querySelector(`[data-panel="${id}"]`);
  if (!section) return;
  if (id === "hero") playHero(section);
  if (id === "work") playWork(section);
  if (id === "contact") playContact(section);
}

function activate(id) {
  setActive(id);
  if (holdHero && id === "hero") return;
  if (id === lastPlayed) return;
  lastPlayed = id;
  play(id);
}

const observer = new IntersectionObserver(
  (entries) => {
    if (heroCovering()) return;
    const visible = entries
      .filter((e) => e.isIntersecting && e.intersectionRatio >= 0.55)
      .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
    if (!visible) return;
    activate(visible.target.dataset.panel);
  },
  { root: scroller, threshold: [0.55, 0.75, 0.9] }
);

scrollerPanels.forEach((p) => observer.observe(p));
applyLang();
mountGridDustField(siteField, "light");
mountGridDustField(heroEl, "light");
siteField?.classList.add("is-away");

function startHero() {
  holdHero = false;
  lastPlayed = null;
  const hash = location.hash.replace("#", "");
  if (hash === "work" || hash === "contact") {
    applyHeroExit(1);
    activate(hash);
    const el = document.getElementById(hash);
    if (el) scroller.scrollTo({ top: el.offsetTop, behavior: "auto" });
    return;
  }
  applyHeroExit(0);
  activate("hero");
}

if (holdHero) {
  window.addEventListener("site-loader:done", startHero, { once: true });
} else {
  startHero();
}

const projectsTrack = document.getElementById("projects");
const projectCards = () => [...document.querySelectorAll(".project")];
let projectLock = false;
let workTourDone = false;

function lastProjectIndex() {
  return Math.max(0, projectCards().length - 1);
}

function currentProjectIndex() {
  if (!projectsTrack) return 0;
  const cards = projectCards();
  if (!cards.length) return 0;
  const root = projectsTrack.getBoundingClientRect();
  const mid = (root.left + root.right) / 2;
  let best = 0;
  let bestDist = Infinity;
  cards.forEach((card, i) => {
    const r = card.getBoundingClientRect();
    const dist = Math.abs((r.left + r.right) / 2 - mid);
    if (dist < bestDist) {
      bestDist = dist;
      best = i;
    }
  });
  return best;
}

function workLocked() {
  return activeId === "work" && !workTourDone;
}

function syncWorkLock() {
  if (!scroller) return;
  if (workLocked()) {
    scroller.style.scrollSnapType = "none";
    const work = document.getElementById("work");
    if (work) scroller.scrollTop = work.offsetTop;
  } else {
    scroller.style.scrollSnapType = "";
  }
}

let projectAnim = 0;
const PROJECT_MS = 3200;

function animateProjectsTo(index, ms = PROJECT_MS) {
  if (!projectsTrack) return;
  const card = projectCards()[index];
  if (!card) return;

  const trackBox = projectsTrack.getBoundingClientRect();
  const cardBox = card.getBoundingClientRect();
  const from = projectsTrack.scrollLeft;
  const target = from + (cardBox.left - trackBox.left);

  if (reduced || Math.abs(target - from) < 1) {
    projectsTrack.scrollLeft = target;
    return;
  }

  const id = ++projectAnim;
  const dist = target - from;
  const start = performance.now();
  projectsTrack.style.scrollSnapType = "none";

  function ease(t) {
    return -(Math.cos(Math.PI * t) - 1) / 2;
  }

  function frame(now) {
    if (id !== projectAnim) return;
    const t = Math.min(1, (now - start) / ms);
    projectsTrack.scrollLeft = from + dist * ease(t);
    if (t < 1) {
      requestAnimationFrame(frame);
      return;
    }
    projectsTrack.scrollLeft = target;
    projectsTrack.style.scrollSnapType = "";
  }
  requestAnimationFrame(frame);
}

function goProject(index) {
  const cards = projectCards();
  const n = Math.max(0, Math.min(cards.length - 1, index));
  animateProjectsTo(n);
  slamProject(n);
  syncWorkLock();
  if (n >= lastProjectIndex()) {
    const wait = Math.max(PROJECT_MS, 3400);
    setTimeout(() => {
      workTourDone = true;
      syncWorkLock();
    }, wait);
  }
}

function slamProject(index) {
  const card = projectCards()[index]?.querySelector(".card");
  if (!card || reduced) return;
  card.animate(
    [
      { transform: "scale(1.14) translateY(32px)", opacity: 0.25 },
      { transform: "scale(0.97) translateY(0)", opacity: 1, offset: 0.7 },
      { transform: "scale(1) translateY(0)", opacity: 1 },
    ],
    { duration: 2800, easing: "cubic-bezier(0.22, 0.61, 0.36, 1)" }
  );
}

function lockProject(ms = 3400) {
  projectLock = true;
  setTimeout(() => {
    projectLock = false;
  }, ms);
}

function stepProjects(dir) {
  const i = currentProjectIndex();
  const last = lastProjectIndex();
  if (dir > 0 && i < last) {
    if (projectLock) return true;
    lockProject();
    goProject(i + 1);
    return true;
  }
  if (dir < 0 && i > 0) {
    if (projectLock) return true;
    lockProject();
    goProject(i - 1);
    return true;
  }
  return false;
}

function wheelDelta(e) {
  let dy = e.deltaY;
  if (e.deltaMode === 1) dy *= 16;
  if (e.deltaMode === 2) dy *= window.innerHeight;
  return dy;
}

function stepHeroExit(dy) {
  const span = isPhone()
    ? Math.max(240, window.innerHeight * 0.48)
    : Math.max(900, window.innerHeight * 2.2);
  applyHeroExit(heroExit + dy / span);
}

window.addEventListener(
  "wheel",
  (e) => {
    if (holdHero) return;
    const dy = wheelDelta(e);
    const goingDown = dy > 0;
    const goingUp = dy < 0;

    if (heroCovering()) {
      e.preventDefault();
      e.stopPropagation();
      if (reduced && goingDown) {
        applyHeroExit(1);
        return;
      }
      stepHeroExit(dy);
      return;
    }

    if (pagingTo !== null) {
      e.preventDefault();
      e.stopPropagation();
      return;
    }

    if (activeId === "contact" && goingUp) {
      e.preventDefault();
      e.stopPropagation();
      goTo("work");
      return;
    }

    if (activeId !== "work") return;

    if (goingUp && currentProjectIndex() === 0) {
      e.preventDefault();
      e.stopPropagation();
      if (reduced) {
        applyHeroExit(0);
        return;
      }
      stepHeroExit(dy);
      return;
    }

    if (workLocked() && goingDown) {
      e.preventDefault();
      e.stopPropagation();
      stepProjects(1);
      syncWorkLock();
      return;
    }
    if (goingUp && currentProjectIndex() > 0) {
      e.preventDefault();
      e.stopPropagation();
      stepProjects(-1);
      return;
    }
    if (goingDown && workTourDone) {
      e.preventDefault();
      e.stopPropagation();
      goTo("contact");
    }
  },
  { passive: false, capture: true }
);

let touchY = 0;
let touchTravel = 0;

function finishHeroTouch() {
  if (!isPhone() || !heroCovering()) return;
  if (Math.abs(touchTravel) < 10 && heroExit < 0.04) return;
  if (touchTravel > 24 || (touchTravel >= 0 && heroExit > 0.16)) {
    tweenHeroTo(1, 340);
    return;
  }
  if (touchTravel < -24 || heroExit < 0.28) {
    tweenHeroTo(0, 300);
    return;
  }
  tweenHeroTo(heroExit > 0.42 ? 1 : 0, 340);
}

window.addEventListener(
  "touchstart",
  (e) => {
    cancelHeroCoast();
    touchTravel = 0;
    touchY = e.touches[0]?.clientY || 0;
  },
  { passive: true }
);
window.addEventListener(
  "touchmove",
  (e) => {
    if (holdHero) return;
    const y = e.touches[0]?.clientY || 0;
    const dy = touchY - y;
    const goingDown = y < touchY - 8;
    const goingUp = y > touchY + 8;

    if (heroCovering()) {
      e.preventDefault();
      if (reduced && goingDown) {
        applyHeroExit(1, true);
        touchY = y;
        return;
      }
      touchTravel += dy;
      stepHeroExit(dy);
      touchY = y;
      return;
    }

    if (pagingTo !== null) {
      e.preventDefault();
      touchY = y;
      return;
    }

    if (activeId === "contact" && goingUp) {
      e.preventDefault();
      goTo("work");
      touchY = y;
      return;
    }

    if (activeId !== "work") return;

    if (goingUp && currentProjectIndex() === 0) {
      e.preventDefault();
      touchTravel += dy;
      stepHeroExit(dy);
      touchY = y;
      return;
    }
    if (workLocked() && goingDown) {
      e.preventDefault();
      stepProjects(1);
      touchY = y;
      return;
    }
    if (goingUp && currentProjectIndex() > 0) {
      e.preventDefault();
      stepProjects(-1);
      touchY = y;
      return;
    }
    if (goingDown && workTourDone) {
      e.preventDefault();
      goTo("contact");
      touchY = y;
    }
  },
  { passive: false, capture: true }
);

window.addEventListener("touchend", finishHeroTouch, { passive: true });
window.addEventListener("touchcancel", finishHeroTouch, { passive: true });

scroller.addEventListener("scroll", () => {
  if (pagingTo !== null) return;
  if (heroCovering()) {
    scroller.scrollTop = 0;
    return;
  }
  if (!workLocked()) return;
  const work = document.getElementById("work");
  if (!work) return;
  if (Math.abs(scroller.scrollTop - work.offsetTop) > 1) {
    scroller.scrollTop = work.offsetTop;
  }
});

window.addEventListener("keydown", (e) => {
  const i = panelOrder.indexOf(activeId);
  const lastProject = projectCards().length - 1;
  const rtl = document.documentElement.dir === "rtl";

  if (heroCovering()) {
    if (["PageDown", "ArrowDown", " "].includes(e.key)) {
      if (e.key === " " && e.target.closest("input, textarea, select, button")) return;
      e.preventDefault();
      applyHeroExit(reduced ? 1 : heroExit + 0.16);
      return;
    }
    if (["PageUp", "ArrowUp"].includes(e.key)) {
      e.preventDefault();
      applyHeroExit(reduced ? 0 : heroExit - 0.16);
      return;
    }
  }

  if (activeId === "work") {
    if (["PageDown", "ArrowDown", " "].includes(e.key) || (e.key === "ArrowRight" && !rtl) || (e.key === "ArrowLeft" && rtl)) {
      if (e.key === " " && e.target.closest("input, textarea, select, button")) return;
      const p = currentProjectIndex();
      if (p < lastProject) {
        e.preventDefault();
        goProject(p + 1);
        return;
      }
    }
    if (["PageUp", "ArrowUp"].includes(e.key) || (e.key === "ArrowLeft" && !rtl) || (e.key === "ArrowRight" && rtl)) {
      const p = currentProjectIndex();
      if (p > 0) {
        e.preventDefault();
        goProject(p - 1);
        return;
      }
      e.preventDefault();
      applyHeroExit(reduced ? 0 : 0.85);
      return;
    }
  }

  if (["PageDown", "ArrowDown", " "].includes(e.key)) {
    if (e.key === " " && e.target.closest("input, textarea, select, button")) return;
    e.preventDefault();
    goTo(panelOrder[Math.min(panelOrder.length - 1, i + 1)]);
  }
  if (["PageUp", "ArrowUp"].includes(e.key)) {
    e.preventDefault();
    goTo(panelOrder[Math.max(0, i - 1)]);
  }
  if (e.key === "Home") {
    e.preventDefault();
    goTo("hero");
  }
  if (e.key === "End") {
    e.preventDefault();
    goTo("contact");
  }
});

const submitBtn = document.querySelector("[data-submit]");
const submitLabel = document.querySelector("[data-submit-label]");
submitBtn?.addEventListener("mouseenter", () => {
  if (submitBtn.classList.contains("is-sent") || reduced) return;
  submitBtn.classList.add("is-hovering");
  const label = submitLabel || submitBtn;
  scrambleText(label, label.dataset.base || "Send", 640);
});
submitBtn?.addEventListener("mouseleave", () => submitBtn.classList.remove("is-hovering"));
if (submitLabel) submitLabel.dataset.base = t("send");
document.querySelectorAll("[data-scramble]").forEach((el) => {
  el.addEventListener("mouseenter", () => {
    if (reduced || el.closest(".is-sent")) return;
    const label = el.dataset.label || el.textContent.trim();
    el.dataset.label = label;
    scrambleText(el, label, 1100);
  });
});

document.getElementById("contact-form")?.addEventListener("submit", async (e) => {
  e.preventDefault();
  const form = e.currentTarget;
  const error = document.getElementById("form-error");
  const valid = form.checkValidity();
  error.hidden = true;
  if (!valid) {
    error.hidden = false;
    form.reportValidity();
    return;
  }

  const data = Object.fromEntries(new FormData(form).entries());
  try {
    const res = await fetch("https://formsubmit.co/ajax/omrinabwani123@gmail.com", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        name: data.name,
        phone: data.phone,
        type: data.type,
        budget: data.budget,
        message: data.message,
        _subject: "OnWebs — פנייה חדשה",
        _captcha: "false",
      }),
    });
    const json = await res.json().catch(() => ({}));
    const activating = typeof json.message === "string" && /activat/i.test(json.message);
    if (!activating && (!res.ok || json.success === false || json.success === "false")) {
      throw new Error("send failed");
    }
  } catch {
    return;
  }

  submitBtn.classList.remove("is-hovering");
  submitBtn.classList.add("is-sent");
  submitBtn.disabled = true;
  const label = submitLabel || submitBtn;
  scrambleText(label, t("sent"), 800);
  label.animate(
    [
      { transform: "scale(1)" },
      { transform: "scale(1.18)", offset: 0.4 },
      { transform: "scale(1)" },
    ],
    { duration: 1100, easing: "cubic-bezier(0.16, 1, 0.3, 1)" }
  );
});

