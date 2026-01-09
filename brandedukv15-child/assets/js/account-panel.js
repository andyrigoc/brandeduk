/**
 * Account Panel - Desktop Sign In / Sign Up
 * Dynamically injects the account panel HTML and handles all functionality
 */
(function() {
    'use strict';

    // Wait for DOM to be ready
    document.addEventListener('DOMContentLoaded', function() {
        initAccountPanel();
    });

    function initAccountPanel() {
        var accountBtn = document.getElementById('accountBtn');
        if (!accountBtn) return;

        // Inject the account panel HTML if not present
        if (!document.getElementById('accountPanel')) {
            injectAccountPanelHTML();
            injectAccountPanelCSS();
        }

        // Initialize event handlers
        setupEventHandlers();
    }

    function injectAccountPanelCSS() {
        if (document.getElementById('accountPanelStyles')) return;
        
        var style = document.createElement('style');
        style.id = 'accountPanelStyles';
        style.textContent = `
            .account-overlay {
                position: fixed;
                inset: 0;
                background: rgba(0, 0, 0, 0.5);
                opacity: 0;
                visibility: hidden;
                transition: all 0.3s ease;
                z-index: 9998;
            }
            .account-overlay.active { opacity: 1; visibility: visible; }
            .account-panel {
                position: fixed;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%) scale(0.9);
                background: transparent;
                border-radius: 20px;
                width: 600px;
                max-width: 90vw;
                height: 500px;
                max-height: 80vh;
                opacity: 0;
                visibility: hidden;
                transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
                z-index: 9999;
                overflow: hidden;
                box-shadow: 0 25px 80px rgba(0, 0, 0, 0.3);
            }
            .account-panel.active { opacity: 1; visibility: visible; transform: translate(-50%, -50%) scale(1); }
            .account-panel-header { position: absolute; top: 16px; right: 16px; z-index: 10; }
            .account-close-btn { width: 44px; height: 44px; border: none; background: rgba(0, 0, 0, 0.3); border-radius: 50%; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: all 0.2s ease; }
            .account-close-btn:hover { background: rgba(0, 0, 0, 0.5); transform: scale(1.05); }
            .account-close-btn svg { stroke: #fff; }
            .account-forms-container { display: flex; align-items: stretch; height: 100%; position: relative; overflow: hidden; }
            .account-arrow { position: absolute; left: 16px; top: 50%; transform: translateY(-50%); width: 44px; height: 44px; display: flex; justify-content: center; align-items: center; background: rgba(0, 0, 0, 0.2); border-radius: 50%; color: rgba(255, 255, 255, 0.8); cursor: pointer; transition: all 0.3s ease; z-index: 10; opacity: 0; visibility: hidden; }
            .account-arrow.visible { opacity: 1; visibility: visible; }
            .account-arrow:hover { background: rgba(0, 0, 0, 0.4); }
            .account-arrow svg { stroke: #fff; }
            .account-forms-wrapper { flex: 1; display: flex; overflow: hidden; width: 100%; position: relative; }
            .account-form-holder { flex-basis: 50%; display: flex; flex-direction: column; justify-content: center; align-items: center; position: relative; transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1); cursor: pointer; padding: 24px; }
            .account-form-holder:hover { flex-basis: 55%; }
            .signin-form { background: linear-gradient(135deg, #8455f4 0%, #6b21a8 100%); }
            .signup-form { background: linear-gradient(135deg, #3e4357 0%, #1f2937 100%); }
            .account-form-icon { color: #fff; display: flex; flex-direction: column; align-items: center; gap: 12px; transition: all 0.3s ease; }
            .account-form-icon svg { stroke: #fff; }
            .account-form-icon span { font-size: 1.1rem; font-weight: 600; }
            .account-form-content { position: absolute; width: 85%; top: 100%; opacity: 0; transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1); }
            .account-form-holder.active { flex-basis: 100%; position: absolute; inset: 0; z-index: 2; }
            .account-form-holder.active .account-form-icon { position: absolute; top: 24px; left: 24px; flex-direction: row; gap: 12px; }
            .account-form-holder.active .account-form-icon svg { width: 28px; height: 28px; }
            .account-form-holder.active .account-form-icon span { font-size: 1rem; }
            .account-form-holder.active .account-form-content { top: 80px; opacity: 1; width: 80%; max-width: 400px; left: 50%; transform: translateX(-50%); }
            .account-form-holder.inactive { flex-basis: 0%; opacity: 0; pointer-events: none; }
            .account-input-group { position: relative; margin-bottom: 28px; }
            .account-input-group.half { flex: 1; }
            .account-input-row { display: flex; gap: 16px; }
            .account-input-group label { position: absolute; top: 0; left: 0; color: rgba(255, 255, 255, 0.7); font-size: 14px; transition: all 0.3s ease; pointer-events: none; }
            .account-input-group input { width: 100%; padding: 10px 0; background: transparent; border: none; border-bottom: 1px solid rgba(255, 255, 255, 0.5); color: #fff; font-size: 15px; outline: none; }
            .account-input-group input:focus, .account-input-group input:valid { border-bottom-color: #fff; }
            .account-input-group input:focus + label, .account-input-group input:valid + label { top: -20px; font-size: 11px; color: rgba(255, 255, 255, 0.9); }
            .account-form-actions { display: flex; justify-content: flex-end; margin-top: 20px; }
            .account-submit-btn { width: 50px; height: 50px; border: none; border-radius: 50%; background: rgba(0, 0, 0, 0.3); color: #fff; cursor: pointer; transition: all 0.3s ease; display: flex; align-items: center; justify-content: center; }
            .account-submit-btn:hover { background: rgba(0, 0, 0, 0.5); transform: scale(1.05); }
            .account-submit-btn svg { stroke: #fff; }
            .account-forgot-link { display: block; margin-top: 20px; color: rgba(255, 255, 255, 0.7); font-size: 13px; text-decoration: none; transition: color 0.2s; }
            .account-forgot-link:hover { color: #fff; }
            .account-logged-in { padding: 50px 40px; text-align: center; background: #fff; height: 100%; }
            .account-user-avatar { margin-bottom: 16px; }
            .account-user-name { font-size: 24px; font-weight: 700; color: #1f2937; margin-bottom: 4px; }
            .account-user-email { font-size: 14px; color: #6b7280; margin-bottom: 24px; }
            .account-user-details { text-align: left; background: #f9fafb; border-radius: 12px; padding: 20px; margin-bottom: 24px; }
            .account-user-details p { font-size: 14px; color: #4b5563; margin-bottom: 8px; }
            .account-user-details p:last-child { margin-bottom: 0; }
            .account-user-details strong { color: #1f2937; }
            .account-logout-btn { display: inline-flex; align-items: center; gap: 8px; padding: 14px 28px; background: #ef4444; border: none; border-radius: 12px; color: #fff; font-size: 15px; font-weight: 600; cursor: pointer; transition: all 0.2s ease; }
            .account-logout-btn:hover { background: #dc2626; transform: translateY(-2px); }
        `;
        document.head.appendChild(style);
    }

    function injectAccountPanelHTML() {
        var html = `
            <div class="account-overlay" id="accountOverlay"></div>
            <div class="account-panel" id="accountPanel">
                <div class="account-panel-header">
                    <button class="account-close-btn" id="accountCloseBtn" aria-label="Close">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <line x1="18" y1="6" x2="6" y2="18"></line>
                            <line x1="6" y1="6" x2="18" y2="18"></line>
                        </svg>
                    </button>
                </div>
                <div class="account-forms-container">
                    <div class="account-arrow" id="accountArrow">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <polyline points="15 18 9 12 15 6"></polyline>
                        </svg>
                    </div>
                    <div class="account-forms-wrapper">
                        <div class="account-form-holder signin-form" id="signinForm">
                            <div class="account-form-icon">
                                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                                    <circle cx="12" cy="7" r="4"/>
                                </svg>
                                <span>Sign In</span>
                            </div>
                            <div class="account-form-content">
                                <form id="signinFormData">
                                    <div class="account-input-group">
                                        <input type="email" id="signinEmail" required>
                                        <label for="signinEmail">Email</label>
                                    </div>
                                    <div class="account-input-group">
                                        <input type="password" id="signinPassword" required>
                                        <label for="signinPassword">Password</label>
                                    </div>
                                    <div class="account-form-actions">
                                        <button type="submit" class="account-submit-btn">
                                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                                <line x1="5" y1="12" x2="19" y2="12"></line>
                                                <polyline points="12 5 19 12 12 19"></polyline>
                                            </svg>
                                        </button>
                                    </div>
                                    <a href="#" class="account-forgot-link">Forgot Password?</a>
                                </form>
                            </div>
                        </div>
                        <div class="account-form-holder signup-form" id="signupForm">
                            <div class="account-form-icon">
                                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                                    <circle cx="12" cy="7" r="4"/>
                                    <line x1="20" y1="8" x2="20" y2="14"></line>
                                    <line x1="17" y1="11" x2="23" y2="11"></line>
                                </svg>
                                <span>Sign Up</span>
                            </div>
                            <div class="account-form-content">
                                <form id="signupFormData">
                                    <div class="account-input-row">
                                        <div class="account-input-group half">
                                            <input type="text" id="signupFirstName" required>
                                            <label for="signupFirstName">First Name</label>
                                        </div>
                                        <div class="account-input-group half">
                                            <input type="text" id="signupLastName" required>
                                            <label for="signupLastName">Last Name</label>
                                        </div>
                                    </div>
                                    <div class="account-input-group">
                                        <input type="email" id="signupEmail" required>
                                        <label for="signupEmail">Email</label>
                                    </div>
                                    <div class="account-input-group">
                                        <input type="tel" id="signupPhone" required>
                                        <label for="signupPhone">Phone Number</label>
                                    </div>
                                    <div class="account-input-group">
                                        <input type="text" id="signupCompany">
                                        <label for="signupCompany">Company Name (optional)</label>
                                    </div>
                                    <div class="account-input-group">
                                        <input type="password" id="signupPassword" required>
                                        <label for="signupPassword">Password</label>
                                    </div>
                                    <div class="account-form-actions">
                                        <button type="submit" class="account-submit-btn">
                                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                                <line x1="5" y1="12" x2="19" y2="12"></line>
                                                <polyline points="12 5 19 12 12 19"></polyline>
                                            </svg>
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="account-logged-in" id="accountLoggedIn" style="display: none;">
                    <div class="account-user-avatar">
                        <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="#8455f4" stroke-width="1">
                            <circle cx="12" cy="12" r="10"/>
                            <path d="M12 14c-2.5 0-4.5-2-4.5-4.5S9.5 5 12 5s4.5 2 4.5 4.5S14.5 14 12 14z"/>
                            <path d="M4.5 19.5c0-3 3.5-5 7.5-5s7.5 2 7.5 5"/>
                        </svg>
                    </div>
                    <h3 class="account-user-name" id="accountUserName">Welcome!</h3>
                    <p class="account-user-email" id="accountUserEmail"></p>
                    <div class="account-user-details" id="accountUserDetails"></div>
                    <button class="account-logout-btn" id="accountLogoutBtn">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                            <polyline points="16 17 21 12 16 7"></polyline>
                            <line x1="21" y1="12" x2="9" y2="12"></line>
                        </svg>
                        Sign Out
                    </button>
                </div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', html);
    }

    function setupEventHandlers() {
        var accountBtn = document.getElementById('accountBtn');
        var accountPanel = document.getElementById('accountPanel');
        var accountOverlay = document.getElementById('accountOverlay');
        var accountCloseBtn = document.getElementById('accountCloseBtn');
        var accountArrow = document.getElementById('accountArrow');
        var signinForm = document.getElementById('signinForm');
        var signupForm = document.getElementById('signupForm');
        var signinFormData = document.getElementById('signinFormData');
        var signupFormData = document.getElementById('signupFormData');
        var accountLoggedIn = document.getElementById('accountLoggedIn');
        var accountLogoutBtn = document.getElementById('accountLogoutBtn');

        if (!accountBtn || !accountPanel) return;

        var USER_SESSION_KEY = 'brandeduk-user-session';

        function checkLoggedIn() {
            var session = localStorage.getItem(USER_SESSION_KEY);
            if (session) {
                var user = JSON.parse(session);
                showLoggedInView(user);
                return true;
            }
            return false;
        }

        function showLoggedInView(user) {
            document.querySelector('.account-forms-container').style.display = 'none';
            accountLoggedIn.style.display = 'block';
            document.getElementById('accountUserName').textContent = 'Welcome, ' + user.firstName + '!';
            document.getElementById('accountUserEmail').textContent = user.email;
            var detailsHtml = '<p><strong>Name:</strong> ' + user.firstName + ' ' + user.lastName + '</p>' +
                '<p><strong>Phone:</strong> ' + (user.phone || 'Not provided') + '</p>' +
                '<p><strong>Company:</strong> ' + (user.company || 'Not provided') + '</p>';
            document.getElementById('accountUserDetails').innerHTML = detailsHtml;
        }

        function showFormsView() {
            document.querySelector('.account-forms-container').style.display = 'flex';
            accountLoggedIn.style.display = 'none';
        }

        function openPanel() {
            checkLoggedIn();
            accountPanel.classList.add('active');
            accountOverlay.classList.add('active');
            document.body.style.overflow = 'hidden';
        }

        function closePanel() {
            accountPanel.classList.remove('active');
            accountOverlay.classList.remove('active');
            document.body.style.overflow = '';
            resetForms();
        }

        function resetForms() {
            signinForm.classList.remove('active', 'inactive');
            signupForm.classList.remove('active', 'inactive');
            accountArrow.classList.remove('visible');
        }

        accountBtn.addEventListener('click', function(e) {
            e.preventDefault();
            openPanel();
        });

        // Also bind header-top links
        var headerSignInLink = document.getElementById('headerSignInLink');
        var headerRegisterLink = document.getElementById('headerRegisterLink');
        var headerMyAccountLink = document.getElementById('headerMyAccountLink');

        if (headerSignInLink) {
            headerSignInLink.addEventListener('click', function(e) {
                e.preventDefault();
                openPanel();
                // Auto-expand Sign In form
                setTimeout(function() {
                    signinForm.click();
                }, 100);
            });
        }

        if (headerRegisterLink) {
            headerRegisterLink.addEventListener('click', function(e) {
                e.preventDefault();
                openPanel();
                // Auto-expand Sign Up form
                setTimeout(function() {
                    signupForm.click();
                }, 100);
            });
        }

        if (headerMyAccountLink) {
            headerMyAccountLink.addEventListener('click', function(e) {
                e.preventDefault();
                openPanel();
            });
        }

        accountCloseBtn.addEventListener('click', closePanel);
        accountOverlay.addEventListener('click', closePanel);

        signinForm.addEventListener('click', function() {
            if (!signinForm.classList.contains('active')) {
                signinForm.classList.add('active');
                signinForm.classList.remove('inactive');
                signupForm.classList.add('inactive');
                signupForm.classList.remove('active');
                accountArrow.classList.add('visible');
            }
        });

        signupForm.addEventListener('click', function() {
            if (!signupForm.classList.contains('active')) {
                signupForm.classList.add('active');
                signupForm.classList.remove('inactive');
                signinForm.classList.add('inactive');
                signinForm.classList.remove('active');
                accountArrow.classList.add('visible');
            }
        });

        accountArrow.addEventListener('click', function(e) {
            e.stopPropagation();
            resetForms();
        });

        signinFormData.addEventListener('submit', function(e) {
            e.preventDefault();
            var email = document.getElementById('signinEmail').value;
            var password = document.getElementById('signinPassword').value;

            var users = JSON.parse(localStorage.getItem('brandeduk-users') || '[]');
            var user = users.find(function(u) { return u.email === email && u.password === password; });
            if (user) {
                localStorage.setItem(USER_SESSION_KEY, JSON.stringify(user));
                showLoggedInView(user);
                showAccountToast('Welcome back, ' + user.firstName + '!');
            } else {
                showAccountToast('Invalid email or password');
            }
        });

        signupFormData.addEventListener('submit', function(e) {
            e.preventDefault();
            var userData = {
                firstName: document.getElementById('signupFirstName').value,
                lastName: document.getElementById('signupLastName').value,
                email: document.getElementById('signupEmail').value,
                phone: document.getElementById('signupPhone').value,
                company: document.getElementById('signupCompany').value,
                password: document.getElementById('signupPassword').value
            };

            var users = JSON.parse(localStorage.getItem('brandeduk-users') || '[]');
            if (users.some(function(u) { return u.email === userData.email; })) {
                showAccountToast('Email already registered');
                return;
            }
            userData.id = Date.now();
            users.push(userData);
            localStorage.setItem('brandeduk-users', JSON.stringify(users));
            localStorage.setItem(USER_SESSION_KEY, JSON.stringify(userData));
            showLoggedInView(userData);
            showAccountToast('Account created! Welcome, ' + userData.firstName + '!');
        });

        accountLogoutBtn.addEventListener('click', function() {
            localStorage.removeItem(USER_SESSION_KEY);
            showFormsView();
            resetForms();
            showAccountToast('You have been signed out');
        });

        function showAccountToast(message) {
            var toast = document.createElement('div');
            toast.textContent = message;
            toast.style.cssText = 'position: fixed; bottom: 40px; left: 50%; transform: translateX(-50%); background: #1f2937; color: #fff; padding: 12px 24px; border-radius: 8px; font-size: 14px; z-index: 10001;';
            document.body.appendChild(toast);
            setTimeout(function() {
                toast.style.opacity = '0';
                setTimeout(function() { toast.remove(); }, 300);
            }, 3000);
        }
    }
})();
