/* PSTCSL v4.0 — JavaScript */
"use strict";

const $ = (s, ctx = document) => ctx.querySelector(s);
const $$ = (s, ctx = document) => [...ctx.querySelectorAll(s)];
const esc = (str) => {
  const d = document.createElement("div");
  d.appendChild(document.createTextNode(str));
  return d.innerHTML;
};

/* ================================================================
   PRELOADER
   ================================================================ */
function initPreloader() {
  const pl = $("#preloader");
  if (!pl) return;
  window.addEventListener("load", () => {
    setTimeout(() => pl.classList.add("done"), 1800);
  });
}

/* ================================================================
   TOAST
   ================================================================ */
function showToast(msg, type = "success", dur = 4500) {
  const t = $("#toast");
  if (!t) return;
  t.textContent = (type === "success" ? "✓  " : "✕  ") + msg;
  t.className = `toast show ${type}`;
  clearTimeout(showToast._t);
  showToast._t = setTimeout(() => t.classList.remove("show"), dur);
}

/* ================================================================
   THEME
   ================================================================ */
class ThemeManager {
  constructor() {
    this.btn = $("#themeBtn");
    this.current = localStorage.getItem("pstcsl_theme") || "light";
    this.apply(this.current);
    this.btn?.addEventListener("click", () => this.toggle());
  }
  apply(t) {
    document.documentElement.setAttribute("data-theme", t);
    this.current = t;
    localStorage.setItem("pstcsl_theme", t);
  }
  toggle() {
    this.apply(this.current === "light" ? "dark" : "light");
  }
}

/* ================================================================
   NAVIGATION
   ================================================================ */
class Navigation {
  constructor() {
    this.header = $("#siteHeader");
    this.topBar = $(".header-top-bar");
    this.navLinks = $("#navLinks");
    this.hamburger = $("#hamburger");
    this.links = $$(".nav-link");
    this.backTop = $("#backTop");
    this.lastY = 0;
    this.init();
  }
  init() {
    this.hamburger?.addEventListener("click", () => {
      const open = this.navLinks.classList.toggle("open");
      this.hamburger.classList.toggle("open", open);
    });
    this.links.forEach((l) =>
      l.addEventListener("click", () => {
        this.navLinks.classList.remove("open");
        this.hamburger?.classList.remove("open");
      }),
    );
    document.addEventListener("click", (e) => {
      if (
        this.navLinks.classList.contains("open") &&
        !e.target.closest(".nav-links") &&
        !e.target.closest(".hamburger")
      ) {
        this.navLinks.classList.remove("open");
        this.hamburger?.classList.remove("open");
      }
    });
    $$('a[href^="#"]').forEach((a) => {
      a.addEventListener("click", (e) => {
        const id = a.getAttribute("href");
        if (id === "#") return;
        const target = $(id);
        if (!target) return;
        e.preventDefault();
        const navH = this.header?.offsetHeight || 72;
        const topH =
          window.innerWidth > 768 ? this.topBar?.offsetHeight || 36 : 0;
        const top =
          target.getBoundingClientRect().top + window.scrollY - navH - topH;
        window.scrollTo({ top, behavior: "smooth" });
      });
    });
    this.backTop?.addEventListener("click", () =>
      window.scrollTo({ top: 0, behavior: "smooth" }),
    );
    window.addEventListener("scroll", () => this.onScroll(), { passive: true });
    this.onScroll();
  }
  onScroll() {
    const y = window.scrollY;
    this.header?.classList.toggle("scrolled", y > 50);
    this.backTop?.classList.toggle("visible", y > 300);
    // Hide top bar when scrolling down
    if (this.topBar) {
      this.topBar.classList.toggle("hidden", y > 100);
      this.header?.classList.toggle("top-hidden", y > 100);
    }
    // Active link
    let current = "";
    $$("section[id]").forEach((s) => {
      if (s.offsetTop - 120 <= y) current = s.id;
    });
    this.links.forEach((l) =>
      l.classList.toggle("active", l.getAttribute("href") === `#${current}`),
    );
    this.lastY = y;
  }
}

