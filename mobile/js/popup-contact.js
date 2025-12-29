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
      
      // Show success feedback
      alert('Thanks for your message! We\'ll get back to you soon.');
      closePopup();
      form.reset();
    });
  }
})();
