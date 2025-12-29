const squares = document.querySelectorAll('.faq-square');
const panels = document.querySelectorAll('.faq-panel');

squares.forEach(square => {
  square.addEventListener('click', () => {
    const panel = document.getElementById(square.dataset.target);
    const isOpen = panel.classList.contains('open');

    // close all
    panels.forEach(p => p.classList.remove('open'));
    squares.forEach(s => s.classList.remove('active'));

    // toggle logic
    if (!isOpen) {
      panel.classList.add('open');
      square.classList.add('active');
    }
  });
});