/* ================================================================
   HERO SLIDER — COMPLETE REWRITE
   Key: background images applied directly to .slide-bg elements
   using inline style from HTML. We just toggle .active class.
   ================================================================ */
class HeroSlider {
  constructor() {
    this.slides = $$(".hero-slide");
    this.dots = $$(".si-dot");
    this.prevBtn = $("#slidePrev");
    this.nextBtn = $("#slideNext");
    this.progressBar = $("#slideProgressBar");
    this.current = 0;
    this.DURATION = 2000;
    this.timer = null;
    this.progressTimer = null;
    this.progressStart = null;
    if (!this.slides.length) return;
    this.init();
  }

  init() {
    // Ensure first slide is properly active
    this.slides.forEach((s, i) => {
      s.classList.toggle("active", i === 0);
    });
    this.dots.forEach((d, i) => d.classList.toggle("active", i === 0));

    this.prevBtn?.addEventListener("click", () => {
      this.clear();
      this.go(this.current - 1);
      this.start();
    });
    this.nextBtn?.addEventListener("click", () => {
      this.clear();
      this.go(this.current + 1);
      this.start();
    });
    this.dots.forEach((d, i) =>
      d.addEventListener("click", () => {
        this.clear();
        this.go(i);
        this.start();
      }),
    );

    // Pause on hover
    const wrapper = $(".hero-slides");
    wrapper?.addEventListener("mouseenter", () => this.clear());
    wrapper?.addEventListener("mouseleave", () => this.start());

    // Touch/swipe support
    let touchX = 0;
    wrapper?.addEventListener(
      "touchstart",
      (e) => {
        touchX = e.changedTouches[0].clientX;
      },
      { passive: true },
    );
    wrapper?.addEventListener(
      "touchend",
      (e) => {
        const diff = touchX - e.changedTouches[0].clientX;
        if (Math.abs(diff) > 50) {
          this.clear();
          this.go(this.current + (diff > 0 ? 1 : -1));
          this.start();
        }
      },
      { passive: true },
    );

    this.start();
  }

  go(index) {
    const total = this.slides.length;
    const next = ((index % total) + total) % total;
    if (next === this.current) return;

    // Remove active from current
    this.slides[this.current].classList.remove("active");
    this.dots[this.current]?.classList.remove("active");

    this.current = next;

    // Add active to new slide
    this.slides[this.current].classList.add("active");
    this.dots[this.current]?.classList.add("active");

    // Reset progress
    this.resetProgress();
  }

  resetProgress() {
    if (!this.progressBar) return;
    this.progressBar.style.width = "0%";
    this.progressBar.style.transition = "none";
    // Force reflow
    this.progressBar.getBoundingClientRect();
    this.progressBar.style.transition = `width ${this.DURATION}ms linear`;
    this.progressBar.style.width = "100%";
  }

  start() {
    this.clear();
    this.resetProgress();
    this.timer = setInterval(() => this.go(this.current + 1), this.DURATION);
  }

  clear() {
    clearInterval(this.timer);
    if (this.progressBar) {
      this.progressBar.style.transition = "none";
      this.progressBar.style.width = "0%";
    }
  }
}

/* ================================================================
   COUNTER ANIMATION
   ================================================================ */
class CounterAnimation {
  constructor() {
    this.els = $$(".sc-num[data-count]");
    this.animated = false;
    this.observe();
  }
  observe() {
    const bar = $(".hero-stats-bar");
    if (!bar || !("IntersectionObserver" in window)) {
      this.run();
      return;
    }
    const obs = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !this.animated) {
          this.animated = true;
          this.run();
          obs.disconnect();
        }
      },
      { threshold: 0.5 },
    );
    obs.observe(bar);
  }
  run() {
    this.els.forEach((el) => {
      const target = parseInt(el.dataset.count, 10);
      const dur = 1800;
      const start = performance.now();
      const update = (now) => {
        const prog = Math.min((now - start) / dur, 1);
        const ease = 1 - Math.pow(1 - prog, 3);
        el.textContent = Math.round(ease * target).toLocaleString();
        if (prog < 1) requestAnimationFrame(update);
      };
      requestAnimationFrame(update);
    });
  }
}

