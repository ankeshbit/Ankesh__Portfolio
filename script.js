/* ═══════════════════════════════════════════════════════════════
   ANKESH SRIVASTAVA — PORTFOLIO SCRIPTS
   ═══════════════════════════════════════════════════════════════ */

document.addEventListener('DOMContentLoaded', () => {

  /* ─────────────────────────────────────────────
     1. NAVBAR — Scroll & Mobile Toggle
     ───────────────────────────────────────────── */
  const navbar = document.getElementById('navbar');
  const navToggle = document.getElementById('navToggle');
  const navLinks = document.getElementById('navLinks');
  const navItems = navLinks.querySelectorAll('a');

  window.addEventListener('scroll', () => {
    navbar.classList.toggle('scrolled', window.scrollY > 60);
  });

  navToggle.addEventListener('click', () => {
    navToggle.classList.toggle('active');
    navLinks.classList.toggle('open');
  });

  navItems.forEach(link => {
    link.addEventListener('click', () => {
      navToggle.classList.remove('active');
      navLinks.classList.remove('open');
    });
  });

  // Active nav highlighting
  const sections = document.querySelectorAll('.section');
  const observerNav = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const id = entry.target.id;
        navItems.forEach(a => {
          a.classList.toggle('active', a.getAttribute('href') === `#${id}`);
        });
      }
    });
  }, { threshold: 0.3, rootMargin: '-80px 0px 0px 0px' });

  sections.forEach(sec => observerNav.observe(sec));

  /* ─────────────────────────────────────────────
     2. LANDING — Particles
     ───────────────────────────────────────────── */
  const particlesContainer = document.getElementById('particles');
  for (let i = 0; i < 30; i++) {
    const p = document.createElement('div');
    p.className = 'particle';
    p.style.left = `${Math.random() * 100}%`;
    p.style.top = `${50 + Math.random() * 50}%`;
    p.style.animationDelay = `${Math.random() * 6}s`;
    p.style.animationDuration = `${4 + Math.random() * 4}s`;
    p.style.width = `${2 + Math.random() * 3}px`;
    p.style.height = p.style.width;
    particlesContainer.appendChild(p);
  }

  /* ─────────────────────────────────────────────
     3. LANDING — Typing Effect
     ───────────────────────────────────────────── */
  const designations = [
    'Electrical Engineer Undergraduate',
    'MERN Full Stack Web Developer',
    'Data Analyst Intern'
  ];
  const typedEl = document.getElementById('typedText');
  let desIdx = 0;
  let charIdx = 0;
  let isDeleting = false;
  let typingSpeed = 80;

  function typeLoop() {
    const current = designations[desIdx];
    if (isDeleting) {
      typedEl.textContent = current.substring(0, charIdx - 1);
      charIdx--;
      typingSpeed = 40;
    } else {
      typedEl.textContent = current.substring(0, charIdx + 1);
      charIdx++;
      typingSpeed = 80;
    }

    if (!isDeleting && charIdx === current.length) {
      typingSpeed = 2000; // pause at end
      isDeleting = true;
    } else if (isDeleting && charIdx === 0) {
      isDeleting = false;
      desIdx = (desIdx + 1) % designations.length;
      typingSpeed = 400;
    }

    setTimeout(typeLoop, typingSpeed);
  }
  typeLoop();

  /* ─────────────────────────────────────────────
     4. INTERSECTION OBSERVER — Reveal Animations
     ───────────────────────────────────────────── */
  const animatedSelectors = [
    '.reveal-up',
    '.slide-in-left',
    '.slide-up-stagger',
    '.flip-card',
    '.drop-in-top',
    '.typewriter-list',
    '.stagger-in',
    '.slide-in-blur',
    '.fade-delay',
    '.pop-in',
    '.bounce-in',
    '.grid-wave',
    '.waterfall',
    '.zoom-in-center',
    '.slide-in-bl',
    '.slide-in-br'
  ];

  const allAnimated = document.querySelectorAll(animatedSelectors.join(', '));

  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        // Don't unobserve so we can re-trigger if wanted
        // Actually for performance, unobserve after animation
        revealObserver.unobserve(entry.target);
      }
    });
  }, {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
  });

  allAnimated.forEach(el => revealObserver.observe(el));

  /* ─────────────────────────────────────────────
     5. SOCIAL ICONS — Pop Animation
     ───────────────────────────────────────────── */
  const socialPops = document.querySelectorAll('.social-pop');
  const socialObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        socialPops.forEach(icon => icon.classList.add('animate'));
        socialObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.5 });

  if (socialPops.length) {
    socialObserver.observe(socialPops[0].closest('.landing-socials') || socialPops[0]);
  }

  /* ─────────────────────────────────────────────
     6. SKILLS — Animated Progress Bars
     ───────────────────────────────────────────── */
  const skillCards = document.querySelectorAll('.skill-category-card');

  const skillObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const bars = entry.target.querySelectorAll('.skill-bar');
        bars.forEach((bar, i) => {
          const percent = bar.getAttribute('data-percent');
          const fill = bar.querySelector('.bar-fill');
          const percentEl = bar.querySelector('.skill-percent');

          setTimeout(() => {
            fill.style.width = `${percent}%`;

            // Animate the counter
            animateCounter(percentEl, 0, parseInt(percent), 1000);
          }, i * 100);
        });

        skillObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.2 });

  skillCards.forEach(card => skillObserver.observe(card));

  function animateCounter(el, start, end, duration) {
    const startTime = performance.now();
    function update(currentTime) {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // Ease out
      const eased = 1 - Math.pow(1 - progress, 3);
      const value = Math.round(start + (end - start) * eased);
      el.textContent = `${value}%`;
      if (progress < 1) {
        requestAnimationFrame(update);
      }
    }
    requestAnimationFrame(update);
  }

  /* ─────────────────────────────────────────────
     7. STAT COUNTERS — Count Up Animation
     ───────────────────────────────────────────── */
  const statNumbers = document.querySelectorAll('.stat-number');
  const statsObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        statNumbers.forEach(num => {
          const target = parseInt(num.getAttribute('data-target'));
          animateStatCounter(num, 0, target, 1500);
        });
        statsObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.5 });

  const statsSection = document.querySelector('.stats-counters');
  if (statsSection) statsObserver.observe(statsSection);

  function animateStatCounter(el, start, end, duration) {
    const startTime = performance.now();
    function update(currentTime) {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 4);
      const value = Math.round(start + (end - start) * eased);
      el.textContent = value;
      if (progress < 1) {
        requestAnimationFrame(update);
      }
    }
    requestAnimationFrame(update);
  }

  /* ─────────────────────────────────────────────
     8. CONTACT FORM — Form Handling & Pulse
     ───────────────────────────────────────────── */
  const contactForm = document.getElementById('contactForm');
  const sendBtn = document.getElementById('sendBtn');

  // Pulse send button once when form becomes visible
  const formObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        setTimeout(() => {
          sendBtn.classList.add('pulse-once');
          sendBtn.addEventListener('animationend', () => {
            sendBtn.classList.remove('pulse-once');
          }, { once: true });
        }, 1200);
        formObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.3 });

  if (contactForm) formObserver.observe(contactForm);

  // Form submit — open mailto
  if (contactForm) {
    contactForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const name = document.getElementById('contactName').value;
      const email = document.getElementById('contactEmail').value;
      const subject = document.getElementById('contactSubject').value;
      const message = document.getElementById('contactMessage').value;

      const mailtoLink = `mailto:ankeshsrivastava61289@gmail.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(`Name: ${name}\nEmail: ${email}\n\n${message}`)}`;
      window.location.href = mailtoLink;

      // Visual feedback
      sendBtn.querySelector('span').textContent = 'Opening Mail Client...';
      setTimeout(() => {
        sendBtn.querySelector('span').textContent = 'Send Message';
      }, 3000);
    });
  }

  /* ─────────────────────────────────────────────
     9. CERTIFICATION CARDS — Mouse-follow tilt
     ───────────────────────────────────────────── */
  const certCards = document.querySelectorAll('.cert-card');
  certCards.forEach(card => {
    card.addEventListener('mousemove', (e) => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;
      const rotateX = ((y - centerY) / centerY) * -4;
      const rotateY = ((x - centerX) / centerX) * 4;
      card.style.transform = `perspective(800px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
    });

    card.addEventListener('mouseleave', () => {
      card.style.transform = 'perspective(800px) rotateX(0) rotateY(0)';
    });
  });

  /* ─────────────────────────────────────────────
     10. SMOOTH SCROLL for anchor links
     ───────────────────────────────────────────── */
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      e.preventDefault();
      const target = document.querySelector(this.getAttribute('href'));
      if (target) {
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  });

  /* ─────────────────────────────────────────────
     11. EXPERIENCE CARD — Curtain animation
     ───────────────────────────────────────────── */
  const expCards = document.querySelectorAll('.exp-card');
  const expObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const left = entry.target.querySelector('.exp-card-left');
        if (left) {
          left.style.animation = 'curtainOpen 0.8s var(--ease-out-expo) forwards';
        }
        expObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.2 });

  expCards.forEach(card => expObserver.observe(card));

  // Add curtain CSS dynamically
  const curtainStyle = document.createElement('style');
  curtainStyle.textContent = `
    @keyframes curtainOpen {
      0% { max-width: 0; padding: 36px 0; opacity: 0; }
      100% { max-width: 260px; padding: 36px 28px; opacity: 1; }
    }
  `;
  document.head.appendChild(curtainStyle);

  /* ─────────────────────────────────────────────
     12. CERTIFICATIONS — Infinite Marquee Showcase
     ───────────────────────────────────────────── */
  const certificates = [
    { id: 24, image: "Cert/ankesh-srivastava.png", title: "GEN-AI CAMP — Certificate of Completion", provider: "AlgoUniversity", date: "2026" },
    { id: 23, image: "Cert/certificate_tnp.png", title: "The Paradigm Shift — Certificate of Participation", provider: "Training & Placement Cell, MMMUT", date: "August 2026" },
    { id: 20, image: "Cert/webnova_2026.png", title: "Winner — Webnova 2026 (National Hackathon)", provider: "IMS Engineering College & HackerRank Campus Crew", date: "2026" },
    { id: 1, image: "Cert/Certificate_isro.png", title: "Geodata Processing using Python and Machine Learning", provider: "ISRO", date: "February 2026" },
    { id: 2, image: "Cert/Ai.png", title: "AI Unleashed Bootcamp on Machine Learning to Deep Neural Network", provider: "AI Spark Society, MMMUT", date: "October 2025" },
    { id: 3, image: "Cert/Ankesh_cert.png", title: "Three-Day Hands-on Workshop 'PROMPTOPS' 26", provider: "CSSE, MMMUT", date: "February 2026" },
    { id: 4, image: "Cert/IEEE.png", title: "IEEE Day 2025", provider: "IEEE GTBIT SB & IEEE DTU SB", date: "October 2025" },
    { id: 5, image: "Cert/Nvidia.png", title: "Introduction to AI in the Data Center", provider: "NVIDIA", date: "December 2025" },
    { id: 6, image: "Cert/Swiftwings_ankesh_page-0001.jpg", title: "Swiftwings'25 Workshop and Competition", provider: "Drone & IoT Club, MMMUT", date: "December 2025" },
    { id: 7, image: "Cert/Certificate.png", title: "Winter of Code Certificate of Participation", provider: "Elite Coders", date: "2025" },
    { id: 8, image: "Cert/ML.png", title: "Machine Learning for Beginners", provider: "Simplilearn", date: "November 2025" },
    { id: 9, image: "Cert/Hp.png", title: "AI for Beginners", provider: "HP LIFE", date: "November 2025" },
    { id: 10, image: "Cert/Prompt.png", title: "Prompt Engineering with GitHub Copilot", provider: "Simplilearn", date: "December 2025" },
    { id: 11, image: "Cert/Tata.png", title: "Tata Crucible Campus Quiz 2025", provider: "Tata Crucible", date: "November 2025" },
    { id: 12, image: "Cert/Achievement_ecwoc.png", title: "Elite Coders Winter of Code Certificate of Appreciation", provider: "Elite Coders Winter of Code", date: "2025" },
    { id: 13, image: "Cert/Achievment.png", title: "Mathematics National Level E-Quiz 7.0 (Scored 91.5%)", provider: "Chaitanya Bharathi Institute of Technology", date: "September 2025" },
    { id: 14, image: "Cert/code_clash.png", title: "IIT Jodhpur Winner of Code Clash (Rank 1)", provider: "IIT Jodhpur", date: "N/A" },
    { id: 15, image: "Cert/deloitte.png", title: "Data Analytics Job Simulation", provider: "Deloitte", date: "June 2026" },
    { id: 16, image: "Cert/ewoc.png", title: "Elite Coders Winter of Code Contributor", provider: "Elite Coders Winter of Code", date: "2025" },
    { id: 17, image: "Cert/idea.png", title: "Idea Presentation Certificate of Participation", provider: "MANIT, Bhopal", date: "N/A" },
    { id: 18, image: "Cert/meta.png", title: "Introduction to Front-End Development", provider: "Meta", date: "December 2025" },
    { id: 19, image: "Cert/ms.png", title: "Getting Started with Microsoft Excel", provider: "Coursera Project Network", date: "June 2025" },
    { id: 21, image: "Cert/Vibe2ship.png", title: "Vibe2Ship — India's Biggest Vibe Coding Hackathon", provider: "Coding Ninjas & Google for Developers", date: "2026" },
    { id: 22, image: "Internship_cert/Alfido_tech.png", title: "Artificial Intelligence Internship Certificate", provider: "Alfido Tech", date: "May 2026 – July 2026" }
  ];

  // Helper: build a single cert card element
  function buildCertCard(item) {
    const card = document.createElement('div');
    card.className = 'cert-mq-card';
    card.setAttribute('tabindex', '0');
    card.setAttribute('role', 'button');
    card.innerHTML = `
      <img src="${item.image}" alt="${item.title}" loading="lazy">
      <div class="cert-mq-overlay">
        <span class="cert-mq-provider">${item.provider}</span>
        <h3 class="cert-mq-title">${item.title}</h3>
        <span class="cert-mq-date">${item.date}</span>
      </div>
    `;
    const handleOpen = () => {
      openLightbox(item.image, `${item.title} — ${item.provider}`);
    };
    card.addEventListener('click', handleOpen);
    card.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        handleOpen();
      }
    });
    return card;
  }

  // Helper: fill a track with items + a duplicate set for seamless loop
  function fillTrack(trackEl, items) {
    // Original set (accessible to screen readers and keyboard focus)
    items.forEach(item => trackEl.appendChild(buildCertCard(item)));
    // Duplicate set (visual seamless loop only — marked aria-hidden="true" and tabindex="-1")
    items.forEach(item => {
      const dupCard = buildCertCard(item);
      dupCard.setAttribute('aria-hidden', 'true');
      dupCard.setAttribute('tabindex', '-1');
      trackEl.appendChild(dupCard);
    });
  }

  const track1 = document.getElementById('certTrack1');
  const track2 = document.getElementById('certTrack2');

  if (track1 && track2) {
    const mid = Math.ceil(certificates.length / 2);
    const row1 = certificates.slice(0, mid);
    const row2 = certificates.slice(mid).reverse();

    fillTrack(track1, row1);
    fillTrack(track2, row2);
  }

  /* ─────────────────────────────────────────────
     13. LIGHTBOX MODAL HANDLER
     ───────────────────────────────────────────── */
  const lightbox = document.getElementById('certLightbox');
  const lightboxImg = document.getElementById('lightboxImg');
  const lightboxCaption = document.getElementById('lightboxCaption');
  const lightboxLink = document.getElementById('lightboxLink');

  function openLightbox(src, caption) {
    if (!lightbox || !lightboxImg || !lightboxCaption) return;
    lightboxImg.src = src;
    if (lightboxLink) lightboxLink.href = src;
    lightboxCaption.textContent = caption;
    lightbox.classList.add('open');
    document.body.style.overflow = 'hidden'; // Disable scroll
  }

  // Click listener for achievements certificates
  const clickableCerts = document.querySelectorAll('.clickable-cert');
  clickableCerts.forEach(cert => {
    cert.addEventListener('click', (e) => {
      e.preventDefault();
      const src = cert.getAttribute('data-cert-src');
      const caption = cert.getAttribute('data-cert-caption');
      if (src) {
        openLightbox(src, caption || 'Certificate');
      }
    });
  });

  if (lightbox) {
    const closeBtn = lightbox.querySelector('.lightbox-close');

    const closeLightbox = () => {
      lightbox.classList.remove('open');
      document.body.style.overflow = ''; // Restore scroll
    };

    if (closeBtn) {
      closeBtn.addEventListener('click', closeLightbox);
    }

    lightbox.addEventListener('click', (e) => {
      if (e.target === lightbox || e.target.classList.contains('lightbox-close')) {
        closeLightbox();
      }
    });

    // Escape key listener
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && lightbox.classList.contains('open')) {
        closeLightbox();
      }
    });
  }

  /* ─────────────────────────────────────────────
     14. HANDWRITTEN SIGNATURE — opentype.js & WAAPI
     ───────────────────────────────────────────── */
  let signatureFont = null;
  const fontUrl = 'https://www.componentry.fun/LastoriaBoldRegular.otf';

  opentype.load(fontUrl, function (err, font) {
    if (err) {
      console.error('Font could not be loaded: ' + err);
    } else {
      signatureFont = font;
      initSignature();
    }
  });

  function initSignature() {
    if (!signatureFont) return;

    const text = 'Ankesh';
    const fontSize = 64;
    const container = document.getElementById('signatureContainer');
    if (!container) return;

    container.innerHTML = ''; // Clear previous if any

    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    let x = 15; // Starting padding
    const y = fontSize * 1.1; // Baseline offset to fit font outlines nicely

    const pathsContainer = document.createElementNS('http://www.w3.org/2000/svg', 'g');

    for (let i = 0; i < text.length; i++) {
      const char = text[i];
      const glyph = signatureFont.charToGlyph(char);
      const path = glyph.getPath(x, y, fontSize);
      const pathData = path.toPathData();

      const svgPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      svgPath.setAttribute('d', pathData);
      svgPath.setAttribute('class', 'sig-path');
      svgPath.setAttribute('stroke', '#d4af37');
      svgPath.setAttribute('stroke-width', '1.5');
      svgPath.setAttribute('fill', '#d4af37');
      svgPath.setAttribute('fill-opacity', '0');
      svgPath.style.opacity = '0'; // start hidden

      pathsContainer.appendChild(svgPath);

      x += glyph.advanceWidth * (fontSize / signatureFont.unitsPerEm);
    }

    const totalWidth = x + 15; // Ending padding
    const height = fontSize * 1.5;

    svg.setAttribute('viewBox', `0 0 ${totalWidth} ${height}`);
    svg.setAttribute('width', `${totalWidth}px`);
    svg.setAttribute('height', `${height}px`);
    svg.appendChild(pathsContainer);
    container.appendChild(svg);

    // Trigger animation once when signature wrapper scrolls into view
    const signatureWrapper = container.closest('.signature-wrapper');
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          playSignatureAnimation();
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1 });

    if (signatureWrapper) {
      observer.observe(signatureWrapper);
    } else {
      observer.observe(container);
    }
  }

  function playSignatureAnimation() {
    const paths = document.querySelectorAll('.sig-path');
    paths.forEach((path, index) => {
      const length = path.getTotalLength();

      // Reset style values
      path.style.opacity = '1';
      path.style.strokeDasharray = length;
      path.style.strokeDashoffset = length;
      path.style.fillOpacity = '0';

      // Cancel any active animation
      path.getAnimations().forEach(anim => anim.cancel());

      // Stroke draw animation (1.5s duration, 0.2s stagger)
      path.animate([
        { strokeDashoffset: length },
        { strokeDashoffset: 0 }
      ], {
        duration: 1500,
        delay: index * 200,
        fill: 'forwards',
        easing: 'ease-out'
      });

      // Fill flood animation (starts slightly before stroke finishes drawing)
      path.animate([
        { fillOpacity: 0 },
        { fillOpacity: 1 }
      ], {
        duration: 600,
        delay: (index * 200) + 1200,
        fill: 'forwards',
        easing: 'ease-in-out'
      });
    });
  }

  /* ─────────────────────────────────────────────
     15. WEBGL PLASMA BACKGROUND
     ───────────────────────────────────────────── */
  const canvas = document.getElementById('plasma-bg');
  if (canvas) {
    initPlasma();
  }

  function initPlasma() {
    let gl;
    try {
      gl = canvas.getContext('webgl', { antialias: false, alpha: false });
    } catch (e) {
      // Fallback
    }
    if (!gl) {
      canvas.style.display = 'none';
      return;
    }

    const VERTEX_SHADER_SRC = `
attribute vec2 position;
void main() {
  gl_Position = vec4(position, 0.0, 1.0);
}
    `;

    const FRAGMENT_SHADER_SRC = `
precision highp float;

uniform vec2 u_res;
uniform float u_time;
uniform vec2 u_mouse;
uniform float u_isDark;
uniform float u_speed;
uniform float u_turbulence;
uniform float u_mouseInfluence;
uniform float u_grain;
uniform float u_sparkle;
uniform float u_vignette;
uniform float u_opacity;

uniform vec3 u_darkA;
uniform vec3 u_darkB;
uniform vec3 u_darkC;
uniform vec3 u_lightA;
uniform vec3 u_lightB;
uniform vec3 u_lightC;

vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec2 mod289(vec2 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec3 permute(vec3 x) { return mod289(((x * 34.0) + 1.0) * x); }

float snoise(vec2 v) {
  const vec4 C = vec4(0.211324865405187, 0.366025403784439,
                     -0.577350269189626, 0.024390243902439);
  vec2 i = floor(v + dot(v, C.yy));
  vec2 x0 = v - i + dot(i, C.xx);
  vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
  vec4 x12 = x0.xyxy + C.xxzz;
  x12.xy -= i1;
  i = mod289(i);
  vec3 p = permute(permute(i.y + vec3(0.0, i1.y, 1.0)) + i.x + vec3(0.0, i1.x, 1.0));
  vec3 m = max(0.5 - vec3(dot(x0, x0), dot(x12.xy, x12.xy), dot(x12.zw, x12.zw)), 0.0);
  m = m * m;
  m = m * m;
  vec3 x = 2.0 * fract(p * C.www) - 1.0;
  vec3 h = abs(x) - 0.5;
  vec3 ox = floor(x + 0.5);
  vec3 a0 = x - ox;
  m *= 1.79284291400159 - 0.85373472095314 * (a0 * a0 + h * h);
  vec3 g;
  g.x = a0.x * x0.x + h.x * x0.y;
  g.yz = a0.yz * x12.xz + h.yz * x12.yw;
  return 130.0 * dot(m, g);
}

float fbm(vec2 p, float turbulence) {
  float total = 0.0;
  float amp = 0.5;
  float freq = 1.0;
  mat2 rot = mat2(cos(0.45), sin(0.45), -sin(0.45), cos(0.45));
  for (int i = 0; i < 5; i++) {
    total += snoise(p * freq) * amp;
    p = rot * p;
    freq *= mix(1.85, 2.35, clamp(turbulence, 0.0, 2.0) * 0.5);
    amp *= 0.5;
  }
  return total;
}

void main() {
  vec2 uv = gl_FragCoord.xy / u_res;
  float aspect = u_res.x / max(u_res.y, 1.0);
  vec2 p = (uv - 0.5) * vec2(aspect, 1.0);
  float t = u_time * (0.15 * u_speed);

  vec2 mouse = (u_mouse - 0.5) * vec2(aspect, 1.0);
  float dMouse = length(p - mouse);
  p += (mouse - p) * 0.02 * u_mouseInfluence * smoothstep(0.45, 0.0, dMouse);

  vec2 flow = vec2(
    fbm(p + vec2(t * 0.2, t * 0.1), u_turbulence),
    fbm(p + vec2(-t * 0.1, t * 0.3), u_turbulence)
  );

  float n = fbm(p * 2.0 + flow * 1.45, u_turbulence);
  float ridges = 1.0 - abs(snoise(p * 4.0 + n) * 2.0);
  ridges = pow(ridges, 3.0);

  vec3 colorA = mix(u_lightA, u_darkA, u_isDark);
  vec3 colorB = mix(u_lightB, u_darkB, u_isDark);
  vec3 colorC = mix(u_lightC, u_darkC, u_isDark);

  vec3 col = mix(colorA, colorB, smoothstep(-0.5, 0.5, n));
  col = mix(col, colorC, smoothstep(0.25, 1.0, n * 0.52 + ridges * 0.48));

  float sparkle = pow(max(0.0, snoise(gl_FragCoord.xy * 0.2 + t * 2.0)), 18.0) * 0.5 * u_sparkle;
  vec3 sparkleColor = mix(vec3(0.56, 0.58, 0.72), vec3(0.8, 0.9, 1.0), u_isDark);
  col += sparkleColor * sparkle;

  float vigDark = 1.0 - smoothstep(0.5, mix(1.8, 1.55, u_isDark), length(p));
  col = mix(col, col * vigDark, u_isDark * u_vignette);
  float vigLight = 1.0 - smoothstep(0.4, 1.45, length(p));
  col = mix(mix(vec3(1.0), col, vigLight), col, u_isDark);

  float grain = (fract(sin(dot(gl_FragCoord.xy + t * 50.0, vec2(12.9898, 78.233))) * 43758.5453) - 0.5) * (0.06 * u_grain);
  col += grain;

  gl_FragColor = vec4(clamp(col, 0.0, 1.0), u_opacity);
}
    `;

    // Colors
    const darkColorA = '#0a1929';
    const darkColorB = '#102a43';
    const darkColorC = '#d4af37';
    const lightColorA = '#f0f2f7';
    const lightColorB = '#d7dceb';
    const lightColorC = '#bcc5e0';

    // Uniform settings
    const settings = {
      speed: 0.8,
      turbulence: 1.2,
      mouseInfluence: 1.0,
      grain: 0.8,
      sparkle: 1.2,
      vignette: 1.0,
      opacity: 1.0,
      isDark: 1.0
    };

    function hexToRgb01(hex) {
      const normalized = hex.trim().replace('#', '');
      const r = parseInt(normalized.slice(0, 2), 16) / 255;
      const g = parseInt(normalized.slice(2, 4), 16) / 255;
      const b = parseInt(normalized.slice(4, 6), 16) / 255;
      return [r, g, b];
    }

    function compileShader(type, source) {
      const shader = gl.createShader(type);
      if (!shader) return null;
      gl.shaderSource(shader, source);
      gl.compileShader(shader);
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        console.error(gl.getShaderInfoLog(shader));
        gl.deleteShader(shader);
        return null;
      }
      return shader;
    }

    const vertexShader = compileShader(gl.VERTEX_SHADER, VERTEX_SHADER_SRC);
    const fragmentShader = compileShader(gl.FRAGMENT_SHADER, FRAGMENT_SHADER_SRC);

    if (!vertexShader || !fragmentShader) {
      canvas.style.display = 'none';
      return;
    }

    const program = gl.createProgram();
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      console.error(gl.getProgramInfoLog(program));
      gl.deleteShader(vertexShader);
      gl.deleteShader(fragmentShader);
      gl.deleteProgram(program);
      canvas.style.display = 'none';
      return;
    }

    gl.useProgram(program);

    // Buffers and attributes
    const positionAttributeLocation = gl.getAttribLocation(program, 'position');
    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([
        -1.0, -1.0,
        1.0, -1.0,
        -1.0, 1.0,
        1.0, 1.0,
      ]),
      gl.STATIC_DRAW
    );
    gl.enableVertexAttribArray(positionAttributeLocation);
    gl.vertexAttribPointer(positionAttributeLocation, 2, gl.FLOAT, false, 0, 0);

    // Uniform locations
    const uRes = gl.getUniformLocation(program, 'u_res');
    const uTime = gl.getUniformLocation(program, 'u_time');
    const uMouse = gl.getUniformLocation(program, 'u_mouse');
    const uIsDark = gl.getUniformLocation(program, 'u_isDark');
    const uSpeed = gl.getUniformLocation(program, 'u_speed');
    const uTurbulence = gl.getUniformLocation(program, 'u_turbulence');
    const uMouseInfluence = gl.getUniformLocation(program, 'u_mouseInfluence');
    const uGrain = gl.getUniformLocation(program, 'u_grain');
    const uSparkle = gl.getUniformLocation(program, 'u_sparkle');
    const uVignette = gl.getUniformLocation(program, 'u_vignette');
    const uOpacity = gl.getUniformLocation(program, 'u_opacity');

    const uDarkA = gl.getUniformLocation(program, 'u_darkA');
    const uDarkB = gl.getUniformLocation(program, 'u_darkB');
    const uDarkC = gl.getUniformLocation(program, 'u_darkC');
    const uLightA = gl.getUniformLocation(program, 'u_lightA');
    const uLightB = gl.getUniformLocation(program, 'u_lightB');
    const uLightC = gl.getUniformLocation(program, 'u_lightC');

    // Convert colors to vec3 floats
    const cDarkA = hexToRgb01(darkColorA);
    const cDarkB = hexToRgb01(darkColorB);
    const cDarkC = hexToRgb01(darkColorC);
    const cLightA = hexToRgb01(lightColorA);
    const cLightB = hexToRgb01(lightColorB);
    const cLightC = hexToRgb01(lightColorC);

    gl.uniform3f(uDarkA, cDarkA[0], cDarkA[1], cDarkA[2]);
    gl.uniform3f(uDarkB, cDarkB[0], cDarkB[1], cDarkB[2]);
    gl.uniform3f(uDarkC, cDarkC[0], cDarkC[1], cDarkC[2]);
    gl.uniform3f(uLightA, cLightA[0], cLightA[1], cLightA[2]);
    gl.uniform3f(uLightB, cLightB[0], cLightB[1], cLightB[2]);
    gl.uniform3f(uLightC, cLightC[0], cLightC[1], cLightC[2]);

    // Mouse positions
    let mouse = { x: 0.5, y: 0.5 };
    let targetMouse = { x: 0.5, y: 0.5 };

    // Event listeners
    window.addEventListener('mousemove', (e) => {
      targetMouse.x = e.clientX / window.innerWidth;
      targetMouse.y = 1.0 - (e.clientY / window.innerHeight);
    });

    window.addEventListener('mouseleave', () => {
      targetMouse.x = 0.5;
      targetMouse.y = 0.5;
    });

    // Resize handler
    function resizeCanvas() {
      const dpr = Math.min(window.devicePixelRatio || 1.0, 1.75);
      const width = window.innerWidth;
      const height = window.innerHeight;
      canvas.width = Math.max(1, Math.floor(width * dpr));
      canvas.height = Math.max(1, Math.floor(height * dpr));
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.uniform2f(uRes, canvas.width, canvas.height);
    }

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Animation loop
    const start = performance.now();
    let rafId;

    function render(now) {
      const elapsed = (now - start) / 1000;

      // Lerp mouse
      mouse.x += (targetMouse.x - mouse.x) * 0.05;
      mouse.y += (targetMouse.y - mouse.y) * 0.05;

      gl.uniform1f(uTime, elapsed);
      gl.uniform2f(uMouse, mouse.x, mouse.y);
      gl.uniform1f(uIsDark, settings.isDark);
      gl.uniform1f(uSpeed, settings.speed);
      gl.uniform1f(uTurbulence, settings.turbulence);
      gl.uniform1f(uMouseInfluence, settings.mouseInfluence);
      gl.uniform1f(uGrain, settings.grain);
      gl.uniform1f(uSparkle, settings.sparkle);
      gl.uniform1f(uVignette, settings.vignette);
      gl.uniform1f(uOpacity, settings.opacity);

      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

      rafId = requestAnimationFrame(render);
    }

    rafId = requestAnimationFrame(render);
  }

  /* ─────────────────────────────────────────────
     CERTIFICATE MODAL — Bold Analytics
     ───────────────────────────────────────────── */
  const certModal = document.getElementById('certModal');
  const openCertBtn = document.getElementById('openCertModal');
  const closeCertBtn = document.getElementById('closeCertModal');
  const certModalBackdrop = document.getElementById('certModalBackdrop');

  function openCert() {
    certModal.classList.add('open');
    document.body.style.overflow = 'hidden';
  }

  function closeCert() {
    certModal.classList.remove('open');
    document.body.style.overflow = '';
  }

  if (openCertBtn) {
    openCertBtn.addEventListener('click', openCert);
    openCertBtn.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') openCert(); });
  }
  if (closeCertBtn) closeCertBtn.addEventListener('click', closeCert);
  if (certModalBackdrop) certModalBackdrop.addEventListener('click', closeCert);

  /* ─────────────────────────────────────────────
     CERTIFICATE MODAL — Prodigy Infotech
     ───────────────────────────────────────────── */
  const prodigyCertModal = document.getElementById('prodigyCertModal');
  const openProdigyCertBtn = document.getElementById('openProdigyCertModal');
  const closeProdigyCertBtn = document.getElementById('closeProdigyCertModal');
  const prodigyCertModalBackdrop = document.getElementById('prodigyCertModalBackdrop');

  function openProdigyCert() {
    prodigyCertModal.classList.add('open');
    document.body.style.overflow = 'hidden';
  }

  function closeProdigyCert() {
    prodigyCertModal.classList.remove('open');
    document.body.style.overflow = '';
  }

  if (openProdigyCertBtn) {
    openProdigyCertBtn.addEventListener('click', openProdigyCert);
    openProdigyCertBtn.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') openProdigyCert(); });
  }
  if (closeProdigyCertBtn) closeProdigyCertBtn.addEventListener('click', closeProdigyCert);
  if (prodigyCertModalBackdrop) prodigyCertModalBackdrop.addEventListener('click', closeProdigyCert);

  /* ─────────────────────────────────────────────
     CERTIFICATE MODAL — Alfido Tech
     ───────────────────────────────────────────── */
  const alfidoCertModal = document.getElementById('alfidoCertModal');
  const openAlfidoCertBtn = document.getElementById('openAlfidoCertModal');
  const closeAlfidoCertBtn = document.getElementById('closeAlfidoCertModal');
  const alfidoCertModalBackdrop = document.getElementById('alfidoCertModalBackdrop');

  function openAlfidoCert() {
    if (alfidoCertModal) {
      alfidoCertModal.classList.add('open');
      document.body.style.overflow = 'hidden';
    }
  }

  function closeAlfidoCert() {
    if (alfidoCertModal) {
      alfidoCertModal.classList.remove('open');
      document.body.style.overflow = '';
    }
  }

  if (openAlfidoCertBtn) {
    openAlfidoCertBtn.addEventListener('click', openAlfidoCert);
    openAlfidoCertBtn.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') openAlfidoCert(); });
  }
  if (closeAlfidoCertBtn) closeAlfidoCertBtn.addEventListener('click', closeAlfidoCert);
  if (alfidoCertModalBackdrop) alfidoCertModalBackdrop.addEventListener('click', closeAlfidoCert);

  /* ─────────────────────────────────────────────
     PHOTO MODAL — TCS Technology Day
     ───────────────────────────────────────────── */
  const tcsPhotoModal = document.getElementById('tcsPhotoModal');
  const openTCSPhotoBtn = document.getElementById('openTCSPhotoModal');
  const closeTCSPhotoBtn = document.getElementById('closeTCSPhotoModal');
  const tcsPhotoModalBackdrop = document.getElementById('tcsPhotoModalBackdrop');

  function openTCSPhoto() {
    if (tcsPhotoModal) {
      tcsPhotoModal.classList.add('open');
      document.body.style.overflow = 'hidden';
    }
  }

  function closeTCSPhoto() {
    if (tcsPhotoModal) {
      tcsPhotoModal.classList.remove('open');
      document.body.style.overflow = '';
    }
  }

  if (openTCSPhotoBtn) {
    openTCSPhotoBtn.addEventListener('click', openTCSPhoto);
    openTCSPhotoBtn.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') openTCSPhoto(); });
  }
  if (closeTCSPhotoBtn) closeTCSPhotoBtn.addEventListener('click', closeTCSPhoto);
  if (tcsPhotoModalBackdrop) tcsPhotoModalBackdrop.addEventListener('click', closeTCSPhoto);

  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') {
      if (certModal && certModal.classList.contains('open')) closeCert();
      if (prodigyCertModal && prodigyCertModal.classList.contains('open')) closeProdigyCert();
      if (alfidoCertModal && alfidoCertModal.classList.contains('open')) closeAlfidoCert();
      if (tcsPhotoModal && tcsPhotoModal.classList.contains('open')) closeTCSPhoto();
    }
  });

});


