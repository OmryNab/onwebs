import { clamp, easeInOutCubic } from "./easing";

/** Scroll-progress windows in which one stage morphs into the next. */
export const STAGE_WINDOWS: [number, number][] = [
  [0.06, 0.19],
  [0.33, 0.44],
  [0.55, 0.65],
  [0.81, 0.93],
];

const BUCKETS = 12;
const TILT = 0.38;
const SIN = new Float32Array(1024);
for (let i = 0; i < SIN.length; i++) SIN[i] = Math.sin((i / SIN.length) * Math.PI * 2);

type Points = { x: Float32Array; y: Float32Array };

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.arcTo(x + w, y, x + w, y + r, r);
  ctx.lineTo(x + w, y + h - r);
  ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
  ctx.lineTo(x + r, y + h);
  ctx.arcTo(x, y + h, x, y + h - r, r);
  ctx.lineTo(x, y + r);
  ctx.arcTo(x, y, x + r, y, r);
  ctx.closePath();
}

function drawBrowser(ctx: CanvasRenderingContext2D, W: number, H: number) {
  const portrait = W < 700 || H > W * 1.15;
  let w: number;
  let h: number;
  if (portrait) {
    w = W * 0.8;
    h = Math.min(H * 0.68, w * 1.75);
  } else {
    w = Math.min(W * 0.86, (H * 0.8) / 0.62);
    h = w * 0.62;
  }
  const x = (W - w) / 2;
  const y = (H - h) / 2;
  ctx.lineWidth = 2.6;
  roundRect(ctx, x, y, w, h, Math.min(22, w * 0.03));
  ctx.stroke();

  const bar = portrait ? Math.max(38, h * 0.07) : Math.max(40, h * 0.09);
  ctx.beginPath();
  ctx.moveTo(x, y + bar);
  ctx.lineTo(x + w, y + bar);
  ctx.stroke();

  const dot = bar * 0.14;
  for (let k = 0; k < 3; k++) {
    ctx.beginPath();
    ctx.arc(x + bar * 0.55 + k * dot * 3.2, y + bar / 2, dot, 0, Math.PI * 2);
    ctx.stroke();
  }

  const pw = portrait ? w * 0.42 : w * 0.34;
  const ph = bar * 0.46;
  roundRect(ctx, x + (w - pw) / 2, y + (bar - ph) / 2, pw, ph, ph / 2);
  ctx.stroke();

  const ly = y + h * 0.84;
  ctx.beginPath();
  ctx.moveTo(x + w * 0.36, ly);
  ctx.lineTo(x + w * 0.64, ly);
  ctx.moveTo(x + w * 0.42, ly + h * 0.055);
  ctx.lineTo(x + w * 0.58, ly + h * 0.055);
  ctx.stroke();
}

function drawWord(ctx: CanvasRenderingContext2D, W: number, H: number) {
  ctx.direction = "ltr";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.font = "900 100px Heebo, sans-serif";
  const m = ctx.measureText("ONWEBS").width || 400;
  const size = Math.min((100 * W * 0.84) / m, H * 0.34);
  ctx.font = `900 ${size}px Heebo, sans-serif`;
  ctx.fillText("ONWEBS", W / 2, H * 0.44);
}

function samplePoints(W: number, H: number, N: number, draw: (c: CanvasRenderingContext2D) => void): Points {
  const s = 0.5;
  const cw = Math.max(1, Math.ceil(W * s));
  const ch = Math.max(1, Math.ceil(H * s));
  const c = document.createElement("canvas");
  c.width = cw;
  c.height = ch;
  const ctx = c.getContext("2d", { willReadFrequently: true })!;
  ctx.scale(s, s);
  ctx.fillStyle = "#fff";
  ctx.strokeStyle = "#fff";
  draw(ctx);

  const data = ctx.getImageData(0, 0, cw, ch).data;
  const hits: number[] = [];
  for (let i = 3, p = 0; i < data.length; i += 4, p++) if (data[i] > 110) hits.push(p);

  const x = new Float32Array(N);
  const y = new Float32Array(N);
  for (let i = 0; i < N; i++) {
    if (!hits.length) {
      x[i] = W / 2;
      y[i] = H / 2;
      continue;
    }
    const p = hits[(Math.random() * hits.length) | 0];
    x[i] = ((p % cw) + Math.random()) / s;
    y[i] = (Math.floor(p / cw) + Math.random()) / s;
  }
  return { x, y };
}

