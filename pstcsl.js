// ==============================================
// PSTCSL - Private School Teachers Cooperative Society
// JavaScript Functionality with Dark Mode
// ==============================================

// Utility Functions
const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => document.querySelectorAll(selector);

// ==============================================
// THEME MANAGER
// ==============================================
class ThemeManager {
  constructor() {
    this.themeToggle = $("#themeToggle");
    this.themeIcon = $(".theme-icon");
    this.currentTheme = this.getStoredTheme();

    this.init();
  }

  init() {
    if (!this.themeToggle) return;

    // Apply stored theme on load
    this.applyTheme(this.currentTheme);

    // Theme toggle click handler
    this.themeToggle.addEventListener("click", () => this.toggleTheme());
  }

  getStoredTheme() {
    return localStorage.getItem("pstcsl_theme") || "light";
  }

  storeTheme(theme) {
    localStorage.setItem("pstcsl_theme", theme);
  }

  applyTheme(theme) {
    document.documentElement.setAttribute("data-theme", theme);
    this.updateIcon(theme);
    this.currentTheme = theme;
    this.storeTheme(theme);
  }

  updateIcon(theme) {
    if (!this.themeIcon) return;

    if (theme === "dark") {
      this.themeIcon.textContent = "☀️";
    } else {
      this.themeIcon.textContent = "🌙";
    }
  }

  toggleTheme() {
    const newTheme = this.currentTheme === "light" ? "dark" : "light";
    this.applyTheme(newTheme);

    // Add animation
    document.body.style.transition = "background-color 0.3s ease";
    setTimeout(() => {
      document.body.style.transition = "";
    }, 300);
  }
}

// ==============================================
// NAVIGATION
// ==============================================
class Navigation {
  constructor() {
    this.nav = $("#mainNav");
    this.navToggle = $("#navToggle");
    this.navMenu = $("#navMenu");
    this.navLinks = $$(".nav-link");

    this.init();
  }

  init() {
    // Mobile menu toggle
    this.navToggle?.addEventListener("click", () => this.toggleMenu());

    // Smooth scrolling for navigation links
    this.navLinks.forEach((link) => {
      link.addEventListener("click", (e) => this.handleLinkClick(e));
    });

    // Highlight active section on scroll
    window.addEventListener("scroll", () => this.highlightActiveSection());

    // Add shadow on scroll
    window.addEventListener("scroll", () => this.handleScroll());
  }

  toggleMenu() {
    this.navMenu.classList.toggle("active");
    this.navToggle.classList.toggle("active");
  }

  handleLinkClick(e) {
    const href = e.target.getAttribute("href");
    if (href.startsWith("#")) {
      e.preventDefault();
      const target = $(href);
      if (target) {
        const offset = 80;
        const targetPosition = target.offsetTop - offset;
        window.scrollTo({
          top: targetPosition,
          behavior: "smooth",
        });

        // Close mobile menu if open
        this.navMenu.classList.remove("active");
      }
    }
  }

  highlightActiveSection() {
    const sections = $$("section[id]");
    const scrollPos = window.scrollY + 100;

    sections.forEach((section) => {
      const sectionTop = section.offsetTop;
      const sectionHeight = section.offsetHeight;
      const sectionId = section.getAttribute("id");

      if (scrollPos >= sectionTop && scrollPos < sectionTop + sectionHeight) {
        this.navLinks.forEach((link) => {
          link.classList.remove("active");
          if (link.getAttribute("href") === `#${sectionId}`) {
            link.classList.add("active");
          }
        });
      }
    });
  }

  handleScroll() {
    if (window.scrollY > 50) {
      this.nav.style.boxShadow = "0 2px 30px rgba(71, 183, 111, 0.15)";
    } else {
      this.nav.style.boxShadow = "0 2px 20px rgba(71, 183, 111, 0.1)";
    }
  }
}

// ==============================================
// HERO SLIDER
// ==============================================
class HeroSlider {
  constructor() {
    this.slides = $$(".slide");
    this.currentSlide = 0;
    this.slideInterval = null;
    this.slideDuration = 5000; // 5 seconds per slide

    this.init();
  }

