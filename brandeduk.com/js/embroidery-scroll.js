(function () {
    "use strict";

    var VIDEO_SRC = "brandedukv15-child/assets/videos/embroidery/embroidery-scroll.mp4?v=20260928-scrub2";

    var stages = [
        { from: 0, to: 0.12 },
        { from: 0.12, to: 0.30 },
        { from: 0.30, to: 0.55 },
        { from: 0.55, to: 0.78 },
        { from: 0.78, to: 1 }
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
    var objectUrl = "";
    var sourceReady = false;
    var ignoreMediaError = false;

    function headerH() {
        var raw = getComputedStyle(document.documentElement).getPropertyValue("--brandeduk-site-header-height");
        var value = parseFloat(raw);
        return Number.isFinite(value) ? value : 220;
    }

    function clamp(value, min, max) {
        return Math.max(min, Math.min(max, value));
    }

    function embroideryCurve(p) {
        p = clamp(p, 0, 1);
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
        var header = document.querySelector(".site-header");
        var hidden = !!(header && header.classList.contains("header-hidden"));
        pin.classList.toggle("is-fixed", mode === "is-fixed");
        pin.classList.toggle("is-after", mode === "is-after");
        if (mode === "is-fixed") {
            pin.style.top = hidden ? "0px" : "";
            pin.style.height = hidden ? "100vh" : "";
        } else {
            pin.style.top = "";
            pin.style.height = "";
        }
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

    function forcePause() {
        if (!video) return;
        video.autoplay = false;
        video.loop = false;
        if (!video.paused) {
            try { video.pause(); } catch (err) {}
        }
    }

    function seekableEnd() {
        if (!video || !video.seekable || !video.seekable.length) return 0;
        try {
            return video.seekable.end(video.seekable.length - 1);
        } catch (err) {
            return 0;
        }
    }

    function applySeek() {
        if (!video || !sourceReady || video.readyState < 2) return;
        if (seekableEnd() < 0.05) return;
        if (video.seeking) return;
        if (Math.abs(video.currentTime - currentTime) < 0.015) return;
        try { video.currentTime = currentTime; } catch (err) {}
    }

    function render() {
        running = false;
        forcePause();
        applyPin();

        var progress = getScrollProgress();
        var mapped = embroideryCurve(progress);
        var duration = video && Number.isFinite(video.duration) && video.duration > 0
            ? video.duration
            : videoDuration;
        if (duration > 0) videoDuration = duration;

        targetTime = mapped * Math.max(duration - 0.04, 0);
        currentTime += (targetTime - currentTime) * (reduceMotion ? 1 : 0.18);
        if (Math.abs(targetTime - currentTime) < 0.002) currentTime = targetTime;

        applySeek();

        var percentage = Math.round(progress * 100);
        if (progressFill) progressFill.style.height = percentage + "%";
        if (progressValue) progressValue.textContent = percentage + "%";
        updateStage(mapped);

        if (Math.abs(targetTime - currentTime) > 0.002 || pinMode() === "is-fixed") {
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
        if (!video) return;
        forcePause();
        videoDuration = video.duration || videoDuration;
        sourceReady = seekableEnd() > 0.05 || video.readyState >= 2;
        requestFrame();
    }

    function assignSrc(url) {
        sourceReady = false;
        ignoreMediaError = false;
        video.src = url;
        video.load();
        forcePause();
    }

    function attachSeekableSource(url, attempt) {
        fetch(url).then(function (res) {
            if (!res.ok) throw new Error("video fetch failed " + res.status);
            return res.blob();
        }).then(function (blob) {
            if (objectUrl) URL.revokeObjectURL(objectUrl);
            objectUrl = URL.createObjectURL(blob);
            assignSrc(objectUrl);
        }).catch(function (err) {
            if (typeof console !== "undefined") console.warn("embroidery video", err);
            if ((attempt || 0) < 1) {
                attachSeekableSource(url, (attempt || 0) + 1);
                return;
            }
            assignSrc(url);
        });
    }

    if (video) {
        video.autoplay = false;
        video.loop = false;
        video.muted = true;
        video.playsInline = true;
        video.setAttribute("playsinline", "");
        video.setAttribute("webkit-playsinline", "");
        video.removeAttribute("autoplay");
        video.addEventListener("play", function () {
            forcePause();
        });
        video.addEventListener("playing", function () {
            forcePause();
        });
        video.addEventListener("loadedmetadata", bindVideo);
        video.addEventListener("loadeddata", bindVideo);
        video.addEventListener("error", function () {
            if (ignoreMediaError) return;
            if (video.error && video.error.code === 1) return;
            if ((video.currentSrc || "").indexOf("blob:") === 0) return;
            assignSrc(VIDEO_SRC);
        });
        video.addEventListener("seeked", requestFrame);
        forcePause();
        attachSeekableSource(VIDEO_SRC);
    }

    window.addEventListener("scroll", requestFrame, { passive: true });
    window.addEventListener("resize", requestFrame);
    requestFrame();
})();