export class ParticleFilm {
  readonly N: number;
  private ctx: CanvasRenderingContext2D;
  private W = 0;
  private H = 0;
  private dpr = 1;

  private sx: Float32Array;
  private sy: Float32Array;
  private sz: Float32Array;
  private fx: Float32Array;
  private fy: Float32Array;
  private fz: Float32Array;
  private delay: Float32Array;
  private swirl: Float32Array;
  private ex: Float32Array;
  private ey: Float32Array;
  private browser: Points | null = null;
  private word: Points | null = null;

  private bufs: Float32Array[];
  private counts = new Int32Array(BUCKETS);

  // scratch output of stage()
  private ox = 0;
  private oy = 0;
  private oa = 0;
  private os = 0;

  constructor(private canvas: HTMLCanvasElement, touch: boolean) {
    this.ctx = canvas.getContext("2d", { alpha: true, desynchronized: true })!;
    const N = (this.N = touch ? 1500 : 2800);
    this.sx = new Float32Array(N);
    this.sy = new Float32Array(N);
    this.sz = new Float32Array(N);
    this.fx = new Float32Array(N);
    this.fy = new Float32Array(N);
    this.fz = new Float32Array(N);
    this.delay = new Float32Array(N);
    this.swirl = new Float32Array(N);
    this.ex = new Float32Array(N);
    this.ey = new Float32Array(N);
    const golden = Math.PI * (1 + Math.sqrt(5));
    for (let i = 0; i < N; i++) {
      this.sx[i] = Math.random() * 2 - 1;
      this.sy[i] = Math.random() * 2 - 1;
      this.sz[i] = Math.random();
      const phi = Math.acos(1 - (2 * (i + 0.5)) / N);
      const theta = golden * i;
      this.fx[i] = Math.cos(theta) * Math.sin(phi);
      this.fy[i] = Math.cos(phi);
      this.fz[i] = Math.sin(theta) * Math.sin(phi);
      this.delay[i] = Math.random();
      this.swirl[i] = Math.random() * 2 - 1;
    }
    this.bufs = Array.from({ length: BUCKETS }, () => new Float32Array(N * 3));
  }

  resize(W: number, H: number) {
    this.W = W;
    this.H = H;
    const raw = window.devicePixelRatio || 1;
    this.dpr = Math.min(raw, raw > 1 ? 1.25 : 1);
    this.canvas.width = Math.round(W * this.dpr);
    this.canvas.height = Math.round(H * this.dpr);
    this.browser = samplePoints(W, H, this.N, (c) => drawBrowser(c, W, H));
    this.word = samplePoints(W, H, this.N, (c) => drawWord(c, W, H));
    const cx = W / 2;
    const cy = H * 0.44;
    const reach = Math.max(W, H);
    for (let i = 0; i < this.N; i++) {
      const dx = this.word.x[i] - cx + (Math.random() - 0.5) * 40;
      const dy = this.word.y[i] - cy + (Math.random() - 0.5) * 40;
      const len = Math.hypot(dx, dy) || 1;
      const dist = (0.35 + Math.random() * 0.9) * reach;
      this.ex[i] = (dx / len) * dist;
      this.ey[i] = (dy / len) * dist;
    }
  }

