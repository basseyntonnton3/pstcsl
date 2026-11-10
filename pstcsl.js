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
    this.DURATION = 7000;
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
    this.lightbox = $("#galleryLightbox");
    this.lightboxImage = $("#galleryLightboxImage");
    this.lightboxCaption = $("#galleryLightboxCaption");
    this.activeImage = null;
    this.btns.forEach((btn) =>
      btn.addEventListener("click", () => this.filter(btn)),
    );
    this.items.forEach((item) => {
      const image = $("img", item);
      if (!image) return;
      image.tabIndex = 0;
      image.setAttribute("role", "button");
      image.setAttribute("aria-label", `Expand image: ${image.alt}`);
      image.addEventListener("click", () => this.openImage(item, image));
      image.addEventListener("keydown", (event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          this.openImage(item, image);
        }
      });
    });
    this.lightbox?.addEventListener("click", (event) => {
      if (event.target === this.lightbox) this.lightbox.close();
    });
    this.lightbox?.addEventListener("close", () => {
      this.activeImage?.focus();
      this.activeImage = null;
    });
  }
  filter(btn) {
    const cat = btn.dataset.filter;
    this.btns.forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");
    this.items.forEach((item) => {
      const categories = item.dataset.cat.split(/\s+/);
      item.classList.toggle(
        "hidden",
        cat !== "all" && !categories.includes(cat),
      );
    });
  }
  openImage(item, image) {
    if (!this.lightbox || !this.lightboxImage || !this.lightboxCaption) return;
    this.activeImage = image;
    this.lightboxImage.src = image.currentSrc || image.src;
    this.lightboxImage.alt = image.alt;
    this.lightboxCaption.replaceChildren();
    const heading = $("h4", item);
    const description = $("p", item);
    if (heading) {
      const title = document.createElement("h2");
      title.textContent = heading.textContent;
      this.lightboxCaption.append(title);
    }
    if (description) {
      const caption = document.createElement("p");
      caption.textContent = description.textContent.trim();
      this.lightboxCaption.append(caption);
    }
    this.lightbox.showModal();
  }
}

/* ================================================================
   EXECUTIVES TABS
   ================================================================ */
