(function () {
  if (document.querySelector(".site-loader")) return;

  document.documentElement.classList.add("site-loader-lock");

  const MIN_MS = 3200;
  const HARD_MS = 4500;

  const root = document.createElement("div");
  root.className = "site-loader";
  root.setAttribute("role", "status");
  root.innerHTML =
    '<span class="site-loader__sr">טוען</span>' +
    '<div class="site-loader__visuals" aria-hidden="true">' +
    '<div class="site-loader__logo-wrap">' +
    '<svg class="site-loader__logo" viewBox="0 0 280 52" xmlns="http://www.w3.org/2000/svg">' +
    '<text x="140" y="41" text-anchor="middle">ONWEBS</text>' +
    "</svg>" +
    "</div>" +
    '<div class="site-loader__bar"><div class="site-loader__fill"></div></div>' +
    "</div>";

  if (document.body.firstChild) {
    document.body.insertBefore(root, document.body.firstChild);
  } else {
    document.body.appendChild(root);
  }

  const fill = root.querySelector(".site-loader__fill");
  let finished = false;

  function waitForLoad() {
    const windowLoad = new Promise(function (resolve) {
      if (document.readyState === "complete") resolve();
      else window.addEventListener("load", resolve, { once: true });
    });
    const fonts =
      document.fonts && document.fonts.ready
        ? document.fonts.ready.catch(function () {})
        : Promise.resolve();
    const minimum = new Promise(function (resolve) {
      window.setTimeout(resolve, MIN_MS);
    });
    return Promise.all([windowLoad, fonts, minimum]);
  }

  function dismiss() {
    if (finished) return;
    finished = true;
    fill.classList.add("is-complete");
    window.setTimeout(function () {
      root.classList.add("is-leaving");
      window.dispatchEvent(new Event("site-loader:done"));
      window.setTimeout(function () {
        root.remove();
        document.documentElement.classList.remove("site-loader-lock");
      }, 500);
    }, 320);
  }

  waitForLoad().then(dismiss);
  window.setTimeout(dismiss, HARD_MS);
})();