  init() {
    if (this.slides.length === 0) return;

    this.startSlider();
  }

  startSlider() {
    this.slideInterval = setInterval(() => {
      this.nextSlide();
    }, this.slideDuration);
  }

  nextSlide() {
    this.slides[this.currentSlide].classList.remove("active");
    this.currentSlide = (this.currentSlide + 1) % this.slides.length;
    this.slides[this.currentSlide].classList.add("active");
  }

  goToSlide(index) {
    this.slides[this.currentSlide].classList.remove("active");
    this.currentSlide = index;
    this.slides[this.currentSlide].classList.add("active");
  }
}

// Add this to the MembershipManager class in pstcsl.js

// ==============================================
// ENHANCED MEMBERSHIP MANAGER WITH FILE UPLOADS
// ==============================================
class MembershipManager {
  constructor() {
    this.form = $("#membershipForm");
    this.membersList = $("#membersList");
    this.memberCount = $("#memberCount");
    this.searchInput = $("#searchMembers");
    this.filterState = $("#filterState");

    // File input elements
    this.passportPhotoInput = $("#passportPhoto");
    this.staffIdInput = $("#staffId");
    this.idCardInput = $("#idCard");

    this.members = this.loadMembers();

    this.init();
  }

  init() {
    if (!this.form) return;

    // Form submission
    this.form.addEventListener("submit", (e) => this.handleSubmit(e));

    // Search and filter
    this.searchInput?.addEventListener("input", () => this.filterMembers());
    this.filterState?.addEventListener("change", () => this.filterMembers());

    // File upload handlers
    this.setupFileUpload(this.passportPhotoInput, "passportPreview");
    this.setupFileUpload(this.staffIdInput, "staffIdPreview");
    this.setupFileUpload(this.idCardInput, "idCardPreview");

    // Passport photo consent validation
    this.setupPhotoConsentValidation();

    // Populate state filter
    this.populateStateFilter();

    // Display members
    this.displayMembers();
  }

  setupFileUpload(input, previewId) {
    if (!input) return;

    input.addEventListener("change", (e) => {
      const file = e.target.files[0];
      const preview = $(`#${previewId}`);

      if (!preview) return;

      if (file) {
        // Validate file size (5MB max)
        if (file.size > 5 * 1024 * 1024) {
          this.showNotification("File size must be less than 5MB", "error");
          input.value = "";
          return;
        }

        // Update file label
        const label = input.nextElementSibling;
        const fileText = label.querySelector(".file-text");
        if (fileText) {
          fileText.textContent = file.name;
        }

        // Show preview for images
        if (file.type.startsWith("image/")) {
          const reader = new FileReader();
          reader.onload = (e) => {
            preview.innerHTML = `
              <div class="file-preview-info">
                <span class="file-preview-name">📎 ${file.name}</span>
                <span class="file-remove" onclick="this.closest('.file-upload-wrapper').querySelector('.file-input').value=''; this.closest('.file-preview').classList.remove('active'); this.closest('.file-preview').innerHTML='';">✕</span>
              </div>
              <img src="${e.target.result}" alt="Preview" />
            `;
            preview.classList.add("active");
          };
          reader.readAsDataURL(file);
        } else {
          preview.innerHTML = `
            <div class="file-preview-info">
              <span class="file-preview-name">📎 ${file.name}</span>
              <span class="file-remove" onclick="this.closest('.file-upload-wrapper').querySelector('.file-input').value=''; this.closest('.file-preview').classList.remove('active'); this.closest('.file-preview').innerHTML='';">✕</span>
            </div>
          `;
          preview.classList.add("active");
        }
      }
    });
  }

