(function () {
    "use strict";

    var VIDEO_SRC = "brandedukv15-child/assets/videos/embroidery/embroidery-scroll.mp4";
    var VIDEO_FALLBACK = "brandedukv15-child/assets/videos/embroidery/create-an-ultra-realistic-969472967.mp4";

    var stages = [
        { from: 0, to: 0.12, number: "STAGE 1", title: "Plain Garment", subtitle: "Ready for embroidery" },
        { from: 0.12, to: 0.30, number: "STAGE 2", title: "Underlay", subtitle: "Building the foundation" },
        { from: 0.30, to: 0.55, number: "STAGE 3", title: "Complex Fill", subtitle: "Colour and structure emerge" },
        { from: 0.55, to: 0.78, number: "STAGE 4", title: "Satin Stitches", subtitle: "Definition and depth" },
        { from: 0.78, to: 1, number: "STAGE 5", title: "Finished Embroidery", subtitle: "Precision in every stitch" }
    ];

    var section = document.querySelector("[data-embroidery-scroll]");
    if (!section) return;

    var pin = section.querySelector("[data-embroidery-pin]");
    var video = document.getElementById("embroideryVideo");
    var progressFill = document.getElementById("progressFill");
    var progressValue = document.getElementById("progressValue");
    var stageItems = Array.prototype.slice.call(section.querySelectorAll("[data-stage]"));
    var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    var videoDuration = 0;
    var targetTime = 0;
    var currentTime = 0;
    var lastStage = -1;
    var running = false;

    function headerH() {
        var raw = getComputedStyle(document.documentElement).getPropertyValue("--brandeduk-site-header-height");
        var value = parseFloat(raw);
        return Number.isFinite(value) ? value : 220;
    }

    function clamp(value, min, max) {
        return Math.max(min, Math.min(max, value));
    }

    function embroideryCurve(p) {
        if (p < 0.10) return p * 0.30;
        if (p < 0.35) return 0.03 + ((p - 0.10) / 0.25) * 0.25;
        if (p < 0.75) return 0.28 + ((p - 0.35) / 0.40) * 0.50;
        return 0.78 + ((p - 0.75) / 0.25) * 0.22;
    }

    function getScrollProgress() {
        var rect = section.getBoundingClientRect();
        var start = headerH();
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
        if (!pin || reduceMotion) return;
        var mode = pinMode();
        pin.classList.toggle("is-fixed", mode === "is-fixed");
        pin.classList.toggle("is-after", mode === "is-after");
    }

    function updateStage(progress) {
        var index = stages.findIndex(function (item) {
            return progress >= item.from && progress < item.to;
        });
        if (index < 0) index = stages.length - 1;
        if (index === lastStage) return;
        lastStage = index;
        stageItems.forEach(function (item, i) {
            item.classList.toggle("is-active", i === index);
        });
    }

    function render() {
        running = false;
        var progress = getScrollProgress();
        var mapped = embroideryCurve(progress);

        targetTime = mapped * Math.max(videoDuration - 0.04, 0);
        currentTime += (targetTime - currentTime) * (reduceMotion ? 1 : 0.18);
        if (Math.abs(targetTime - currentTime) < 0.002) currentTime = targetTime;

        if (video && video.readyState >= 2 && Math.abs(video.currentTime - currentTime) > 0.015) {
            try { video.currentTime = currentTime; } catch (err) {}
        }

        var percentage = Math.round(progress * 100);
        if (progressFill) progressFill.style.height = percentage + "%";
        if (progressValue) progressValue.textContent = percentage + "%";
        updateStage(mapped);
        applyPin();

        if (Math.abs(targetTime - currentTime) > 0.002) {
            running = true;
            requestAnimationFrame(render);
        }
    }

    function requestFrame() {
        if (running) return;
        running = true;
        requestAnimationFrame(render);
    }

    function bindVideo() {
        video.pause();
        videoDuration = video.duration || 0;
        video.currentTime = 0;
        currentTime = 0;
        targetTime = 0;
        var playAttempt = video.play();
        if (playAttempt && playAttempt.then) {
            playAttempt.then(function () { video.pause(); requestFrame(); }).catch(function () { requestFrame(); });
        } else {
            requestFrame();
        }
    }

    if (video) {
        video.setAttribute("src", VIDEO_SRC);
        video.addEventListener("loadedmetadata", bindVideo);
        video.addEventListener("error", function () {
            if (video.getAttribute("data-fallback-used")) return;
            video.setAttribute("data-fallback-used", "1");
            video.src = VIDEO_FALLBACK;
            video.load();
        });
        video.load();
        if (video.readyState >= 1) bindVideo();
    }

    window.addEventListener("scroll", requestFrame, { passive: true });
    window.addEventListener("resize", requestFrame);
    requestFrame();
})();
