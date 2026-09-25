(function () {
    "use strict";

    var NAMES = ["LEAVERS", "TOGETHER", "WAREHOUSE POLOS", "HI-VIS WORKWEAR", "APRONS", "CHEFWEAR"];
    var IMAGES = [
        "brandedukv15-child/assets/images/uniform-cube/leavers.webp",
        "brandedukv15-child/assets/images/uniform-cube/together.webp",
        "brandedukv15-child/assets/images/uniform-cube/warehouse-polos.webp",
        "brandedukv15-child/assets/images/uniform-cube/hi-vis.webp",
        "brandedukv15-child/assets/images/uniform-cube/aprons.webp",
        "brandedukv15-child/assets/images/uniform-cube/chefwear.webp"
    ];
    var STOPS = [
        { x: 90, y: 0 },
        { x: 0, y: 0 },
        { x: 0, y: -90 },
        { x: 0, y: -180 },
        { x: 0, y: -270 },
        { x: -90, y: -360 }
    ];

    var section = document.querySelector("[data-uniform-cube]");
    if (!section) return;

    var cube = section.querySelector("[data-uniform-box]");
    var faces = Array.prototype.slice.call(section.querySelectorAll("[data-face]"));
    var slides = Array.prototype.slice.call(section.querySelectorAll("[data-uniform-slide]"));
    var dotsRoot = section.querySelector("[data-uniform-dots]");
    var pct = section.querySelector("[data-uniform-pct]");
    var fill = section.querySelector("[data-uniform-fill]");
    var nameEl = section.querySelector("[data-uniform-name]");
    var stage = section.querySelector("[data-uniform-stage]");
    var hud = section.querySelector("[data-uniform-hud]");
    var pinned = [stage, hud, dotsRoot].filter(Boolean);
    var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    function headerH() {
        var raw = getComputedStyle(document.documentElement).getPropertyValue("--brandeduk-site-header-height");
        var value = parseFloat(raw);
        return Number.isFinite(value) ? value : 220;
    }

    function clamp(value, min, max) {
        return Math.max(min, Math.min(max, value));
    }

    function ease(t) {
        return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
    }

    faces.forEach(function (face, index) {
        var img = new Image();
        img.src = IMAGES[index];
        img.alt = "";
        face.appendChild(img);
        if (!dotsRoot) return;
        var button = document.createElement("button");
        button.type = "button";
        button.className = "uniform-cube__dot" + (index === 0 ? " is-active" : "");
        button.setAttribute("aria-label", NAMES[index]);
        button.addEventListener("click", function () {
            slides[index].scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "start" });
        });
        dotsRoot.appendChild(button);
    });

    var dots = Array.prototype.slice.call(section.querySelectorAll(".uniform-cube__dot"));

    function progress() {
        var rect = section.getBoundingClientRect();
        var top = headerH();
        var start = top;
        var end = window.innerHeight - section.offsetHeight;
        var span = start - end;
        if (span <= 0) return 0;
        return clamp((start - rect.top) / span, 0, 1);
    }

    function pinMode() {
        var rect = section.getBoundingClientRect();
        var top = headerH();
        if (rect.top > top) return "is-before";
        if (rect.bottom <= window.innerHeight) return "is-after";
        return "is-fixed";
    }

    function applyPin() {
        var mode = pinMode();
        pinned.forEach(function (el) {
            el.classList.toggle("is-fixed", mode === "is-fixed");
            el.classList.toggle("is-after", mode === "is-after");
        });
    }

    function activeSlide() {
        var mid = headerH() + (window.innerHeight - headerH()) / 2;
        var best = 0;
        var dist = Infinity;
        slides.forEach(function (slide, index) {
            var rect = slide.getBoundingClientRect();
            var gap = Math.abs(rect.top + rect.height / 2 - mid);
            if (gap < dist) {
                dist = gap;
                best = index;
            }
        });
        return best;
    }

    function updateCube(p) {
        var t = p * (STOPS.length - 1);
        var i = Math.min(Math.floor(t), STOPS.length - 2);
        var f = ease(t - i);
        var a = STOPS[i];
        var b = STOPS[i + 1];
        cube.style.transform = "rotateX(" + (a.x + (b.x - a.x) * f) + "deg) rotateY(" + (a.y + (b.y - a.y) * f) + "deg)";
    }

    var smooth = 0;
    var last = -1;
    var ticking = false;

    function frame() {
        ticking = false;
        var target = progress();
        smooth += (target - smooth) * (reduceMotion ? 1 : 0.12);
        if (Math.abs(target - smooth) < 0.0008) smooth = target;
        updateCube(smooth);
        applyPin();
        if (pct) pct.textContent = String(Math.round(smooth * 100)).padStart(3, "0") + "%";
        if (fill) fill.style.width = (smooth * 100) + "%";
        var index = activeSlide();
        if (index !== last) {
            last = index;
            if (nameEl) nameEl.textContent = NAMES[index];
            dots.forEach(function (dot, n) {
                dot.classList.toggle("is-active", n === index);
            });
        }
        if (Math.abs(target - smooth) > 0.0008) {
            ticking = true;
            requestAnimationFrame(frame);
        }
    }

    function requestFrame() {
        if (ticking) return;
        ticking = true;
        requestAnimationFrame(frame);
    }

    var observer = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
            if (entry.isIntersecting) entry.target.classList.add("is-visible");
        });
    }, { threshold: 0.25 });
    slides.forEach(function (slide) { observer.observe(slide); });

    section.addEventListener("click", function (event) {
        var link = event.target.closest('a[href^="#"]');
        if (!link || !section.contains(link)) return;
        var target = section.querySelector(link.getAttribute("href"));
        if (!target) return;
        event.preventDefault();
        target.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "start" });
    });

    window.addEventListener("scroll", requestFrame, { passive: true });
    window.addEventListener("resize", requestFrame);
    requestFrame();
})();
