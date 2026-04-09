/* ═══════════════════════════════════════════════════════
   WHATSAPP POPUP JS – Shared across all pages
   ═══════════════════════════════════════════════════════ */
(function () {
    'use strict';

    var openBtn  = document.getElementById('openWhatsappPopup');
    var closeBtn = document.getElementById('closeWhatsappPopup');
    var popup    = document.getElementById('waPopup');

    if (!openBtn || !closeBtn || !popup) return;

    openBtn.addEventListener('click', function () {
        popup.classList.add('is-active');
    });

    closeBtn.addEventListener('click', function () {
        popup.classList.remove('is-active');
    });

    // Close on overlay click
    popup.addEventListener('click', function (e) {
        if (e.target === popup) {
            popup.classList.remove('is-active');
        }
    });

    // Close on Escape
    document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape') {
            popup.classList.remove('is-active');
        }
    });

    // Close popup after CTA click so page is clean when user returns
    var cta = popup.querySelector('.wa-popup__cta');
    if (cta) {
        cta.addEventListener('click', function () {
            setTimeout(function () {
                popup.classList.remove('is-active');
            }, 300);
        });
    }
})();
