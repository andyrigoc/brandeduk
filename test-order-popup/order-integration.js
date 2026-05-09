// order-integration.js
// To integrate order popup into home-pc.html

(function() {
    'use strict';
    
    // Check if popup HTML is already in DOM
    if (!document.getElementById('orderPopup')) {
        // You need to load order.html content here or include it directly in home-pc.html
        console.error("Order popup HTML not found. Include order.html content in your page.");
    }
    
    // Open popup function
    window.openOrderPopup = function(productCode, productData = null) {
        // Show popup immediately
        $('#orderPopup').fadeIn(300);
        $('body').css('overflow', 'hidden').addClass('popup-open');
        
        // Reset to first page
        if (typeof window.goToPage === 'function') {
            window.goToPage(0);
        }
        
        // If product data is already provided, use it directly (more efficient)
        if (productData) {
            console.log('Using provided product data:', productData);
            window.currentOrderProduct = productData;
            loadProductIntoPopup(productData);
            return;
        }
        
        // Otherwise, try to fetch product data from API
        fetch('https://api.brandeduk.com/api/products')
            .then(res => res.json())
            .then(data => {
                const product = data.find(p => p.code === productCode);
                if (product) {
                    window.currentOrderProduct = product;
                    loadProductIntoPopup(product);
                } else {
                    // Product not found, use fallback
                    loadFallbackProduct(productCode);
                }
            })
            .catch(err => {
                console.warn('API not available, using fallback data:', err);
                // Use fallback data when API is not available
                loadFallbackProduct(productCode);
            });
    };
    
    // Fallback product data
    function loadFallbackProduct(productCode) {
        const fallbackProducts = {
            'GD002': {
                code: 'GD002',
                name: 'Ultra Cotton adult t-shirt',
                brand: 'GILDAN',
                price: 5.90,
                description: 'Classic heavyweight t-shirt made from premium US cotton. Perfect for printing and embroidery. Durable, comfortable, and ideal for workwear.',
                fabric: '100% US Cotton. Ash: 99% US Cotton, 1% Polyester',
                sizes: ["S", "M", "L", "XL", "2XL", "3XL", "4XL", "5XL"],
                colours: [
                    {name: "Ash", hex: "#E5E5E5"},
                    {name: "Black", hex: "#000000"},
                    {name: "Navy", hex: "#001F3F"},
                    {name: "Royal", hex: "#0074D9"},
                    {name: "Red", hex: "#FF4136"},
                    {name: "White", hex: "#FFFFFF"},
                    {name: "Charcoal", hex: "#555555"},
                    {name: "Sport Grey", hex: "#AAAAAA"}
                ],
                image: "https://i.postimg.cc/Y4JNXxv1/GD067-Charcoal-FT.jpg"
            },
            'GD018': {
                code: 'GD018',
                name: 'Heavy Blend™ adult hooded sweatshirt',
                brand: 'GILDAN',
                price: 12.50,
                description: 'Warm and comfortable hooded sweatshirt with kangaroo pocket. Perfect for branded workwear and corporate uniforms.',
                fabric: '50% Cotton, 50% Polyester',
                sizes: ["S", "M", "L", "XL", "2XL", "3XL"],
                colours: [
                    {name: "Black", hex: "#000000"},
                    {name: "Navy", hex: "#001F3F"},
                    {name: "Royal", hex: "#0074D9"},
                    {name: "Red", hex: "#FF4136"}
                ],
                image: "https://i.postimg.cc/4Krv81Yv/GD067-Cobalt-FT.jpg"
            },
            'GD040': {
                code: 'GD040',
                name: 'DryBlend® adult double piqué polo',
                brand: 'GILDAN',
                price: 8.90,
                description: 'Professional polo shirt with moisture-wicking DryBlend® technology. Ideal for corporate wear and hospitality uniforms.',
                fabric: '50% Cotton, 50% Polyester',
                sizes: ["S", "M", "L", "XL", "2XL", "3XL"],
                colours: [
                    {name: "Black", hex: "#000000"},
                    {name: "Navy", hex: "#001F3F"},
                    {name: "White", hex: "#FFFFFF"}
                ],
                image: "https://i.postimg.cc/06LGtCzn/GD067-Cocoa-FT.jpg"
            },
            'GD030': {
                code: 'GD030',
                name: 'Softstyle® adult t-shirt',
                brand: 'GILDAN',
                price: 4.50,
                description: 'Lightweight and soft ring-spun cotton t-shirt. Perfect for events, promotional wear, and everyday comfort.',
                fabric: '100% Ring Spun Cotton',
                sizes: ["S", "M", "L", "XL", "2XL"],
                colours: [
                    {name: "Black", hex: "#000000"},
                    {name: "White", hex: "#FFFFFF"},
                    {name: "Navy", hex: "#001F3F"}
                ],
                image: "https://i.postimg.cc/hJH8C0X2/GD067-Daisy-FT.jpg"
            }
        };
        
        const product = fallbackProducts[productCode] || fallbackProducts['GD002'];
        window.currentOrderProduct = product;
        loadProductIntoPopup(product);
    }
    
    // Close popup
    window.closeOrderPopup = function() {
        $('#orderPopup').fadeOut(300);
        $('body').css('overflow', 'auto').removeClass('popup-open');
    };
    
    // Load product data into popup
    function loadProductIntoPopup(product) {
        console.log('Loading product into popup:', product);
        
        // Set global product data
        if (typeof window.setProductData === 'function') {
            window.setProductData(product);
        }
        
        $("#productTitle").text(product.name);
        $("#productCode").text(product.code);
        $("#productName").text(product.name);
        $("#productBrand").text(product.brand || "Unknown Brand");
        
        // Calculate price (use basePrice first, then price)
        const basePrice = parseFloat(product.basePrice) || parseFloat(product.price) || 5.90;
        $("#productPrice").text("£" + basePrice.toFixed(2));
        
        // Set fabric (if available from API)
        $("#productFabric").text(product.fabric || product.composition || "Cotton blend");
        
        // Set size label (check if available in product or colors)
        let sizeLabel = "One size";
        if (product.sizes && Array.isArray(product.sizes) && product.sizes.length > 0) {
            sizeLabel = product.sizes.join(", ");
        } else if (product.colors && product.colors.length > 0 && product.colors[0].sizes) {
            sizeLabel = product.colors[0].sizes.join(", ");
        }
        $("#productSizeLabel").text(sizeLabel);
        
        // Set KEY INFO (use description or generic text)
        const keyInfo = product.description || product.features || 
            "Double layer knit. Cuffed design for optimal decoration. Also available in junior sizes.";
        $("#productKeyInfo").text(keyInfo);
        
        // Calculate and display price tiers (discounts at 10, 25, 50, 100, 250)
        const tier1 = basePrice;
        const tier10 = tier1 * 0.90;  // -10%
        const tier25 = tier1 * 0.87;  // -13%
        const tier50 = tier1 * 0.85;  // -15%
        const tier100 = tier1 * 0.82; // -18%
        const tier250 = tier1 * 0.81; // -19%
        
        $("#tier1Price").text("£" + tier1.toFixed(2));
        $("#tier10Price").text("£" + tier10.toFixed(2));
        $("#tier25Price").text("£" + tier25.toFixed(2));
        $("#tier50Price").text("£" + tier50.toFixed(2));
        $("#tier100Price").text("£" + tier100.toFixed(2));
        $("#tier250Price").text("£" + tier250.toFixed(2));
        
        // Set description (if available)
        if (product.description) {
            $("#productDescription").text(product.description);
        } else {
            $("#productDescription").text(product.name + " - Product details coming soon.");
        }
        
        // Set main image (use product.image which is the lifestyle/model image)
        if (product.image) {
            $("#productMainImage").attr("src", product.image);
        } else if (product.mainImage) {
            $("#productMainImage").attr("src", product.mainImage);
        } else {
            $("#productMainImage").attr("src", "https://via.placeholder.com/500x500?text=No+Image");
        }
        
        // Load colours using product data (API uses 'colors' not 'colours')
        loadProductColours(product);
        
        // Setup sizes using product data
        setupProductSizes(product);
        
        // Setup upload box
        if (typeof window.setupUploadBox === 'function') {
            window.setupUploadBox();
        }
    }
    
    // Load colours for product
    function loadProductColours(product) {
        const colourGrid = $("#colourSwatches");
        colourGrid.empty();
        
        // API uses 'colors' not 'colours'
        const colors = product.colors || product.colours || [];
        
        if (colors.length > 0) {
            console.log('Loading', colors.length, 'colors for product');
            
            // Update color count
            $("#productColourCount").text(colors.length + " colours");
            
            colors.forEach(function(colour) {
                // Use the color variant image as background
                const imgUrl = colour.main || colour.image || product.image;
                const colorName = colour.name || 'Unknown';
                
                const swatch = $(`
                    <div class="colour-swatch" 
                         data-colour="${colorName}" 
                         style="background-image: url('${imgUrl}'); background-size: cover; background-position: center;"
                         title="${colorName}">
                    </div>
                `);
                
                swatch.click(function() {
                    $(".colour-swatch").removeClass("selected");
                    $(this).addClass("selected");
                    window.selectedColour = colorName;
                    
                    // Update main image to selected color
                    $("#productMainImage").attr("src", imgUrl);
                });
                
                colourGrid.append(swatch);
            });
        } else {
            // Default colours
            const defaultColours = [
                {name: "Black", hex: "#000000"},
                {name: "White", hex: "#FFFFFF"},
                {name: "Navy", hex: "#001F3F"},
                {name: "Red", hex: "#FF4136"}
            ];
            
            defaultColours.forEach(function(colour) {
                const swatch = $(`
                    <div class="colour-swatch" 
                         data-colour="${colour.name}" 
                         style="background-color: ${colour.hex}; ${colour.hex === '#FFFFFF' ? 'border: 3px solid #e5e7eb;' : ''}"
                         title="${colour.name}">
                    </div>
                `);
                
                swatch.click(function() {
                    $(".colour-swatch").removeClass("selected");
                    $(this).addClass("selected");
                    window.selectedColour = colour.name;
                });
                
                colourGrid.append(swatch);
            });
        }
    }
    
    // Setup product sizes
    function setupProductSizes(product) {
        const grid = $("#sizeQuantityGrid");
        grid.empty();
        
        const sizes = product.sizes || ["S", "M", "L", "XL", "2XL", "3XL"];
        window.quantities = {};
        
        sizes.forEach(function(size) {
            window.quantities[size] = 0;
            
            const box = $(`
                <div class="size-box">
                    <div class="size-label">${size}</div>
                    <div class="qty-controls">
                        <button class="qty-btn qty-minus" data-size="${size}">−</button>
                        <span class="qty-value" data-size="${size}">0</span>
                        <button class="qty-btn qty-plus" data-size="${size}">+</button>
                    </div>
                </div>
            `);
            
            grid.append(box);
        });
    }
    
    // Helper: Get colour hex from name
    function getColourHex(colourName) {
        const colourMap = {
            'black': '#000000',
            'white': '#FFFFFF',
            'navy': '#001F3F',
            'royal': '#0074D9',
            'red': '#FF4136',
            'ash': '#E5E5E5',
            'charcoal': '#555555',
            'grey': '#AAAAAA',
            'blue': '#0074D9',
            'green': '#2ECC40',
            'yellow': '#FFDC00'
        };
        
        const normalized = colourName.toLowerCase().replace(/\s/g, '');
        return colourMap[normalized] || '#CCCCCC';
    }
    
    // Intercept product links
    $(document).on('click', 'a[href*="product-detail.html"]', function(e) {
        e.preventDefault();
        const href = $(this).attr('href');
        const params = new URLSearchParams(href.split('?')[1]);
        const productCode = params.get('code');
        
        if (productCode) {
            openOrderPopup(productCode);
        }
    });
    
    // ESC key to close
    $(document).on('keydown', function(e) {
        if (e.key === 'Escape' && $('#orderPopup').is(':visible')) {
            closeOrderPopup();
        }
    });
    
})();
