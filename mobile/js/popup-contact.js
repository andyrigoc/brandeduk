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
    form.addEventListener('submit', function(e) {
      e.preventDefault();
      
      var name = document.getElementById('contactName').value;
      var email = document.getElementById('contactEmail').value;
      var message = document.getElementById('contactMessage').value;
      
      // Here you would send the form data to your server
      console.log('Form submitted:', { name, email, message });
      
      // Show success feedback - change button to green "Submitted"
      var submitBtn = form.querySelector('.popup-contact__submit');
      if (submitBtn) {
        submitBtn.textContent = 'Submitted';
        submitBtn.style.backgroundColor = '#22c55e';
        submitBtn.style.cursor = 'default';
        submitBtn.disabled = true;
      }
      
      // Reset after delay and close popup
      setTimeout(function() {
        closePopup();
        form.reset();
        // Reset button state
        if (submitBtn) {
          submitBtn.textContent = 'Submit';
          submitBtn.style.backgroundColor = '#000';
          submitBtn.style.cursor = 'pointer';
          submitBtn.disabled = false;
        }
      }, 2000);
    });
  }
})();
