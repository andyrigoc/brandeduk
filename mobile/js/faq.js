// FAQ Section - Toggle panels and questions
(function() {
  var squares = document.querySelectorAll('.faq-square');
  var panels = document.querySelectorAll('.faq-panel');

  if (squares.length === 0) return;

  // Category square click - toggle panels
  squares.forEach(function(square) {
    square.addEventListener('click', function() {
      var targetId = this.getAttribute('data-target');
      var panel = document.getElementById(targetId);
      var isOpen = panel && panel.classList.contains('open');

      // Close all panels and deactivate all squares
      panels.forEach(function(p) { p.classList.remove('open'); });
      squares.forEach(function(s) { s.classList.remove('active'); });

      // Toggle - if wasn't open, open it
      if (!isOpen && panel) {
        panel.classList.add('open');
        this.classList.add('active');
      }
    });
  });

  // FAQ question click - toggle individual answers (only one open at a time)
  document.querySelectorAll('.faq-question').forEach(function(question) {
    question.addEventListener('click', function() {
      var row = this.parentElement;
      var panel = row.parentElement;
      var wasOpen = row.classList.contains('open');
      
      // Close all other open rows in the same panel
      panel.querySelectorAll('.faq-row.open').forEach(function(openRow) {
        openRow.classList.remove('open');
      });
      
      // Toggle current row (open if it wasn't already open)
      if (!wasOpen) {
        row.classList.add('open');
      }
    });
  });
})();