const NIGERIAN_ADMINISTRATIVE_AREAS = [
  { name: "Abia State", lgas: "Aba North|Aba South|Arochukwu|Bende|Ikwuano|Isiala Ngwa North|Isiala Ngwa South|Isiukwuato|Obingwa|Ohafia|Osisioma|Ugwunagbo|Ukwa East|Ukwa West|Umuahia North|Umuahia South|Umu Nneochi" },
  { name: "Adamawa State", lgas: "Demsa|Fufore|Ganye|Gayuk|Gombi|Grie|Hong|Jada|Lamurde|Madagali|Maiha|Mayo-Belwa|Michika|Mubi North|Mubi South|Numana|Shelleng|Song|Toungo|Yola North|Yola South" },
  { name: "Akwa Ibom State", lgas: "Abak|Eastern Obolo|Eket|Esit Eket|Essien Udim|Etim Ekpo|Etinan|Ibeno|Ibesikpo Asutan|Ibiono Ibom|Ika|Ikono|Ikot Abasi|Ikot Ekpene|Ini|Itu|Mbo|Mkpat Enin|Nsit Atai|Nsit Ibom|Nsit Ubium|Obot Akara|Okobo|Onna|Oron|Oruk Anam|Udung Uko|Ukanafun|Uruan|Urue-Offong/Oruko|Uyo" },
  { name: "Anambra State", lgas: "Aguata|Awka North|Awka South|Anambra East|Anambra West|Anaocha|Ayamelum|Dunukofia|Ekwusigo|Idemili North|Idemili South|Ihiala|Njikoka|Nnewi North|Nnewi South|Ogbaru|Onitsha North|Onitsha South|Orumba North|Orumba South|Oyi" },
  { name: "Bauchi State", lgas: "Alkaleri|Bauchi|Bogoro|Damban|Darazo|Dass|Gamawa|Ganjuwa|Giade|Itas/Gadau|Jama'are|Katagum|Kirfi|Misau|Ningi|Shira|Tafawa Balewa|Toro|Warji|Zaki" },
  { name: "Bayelsa State", lgas: "Brass|Ekeremor|Kolokuma/Opokuma|Nembe|Ogbia|Sagbama|Southern Ijaw|Yenagoa" },
  { name: "Benue State", lgas: "Ado|Agatu|Apa|Buruku|Gboko|Guma|Gwer East|Gwer West|Katsina-Ala|Konshisha|Kwande|Logo|Makurdi|Obi|Ogbadibo|Ohimini|Oju|Okpokwu|Otukpo|Tarka|Ukum|Ushongo|Vandeikya" },
  { name: "Borno State", lgas: "Abadam|Askira/Uba|Bama|Bayo|Biu|Chibok|Damboa|Dikwa|Gubio|Guzamala|Gwoza|Hawul|Jere|Kaga|Kala/Balge|Konduga|Kukawa|Kwaya Kusar|Mafa|Magumeri|Maiduguri|Marte|Mobbar|Monguno|Ngala|Nganzai|Shani" },
  { name: "Cross River State", lgas: "Abi|Akamkpa|Akpabuyo|Bakassi|Bekwarra|Biase|Boki|Calabar Municipal|Calabar South|Etung|Ikom|Obanliku|Obubra|Obudu|Odukpani|Ogoja|Yakurr|Yala" },
  { name: "Delta State", lgas: "Aniocha North|Aniocha South|Bomadi|Burutu|Ethiope East|Ethiope West|Ika North East|Ika South|Isoko North|Isoko South|Ndokwa East|Ndokwa West|Okpe|Oshimili North|Oshimili South|Patani|Sapele|Udu|Ughelli North|Ughelli South|Ukwuani|Uvwie|Warri North|Warri South|Warri South West" },
  { name: "Ebonyi State", lgas: "Abakaliki|Afikpo North|Afikpo South|Ebonyi|Ezza North|Ezza South|Ikwo|Ishielu|Ivo|Izzi|Ohaozara|Ohaukwu|Onicha" },
  { name: "Edo State", lgas: "Akoko-Edo|Egor|Esan Central|Esan North-East|Esan South-East|Esan West|Etsako Central|Etsako East|Etsako West|Igueben|Ikpoba-Okha|Oredo|Orhionmwon|Ovia North-East|Ovia South-West|Owan East|Owan West|Uhunmwonde" },
  { name: "Ekiti State", lgas: "Ado Ekiti|Efon|Ekiti East|Ekiti South-West|Ekiti West|Emure|Gbonyin|Ido/Osi|Ijero|Ikere|Ikole|Ilejemeje|Irepodun/Ifelodun|Ise/Orun|Moba|Oye" },
  { name: "Enugu State", lgas: "Aninri|Awgu|Enugu East|Enugu North|Enugu South|Ezeagu|Igbo Etiti|Igbo Eze North|Igbo Eze South|Isi Uzo|Nkanu East|Nkanu West|Nsukka|Oji River|Udenu|Udi|Uzo Uwani" },
  { name: "Gombe State", lgas: "Akko|Balanga|Billiri|Dukku|Funakaye|Gombe|Kaltungo|Kwami|Nafada|Shongom|Yamaltu/Deba" },
  { name: "Imo State", lgas: "Aboh Mbaise|Ahiazu Mbaise|Ehime Mbano|Ezinihitte|Ideato North|Ideato South|Ihitte/Uboma|Ikeduru|Isiala Mbano|Isu|Mbaitoli|Ngor Okpala|Njaba|Nkwerre|Nwangele|Obowo|Oguta|Ohaji/Egbema|Okigwe|Orlu|Orsu|Oru East|Oru West|Owerri Municipal|Owerri North|Owerri West|Unuimo" },
  { name: "Jigawa State", lgas: "Auyo|Babura|Biriniwa|Birnin Kudu|Buji|Dutse|Gagarawa|Garki|Gumel|Guri|Gwaram|Gwiwa|Hadejia|Jahun|Kafin Hausa|Kaugama|Kazaure|Kiri Kasama|Kiyawa|Maigatari|Malam Madori|Miga|Ringim|Roni|Sule Tankarkar|Taura|Yankwashi" },
  { name: "Kaduna State", lgas: "Birnin Gwari|Chikun|Giwa|Igabi|Ikara|Jaba|Jema'a|Kachia|Kaduna North|Kaduna South|Kagarko|Kajuru|Kaura|Kauru|Kubau|Kudan|Lere|Makarfi|Sabon Gari|Sanga|Soba|Zangon Kataf|Zaria" },
  { name: "Kano State", lgas: "Ajingi|Albasu|Bagwai|Bebeji|Bichi|Bunkure|Dala|Dambatta|Dawakin Kudu|Dawakin Tofa|Doguwa|Fagge|Gabasawa|Garko|Garun Mallam|Gaya|Gezawa|Gwale|Gwarzo|Kabo|Kano Municipal|Karaye|Kibiya|Kiru|Kumbotso|Kunchi|Kura|Madobi|Makoda|Minjibir|Nasarawa|Rano|Rimin Gado|Rogo|Shanono|Sumaila|Takai|Tarauni|Tofa|Tsanyawa|Tudun Wada|Ungogo|Warawa|Wudil" },
  { name: "Katsina State", lgas: "Bakori|Batagarawa|Batsari|Baure|Bindawa|Charanchi|Dan Musa|Dandume|Danja|Daura|Dutsi|Dutsin-Ma|Faskari|Funtua|Ingawa|Jibia|Kafur|Kaita|Kankara|Kankia|Katsina|Kurfi|Kusada|Mai'Adua|Malumfashi|Mani|Mashi|Matazu|Musawa|Rimi|Sabuwa|Safana|Sandamu|Zango" },
  { name: "Kebbi State", lgas: "Aleiro|Arewa Dandi|Argungu|Augie|Bagudo|Birnin Kebbi|Bunza|Dandi|Fakai|Gwandu|Jega|Kalgo|Koko/Besse|Maiyama|Ngaski|Sakaba|Shanga|Suru|Yauri|Zuru|Danko/Wasagu" },
  { name: "Kogi State", lgas: "Adavi|Ajaokuta|Ankpa|Bassa|Dekina|Ibaji|Idah|Igalamela Odolu|Ijumu|Kabba/Bunu|Kogi|Lokoja|Mopa-Muro|Ofu|Ogori/Magongo|Okehi|Okene|Olamaboro|Omala|Yagba East|Yagba West" },
  { name: "Kwara State", lgas: "Asa|Baruten|Edu|Ekiti|Ifelodun|Ilorin East|Ilorin South|Ilorin West|Irepodun|Isin|Kaiama|Moro|Offa|Oke Ero|Oyun|Patigi" },
  { name: "Lagos State", lgas: "Agege|Ajeromi-Ifelodun|Alimosho|Amuwo-Odofin|Apapa|Badagry|Epe|Eti-Osa|Ibeju-Lekki|Ifako-Ijaiye|Ikeja|Ikorodu|Kosofe|Lagos Island|Lagos Mainland|Mushin|Ojo|Oshodi-Isolo|Shomolu|Surulere" },
  { name: "Nasarawa State", lgas: "Akwanga|Awe|Doma|Karu|Keana|Keffi|Kokona|Lafia|Nasarawa|Nasarawa Egon|Obi|Toto|Wamba" },
  { name: "Niger State", lgas: "Agaie|Agwara|Bida|Borgu|Bosso|Chanchaga|Edati|Gbako|Gurara|Katcha|Kontagora|Lapai|Lavun|Magama|Mariga|Mashegu|Mokwa|Munya|Paikoro|Rafi|Rijau|Shiroro|Suleja|Tafa|Wushishi" },
  { name: "Ogun State", lgas: "Abeokuta North|Abeokuta South|Ado-Odo/Ota|Egbado North|Egbado South|Ewekoro|Ifo|Ijebu East|Ijebu North|Ijebu North East|Ijebu Ode|Ikenne|Imeko Afon|Ipokia|Obafemi Owode|Odogbolu|Odeda|Ogun Waterside|Remo North|Sagamu" },
  { name: "Ondo State", lgas: "Akoko North-East|Akoko North-West|Akoko South-East|Akoko South-West|Akure North|Akure South|Ese Odo|Idanre|Ifedore|Ilaje|Ile Oluji/Okeigbo|Irele|Odigbo|Okitipupa|Ondo East|Ondo West|Ose|Owo" },
  { name: "Osun State", lgas: "Aiyedaade|Aiyedire|Atakunmosa East|Atakunmosa West|Boluwaduro|Boripe|Ede North|Ede South|Egbedore|Ejigbo|Ife Central|Ife East|Ife North|Ife South|Ifedayo|Ifelodun|Ila|Ilesa East|Ilesa West|Irepodun|Irewole|Isokan|Iwo|Obokun|Odo Otin|Ola Oluwa|Olorunda|Oriade|Orolu|Osogbo" },
  { name: "Oyo State", lgas: "Afijio|Akinyele|Atiba|Atisbo|Egbeda|Ibadan North|Ibadan North-East|Ibadan North-West|Ibadan South-East|Ibadan South-West|Ibarapa Central|Ibarapa East|Ibarapa North|Ido|Irepo|Iseyin|Itesiwaju|Iwajowa|Kajola|Lagelu|Ogbomosho North|Ogbomosho South|Ogo Oluwa|Olorunsogo|Oluyole|Ona Ara|Orelope|Ori Ire|Oyo East|Oyo West|Saki East|Saki West|Surulere" },
  { name: "Plateau State", lgas: "Barkin Ladi|Bassa|Bokkos|Jos East|Jos North|Jos South|Kanam|Kanke|Langtang North|Langtang South|Mangu|Mikang|Pankshin|Qua'an Pan|Riyom|Shendam|Wase" },
  { name: "Rivers State", lgas: "Abua/Odual|Ahoada East|Ahoada West|Akuku-Toru|Andoni|Asari-Toru|Bonny|Degema|Eleme|Emohua|Etche|Gokana|Ikwerre|Khana|Obio/Akpor|Ogba/Egbema/Ndoni|Ogu/Bolo|Okrika|Omuma|Opobo/Nkoro|Oyigbo|Port Harcourt|Tai" },
  { name: "Sokoto State", lgas: "Binji|Bodinga|Dange Shuni|Gada|Goronyo|Gudu|Gwadabawa|Illela|Isa|Kebbe|Kware|Rabah|Sabon Birni|Shagari|Silame|Sokoto North|Sokoto South|Tambuwal|Tangaza|Tureta|Wamako|Wurno|Yabo" },
  { name: "Taraba State", lgas: "Ardo Kola|Bali|Donga|Gashaka|Gassol|Ibi|Jalingo|Karim Lamido|Kurmi|Lau|Sardauna|Takum|Ussa|Wukari|Yorro|Zing" },
  { name: "Yobe State", lgas: "Bade|Bursari|Damaturu|Fika|Fune|Geidam|Gujba|Gulani|Jakusko|Karasuwa|Machina|Nangere|Nguru|Potiskum|Tarmuwa|Yunusari|Yusufari" },
  { name: "Zamfara State", lgas: "Anka|Bakura|Birnin Magaji/Kiyaw|Bukkuyum|Bungudu|Gummi|Gusau|Kaura Namoda|Maradun|Maru|Shinkafi|Talata Mafara|Tsafe|Zurmi" },
  { name: "Federal Capital Territory (FCT)", lgas: "Abaji|Bwari|Gwagwalada|Kuje|Kwali|Municipal Area Council" },
].map((area) => ({
  ...area,
  key: area.name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, ""),
  lgas: area.lgas.split("|"),
}));