/* ================================================================
   SCROLL REVEAL
   ================================================================ */
class ScrollReveal {
  constructor() {
    const els = $$("[data-reveal]");
    if (!("IntersectionObserver" in window)) {
      els.forEach((el) => el.classList.add("revealed"));
      return;
    }
    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add("revealed");
            obs.unobserve(e.target);
          }
        });
      },
      { threshold: 0.06, rootMargin: "0px 0px -40px 0px" },
    );
    els.forEach((el) => obs.observe(el));
  }
}

/* ================================================================
   GALLERY FILTER
   ================================================================ */
class GalleryFilter {
  constructor() {
    this.btns = $$(".gfilter");
    this.items = $$(".gallery-item");
    this.btns.forEach((btn) =>
      btn.addEventListener("click", () => this.filter(btn)),
    );
  }
  filter(btn) {
    const cat = btn.dataset.filter;
    this.btns.forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");
    this.items.forEach((item) =>
      item.classList.toggle(
        "hidden",
        cat !== "all" && item.dataset.cat !== cat,
      ),
    );
  }
}

/* ================================================================
   EXECUTIVES TABS
   ================================================================ */
class ExecutivesTabs {
  constructor() {
    this.tabs = $$(".exec-tab");
    this.panels = $$(".tab-panel");
    this.stateEl = $("#stateSelect");
    this.lgaState = $("#lgaStateSelect");
    this.lgaEl = $("#lgaSelect");
    this.data = this.getData();
    this.init();
  }
  init() {
    this.tabs.forEach((t) =>
      t.addEventListener("click", () => this.switchTab(t)),
    );
    this.stateEl?.addEventListener("change", (e) =>
      this.renderState(e.target.value),
    );
    this.lgaState?.addEventListener("change", (e) => {
      this.populateLGAs(e.target.value);
      this.renderLGA(e.target.value, "");
    });
    this.lgaEl?.addEventListener("change", (e) =>
      this.renderLGA(this.lgaState.value, e.target.value),
    );
  }
  switchTab(tab) {
    const id = tab.dataset.tab;
    this.tabs.forEach((t) => t.classList.remove("active"));
    this.panels.forEach((p) => p.classList.remove("active"));
    tab.classList.add("active");
    $(`#tab-${id}`)?.classList.add("active");
  }
  renderState(state) {
    const c = $("#stateExecutives");
    if (!c) return;
    if (!state) {
      c.innerHTML =
        '<div class="exec-placeholder"><p>Select a state to view its executives.</p></div>';
      return;
    }
    const execs = this.data.state[state];
    if (!execs?.length) {
      c.innerHTML =
        '<div class="exec-placeholder"><p>No executives registered for this state yet.</p></div>';
      return;
    }
    c.innerHTML = execs.map((e) => this.cardHTML(e)).join("");
  }
  populateLGAs(state) {
    if (!this.lgaEl) return;
    const lgas = this.data.lgas[state] || [];
    this.lgaEl.innerHTML =
      '<option value="">Choose an LGA…</option>' +
      lgas.map((l) => `<option value="${l}">${l}</option>`).join("");
  }
  renderLGA(state, lga) {
    const c = $("#lgaExecutives");
    if (!c) return;
    if (!state) {
      c.innerHTML =
        '<div class="exec-placeholder"><p>Select a state and LGA.</p></div>';
      return;
    }
    if (!lga) {
      c.innerHTML =
        '<div class="exec-placeholder"><p>Select an LGA to view executives.</p></div>';
      return;
    }
    const execs = this.data.lga[`${state}::${lga}`];
    if (!execs?.length) {
      c.innerHTML =
        '<div class="exec-placeholder"><p>No executives registered for this LGA yet.</p></div>';
      return;
    }
    c.innerHTML = execs.map((e) => this.cardHTML(e)).join("");
  }
  cardHTML(e) {
    return `<div class="exec-card">
      <div class="exec-photo"><div class="exec-photo-placeholder">${e.name
        .split(" ")
        .map((w) => w[0])
        .slice(0, 2)
        .join("")}</div></div>
      <div class="exec-info">
        <div class="exec-role-badge">${e.position}</div>
        <h3>${e.name}</h3>
        <p>${e.description}</p>
      </div>
    </div>`;
  }
  getData() {
    return {
      state: {
        lagos: [
          {
            name: "Mrs. Olufunke Akinlade",
            position: "Lagos State President",
            description:
              "Leading teacher advocacy across Lagos State with focus on welfare reform and professional development.",
          },
          {
            name: "Mr. Tunde Bakare",
            position: "State Secretary",
            description:
              "Coordinating state-level operations and member communications.",
          },
          {
            name: "Mrs. Ngozi Okonkwo",
            position: "State Treasurer",
            description: "Managing financial operations for the Lagos chapter.",
          },
        ],
        rivers: [
          {
            name: "Dr. Chidi Amadi",
            position: "Rivers State President",
            description:
              "Championing teacher rights and professional development in Rivers State.",
          },
          {
            name: "Mrs. Blessing Wike",
            position: "State Secretary",
            description:
              "Organising advocacy programs and member engagement activities.",
          },
        ],
        kano: [
          {
            name: "Malam Yusuf Ibrahim",
            position: "Kano State President",
            description:
              "Promoting educational excellence and teacher welfare in Kano.",
          },
          {
            name: "Mrs. Hauwa Abdullahi",
            position: "State Secretary",
            description:
              "Managing state operations and policy advocacy initiatives.",
          },
        ],
        abuja: [
          {
            name: "Dr. Sarah Okafor",
            position: "FCT President",
            description:
              "Leading teacher welfare initiatives in the Federal Capital Territory.",
          },
          {
            name: "Mr. Daniel Ezekiel",
            position: "FCT Secretary",
            description:
              "Coordinating with federal authorities on education policy.",
          },
        ],
      },
      lgas: {
        lagos: [
          "Ikeja",
          "Surulere",
          "Alimosho",
          "Eti-Osa",
          "Ikorodu",
          "Lagos Island",
        ],
        rivers: ["Port Harcourt", "Obio-Akpor", "Eleme", "Khana", "Bonny"],
        kano: ["Kano Municipal", "Gwale", "Fagge", "Dala", "Nassarawa"],
        abuja: [
          "Municipal Area Council",
          "Gwagwalada",
          "Kuje",
          "Abaji",
          "Bwari",
          "Kwali",
        ],
      },
      lga: {
        "lagos::Ikeja": [
          {
            name: "Mr. Ademola Johnson",
            position: "Ikeja LGA Chairman",
            description: "Local coordination of teacher welfare programs.",
          },
          {
            name: "Mrs. Funmi Adeyemi",
            position: "LGA Secretary",
            description:
              "Managing local chapter activities and member support.",
          },
        ],
        "lagos::Surulere": [
          {
            name: "Mrs. Adeola Bello",
            position: "Surulere LGA Chairman",
            description: "Grassroots advocacy for teacher rights and fair pay.",
          },
        ],
        "rivers::Port Harcourt": [
          {
            name: "Chief Emmanuel George",
            position: "Port Harcourt LGA Chairman",
            description: "Community-level teacher support and advocacy.",
          },
          {
            name: "Mrs. Joy Okoro",
            position: "LGA Secretary",
            description: "Local operations and member engagement.",
          },
        ],
      },
    };
  }
}

