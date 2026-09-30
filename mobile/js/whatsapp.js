/* ═══════════════════════════════════════════════════════
   BRANDED SUPPORT CHAT – Draggable float + panel
   Chatbot send/bot flow requires Google / Facebook / Apple sign-in.
   ═══════════════════════════════════════════════════════ */
(function () {
    'use strict';

    var WA_NUMBER = '447931372126';
    var PHONE_TEL = '02089742722';
    var PHONE_DISPLAY = '020 8974 2722';
    var SCRIPT_SRC = (document.currentScript && document.currentScript.src) || '';
    var LOCAL_PREVIEW_TOKEN = 'local-preview-auth';

    function assetUrl(relativeFromJs) {
        try {
            return new URL(relativeFromJs, SCRIPT_SRC || window.location.href).href;
        } catch (e) {
            return relativeFromJs;
        }
    }

    var IMG = {
        logo: assetUrl('../../brandedukv15-child/assets/images/ui/bd-mark-circle.png'),
        mark: assetUrl('../../brandedukv15-child/assets/images/ui/bd-mark-circle.png'),
        welcome: assetUrl('../../brandedukv15-child/assets/images/ui/chat-welcome-visual.png')
    };

    function waLink(text) {
        var msg = text || 'Hi, I would like some help';
        return 'https://wa.me/' + WA_NUMBER + '?text=' + encodeURIComponent(msg);
    }

    var WELCOME_TEXT = 'Hi! How can we help you today?';
    var WELCOME_DELAY_MS = 2500;
    var welcomeRevealed = false;
    var welcomeTimer = null;
    var chatUnlocked = false;

    function nowLabel() {
        try {
            return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        } catch (e) {
            return '';
        }
    }

    function isLocalHost() {
        var host = window.location.hostname;
        return host === 'localhost' || host === '127.0.0.1';
    }

    function readAuthToken() {
        if (window.BrandedAccount && typeof window.BrandedAccount.token === 'function') {
            return window.BrandedAccount.token() || '';
        }
        return localStorage.getItem('authToken') || localStorage.getItem('coAuthToken') || '';
    }

    function isSignedIn() {
        if (window.BrandedAccountPanel && typeof window.BrandedAccountPanel.isSignedIn === 'function') {
            return !!window.BrandedAccountPanel.isSignedIn();
        }
        return !!readAuthToken();
    }

    function googleIconSvg() {
        return '<svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">' +
            '<path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>' +
            '<path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>' +
            '<path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>' +
            '<path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>' +
            '</svg>';
    }

    function facebookIconSvg() {
        return '<svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">' +
            '<path fill="#1877F2" d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>' +
            '</svg>';
    }

    function appleIconSvg() {
        return '<svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">' +
            '<path fill="#111" d="M16.365 1.43c0 1.14-.42 2.2-1.18 3.02-.78.86-2.06 1.52-3.16 1.43-.14-1.1.42-2.24 1.16-3.04.8-.9 2.2-1.56 3.18-1.41zM20.8 17.2c-.56 1.28-.83 1.85-1.55 2.98-1 1.56-2.41 3.5-4.16 3.52-1.55.02-1.95-1.01-4.06-1-.2.1-2.08.1-3.58 1.02-1.67.02-3.08-1.9-4.08-3.46C1.7 17.1.4 12.6 2.5 9.5c1.05-1.55 2.72-2.53 4.34-2.53 1.62 0 2.64.98 3.98.98 1.3 0 2.1-1 4.02-.98 1.3.02 2.72.74 3.72 2.02-3.26 1.78-2.74 6.42.24 8.21z"/>' +
            '</svg>';
    }

    function buildPopupHtml() {
        return '' +
            '<div class="wa-popup__card" role="dialog" aria-modal="true" aria-label="Branded support chat">' +
            '  <div class="wa-popup__topbar">' +
            '    <div class="wa-popup__brand">' +
            '      <img class="wa-popup__brand-logo" src="' + IMG.logo + '" alt="bd" width="32" height="32" decoding="async">' +
            '    </div>' +
            '    <div class="wa-popup__status"><span class="wa-popup__status-dot" aria-hidden="true"></span><span>We\'re here to help</span></div>' +
            '    <div class="wa-popup__controls">' +
            '      <button type="button" class="wa-popup__ctrl" id="minimizeWhatsappPopup" aria-label="Minimize">' +
            '        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M5 12h14"/></svg>' +
            '      </button>' +
            '      <button type="button" class="wa-popup__ctrl" id="closeWhatsappPopup" aria-label="Close">' +
            '        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M18 6L6 18M6 6l12 12"/></svg>' +
            '      </button>' +
            '    </div>' +
            '  </div>' +
            '  <div class="wa-popup__welcome">' +
            '    <div class="wa-popup__agents" aria-hidden="true">' +
            '      <img class="wa-popup__agents-visual" src="' + IMG.welcome + '" alt="">' +
            '    </div>' +
            '    <div class="wa-popup__welcome-copy">' +
            '      <h3>Hi, welcome to Branded.</h3>' +
            '      <p>Chat with our team about quotes, products and orders.</p>' +
            '    </div>' +
            '  </div>' +
            '  <div class="wa-popup__auth-gate" id="waAuthGate" hidden>' +
            '    <div class="wa-popup__auth-card">' +
            '      <p class="wa-popup__auth-title">Sign in with Google, Facebook or Apple to chat</p>' +
            '      <p class="wa-popup__auth-sub">You can browse the chat window — messaging unlocks after sign-in.</p>' +
            '      <div class="wa-popup__auth-btns">' +
            '        <button type="button" class="wa-popup__auth-btn wa-popup__auth-btn--google" data-wa-auth="google">' +
            googleIconSvg() +
            '          <span>Continue with Google</span>' +
            '        </button>' +
            '        <button type="button" class="wa-popup__auth-btn wa-popup__auth-btn--facebook" data-wa-auth="facebook">' +
            facebookIconSvg() +
            '          <span>Continue with Facebook</span>' +
            '        </button>' +
            '        <button type="button" class="wa-popup__auth-btn wa-popup__auth-btn--apple" data-wa-auth="apple">' +
            appleIconSvg() +
            '          <span>Continue with Apple</span>' +
            '        </button>' +
            '      </div>' +
            '      <p class="wa-popup__auth-note" id="waAuthNote">Google sign-in works now. Facebook &amp; Apple open Account sign-in until those providers go live.</p>' +
            '    </div>' +
            '  </div>' +
            '  <div class="wa-popup__body" id="waChatBody">' +
            '    <div class="wa-msg wa-msg--agent wa-msg--typing" id="waTypingMsg">' +
            '      <img class="wa-msg__avatar" src="' + IMG.mark + '" alt="">' +
            '      <div class="wa-msg__stack">' +
            '        <div class="wa-msg__bubble wa-msg__bubble--typing" aria-label="Branded Support is typing">' +
            '          <span class="wa-typing" aria-hidden="true"><span></span><span></span><span></span></span>' +
            '        </div>' +
            '      </div>' +
            '    </div>' +
            '  </div>' +
            '  <div class="wa-popup__composer" id="waComposer">' +
            '    <div class="wa-popup__input-wrap">' +
            '      <input class="wa-popup__input" id="waChatInput" type="text" placeholder="Write a message, then Send opens WhatsApp..." autocomplete="off">' +
            '      <button type="button" class="wa-popup__icon-btn" id="waChatAttach" aria-label="Attach file">' +
            '        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/></svg>' +
            '      </button>' +
            '      <button type="button" class="wa-popup__send" id="waChatSend" aria-label="Send on WhatsApp" title="Opens WhatsApp — tap Send there to deliver">' +
            '        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M22 2L11 13"/><path d="M22 2l-7 20-4-9-9-4 20-7z"/></svg>' +
            '      </button>' +
            '    </div>' +
            '  </div>' +
            '  <div class="wa-popup__replies" id="waFastReplies" aria-label="Fast replies">' +
            '    <button type="button" class="wa-popup__reply-chip" data-wa-reply="Hi, I need a quote for branded workwear.">Need a quote</button>' +
            '    <button type="button" class="wa-popup__reply-chip" data-wa-reply="Hi, I have a question about my order.">Order question</button>' +
            '    <button type="button" class="wa-popup__reply-chip" data-wa-reply="Hi, can you help with logo placement and pricing?">Logo help</button>' +
            '  </div>' +
            '  <div class="wa-popup__actions">' +
            '    <a class="wa-popup__action" id="waCallTeam" href="tel:' + PHONE_TEL + '">' +
            '      <span class="wa-popup__action-icon wa-popup__action-icon--call" aria-hidden="true">' +
            '        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.81.36 1.6.68 2.35a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.75.32 1.54.55 2.35.68A2 2 0 0 1 22 16.92z"/></svg>' +
            '      </span>' +
            '      <span class="wa-popup__action-label">Call our team</span>' +
            '      <span class="wa-popup__action-chevron" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 18l6-6-6-6"/></svg></span>' +
            '    </a>' +
            '    <a class="wa-popup__action wa-popup__action--alt" id="waSpeakTeam" href="' + waLink('Hi, I would like to speak to a member of your team') + '" target="_blank" rel="noopener">' +
            '      <span class="wa-popup__action-icon wa-popup__action-icon--chat" aria-hidden="true">' +
            '        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>' +
            '      </span>' +
            '      <span class="wa-popup__action-label">Speak to a member of our team</span>' +
            '      <span class="wa-popup__action-chevron" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 18l6-6-6-6"/></svg></span>' +
            '    </a>' +
            '  </div>' +
            '  <div class="wa-popup__quick">' +
            '    <button type="button" class="wa-popup__quick-btn" id="waFastRepliesBtn">' +
            '      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>' +
            '      Fast replies' +
            '    </button>' +
            '    <button type="button" class="wa-popup__quick-btn" id="waQuoteSupport" data-open-contact="1" data-contact-message="Hi, I need quote support for branded workwear / uniforms.">' +
            '      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6M16 13H8M16 17H8M10 9H8"/></svg>' +
            '      Quote support' +
            '    </button>' +
            '    <button type="button" class="wa-popup__quick-btn" id="waOrderHelp" data-open-contact="1" data-contact-message="Hi, I need help with an existing order.">' +
            '      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><path d="M3.3 7L12 12l8.7-5M12 22V12"/></svg>' +
            '      Order help' +
            '    </button>' +
            '  </div>' +
            '</div>';
    }

    function ensurePopup() {
        var popup = document.getElementById('waPopup');
        if (!popup) {
            popup = document.createElement('div');
            popup.className = 'wa-popup';
            popup.id = 'waPopup';
            popup.setAttribute('aria-hidden', 'true');
            document.body.appendChild(popup);
        }
        popup.innerHTML = buildPopupHtml();
        popup.dataset.bukChat = '1';
        return popup;
    }

    function styleFloatButton(btn) {
        if (!btn) return;
        btn.setAttribute('aria-label', 'Open support chat');
        btn.innerHTML =
            '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">' +
            '<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>' +
            '</svg>';
    }

    var openBtn = document.getElementById('openWhatsappPopup');
    var popup = ensurePopup();
    styleFloatButton(openBtn);

    var closeBtn = document.getElementById('closeWhatsappPopup');
    var minimizeBtn = document.getElementById('minimizeWhatsappPopup');
    var inputEl = document.getElementById('waChatInput');
    var sendBtn = document.getElementById('waChatSend');
    var attachBtn = document.getElementById('waChatAttach');
    var chatBody = document.getElementById('waChatBody');
    var fastReplies = document.getElementById('waFastReplies');
    var fastRepliesBtn = document.getElementById('waFastRepliesBtn');
    var authGate = document.getElementById('waAuthGate');
    var composer = document.getElementById('waComposer');
    var authNote = document.getElementById('waAuthNote');

    // === Create dismiss zone (inject into DOM) ===
    var dismissZone = document.createElement('div');
    dismissZone.className = 'wa-dismiss-zone';
    document.body.appendChild(dismissZone);

    // === Drag state ===
    var isDragging = false;
    var wasDragged = false;
    var startX = 0, startY = 0;
    var btnStartX = 0, btnStartY = 0;
    var dragThreshold = 8;

    var dismissKey = 'wa-dismissed';
    sessionStorage.removeItem(dismissKey);
    if (openBtn) openBtn.classList.remove('is-dismissed');

    function getBtnCenter() {
        var rect = openBtn.getBoundingClientRect();
        return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
    }

    function getDismissCenter() {
        var rect = dismissZone.getBoundingClientRect();
        return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
    }

    function isOverDismiss() {
        if (!openBtn) return false;
        var btn = getBtnCenter();
        var dz = getDismissCenter();
        var dist = Math.sqrt(Math.pow(btn.x - dz.x, 2) + Math.pow(btn.y - dz.y, 2));
        return dist < 50;
    }

    function snapToEdge() {
        if (!openBtn) return;
        var rect = openBtn.getBoundingClientRect();
        var cx = rect.left + rect.width / 2;
        var vw = window.innerWidth;
        if (cx < vw / 2) {
            openBtn.style.left = '18px';
            openBtn.style.right = 'auto';
        } else {
            openBtn.style.left = 'auto';
            openBtn.style.right = '18px';
        }
    }

    function restoreFloatingButton() {
        if (!openBtn) return;
        openBtn.classList.remove('is-dismissed');
        sessionStorage.removeItem(dismissKey);
        openBtn.style.left = 'auto';
        openBtn.style.right = '18px';
        openBtn.style.top = 'auto';
        openBtn.style.bottom = window.matchMedia('(min-width: 700px)').matches ? '24px' : '82px';
    }

    function revealWelcomeMessage() {
        if (welcomeRevealed || !chatBody || !chatUnlocked) return;
        welcomeRevealed = true;
        if (welcomeTimer) {
            clearTimeout(welcomeTimer);
            welcomeTimer = null;
        }
        var wrap = document.createElement('div');
        wrap.className = 'wa-msg wa-msg--agent';
        wrap.id = 'waWelcomeMsg';
        wrap.innerHTML =
            '<img class="wa-msg__avatar" src="' + IMG.mark + '" alt="">' +
            '<div class="wa-msg__stack">' +
            '  <div class="wa-msg__bubble"></div>' +
            '  <div class="wa-msg__meta">Branded Support · <span></span></div>' +
            '</div>';
        wrap.querySelector('.wa-msg__bubble').textContent = WELCOME_TEXT;
        wrap.querySelector('.wa-msg__meta span').textContent = nowLabel();
        var typing = document.getElementById('waTypingMsg');
        if (typing && typing.parentNode === chatBody) {
            chatBody.replaceChild(wrap, typing);
        } else if (chatBody.firstChild) {
            chatBody.insertBefore(wrap, chatBody.firstChild);
        } else {
            chatBody.appendChild(wrap);
        }
        chatBody.scrollTop = chatBody.scrollHeight;
    }

    function scheduleWelcomeMessage() {
        if (!chatUnlocked || welcomeRevealed || welcomeTimer) return;
        welcomeTimer = setTimeout(function () {
            welcomeTimer = null;
            revealWelcomeMessage();
        }, WELCOME_DELAY_MS);
    }

    function applyAuthGateUi() {
        chatUnlocked = isSignedIn();
        if (popup) {
            popup.classList.toggle('is-locked', !chatUnlocked);
            popup.classList.toggle('is-unlocked', chatUnlocked);
        }
        if (authGate) {
            if (chatUnlocked) {
                authGate.setAttribute('hidden', '');
                authGate.setAttribute('aria-hidden', 'true');
            } else {
                authGate.removeAttribute('hidden');
                authGate.setAttribute('aria-hidden', 'false');
            }
        }
        if (composer) {
            composer.hidden = !chatUnlocked;
            composer.setAttribute('aria-hidden', chatUnlocked ? 'false' : 'true');
        }
        if (inputEl) {
            inputEl.disabled = !chatUnlocked;
            inputEl.tabIndex = chatUnlocked ? 0 : -1;
        }
        if (sendBtn) sendBtn.disabled = !chatUnlocked;
        if (attachBtn) attachBtn.disabled = !chatUnlocked;
        if (fastRepliesBtn) fastRepliesBtn.disabled = !chatUnlocked;
        if (fastReplies && !chatUnlocked) fastReplies.classList.remove('is-open');
        var quoteBtn = document.getElementById('waQuoteSupport');
        var orderBtn = document.getElementById('waOrderHelp');
        if (quoteBtn) quoteBtn.disabled = !chatUnlocked;
        if (orderBtn) orderBtn.disabled = !chatUnlocked;

        if (chatUnlocked && popup && popup.classList.contains('is-active')) {
            scheduleWelcomeMessage();
        } else if (!chatUnlocked && welcomeTimer) {
            clearTimeout(welcomeTimer);
            welcomeTimer = null;
        }
    }

    function startGoogleFromChat() {
        if (window.BrandedAccountPanel && typeof window.BrandedAccountPanel.startGoogle === 'function') {
            window.BrandedAccountPanel.startGoogle();
            return;
        }
        if (isLocalHost()) {
            var user = {
                firstName: 'Local',
                lastName: 'Preview',
                name: 'Local Preview',
                email: 'local.preview@brandeduk.test',
                picture: 'https://www.brandeduk.com/brandedukv15-child/assets/images/ui/bd-logo-3d.png',
                provider: 'google-local-preview'
            };
            localStorage.setItem('authToken', LOCAL_PREVIEW_TOKEN);
            localStorage.setItem('coAuthToken', LOCAL_PREVIEW_TOKEN);
            localStorage.setItem('authUser', JSON.stringify(user));
            localStorage.setItem('coUser', JSON.stringify(user));
            try {
                window.dispatchEvent(new CustomEvent('branded:auth-changed', {
                    detail: { signedIn: true, user: user }
                }));
            } catch (e) {}
            applyAuthGateUi();
            return;
        }
        var apiBase = (window.BrandedAccount && typeof window.BrandedAccount.apiBaseUrl === 'function')
            ? window.BrandedAccount.apiBaseUrl()
            : (window.API_BASE_URL || 'https://api.brandeduk.com').replace(/\/+$/, '');
        try {
            var url = new URL(window.location.href);
            url.searchParams.delete('token');
            url.searchParams.delete('error');
            localStorage.setItem('authReturnTo', url.toString());
        } catch (e) {}
        window.location.href = apiBase + '/auth/google';
    }

    function openAccountSignIn(providerLabel) {
        if (authNote) {
            authNote.textContent = providerLabel +
                ' sign-in is not live yet — opening Account so you can continue with Google (or email).';
        }
        if (window.BrandedAccountPanel && typeof window.BrandedAccountPanel.openSignIn === 'function') {
            window.BrandedAccountPanel.openSignIn();
            return;
        }
        var btn = document.getElementById('accountBtn');
        if (btn) btn.click();
    }

    function openPopup() {
        applyAuthGateUi();
        popup.classList.remove('is-minimized');
        popup.classList.add('is-active');
        popup.setAttribute('aria-hidden', 'false');
        if (chatUnlocked) {
            scheduleWelcomeMessage();
            if (inputEl) {
                setTimeout(function () { inputEl.focus(); }, 180);
            }
        }
    }

    function closePopup() {
        popup.classList.remove('is-active');
        popup.classList.remove('is-minimized');
        popup.setAttribute('aria-hidden', 'true');
        if (fastReplies) fastReplies.classList.remove('is-open');
    }

    function minimizePopup() {
        popup.classList.add('is-minimized');
        popup.classList.remove('is-active');
        popup.setAttribute('aria-hidden', 'true');
    }

    function appendAgentBubble(text) {
        if (!chatBody || !text || !chatUnlocked) return;
        revealWelcomeMessage();
        var wrap = document.createElement('div');
        wrap.className = 'wa-msg wa-msg--agent';
        wrap.innerHTML =
            '<img class="wa-msg__avatar" src="' + IMG.mark + '" alt="">' +
            '<div class="wa-msg__stack">' +
            '  <div class="wa-msg__bubble"></div>' +
            '  <div class="wa-msg__meta">Branded Support · <span></span></div>' +
            '</div>';
        wrap.querySelector('.wa-msg__bubble').textContent = text;
        wrap.querySelector('.wa-msg__meta span').textContent = nowLabel();
        chatBody.appendChild(wrap);
        chatBody.scrollTop = chatBody.scrollHeight;
    }

    function appendUserBubble(text) {
        if (!chatBody || !text || !chatUnlocked) return;
        revealWelcomeMessage();
        var wrap = document.createElement('div');
        wrap.className = 'wa-msg wa-msg--user';
        wrap.innerHTML =
            '<div class="wa-msg__bubble"></div>' +
            '<div class="wa-msg__meta"><span></span>' +
            '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" aria-hidden="true"><path d="M20 6L9 17l-5-5"/></svg>' +
            '</div>';
        wrap.querySelector('.wa-msg__bubble').textContent = text;
        wrap.querySelector('.wa-msg__meta span').textContent = nowLabel();
        chatBody.appendChild(wrap);
        chatBody.scrollTop = chatBody.scrollHeight;
    }

    function openWhatsAppLink(url) {
        // Prefer a real <a> click inside the user gesture — window.open is often
        // blocked on mobile, so customers think they sent but WhatsApp never opens.
        var anchor = document.createElement('a');
        anchor.href = url;
        anchor.target = '_blank';
        anchor.rel = 'noopener noreferrer';
        anchor.setAttribute('aria-hidden', 'true');
        anchor.style.cssText = 'position:fixed;left:-9999px;top:0;opacity:0;';
        document.body.appendChild(anchor);
        anchor.click();
        window.setTimeout(function () {
            if (anchor.parentNode) anchor.parentNode.removeChild(anchor);
        }, 0);
        return url;
    }

    function sendToWhatsApp(text) {
        if (!chatUnlocked) {
            applyAuthGateUi();
            return '';
        }
        var msg = (text || '').trim();
        if (!msg) msg = 'Hi, I would like some help';
        appendUserBubble(msg);
        var url = waLink(msg);
        openWhatsAppLink(url);
        appendAgentBubble('Opening WhatsApp… Please tap Send there so our team receives your message. If nothing opened, use Speak to a member of our team below.');
        return url;
    }

    function openQuoteContact(message) {
        if (!chatUnlocked) {
            applyAuthGateUi();
            return;
        }
        closePopup();
        if (typeof window.openContactPopup === 'function') {
            window.openContactPopup(message ? { message: message } : undefined);
            return;
        }
        // Fallback: let data-open-contact handler / contact page take over
        var trigger = document.createElement('a');
        trigger.href = '#';
        trigger.setAttribute('data-open-contact', '1');
        if (message) trigger.setAttribute('data-contact-message', message);
        document.body.appendChild(trigger);
        trigger.click();
        trigger.remove();
    }

    // Touch drag (only if float exists)
    if (openBtn) {
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

            if (!isDragging && (Math.abs(dx) > dragThreshold || Math.abs(dy) > dragThreshold)) {
                isDragging = true;
                wasDragged = true;
                openBtn.classList.add('is-dragging');
                dismissZone.classList.add('is-visible');
                openBtn.style.right = 'auto';
                openBtn.style.bottom = 'auto';
            }

            if (isDragging) {
                e.preventDefault();
                var newX = Math.max(0, Math.min(btnStartX + dx, window.innerWidth - 56));
                var newY = Math.max(0, Math.min(btnStartY + dy, window.innerHeight - 56));
                openBtn.style.left = newX + 'px';
                openBtn.style.top = newY + 'px';

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

            if (isOverDismiss()) {
                openBtn.classList.add('is-dismissed');
                sessionStorage.setItem(dismissKey, '1');
                setTimeout(function () {
                    openBtn.classList.remove('is-dismissed');
                    openBtn.style.left = 'auto';
                    openBtn.style.right = '18px';
                    openBtn.style.top = 'auto';
                    openBtn.style.bottom = '82px';
                    sessionStorage.removeItem(dismissKey);
                }, 60000);
            } else {
                snapToEdge();
            }
        });

        openBtn.addEventListener('click', function (e) {
            if (wasDragged) {
                e.preventDefault();
                e.stopPropagation();
                wasDragged = false;
                return;
            }
            openPopup();
        });
    }

    document.addEventListener('click', function (e) {
        var trigger = e.target && e.target.closest ? e.target.closest('[data-open-whatsapp]') : null;
        if (!trigger) return;
        e.preventDefault();
        restoreFloatingButton();
        openPopup();
    });

    var chatNavBtn = document.getElementById('chatNavBtn');
    if (chatNavBtn) {
        chatNavBtn.addEventListener('click', function (e) {
            e.preventDefault();
            restoreFloatingButton();
            openPopup();
        });
    }

    if (closeBtn) closeBtn.addEventListener('click', closePopup);
    if (minimizeBtn) minimizeBtn.addEventListener('click', minimizePopup);

    popup.addEventListener('click', function (e) {
        if (e.target === popup) closePopup();
    });

    document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape' && popup.classList.contains('is-active')) closePopup();
    });

    if (authGate) {
        authGate.addEventListener('click', function (e) {
            var btn = e.target && e.target.closest ? e.target.closest('[data-wa-auth]') : null;
            if (!btn) return;
            var provider = btn.getAttribute('data-wa-auth');
            if (provider === 'google') {
                startGoogleFromChat();
            } else if (provider === 'facebook') {
                openAccountSignIn('Facebook');
            } else if (provider === 'apple') {
                openAccountSignIn('Apple');
            }
        });
    }

    if (sendBtn) {
        sendBtn.addEventListener('click', function () {
            if (!chatUnlocked) {
                applyAuthGateUi();
                return;
            }
            sendToWhatsApp(inputEl ? inputEl.value : '');
            if (inputEl) inputEl.value = '';
        });
    }
    if (inputEl) {
        inputEl.addEventListener('keydown', function (e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                if (!chatUnlocked) {
                    applyAuthGateUi();
                    return;
                }
                sendToWhatsApp(inputEl.value);
                inputEl.value = '';
            }
        });
    }
    if (attachBtn) {
        attachBtn.addEventListener('click', function () {
            if (!chatUnlocked) {
                applyAuthGateUi();
                return;
            }
            sendToWhatsApp('Hi, I would like to share a logo / artwork file.');
        });
    }

    if (fastRepliesBtn && fastReplies) {
        fastRepliesBtn.addEventListener('click', function () {
            if (!chatUnlocked) {
                applyAuthGateUi();
                return;
            }
            fastReplies.classList.toggle('is-open');
        });
    }
    if (fastReplies) {
        fastReplies.addEventListener('click', function (e) {
            var chip = e.target.closest('[data-wa-reply]');
            if (!chip) return;
            if (!chatUnlocked) {
                applyAuthGateUi();
                return;
            }
            var text = chip.getAttribute('data-wa-reply') || '';
            if (inputEl) inputEl.value = text;
            sendToWhatsApp(text);
            if (inputEl) inputEl.value = '';
            fastReplies.classList.remove('is-open');
        });
    }

    var quoteBtn = document.getElementById('waQuoteSupport');
    var orderBtn = document.getElementById('waOrderHelp');
    if (quoteBtn) {
        quoteBtn.addEventListener('click', function (e) {
            e.preventDefault();
            openQuoteContact(quoteBtn.getAttribute('data-contact-message') || '');
        });
    }
    if (orderBtn) {
        orderBtn.addEventListener('click', function (e) {
            e.preventDefault();
            openQuoteContact(orderBtn.getAttribute('data-contact-message') || '');
        });
    }

    var speakBtn = document.getElementById('waSpeakTeam');
    if (speakBtn) {
        speakBtn.addEventListener('click', function () {
            closePopup();
        });
    }

    // Call link keeps tel:; call-modal.js intercepts on desktop.
    var callBtn = document.getElementById('waCallTeam');
    if (callBtn) {
        callBtn.setAttribute('title', 'Call ' + PHONE_DISPLAY);
    }

    window.addEventListener('branded:auth-changed', function () {
        applyAuthGateUi();
    });
    window.addEventListener('storage', function (e) {
        if (!e.key || e.key === 'authToken' || e.key === 'coAuthToken' || e.key === 'authUser' || e.key === 'coUser') {
            applyAuthGateUi();
        }
    });
    document.addEventListener('visibilitychange', function () {
        if (document.visibilityState === 'visible') applyAuthGateUi();
    });

    applyAuthGateUi();
    window.openBrandedChat = openPopup;
})();