  setupPhotoConsentValidation() {
    const passportPhoto = $("#passportPhoto");
    const photoConsent = $("#photoConsent");

    if (!passportPhoto || !photoConsent) return;

    // If photo is uploaded, consent must be checked
    this.form.addEventListener("submit", (e) => {
      if (passportPhoto.files.length > 0 && !photoConsent.checked) {
        e.preventDefault();
        this.showNotification(
          "Please provide consent for using your passport photograph",
          "error",
        );
        photoConsent.focus();
      }
    });
  }

  handleSubmit(e) {
    e.preventDefault();

    const formData = new FormData(this.form);

    // Create member object with all data
    const member = {
      id: Date.now(),
      fullName: formData.get("fullName"),
      email: formData.get("email"),
      phone: formData.get("phone"),
      teachingLevel: formData.get("teachingLevel"),
      state: formData.get("state"),
      lga: formData.get("lga"),
      school: formData.get("school"),
      yearsExperience: formData.get("yearsExperience"),
      qualification: formData.get("qualification"),
      trcn: formData.get("trcn"),
      idType: formData.get("idType"),
      idNumber: formData.get("idNumber"),
      photoConsent: formData.get("photoConsent") === "on",
      hasPassportPhoto: $("#passportPhoto").files.length > 0,
      hasStaffId: $("#staffId").files.length > 0,
      hasIdCard: $("#idCard").files.length > 0,
      registrationDate: new Date().toISOString(),
    };

    // In a real application, you would upload the files to a server here
    // For now, we'll just store the metadata

    this.members.push(member);
    this.saveMembers();
    this.displayMembers();
    this.form.reset();

    // Reset file previews
    ["passportPreview", "staffIdPreview", "idCardPreview"].forEach((id) => {
      const preview = $(`#${id}`);
      if (preview) {
        preview.innerHTML = "";
        preview.classList.remove("active");
      }
    });

    // Reset file labels
    document.querySelectorAll(".file-text").forEach((el) => {
      const inputId = el.closest("label").getAttribute("for");
      if (inputId === "passportPhoto") {
        el.textContent = "Choose passport photo";
      } else if (inputId === "staffId") {
        el.textContent = "Choose staff ID card";
      } else if (inputId === "idCard") {
        el.textContent = "Choose ID card";
      }
    });

    // Show success message
    this.showNotification(
      "Registration successful! Welcome to PSTCSL. Your application is being processed.",
    );
  }

  loadMembers() {
    const stored = localStorage.getItem("pstcsl_members");
    return stored ? JSON.parse(stored) : [];
  }

  saveMembers() {
    localStorage.setItem("pstcsl_members", JSON.stringify(this.members));
  }

  displayMembers(membersToShow = null) {
    const members = membersToShow || this.members;

    if (members.length === 0) {
      this.membersList.innerHTML = `
        <div class="empty-state">
          <p>No members registered yet. Be the first to join!</p>
        </div>
      `;
      this.memberCount.textContent = "0";
      return;
    }

    this.membersList.innerHTML = members
      .map(
        (member) => `
        <div class="member-card">
          <h4>${member.fullName}</h4>
          <div class="member-info">
            <span>📍 ${member.state}</span>
            <span>🏫 ${member.school}</span>
            <span>📚 ${this.formatTeachingLevel(member.teachingLevel)}</span>
            <span>🎓 ${member.qualification}</span>
            <span>⏱️ ${member.yearsExperience} years</span>
            ${member.hasPassportPhoto ? "<span>📸 Photo</span>" : ""}
            <span>✅ Verified</span>
          </div>
        </div>
      `,
      )
      .join("");

    this.memberCount.textContent = members.length;
  }

  filterMembers() {
    const searchTerm = this.searchInput.value.toLowerCase();
    const stateFilter = this.filterState.value;

    const filtered = this.members.filter((member) => {
      const matchesSearch =
        member.fullName.toLowerCase().includes(searchTerm) ||
        member.school.toLowerCase().includes(searchTerm) ||
        member.state.toLowerCase().includes(searchTerm);

      const matchesState = !stateFilter || member.state === stateFilter;

      return matchesSearch && matchesState;
    });

    this.displayMembers(filtered);
  }

