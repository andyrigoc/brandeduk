// Checkout Page JavaScript

// Tab switching
document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        const tabName = btn.dataset.tab;
        
        // Remove active from all tabs and content
        document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
        
        // Add active to clicked tab and corresponding content
        btn.classList.add('active');
        document.getElementById(`${tabName}-tab`).classList.add('active');
        
        // Vibration feedback
        if (navigator.vibrate) navigator.vibrate(5);
    });
});

// Modal functions
function openAddressModal() {
    document.getElementById('addressModal').classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeAddressModal() {
    document.getElementById('addressModal').classList.remove('active');
    document.body.style.overflow = '';
}

function openShippingModal() {
    document.getElementById('shippingModal').classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeShippingModal() {
    document.getElementById('shippingModal').classList.remove('active');
    document.body.style.overflow = '';
}

// Change address button
document.querySelector('.change-address-btn')?.addEventListener('click', openShippingModal);

// Close modals on overlay click
document.querySelectorAll('.modal-overlay').forEach(overlay => {
    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) {
            overlay.classList.remove('active');
            document.body.style.overflow = '';
        }
    });
});

// Address form submission
document.getElementById('addressForm')?.addEventListener('submit', (e) => {
    e.preventDefault();
    
    // Simulate saving address
    console.log('Address saved');
    
    // Update current address display
    // In a real app, this would update with form data
    
    closeAddressModal();
    
    // Show success feedback
    if (navigator.vibrate) navigator.vibrate([10, 50, 10]);
});

// Request Quote button
document.querySelector('.request-quote-btn')?.addEventListener('click', () => {
    // Collect form data
    const quoteData = {
        address: {
            // Get from form
        },
        products: JSON.parse(localStorage.getItem('quoteBasket') || '[]'),
        timestamp: new Date().toISOString()
    };
    
    console.log('Quote Request:', quoteData);
    
    // In real app, send to backend
    // For now, show success message
    alert('Quote request submitted successfully! We will contact you soon.');
    
    // Redirect to confirmation or home
    // window.location.href = 'quote-confirmation-mobile.html';
});

// Promo timer (if needed)
function startPromoTimer() {
    const timerEl = document.getElementById('promoTimer');
    if (!timerEl) return;
    
    let hours = 145;
    let minutes = 26;
    let seconds = 52;
    
    setInterval(() => {
        seconds--;
        if (seconds < 0) {
            seconds = 59;
            minutes--;
        }
        if (minutes < 0) {
            minutes = 59;
            hours--;
        }
        if (hours < 0) {
            hours = 0;
            minutes = 0;
            seconds = 0;
        }
        
        timerEl.textContent = `${hours}H : ${minutes}M : ${String(seconds).padStart(2, '0')}S`;
    }, 1000);
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    startPromoTimer();
    
    // Load basket data and display products
    const basket = JSON.parse(localStorage.getItem('quoteBasket') || '[]');
    console.log('Basket items:', basket.length);
});