class ExecutivesTabs {
  constructor() {
    this.tabs = $$(".exec-tab");
    this.panels = $$(".tab-panel");
    this.stateEl = $("#stateSelect");
    this.lgaState = $("#lgaStateSelect");
    this.lgaEl = $("#lgaSelect");
    this.data = this.getData();
    this.populateStates();
    this.init();
  }
  populateStates() {
    [this.stateEl, this.lgaState].forEach((select) => {
      if (!select) return;
      const currentValue = select.value;
      select.replaceChildren(new Option("Choose a state…", ""));
      NIGERIAN_ADMINISTRATIVE_AREAS.forEach((area) => {
        select.add(new Option(area.name, area.key));
      });
      select.value = currentValue;
    });
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
      <div class="exec-photo"><img src="images/pstcsl%20logo1.png" alt="PSTCSL emblem" loading="lazy"></div>
      <div class="exec-info">
        <div class="exec-role-badge">${e.position}</div>
        <h3>${e.name}</h3>
        <p>${e.description}</p>
      </div>
    </div>`;
  }
  getData() {
    const state = {};
    const lgas = {};
    const lga = {};
    NIGERIAN_ADMINISTRATIVE_AREAS.forEach((area) => {
      const territory = area.name.includes("(FCT)");
      const stateName = territory ? "FCT" : area.name.replace(/ State$/, "");
      state[area.key] = [
        {
          name: `${stateName}${territory ? "" : " State"} Executive`,
          position: territory ? "FCT Executive" : "State Executive",
          description: `Leadership for the PSTCSL ${stateName} chapter.`,
        },
      ];
      lgas[area.key] = area.lgas;
      area.lgas.forEach((lgaName) => {
        lga[`${area.key}::${lgaName}`] = [
          {
            name: `${lgaName} LGA Executive`,
            position: "LGA Executive",
            description: `Leadership for the PSTCSL ${lgaName} local government chapter in ${stateName}.`,
          },
        ];
      });
    });
    return { state, lgas, lga };
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