  populateStateFilter() {
    if (!this.filterState) return;

    const states = [...new Set(this.members.map((m) => m.state))].sort();

    states.forEach((state) => {
      const option = document.createElement("option");
      option.value = state;
      option.textContent = state;
      this.filterState.appendChild(option);
    });
  }

  formatTeachingLevel(level) {
    const levels = {
      "early-childhood": "Early Childhood",
      primary: "Primary",
      secondary: "Secondary",
    };
    return levels[level] || level;
  }

  showNotification(message, type = "success") {
    const notification = document.createElement("div");
    const bgColor =
      type === "error"
        ? "linear-gradient(135deg, #e74c3c 0%, #c0392b 100%)"
        : "linear-gradient(135deg, #47b76f 0%, #6ed199 100%)";

    notification.style.cssText = `
      position: fixed;
      top: 100px;
      right: 20px;
      background: ${bgColor};
      color: white;
      padding: 1rem 2rem;
      border-radius: 8px;
      box-shadow: 0 4px 20px rgba(71, 183, 111, 0.3);
      z-index: 10000;
      animation: slideIn 0.3s ease-out;
      max-width: 400px;
    `;
    notification.textContent = message;

    document.body.appendChild(notification);

    setTimeout(() => {
      notification.style.animation = "slideOut 0.3s ease-out";
      setTimeout(() => notification.remove(), 300);
    }, 5000);
  }
}

// ==============================================
// GALLERY
// ==============================================
class Gallery {
  constructor() {
    this.filterBtns = $$(".filter-btn");
    this.galleryItems = $$(".gallery-item");

    this.init();
  }

  init() {
    if (this.filterBtns.length === 0) return;

    this.filterBtns.forEach((btn) => {
      btn.addEventListener("click", () => this.filterGallery(btn));
    });
  }

  filterGallery(btn) {
    const filter = btn.getAttribute("data-filter");

    // Update active button
    this.filterBtns.forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");

    // Filter items
    this.galleryItems.forEach((item) => {
      const category = item.getAttribute("data-category");

      if (filter === "all" || category === filter) {
        item.classList.remove("hidden");
        item.style.animation = "fadeIn 0.5s ease-in";
      } else {
        item.classList.add("hidden");
      }
    });
  }
}

// ==============================================
// EXECUTIVES TABS
// ==============================================
class ExecutivesTabs {
  constructor() {
    this.tabBtns = $$(".tab-btn");
    this.tabContents = $$(".tab-content");
    this.stateSelect = $("#stateSelect");
    this.lgaStateSelect = $("#lgaStateSelect");
    this.lgaSelect = $("#lgaSelect");

    this.stateExecutives = this.getStateExecutives();
    this.lgaExecutives = this.getLGAExecutives();
    this.lgasByState = this.getLGAsByState();

    this.init();
  }

  init() {
    if (this.tabBtns.length === 0) return;

    // Tab switching
    this.tabBtns.forEach((btn) => {
      btn.addEventListener("click", () => this.switchTab(btn));
    });

    // State executive selector
    this.stateSelect?.addEventListener("change", (e) =>
      this.displayStateExecutives(e.target.value),
    );

    // LGA executive selectors
    this.lgaStateSelect?.addEventListener("change", (e) => {
      this.populateLGADropdown(e.target.value);
      this.displayLGAExecutives(e.target.value, "");
    });

    this.lgaSelect?.addEventListener("change", (e) => {
      const state = this.lgaStateSelect.value;
      this.displayLGAExecutives(state, e.target.value);
    });
  }

  switchTab(btn) {
    const tabId = btn.getAttribute("data-tab");

    // Update active tab button
    this.tabBtns.forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");

    // Show corresponding content
    this.tabContents.forEach((content) => {
      content.classList.remove("active");
      if (content.id === tabId) {
        content.classList.add("active");
      }
    });
  }

