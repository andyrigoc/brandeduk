window.BrandedAccountPanel = (function () {
    'use strict';

    var LOCAL_PREVIEW_TOKEN = 'local-preview-auth';
    var activeController = null;

    function accountScriptLoaded() {
        return !!(window.BrandedAccount && typeof window.BrandedAccount.request === 'function');
    }

    function notifyAuthChanged(signedIn, user) {
        try {
            window.dispatchEvent(new CustomEvent('branded:auth-changed', {
                detail: { signedIn: !!signedIn, user: user || null }
            }));
        } catch (e) { /* older browsers */ }
    }

    function isLocalHost() {
        var host = window.location.hostname;
        return host === 'localhost' || host === '127.0.0.1';
    }

    function byId(id) {
        return document.getElementById(id);
    }

    function localPreviewUser() {
        return {
            firstName: 'Local',
            lastName: 'Preview',
            name: 'Local Preview',
            email: 'local.preview@brandeduk.test',
            picture: 'https://www.brandeduk.com/brandedukv15-child/assets/images/ui/bd-logo-3d.png',
            provider: 'google-local-preview'
        };
    }

    function isLocalPreviewSession() {
        return isLocalHost() && (
            localStorage.getItem('authToken') === LOCAL_PREVIEW_TOKEN ||
            localStorage.getItem('coAuthToken') === LOCAL_PREVIEW_TOKEN
        );
    }

    function safeJsonParse(value) {
        try {
            return JSON.parse(value);
        } catch (e) {
            return null;
        }
    }

    function readSessionUser() {
        return safeJsonParse(localStorage.getItem('authUser'))
            || safeJsonParse(localStorage.getItem('coUser'))
            || null;
    }

    function firstNameFromUser(user) {
        if (!user) return 'there';
        if (user.firstName) return user.firstName;
        if (user.givenName) return user.givenName;
        if (user.name) return String(user.name).trim().split(/\s+/)[0];
        return 'there';
    }

    function fullNameFromUser(user) {
        if (!user) return '';
        if (user.name) return user.name;
        return [user.firstName || user.givenName, user.lastName || user.familyName].filter(Boolean).join(' ');
    }

    function initialsFromUser(user) {
        var source = fullNameFromUser(user) || (user && user.email) || 'BU';
        var initials = String(source).match(/\b\w/g) || ['B', 'U'];
        return initials.slice(0, 2).join('').toUpperCase();
    }

    function avatarUrlFromUser(user) {
        if (!user) return '';
        var url = user.picture || user.avatar || user.avatarUrl || user.photo ||
            user.photoURL || user.image || user.imageUrl || user.profileImage || '';
        return typeof url === 'string' ? url.trim() : '';
    }

    function escapeAttr(value) {
        return String(value == null ? '' : value)
            .replace(/&/g, '&amp;')
            .replace(/"/g, '&quot;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;');
    }

    function escapeHtml(value) {
        return escapeAttr(value).replace(/'/g, '&#39;');
    }

    function currentReturnUrl() {
        var url = new URL(window.location.href);
        url.searchParams.delete('token');
        url.searchParams.delete('error');
        return url.toString();
    }

    function safeReturnUrl(Account) {
        var fallback = Account && typeof Account.pageHref === 'function' ? Account.pageHref('profile') : '/';
        try {
            localStorage.setItem('authReturnTo', currentReturnUrl());
        } catch (e) {}
        return fallback;
    }

    function panelLinksHtml(Account) {
        return '' +
            '<div class="account-panel-links">' +
                '<a class="account-panel-link" href="' + Account.pageHref('profile') + '">My Profile</a>' +
                '<a class="account-panel-link" href="' + Account.pageHref('orders') + '">My Orders</a>' +
                '<a class="account-panel-link" href="' + Account.pageHref('trackOrder') + '">Track Guest Order</a>' +
            '</div>';
    }

    function renderSignedInView(Account, refs, user) {
        refs.formsContainer.style.display = 'none';
        refs.loggedIn.style.display = 'block';
        refs.userName.textContent = 'Welcome, ' + firstNameFromUser(user) + '!';
        refs.userEmail.textContent = user.email || '';
        refs.userDetails.innerHTML = [
            '<p><strong>Name:</strong> ' + (fullNameFromUser(user) || 'Not provided') + '</p>',
            '<p><strong>Provider:</strong> ' + (user.provider || 'customer') + '</p>',
            '<p><strong>History:</strong> View orders, addresses and profile from here.</p>'
        ].join('');
        decorateAccountTrigger(refs, user);
    }

    function renderSignedOutView(refs) {
        refs.formsContainer.style.display = 'flex';
        refs.loggedIn.style.display = 'none';
        decorateAccountTrigger(refs, null);
    }

    function showToast(message) {
        var toast = document.createElement('div');
        toast.textContent = message;
        toast.style.cssText = [
            'position:fixed',
            'bottom:40px',
            'left:50%',
            'transform:translateX(-50%)',
            'background:#1f2937',
            'color:#fff',
            'padding:12px 24px',
            'border-radius:8px',
            'font-size:14px',
            'z-index:10001',
            'box-shadow:0 10px 30px rgba(0,0,0,.18)',
            'transition:opacity .25s ease'
        ].join(';');
        document.body.appendChild(toast);
        setTimeout(function () {
            toast.style.opacity = '0';
            setTimeout(function () { toast.remove(); }, 250);
        }, 2600);
    }

    function injectStyles() {
        var style = byId('accountPanelEnhancements');
        if (!style) {
            style = document.createElement('style');
            style.id = 'accountPanelEnhancements';
            document.head.appendChild(style);
        }
        style.textContent = '' +
            '.account-google-btn{width:100%;min-height:46px;border:1px solid #d1d5db;border-radius:12px;background:#fff;color:#1f2937;font-weight:700;display:flex;align-items:center;justify-content:center;gap:10px;cursor:pointer;margin:12px 0 10px;padding:0 14px;}' +
            '.account-google-btn:hover{background:#f9fafb;}' +
            '.account-google-btn svg{flex-shrink:0;}' +
            '.account-auth-divider{display:flex;align-items:center;gap:10px;margin:10px 0 12px;color:#6b7280;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:.04em;}' +
            '.account-auth-divider:before,.account-auth-divider:after{content:\"\";flex:1;height:1px;background:#e5e7eb;}' +
            '.account-helper-copy{font-size:12px;line-height:1.5;color:#6b7280;margin:10px 0 0;}' +
            '.account-panel-links{display:grid;gap:10px;margin-top:18px;}' +
            '.account-panel-link{display:flex;align-items:center;justify-content:center;min-height:44px;border:1px solid #e5e7eb;border-radius:10px;text-decoration:none;font-weight:700;color:#273469;background:#fff;}' +
            '.account-panel-link:hover{background:#f9fafb;}' +
            '.account-submit-btn.is-loading{opacity:.7;pointer-events:none;}' +
            '.account-google-btn.is-loading{opacity:.82;pointer-events:none;}' +
            '.account-trigger-profile{display:inline-flex;align-items:center;gap:8px;margin-left:0;padding:6px 10px;border:1px solid rgba(39,52,105,.12);border-radius:999px;background:#fff;color:#273469;font-size:12px;font-weight:900;box-shadow:0 10px 22px rgba(39,52,105,.12);vertical-align:middle;position:relative;left:-15px;}' +
            '.account-trigger-avatar{width:24px;height:24px;border-radius:999px;display:inline-grid;place-items:center;background:#273469;color:#fff;font-size:10px;font-weight:900;overflow:hidden;}' +
            '.account-trigger-avatar img{width:100%;height:100%;object-fit:cover;}' +
            '.account-trigger-name{max-width:92px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}' +
            '.account-nav-avatar{width:24px;height:24px;border-radius:999px;overflow:hidden;display:inline-grid;place-items:center;background:#273469;color:#fff;font-size:10px;font-weight:900;line-height:1;}' +
            '.account-nav-avatar img{width:100%;height:100%;object-fit:cover;display:block;}' +
            '.site-header .header-util-link.is-signed-in,.header-util-link.is-signed-in{gap:0!important;width:auto!important;font-size:0!important;}' +
            /* Kill leftover Account chrome if an older build appended the pill beside it. */
            '.header-util-link:has(> .account-trigger-profile) > :not(.account-trigger-profile),' +
            '.searchbar-header__account:has(> .account-trigger-profile) > :not(.account-trigger-profile),' +
            '#accountBtn:has(> .account-trigger-profile) > :not(.account-trigger-profile){display:none!important;width:0!important;height:0!important;margin:0!important;padding:0!important;overflow:hidden!important;border:0!important;}' +
            '.header-util-link:has(> .account-trigger-profile),' +
            '.searchbar-header__account:has(> .account-trigger-profile),' +
            '#accountBtn:has(> .account-trigger-profile){width:auto!important;font-size:0!important;gap:0!important;}' +
            '.header-util-link .account-trigger-profile,.searchbar-header__account .account-trigger-profile,#accountBtn .account-trigger-profile{font-size:12px!important;}' +
            '.nav-item.is-signed-in{color:#273469;font-weight:800;}' +
            '.nav-item .account-trigger-profile{display:none!important;}' +
            '@media(max-width:767px){.account-trigger-profile{left:0;}}';
    }

    // On the mobile bottom-nav (.nav-item), swap the person icon for the Google
    // profile photo so it's obvious the user is signed in. On desktop, decorateAccountTrigger
    // replaces the Account chrome with the Google profile pill only.
    function setNavIconAvatar(trigger, photoUrl, initials) {
        if (!trigger || !trigger.classList.contains('nav-item')) return;
        var svg = trigger.querySelector('svg');
        var navAvatar = trigger.querySelector('.account-nav-avatar');
        if (photoUrl || initials) {
            if (svg) svg.style.display = 'none';
            if (!navAvatar) {
                navAvatar = document.createElement('span');
                navAvatar.className = 'account-nav-avatar';
                var label = trigger.querySelector('.nav-item-label');
                if (label) trigger.insertBefore(navAvatar, label);
                else trigger.insertBefore(navAvatar, trigger.firstChild);
            }
            if (photoUrl) {
                navAvatar.innerHTML = '<img src="' + escapeAttr(photoUrl) + '" alt="" ' +
                    'referrerpolicy="no-referrer" ' +
                    'onerror="this.remove();this.parentNode.textContent=\'' + escapeAttr(initials) + '\';">';
            } else {
                navAvatar.textContent = initials || '';
            }
        } else {
            if (navAvatar) navAvatar.remove();
            if (svg) svg.style.display = '';
        }
    }

    function enforceDesktopProfileOnly(trigger) {
        if (!trigger || trigger.classList.contains('nav-item')) return;
        var profile = trigger.querySelector(':scope > .account-trigger-profile') ||
            trigger.querySelector('.account-trigger-profile');
        if (!profile) return;
        if (trigger.innerHTML !== profile.outerHTML) {
            trigger.innerHTML = profile.outerHTML;
        }
        trigger.classList.add('is-signed-in');
    }

    function decorateAccountTrigger(refs, user) {
        if (!refs || !refs.trigger) return;
        var trigger = refs.trigger;

        // Snapshot the logged-out chrome once so we can restore it after logout.
        if (!trigger.getAttribute('data-account-default-html')) {
            trigger.setAttribute('data-account-default-html', trigger.innerHTML);
        }

        if (!user) {
            trigger.classList.remove('is-signed-in');
            trigger.innerHTML = trigger.getAttribute('data-account-default-html') || trigger.innerHTML;
            setNavIconAvatar(trigger, '', '');
            var mobileLabel = trigger.querySelector('.nav-item-label');
            if (mobileLabel) mobileLabel.textContent = 'Account';
            trigger.setAttribute('aria-label', 'My Account');
            return;
        }

        var firstName = firstNameFromUser(user);
        var photoUrl = avatarUrlFromUser(user);
        var initials = initialsFromUser(user);
        trigger.classList.add('is-signed-in');
        trigger.setAttribute('aria-label', 'My account, signed in as ' + (user.email || firstName));

        // Mobile bottom-nav: keep greeting + avatar swap.
        if (trigger.classList.contains('nav-item')) {
            var labelEl = trigger.querySelector('.nav-item-label');
            if (labelEl) labelEl.textContent = 'Hi, ' + firstName;
            setNavIconAvatar(trigger, photoUrl, initials);
            return;
        }

        // Desktop header: replace Account icon+label entirely with the Google profile pill only.
        var avatarInner = photoUrl
            ? '<img src="' + escapeAttr(photoUrl) + '" alt="" referrerpolicy="no-referrer" ' +
              'onerror="this.remove();this.parentNode.textContent=\'' + escapeAttr(initials) + '\';">'
            : initials;
        trigger.innerHTML =
            '<span class="account-trigger-profile">' +
                '<span class="account-trigger-avatar">' + avatarInner + '</span>' +
                '<span class="account-trigger-name">' + escapeHtml(firstName) + '</span>' +
            '</span>';
        enforceDesktopProfileOnly(trigger);
    }

    function injectAuthAffordances(refs) {
        injectStyles();

        function googleButtonHtml(flow) {
            return '' +
                '<button type="button" class="account-google-btn" data-google-auth-flow="' + flow + '">' +
                    '<svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">' +
                        '<path fill="#EA4335" d="M9 7.364v3.55h4.94c-.216 1.14-.865 2.106-1.844 2.756l2.982 2.314c1.737-1.602 2.737-3.96 2.737-6.756 0-.65-.058-1.274-.166-1.864H9z"/>' +
                        '<path fill="#34A853" d="M9 18c2.484 0 4.567-.824 6.09-2.236l-2.982-2.314c-.824.553-1.88.88-3.108.88-2.39 0-4.416-1.614-5.14-3.784H.78v2.378A8.997 8.997 0 009 18z"/>' +
                        '<path fill="#4A90E2" d="M3.86 10.546A5.41 5.41 0 013.572 9c0-.536.097-1.056.288-1.546V5.076H.78A8.997 8.997 0 000 9c0 1.45.347 2.824.78 3.924l3.08-2.378z"/>' +
                        '<path fill="#FBBC05" d="M9 3.58c1.35 0 2.565.465 3.52 1.377l2.64-2.64C13.56.802 11.477 0 9 0 5.48 0 2.43 2.02.78 5.076l3.08 2.378C4.584 5.194 6.61 3.58 9 3.58z"/>' +
                    '</svg>' +
                    '<span>' + (isLocalHost() ? 'Continue with Google (local preview)' : 'Continue with Google') + '</span>' +
                '</button>';
        }

        if (refs.signinContent && !refs.signinContent.querySelector('[data-google-auth-flow="signin"]')) {
            refs.signinContent.insertAdjacentHTML('afterbegin', googleButtonHtml('signin'));
        }
        if (refs.signup && refs.signup.querySelector('.account-form-content') && !refs.signup.querySelector('[data-google-auth-flow="signup"]')) {
            refs.signup.querySelector('.account-form-content').insertAdjacentHTML('afterbegin', googleButtonHtml('signup'));
        }
        if (refs.signinFormData) refs.signinFormData.style.display = 'none';
        if (refs.signupFormData) refs.signupFormData.style.display = 'none';
    }

    function setButtonLoading(button, loading) {
        if (!button) return;
        button.classList.toggle('is-loading', loading);
        button.disabled = !!loading;
    }

    function bindPanel(options) {
        if (!accountScriptLoaded()) return;
        var Account = window.BrandedAccount;
        var refs = {
            trigger: byId(options.triggerId),
            panel: byId(options.panelId),
            overlay: byId(options.overlayId),
            closeBtn: byId(options.closeBtnId),
            arrow: byId(options.arrowId),
            signin: byId(options.signinId),
            signup: byId(options.signupId),
            signinFormData: byId(options.signinFormId),
            signupFormData: byId(options.signupFormId),
            formsContainer: byId(options.formsContainerId) || (byId(options.panelId) ? byId(options.panelId).querySelector('.account-forms-container') : null),
            loggedIn: byId(options.loggedInId),
            logoutBtn: byId(options.logoutBtnId),
            userName: byId(options.userNameId),
            userEmail: byId(options.userEmailId),
            userDetails: byId(options.userDetailsId)
        };

        if (!refs.trigger || !refs.panel || !refs.overlay || !refs.formsContainer || !refs.loggedIn) return;

        refs.signinContent = refs.signin ? refs.signin.querySelector('.account-form-content') : null;
        injectAuthAffordances(refs);
        if (refs.loggedIn && !refs.loggedIn.querySelector('.account-panel-links') && refs.userDetails) {
            refs.userDetails.insertAdjacentHTML('afterend', panelLinksHtml(Account));
        }

        function resetForms() {
            if (refs.signin) refs.signin.classList.remove('active', 'inactive');
            if (refs.signup) refs.signup.classList.remove('active', 'inactive');
            if (refs.arrow) refs.arrow.classList.remove('visible');
        }

        function activateCard(target) {
            if (!refs.signin || !refs.signup || !refs.arrow) return;
            var activateSignin = target === 'signin';
            refs.signin.classList.toggle('active', activateSignin);
            refs.signin.classList.toggle('inactive', !activateSignin);
            refs.signup.classList.toggle('active', !activateSignin);
            refs.signup.classList.toggle('inactive', activateSignin);
            refs.arrow.classList.add('visible');
        }

        async function refreshSessionUser() {
            if (!Account.token()) {
                renderSignedOutView(refs);
                return null;
            }
            // Localhost cannot complete Google OAuth redirect; keep a UI preview session.
            if (isLocalPreviewSession()) {
                var previewUser = readSessionUser() || localPreviewUser();
                localStorage.setItem('authUser', JSON.stringify(previewUser));
                localStorage.setItem('coUser', JSON.stringify(previewUser));
                renderSignedInView(Account, refs, previewUser);
                return previewUser;
            }
            try {
                var json = await Account.request('/api/auth/me', {
                    headers: Account.authHeaders()
                });
                var user = json.user || (json.data && json.data.user) || json.data || json;
                localStorage.setItem('authUser', JSON.stringify(user));
                localStorage.setItem('coUser', JSON.stringify(user));
                renderSignedInView(Account, refs, user);
                return user;
            } catch (error) {
                Account.clearSession();
                renderSignedOutView(refs);
                notifyAuthChanged(false, null);
                return null;
            }
        }

        function applyLocalPreviewSignIn() {
            var user = localPreviewUser();
            localStorage.setItem('authToken', LOCAL_PREVIEW_TOKEN);
            localStorage.setItem('coAuthToken', LOCAL_PREVIEW_TOKEN);
            localStorage.setItem('authUser', JSON.stringify(user));
            localStorage.setItem('coUser', JSON.stringify(user));
            renderSignedInView(Account, refs, user);
            notifyAuthChanged(true, user);
            showToast('Local preview signed in — only the Google profile pill should show.');
        }

        function startGoogleAuth() {
            if (isLocalHost()) {
                applyLocalPreviewSignIn();
                closePanel();
                return;
            }
            safeReturnUrl(Account);
            try { sessionStorage.setItem('authPanelWasOpen', '1'); } catch (e) {}
            window.location.href = Account.apiBaseUrl() + '/auth/google';
        }

        function openPanel(preferredCard) {
            refs.panel.classList.add('active');
            refs.overlay.classList.add('active');
            document.body.style.overflow = 'hidden';
            refreshSessionUser().then(function (user) {
                if (!user) {
                    renderSignedOutView(refs);
                    if (preferredCard === 'signup') activateCard('signup');
                    else if (preferredCard === 'signin') activateCard('signin');
                }
            });
        }

        function closePanel() {
            refs.panel.classList.remove('active');
            refs.overlay.classList.remove('active');
            document.body.style.overflow = '';
            resetForms();
        }

        function goToProfileIfSignedIn() {
            if (!Account.token()) return false;
            // Local preview has no real profile API session — keep the panel open for logout.
            if (isLocalPreviewSession()) {
                openPanel();
                return true;
            }
            window.location.href = Account.pageHref('profile');
            return true;
        }

        refs.trigger.addEventListener('click', function (event) {
            event.preventDefault();
            if (goToProfileIfSignedIn()) return;
            openPanel();
        });

        if (refs.closeBtn) refs.closeBtn.addEventListener('click', closePanel);
        refs.overlay.addEventListener('click', closePanel);

        if (refs.signin) {
            refs.signin.addEventListener('click', function () {
                if (!refs.loggedIn || refs.loggedIn.style.display !== 'block') activateCard('signin');
            });
        }
        if (refs.signup) {
            refs.signup.addEventListener('click', function () {
                if (!refs.loggedIn || refs.loggedIn.style.display !== 'block') activateCard('signup');
            });
        }
        if (refs.arrow) refs.arrow.addEventListener('click', function (event) {
            event.stopPropagation();
            resetForms();
        });

        if (options.headerSignInId && byId(options.headerSignInId)) {
            byId(options.headerSignInId).addEventListener('click', function (event) {
                event.preventDefault();
                openPanel('signin');
            });
        }
        if (options.headerRegisterId && byId(options.headerRegisterId)) {
            byId(options.headerRegisterId).addEventListener('click', function (event) {
                event.preventDefault();
                openPanel('signup');
            });
        }
        if (options.headerMyAccountId && byId(options.headerMyAccountId)) {
            byId(options.headerMyAccountId).addEventListener('click', function (event) {
                event.preventDefault();
                if (goToProfileIfSignedIn()) return;
                openPanel();
            });
        }

        Array.prototype.forEach.call(refs.panel.querySelectorAll('.account-google-btn'), function (googleBtn) {
            googleBtn.addEventListener('click', function () {
                if (isLocalHost()) {
                    startGoogleAuth();
                    return;
                }
                setButtonLoading(googleBtn, true);
                googleBtn.querySelector('span').textContent = 'Connecting securely...';
                startGoogleAuth();
            });
        });

        // If anything re-injects Account chrome after sign-in, strip it back to the pill only.
        if (refs.trigger && typeof MutationObserver === 'function') {
            var enforceTimer = null;
            var observer = new MutationObserver(function () {
                if (!refs.trigger.classList.contains('is-signed-in')) return;
                if (enforceTimer) return;
                enforceTimer = setTimeout(function () {
                    enforceTimer = null;
                    enforceDesktopProfileOnly(refs.trigger);
                }, 0);
            });
            observer.observe(refs.trigger, { childList: true, subtree: true });
        }

        if (refs.signinFormData) {
            refs.signinFormData.addEventListener('submit', async function (event) {
                event.preventDefault();
                var email = byId('signinEmail');
                var password = byId('signinPassword');
                var submitBtn = refs.signinFormData.querySelector('button[type="submit"], .account-submit-btn');
                setButtonLoading(submitBtn, true);
                try {
                    var json = await Account.request('/api/auth/login', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            email: email.value.trim(),
                            password: password.value
                        })
                    });
                    var data = json.data || json;
                    var token = data.token || json.token || json.accessToken || json.jwt;
                    var user = data.user || json.user || readSessionUser() || { email: email.value.trim() };
                    if (!token) throw new Error('Login did not return a token.');
                    localStorage.setItem('authToken', token);
                    localStorage.setItem('coAuthToken', token);
                    localStorage.setItem('authUser', JSON.stringify(user));
                    localStorage.setItem('coUser', JSON.stringify(user));
                    await refreshSessionUser();
                    notifyAuthChanged(true, readSessionUser());
                    refs.signinFormData.reset();
                    showToast('Welcome back, ' + firstNameFromUser(readSessionUser()) + '!');
                } catch (error) {
                    showToast(error.message || 'Unable to sign in.');
                } finally {
                    setButtonLoading(submitBtn, false);
                }
            });
        }

        if (refs.signupFormData) {
            refs.signupFormData.addEventListener('submit', async function (event) {
                event.preventDefault();
                var submitBtn = refs.signupFormData.querySelector('button[type="submit"], .account-submit-btn');
                setButtonLoading(submitBtn, true);
                try {
                    var firstName = byId('signupFirstName').value.trim();
                    var lastName = byId('signupLastName').value.trim();
                    var json = await Account.request('/api/auth/register', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            name: [firstName, byId('signupLastName').value.trim()].filter(Boolean).join(' '),
                            email: byId('signupEmail').value.trim(),
                            password: byId('signupPassword').value
                        })
                    });
                    var registeredUser = (json.data || json.user || json);
                    localStorage.setItem('authUser', JSON.stringify(Object.assign({}, registeredUser, { firstName: firstName, lastName: lastName })));
                    localStorage.setItem('coUser', JSON.stringify(Object.assign({}, registeredUser, { firstName: firstName, lastName: lastName })));

                    var loginJson = await Account.request('/api/auth/login', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            email: byId('signupEmail').value.trim(),
                            password: byId('signupPassword').value
                        })
                    });
                    var loginData = loginJson.data || loginJson;
                    if (!loginData.token) throw new Error('Registration succeeded but login failed.');
                    localStorage.setItem('authToken', loginData.token);
                    localStorage.setItem('coAuthToken', loginData.token);
                    localStorage.setItem('authUser', JSON.stringify(loginData.user || registeredUser));
                    localStorage.setItem('coUser', JSON.stringify(loginData.user || registeredUser));
                    await refreshSessionUser();
                    notifyAuthChanged(true, readSessionUser());
                    refs.signupFormData.reset();
                    showToast('Account created. Welcome, ' + firstNameFromUser(readSessionUser()) + '!');
                } catch (error) {
                    showToast(error.message || 'Unable to create account.');
                } finally {
                    setButtonLoading(submitBtn, false);
                }
            });
        }

        if (refs.logoutBtn) {
            refs.logoutBtn.addEventListener('click', function () {
                Account.clearSession();
                renderSignedOutView(refs);
                resetForms();
                notifyAuthChanged(false, null);
                showToast('You have been signed out.');
            });
        }

        activeController = {
            openSignIn: function () { openPanel('signin'); },
            startGoogle: startGoogleAuth,
            refresh: refreshSessionUser
        };

        refreshSessionUser().then(function (user) {
            var justSignedIn = false;
            try {
                justSignedIn = sessionStorage.getItem('authJustSignedIn') === '1';
                sessionStorage.removeItem('authJustSignedIn');
                sessionStorage.removeItem('authPanelWasOpen');
            } catch (e) {}
            if (user && justSignedIn) {
                notifyAuthChanged(true, user);
                showToast('You are signed in, ' + firstNameFromUser(user) + '. Your account is ready.');
            }
        });
    }

    function fallbackStartGoogle() {
        var Account = window.BrandedAccount;
        if (!Account) {
            window.location.href = (window.API_BASE_URL || 'https://api.brandeduk.com').replace(/\/+$/, '') + '/auth/google';
            return;
        }
        if (isLocalHost()) {
            var user = localPreviewUser();
            localStorage.setItem('authToken', LOCAL_PREVIEW_TOKEN);
            localStorage.setItem('coAuthToken', LOCAL_PREVIEW_TOKEN);
            localStorage.setItem('authUser', JSON.stringify(user));
            localStorage.setItem('coUser', JSON.stringify(user));
            notifyAuthChanged(true, user);
            return;
        }
        try {
            localStorage.setItem('authReturnTo', currentReturnUrl());
        } catch (e) {}
        window.location.href = Account.apiBaseUrl() + '/auth/google';
    }

    return {
        init: bindPanel,
        openSignIn: function () {
            if (activeController) {
                activeController.openSignIn();
                return;
            }
            var btn = byId('accountBtn');
            if (btn) btn.click();
        },
        startGoogle: function () {
            if (activeController) {
                activeController.startGoogle();
                return;
            }
            fallbackStartGoogle();
        },
        isSignedIn: function () {
            if (window.BrandedAccount && typeof window.BrandedAccount.token === 'function') {
                return !!window.BrandedAccount.token();
            }
            return !!(localStorage.getItem('authToken') || localStorage.getItem('coAuthToken'));
        }
    };
})();

