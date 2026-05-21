window.BrandedAccountPanel = (function () {
    'use strict';

    function accountScriptLoaded() {
        return !!(window.BrandedAccount && typeof window.BrandedAccount.request === 'function');
    }

    function byId(id) {
        return document.getElementById(id);
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
        if (byId('accountPanelEnhancements')) return;
        var style = document.createElement('style');
        style.id = 'accountPanelEnhancements';
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
            '.account-trigger-profile{display:inline-flex;align-items:center;gap:8px;margin-left:8px;padding:6px 10px;border:1px solid rgba(39,52,105,.12);border-radius:999px;background:#fff;color:#273469;font-size:12px;font-weight:900;box-shadow:0 10px 22px rgba(39,52,105,.12);vertical-align:middle;}' +
            '.account-trigger-avatar{width:24px;height:24px;border-radius:999px;display:inline-grid;place-items:center;background:#273469;color:#fff;font-size:10px;font-weight:900;overflow:hidden;}' +
            '.account-trigger-avatar img{width:100%;height:100%;object-fit:cover;}' +
            '.account-trigger-name{max-width:92px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}' +
            '.searchbar-header__account.is-signed-in .searchbar-header__action-ring{border-color:transparent;background:#C952DE;}' +
            '.searchbar-header__account.is-signed-in .searchbar-header__action-icon{stroke:#fff;fill:none;}' +
            '.nav-item.is-signed-in{color:#273469;font-weight:800;}' +
            '@media(max-width:767px){.account-trigger-profile{display:none;}}';
        document.head.appendChild(style);
    }

    function decorateAccountTrigger(refs, user) {
        if (!refs || !refs.trigger) return;
        var existing = refs.trigger.querySelector('.account-trigger-profile');
        refs.trigger.classList.toggle('is-signed-in', !!user);
        if (!user) {
            if (existing) existing.remove();
            var label = refs.trigger.querySelector('.nav-item-label');
            if (label) label.textContent = 'Account';
            refs.trigger.setAttribute('aria-label', 'My Account');
            return;
        }

        var firstName = firstNameFromUser(user);
        var labelEl = refs.trigger.querySelector('.nav-item-label');
        if (labelEl) labelEl.textContent = 'Hi, ' + firstName;
        refs.trigger.setAttribute('aria-label', 'My account, signed in as ' + (user.email || firstName));

        if (!existing) {
            existing = document.createElement('span');
            existing.className = 'account-trigger-profile';
            refs.trigger.appendChild(existing);
        }

        var avatar = '<span class="account-trigger-avatar">' + initialsFromUser(user) + '</span>';
        existing.innerHTML = avatar + '<span class="account-trigger-name">' + firstName + '</span>';
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
                    '<span>Continue with Google</span>' +
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
                return null;
            }
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
                safeReturnUrl(Account);
                setButtonLoading(googleBtn, true);
                googleBtn.querySelector('span').textContent = 'Connecting securely...';
                try { sessionStorage.setItem('authPanelWasOpen', '1'); } catch (e) {}
                window.location.href = Account.apiBaseUrl() + '/auth/google';
            });
        });

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
                showToast('You have been signed out.');
            });
        }

        refreshSessionUser().then(function (user) {
            var justSignedIn = false;
            try {
                justSignedIn = sessionStorage.getItem('authJustSignedIn') === '1';
                sessionStorage.removeItem('authJustSignedIn');
                sessionStorage.removeItem('authPanelWasOpen');
            } catch (e) {}
            if (user && justSignedIn) {
                showToast('You are signed in, ' + firstNameFromUser(user) + '. Your account is ready.');
            }
        });
    }

    return {
        init: bindPanel
    };
})();
