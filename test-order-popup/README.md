# Order Popup Integration Guide

## Overview
This is a **PC-only** popup order system with horizontal sliding pages using easeInOutBack animation.

## Files
- `order.html` - Main popup structure with 6 pages
- `order.css` - Styles for the popup pages
- `order-overlay.css` - Overlay/backdrop and responsive styles
- `order.js` - Core logic for page navigation and data handling
- `order-integration.js` - Integration script for home-pc.html

## Pages Structure
1. **Page 1**: Product Details (image, specs, brand, price)
2. **Page 2**: Choose Colour (colour swatches)
3. **Page 3**: Choose Sizes & Quantities (size grid with +/- controls)
4. **Page 4**: Logo Upload (optional upload + position selection)
5. **Page 5**: Customer Details (form for contact/delivery info)
6. **Page 6**: Confirmation (success message with order reference)

## Integration into home-pc.html

### Step 1: Add CSS Links (in `<head>`)
```html
<link rel="stylesheet" href="test-order-popup/order.css">
<link rel="stylesheet" href="test-order-popup/order-overlay.css">
```

### Step 2: Include Popup HTML (before closing `</body>`)
Copy the entire `#orderPopup` div from `order.html` and paste it just before the closing `</body>` tag in `home-pc.html`.

OR create a PHP include:
```php
<?php include 'test-order-popup/order-popup-content.php'; ?>
```

### Step 3: Add Scripts (before closing `</body>`)
```html
<!-- jQuery (if not already loaded) -->
<script src="https://cdnjs.cloudflare.com/ajax/libs/jquery/3.7.1/jquery.min.js"></script>

<!-- jQuery Easing for animation -->
<script src="https://cdnjs.cloudflare.com/ajax/libs/jquery-easing/1.4.1/jquery.easing.min.js"></script>

<!-- Order popup scripts -->
<script src="test-order-popup/order.js"></script>
<script src="test-order-popup/order-integration.js"></script>
```

### Step 4: Update Product Links
The integration script automatically intercepts clicks on links like:
```html
<a href="product-detail.html?code=GD002">Product Name</a>
```

When clicked, it will:
1. Prevent default navigation
2. Extract product code from URL
3. Fetch product data from API
4. Open popup with product loaded
5. Show first page (Product Details)

### Step 5: API Integration
The popup expects product data from:
```
https://api.brandeduk.com/api/products
```

Product object should have:
```javascript
{
  code: "GD002",
  name: "Ultra Cotton adult t-shirt",
  brand: "GILDAN",
  price: 5.90,
  fabric: "100% Cotton",
  sizes: ["S", "M", "L", "XL", "2XL"],
  colours: [
    {name: "Black", hex: "#000000"},
    {name: "White", hex: "#FFFFFF"}
  ],
  image: "path/to/image.jpg"
}
```

## Functions Available

### Open Popup
```javascript
openOrderPopup('GD002'); // Product code
```

### Close Popup
```javascript
closeOrderPopup();
```

Also closes on:
- Clicking X button
- Pressing ESC key
- Clicking outside popup (optional, can be enabled)

## Customization

### Change Animation Duration
In `order.js`, find:
```javascript
duration: 700,
easing: "easeInOutBack"
```

### Change Colors
Main brand color: `#273469` (dark blue)
Edit in `order.css` to match your brand.

### Add More Pages
1. Add new `<section class="page">` in HTML
2. Update `total` calculation in JS
3. Update `goToPage()` calculation: `-(index * (100/totalPages)) + "%"`

## Testing

### Standalone Test
Open `order.html` directly in browser. It will:
- Show popup immediately (for testing)
- Load sample product data
- Allow full navigation through 6 pages

### Integration Test
1. Add to home-pc.html as described above
2. Click any product link
3. Popup should open with product data

## Notes

### Mobile/Tablet
⚠️ **IMPORTANT**: This popup is **PC-ONLY**. Mobile/tablet users should continue using the existing navigation to separate pages (product.html, customize.html, basket.html, checkout.html).

Do NOT modify:
- `basket.html`
- `checkout.html`
- `mobile/*` folder

### Breakpoints
The popup has basic responsive styles for tablets in `order-overlay.css`, but the primary experience is designed for desktop (1024px+).

### LocalStorage Integration
The popup can integrate with existing basket system:
```javascript
localStorage.setItem('quoteBasket', JSON.stringify(orderData));
```

### Form Validation
Basic validation is included:
- Page 2: Must select colour
- Page 3: Must select at least 1 size/quantity
- Page 5: Required fields (name, email, phone)

### Submit Endpoint
Update in `order.js`:
```javascript
fetch('/api/submit-quote', {
  method: 'POST',
  body: JSON.stringify(orderData)
})
```

## Browser Support
- Chrome/Edge: ✅
- Firefox: ✅
- Safari: ✅
- IE11: ❌ (uses modern JS, CSS Grid)

## Performance
- Lazy load product images
- Consider pagination for large colour/size lists
- Debounce quantity changes to avoid excessive re-renders
