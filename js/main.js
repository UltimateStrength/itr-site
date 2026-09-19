(() => {
  "use strict";

  const app = document.getElementById("app");
  const navToggle = document.getElementById("navToggle");
  const navOverlay = document.getElementById("navOverlay");
  const navLinks = Array.from(document.querySelectorAll("[data-route]"));

  const ROUTES = {
    "/": "pages/home.html",
    "/app": "pages/app-screens.html",
    "/historia": "pages/historia.html",
    "/slides": "pages/slides.html",
    "/contato": "pages/contato.html",
  };

  const cache = new Map();

  async function loadRoute(path) {
    if (cache.has(path)) return cache.get(path);
    const res = await fetch(ROUTES[path], { cache: "no-cache" });
    const html = await res.text();
    cache.set(path, html);
    return html;
  }

  function setActiveNav(path) {
    navLinks.forEach((a) => {
      if (a.dataset.route === path) a.setAttribute("aria-current", "page");
      else a.removeAttribute("aria-current");
    });
  }

  function closeNav() {
    navOverlay.classList.remove("is-open");
    navToggle.setAttribute("aria-expanded", "false");
    document.body.style.overflow = "";
  }

  async function renderRoute(path, { skipScroll = false } = {}) {
    const target = ROUTES[path] ? path : "/";
    const html = await loadRoute(target);

    const apply = () => {
      const view = document.createElement("div");
      view.className = "view";
      view.innerHTML = html;

      app.replaceChildren(view);
      app.classList.remove("is-entering");
      // restart entrance animation on fallback path (no View Transitions API)
      requestAnimationFrame(() => app.classList.add("is-entering"));
      setActiveNav(target);
      initContactTabs();
      initCopyButtons();
      if (!skipScroll) app.focus({ preventScroll: false });
    };

    if (document.startViewTransition) {
      app.style.viewTransitionName = "app-view";
      document.startViewTransition(() => apply());
    } else {
      apply();
    }
  }

  function navigate(path, { push = true } = {}) {
    if (push) history.pushState({}, "", `#${path}`);
    renderRoute(path);
    closeNav();
  }

  navToggle.addEventListener("click", () => {
    const open = navOverlay.classList.toggle("is-open");
    navToggle.setAttribute("aria-expanded", String(open));
    document.body.style.overflow = open ? "hidden" : "";
  });

  navLinks.forEach((a) => {
    a.addEventListener("click", (e) => {
      e.preventDefault();
      navigate(a.dataset.route);
    });
  });

  window.addEventListener("popstate", () => {
    const path = location.hash.replace("#", "") || "/";
    renderRoute(path, { skipScroll: true });
  });

  // ---- contact tabs (re-bound after every route render) ----
  function initContactTabs() {
    const tabs = document.querySelectorAll(".contact-tab");
    if (!tabs.length) return;
    tabs.forEach((tab) => {
      tab.addEventListener("click", () => {
        tabs.forEach((t) => t.setAttribute("aria-selected", "false"));
        tab.setAttribute("aria-selected", "true");
        document.querySelectorAll(".contact-panel").forEach((p) => (p.hidden = true));
        const panel = document.getElementById(tab.getAttribute("aria-controls"));
        if (panel) panel.hidden = false;
      });
    });
  }

  // ---- copy-to-clipboard (re-bound after every route render) ----
  function initCopyButtons() {
    document.querySelectorAll(".copy-btn").forEach((btn) => {
      btn.addEventListener("click", async () => {
        const row = btn.closest(".copy-row");
        const valueEl = row.querySelector("[data-copy-value]");
        const text = valueEl.dataset.copyValue;
        try {
          await navigator.clipboard.writeText(text);
        } catch (err) {
          // fallback for older browsers / non-secure context
          const ta = document.createElement("textarea");
          ta.value = text;
          document.body.appendChild(ta);
          ta.select();
          document.execCommand("copy");
          ta.remove();
        }
        btn.classList.add("copied");
        const img = btn.querySelector("img");
        const prevSrc = img.src;
        img.src = "assets/img/icons/check.svg";
        setTimeout(() => {
          btn.classList.remove("copied");
          img.src = prevSrc;
        }, 1600);
      });
    });
  }

  // ---- boot ----
  const initialPath = location.hash.replace("#", "") || "/";
  renderRoute(initialPath, { skipScroll: true });
})();
