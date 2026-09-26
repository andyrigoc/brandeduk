(function () {
    "use strict";

    var VIDEO_SRC = "brandedukv15-child/assets/videos/embroidery/embroidery-scroll.mp4?v=20260926-intra3";
    var VIDEO_FALLBACK = "brandedukv15-child/assets/videos/embroidery/create-an-ultra-realistic-969472967.mp4";

    // Equal wheel distance per stage. videoFrom/videoTo follow the real stitch order.
    var stages = [
        { from: 0, to: 0.20, videoFrom: 0.00, videoTo: 0.08 },
        { from: 0.20, to: 0.40, videoFrom: 0.08, videoTo: 0.24 },
        { from: 0.40, to: 0.60, videoFrom: 0.24, videoTo: 0.45 },
        { from: 0.60, to: 0.80, videoFrom: 0.45, videoTo: 0.66 },
        { from: 0.80, to: 1, videoFrom: 0.66, videoTo: 1 }
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

    function stageIndex(progress) {
        for (var i = 0; i < stages.length; i++) {
            if (progress >= stages[i].from && progress < stages[i].to) return i;
        }
        return stages.length - 1;
    }

    function videoProgress(progress) {
        var stage = stages[stageIndex(progress)];
        var span = stage.to - stage.from;
        var local = span <= 0 ? 1 : clamp((progress - stage.from) / span, 0, 1);
        return stage.videoFrom + (stage.videoTo - stage.videoFrom) * local;
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
        var index = stageIndex(progress);
        if (index === lastStage) return;
        lastStage = index;
        stageItems.forEach(function (item, i) {
            item.classList.toggle("is-active", i === index);
        });
    }

    function applySeek() {
        if (!video || video.readyState < 1 || video.seeking) return;
        if (Math.abs(video.currentTime - targetTime) < 0.012) return;
        try { video.currentTime = targetTime; } catch (err) {}
    }

    function render() {
        running = false;
        var progress = getScrollProgress();
        var duration = video && Number.isFinite(video.duration) && video.duration > 0 ? video.duration : videoDuration;
        targetTime = videoProgress(progress) * Math.max(duration - 0.04, 0);
        currentTime = targetTime;
        applySeek();

        var percentage = Math.round(progress * 100);
        if (progressFill) progressFill.style.height = percentage + "%";
        if (progressValue) progressValue.textContent = percentage + "%";
        updateStage(progress);
        applyPin();
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
        video.addEventListener("seeked", function () {
            if (Math.abs(video.currentTime - targetTime) > 0.012) applySeek();
        });
        video.load();
        if (video.readyState >= 1) bindVideo();
    }

    window.addEventListener("scroll", requestFrame, { passive: true });
    window.addEventListener("resize", requestFrame);
    requestFrame();
})();
