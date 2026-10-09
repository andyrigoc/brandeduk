/* ═══════════════════════════════════════════════════════
   BRANDED SUPPORT CHAT – Original orange FAB + panel UI
   Visible UI = BrandedUK panel only. Crisp = backend inbox only
   (operators reply in Crisp app; replies render here — never show Crisp UI).
   ═══════════════════════════════════════════════════════ */
(function () {
    'use strict';

    if (window.__bukOnsiteChatInit) return;
    window.__bukOnsiteChatInit = true;

    // Original BrandedUK onsite chat panel (only visible chat UI).
    // Messages go to Crisp via SDK; WhatsApp deep-links stay OFF.
    var BUK_ONSITE_CHAT_ENABLED = true;
    var BUK_WHATSAPP_SEND_ENABLED = false;
    // Require Google sign-in before typing/sending in the composer.
    // EMAIL / Call CTAs stay available without login.
    var BUK_REQUIRE_AUTH_FOR_COMPOSER = true;

    if (!BUK_ONSITE_CHAT_ENABLED) {
        document.documentElement.classList.add('buk-onsite-chat--hidden');
        function hideExistingOnsiteChat() {
            document.documentElement.classList.add('buk-onsite-chat--hidden');
            if (document.body) document.body.classList.add('buk-onsite-chat--hidden');
            var btn = document.getElementById('openWhatsappPopup');
            if (btn) {
                btn.hidden = true;
                btn.setAttribute('aria-hidden', 'true');
            }
            var popup = document.getElementById('waPopup');
            if (popup) {
                popup.hidden = true;
                popup.setAttribute('aria-hidden', 'true');
            }
        }
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', hideExistingOnsiteChat, { once: true });
        } else {
            hideExistingOnsiteChat();
        }
        return;
    }

    document.documentElement.classList.remove('buk-onsite-chat--hidden');
    if (document.body) document.body.classList.remove('buk-onsite-chat--hidden');

    var WA_NUMBER = '447447348564';
    var SPEAK_WA_NUMBER = '447447348564';
    var PHONE_TEL = '02089742722';
    var PHONE_DISPLAY = '020 8974 2722';
    var SCRIPT_SRC = (document.currentScript && document.currentScript.src) || '';

    function assetUrl(relativeFromJs) {
        try {
            return new URL(relativeFromJs, SCRIPT_SRC || window.location.href).href;
        } catch (e) {
            return relativeFromJs;
        }
    }

    var IMG = {
        logoGif: assetUrl('../../brandedukv15-child/assets/videos/use-the-provided-circular-1727756126.gif?v=20261002-chatlogo'),
        wordmark: assetUrl('../../brandedukv15-child/assets/images/ui/Branded UK Logo on Transparent Background.png?v=20261002-chatlogo'),
        mark: assetUrl('../../brandedukv15-child/assets/images/ui/bd-mark-circle.png'),
        welcome: assetUrl('../../brandedukv15-child/assets/images/ui/chat-welcome-visual.png')
    };

    function waLink(text, number) {
        var msg = text || 'Hi, I would like some help';
        return 'https://wa.me/' + (number || WA_NUMBER) + '?text=' + encodeURIComponent(msg);
    }

    function speakTeamLink(text) {
        return waLink(text || 'Hi, I would like to speak to a member of your team', SPEAK_WA_NUMBER);
    }

    // Crisp = backend only. Never open/show Crisp chatbox UI.
    // Operator replies arrive via message:received and render in OUR panel.
    var crispHooksBound = false;
    var recentOutbound = [];
    var RECENT_OUTBOUND_TTL_MS = 8000;
    var CRISP_READY_WAIT_MS = 6000;
    var pendingCrispWatchdogs = {};

    // Self-heal: if footer.js failed to parse/inject crisp-chat.js, load it here.
    function ensureCrispBackendLoader() {
        if (window.__brandedCrispLoaded) return;
        if (document.querySelector('script[data-branded-crisp="1"], script[src*="crisp-chat.js"]')) return;
        var s = document.createElement('script');
        try {
            s.src = new URL('crisp-chat.js?v=20261005-mobilefix', SCRIPT_SRC || window.location.href).href;
        } catch (e) {
            s.src = '/mobile/js/crisp-chat.js?v=20261005-mobilefix';
        }
        s.async = true;
        s.setAttribute('data-branded-crisp', '1');
        (document.head || document.documentElement).appendChild(s);
    }

    function isCrispSdkReady() {
        try {
            return !!(window.$crisp && typeof window.$crisp.is === 'function');
        } catch (e) {
            return false;
        }
    }

    function watchCrispDelivery(msg) {
        var key = String(Date.now()) + ':' + (msg || '').slice(0, 40);
        if (isCrispSdkReady()) return;
        pendingCrispWatchdogs[key] = window.setTimeout(function () {
            delete pendingCrispWatchdogs[key];
            if (isCrispSdkReady()) return;
            if (chatUnlocked) {
                appendAgentBubble('Could not reach live chat. Please try again or use Call our team.');
            }
        }, CRISP_READY_WAIT_MS);
    }

    function rememberOutbound(text) {
        var t = (text || '').trim();
        if (!t) return;
        recentOutbound.push({ text: t, at: Date.now() });
        if (recentOutbound.length > 20) recentOutbound.shift();
    }

    function wasRecentOutbound(text) {
        var t = (text || '').trim();
        if (!t) return false;
        var now = Date.now();
        recentOutbound = recentOutbound.filter(function (item) {
            return now - item.at < RECENT_OUTBOUND_TTL_MS;
        });
        for (var i = 0; i < recentOutbound.length; i++) {
            if (recentOutbound[i].text === t) {
                recentOutbound.splice(i, 1);
                return true;
            }
        }
        return false;
    }

    function extractCrispText(data) {
        if (!data) return '';
        if (typeof data === 'string') return data.trim();
        var type = data.type || '';
        var content = data.content;
        if (type === 'text' || !type) {
            if (typeof content === 'string') return content.trim();
            if (content && typeof content === 'object' && typeof content.text === 'string') {
                return content.text.trim();
            }
        }
        if (type === 'file' && content && typeof content === 'object') {
            var name = content.name || content.url || 'File';
            return '[File] ' + name;
        }
        if (typeof content === 'string') return content.trim();
        return '';
    }

    function forceHideCrispUi() {
        try {
            window.$crisp = window.$crisp || [];
            window.$crisp.push(['do', 'chat:hide']);
            window.$crisp.push(['do', 'chat:close']);
            window.$crisp.push(['config', 'hide:chat:on']);
        } catch (e) {}
    }

    function readAuthUser() {
        try {
            var raw = localStorage.getItem('authUser') || localStorage.getItem('coUser') || '';
            if (!raw) return null;
            var user = JSON.parse(raw);
            return user && typeof user === 'object' ? user : null;
        } catch (e) {
            return null;
        }
    }

    function pickUserField(user, keys) {
        if (!user) return '';
        for (var i = 0; i < keys.length; i++) {
            var value = user[keys[i]];
            if (value != null && String(value).trim()) return String(value).trim();
        }
        return '';
    }

    // Push Google profile to Crisp so operators see name/email (phone only if present).
    // Google OAuth with openid/profile/email typically does NOT return a phone number.
    function syncCrispVisitorProfile() {
        var user = readAuthUser();
        if (!user) return;
        try {
            window.$crisp = window.$crisp || [];
            var email = pickUserField(user, ['email', 'Email']);
            var first = pickUserField(user, ['firstName', 'first_name', 'given_name', 'givenName']);
            var last = pickUserField(user, ['lastName', 'last_name', 'family_name', 'familyName']);
            var nickname = pickUserField(user, ['name', 'displayName', 'fullName', 'nickname']);
            if (!nickname) nickname = (first + ' ' + last).trim();
            // Phone is optional — Google rarely provides it on standard OAuth scopes.
            var phone = pickUserField(user, ['phone', 'phoneNumber', 'phone_number', 'mobile', 'tel']);

            if (email) window.$crisp.push(['set', 'user:email', [email]]);
            if (nickname) window.$crisp.push(['set', 'user:nickname', [nickname]]);
            if (phone) window.$crisp.push(['set', 'user:phone', [String(phone)]]);

            var sessionData = [];
            if (first) sessionData.push(['first_name', first]);
            if (last) sessionData.push(['last_name', last]);
            if (email) sessionData.push(['email', email]);
            if (phone) sessionData.push(['phone', phone]);
            if (sessionData.length) {
                window.$crisp.push(['set', 'session:data', [sessionData]]);
            }
        } catch (e) {}
    }

    function sendToCrispBackend(text) {
        var msg = (text || '').trim();
        if (!msg) return false;
        try {
            ensureCrispBackendLoader();
            window.$crisp = window.$crisp || [];
            syncCrispVisitorProfile();
            // Send only — never chat:open / chat:show
            rememberOutbound(msg);
            window.$crisp.push(['do', 'message:send', ['text', msg]]);
            forceHideCrispUi();
            // Queue always "succeeds"; warn if Crisp SDK never becomes ready (common when
            // footer.js failed to inject crisp-chat.js on mobile).
            watchCrispDelivery(msg);
            return true;
        } catch (e) {
            return false;
        }
    }

    function bindCrispMessageHooks() {
        if (crispHooksBound) return;
        crispHooksBound = true;
        window.$crisp = window.$crisp || [];

        window.$crisp.push(['on', 'message:received', function (data) {
            forceHideCrispUi();
            var text = extractCrispText(data);
            if (!text) return;
            // Ignore echoes of our own outbound if SDK surfaces them here
            if (wasRecentOutbound(text)) return;
            // Operator replied before canned greeting — skip auto bubble.
            cancelPendingWelcomeForOperatorReply();
            appendAgentBubble(text);
            // Soft nudge: reopen our panel if closed so visitor sees the reply
            if (popup && !popup.classList.contains('is-active')) {
                openPopup();
            }
        }]);

        // message:sent = visitor message acknowledged by Crisp.
        // We already render our own bubble on Send — skip duplicates.
        window.$crisp.push(['on', 'message:sent', function (data) {
            forceHideCrispUi();
            var text = extractCrispText(data);
            if (text) wasRecentOutbound(text);
        }]);

        window.$crisp.push(['on', 'chat:opened', function () {
            forceHideCrispUi();
        }]);
    }

    // Keep a harmless alias for any leftover callers; does NOT open Crisp UI.
    function openCrispChat(optionalMessage) {
        var msg = (optionalMessage || '').trim();
        if (msg) {
            if (chatUnlocked) appendUserBubble(msg);
            if (!sendToCrispBackend(msg) && chatUnlocked) {
                appendAgentBubble('Could not reach live chat. Please try again or use Call our team.');
            }
        }
        forceHideCrispUi();
        if (popup && !popup.classList.contains('is-active')) openPopup();
    }

    // Greeting UX (once per session): customer sends first → 2.5s → typing dots → 4s → agent bubble.
    // No auto-greeting on panel open.
    var WELCOME_TEXT = 'Hi! How can I help you today?';
    var WELCOME_PRE_TYPING_MS = 2500;
    var WELCOME_TYPING_MS = 4000;
    var welcomeRevealed = false;
    var welcomeSequenceStarted = false;
    var welcomePreTimer = null;
    var welcomeTypingTimer = null;
    var chatUnlocked = false;

    function nowLabel() {
        try {
            return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        } catch (e) {
            return '';
        }
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

    function buildPopupHtml() {
        return '' +
            '<div class="wa-popup__card" role="dialog" aria-modal="true" aria-label="Branded support chat">' +
            '  <div class="wa-popup__topbar">' +
            '    <div class="wa-popup__brand">' +
            '      <img class="wa-popup__brand-badge" src="' + IMG.logoGif + '" alt="" width="36" height="36" aria-hidden="true">' +
            '      <img class="wa-popup__brand-word" src="' + IMG.wordmark + '" alt="Branded UK" width="120" height="32">' +
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
            '      <p class="wa-popup__auth-title">Sign in with Google to chat</p>' +
            '      <p class="wa-popup__auth-sub">We only ask for your first name, last name and email. Phone is included only if Google provides it.</p>' +
            '      <div class="wa-popup__auth-btns">' +
            '        <button type="button" class="wa-popup__auth-btn wa-popup__auth-btn--google" data-wa-auth="google">' +
            googleIconSvg() +
            '          <span>Continue with Google</span>' +
            '        </button>' +
            '      </div>' +
            '      <p class="wa-popup__auth-note" id="waAuthNote">EMAIL and Call still work without signing in. Google usually shares name + email; phone is often not available.</p>' +
            '    </div>' +
            '  </div>' +
            '  <div class="wa-popup__body" id="waChatBody">' +
            '    <div class="wa-msg wa-msg--agent wa-msg--typing" id="waTypingMsg" hidden>' +
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
            '      <input class="wa-popup__input" id="waChatInput" type="text" placeholder="Write a message…" autocomplete="off">' +
            '      <button type="button" class="wa-popup__icon-btn" id="waChatAttach" aria-label="Attach file">' +
            '        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/></svg>' +
            '      </button>' +
            '      <button type="button" class="wa-popup__send" id="waChatSend" aria-label="Send message" title="Send to our team">' +
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
            '    <a class="wa-popup__action wa-popup__action--alt" id="waEmailTeam" href="mailto:info@brandeduk.com?subject=BrandedUK%20Website%20Enquiry">' +
            '      <span class="wa-popup__action-icon wa-popup__action-icon--email" aria-hidden="true">' +
            '        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>' +
            '      </span>' +
            '      <span class="wa-popup__action-label">EMAIL</span>' +
            '      <span class="wa-popup__action-chevron" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 18l6-6-6-6"/></svg></span>' +
            '    </a>' +
            '    <a class="wa-popup__action" id="waCallTeam" href="tel:' + PHONE_TEL + '">' +
            '      <span class="wa-popup__action-icon wa-popup__action-icon--call" aria-hidden="true">' +
            '        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.81.36 1.6.68 2.35a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.75.32 1.54.55 2.35.68A2 2 0 0 1 22 16.92z"/></svg>' +
            '      </span>' +
            '      <span class="wa-popup__action-label">Call our team</span>' +
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

    function lockEqualCtaButtons(root) {
        /* Belt+suspenders: inline size lock so CSS cache cannot leave CTAs unequal/tall */
        var actions = root && root.querySelector
            ? root.querySelector('.wa-popup__actions')
            : document.getElementById('waFastReplies') && document.querySelector('.wa-popup__actions');
        if (!actions) actions = document.querySelector('.wa-popup__actions');
        if (!actions) return;
        actions.style.cssText =
            'display:flex!important;flex-direction:row!important;justify-content:center!important;' +
            'align-items:stretch!important;gap:8px!important;padding:2px 14px 10px!important;' +
            'box-sizing:border-box!important;width:100%!important;';
        var btns = actions.querySelectorAll('#waEmailTeam, #waCallTeam, a.wa-popup__action');
        for (var i = 0; i < btns.length; i++) {
            btns[i].style.cssText =
                'display:flex!important;align-items:center!important;gap:6px!important;' +
                'flex:1 1 0!important;width:calc(50% - 4px)!important;max-width:calc(50% - 4px)!important;' +
                'min-width:0!important;height:34px!important;min-height:34px!important;max-height:34px!important;' +
                'padding:4px 10px!important;box-sizing:border-box!important;border-radius:10px!important;' +
                'text-decoration:none!important;line-height:1!important;';
        }
        var email = document.getElementById('waEmailTeam');
        if (email) {
            email.style.setProperty('background', '#1a1c2e', 'important');
            email.style.setProperty('border-color', 'transparent', 'important');
            email.style.setProperty('color', '#fff', 'important');
        }
        var call = document.getElementById('waCallTeam');
        if (call) {
            call.style.setProperty('background', '#fff', 'important');
            call.style.setProperty('border', '1px solid #e8eaef', 'important');
            call.style.setProperty('color', '#1a1c2e', 'important');
        }
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
        lockEqualCtaButtons(popup);
        return popup;
    }

    function styleFloatButton(btn) {
        if (!btn) return;
        btn.hidden = false;
        btn.removeAttribute('aria-hidden');
        btn.classList.remove('is-hidden-for-crisp');
        btn.style.removeProperty('display');
        btn.style.removeProperty('visibility');
        btn.style.removeProperty('pointer-events');
        btn.style.removeProperty('opacity');
        btn.removeAttribute('hidden');
        btn.setAttribute('aria-label', 'Open support chat');
        btn.tabIndex = 0;
        btn.innerHTML =
            '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">' +
            '<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>' +
            '</svg>';
    }

    function ensureFloatButton() {
        var btn = document.getElementById('openWhatsappPopup');
        if (!btn) {
            btn = document.createElement('button');
            btn.type = 'button';
            btn.className = 'whatsapp-float';
            btn.id = 'openWhatsappPopup';
            document.body.appendChild(btn);
        }
        styleFloatButton(btn);
        return btn;
    }

    var openBtn = ensureFloatButton();
    var popup = ensurePopup();

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
        openBtn.classList.remove('is-hidden-for-crisp');
        sessionStorage.removeItem(dismissKey);
        openBtn.style.left = 'auto';
        openBtn.style.right = '18px';
        openBtn.style.top = 'auto';
        openBtn.style.bottom = window.matchMedia('(min-width: 700px)').matches ? '24px' : '82px';
        openBtn.style.removeProperty('display');
        openBtn.style.removeProperty('visibility');
        openBtn.style.removeProperty('pointer-events');
        openBtn.style.removeProperty('opacity');
        openBtn.removeAttribute('hidden');
        openBtn.removeAttribute('aria-hidden');
        openBtn.tabIndex = 0;
        try {
            document.documentElement.classList.remove('buk-crisp-chat-open');
            if (document.body) document.body.classList.remove('buk-crisp-chat-open');
        } catch (e) {}
    }

    function clearWelcomeTimers() {
        if (welcomePreTimer) {
            clearTimeout(welcomePreTimer);
            welcomePreTimer = null;
        }
        if (welcomeTypingTimer) {
            clearTimeout(welcomeTypingTimer);
            welcomeTypingTimer = null;
        }
    }

    function hideTypingIndicator() {
        var typing = document.getElementById('waTypingMsg');
        if (!typing) return;
        typing.setAttribute('hidden', '');
        typing.setAttribute('aria-hidden', 'true');
    }

    function showTypingIndicator() {
        if (!chatBody) return;
        var typing = document.getElementById('waTypingMsg');
        if (!typing) {
            typing = document.createElement('div');
            typing.className = 'wa-msg wa-msg--agent wa-msg--typing';
            typing.id = 'waTypingMsg';
            typing.innerHTML =
                '<img class="wa-msg__avatar" src="' + IMG.mark + '" alt="">' +
                '<div class="wa-msg__stack">' +
                '  <div class="wa-msg__bubble wa-msg__bubble--typing" aria-label="Branded Support is typing">' +
                '    <span class="wa-typing" aria-hidden="true"><span></span><span></span><span></span></span>' +
                '  </div>' +
                '</div>';
        }
        typing.removeAttribute('hidden');
        typing.setAttribute('aria-hidden', 'false');
        // Always place after the latest messages (after the customer's first send).
        chatBody.appendChild(typing);
        chatBody.scrollTop = chatBody.scrollHeight;
    }

    function revealWelcomeMessage() {
        if (welcomeRevealed || !chatBody || !chatUnlocked) return;
        welcomeRevealed = true;
        welcomeSequenceStarted = true;
        clearWelcomeTimers();
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
        if (typing && typing.parentNode === chatBody && !typing.hasAttribute('hidden')) {
            chatBody.replaceChild(wrap, typing);
        } else {
            if (typing) hideTypingIndicator();
            chatBody.appendChild(wrap);
        }
        chatBody.scrollTop = chatBody.scrollHeight;
    }

    // After the customer's first message only: 2.5s pause → typing dots → 4s → greeting.
    function scheduleWelcomeAfterFirstMessage() {
        if (!chatUnlocked || welcomeRevealed || welcomeSequenceStarted) return;
        welcomeSequenceStarted = true;
        welcomePreTimer = setTimeout(function () {
            welcomePreTimer = null;
            if (welcomeRevealed || !chatUnlocked) return;
            showTypingIndicator();
            welcomeTypingTimer = setTimeout(function () {
                welcomeTypingTimer = null;
                revealWelcomeMessage();
            }, WELCOME_TYPING_MS);
        }, WELCOME_PRE_TYPING_MS);
    }

    // Real operator reply arrived before the canned greeting — skip the auto bubble.
    function cancelPendingWelcomeForOperatorReply() {
        if (welcomeRevealed) return;
        welcomeSequenceStarted = true;
        welcomeRevealed = true;
        clearWelcomeTimers();
        hideTypingIndicator();
    }

    function applyAuthGateUi() {
        chatUnlocked = BUK_REQUIRE_AUTH_FOR_COMPOSER ? isSignedIn() : true;
        if (popup) {
            popup.classList.toggle('is-locked', !chatUnlocked);
            popup.classList.toggle('is-unlocked', chatUnlocked);
        }
        if (authGate) {
            if (chatUnlocked || !BUK_REQUIRE_AUTH_FOR_COMPOSER) {
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
            inputEl.placeholder = chatUnlocked ? 'Write a message…' : 'Sign in with Google to write…';
        }
        if (sendBtn) sendBtn.disabled = !chatUnlocked;
        if (attachBtn) attachBtn.disabled = !chatUnlocked;
        if (fastReplies) {
            fastReplies.hidden = !chatUnlocked;
            fastReplies.setAttribute('aria-hidden', chatUnlocked ? 'false' : 'true');
            if (!chatUnlocked) fastReplies.classList.remove('is-open');
        }
        if (fastRepliesBtn) {
            fastRepliesBtn.disabled = !chatUnlocked;
            fastRepliesBtn.setAttribute('aria-disabled', chatUnlocked ? 'false' : 'true');
        }

        if (chatUnlocked) {
            syncCrispVisitorProfile();
        } else {
            clearWelcomeTimers();
            hideTypingIndicator();
        }
    }

    // Real Google OAuth via Account panel / API — no fake production login.
    function startGoogleFromChat() {
        try {
            var returnUrl = new URL(window.location.href);
            returnUrl.searchParams.delete('token');
            returnUrl.searchParams.delete('error');
            localStorage.setItem('authReturnTo', returnUrl.toString());
        } catch (e) {}
        if (window.BrandedAccountPanel && typeof window.BrandedAccountPanel.startGoogle === 'function') {
            window.BrandedAccountPanel.startGoogle();
            return;
        }
        var apiBase = (window.BrandedAccount && typeof window.BrandedAccount.apiBaseUrl === 'function')
            ? window.BrandedAccount.apiBaseUrl()
            : (window.API_BASE_URL || 'https://api.brandeduk.com').replace(/\/+$/, '');
        window.location.href = apiBase + '/auth/google';
    }

    function openPopup() {
        applyAuthGateUi();
        popup.classList.remove('is-minimized');
        popup.classList.add('is-active');
        popup.setAttribute('aria-hidden', 'false');
        // No auto-greeting on open — wait for the customer's first message.
        if (chatUnlocked && inputEl) {
            setTimeout(function () { inputEl.focus(); }, 180);
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
        var typing = document.getElementById('waTypingMsg');
        // Keep typing at the end if the greeting sequence is mid-flight.
        if (typing && typing.parentNode === chatBody && !typing.hasAttribute('hidden')) {
            chatBody.insertBefore(wrap, typing);
        } else {
            chatBody.appendChild(wrap);
        }
        chatBody.scrollTop = chatBody.scrollHeight;
    }

    function appendUserBubble(text) {
        if (!chatBody || !text || !chatUnlocked) return;
        var wrap = document.createElement('div');
        wrap.className = 'wa-msg wa-msg--user';
        wrap.innerHTML =
            '<div class="wa-msg__bubble"></div>' +
            '<div class="wa-msg__meta"><span></span>' +
            '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" aria-hidden="true"><path d="M20 6L9 17l-5-5"/></svg>' +
            '</div>';
        wrap.querySelector('.wa-msg__bubble').textContent = text;
        wrap.querySelector('.wa-msg__meta span').textContent = nowLabel();
        var typing = document.getElementById('waTypingMsg');
        if (typing && typing.parentNode === chatBody && !typing.hasAttribute('hidden')) {
            chatBody.insertBefore(wrap, typing);
        } else {
            chatBody.appendChild(wrap);
        }
        chatBody.scrollTop = chatBody.scrollHeight;
        scheduleWelcomeAfterFirstMessage();
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

        // Live path: Crisp backend only — keep our panel open, never open Crisp UI.
        if (!BUK_WHATSAPP_SEND_ENABLED) {
            if (!sendToCrispBackend(msg)) {
                appendAgentBubble('Could not reach live chat. Please try again or use Call our team.');
            }
            return '';
        }

        var url = waLink(msg);
        openWhatsAppLink(url);
        appendAgentBubble('Opening WhatsApp… Please tap Send there so our team receives your message. If nothing opened, use Speak to a member of our team below.');
        return url;
    }

    function openQuoteContact(message) {
        closePopup();
        if (typeof window.openContactPopup === 'function') {
            window.openContactPopup(message ? { message: message } : undefined);
            return;
        }
        var trigger = document.createElement('a');
        trigger.href = '#';
        trigger.setAttribute('data-open-contact', '1');
        if (message) trigger.setAttribute('data-contact-message', message);
        document.body.appendChild(trigger);
        trigger.click();
        trigger.remove();
    }

    function sendFastReply(text) {
        var msg = (text || '').trim();
        if (!msg) return;
        if (!chatUnlocked) {
            applyAuthGateUi();
            return;
        }
        if (!BUK_WHATSAPP_SEND_ENABLED) {
            appendUserBubble(msg);
            if (!sendToCrispBackend(msg)) {
                appendAgentBubble('Could not reach live chat. Please try again or use Call our team.');
            }
            return;
        }
        sendToWhatsApp(msg);
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
            if (btn.getAttribute('data-wa-auth') === 'google') {
                startGoogleFromChat();
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
            fastReplies.classList.toggle('is-open');
        });
    }
    if (fastReplies) {
        fastReplies.addEventListener('click', function (e) {
            var chip = e.target.closest('[data-wa-reply]');
            if (!chip) return;
            var text = chip.getAttribute('data-wa-reply') || '';
            if (inputEl && chatUnlocked) inputEl.value = text;
            sendFastReply(text);
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

    // Email link opens mailto:; no Crisp UI open.
    var emailBtn = document.getElementById('waEmailTeam');
    if (emailBtn) {
        emailBtn.setAttribute('title', 'Email info@brandeduk.com');
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
    // Listen for operator replies → render in OUR panel; never open Crisp UI.
    ensureCrispBackendLoader();
    bindCrispMessageHooks();
    forceHideCrispUi();
    window.openBrandedChat = openPopup;
    window.openBrandedCrispChat = openCrispChat;
})();