  displayStateExecutives(state) {
    const container = $("#stateExecutives");
    if (!container || !state) {
      container.innerHTML =
        '<div class="empty-state"><p>Select a state to view executive members</p></div>';
      return;
    }

    const executives = this.stateExecutives[state] || [];

    if (executives.length === 0) {
      container.innerHTML =
        '<div class="empty-state"><p>No executives registered for this state yet.</p></div>';
      return;
    }

    container.innerHTML = executives
      .map(
        (exec) => `
            <div class="executive-card">
                <div class="executive-image">
                    <div class="image-placeholder">
                        <span>👤</span>
                    </div>
                </div>
                <div class="executive-info">
                    <h3>${exec.name}</h3>
                    <p class="position">${exec.position}</p>
                    <p class="description">${exec.description}</p>
                </div>
            </div>
        `,
      )
      .join("");
  }

  populateLGADropdown(state) {
    if (!this.lgaSelect || !state) {
      this.lgaSelect.innerHTML = '<option value="">Choose an LGA...</option>';
      return;
    }

    const lgas = this.lgasByState[state] || [];

    this.lgaSelect.innerHTML =
      '<option value="">Choose an LGA...</option>' +
      lgas.map((lga) => `<option value="${lga}">${lga}</option>`).join("");
  }

  displayLGAExecutives(state, lga) {
    const container = $("#lgaExecutives");
    if (!container || !state) {
      container.innerHTML =
        '<div class="empty-state"><p>Select a state and LGA to view executive members</p></div>';
      return;
    }

    if (!lga) {
      container.innerHTML =
        '<div class="empty-state"><p>Select an LGA to view executive members</p></div>';
      return;
    }

    const key = `${state}-${lga}`;
    const executives = this.lgaExecutives[key] || [];

    if (executives.length === 0) {
      container.innerHTML =
        '<div class="empty-state"><p>No executives registered for this LGA yet.</p></div>';
      return;
    }

    container.innerHTML = executives
      .map(
        (exec) => `
            <div class="executive-card">
                <div class="executive-image">
                    <div class="image-placeholder">
                        <span>👤</span>
                    </div>
                </div>
                <div class="executive-info">
                    <h3>${exec.name}</h3>
                    <p class="position">${exec.position}</p>
                    <p class="description">${exec.description}</p>
                </div>
            </div>
        `,
      )
      .join("");
  }

  getStateExecutives() {
    // Sample data - replace with actual data
    return {
      lagos: [
        {
          name: "Mrs. Olufunke Akinlade",
          position: "Lagos State President",
          description:
            "Leading teacher advocacy initiatives across Lagos State with focus on welfare reform.",
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
          description: "Managing financial operations for Lagos State chapter.",
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
            "Organizing advocacy programs and member engagement activities.",
        },
      ],
      kano: [
        {
          name: "Malam Yusuf Ibrahim",
          position: "Kano State President",
          description:
            "Promoting educational excellence and teacher welfare in Kano State.",
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
            "Coordinating with federal authorities on policy matters.",
        },
      ],
    };
  }

  getLGAExecutives() {
    // Sample data - replace with actual data
    return {
      "lagos-Ikeja": [
        {
          name: "Mr. Ademola Johnson",
          position: "Ikeja LGA Chairman",
          description: "Local coordination of teacher welfare programs.",
        },
        {
          name: "Mrs. Funmi Adeyemi",
          position: "LGA Secretary",
          description: "Managing local chapter activities and member support.",
        },
      ],
      "lagos-Surulere": [
        {
          name: "Dr. Bola Tinubu",
          position: "Surulere LGA Chairman",
          description: "Leading grassroots advocacy for teacher rights.",
        },
      ],
      "rivers-Port Harcourt": [
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
    };
  }

  getLGAsByState() {
    // Sample data - replace with actual data
    return {
      lagos: ["Ikeja", "Surulere", "Alimosho", "Eti-Osa", "Ikorodu"],
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
    };
  }
}

// ==============================================
// CONTACT FORM
// ==============================================
class ContactForm {
  constructor() {
    this.form = $("#contactForm");
    this.init();
  }

  init() {
    if (!this.form) return;

    this.form.addEventListener("submit", (e) => this.handleSubmit(e));
  }

