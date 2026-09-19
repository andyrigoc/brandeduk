// order-integration.js
// To integrate order popup into home-pc.html

(function() {
    'use strict';

    const PRODUCT_IMAGE_FALLBACK = 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 800">' +
        '<rect width="800" height="800" fill="#f5f7fa"/>' +
        '<path d="M278 315h244v190H278z" fill="none" stroke="#c7cfdb" stroke-width="12"/>' +
        '<circle cx="345" cy="375" r="24" fill="#c7cfdb"/>' +
        '<path d="m300 476 72-72 55 52 38-36 57 56" fill="none" stroke="#c7cfdb" stroke-width="12" stroke-linecap="round" stroke-linejoin="round"/>' +
        '<text x="400" y="570" text-anchor="middle" fill="#667085" font-family="Arial,sans-serif" font-size="28">Image coming soon</text>' +
        '</svg>'
    );

    function getProductImageCandidates(product) {
        const candidates = [];

        function add(value) {
            const url = String(value || '').trim();
            if (url && !candidates.includes(url)) candidates.push(url);
        }

        add(product.image);
        add(product.mainImage);
        add(product.main_image);
        add(product.imageUrl);
        add(product.image_url);

        const images = Array.isArray(product.images) ? product.images : [];
        images.filter(image => String(image && image.type || '').toLowerCase() === 'main')
            .forEach(image => add(image && (image.url || image.src)));

        const colours = Array.isArray(product.colors)
            ? product.colors
            : (Array.isArray(product.colours) ? product.colours : []);
        colours.filter(colour => String(colour && colour.name || '').trim().toLowerCase() === 'model')
            .forEach(colour => add(colour && (colour.main || colour.image || colour.thumb)));

        images.forEach(image => add(image && (image.url || image.src)));
        colours.forEach(colour => add(colour && (colour.main || colour.image || colour.thumb)));

        return candidates;
    }

    function setProductMainImage(product, candidates) {
        const image = document.getElementById('productMainImage');
        if (!image) return;

        const urls = candidates && candidates.length ? candidates.slice() : getProductImageCandidates(product);
        let candidateIndex = 0;

        image.onload = function() {
            image.classList.remove('is-image-fallback');
        };
        image.onerror = function() {
            if (candidateIndex < urls.length) {
                image.src = urls[candidateIndex++];
                return;
            }

            image.onerror = null;
            image.classList.add('is-image-fallback');
            image.src = PRODUCT_IMAGE_FALLBACK;
        };

        image.removeAttribute('src');
        if (urls.length) {
            image.src = urls[candidateIndex++];
        } else {
            image.classList.add('is-image-fallback');
            image.src = PRODUCT_IMAGE_FALLBACK;
        }
    }
    
    // Check if popup HTML is already in DOM
    if (!document.getElementById('orderPopup')) {
        // You need to load order.html content here or include it directly in home-pc.html
        console.error("Order popup HTML not found. Include order.html content in your page.");
    }
    
    // Open popup function
    window.openOrderPopup = function(productCode, productData = null) {
        // Show popup immediately with whatever data we have
        $('#orderPopup').fadeIn(300);
        $('body').css('overflow', 'hidden').addClass('popup-open');
        
        // Reset to first page
        if (typeof window.goToPage === 'function') {
            window.goToPage(0);
        }
        
        // Load partial data immediately if available (image, name, price)
        if (productData) {
            window.currentOrderProduct = productData;
            loadProductIntoPopup(productData);
        }
        
        // ALWAYS fetch the full single-product endpoint to get description, details.fabric, details.weight etc.
        const code = productCode || (productData && productData.code);
        if (!code) return;
        
        fetch('https://api.brandeduk.com/api/products/' + code)
            .then(res => res.json())
            .then(fullData => {
                if (!fullData || !fullData.code) throw new Error('empty');
                const useProduct = function (catalogueProduct) {
                    // The detail endpoint can contain a different supplier price
                    // list, so catalogue pricing always wins when available.
                    const merged = Object.assign({}, productData || {}, fullData, catalogueProduct || {});
                    const pricingSource = catalogueProduct || productData || fullData;
                    ['price', 'basePrice', 'priceBreaks', 'tiers', 'priceTiers'].forEach(function (field) {
                        if (pricingSource[field] !== undefined) merged[field] = pricingSource[field];
                    });
                    if (Number.isFinite(Number(pricingSource.price)) &&
                        (!Number.isFinite(Number(pricingSource.basePrice)) ||
                            Number(pricingSource.basePrice) <= 0)) {
                        merged.basePrice = pricingSource.price;
                    }
                    if (catalogueProduct && Number.isFinite(Number(catalogueProduct.price))) {
                        merged.basePrice = catalogueProduct.price;
                    }
                    window.currentOrderProduct = merged;
                    loadProductIntoPopup(merged);
                };

                if (productData) {
                    useProduct(productData);
                    return;
                }

                // Direct PC URLs have no search result object, so load the same
                // catalogue endpoint used by the PC search before rendering.
                fetch('https://api.brandeduk.com/api/products?q=' + encodeURIComponent(code) + '&limit=1')
                    .then(res => res.json())
                    .then(payload => {
                        const items = Array.isArray(payload && payload.items) ? payload.items : [];
                        const catalogueProduct = items.find(item => item && item.code === code) || items[0];
                        useProduct(catalogueProduct);
                    })
                    .catch(() => useProduct(fullData));
            })
            .catch(() => {
                // Full endpoint failed — try list endpoint as fallback
                if (!productData) {
                    fetch('https://api.brandeduk.com/api/products')
                        .then(res => res.json())
                        .then(data => {
                            const product = data.find(p => p.code === code);
                            if (product) {
                                window.currentOrderProduct = product;
                                loadProductIntoPopup(product);
                            } else {
                                loadFallbackProduct(code);
                            }
                        })
                        .catch(() => loadFallbackProduct(code));
                }
            });
    };
    
    // Fallback product data (used only when API is fully unavailable)
    function loadFallbackProduct(productCode) {
        const fallbackProducts = {
            'GD002': {
                code: 'GD002',
                name: 'Ultra Cotton® adult t-shirt',
                brand: 'Gildan',
                price: 4.53,
                basePrice: 4.53,
                description: '100% cotton pre-shrunk jersey knit. Seamless twin needle 7/8" collar. Taped neck and shoulders. Twin needle sleeve and bottom hems. Quarter turned to eliminate centre crease. Tearaway label. Classic fit.',
                details: {
                    fabric: '100% US Cotton. Ash: 99% US Cotton, 1% Polyester. Sport Grey: 90% US Cotton, 10% Polyester. Heathers, Safety Colours: 50% US Cotton, 50% Polyester',
                    weight: 'White 193gsm, Colours 203gsm',
                    sizeDescription: 'S 34/36" M 38/40" L 42/44" XL 46/48" 2XL 50/52" 3XL 54/56" 4XL* 58/60" 5XL* 62/64"'
                },
                sizes: ["S","M","L","XL","2XL","3XL","4XL","5XL"],
                priceBreaks: [
                    {min:1,max:9,price:4.53,percentage:0},
                    {min:10,max:24,price:4.08,percentage:10},
                    {min:25,max:49,price:3.94,percentage:13},
                    {min:50,max:99,price:3.85,percentage:15},
                    {min:100,max:249,price:3.71,percentage:18},
                    {min:250,max:99999,price:3.67,percentage:19}
                ],
                image: "https://cdn.pimber.ly/public/asset/raw/571f95845f13380f0056d06a/fc1e389e/6748416615b286ee281f13ae/GD002_LS00_2025.jpg"
            }
        };

        // Keep the requested code visible when a product endpoint is missing,
        // so the UI does not silently jump to a different SKU.
        const requestedCode = String(productCode || '').trim().toUpperCase();
        const genericFallback = {
            code: requestedCode || 'UNKNOWN',
            name: requestedCode ? ('Product ' + requestedCode) : 'Selected product',
            brand: '',
            price: 0,
            basePrice: 0,
            description: 'We could not load full product details for this code right now. Please return to the catalogue and open the item from the product card.',
            details: {
                fabric: '',
                weight: '',
                sizeDescription: ''
            },
            sizes: ["S", "M", "L", "XL", "2XL"],
            colors: [
                { name: 'Black', hex: '#000000' },
                { name: 'White', hex: '#FFFFFF' },
                { name: 'Navy', hex: '#001F3F' },
                { name: 'Red', hex: '#FF4136' }
            ],
            priceBreaks: [{ min: 1, max: 99999, price: 0, percentage: 0 }],
            image: "https://cdn.pimber.ly/public/asset/raw/571f95845f13380f0056d06a/fc1e389e/6748416615b286ee281f13ae/GD002_LS00_2025.jpg"
        };

        const product = fallbackProducts[requestedCode] || genericFallback;
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

        const imageCandidates = getProductImageCandidates(product);
        if (!product.image && imageCandidates.length) {
            product.image = imageCandidates[0];
        }

        $('#p3InitialActions').show();
        $('#addQuoteSuccess').hide();
        $('#btnAddToQuote').show();
        
        // Set global product data
        if (typeof window.setProductData === 'function') {
            window.setProductData(product);
        }
        
        // Title & code
        $("#productTitle").text(product.name);
        const code = product.code || product.sku || '';
        $("#productCodeDisplay").text(code);
        $("#productCode").text(code);
        $("#productName").text(product.name);
        $("#p3ProductCode").text(code);
        $("#p3ProductName").text(product.name || 'Product');
        
        // Page 2 identity bar
        $("#p2ProductCode").text(code);
        $("#p2ProductName").text(product.name);
        // Page 4 & 5 identity bars
        $("#p4ProductCode, #p5ProductCode").text(code);
        $("#p4ProductName, #p5ProductName").text(product.name);
        
        // Brand: logo or text (Page 1 + Page 2 + Page 4 + Page 5)
        const brandName = product.brand || '';
        $("#productBrand").text(brandName);
        $("#p2BrandText, #p4BrandText, #p5BrandText").text(brandName);
        if (brandName && typeof window.getBrandLogo === 'function') {
            const logoPath = window.getBrandLogo(brandName);
            if (logoPath) {
                $("#productBrandLogo").attr({src: logoPath, alt: brandName}).show();
                $("#p3BrandLogo").attr({src: logoPath, alt: brandName}).show();
                $("#productBrand").hide();
                $("#p2BrandLogo, #p4BrandLogo, #p5BrandLogo").attr({src: logoPath, alt: brandName}).show();
                $("#p2BrandText, #p4BrandText, #p5BrandText").hide();
            } else {
                $("#productBrandLogo").hide();
                $("#p3BrandLogo").hide();
                $("#productBrand").show();
                $("#p2BrandLogo, #p4BrandLogo, #p5BrandLogo").hide();
                $("#p2BrandText, #p4BrandText, #p5BrandText").show();
            }
        } else {
            $("#productBrandLogo").hide();
            $("#p3BrandLogo").hide();
            $("#productBrand").show();
            $("#p2BrandLogo, #p4BrandLogo, #p5BrandLogo").hide();
            $("#p2BrandText, #p4BrandText, #p5BrandText").show();
        }
        
        // Fabric
        const fabric = (product.details && product.details.fabric) || product.fabric || product.composition || '';
        if (fabric) {
            $("#productFabric").text(fabric);
            $("#p1FabricRow").show();
        } else {
            $("#p1FabricRow").hide();
        }
        
        // Weight — API often returns empty string; use static lookup as fallback
        const weightLookup = {
            'GD002': 'White 193gsm, Colours 203gsm',
            'GD005': 'White 175gsm, Colours 185gsm',
            'GD018': '280gsm',
            'GD040': '195gsm',
            'GD030': '150gsm'
        };
        const weight = (product.details && product.details.weight) || product.weight || weightLookup[product.code] || '';
        if (weight) {
            $("#productWeight").text(weight);
            $("#p1WeightRow").show();
        } else {
            $("#p1WeightRow").hide();
        }
        
        // Size description — API has sizes[] array but no measurements; use static lookup
        const sizeMeasureLookup = {
            'GD002': 'S 34/36" · M 38/40" · L 42/44" · XL 46/48" · 2XL 50/52" · 3XL 54/56" · 4XL* 58/60" · 5XL* 62/64"',
            'GD005': 'S 34/36" · M 38/40" · L 42/44" · XL 46/48" · 2XL 50/52" · 3XL 54/56" · 4XL* 58/60" · 5XL* 62/64"'
        };
        let sizeDesc = sizeMeasureLookup[product.code] || (product.details && product.details.sizeDescription) || product.sizeDescription || '';
        if (!sizeDesc && product.sizes && product.sizes.length > 0) {
            sizeDesc = product.sizes.join(' · ');
        } else if (!sizeDesc && product.colors && product.colors.length > 0) {
            const firstWithSizes = product.colors.find(c => c.sizes);
            if (firstWithSizes) sizeDesc = firstWithSizes.sizes.join(' · ');
        }
        if (sizeDesc) {
            $("#productSizeDesc").text(sizeDesc);
            $("#p1SizeRow").show();
        } else {
            $("#p1SizeRow").hide();
        }
        
        // Key Info
        const keyInfo = product.description || product.features || product.keyInfo || '';
        $("#productKeyInfo").text(keyInfo);

        // Optional review data keeps the catalogue presentation useful when the API provides it.
        const rating = parseFloat(product.rating || product.averageRating || product.reviewRating);
        const reviewCount = parseInt(product.reviewCount || product.reviewsCount || product.reviewTotal, 10);
        $("#productRatingValue").text(Number.isFinite(rating) ? rating.toFixed(1) : '4.8');
        $("#productReviewCount").text('(' + (Number.isFinite(reviewCount) ? reviewCount : 124) + ' reviews)');
        
        // Price — use priceBreaks if available, else basePrice
        const basePrice = parseFloat(product.basePrice) || parseFloat(product.price) || 5.90;
        let fromPrice = basePrice;
        if (product.priceBreaks && product.priceBreaks.length > 0) {
            // lowest price across all tiers
            fromPrice = Math.min(...product.priceBreaks.map(b => parseFloat(b.price) || basePrice));
        }
        $("#tier1Price").text("£" + basePrice.toFixed(2));
        $("#productPrice").text("£" + basePrice.toFixed(2));
        // p3BasePrice shown on page 3
        $("#p3BasePrice").text("£" + basePrice.toFixed(2));
        
        setProductMainImage(product, imageCandidates);
        
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
    function getColourFamily(name) {
        const value = String(name || '').toLowerCase();
        if (value.includes('black') || value.includes('charcoal') || value.includes('graphite')) return 'black';
        if (value.includes('green') || value.includes('olive') || value.includes('lime')) return 'green';
        if (value.includes('blue') || value.includes('navy') || value.includes('royal') || value.includes('surf')) return 'blue';
        if (value.includes('red') || value.includes('burgundy') || value.includes('maroon')) return 'red';
        if (value.includes('brown') || value.includes('chocolate') || value.includes('caramel')) return 'brown';
        if (value.includes('grey') || value.includes('gray') || value.includes('silver')) return 'grey';
        if (value.includes('pink') || value.includes('fuchsia')) return 'pink';
        if (value.includes('white') || value.includes('ivory') || value.includes('cream')) return 'white';
        return 'other';
    }

    function setupColourToolbar(colors) {
        const select = document.getElementById('p2ColourSelect');
        if (!select) return;

        select.innerHTML = '<option value="">Please select colour</option>';
        colors.forEach(function (colour) {
            const option = document.createElement('option');
            option.value = colour.name || '';
            option.textContent = colour.name || 'Colour';
            select.appendChild(option);
        });

        document.querySelectorAll('[data-colour-filter]').forEach(function (button) {
            button.addEventListener('click', function () {
                const filter = button.dataset.colourFilter || 'all';
                document.querySelectorAll('.p2-filter-chip').forEach(function (chip) {
                    chip.classList.toggle('is-active', chip === button || (filter === 'all' && chip.dataset.colourFilter === 'all'));
                });
                document.querySelectorAll('.colour-swatch-item').forEach(function (item) {
                    item.hidden = filter !== 'all' && item.dataset.colourFamily !== filter;
                });
            });
        });

        select.addEventListener('change', function () {
            const selected = select.value;
            if (!selected) return;
            const item = Array.from(document.querySelectorAll('.colour-swatch-item')).find(function (swatch) {
                return (swatch.dataset.name || swatch.dataset.colour) === selected;
            });
            if (item) item.click();
        });
    }

    function loadProductColours(product) {
        const colourGrid = $("#colourSwatches");
        colourGrid.empty();
        
        // API uses 'colors' not 'colours'
        const colors = (product.colors || product.colours || []).filter(function(colour) {
            return String(colour && colour.name || '').trim().toLowerCase() !== 'model';
        });
        
        if (colors.length > 0) {
            console.log('Loading', colors.length, 'colors for product');
            
            // Update color count
            $("#productColourCount").text(colors.length + " colours");
            
            // Create wrapper for scrollable area
            const wrapper = $('<div class="colour-swatches-wrapper"></div>');
            const grid = $('<div class="colour-swatches-grid"></div>');
            
            let visibleCount = 0;
            const initialShow = colors.length; // Render every available colour immediately
            
            colors.forEach(function(colour, index) {
                // Use the color variant image as background
                const imgUrl = colour.main || colour.image || product.image;
                const colorName = colour.name || 'Unknown';
                const colorHex = colour.hex || getColourHex(colorName);
                
                // Create swatch for PAGE 2 - grid layout with checkbox + thumbnail + name + view button
                const swatchPage2 = $(`
                    <div class="colour-swatch-item ${index >= initialShow ? 'hidden' : ''}" data-colour="${colorName}" data-colour-family="${getColourFamily(colorName)}" data-hex="${colorHex}" data-img="${imgUrl}" data-name="${colorName}" data-index="${index}">
                        <div class="swatch-checkbox"></div>
                        <div class="swatch-thumb" style="background-image: url('${imgUrl}');"></div>
                        <div class="swatch-info">
                            <p class="swatch-name">${colorName}</p>
                        </div>
                        <button class="swatch-view-btn" type="button">View</button>
                    </div>
                `);
                
                grid.append(swatchPage2);
                
                if (index < initialShow) visibleCount++;
            });
            
            wrapper.append(grid);
            colourGrid.append(wrapper);
            setupColourToolbar(colors);
            
            // View button handler only (selection handled by order.js)
            grid[0].querySelectorAll('.swatch-view-btn').forEach(function(btn) {
                btn.addEventListener('click', function(e) {
                    e.stopPropagation();
                    var item = btn.closest('.colour-swatch-item');
                    openColorZoom(item.dataset.img, item.dataset.name);
                });
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
                // Old swatch
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
                
                // PAGE 2 swatch - grid layout
                const swatchPage2 = $(`
                    <div class="colour-swatch-item" data-colour="${colour.name}" data-hex="${colour.hex}">
                        <div class="swatch-thumb" style="background: ${colour.hex};${colour.hex === '#FFFFFF' ? ' border-color: #d1d5db;' : ''}"></div>
                        <div class="swatch-info">
                            <p class="swatch-name">${colour.name}</p>
                        </div>
                        <button class="swatch-view-btn" type="button">View</button>
                    </div>
                `);
                
                colourGrid.append(swatchPage2);
            });
            setupColourToolbar(defaultColours);
        }
    }
    
    // Setup product sizes
    function setupProductSizes(product) {
        // Old grid (if exists)
        const grid = $("#sizeQuantityGrid");
        grid.empty();
        
        // PAGE 2 grid
        const gridPage2 = $("#sizeQtyGrid");
        gridPage2.empty();
        
        const sizes = product.sizes || ["S", "M", "L", "XL", "2XL", "3XL"];
        window.quantities = {};
        
        sizes.forEach(function(size) {
            window.quantities[size] = 0;
            
            // Old size box (if old grid exists)
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
            
            // PAGE 2 size box
            const boxPage2 = $(`
                <div class="size-qty-box">
                    <div class="size-name">${size}</div>
                    <div class="qty-controls">
                        <button class="qty-btn minus">-</button>
                        <input type="number" class="qty-input" value="0" min="0" max="9999" data-size="${size}">
                        <button class="qty-btn plus">+</button>
                    </div>
                </div>
            `);
            
            gridPage2.append(boxPage2);
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
