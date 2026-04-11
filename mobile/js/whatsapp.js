/* ═══════════════════════════════════════════════════════
   WHATSAPP POPUP JS – Draggable + Dismiss + Popup
   ═══════════════════════════════════════════════════════ */
(function () {
    'use strict';

    var openBtn  = document.getElementById('openWhatsappPopup');
    var closeBtn = document.getElementById('closeWhatsappPopup');
    var popup    = document.getElementById('waPopup');

    if (!openBtn) return;

    // === Create dismiss zone (inject into DOM) ===
    var dismissZone = document.createElement('div');
    dismissZone.className = 'wa-dismiss-zone';
    document.body.appendChild(dismissZone);

    // === Drag state ===
    var isDragging = false;
    var wasDragged = false;
    var startX = 0, startY = 0;
    var btnStartX = 0, btnStartY = 0;
    var dragThreshold = 8; // px before considered a drag

    // === Dismiss state ===
    var dismissKey = 'wa-dismissed';
    // On hard refresh (reload) → clear dismissed state so bubble reappears
    // On navigation (same session) → keep dismissed state
    var navEntries = performance.getEntriesByType('navigation');
    var isReload = navEntries.length > 0 ? navEntries[0].type === 'reload' : (performance.navigation && performance.navigation.type === 1);
    if (isReload) {
        sessionStorage.removeItem(dismissKey);
    }
    if (sessionStorage.getItem(dismissKey) === '1') {
        openBtn.classList.add('is-dismissed');
    }

    // === Position helpers ===
    function getBtnCenter() {
        var rect = openBtn.getBoundingClientRect();
        return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
    }

    function getDismissCenter() {
        var rect = dismissZone.getBoundingClientRect();
        return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
    }

    function isOverDismiss() {
        var btn = getBtnCenter();
        var dz = getDismissCenter();
        var dist = Math.sqrt(Math.pow(btn.x - dz.x, 2) + Math.pow(btn.y - dz.y, 2));
        return dist < 50;
    }

    function snapToEdge() {
        var rect = openBtn.getBoundingClientRect();
        var cx = rect.left + rect.width / 2;
        var vw = window.innerWidth;

        // Snap to nearest horizontal edge
        if (cx < vw / 2) {
            openBtn.style.left = '18px';
            openBtn.style.right = 'auto';
        } else {
            openBtn.style.left = 'auto';
            openBtn.style.right = '18px';
        }
    }

    // === Touch events ===
    openBtn.addEventListener('touchstart', function (e) {
        if (openBtn.classList.contains('is-dismissed')) return;
        var touch = e.touches[0];
        startX = touch.clientX;
        startY = touch.clientY;
        var rect = openBtn.getBoundingClientRect();
        btnStartX = rect.left;
        btnStartY = rect.top;
        wasDragged = false;
    }, { passive: true });

    openBtn.addEventListener('touchmove', function (e) {
        if (openBtn.classList.contains('is-dismissed')) return;
        var touch = e.touches[0];
        var dx = touch.clientX - startX;
        var dy = touch.clientY - startY;

        // Only start drag if moved beyond threshold
        if (!isDragging && (Math.abs(dx) > dragThreshold || Math.abs(dy) > dragThreshold)) {
            isDragging = true;
            wasDragged = true;
            openBtn.classList.add('is-dragging');
            dismissZone.classList.add('is-visible');
            // Switch to top/left positioning
            openBtn.style.right = 'auto';
            openBtn.style.bottom = 'auto';
        }

        if (isDragging) {
            e.preventDefault();
            var newX = Math.max(0, Math.min(btnStartX + dx, window.innerWidth - 56));
            var newY = Math.max(0, Math.min(btnStartY + dy, window.innerHeight - 56));
            openBtn.style.left = newX + 'px';
            openBtn.style.top = newY + 'px';

            // Check proximity to dismiss zone
            if (isOverDismiss()) {
                openBtn.classList.add('is-over-dismiss');
                dismissZone.classList.add('is-hover');
            } else {
                openBtn.classList.remove('is-over-dismiss');
                dismissZone.classList.remove('is-hover');
            }
        }
    }, { passive: false });

    openBtn.addEventListener('touchend', function () {
        if (!isDragging) return;
        isDragging = false;
        openBtn.classList.remove('is-dragging');
        openBtn.classList.remove('is-over-dismiss');
        dismissZone.classList.remove('is-visible');
        dismissZone.classList.remove('is-hover');

        // If over dismiss zone — hide the button
        if (isOverDismiss()) {
            openBtn.classList.add('is-dismissed');
            sessionStorage.setItem(dismissKey, '1');
            // Re-appear after 60 seconds
            setTimeout(function () {
                openBtn.classList.remove('is-dismissed');
                openBtn.style.left = 'auto';
                openBtn.style.right = '18px';
                openBtn.style.top = 'auto';
                openBtn.style.bottom = '82px';
                sessionStorage.removeItem(dismissKey);
            }, 60000);
        } else {
            // Snap to nearest edge
            snapToEdge();
        }
    });

    // === Click — only open popup if NOT dragged ===
    openBtn.addEventListener('click', function (e) {
        if (wasDragged) {
            e.preventDefault();
            e.stopPropagation();
            wasDragged = false;
            return;
        }
        if (popup) popup.classList.add('is-active');
    });

    // === Popup close events ===
    if (closeBtn && popup) {
        closeBtn.addEventListener('click', function () {
            popup.classList.remove('is-active');
        });
    }

    if (popup) {
        popup.addEventListener('click', function (e) {
            if (e.target === popup) {
                popup.classList.remove('is-active');
            }
        });
    }

    document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape' && popup) {
            popup.classList.remove('is-active');
        }
    });

    // Close popup after CTA click
    if (popup) {
        var cta = popup.querySelector('.wa-popup__cta');
        if (cta) {
            cta.addEventListener('click', function () {
                popup.classList.remove('is-active');
            });
        }
    }
})();