/* Lock header rail to the live HERO banner width on every viewport (incl. real tablet). */
(function syncHeaderRailToHero() {
    if (window.__buHeroRailBound) return;
    window.__buHeroRailBound = true;

    function apply() {
        var header = document.querySelector('.site-header');
        var hero = document.querySelector('.hero-banners-container');
        if (!header) return;
        var width = 0;
        if (hero) {
            width = Math.round(hero.getBoundingClientRect().width);
        }
        if (!(width > 0)) {
            /* Pages without a hero (basket, etc.): match viewport like home rail JS. */
            width = Math.min(Math.round(window.innerWidth), 1440);
        }
        if (width > 0) {
            header.style.setProperty('--bu-hero-width', width + 'px');
        }
    }

    var scheduled = false;
    function schedule() {
        if (scheduled) return;
        scheduled = true;
        window.requestAnimationFrame(function () {
            scheduled = false;
            apply();
        });
    }

    apply();
    window.addEventListener('resize', schedule, { passive: true });
    window.addEventListener('load', schedule);
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', schedule);
    }
    if (typeof ResizeObserver === 'function') {
        var hero = document.querySelector('.hero-banners-container');
        if (hero) {
            new ResizeObserver(schedule).observe(hero);
        } else {
            document.addEventListener('DOMContentLoaded', function () {
                var lateHero = document.querySelector('.hero-banners-container');
                if (lateHero) new ResizeObserver(schedule).observe(lateHero);
                schedule();
            });
        }
    }
})();
