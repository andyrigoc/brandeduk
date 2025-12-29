// ===== PRODUCTS DATABASE =====
const PRODUCTS_DB = [
    {
        code: "GD067",
        name: "Heavy-Blend Hoodie",
        price: "13.15",
        image: "👕",
        colors: ["black", "white", "grey", "navy", "red", "blue"],
        sizes: ["s", "m", "l", "xl", "xxl"],
        customization: ["embroidery", "print"],
        brand: "Gildan"
    },
    {
        code: "GD067-ZIP",
        name: "Heavy-Blend Full Zip Hoodie",
        price: "14.50",
        image: "👕",
        colors: ["black", "grey", "navy", "blue"],
        sizes: ["s", "m", "l", "xl"],
        customization: ["embroidery", "print"],
        brand: "Gildan"
    },
    {
        code: "GD067-PREMIUM",
        name: "Premium Fleece Hoodie",
        price: "16.99",
        image: "👕",
        colors: ["black", "white", "grey", "navy", "burgundy"],
        sizes: ["xs", "s", "m", "l", "xl", "xxl"],
        customization: ["embroidery", "print"],
        brand: "Gildan"
    },
    {
        code: "GD067-KIDS",
        name: "Kids Hoodie",
        price: "9.99",
        image: "👕",
        colors: ["black", "red", "blue", "green"],
        sizes: ["4-6", "6-8", "8-10", "10-12"],
        customization: ["print"],
        brand: "Gildan"
    }
];

// ===== STATE =====
let filteredProducts = [...PRODUCTS_DB];
let quoteBasket = JSON.parse(localStorage.getItem('quoteBasket')) || [];
const colorMap = {
    black: "#1a1a1a",
    white: "#ffffff",
    grey: "#808080",
    navy: "#000080",
    red: "#ff0000",
    blue: "#0000ff",
    green: "#008000",
    burgundy: "#800020"
};

// ===== RENDER PRODUCTS =====
function renderProducts() {
    const grid = document.getElementById('productsGrid');
    grid.innerHTML = '';

    if (filteredProducts.length === 0) {
        grid.innerHTML = '<p style="grid-column: 1/-1; text-align: center; padding: 40px; color: #999;">No products found</p>';
        document.getElementById('resultCount').textContent = '0 products found';
        return;
    }

    document.getElementById('resultCount').textContent = `${filteredProducts.length} products found`;

    filteredProducts.forEach(product => {
        const card = document.createElement('div');
        card.className = 'product-card';

        const badges = product.customization.map(c =>
            `<span class="badge ${c}">${c.toUpperCase()}</span>`
        ).join('');

        const colors = product.colors.map(c =>
            `<button type="button" class="color-dot" data-color="${c}" style="background-color: ${colorMap[c] || '#999'}" title="${c}"></button>`
        ).join('');

        card.innerHTML = `
            <div class="product-media">
                <div class="product-badges">${badges}</div>
                <div class="product-figure" style="background:${colorMap[product.colors[0]] || '#f4f4f4'}">
                    <span class="product-emoji">${product.image}</span>
                </div>
            </div>
            <div class="product-info">
                <div class="product-code">${product.code}</div>
                <div class="product-name">${product.name}</div>
                <div class="product-price">£${product.price}</div>
                <div class="product-colors">${colors}</div>
                <div class="product-actions">
                    <button class="btn-secondary" onclick="goToProduct('${product.code}')">View Product</button>
                    <button class="btn-primary" onclick="goToProduct('${product.code}')">Add Logo</button>
                </div>
            </div>
        `;

        // Change swatch preview background without losing navigation wiring
        card.querySelectorAll('.color-dot').forEach(dot => {
            dot.addEventListener('click', (event) => {
                event.stopPropagation();
                const bg = colorMap[dot.dataset.color] || '#f4f4f4';
                card.querySelector('.product-figure').style.background = bg;
                card.querySelectorAll('.color-dot').forEach(d => d.classList.remove('active'));
                dot.classList.add('active');
            });
        });

        // Prevent double navigation when clicking CTA buttons
        card.querySelectorAll('.product-actions button').forEach(btn => {
            btn.addEventListener('click', (event) => {
                event.stopPropagation();
            });
        });

        // Route the entire card to product page
        card.addEventListener('click', () => goToProduct(product.code));

        grid.appendChild(card);
    });
}

// ===== NAVIGATION =====
function goToProduct(code) {
    const product = PRODUCTS_DB.find(p => p.code === code);
    if (product) {
        sessionStorage.setItem('selectedProduct', code);
        sessionStorage.setItem('selectedProductData', JSON.stringify(product));
    }
    window.location.href = 'product-detail.html';
}

// ===== SEARCH & FILTER =====
function applyFilters() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    const priceMax = parseInt(document.querySelector('.price-range').value);

    const colorChecked = Array.from(document.querySelectorAll('.color-filters input:checked'))
        .map(el => el.value);
    const sizeChecked = Array.from(document.querySelectorAll('.size-filters input:checked'))
        .map(el => el.value);
    const customChecked = Array.from(document.querySelectorAll('.filter-group:nth-child(3) input:checked'))
        .map(el => el.value);

    filteredProducts = PRODUCTS_DB.filter(p => {
        // Search
        if (searchTerm && !p.name.toLowerCase().includes(searchTerm) && !p.code.toLowerCase().includes(searchTerm)) {
            return false;
        }

        // Price
        if (parseFloat(p.price) > priceMax) return false;

        // Color
        if (colorChecked.length > 0 && !colorChecked.some(c => p.colors.includes(c))) {
            return false;
        }

        // Size
        if (sizeChecked.length > 0 && !sizeChecked.some(s => p.sizes.includes(s))) {
            return false;
        }

        // Customization
        if (customChecked.length > 0 && !customChecked.some(c => p.customization.includes(c))) {
            return false;
        }

        return true;
    });

    renderProducts();
}

// ===== INIT =====
document.addEventListener('DOMContentLoaded', () => {
    // Get search term from URL
    const params = new URLSearchParams(window.location.search);
    const search = params.get('q') || '';
    if (search) {
        document.getElementById('searchInput').value = search;
        document.getElementById('resultsTitle').textContent = `Results for "${search}"`;
    }

    renderProducts();
    updateBasketCount();

    // Search input
    document.getElementById('searchInput').addEventListener('input', applyFilters);

    // Filter checkboxes
    document.querySelectorAll('.filter-group input[type="checkbox"]').forEach(el => {
        el.addEventListener('change', applyFilters);
    });

    // Price range
    document.querySelector('.price-range').addEventListener('input', (e) => {
        document.querySelector('.price-display').textContent = `£0 - £${e.target.value}`;
        applyFilters();
    });

    // Reset button
    document.querySelector('.btn-reset').addEventListener('click', () => {
        document.querySelectorAll('input[type="checkbox"]').forEach(el => el.checked = false);
        document.querySelector('.price-range').value = 100;
        document.querySelector('.price-display').textContent = '£0 - £100';
        document.getElementById('searchInput').value = '';
        applyFilters();
    });

    // Apply initial filters
    applyFilters();
});

// ===== BASKET =====
function updateBasketCount() {
    document.querySelectorAll('.basket-count').forEach(el => {
        el.textContent = quoteBasket.length;
    });
}
