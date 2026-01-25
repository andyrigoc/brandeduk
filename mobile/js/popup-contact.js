// Popup Contact - Get in Touch
(function() {
  var popup = document.getElementById('popupContact');
  var overlay = document.getElementById('popupOverlay');
  var closeBtn = document.getElementById('popupContactClose');
  var form = document.getElementById('contactQuickForm');
  
  if (!popup) return;
  
  // Global function to open popup
  window.openContactPopup = function() {
    popup.classList.add('active');
    if (overlay) overlay.classList.add('active');
    document.body.style.overflow = 'hidden';
  };
  
  // Close popup
  function closePopup() {
    popup.classList.remove('active');
    if (overlay) overlay.classList.remove('active');
    document.body.style.overflow = '';
  }
  
  if (closeBtn) {
    closeBtn.addEventListener('click', closePopup);
  }
  
  if (overlay) {
    overlay.addEventListener('click', closePopup);
  }
  
  // Close on escape key
  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape' && popup.classList.contains('active')) {
      closePopup();
    }
  });
  
  // Form submit handler
  if (form) {
    form.addEventListener('submit', async function(e) {
      e.preventDefault();
      
      // #region agent log
      fetch('http://127.0.0.1:7244/ingest/ff4bdadc-0eae-4978-b238-71d56c718ed8',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'popup-contact.js:42',message:'Form submit started',data:{timestamp:Date.now()},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
      // #endregion
      
      var submitBtn = form.querySelector('.popup-contact__submit');
      var originalBtnText = submitBtn ? submitBtn.textContent : 'Submit';
      
      // Get form values
      var name = document.getElementById('contactName')?.value.trim();
      var email = document.getElementById('contactEmail')?.value.trim();
      var interest = document.getElementById('contactInterest')?.value;
      var phone = document.getElementById('contactPhone')?.value.trim() || '';
      var message = document.getElementById('contactMessage')?.value.trim();
      
      // Desktop-only fields (may not exist on mobile)
      var address = document.getElementById('contactAddress')?.value.trim() || '';
      var postCode = document.getElementById('contactPostCode')?.value.trim() || '';
      
      // #region agent log
      fetch('http://127.0.0.1:7244/ingest/ff4bdadc-0eae-4978-b238-71d56c718ed8',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'popup-contact.js:59',message:'Raw form values extracted',data:{name:name,email:email,interest:interest,phone:phone,message:message,address:address,postCode:postCode},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
      // #endregion
      
      // Log form values for debugging
      console.log('📝 Form values:', { name, email, interest, phone, message, address, postCode });
      
      // Validation
      if (!name || !email || !interest || !message) {
        var missingFields = [];
        if (!name) missingFields.push('Name');
        if (!email) missingFields.push('Email');
        if (!interest) missingFields.push('Interest');
        if (!message) missingFields.push('Message');
        alert('Please fill in all required fields: ' + missingFields.join(', '));
        return;
      }
      
      // Additional validation for interest (must not be empty string)
      if (interest === '' || interest === null) {
        alert('Please select an interest option.');
        return;
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
      fetch('http://127.0.0.1:7244/ingest/ff4bdadc-0eae-4978-b238-71d56c718ed8',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'popup-contact.js:113',message:'Contact data object created',data:contactData,jsonPayload:JSON.stringify(contactData),timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
      // #endregion
      
      // Log the data being sent for debugging
      console.log('📧 Contact form data being sent:', contactData);
      
      try {
        // #region agent log
        var hasBrandedAPI = !!(window.BrandedAPI && window.BrandedAPI.submitContactForm);
        fetch('http://127.0.0.1:7244/ingest/ff4bdadc-0eae-4978-b238-71d56c718ed8',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'popup-contact.js:118',message:'Checking BrandedAPI availability',data:{hasBrandedAPI:hasBrandedAPI,brandedAPIType:typeof window.BrandedAPI,submitContactFormType:typeof (window.BrandedAPI?.submitContactForm)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
        // #endregion
        
        // Use BrandedAPI if available, otherwise fallback to direct fetch
        var response;
        if (window.BrandedAPI && window.BrandedAPI.submitContactForm) {
          // #region agent log
          fetch('http://127.0.0.1:7244/ingest/ff4bdadc-0eae-4978-b238-71d56c718ed8',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'popup-contact.js:120',message:'Using BrandedAPI path',data:{contactData:contactData},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
          // #endregion
          response = await window.BrandedAPI.submitContactForm(contactData);
        } else {
          // #region agent log
          fetch('http://127.0.0.1:7244/ingest/ff4bdadc-0eae-4978-b238-71d56c718ed8',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'popup-contact.js:122',message:'Using fallback direct fetch path',data:{url:'https://api.brandeduk.com/api/contact',contactData:contactData,jsonBody:JSON.stringify(contactData)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
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
          fetch('http://127.0.0.1:7244/ingest/ff4bdadc-0eae-4978-b238-71d56c718ed8',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'popup-contact.js:130',message:'API response received',data:{status:apiResponse.status,statusText:apiResponse.statusText,ok:apiResponse.ok,headers:Object.fromEntries(apiResponse.headers.entries())},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
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
                fetch('http://127.0.0.1:7244/ingest/ff4bdadc-0eae-4978-b238-71d56c718ed8',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'popup-contact.js:137',message:'API error response (JSON)',data:{status:apiResponse.status,errorData:errorData,errorDetails:errorDetails},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
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
                fetch('http://127.0.0.1:7244/ingest/ff4bdadc-0eae-4978-b238-71d56c718ed8',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'popup-contact.js:142',message:'Failed to parse error as JSON',data:{error:e.message,status:apiResponse.status},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
                // #endregion
                console.error('❌ Failed to parse error as JSON:', e);
                errorDetails = 'Invalid JSON response';
              }
            } else {
              try {
                const errorText = await apiResponse.text();
                errorDetails = errorText;
                // #region agent log
                fetch('http://127.0.0.1:7244/ingest/ff4bdadc-0eae-4978-b238-71d56c718ed8',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'popup-contact.js:147',message:'API error response (text)',data:{status:apiResponse.status,errorText:errorText},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
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
          fetch('http://127.0.0.1:7244/ingest/ff4bdadc-0eae-4978-b238-71d56c718ed8',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'popup-contact.js:156',message:'API success response',data:{response:response},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})}).catch(()=>{});
          // #endregion
        }
        
        // #region agent log
        fetch('http://127.0.0.1:7244/ingest/ff4bdadc-0eae-4978-b238-71d56c718ed8',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'popup-contact.js:160',message:'Form submission successful',data:{response:response},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})}).catch(()=>{});
        // #endregion
        
        // Success - show feedback
        if (submitBtn) {
          submitBtn.textContent = 'Submitted ✓';
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
        fetch('http://127.0.0.1:7244/ingest/ff4bdadc-0eae-4978-b238-71d56c718ed8',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'popup-contact.js:192',message:'Form submission error caught',data:{errorMessage:error.message,errorStack:error.stack,errorName:error.name,contactData:contactData},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
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
