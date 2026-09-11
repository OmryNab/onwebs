export const CONFIG = {
  density: 5000,
  sizeScale: 1.5,
  inkScale: 1.0,
  speed: 1.0,
  bokeh: true,
  parallax: true,
  major: 76,
  tick: 5,
  reach: 190,
  ink: "20,22,26",
};

function variantInk(variant) {
  return variant === "dark" ? "240,238,230" : CONFIG.ink;
}

function buildField(w, h, density) {
  const count = Math.round((w * h) / density);
  const specks = [];
  for (let i = 0; i < count; i += 1) {
    const depth = Math.pow(Math.random(), 1.35);
    const big = CONFIG.bokeh && Math.random() < 0.07;
    specks.push({
      d: depth,
      big,
      x: Math.random() * w,
      y: h - Math.pow(Math.random(), 0.72) * h,
      r: (big ? 2.6 + Math.random() * 3.2 : 0.35 + depth * 1.6) * CONFIG.sizeScale,
      a: (big ? 0.035 : 0.04 + depth * 0.16) * CONFIG.inkScale,
      vy: -(0.04 + depth * 0.2) * CONFIG.speed,
      drift: (Math.random() - 0.5) * 0.0011,
      phase: Math.random() * Math.PI * 2,
    });
  }
  return specks;
}

function drawField(ctx, specks, w, h, ink, t, cx, cy, pointer, parallax, animate, tickBase) {
  ctx.clearRect(0, 0, w, h);

  for (const m of specks) {
    if (animate) {
      m.y += m.vy;
      m.x += Math.sin(t * m.drift + m.phase) * 0.3;
      if (m.y < -8) {
        m.y = h + 8;
        m.x = Math.random() * w;
      }
      if (m.x < -8) m.x = w + 8;
      if (m.x > w + 8) m.x = -8;
    }

    const ox = parallax ? m.x - cx * (4 + m.d * 14) : m.x;
    const oy = parallax ? m.y - cy * (2 + m.d * 8) : m.y;

    if (m.big) {
      const g = ctx.createRadialGradient(ox, oy, 0, ox, oy, m.r);
      g.addColorStop(0, `rgba(${ink},${m.a * 1.6})`);
      g.addColorStop(1, `rgba(${ink},0)`);
      ctx.fillStyle = g;
    } else {
      ctx.fillStyle = `rgba(${ink},${m.a})`;
    }
    ctx.beginPath();
    ctx.arc(ox, oy, m.r, 0, Math.PI * 2);
    ctx.fill();
  }

  if (CONFIG.tick <= 0) return;

  ctx.lineCap = "round";
  for (let x = CONFIG.major; x < w; x += CONFIG.major) {
    for (let y = CONFIG.major; y < h; y += CONFIG.major) {
      let alpha = tickBase;
      let arm = CONFIG.tick;
      let f = 0;
      if (pointer) {
        const dist = Math.hypot(pointer.x - x, pointer.y - y);
        if (dist < CONFIG.reach) {
          f = (1 - dist / CONFIG.reach) ** 2;
          alpha += f * 0.55;
          arm *= 1 + f * 0.9;
        }
      }

      ctx.strokeStyle = `rgba(${ink},${alpha})`;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(x - arm, y);
      ctx.lineTo(x + arm, y);
      ctx.moveTo(x, y - arm);
      ctx.lineTo(x, y + arm);
      ctx.stroke();

      if (pointer && f > 0.55) {
        ctx.strokeStyle = `rgba(${ink},${(f - 0.55) * 0.38})`;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(pointer.x, pointer.y);
        ctx.stroke();
      }
    }
  }
}

export function useDustCanvas(wrapper, canvas, getVariant) {
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const ctx = canvas.getContext("2d");
  if (!ctx) return () => {};

  let specks = [];
  let w = 0;
  let h = 0;
  let ink = variantInk(getVariant());
  let parallax = CONFIG.parallax;
  let tickBase = getVariant() === "dark" ? 0.1 : 0.13;
  let pointer = null;
  let cx = 0;
  let cy = 0;
  let raf = 0;
  let visible = true;
  let running = false;

  const rebuild = () => {
    const box = wrapper.getBoundingClientRect();
    w = Math.max(1, Math.round(box.width));
    h = Math.max(1, Math.round(box.height));
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const narrow = w < 768;
    const density = CONFIG.density * (narrow ? 2 : 1);
    parallax = CONFIG.parallax && !narrow;
    ink = variantInk(getVariant());
    tickBase = getVariant() === "dark" ? 0.1 : 0.13;
    specks = buildField(w, h, density);
    drawField(ctx, specks, w, h, ink, 0, 0, 0, pointer, false, false, tickBase);
  };

  const pageWide = wrapper.classList.contains("gdf--page");
  const shouldRun = () => visible && !reduced && !wrapper.classList.contains("is-away");

  const frame = (now) => {
    if (!running) return;
    const targetX = pointer && parallax ? (pointer.x / w) * 2 - 1 : 0;
    const targetY = pointer && parallax ? (pointer.y / h) * 2 - 1 : 0;
    cx += (targetX - cx) * 0.06;
    cy += (targetY - cy) * 0.06;
    drawField(ctx, specks, w, h, ink, now, cx, cy, pointer, parallax, true, tickBase);
    raf = requestAnimationFrame(frame);
  };

  const start = () => {
    if (running || !shouldRun()) return;
    running = true;
    raf = requestAnimationFrame(frame);
  };

  const stop = () => {
    running = false;
    if (raf) cancelAnimationFrame(raf);
    raf = 0;
  };

  const syncLoop = () => {
    const on = shouldRun();
    wrapper.classList.toggle("is-offscreen", !visible || wrapper.classList.contains("is-away"));
    if (on) start();
    else stop();
  };

  const onPointerMove = (e) => {
    const box = wrapper.getBoundingClientRect();
    pointer = { x: e.clientX - box.left, y: e.clientY - box.top };
  };

  const onPointerLeave = () => {
    pointer = null;
  };

  const pointerRoot = pageWide ? window : wrapper;
  pointerRoot.addEventListener("pointermove", onPointerMove);
  pointerRoot.addEventListener("pointerleave", onPointerLeave);

  const ro = new ResizeObserver(() => {
    rebuild();
    if (reduced) {
      drawField(ctx, specks, w, h, ink, 0, 0, 0, null, false, false, tickBase);
    }
  });
  ro.observe(wrapper);

  const io = new IntersectionObserver(
    ([entry]) => {
      visible = !!entry?.isIntersecting;
      syncLoop();
    },
    { rootMargin: "150px" },
  );
  io.observe(wrapper);

  const mo = new MutationObserver(syncLoop);
  mo.observe(wrapper, { attributes: true, attributeFilter: ["class", "data-gdf-variant"] });

  rebuild();
  if (reduced) {
    wrapper.classList.add("is-static");
    drawField(ctx, specks, w, h, ink, 0, 0, 0, null, false, false, tickBase);
  } else {
    syncLoop();
  }

  return () => {
    stop();
    ro.disconnect();
    io.disconnect();
    mo.disconnect();
    pointerRoot.removeEventListener("pointermove", onPointerMove);
    pointerRoot.removeEventListener("pointerleave", onPointerLeave);
  };
}
