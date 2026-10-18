import { useEffect, useLayoutEffect, useRef, useState, type FormEvent, type ReactNode } from "react";
import Chips from "./Chips";
import { scramble } from "../lib/scramble";
import { isTouch } from "../lib/env";

const BUSINESS = ["מסעדה / בית קפה", "משרד / נותן שירות", "חנות / מותג", "סטודיו / אישי", "אחר"];
const NEEDS = ["אתר תדמית", "דף נחיתה", "תפריט דיגיטלי", "חנות אונליין", "עיצוב מחדש לאתר קיים"];
const WHEN = ["כמה שיותר מהר", "בחודש הקרוב", "רק בודקים"];
const PERCENT = [25, 50, 75, 100, 100];
const SUCCESS = 4;
const WHATSAPP = "972504060536";

export function normalizePhone(raw: string) {
  let v = raw.replace(/[\s\-().]/g, "");
  if (v.startsWith("+")) v = v.slice(1);
  if (v.startsWith("972")) v = "0" + v.slice(3);
  return v;
}

const PHONE_RE = /^0\d{8,9}$/;

function shake(el: HTMLElement | null) {
  if (!el) return;
  el.classList.remove("shake");
  void el.offsetWidth;
  el.classList.add("shake");
}

function Step({
  index,
  current,
  onSubmit,
  children,
  stepRef,
}: {
  index: number;
  current: number;
  onSubmit: (e: FormEvent<HTMLFormElement>) => void;
  children: ReactNode;
  stepRef: (el: HTMLFormElement | null) => void;
}) {
  const state = index === current ? "active" : index < current ? "prev" : "next";
  return (
    <form
      ref={stepRef}
      className="step"
      data-state={state}
      aria-hidden={state !== "active"}
      noValidate
      onSubmit={onSubmit}
    >
      {children}
    </form>
  );
}

