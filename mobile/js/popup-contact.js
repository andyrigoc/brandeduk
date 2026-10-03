// Popup Contact - Get in Touch
// Self-contained: loads its stylesheet and markup when the page lacks them, opens from any
// [data-open-contact] trigger (including buttons built later by JS) and auto-opens on ?contact=1.
(function() {
  if (window.__brandedContactPopupLoaded) return;
  window.__brandedContactPopupLoaded = true;

  var ASSET_VERSION = '20261003-consent';
  var scriptSrc = (document.currentScript && document.currentScript.src) || window.location.href;
  var popup = null;
  var overlay = null;
  var loading = false;
  var readyCallbacks = [];

  function assetUrl(file) {
    try {
      return new URL(file + '?v=' + ASSET_VERSION, scriptSrc).href;
    } catch (error) {
      return file;
    }
  }

  function findAsset(selector, attribute, fileName) {
    return Array.prototype.find.call(document.querySelectorAll(selector), function (element) {
      try {
        return new URL(element.getAttribute(attribute), window.location.href).pathname.split('/').pop() === fileName;
      } catch (error) {
        return false;
      }
    }) || null;
  }

  // The markup must not be inserted before its stylesheet hides it.
  function loadStylesheet(done) {
    var link = findAsset('link[rel="stylesheet"][href]', 'href', 'popup-contact.css');
    if (link && link.sheet) {
      done();
      return;
    }
    if (!link) {
      link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = assetUrl('../css/popup-contact.css');
      document.head.appendChild(link);
    }
    var finished = false;
    function finish() {
      if (finished) return;
      finished = true;
      done();
    }
    link.addEventListener('load', finish);
    link.addEventListener('error', finish);
    setTimeout(finish, 4000);
  }

  function loadTemplate(done) {
    if (window.BrandedPcContactTemplate) {
      done();
      return;
    }
    var script = document.createElement('script');
    script.src = assetUrl('popup-contact-template.js');
    script.onload = done;
    script.onerror = done;
    document.head.appendChild(script);
  }

  function bindPopup() {
    var element = document.getElementById('popupContact');
    if (!element) return false;
    popup = element;
    overlay = document.getElementById('popupOverlay');
    if (element.dataset.contactBound === '1') return true;
    element.dataset.contactBound = '1';

    var closeBtn = document.getElementById('popupContactClose');
    if (closeBtn) closeBtn.addEventListener('click', closePopup);
    if (overlay) overlay.addEventListener('click', closePopup);
    var form = document.getElementById('contactQuickForm');
    if (form) bindForm(form);
    return true;
  }

  function ensurePopup(callback) {
    if (bindPopup()) {
      if (callback) callback();
      return;
    }
    if (callback) readyCallbacks.push(callback);
    if (loading || !document.body) return;
    loading = true;

    var pending = 2;
    function step() {
      pending -= 1;
      if (pending > 0) return;
      if (!document.getElementById('popupContact') && window.BrandedPcContactTemplate) {
        document.body.insertAdjacentHTML('beforeend', window.BrandedPcContactTemplate);
      }
      loading = false;
      var callbacks = readyCallbacks.splice(0);
      if (!bindPopup()) return;
      callbacks.forEach(function (queued) { queued(); });
    }
    loadStylesheet(step);
    loadTemplate(step);
  }

  function showPopup(options) {
    if (!popup) return;
    // When a caller passes message (e.g. ASK FOR QUOTE with Basket share link),
    // always apply it. Skipping when the field already had leftover text was
    // dropping the basket URL from both the popup and the submitted email.
    if (options && Object.prototype.hasOwnProperty.call(options, 'message')) {
      var messageField = document.getElementById('contactMessage');
      if (messageField) messageField.value = options.message == null ? '' : String(options.message);
    }
    popup.classList.add('active');
    if (overlay) overlay.classList.add('active');
    document.body.style.overflow = 'hidden';
  }

  // Pages embedded in an iframe (customisation tool) open the host page's popup.
  function openInParent(options) {
    try {
      if (window.parent && window.parent !== window && typeof window.parent.openContactPopup === 'function') {
        window.parent.openContactPopup(options);
        return true;
      }
    } catch (error) {
      // Cross-origin parent: fall back to this page's popup.
    }
    return false;
  }

  // Global function to open popup. Optional: { message: 'prefilled text' }
  window.openContactPopup = function(options) {
    if (openInParent(options)) return;
    ensurePopup(function () { showPopup(options); });
  };
  
  // Close popup
  function closePopup() {
    if (!popup) return;
    dismissConsentNotice();
    popup.classList.remove('active');
    if (overlay) overlay.classList.remove('active');
    document.body.style.overflow = '';
  }
  
  // Capture phase so menus that stop propagation cannot swallow the trigger.
  document.addEventListener('click', function (e) {
    var trigger = e.target && e.target.closest ? e.target.closest('[data-open-contact]') : null;
    if (!trigger || trigger.getAttribute('data-open-contact') === '0') return;
    e.preventDefault();
    var message = trigger.getAttribute('data-contact-message') || '';
    // Deferred so menus closing on the same click do not undo the scroll lock.
    setTimeout(function () {
      window.openContactPopup(message ? { message: message } : undefined);
    }, 0);
  }, true);

  // Close on escape key
  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape' && popup && popup.classList.contains('active')) {
      closePopup();
    }
  });

  function shouldAutoOpen() {
    try {
      return new URLSearchParams(window.location.search).get('contact') === '1';
    } catch (error) {
      return false;
    }
  }

  function clearContactParam() {
    try {
      var url = new URL(window.location.href);
      url.searchParams.delete('contact');
      history.replaceState(history.state, '', url.pathname + url.search + url.hash);
    } catch (error) {
      // Leave the URL untouched.
    }
  }

  function boot() {
    if (shouldAutoOpen()) {
      clearContactParam();
      window.openContactPopup();
      return;
    }
    if (window.parent === window) ensurePopup();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
  
  function dismissConsentNotice() {
    var notice = document.getElementById('popupContactConsentNotice');
    if (notice && notice.parentNode) notice.parentNode.removeChild(notice);
  }

  // Small in-popup notice when the Agree checkbox is unchecked.
  function showConsentNotice() {
    dismissConsentNotice();
    var host = popup || document.getElementById('popupContact') || document.body;
    var notice = document.createElement('div');
    notice.id = 'popupContactConsentNotice';
    notice.className = 'popup-contact__notice';
    notice.setAttribute('role', 'alertdialog');
    notice.setAttribute('aria-modal', 'true');
    notice.setAttribute('aria-labelledby', 'popupContactConsentNoticeTitle');
    notice.innerHTML =
      '<div class="popup-contact__notice-card">' +
        '<p class="popup-contact__notice-title" id="popupContactConsentNoticeTitle">Please confirm we can contact you</p>' +
        '<p class="popup-contact__notice-text">Tick “I agree to be contacted about my enquiry” before sending your message.</p>' +
        '<button type="button" class="popup-contact__notice-ok" id="popupContactConsentNoticeOk">OK</button>' +
      '</div>';
    host.appendChild(notice);

    var consent = document.getElementById('contactConsent');
    if (consent) {
      var label = consent.closest('.popup-contact__consent');
      if (label) label.classList.add('popup-contact__consent--highlight');
      try { consent.focus(); } catch (error) { /* ignore */ }
    }

    function closeNotice() {
      dismissConsentNotice();
      if (consent) {
        var label = consent.closest('.popup-contact__consent');
        if (label) label.classList.remove('popup-contact__consent--highlight');
      }
    }

    var okBtn = document.getElementById('popupContactConsentNoticeOk');
    if (okBtn) okBtn.addEventListener('click', closeNotice);
    notice.addEventListener('click', function (event) {
      if (event.target === notice) closeNotice();
    });
  }

  // Form submit handler
  function bindForm(form) {
    form.addEventListener('submit', async function(e) {
      e.preventDefault();
      
      // #region agent log
      // #endregion
      
      var submitBtn = form.querySelector('.popup-contact__submit');
      var originalBtnText = submitBtn ? submitBtn.textContent : 'Submit';
      
      // Get form values
      var name = document.getElementById('contactName')?.value.trim();
      var email = document.getElementById('contactEmail')?.value.trim();
      var interest = document.getElementById('contactInterest')?.value || '';
      var phone = document.getElementById('contactPhone')?.value.trim() || '';
      var message = document.getElementById('contactMessage')?.value.trim();
      var consent = document.getElementById('contactConsent');
      
      // Desktop-only fields (may not exist on mobile) — phone & post code are optional
      var address = document.getElementById('contactAddress')?.value.trim() || '';
      var postCode = document.getElementById('contactPostCode')?.value.trim() || '';
      
      // #region agent log
      // #endregion
      
      // Log form values for debugging
      console.log('📝 Form values:', { name, email, interest, phone, message, address, postCode, consent: !!(consent && consent.checked) });
      
      // Required: name, email, message. Interest, phone, and post code are optional.
      if (!name || !email || !message) {
        var missingFields = [];
        if (!name) missingFields.push('Name');
        if (!email) missingFields.push('Email');
        if (!message) missingFields.push('Message');
        alert('Please fill in all required fields: ' + missingFields.join(', '));
        return;
      }

      // Agree checkbox must be ticked before send
      if (consent && !consent.checked) {
        showConsentNotice();
        return;
      }
      
      // Backend still expects an interest value — default when left blank
      if (!interest) {
        interest = 'other';
      }
      
      // Email validation
      var emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        alert('Please enter a valid email address.');
        return;
      }
      
      // Disable button and show loading state
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Submitting...';
        submitBtn.style.opacity = '0.7';
        submitBtn.style.cursor = 'not-allowed';
      }
      
      // Prepare contact data - only include fields with actual values
      var contactData = {
        name: name,
        email: email,
        interest: interest,
        message: message
      };
      
      // Add optional fields only if they have non-empty values
      if (phone && phone.trim() !== '') {
        contactData.phone = phone.trim();
      }
      if (address && address.trim() !== '') {
        contactData.address = address.trim();
      }
      // Only include postCode if it's provided and in valid UK format
      if (postCode && postCode.trim() !== '') {
        // UK post code format: AA9A 9AA or A9A 9AA or A9 9AA or A99 9AA or AA9 9AA or AA99 9AA
        var ukPostCodeRegex = /^[A-Z]{1,2}[0-9][A-Z0-9]?\s?[0-9][A-Z]{2}$/i;
        if (ukPostCodeRegex.test(postCode.trim())) {
          contactData.postCode = postCode.trim();
        }
        // If not valid UK format, don't include it (optional field - backend won't validate it)
      }
      
      // #region agent log
      // #endregion
      
      // Log the data being sent for debugging
      console.log('📧 Contact form data being sent:', contactData);
      
      try {
        // #region agent log
        var hasBrandedAPI = !!(window.BrandedAPI && window.BrandedAPI.submitContactForm);
        // #endregion
        
        // Use BrandedAPI if available, otherwise fallback to direct fetch
        var response;
        if (window.BrandedAPI && window.BrandedAPI.submitContactForm) {
          // #region agent log
          // #endregion
          response = await window.BrandedAPI.submitContactForm(contactData);
        } else {
          // #region agent log
          // #endregion
          // Fallback: direct fetch
          var apiResponse = await fetch('https://api.brandeduk.com/api/contact', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'accept': 'application/json'
            },
            body: JSON.stringify(contactData)
          });
          
          // #region agent log
          // #endregion
          
          if (!apiResponse.ok) {
            // Read response body once - try JSON first, fallback to text
            let errorDetails = '';
            let errorData = null;
            const contentType = apiResponse.headers.get('content-type');
            if (contentType && contentType.includes('application/json')) {
              try {
                errorData = await apiResponse.json();
                errorDetails = errorData.error || errorData.message || JSON.stringify(errorData);
                // #region agent log
                // #endregion
                console.error('❌ API Error Response:', errorData);
                
                // Extract specific validation errors if available
                if (errorData.errors && typeof errorData.errors === 'object') {
                  var validationErrors = Object.entries(errorData.errors)
                    .map(([field, msg]) => {
                      // Format field name nicely
                      var fieldName = field.charAt(0).toUpperCase() + field.slice(1);
                      if (fieldName === 'Postcode') fieldName = 'Post Code';
                      return fieldName + ': ' + msg;
                    })
                    .join('\n');
                  errorDetails = validationErrors || errorDetails;
                }
              } catch (e) {
                // #region agent log
                // #endregion
                console.error('❌ Failed to parse error as JSON:', e);
                errorDetails = 'Invalid JSON response';
              }
            } else {
              try {
                const errorText = await apiResponse.text();
                errorDetails = errorText;
                // #region agent log
                // #endregion
                console.error('❌ API Error Text:', errorText);
              } catch (textError) {
                errorDetails = 'Unknown error';
                console.error('❌ Could not read error response:', textError);
              }
            }
            // Store errorData in error object for later extraction
            var apiError = new Error(`API Error: ${apiResponse.status} ${apiResponse.statusText}${errorDetails ? ' - ' + errorDetails : ''}`);
            if (errorData) {
              apiError.errorData = errorData;
            }
            throw apiError;
          }
          
          response = await apiResponse.json();
          // #region agent log
          // #endregion
        }
        
        // #region agent log
        // #endregion
        
        // Success - show feedback
        if (submitBtn) {
          submitBtn.textContent = 'Submitted \u2713';
          submitBtn.style.backgroundColor = '#22c55e';
          submitBtn.style.opacity = '1';
        }
        
        // Show success message
        var successMsg = document.createElement('div');
        successMsg.className = 'popup-contact__success';
        successMsg.style.cssText = 'padding: 12px; background: #22c55e; color: white; border-radius: 8px; margin-top: 12px; text-align: center; font-weight: 500;';
        successMsg.textContent = response.message || 'Thank you! We\'ll get back to you soon.';
        form.appendChild(successMsg);
        
        // Reset form and close popup after delay
      setTimeout(function() {
          form.reset();
          if (successMsg.parentNode) {
            successMsg.parentNode.removeChild(successMsg);
          }
        closePopup();
          
        // Reset button state
          if (submitBtn) {
            submitBtn.textContent = originalBtnText;
            submitBtn.style.backgroundColor = '';
            submitBtn.style.opacity = '1';
            submitBtn.style.cursor = 'pointer';
            submitBtn.disabled = false;
          }
        }, 3000);
        
      } catch (error) {
        // #region agent log
        // #endregion
        
        console.error('Contact form submission error:', error);
        
        // Show error message
        if (submitBtn) {
          submitBtn.textContent = 'Error - Try Again';
          submitBtn.style.backgroundColor = '#ef4444';
          submitBtn.style.opacity = '1';
        }
        
        // Determine error message based on error type
        var errorText = 'Sorry, there was an error. Please try again or call us at 020 8974 2722';
        
        if (error.message) {
          if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
            errorText = 'Network error. Please check your internet connection and try again.';
          } else if (error.message.includes('API Error: 400')) {
            // Check if we have errorData with validation errors
            if (error.errorData && error.errorData.errors && typeof error.errorData.errors === 'object') {
              // Extract validation errors from errorData
              var validationErrors = Object.entries(error.errorData.errors)
                .map(function(entry) {
                  var field = entry[0];
                  var msg = entry[1];
                  // Format field name nicely
                  var fieldName = field.charAt(0).toUpperCase() + field.slice(1);
                  if (fieldName === 'Postcode' || fieldName === 'postCode') fieldName = 'Post Code';
                  return fieldName + ': ' + msg;
                });
              if (validationErrors.length > 0) {
                errorText = 'Please fix the following:\n' + validationErrors.join('\n');
              } else {
                errorText = 'Invalid form data. Please check all fields and try again.';
              }
            } else if (error.message.includes('Message:') || error.message.includes('PostCode:') || error.message.includes('postCode:')) {
              // Try to extract validation errors from error message string
              var lines = error.message.split('\n');
              var validationErrors = [];
              lines.forEach(function(line) {
                if (line.includes(':') && (line.includes('Message') || line.includes('PostCode') || line.includes('postCode'))) {
                  var match = line.match(/(\w+):\s*(.+)/);
                  if (match) {
                    var fieldName = match[1].charAt(0).toUpperCase() + match[1].slice(1).replace(/([A-Z])/g, ' $1');
                    validationErrors.push(fieldName + ': ' + match[2].trim());
                  }
                }
              });
              if (validationErrors.length > 0) {
                errorText = 'Please fix the following:\n' + validationErrors.join('\n');
              } else {
                errorText = 'Invalid form data. Please check all fields and try again.';
              }
            } else if (error.message.includes('Validation failed')) {
              errorText = 'Invalid form data. Please check all fields and try again.';
            } else {
              errorText = 'Invalid form data. Please check all fields and try again.';
            }
          } else if (error.message.includes('API Error: 500')) {
            errorText = 'Server error. Please try again later or call us at 020 8974 2722';
          } else if (error.message.includes('API Error')) {
            errorText = 'Server error. Please try again later or call us at 020 8974 2722';
          }
        }
        
        var errorMsg = document.createElement('div');
        errorMsg.className = 'popup-contact__error';
        errorMsg.style.cssText = 'padding: 12px; background: #ef4444; color: white; border-radius: 8px; margin-top: 12px; text-align: left; font-weight: 500; white-space: pre-line;';
        errorMsg.textContent = errorText;
        form.appendChild(errorMsg);
        
        // Reset button after delay
        setTimeout(function() {
          if (errorMsg.parentNode) {
            errorMsg.parentNode.removeChild(errorMsg);
          }
          if (submitBtn) {
            submitBtn.textContent = originalBtnText;
            submitBtn.style.backgroundColor = '';
            submitBtn.style.opacity = '1';
          submitBtn.style.cursor = 'pointer';
          submitBtn.disabled = false;
        }
        }, 5000);
      }
    });
  }
})();
