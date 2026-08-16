document.addEventListener("DOMContentLoaded", () => {
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const finePointer = window.matchMedia("(pointer:fine)").matches;

  // Mobile navigation
  const menuButton = document.querySelector(".menu-toggle");
  const nav = document.querySelector(".main-nav");

  if (menuButton && nav) {
    menuButton.addEventListener("click", () => {
      nav.classList.toggle("mobile-open");
    });

    nav.querySelectorAll("a").forEach(link => {
      link.addEventListener("click", () => nav.classList.remove("mobile-open"));
    });
  }

  // Reveal-on-scroll
  const revealItems = document.querySelectorAll(".reveal");

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add("visible");
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12 });

  revealItems.forEach(item => observer.observe(item));

  // Cursor glow on desktop
  const glow = document.querySelector(".cursor-glow");

  if (glow && finePointer) {
    window.addEventListener("pointermove", (event) => {
      glow.style.left = `${event.clientX}px`;
      glow.style.top = `${event.clientY}px`;
    });
  }

  // Header changes weight once the page has scrolled past the hero
  const header = document.querySelector(".site-header");

  if (header) {
    const setScrolled = () => header.classList.toggle("is-scrolled", window.scrollY > 40);
    setScrolled();
    window.addEventListener("scroll", setScrolled, { passive: true });
  }

  // Project media: image OR video, with a silent fallback to the
  // gradient + label already styled per project when a source is
  // missing or fails to load.
  document.querySelectorAll(".project-media").forEach(media => {
    const markMissing = () => {
      media.classList.add("media-missing");
    };

    if (media.tagName === "VIDEO") {
      if (!media.getAttribute("src")) {
        markMissing();
        return;
      }

      media.addEventListener("error", markMissing, true);

      if (reduceMotion) {
        // Respect reduced-motion: show the first frame, no autoplay loop.
        media.removeAttribute("autoplay");
        media.pause();
      } else {
        media.setAttribute("autoplay", "");
        media.play().catch(() => { /* autoplay can be blocked; frame still shows */ });
      }
    } else {
      if (!media.getAttribute("src")) {
        markMissing();
        return;
      }
      media.addEventListener("error", markMissing, { once: true });
    }
  });

  // Project cards: gentle 3D tilt toward the cursor, layered on top of
  // the existing lift + border-glow hover (the "running film" feel
  // gets a bit of depth instead of just moving flatly).
  if (!reduceMotion && finePointer) {
    document.querySelectorAll(".project-card").forEach(card => {
      card.addEventListener("pointermove", (event) => {
        const rect = card.getBoundingClientRect();
        const px = (event.clientX - rect.left) / rect.width - 0.5;
        const py = (event.clientY - rect.top) / rect.height - 0.5;
        const rotateX = (-py * 8).toFixed(2);
        const rotateY = (px * 10).toFixed(2);
        card.style.transform = `translateY(-7px) perspective(900px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
      });

      card.addEventListener("pointerleave", () => {
        card.style.transform = "";
      });
    });
  }

  // Magnetic buttons: a light pull toward the cursor on desktop pointers,
  // the kind of small tactile detail that separates a bespoke build from
  // a template.
  if (!reduceMotion && finePointer) {
    document.querySelectorAll(".magnetic").forEach(el => {
      el.addEventListener("pointermove", (event) => {
        const rect = el.getBoundingClientRect();
        const x = event.clientX - rect.left - rect.width / 2;
        const y = event.clientY - rect.top - rect.height / 2;
        el.style.transform = `translate(${x * 0.18}px, ${y * 0.35}px)`;
      });

      el.addEventListener("pointerleave", () => {
        el.style.transform = "";
      });
    });
  }

  // NAME TAG: fixed below the header, with a subtle pendulum swing (CSS), plus an interactive tilt
  // that follows the cursor and a drag-to-swing gesture, like the
  // lanyard is actually being nudged/held.
  const idBadge = document.querySelector(".id-badge");

  if (idBadge && !reduceMotion) {
    let dragging = false;
    let dragStartX = 0;
    let releaseTimer = null;

    const setTilt = (deg) => {
      idBadge.style.animation = "none";
      idBadge.style.transform = `rotate(${deg}deg)`;
    };

    const resumeIdleSwing = () => {
      idBadge.style.transform = "";
      idBadge.style.animation = "";
    };

    idBadge.addEventListener("pointermove", (event) => {
      const rect = idBadge.getBoundingClientRect();
      const relX = (event.clientX - (rect.left + rect.width / 2)) / rect.width;

      if (dragging) {
        const delta = event.clientX - dragStartX;
        setTilt(Math.max(-30, Math.min(30, delta * 0.45)));
      } else if (finePointer) {
        setTilt(Math.max(-16, Math.min(16, relX * 22)));
      }
    });

    idBadge.addEventListener("pointerleave", () => {
      if (!dragging) resumeIdleSwing();
    });

    idBadge.addEventListener("pointerdown", (event) => {
      dragging = true;
      dragStartX = event.clientX;
      idBadge.setPointerCapture(event.pointerId);
      clearTimeout(releaseTimer);
    });

    const endDrag = () => {
      if (!dragging) return;
      dragging = false;
      // Let it settle back into the idle swing after a short beat,
      // instead of snapping straight back.
      releaseTimer = setTimeout(resumeIdleSwing, 200);
    };

    idBadge.addEventListener("pointerup", endDrag);
    idBadge.addEventListener("pointercancel", endDrag);
  }

  // Prevent accidental horizontal page scrolling from moving shelves.
  document.body.style.overflowX = "hidden";
});