/* ================================================================
   MEMBERSHIP MANAGER
   ================================================================ */
class MembershipManager {
  constructor() {
    this.form = $("#membershipForm");
    this.membersList = $("#membersList");
    this.countBadge = $("#memberCount");
    this.searchInput = $("#searchMembers");
    this.filterState = $("#filterState");
    this.members = this.load();
    if (!this.form) return;
    this.init();
  }
  init() {
    [
      ["passportPhoto", "passportPreview"],
      ["staffId", "staffIdPreview"],
      ["idCard", "idCardPreview"],
    ].forEach(([id, pid]) => this.setupUpload(id, pid));
    $$(".upload-zone").forEach((zone) => {
      zone.addEventListener("dragover", (e) => {
        e.preventDefault();
        zone.classList.add("drag-over");
      });
      zone.addEventListener("dragleave", () =>
        zone.classList.remove("drag-over"),
      );
      zone.addEventListener("drop", (e) => {
        e.preventDefault();
        zone.classList.remove("drag-over");
        const input = zone.querySelector(".upload-input");
        if (!input || !e.dataTransfer.files.length) return;
        const dt = new DataTransfer();
        dt.items.add(e.dataTransfer.files[0]);
        input.files = dt.files;
        input.dispatchEvent(new Event("change", { bubbles: true }));
      });
    });
    this.form.addEventListener("submit", (e) => this.handleSubmit(e));
    this.searchInput?.addEventListener("input", () => this.render());
    this.filterState?.addEventListener("change", () => this.render());
    this.populateStateFilter();
    this.render();
  }
  setupUpload(inputId, previewId) {
    const input = $(`#${inputId}`);
    const preview = $(`#${previewId}`);
    if (!input || !preview) return;
    input.addEventListener("change", () => {
      const file = input.files[0];
      preview.innerHTML = "";
      if (!file) return;
      if (file.size > 5 * 1024 * 1024) {
        showToast("File too large — maximum 5MB.", "error");
        input.value = "";
        return;
      }
      const render = (src) => {
        const isImg = file.type.startsWith("image/");
        preview.innerHTML = `<div class="preview-item">${isImg ? `<img src="${src}" alt="Preview"/>` : ""}<span>${esc(file.name.length > 26 ? file.name.slice(0, 26) + "…" : file.name)}</span><button type="button" class="preview-remove" aria-label="Remove">✕</button></div>`;
        preview
          .querySelector(".preview-remove")
          ?.addEventListener("click", () => {
            input.value = "";
            preview.innerHTML = "";
          });
      };
      if (file.type.startsWith("image/")) {
        const r = new FileReader();
        r.onload = (e) => render(e.target.result);
        r.readAsDataURL(file);
      } else render("");
    });
  }
  validate() {
    let valid = true;
    $$(".field-error", this.form).forEach((e) => (e.textContent = ""));
    $$(".error", this.form).forEach((e) => e.classList.remove("error"));
    this.form.querySelectorAll("[required]").forEach((field) => {
      if (field.type === "checkbox") return;
      if (!field.value.trim()) {
        valid = false;
        field.classList.add("error");
        const err = field.closest(".field")?.querySelector(".field-error");
        if (err) err.textContent = "This field is required.";
      }
    });
    const email = $("#email");
    if (email?.value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value)) {
      valid = false;
      email.classList.add("error");
      const err = email.closest(".field")?.querySelector(".field-error");
      if (err) err.textContent = "Please enter a valid email address.";
    }
    if ($("#passportPhoto")?.files.length && !$("#photoConsent")?.checked) {
      showToast("Please give consent for your passport photo.", "error");
      valid = false;
    }
    if (!$("#termsAccept")?.checked) {
      showToast("Please accept the Terms and Conditions.", "error");
      valid = false;
    }
    if (!valid)
      this.form
        .querySelector(".error")
        ?.scrollIntoView({ behavior: "smooth", block: "center" });
    return valid;
  }
  handleSubmit(e) {
    e.preventDefault();
    if (!this.validate()) return;
    const fd = new FormData(this.form);
    const member = {
      id: Date.now(),
      fullName: fd.get("fullName"),
      email: fd.get("email"),
      phone: fd.get("phone"),
      teachingLevel: fd.get("teachingLevel"),
      state: fd.get("state"),
      lga: fd.get("lga"),
      school: fd.get("school"),
      yearsExperience: fd.get("yearsExperience"),
      qualification: fd.get("qualification"),
      trcn: fd.get("trcn"),
      idType: fd.get("idType"),
      idNumber: fd.get("idNumber"),
      registeredAt: new Date().toISOString(),
    };
    this.members.push(member);
    this.save();
    this.render();
    this.populateStateFilter();
    this.form.reset();
    $$(".upload-preview", this.form).forEach((p) => (p.innerHTML = ""));
    $$(".field-error", this.form).forEach((e) => (e.textContent = ""));
    showToast(
      `Welcome, ${member.fullName.split(" ")[0]}! Registration successful 🎉`,
    );
    $(".members-panel")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }
  render() {
    const search = (this.searchInput?.value || "").toLowerCase().trim();
    const state = this.filterState?.value || "";
    const filtered = this.members.filter(
      (m) =>
        (!search ||
          m.fullName.toLowerCase().includes(search) ||
          m.school.toLowerCase().includes(search) ||
          m.state.toLowerCase().includes(search)) &&
        (!state || m.state === state),
    );
    if (this.countBadge) this.countBadge.textContent = this.members.length;
    if (!filtered.length) {
      this.membersList.innerHTML = `<div class="empty-members"><div class="empty-icon">${this.members.length ? "🔍" : "🏫"}</div><p>${this.members.length ? "No members match your search." : "No members yet — be the first to join!"}</p></div>`;
      return;
    }
    this.membersList.innerHTML = filtered
      .map(
        (m) => `
      <div class="member-card">
        <h4>${esc(m.fullName)}</h4>
        <div class="member-tags">
          <span class="member-tag">📍 ${esc(m.state)}</span>
          <span class="member-tag">🏫 ${esc(m.school)}</span>
          <span class="member-tag">📚 ${this.lvl(m.teachingLevel)}</span>
          <span class="member-tag">🎓 ${esc(m.qualification)}</span>
          <span class="member-tag">✅ Verified</span>
        </div>
      </div>`,
      )
      .join("");
  }
  populateStateFilter() {
    if (!this.filterState) return;
    const cur = this.filterState.value;
    const states = [...new Set(this.members.map((m) => m.state))].sort();
    this.filterState.innerHTML =
      '<option value="">All States</option>' +
      states
        .map(
          (s) =>
            `<option value="${s}"${s === cur ? " selected" : ""}>${s}</option>`,
        )
        .join("");
  }
  lvl(v) {
    return (
      {
        "early-childhood": "Early Childhood",
        primary: "Primary",
        secondary: "Secondary",
      }[v] ||
      v ||
      "—"
    );
  }
  load() {
    try {
      return JSON.parse(localStorage.getItem("pstcsl_members") || "[]");
    } catch {
      return [];
    }
  }
  save() {
    localStorage.setItem("pstcsl_members", JSON.stringify(this.members));
  }
}