  handleSubmit(e) {
    e.preventDefault();

    const formData = new FormData(this.form);
    const message = {
      name: formData.get("contactName"),
      email: formData.get("contactEmail"),
      phone: formData.get("contactPhone"),
      subject: formData.get("contactSubject"),
      message: formData.get("contactMessage"),
      timestamp: new Date().toISOString(),
    };

    // Here you would typically send this to a server
    console.log("Contact form submission:", message);

    // Show success message
    this.showNotification(
      "Thank you for your message! We will respond shortly.",
    );

    // Reset form
    this.form.reset();
  }

  showNotification(message) {
    const notification = document.createElement("div");
    notification.style.cssText = `
            position: fixed;
            top: 100px;
            right: 20px;
            background: linear-gradient(135deg, #47b76f 0%, #6ed199 100%);
            color: white;
            padding: 1rem 2rem;
            border-radius: 8px;
            box-shadow: 0 4px 20px rgba(71, 183, 111, 0.3);
            z-index: 10000;
            animation: slideIn 0.3s ease-out;
        `;
    notification.textContent = message;

    document.body.appendChild(notification);

    setTimeout(() => {
      notification.style.animation = "slideOut 0.3s ease-out";
      setTimeout(() => notification.remove(), 300);
    }, 3000);
  }
}

// ==============================================
// ANIMATIONS ON SCROLL
// ==============================================
class ScrollAnimations {
  constructor() {
    this.animatedElements = $$("[data-animate]");
    this.init();
  }

  init() {
    if ("IntersectionObserver" in window) {
      this.observer = new IntersectionObserver(
        (entries) => this.handleIntersection(entries),
        { threshold: 0.1, rootMargin: "0px 0px -50px 0px" },
      );

      this.animatedElements.forEach((el) => this.observer.observe(el));
    }
  }

  handleIntersection(entries) {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("animated");
        this.observer.unobserve(entry.target);
      }
    });
  }
}

// ==============================================
// ADD CSS ANIMATIONS
// ==============================================
const addAnimationStyles = () => {
  const style = document.createElement("style");
  style.textContent = `
        @keyframes slideIn {
            from {
                transform: translateX(400px);
                opacity: 0;
            }
            to {
                transform: translateX(0);
                opacity: 1;
            }
        }
        
        @keyframes slideOut {
            from {
                transform: translateX(0);
                opacity: 1;
            }
            to {
                transform: translateX(400px);
                opacity: 0;
            }
        }
        
        @keyframes fadeIn {
            from {
                opacity: 0;
                transform: scale(0.9);
            }
            to {
                opacity: 1;
                transform: scale(1);
            }
        }
    `;
  document.head.appendChild(style);
};

// ==============================================
// INITIALIZE ALL COMPONENTS
// ==============================================
document.addEventListener("DOMContentLoaded", () => {
  // Add animation styles
  addAnimationStyles();

  // Initialize theme manager first
  new ThemeManager();

  // Initialize all other components
  new Navigation();
  new HeroSlider();
  new MembershipManager();
  new Gallery();
  new ExecutivesTabs();
  new ContactForm();
  new ScrollAnimations();

  // Smooth scroll for all anchor links
  document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener("click", function (e) {
      const href = this.getAttribute("href");
      if (href !== "#" && document.querySelector(href)) {
        e.preventDefault();
        const target = document.querySelector(href);
        const offset = 80;
        const targetPosition = target.offsetTop - offset;

        window.scrollTo({
          top: targetPosition,
          behavior: "smooth",
        });
      }
    });
  });

  console.log("PSTCSL Website Initialized Successfully with Dark Mode");
});

// ==============================================
// EXPORT FOR TESTING (optional)
// ==============================================
if (typeof module !== "undefined" && module.exports) {
  module.exports = {
    ThemeManager,
    Navigation,
    HeroSlider,
    MembershipManager,
    Gallery,
    ExecutivesTabs,
    ContactForm,
  };
}