  private stage(k: number, i: number, time: number, p: number, ca: number, sa: number) {
    const { W, H } = this;
    switch (k) {
      case 0: {
        let z = this.sz[i] - time * 0.00005 - p * 1.4;
        z -= Math.floor(z);
        z = 0.04 + z * 0.96;
        const f = 0.22 / z;
        this.ox = W / 2 + this.sx[i] * W * 0.5 * f;
        this.oy = H / 2 + this.sy[i] * W * 0.5 * f;
        const near = 1 - z;
        this.oa = clamp(near * 1.3) * clamp((z - 0.04) * 12);
        this.os = 0.7 + near * 2.2;
        return;
      }
      case 1: {
        const R = Math.min(W, H) * 0.34;
        const x0 = this.fx[i];
        const y0 = this.fy[i];
        const z0 = this.fz[i];
        const x1 = x0 * ca + z0 * sa;
        const z1 = -x0 * sa + z0 * ca;
        const ct = Math.cos(TILT);
        const st = Math.sin(TILT);
        const y2 = y0 * ct - z1 * st;
        const z2 = y0 * st + z1 * ct;
        const persp = 1 / (1 + z2 * 0.35);
        const front = 1 - (z2 + 1) / 2;
        this.ox = W / 2 + x1 * R * persp;
        this.oy = H / 2 + y2 * R * persp;
        this.oa = 0.22 + 0.78 * front;
        this.os = 1 + 1.3 * front;
        return;
      }
      case 2: {
        this.ox = this.browser!.x[i];
        this.oy = this.browser!.y[i];
        this.oa = 0.9;
        this.os = 1.5;
        return;
      }
      case 3: {
        this.ox = this.word!.x[i];
        this.oy = this.word!.y[i];
        this.oa = 1;
        this.os = 1.6;
        return;
      }
      default: {
        this.ox = this.word!.x[i] + this.ex[i];
        this.oy = this.word!.y[i] + this.ey[i];
        this.oa = 0;
        this.os = 1.6;
      }
    }
  }

  render(time: number, p: number, dim: number) {
    const { ctx, W, H, N } = this;
    if (!this.browser || !this.word) return;
    ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    ctx.clearRect(0, 0, W, H);

    let from = 0;
    let t = 0;
    for (let k = 0; k < STAGE_WINDOWS.length; k++) {
      const [a, b] = STAGE_WINDOWS[k];
      if (p < a) {
        from = k;
        t = 0;
        break;
      }
      if (p <= b) {
        from = k;
        t = (p - a) / (b - a);
        break;
      }
      from = k + 1;
      t = 0;
    }
    if (from >= STAGE_WINDOWS.length) return;

    const rot = time * 0.00022 + p * 5;
    const ca = Math.cos(rot);
    const sa = Math.sin(rot);
    const counts = this.counts;
    counts.fill(0);

    for (let i = 0; i < N; i++) {
      this.stage(from, i, time, p, ca, sa);
      let x = this.ox;
      let y = this.oy;
      let a = this.oa;
      let s = this.os;
      if (t > 0) {
        const ax = x;
        const ay = y;
        const aa = a;
        const as = s;
        this.stage(from + 1, i, time, p, ca, sa);
        const tt = easeInOutCubic(clamp(t * 1.6 - this.delay[i] * 0.6));
        const dx = this.ox - ax;
        const dy = this.oy - ay;
        const curl = Math.sin(tt * Math.PI) * this.swirl[i] * 0.35;
        x = ax + dx * tt - dy * curl;
        y = ay + dy * tt + dx * curl;
        a = aa + (this.oa - aa) * tt;
        s = as + (this.os - as) * tt;
      }
      if (a <= 0.02) continue;
      const wob = SIN[(time * 0.212 + i * 173) & 1023] * 0.8;
      x += wob;
      y += SIN[(time * 0.18 + i * 97) & 1023] * 0.8;
      if (x < -8 || y < -8 || x > W + 8 || y > H + 8) continue;
      const b = Math.min(BUCKETS - 1, (a * BUCKETS) | 0);
      const buf = this.bufs[b];
      const j = counts[b]++ * 3;
      buf[j] = Math.round(x);
      buf[j + 1] = Math.round(y);
      buf[j + 2] = s;
    }

    ctx.fillStyle = "#fff";
    for (let b = 0; b < BUCKETS; b++) {
      const c = counts[b];
      if (!c) continue;
      ctx.globalAlpha = ((b + 1) / BUCKETS) * dim;
      const buf = this.bufs[b];
      for (let j = 0; j < c; j++) {
        const s = buf[j * 3 + 2];
        ctx.fillRect(buf[j * 3] - s * 0.5, buf[j * 3 + 1] - s * 0.5, s, s);
      }
    }
    ctx.globalAlpha = 1;
  }
}