export default function StepForm() {
  const [step, setStep] = useState(0);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [business, setBusiness] = useState("");
  const [needs, setNeeds] = useState<string[]>([]);
  const [when, setWhen] = useState("");
  const [details, setDetails] = useState("");
  const [errors, setErrors] = useState<{ name?: string; phone?: string }>({});
  const [waUrl, setWaUrl] = useState("");
  const [height, setHeight] = useState<number>();

  const stepEls = useRef<(HTMLFormElement | null)[]>([]);
  const pctRef = useRef<HTMLSpanElement>(null);
  const nameField = useRef<HTMLDivElement>(null);
  const phoneField = useRef<HTMLDivElement>(null);
  const thanksRef = useRef<HTMLParagraphElement>(null);
  const mounted = useRef(false);
  const nameRef = useRef(name);
  nameRef.current = name;

  useLayoutEffect(() => {
    const el = stepEls.current[step];
    if (!el) return;
    const measure = () => setHeight(el.offsetHeight);
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [step]);

  useEffect(() => {
    stepEls.current.forEach((el, i) => {
      if (el) el.inert = i !== step;
    });
    if (pctRef.current) scramble(pctRef.current, `${PERCENT[step]}%`, 600);
    if (!mounted.current) {
      mounted.current = true;
      return;
    }
    if (step === SUCCESS && thanksRef.current) {
      const first = nameRef.current.trim().split(/\s+/)[0] ?? "";
      scramble(thanksRef.current, `תודה ${first}! ההודעה בדרך`, 1100);
    }
    if (!isTouch) {
      const target = stepEls.current[step]?.querySelector<HTMLElement>("input, textarea, button");
      target?.focus({ preventScroll: true });
    }
  }, [step]);

  const toggleOne = (setter: (v: string) => void, current: string) => (o: string) =>
    setter(current === o ? "" : o);

  const submitIntro = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const next: typeof errors = {};
    if (name.trim().length < 2) next.name = "נשמח לדעת איך קוראים לך";
    if (!PHONE_RE.test(normalizePhone(phone))) next.phone = "מספר טלפון לא תקין";
    setErrors(next);
    if (next.name) shake(nameField.current);
    if (next.phone) shake(phoneField.current);
    if (!next.name && !next.phone) setStep(1);
  };

  const advance = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setStep((s) => s + 1);
  };

  const send = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const lines = [
      "היי ONWEBS! 👋 הגעתי מהאתר.",
      `שם: ${name.trim()}`,
      `טלפון: ${normalizePhone(phone)}`,
      business && `סוג עסק: ${business}`,
      needs.length > 0 && `צריך: ${needs.join(", ")}`,
      when && `מתי: ${when}`,
      details.trim() && `פרטים: ${details.trim()}`,
    ].filter(Boolean);
    const url = `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(lines.join("\n"))}`;
    window.open(url, "_blank", "noopener");
    setWaUrl(url);
    setStep(SUCCESS);
  };

  const back = () => setStep((s) => Math.max(0, s - 1));
  const ref = (i: number) => (el: HTMLFormElement | null) => {
    stepEls.current[i] = el;
  };

  return (
    <div className="form-card">
      <div className="fp-top mono">
        <span>התקדמות</span>
        <span ref={pctRef} dir="ltr">
          25%
        </span>
      </div>
      <div className="fp-bar" aria-hidden="true">
        <i style={{ transform: `scaleX(${PERCENT[step] / 100})` }} />
      </div>

      <div className="steps" style={{ height }}>
        <Step index={0} current={step} onSubmit={submitIntro} stepRef={ref(0)}>
          <p className="step-title">נתחיל בהיכרות</p>
          <div className="field" ref={nameField}>
            <label htmlFor="f-name">שם מלא</label>
            <input
              id="f-name"
              type="text"
              autoComplete="name"
              placeholder="איך קוראים לך?"
              value={name}
              onChange={(e) => setName(e.target.value)}
              aria-invalid={!!errors.name}
              aria-describedby="f-name-err"
            />
            <span className="field-err" id="f-name-err" role="alert">
              {errors.name}
            </span>
          </div>
          <div className="field" ref={phoneField}>
            <label htmlFor="f-phone">טלפון ליצירת קשר</label>
            <input
              id="f-phone"
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              dir="ltr"
              placeholder="050-0000000"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              aria-invalid={!!errors.phone}
              aria-describedby="f-phone-err"
            />
            <span className="field-err" id="f-phone-err" role="alert">
              {errors.phone}
            </span>
          </div>
          <div className="step-actions">
            <button type="submit" className="btn solid">
              בואו נמשיך ←
            </button>
          </div>
        </Step>

        <Step index={1} current={step} onSubmit={advance} stepRef={ref(1)}>
          <p className="step-title">איזה עסק יש לך?</p>
          <Chips
            label="סוג העסק"
            options={BUSINESS}
            selected={business ? [business] : []}
            onToggle={toggleOne(setBusiness, business)}
          />
          <div className="step-actions">
            <button type="button" className="btn" onClick={back}>
              → חזרה
            </button>
            <button type="submit" className="btn solid">
              ממשיכים ←
            </button>
          </div>
        </Step>

        <Step index={2} current={step} onSubmit={advance} stepRef={ref(2)}>
          <p className="step-title">מה צריך?</p>
          <Chips
            label="מה צריך"
            options={NEEDS}
            selected={needs}
            onToggle={(o) => setNeeds((n) => (n.includes(o) ? n.filter((x) => x !== o) : [...n, o]))}
          />
          <p className="step-sub">מתי תרצו לעלות לאוויר?</p>
          <Chips label="מתי תרצו לעלות לאוויר" options={WHEN} selected={when ? [when] : []} onToggle={toggleOne(setWhen, when)} />
          <div className="step-actions">
            <button type="button" className="btn" onClick={back}>
              → חזרה
            </button>
            <button type="submit" className="btn solid">
              כמעט שם ←
            </button>
          </div>
        </Step>

        <Step index={3} current={step} onSubmit={send} stepRef={ref(3)}>
          <p className="step-title">ספרו לנו עוד</p>
          <div className="field">
            <textarea
              rows={4}
              placeholder="מה החלום שלכם לאתר? (לא חובה)"
              aria-label="מה החלום שלכם לאתר? (לא חובה)"
              value={details}
              onChange={(e) => setDetails(e.target.value)}
            />
          </div>
          <div className="step-actions">
            <button type="button" className="btn" onClick={back}>
              → חזרה
            </button>
            <button type="submit" className="btn solid">
              שליחה ←
            </button>
          </div>
        </Step>

        <Step index={SUCCESS} current={step} onSubmit={(e) => e.preventDefault()} stepRef={ref(SUCCESS)}>
          <span className="check" aria-hidden="true">
            ✓
          </span>
          <p className="step-title" ref={thanksRef} aria-live="polite">
            תודה! ההודעה בדרך
          </p>
          <p className="step-text">
            פתחנו לכם וואטסאפ עם כל הפרטים — רק ללחוץ שליחה. נחזור אליכם תוך יום עסקים אחד.
          </p>
          <a className="btn" href={waUrl || `https://wa.me/${WHATSAPP}`} target="_blank" rel="noopener noreferrer">
            לא נפתח? לחצו כאן
          </a>
        </Step>
      </div>
    </div>
  );
}