/* ================================================================
   CONTACT FORM
   ================================================================ */
class ContactForm {
  constructor() {
    this.form = $("#contactForm");
    this.form?.addEventListener("submit", (e) => this.handleSubmit(e));
  }
  handleSubmit(e) {
    e.preventDefault();
    const btn = $('button[type="submit"]', this.form);
    if (btn) {
      btn.disabled = true;
      btn.textContent = "Sending…";
    }
    setTimeout(() => {
      this.form.reset();
      if (btn) {
        btn.disabled = false;
        btn.textContent = "Send Message";
      }
      showToast("Thank you! We'll get back to you shortly.");
    }, 1200);
  }
}

/* ================================================================
   PARTNER LOGOS HOVER EFFECT
   ================================================================ */
function initPartnerHover() {
  $$(".partner-logo-card").forEach((card) => {
    card.addEventListener("mouseenter", () =>
      card.style.setProperty("--hover", "1"),
    );
    card.addEventListener("mouseleave", () =>
      card.style.setProperty("--hover", "0"),
    );
  });
}

/* ================================================================
   INIT
   ================================================================ */
document.addEventListener("DOMContentLoaded", () => {
  initPreloader();
  new ThemeManager();
  new Navigation();
  new HeroSlider();
  new CounterAnimation();
  new ScrollReveal();
  new GalleryFilter();
  new ExecutivesTabs();
  new MembershipManager();
  new ContactForm();
  initPartnerHover();
  console.log(
    "%cPSTCSL v4.0 — International Standard ✓",
    "color:#2d6a4f;font-weight:bold;font-size:13px;",
  );
});
