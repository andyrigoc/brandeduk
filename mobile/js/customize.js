/**
 * BrandedUK Mobile - Customize Page JavaScript
 * TapStitch-inspired interactions
 */

(function() {
    'use strict';

    // === VAT Constants ===
    const VAT_STORAGE_KEY = 'brandeduk-vat-mode';
    const VAT_RATE = 0.20;

    // === Product Colors (default GD067 fallback) ===
    // Will be replaced at runtime if product API data is available
    let PRODUCT_COLORS = [
        { id: 'aquatic', name: 'Aquatic', hex: '#5BA4A4', image: 'https://i.postimg.cc/fbC2Zn4L/GD067-Aquatic-FT.jpg' },
        { id: 'ash-grey', name: 'Ash Grey', hex: '#B8B8B8', image: 'https://i.postimg.cc/fbC2Zn4t/GD067-Ash-Grey-FT.jpg' },
        { id: 'black', name: 'Black', hex: '#1a1a1a', image: 'https://i.postimg.cc/R0ds95rf/GD067-Black-FT.jpg' },
        { id: 'blue-dusk', name: 'Blue Dusk', hex: '#4A6FA5', image: 'https://i.postimg.cc/QMm4sGLJ/GD067-Blue-Dusk-FT.jpg' },
        { id: 'brown-savana', name: 'Brown Savana', hex: '#8B7355', image: 'https://i.postimg.cc/wvBWjfHL/GD067-Brown-Savana-FT.jpg' },
        { id: 'cardinal-red', name: 'Cardinal Red', hex: '#C41E3A', image: 'https://i.postimg.cc/SsKZxTqV/GD067-Cardinal-Red-FT.jpg' },
        { id: 'carolina-blue', name: 'Carolina Blue', hex: '#99BADD', image: 'https://i.postimg.cc/V6N7kG1D/GD067-Carolina-Blue-FT.jpg' },
        { id: 'cement', name: 'Cement', hex: '#9E9E9E', image: 'https://i.postimg.cc/fLbHR2Z2/GD067-Cement-FT.jpg' },
        { id: 'charcoal', name: 'Charcoal', hex: '#4a4a4a', image: 'https://i.postimg.cc/4d38xLZF/GD067-Charcoal-FT.jpg' },
        { id: 'cobalt', name: 'Cobalt', hex: '#0047AB', image: 'https://i.postimg.cc/sX2ng6yL/GD067-Cobalt-FT.jpg' },
        { id: 'cocoa', name: 'Cocoa', hex: '#5C4033', image: 'https://i.postimg.cc/d10WVHvb/GD067-Cocoa-FT.jpg' },
        { id: 'daisy', name: 'Daisy', hex: '#FFD700', image: 'https://i.postimg.cc/1tzW3Cs1/GD067-Daisy-FT.jpg' },
        { id: 'dark-heather', name: 'Dark Heather', hex: '#5a5a5a', image: 'https://i.postimg.cc/j5kMwHdk/GD067-Dark-Heather-FT.jpg' },
        { id: 'dusty-rose', name: 'Dusty Rose', hex: '#D4A5A5', image: 'https://i.postimg.cc/fLg8tcTP/GD067-Dusty-Rose-FT.jpg' },
        { id: 'forest-green', name: 'Forest Green', hex: '#228B22', image: 'https://i.postimg.cc/FRnTdys8/GD067-Forest-Green-FT.jpg' },
        { id: 'light-pink', name: 'Light Pink', hex: '#FFB6C1', image: 'https://i.postimg.cc/G2SX8FhW/GD067-Light-Pink-FT.jpg' },
        { id: 'maroon', name: 'Maroon', hex: '#800000', image: 'https://i.postimg.cc/zBPxbCG1/GD067-Maroon-FT.jpg' },
        { id: 'military-green', name: 'Military Green', hex: '#4B5320', image: 'https://i.postimg.cc/TwHtLV3f/GD067-Military-Green-FT.jpg' },
        { id: 'mustard', name: 'Mustard', hex: '#FFDB58', image: 'https://i.postimg.cc/MTr9M7pZ/GD067-Mustard-FT.jpg' },
        { id: 'navy', name: 'Navy', hex: '#1e3a5f', image: 'https://i.postimg.cc/MTr9M7pp/GD067-Navy-FT.jpg' },
        { id: 'off-white', name: 'Off-White', hex: '#FAF9F6', image: 'https://i.postimg.cc/nzw3j4hz/GD067-Off-White-FT.jpg' },
        { id: 'paragon', name: 'Paragon', hex: '#C0C0C0', image: 'https://i.postimg.cc/j5kMwHSL/GD067-Paragon-FT.jpg' },
        { id: 'pink-lemonade', name: 'Pink Lemonade', hex: '#F8B4D9', image: 'https://i.postimg.cc/zBPxbCGy/GD067-Pink-Lemonade-FT.jpg' },
        { id: 'pistachio', name: 'Pistachio', hex: '#93C572', image: 'https://i.postimg.cc/xCF6Jv1N/GD067-Pistachio-FT.jpg' },
        { id: 'purple', name: 'Purple', hex: '#7c3aed', image: 'https://i.postimg.cc/C5BmjRRx/GD067-Purple-FT.jpg' },
        { id: 'red', name: 'Red', hex: '#dc2626', image: 'https://i.postimg.cc/brD3QZZd/GD067-Red-FT.jpg' },
        { id: 'sport-grey', name: 'Sport Grey', hex: '#9ca3af', image: 'https://i.postimg.cc/zvb0nyyg/GD067-Ringspun-Sport-Grey-FT.jpg' },
        { id: 'royal', name: 'Royal', hex: '#2563eb', image: 'https://i.postimg.cc/VNmG3sVH/GD067-Royal-FT.jpg' },
        { id: 'sage', name: 'Sage', hex: '#9CAF88', image: 'https://i.postimg.cc/tgpSLRcy/GD067-Sage-FT.jpg' },
        { id: 'sand', name: 'Sand', hex: '#C2B280', image: 'https://i.postimg.cc/Bv4YdZz3/GD067-Sand-FT.jpg' },
        { id: 'sky', name: 'Sky', hex: '#87CEEB', image: 'https://i.postimg.cc/YSMnJ2Pc/GD067-Sky-FT.jpg' },
        { id: 'smoke', name: 'Smoke', hex: '#738276', image: 'https://i.postimg.cc/Xv4HTNPb/GD067-Smoke-FT.jpg' },
        { id: 'stone-blue', name: 'Stone Blue', hex: '#6A8EAE', image: 'https://i.postimg.cc/g0mSfc72/GD067-Stone-Blue-FT.jpg' },
        { id: 'tangerine', name: 'Tangerine', hex: '#FF9966', image: 'https://i.postimg.cc/25GcmRpr/GD067-Tangerine-FT.jpg' },
        { id: 'texas-orange', name: 'Texas Orange', hex: '#BF5700', image: 'https://i.postimg.cc/TP07GM8x/GD067-Texas-Orange-FT.jpg' },
        { id: 'white', name: 'White', hex: '#ffffff', image: 'https://i.postimg.cc/1zBCPhxQ/GD067-White-FT.jpg' },
        { id: 'yellow-haze', name: 'Yellow Haze', hex: '#E8D44D', image: 'https://i.postimg.cc/W48WjLRN/GD067-Yellow-Haze-FT.jpg' }
    ];

    // === Pricing Rules (GD067 fallback) ===
    // Will be extended at runtime if product API provides priceBreaks
    let PRICING_RULES = {
        GD067: {
            basePrice: 17.58,
            tiers: [
                { min: 250, price: 12.59 },
                { min: 100, price: 13.49 },
                { min: 50, price: 14.94 },
                { min: 25, price: 16.18 },
                { min: 10, price: 16.54 }
            ]
        }
    };

    // === API ===
    // Minimal API base used by desktop product.js � reuse here for mobile fetches
    const API_BASE_URL = 'https://brandeduk-backend.onrender.com/api';

    // === DYNAMIC POSITION MAPPING SYSTEM ===
    
    // Default fallback images (hoodie images)
    const DEFAULT_POSITION_IMAGES = {
        'left-breast': 'https://i.postimg.cc/sfqnrsjm/Chat_GPT_Image_Dec_19_2025_03_56_48_PM.png',
        'right-breast': 'https://i.postimg.cc/j5QJk6jx/Right-Chest.jpg',
        'small-centre-front': 'https://i.postimg.cc/RFng3DGw/Chat_GPT_Image_Dec_19_2025_08_06_23_PM.png',
        'large-front-center': 'https://i.postimg.cc/RFng3DGw/Chat_GPT_Image_Dec_19_2025_08_06_23_PM.png',
        'large-centre-front': 'https://i.postimg.cc/RFng3DGw/Chat_GPT_Image_Dec_19_2025_08_06_23_PM.png',
        'large-back': 'https://i.postimg.cc/zD6dr8zt/Chat_GPT_Image_Dec_19_2025_03_51_18_PM.png',
        'left-arm': 'https://i.postimg.cc/cLr487yc/Chat_GPT_Image_Dec_19_2025_05_12_56_PM.png',
        'right-arm': 'https://i.postimg.cc/cLr487yc/Chat_GPT_Image_Dec_19_2025_05_12_56_PM.png'
    };
    
    // Default prices per position type
    const DEFAULT_POSITION_PRICES = {
        'left-breast': { embroidery: '5.00', print: '3.50' },
        'right-breast': { embroidery: '5.00', print: '3.50' },
        'small-centre-front': { embroidery: '5.00', print: '3.50' },
        'large-front-center': { embroidery: 'POA', print: '6.00' },
        'large-centre-front': { embroidery: 'POA', print: '6.00' },
        'large-back': { embroidery: 'POA', print: '5.00' },
        'left-arm': { embroidery: '5.00', print: '3.50' },
        'right-arm': { embroidery: '5.00', print: '3.50' }
    };
    
    // Position code to CSS class mapping
    const POSITION_TO_CSS_CLASS = {
        'left-breast': 'left-chest',
        'right-breast': 'right-chest',
        'small-centre-front': 'front-center',
        'large-front-center': 'large-front',
        'large-centre-front': 'large-front',
        'large-back': 'large-back',
        'left-arm': 'left-sleeve',
        'right-arm': 'right-sleeve'
    };
    
    // ProductType → Folder Path Mapping
    const PRODUCT_TYPE_TO_FOLDER = {
        'Aprons': 'aprons/bib-apron',
        'Safety Vests': 'adult-tops/hivis-jacket',
        'Hoodies': 'adult-tops/hoodies',
        'Sweatshirts': 'adult-tops/hoodies',
        'Polos': 'adult-tops/long-sleeve-polo',
        'T-shirts': 'adult-tops/short-sleeve-crew-neck',
        'Shirts': 'adult-tops/short-sleeve-crew-neck',
        'Jackets': 'adult-tops/soft-shell-jacket',
        'Softshells': 'adult-tops/soft-shell-jacket',
        'Caps': 'headwear/baseball-cap',
        'Beanies': 'headwear/beanie',
        'Trousers': 'pants/workwear-long-trousers',
        'Shorts': 'pants/workwear-shorts',
        'Bags': 'bags/gym-bag',
        'Fleece': 'adult-tops/hoodies',
        'Gilets & Body Warmers': 'adult-tops/soft-shell-jacket',
        'Knitted Jumpers': 'adult-tops/hoodies',
        'Cardigans': 'adult-tops/hoodies',
        'Blouses': 'adult-tops/short-sleeve-crew-neck',
        'Rugby Shirts': 'adult-tops/short-sleeve-crew-neck',
        'Chinos': 'pants/workwear-long-trousers',
        'Sweatpants': 'pants/workwear-shorts',
        'Trackwear': 'adult-tops/short-sleeve-crew-neck'
    };
    
    // Filename → Position Code Mapping
    const FILENAME_TO_POSITION = {
        // Aprons
        'center-front.png': { code: 'small-centre-front', label: 'Center Front', cssClass: 'front-center' },
        'low-left.png': { code: 'left-breast', label: 'Low Left', cssClass: 'apron-low-left' },
        'low-right.png': { code: 'right-breast', label: 'Low Right', cssClass: 'apron-low-right' },
        
        // Adult Tops
        'front.png': { code: 'small-centre-front', label: 'Front Center', cssClass: 'front-center' },
        'front.jpg': { code: 'small-centre-front', label: 'Front Center', cssClass: 'front-center' },
        'front-right.png': { code: 'right-breast', label: 'Front Right', cssClass: 'right-chest' },
        'back.png': { code: 'large-back', label: 'Back Large', cssClass: 'large-back' },
        'back.jpg': { code: 'large-back', label: 'Back Large', cssClass: 'large-back' },
        'left-chest.png': { code: 'left-breast', label: 'Left Chest', cssClass: 'left-chest' },
        'left-chest.jpg': { code: 'left-breast', label: 'Left Chest', cssClass: 'left-chest' },
        'right-chest.png': { code: 'right-breast', label: 'Right Chest', cssClass: 'right-chest' },
        'right-chest.jpg': { code: 'right-breast', label: 'Right Chest', cssClass: 'right-chest' },
        'left-sleeve.png': { code: 'left-arm', label: 'Left Sleeve', cssClass: 'left-sleeve' },
        'left-sleeve.jpg': { code: 'left-arm', label: 'Left Sleeve', cssClass: 'left-sleeve' },
        'right-sleeve.png': { code: 'right-arm', label: 'Right Sleeve', cssClass: 'right-sleeve' },
        'right-sleeve.jpg': { code: 'right-arm', label: 'Right Sleeve', cssClass: 'right-sleeve' },
        
        // Headwear
        'front-logo.png': { code: 'small-centre-front', label: 'Front Centre', cssClass: 'front-center' },
        'left-side.jpg': { code: 'left-breast', label: 'Left Side', cssClass: 'left-chest' },
        'right-side.jpg': { code: 'right-breast', label: 'Right Side', cssClass: 'right-chest' },
        
        // Bags
        'Gym Bag Centered.png': { code: 'small-centre-front', label: 'Centered', cssClass: 'front-center' },
        'Gym Bag Left.png': { code: 'left-breast', label: 'Left', cssClass: 'left-chest' },
        'Gym Bag Right.png': { code: 'right-breast', label: 'Right', cssClass: 'right-chest' },
        'Gym Bag Side.png': { code: 'large-back', label: 'Side', cssClass: 'large-back' },
        
        // Pants
        'Blank Work Trouser.png': { code: 'small-centre-front', label: 'Front', cssClass: 'front-center' },
        'Blank Work short.png': { code: 'small-centre-front', label: 'Front', cssClass: 'front-center' }
    };
    
    // Folder Image Inventory
    const FOLDER_IMAGE_MAP = {
        'aprons/bib-apron': ['center-front.png', 'low-left.png', 'low-right.png'],
        'adult-tops/hivis-jacket': ['back.jpg', 'front.png', 'left-chest.png', 'left-sleeve.jpg', 'right-chest.png', 'right-sleeve.jpg'],
        'adult-tops/hoodies': ['back.jpg', 'front.jpg', 'left-chest.jpg', 'left-sleeve.jpg', 'right-chest.jpg', 'right-sleeve.jpg'],
        'adult-tops/long-sleeve-polo': ['back.png', 'left-sleeve.png', 'right-chest.png', 'right-sleeve.png'],
        'adult-tops/short-sleeve-crew-neck': ['back.png', 'left-sleeve.png', 'right-chest.png', 'right-sleeve.png'],
        'adult-tops/soft-shell-jacket': ['back.png', 'front-right.png', 'left-sleeve.png', 'right-sleeve.png'],
        'headwear/baseball-cap': ['back.png', 'front.png', 'left-side.jpg', 'right-side.jpg'],
        'headwear/beanie': ['front-logo.png'],
        'pants/workwear-long-trousers': ['Blank Work Trouser.png'],
        'pants/workwear-shorts': ['Blank Work short.png'],
        'bags/gym-bag': ['Gym Bag Centered.png', 'Gym Bag Left.png', 'Gym Bag Right.png', 'Gym Bag Side.png']
    };
    
    // Build positions dynamically from productType
    function buildPositionsFromProductType(productType) {
        if (!productType) {
            console.warn('⚠️ No productType provided, using default');
            return null;
        }
        
        const productTypeStr = String(productType).trim();
        const folderPath = PRODUCT_TYPE_TO_FOLDER[productTypeStr];
        if (!folderPath) {
            console.warn(`⚠️ No folder mapping for productType: "${productTypeStr}", using default`);
            return null;
        }
        
        const imageFiles = FOLDER_IMAGE_MAP[folderPath];
        if (!imageFiles || imageFiles.length === 0) {
            console.warn(`⚠️ No images found for folder: ${folderPath}, using default`);
            return null;
        }
        
        const basePath = `brandedukv15-child/assets/images/customization/positions/${folderPath}`;
        const positions = {};
        
        imageFiles.forEach(filename => {
            const positionInfo = FILENAME_TO_POSITION[filename];
            if (positionInfo) {
                const positionCode = positionInfo.code;
                const prices = DEFAULT_POSITION_PRICES[positionCode] || { embroidery: '5.00', print: '3.50' };
                
                positions[positionCode] = {
                    label: positionInfo.label,
                    image: `${basePath}/${filename}`,
                    embroidery: prices.embroidery,
                    print: prices.print,
                    cssClass: positionInfo.cssClass
                };
            } else {
                console.warn(`⚠️ No position mapping for filename: ${filename} in folder ${folderPath}`);
            }
        });
        
        if (Object.keys(positions).length === 0) {
            console.warn(`⚠️ No valid positions found for productType: "${productTypeStr}", using default`);
            return null;
        }
        
        const allStandardPositions = ['left-breast', 'right-breast', 'small-centre-front', 'large-front-center', 'large-centre-front', 'large-back', 'left-arm', 'right-arm'];
        const hidePositions = allStandardPositions.filter(pos => !positions[pos]);
        
        console.log(`✅ Built positions from productType "${productTypeStr}":`, Object.keys(positions));
        console.log(`🙈 Will hide positions:`, hidePositions);
        
        return {
            imagePath: basePath,
            positions: positions,
            hidePositions: hidePositions
        };
    }
    
    // Update position cards based on product type
    function updatePositionCardsForProductType(productData) {
        if (!productData) {
            console.warn('⚠️ No product data for position update');
            return;
        }
        
        const productType = productData.productType || productData.category || productData.type;
        console.log('🎯 Updating position cards for productType:', productType);
        
        // Try to build positions dynamically from productType
        const config = buildPositionsFromProductType(productType);
        
        if (!config) {
            console.log('📌 Using default position images (no dynamic config available)');
            return; // Keep default hoodie images
        }
        
        const positionGrids = document.querySelectorAll('#positionOptions, .positions-grid');
        
        positionGrids.forEach(grid => {
            const allCards = grid.querySelectorAll('.position-card');
            
            allCards.forEach(card => {
                const position = card.dataset.position;
                
                // Hide positions not available for this product type
                if (config.hidePositions && config.hidePositions.includes(position)) {
                    card.style.display = 'none';
                    return;
                }
                
                const positionConfig = config.positions[position];
                if (positionConfig) {
                    card.style.display = '';
                    
                    // Update the image
                    const img = card.querySelector('.position-placeholder');
                    if (img && positionConfig.image) {
                        const newSrc = positionConfig.image;
                        img.src = newSrc;
                        img.alt = positionConfig.label;
                        
                        // Handle image load error - fallback to default
                        img.onerror = function() {
                            const defaultImg = DEFAULT_POSITION_IMAGES[position];
                            if (defaultImg) {
                                img.src = defaultImg;
                                img.alt = positionConfig.label || position;
                            }
                        };
                    }
                    
                    // Update logo overlay CSS class for aprons
                    const logoOverlay = card.querySelector('.logo-overlay-box');
                    if (logoOverlay && positionConfig.cssClass) {
                        const allPositionClasses = ['left-chest', 'right-chest', 'front-center', 'large-front', 'large-back', 'left-sleeve', 'right-sleeve', 'apron-low-left', 'apron-low-right'];
                        allPositionClasses.forEach(cls => logoOverlay.classList.remove(cls));
                        logoOverlay.classList.add(positionConfig.cssClass);
                    }
                    
                    // Update label
                    if (positionConfig.label) {
                        const labelSpan = card.querySelector('.position-checkbox span');
                        if (labelSpan) {
                            labelSpan.textContent = positionConfig.label;
                        }
                    }
                    
                    // Update prices if different
                    if (positionConfig.embroidery) {
                        card.dataset.embroidery = positionConfig.embroidery;
                        const embBtn = card.querySelector('.price-emb');
                        if (embBtn) {
                            const isPOA = String(positionConfig.embroidery).toUpperCase() === 'POA';
                            const value = isPOA ? 'POA' : ('£' + positionConfig.embroidery);
                            embBtn.setAttribute('data-default-price', value);
                            const valueEl = embBtn.querySelector('.price-value');
                            if (valueEl) valueEl.textContent = value;
                        }
                    }
                    if (positionConfig.print) {
                        card.dataset.print = positionConfig.print;
                        const printBtn = card.querySelector('.price-print');
                        if (printBtn) {
                            const value = '£' + positionConfig.print;
                            printBtn.setAttribute('data-default-price', value);
                            const valueEl = printBtn.querySelector('.price-value');
                            if (valueEl) valueEl.textContent = value;
                        }
                    }
                } else {
                    // Show with default image if not in hide list
                    card.style.display = '';
                }
            });
        });
        
        console.log('✅ Position cards updated for productType:', productType);
    }

    // === State ===
    const state = {
        product: {
            code: 'GD067',
            sku: 'GD067',
            name: 'Gildan Softstyle Hoodie',
            basePrice: 17.58
        },
        selectedColor: 'aquatic',
        selectedColorName: 'Aquatic',
        selectedColorImage: PRODUCT_COLORS[0].image,
        sizeQuantities: {},
        quantity: 0,
        technique: 'embroidery',
        positions: ['left-chest'],
        positionMethods: {},      // Track selected method (embroidery/print) per position
        positionCustomizations: {}, // Track customization data per position
        positionDesigns: {},      // Track design data (logo, text) per position
        vatIncluded: false,
        pricing: {
            positionPrices: {
                'left-chest': 2.50,
                'right-chest': 2.50,
                'front-center': 3.50,
                'back-large': 4.50,
                'left-sleeve': 2.00,
                'right-sleeve': 2.00
            },
            logoSetup: 25.00 // One-time logo setup fee
        },
        techniqueDescriptions: {
            'embroidery': '<strong>Embroidery</strong> creates a professional, durable finish using thread stitched directly into the fabric. Perfect for logos and text. Best for: corporate wear, uniforms, premium branding.',
            'dtg': '<strong>DTG (Direct to Garment)</strong> printing applies eco-friendly, water-based inks directly onto fabric. Ideal for vibrantly colored designs and intricate graphics with a soft feel.',
            'screen': '<strong>Screen Printing</strong> is perfect for bulk orders with limited colors. Produces vibrant, long-lasting prints at a cost-effective price for larger quantities.',
            'dtf': '<strong>DTF (Direct to Film)</strong> transfers allow for pre-printed designs to be heat-applied onto fabrics. Great for complex and photorealistic images on various materials.'
        }
    };

    // === Session Storage Keys for State Persistence ===
    const STATE_STORAGE_KEY = 'brandeduk-customize-state';

    // === Save Customization State to SessionStorage ===
    function saveCustomizationState() {
        try {
            const stateToSave = {
                positionMethods: state.positionMethods || {},
                positionCustomizations: state.positionCustomizations || {},
                positionDesigns: state.positionDesigns || {},
                positions: state.positions || [],
                selectedColor: state.selectedColor,
                selectedColorName: state.selectedColorName,
                selectedColorImage: state.selectedColorImage,
                sizeQuantities: state.sizeQuantities || {},
                quantity: state.quantity || 0,
                technique: state.technique
            };
            sessionStorage.setItem(STATE_STORAGE_KEY, JSON.stringify(stateToSave));
            console.log('?? Saved customization state to sessionStorage:', stateToSave);
        } catch (e) {
            console.warn('Unable to save customization state:', e);
        }
    }

    // === Restore Customization State from SessionStorage ===
    function restoreCustomizationState() {
        try {
            const saved = sessionStorage.getItem(STATE_STORAGE_KEY);
            if (!saved) {
                console.log('?? No saved customization state found');
                return false;
            }
            
            const savedState = JSON.parse(saved);
            console.log('?? Restoring customization state:', savedState);
            
            // Restore state properties
            if (savedState.positionMethods) state.positionMethods = savedState.positionMethods;
            if (savedState.positionCustomizations) state.positionCustomizations = savedState.positionCustomizations;
            if (savedState.positionDesigns) state.positionDesigns = savedState.positionDesigns;
            if (savedState.positions) state.positions = savedState.positions;
            
            // CRITICAL FIX: Don't restore selectedColorImage from sessionStorage
            // It will be set from the new product's colors in loadProductFromSessionOrApi()
            // Only restore selectedColor if it matches a color in the current product
            // This prevents showing the previous product's image
            if (savedState.selectedColor && PRODUCT_COLORS.length > 0) {
                const matchingColor = PRODUCT_COLORS.find(c => c.id === savedState.selectedColor);
                if (matchingColor) {
                    state.selectedColor = matchingColor.id;
                    state.selectedColorName = matchingColor.name;
                    state.selectedColorImage = matchingColor.image;
                    console.log('? Restored color from saved state:', matchingColor.name);
                } else {
                    console.log('?? Saved color not found in current product, will use first color');
                }
            }
            // Note: selectedColorImage is NOT restored here - it's set from new product data
            
            if (savedState.sizeQuantities) state.sizeQuantities = savedState.sizeQuantities;
            if (savedState.quantity !== undefined) state.quantity = savedState.quantity;
            if (savedState.technique) state.technique = savedState.technique;
            
            return true;
        } catch (e) {
            console.warn('Unable to restore customization state:', e);
            return false;
        }
    }

    // === Restore UI from State (call after DOM is ready) ===
    function restoreUIFromState() {
        console.log('?? Restoring UI from state...');
        console.log('?? state.positionMethods:', JSON.stringify(state.positionMethods));
        console.log('?? state.positionDesigns:', JSON.stringify(state.positionDesigns));
        
        // Restore position methods UI
        if (state.positionMethods && Object.keys(state.positionMethods).length > 0) {
            console.log('?? Found', Object.keys(state.positionMethods).length, 'positions to restore');
            Object.entries(state.positionMethods).forEach(([position, method]) => {
                const card = document.querySelector(`.position-card[data-position="${position}"], .position-card input[value="${position}"]`)?.closest('.position-card');
                if (card) {
                    const checkbox = card.querySelector('input[type="checkbox"]');
                    if (checkbox && !checkbox.checked) {
                        checkbox.checked = true;
                    }
                    card.classList.add('selected');
                    
                    // Apply method UI
                    applyMethodUI(card, method);
                    
                    console.log('? Restored position:', position, 'with method:', method);
                }
            });
        }
        
        // Restore position previews (logos)
        if (state.positionDesigns && Object.keys(state.positionDesigns).length > 0) {
            Object.entries(state.positionDesigns).forEach(([position, designData]) => {
                const card = document.querySelector(`.position-card[data-position="${position}"], .position-card input[value="${position}"]`)?.closest('.position-card');
                if (card && designData) {
                    // Show logo on product image
                    const logoOverlayBox = card.querySelector('.logo-overlay-box');
                    const logoOverlayImg = card.querySelector('.logo-overlay-img');
                    if (designData.logo && logoOverlayBox && logoOverlayImg) {
                        logoOverlayImg.src = designData.logo;
                        logoOverlayBox.hidden = false;
                    }
                    
                    // Show in preview content
                    const previewContent = card.querySelector('.position-preview-content');
                    const previewImage = card.querySelector('.preview-image');
                    if (previewContent && previewImage && designData.logo) {
                        previewImage.src = designData.logo;
                        previewImage.hidden = false;
                        previewContent.hidden = false;
                    }
                    
                    // Show pill
                    const pill = card.querySelector('.customization-pill');
                    if (pill) pill.hidden = false;
                    
                    // Transform "ADD LOGO" button to green "LOGO ADDED" when logo exists
                    if (designData.logo) {
                        const addLogoBtn = card.querySelector('.price-badge.add-logo-btn');
                        if (addLogoBtn) {
                            addLogoBtn.classList.add('logo-added');
                            addLogoBtn.innerHTML = `<span class="add-logo-text">LOGO ADDED</span>`;
                        }
                    }
                    
                    console.log('? Restored design for position:', position);
                }
            });
        }
        
        // Restore size quantities
        if (state.sizeQuantities && Object.keys(state.sizeQuantities).length > 0) {
            Object.entries(state.sizeQuantities).forEach(([size, qty]) => {
                if (qty > 0) {
                    // Find or create size row
                    const sizeBtn = document.querySelector(`.size-btn[data-size="${size}"]`);
                    if (sizeBtn) {
                        sizeBtn.classList.add('selected');
                    }
                }
            });
        }
        
        // Update pricing
        updatePricingTiers();
        updatePricingSummary();
        
        console.log('? UI restoration complete');
    }

    // === HELPERS: load product from sessionStorage or API ===
    function slugify(text) {
        return String(text || '')
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/(^-|-$)+/g, '');
    }

    async function loadProductFromSessionOrApi() {
        try {
            const savedProductData = sessionStorage.getItem('selectedProductData');
            const savedProductCode = sessionStorage.getItem('selectedProduct');
            let productData = null;

            if (savedProductData) {
                try {
                    productData = JSON.parse(savedProductData);
                    const savedCode = productData.code || productData.productCode || productData.sku;
                    const requestedCode = savedProductCode;
                    
                    // Verify the saved product matches the requested product code
                    if (requestedCode && savedCode && savedCode !== requestedCode) {
                        console.warn('?? Product code mismatch! Saved:', savedCode, 'Requested:', requestedCode);
                        console.warn('?? Clearing cached data and fetching fresh...');
                        productData = null; // Clear mismatched data
                        sessionStorage.removeItem('selectedProductData'); // Remove stale cache
                    } else {
                        console.log('? Loaded product data from sessionStorage:', savedCode || productData);
                        console.log('?? Product colors count:', (productData.colors || []).length);
                    }
                } catch (e) {
                    console.warn('Failed to parse selectedProductData from sessionStorage', e);
                    productData = null;
                }
            }

            if (!productData && savedProductCode) {
                // Fetch from API as fallback
                try {
                    const res = await fetch(`${API_BASE_URL}/products/${encodeURIComponent(savedProductCode)}`);
                    if (res.ok) {
                        productData = await res.json();
                        console.log('? Fetched product from API:', productData.code || savedProductCode);
                        console.log('?? Product colors count:', (productData.colors || []).length);
                        // cache for next time
                        sessionStorage.setItem('selectedProductData', JSON.stringify(productData));
                    } else {
                        console.warn('Product API returned', res.status);
                    }
                } catch (e) {
                    console.warn('Failed to fetch product from API', e);
                }
            }

            if (!productData) {
                // No product data available � leave default state (fallback product)
                console.warn('?? No product data available, using fallback');
                return false;
            }

            // IMPORTANT: Clear old PRODUCT_COLORS before loading new product
            // This prevents showing images from previous products
            PRODUCT_COLORS = [];

            // CRITICAL: Clear old selectedColorImage to prevent showing previous product's image
            // This is the root cause of the issue - old image persists until color is clicked
            state.selectedColor = null;
            state.selectedColorName = null;
            state.selectedColorImage = null;
            console.log('?? Cleared old color selection to prevent showing previous product image');

            // Map productData into our state
            state.product = state.product || {};
            state.product.code = productData.code || productData.productCode || productData.sku || productData.id || state.product.code;
            state.product.sku = productData.sku || productData.code || productData.productCode || productData.id || state.product.sku;
            state.product.name = productData.name || productData.title || productData.productName || productData.displayName || state.product.name;
            state.product.basePrice = Number(productData.price || productData.basePrice || productData.startPrice || productData.startingPrice) || state.product.basePrice;
            state.product.brand = productData.brand || productData.brand_name || state.product.brand;
            state.product.sizes = productData.sizes || [];
            state.product.weight = productData.weight || '';
            state.product.fabric = productData.fabric || '';
            state.product.rawData = productData; // Store full product data for reference

            // Map colors (if present) into PRODUCT_COLORS format
            const colorsSource = productData.colors || productData.colorOptions || productData.variants || [];
            if (Array.isArray(colorsSource) && colorsSource.length > 0) {
                console.log('?? Mapping', colorsSource.length, 'colors from product data...');
                PRODUCT_COLORS = colorsSource.map((c, index) => {
                    const name = c.name || c.displayName || c.label || c.id || `Color ${index + 1}`;
                    // Prioritize main image, then thumb, then fallback to product image
                    const colorImage = c.main || c.image || c.thumb || c.imageUrl || c.url || productData.image || '';
                    const colorThumb = c.thumb || c.thumbnail || c.main || c.image || colorImage;
                    
                    console.log(`  Color ${index + 1}: ${name} - Image: ${colorImage ? '?' : '?'}`);
                    
                    return {
                        id: slugify(name) || slugify(c.code || c.id || name) || `color-${index}`,
                        name: name,
                        hex: c.hex || c.color || '#cccccc',
                        image: colorImage,
                        thumb: colorThumb // Store thumb separately for thumbnails
                    };
                });
                console.log('? PRODUCT_COLORS updated with', PRODUCT_COLORS.length, 'colors');
                
                // CRITICAL FIX: Set the first color as default for the new product
                // This ensures the main image shows the correct product immediately
                if (PRODUCT_COLORS.length > 0) {
                    state.selectedColor = PRODUCT_COLORS[0].id;
                    state.selectedColorName = PRODUCT_COLORS[0].name;
                    state.selectedColorImage = PRODUCT_COLORS[0].image;
                    console.log('? Set default color to first available:', PRODUCT_COLORS[0].name, 'Image:', PRODUCT_COLORS[0].image);
                }
            } else {
                console.warn('?? No colors found in product data, using fallback');
                // If no colors, create a single color from the main product image
                if (productData.image) {
                    PRODUCT_COLORS = [{
                        id: 'default',
                        name: 'Default',
                        hex: '#cccccc',
                        image: productData.image,
                        thumb: productData.image
                    }];
                    // Set default color
                    state.selectedColor = 'default';
                    state.selectedColorName = 'Default';
                    state.selectedColorImage = productData.image;
                    console.log('? Set default color from product image:', productData.image);
                }
            }

            // Store priceBreaks DIRECTLY from API - no modifications
            state.product.priceBreaks = productData.priceBreaks || productData.tiers || productData.discounts || [];
            
            // Map pricing tiers if present (for backward compatibility)
            const breaks = state.product.priceBreaks;
            if (Array.isArray(breaks) && breaks.length > 0) {
                PRICING_RULES = PRICING_RULES || {};
                PRICING_RULES[state.product.code] = {
                    basePrice: state.product.basePrice,
                    tiers: breaks.slice().sort((a,b) => (b.min || 0) - (a.min || 0)).map(pb => ({ min: pb.min || pb.from || 0, price: pb.price || pb.unitPrice || pb.rate || 0 }))
                };
                // #region agent log
                fetch('http://127.0.0.1:7244/ingest/ff4bdadc-0eae-4978-b238-71d56c718ed8',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'mobile/js/customize.js:407',message:'PRICING_RULES populated from API',data:{productCode:state.product.code,basePrice:state.product.basePrice,priceBreaksFromAPI:breaks,tiersMapped:PRICING_RULES[state.product.code].tiers},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
                // #endregion
            }

            return true;
        } catch (e) {
            console.warn('Unexpected error loading product:', e);
            return false;
        }
    }

    // Update visible product DOM elements after dynamic load
    function refreshProductDOM() {
        try {
            // Title and SKU
            const titleEl = document.querySelector('.product-title');
            const skuEl = document.querySelector('.product-sku');
            if (titleEl) titleEl.textContent = state.product?.name || titleEl.textContent;
            if (skuEl) {
                const brandName = state.product?.brand || state.product?.name?.split(' ')[0] || '';
                skuEl.textContent = `#${state.product?.code || ''} ${brandName}`;
            }

            // Main image - clear cache by adding timestamp or replacing src
            const mainImg = document.getElementById('mainImage');
            if (mainImg) {
                const imgSrc = state.selectedColorImage || (PRODUCT_COLORS && PRODUCT_COLORS[0] && PRODUCT_COLORS[0].image) || state.product?.image || state.product?.photo || '';
                if (imgSrc) {
                    // Force reload by clearing src first, then setting new src with cache buster
                    mainImg.src = '';
                    mainImg.src = imgSrc + (imgSrc.includes('?') ? '&' : '?') + '_t=' + Date.now();
                    // Also update alt text
                    if (state.product?.name) {
                        mainImg.alt = state.product.name;
                    }
                }
            }
            
            // CRITICAL: Ensure main logo overlay is hidden when loading a new product
            // Logos should only appear in customization section, not on main product thumbnail
            const mainLogoOverlayBox = document.getElementById('logoOverlayBox');
            const mainLogoOverlayImg = document.getElementById('logoOverlayImg');
            if (mainLogoOverlayBox) {
                mainLogoOverlayBox.hidden = true;
                mainLogoOverlayBox.classList.remove('active');
            }
            if (mainLogoOverlayImg) {
                mainLogoOverlayImg.src = '';
            }
            
            // Update gallery thumbnails - show different color images
            renderColorThumbnails();

            // Color count
            const colorCount = document.querySelector('.color-count');
            if (colorCount) colorCount.textContent = `${PRODUCT_COLORS.length} colors`;

            // Product specs (S-5XL, Colors, Weight, etc.)
            const specsContainer = document.querySelector('.product-specs');
            if (specsContainer && state.product) {
                const specs = [];
                
                // Sizes
                if (state.product.sizes && Array.isArray(state.product.sizes) && state.product.sizes.length > 0) {
                    const sizes = state.product.sizes;
                    if (sizes.length === 1) {
                        specs.push(sizes[0]);
                    } else if (sizes.length === 2) {
                        specs.push(`${sizes[0]}-${sizes[1]}`);
                    } else {
                        // Format as "S-5XL" or list first and last
                        const first = sizes[0];
                        const last = sizes[sizes.length - 1];
                        specs.push(`${first}-${last}`);
                    }
                } else {
                    specs.push('S-5XL'); // Fallback
                }
                
                // Colors count
                specs.push(`${PRODUCT_COLORS.length} Colors`);
                
                // Weight/GSM - try to extract numeric value and format
                if (state.product.weight) {
                    const weightStr = String(state.product.weight);
                    // Try to extract number from weight string (e.g., "251-300gsm" -> "251-300gsm" or "276" -> "276 gsm")
                    if (weightStr.match(/\d/)) {
                        specs.push(weightStr.includes('gsm') ? weightStr : `${weightStr} gsm`);
                    } else {
                        specs.push(weightStr);
                    }
                } else {
                    specs.push('276 gsm'); // Fallback
                }
                
                // Convert GSM to oz (approximate: 1 oz � 28.35 g)
                // Try to extract numeric GSM value for conversion
                const weightValue = state.product.weight || '276';
                const gsmMatch = String(weightValue).match(/(\d+)/);
                if (gsmMatch) {
                    const gsm = parseFloat(gsmMatch[1]);
                    if (!isNaN(gsm)) {
                        const oz = (gsm / 28.35).toFixed(1);
                        specs.push(`${oz} oz`);
                    } else {
                        specs.push('8.0 oz'); // Fallback
                    }
                } else {
                    specs.push('8.0 oz'); // Fallback
                }
                
                // Update the specs HTML
                specsContainer.innerHTML = specs.map((spec, index) => {
                    return `<span class="spec">${spec}</span>${index < specs.length - 1 ? '<span class="spec-divider">|</span>' : ''}`;
                }).join('');
            }

            // Pricing tiers UI will be rebuilt elsewhere, but update title
            if (state.product && state.product.name) {
                document.title = `${state.product.name} - Branded UK`;
            }
        } catch (e) {
            console.warn('Failed to refresh product DOM', e);
        }
    }

    // === Setup State Persistence (save on page leave) ===
    function setupStatePersistence() {
        // Save state when navigating away
        window.addEventListener('pagehide', () => {
            saveCustomizationState();
        });
        
        window.addEventListener('beforeunload', () => {
            saveCustomizationState();
        });
        
        // Also save periodically when state changes (debounced)
        console.log('?? State persistence setup complete');
    }

    // === VAT Helper Functions ===
    function isVatOn() {
        try {
            return localStorage.getItem(VAT_STORAGE_KEY) === 'on';
        } catch (e) {
            return false;
        }
    }

    function setVatState(isOn) {
        try {
            localStorage.setItem(VAT_STORAGE_KEY, isOn ? 'on' : 'off');
        } catch (e) {
            console.warn('Unable to persist VAT state');
        }
        state.vatIncluded = isOn;
        updateVatToggleUI();
        updatePricingSummary();
        updatePricingTiers();
    }

    function toggleVat() {
        setVatState(!isVatOn());
    }

    function formatCurrency(baseAmount, options = {}) {
        // Default to current VAT toggle state unless explicitly overridden
        const includeVat = options.includeVat !== undefined ? options.includeVat : isVatOn();
        let value = Number(baseAmount) || 0;
        
        if (includeVat && isVatOn()) {
            value = value * (1 + VAT_RATE);
        }
        
        const currency = options.currency || '�';
        const decimals = options.decimals !== undefined ? options.decimals : 2;
        return currency + value.toFixed(decimals);
    }

    function vatSuffix() {
        return isVatOn() ? 'inc VAT' : 'ex VAT';
    }

    function updateVatToggleUI() {
        const btn = document.getElementById('vatToggleBtn');
        const container = document.getElementById('vatToggleContainer');
        const vatStatus = document.getElementById('vatStatus');
        
        if (btn) {
            const isOn = isVatOn();
            btn.setAttribute('aria-pressed', isOn ? 'true' : 'false');
            btn.classList.toggle('is-on', isOn);
            container?.classList.toggle('is-on', isOn);
            
            if (vatStatus) {
                vatStatus.textContent = isOn ? 'inc VAT' : 'ex VAT';
            }
        }
    }

    // === Pricing Functions ===
    
    // Get quantity of same product already in basket (for cumulative discount)
    function getBasketQuantityForProduct(productCode) {
        try {
            const basket = JSON.parse(localStorage.getItem('quoteBasket') || '[]');
            let basketQty = 0;
            
            basket.forEach(item => {
                const itemCode = item.productCode || item.code;
                if (itemCode === productCode) {
                    // Support both old format (quantity) and new format (totalQty)
                    if (item.quantities && typeof item.quantities === 'object') {
                        Object.values(item.quantities).forEach(qty => {
                            basketQty += parseInt(qty) || 0;
                        });
                    } else if (item.totalQty) {
                        basketQty += parseInt(item.totalQty) || 0;
                    } else if (item.quantity) {
                        basketQty += parseInt(item.quantity) || 0;
                    }
                }
            });
            
            return basketQty;
        } catch (e) {
            console.error('Error reading basket for cumulative discount:', e);
            return 0;
        }
    }
    
    // Get total quantity for discount calculation (current selection + basket items of same product)
    function getTotalQuantityForDiscount() {
        const currentQty = state.quantity || 0;
        const basketQty = getBasketQuantityForProduct(state.product.code);
        return currentQty + basketQty;
    }
    
    function getDiscountedUnitPrice(qty) {
        const rule = PRICING_RULES[state.product.code];
        if (!rule) return state.product.basePrice;
        
        // Use cumulative quantity (current + basket) for tier calculation
        const basketQty = getBasketQuantityForProduct(state.product.code);
        const totalQty = qty + basketQty;
        
        const basePrice = rule.basePrice;
        for (const tier of rule.tiers) {
            if (totalQty >= tier.min) {
                return tier.price;
            }
        }
        return basePrice;
    }

    // Alias for getDiscountedUnitPrice (used by order card and subtotal calculations)
    function getUnitPrice(qty) {
        return getDiscountedUnitPrice(qty);
    }

    function getDiscountPercentage(qty) {
        const basePrice = PRICING_RULES[state.product.code]?.basePrice || state.product.basePrice;
        const currentPrice = getDiscountedUnitPrice(qty);
        if (currentPrice >= basePrice) return 0;
        return Math.round(((basePrice - currentPrice) / basePrice) * 100);
    }

    function getCurrentTier() {
        // Use cumulative quantity (current selection + basket items of same product)
        const currentQty = state.quantity;
        const basketQty = getBasketQuantityForProduct(state.product.code);
        const totalQty = currentQty + basketQty;
        
        const tiers = [
            { min: 1, max: 9, label: '1-9' },
            { min: 10, max: 24, label: '10-24' },
            { min: 25, max: 49, label: '25-49' },
            { min: 50, max: 99, label: '50-99' },
            { min: 100, max: 249, label: '100-249' },
            { min: 250, max: Infinity, label: '250+' }
        ];
        
        for (let i = tiers.length - 1; i >= 0; i--) {
            if (totalQty >= tiers[i].min) {
                return { ...tiers[i], discount: getDiscountPercentage(currentQty) };
            }
        }
        return tiers[0];
    }

    // === DOM Elements ===
    const elements = {
        // Color selection
        colorOptions: document.getElementById('colorOptions'),
        selectedColor: document.getElementById('selectedColor'),
        
        // Size selection
        sizeOptions: document.getElementById('sizeOptions'),
        
        // Quantity
        qtyInput: document.getElementById('qtyInput'),
        qtyMinus: document.getElementById('qtyMinus'),
        qtyPlus: document.getElementById('qtyPlus'),
        
        // Pricing
        pricingTiers: document.getElementById('pricingTiers'),
        
        // Technique
        techniqueOptions: document.getElementById('techniqueOptions'),
        techniqueDesc: document.getElementById('techniqueDesc'),
        
        // Positions
        positionOptions: document.getElementById('positionOptions'),
        
        // Gallery
        mainImage: document.getElementById('mainImage'),
        galleryThumbs: document.querySelectorAll('.gallery-thumbs .thumb'),
        
        // Summary
        priceSummary: document.getElementById('priceSummary'),
        
        // Action bar
        designNowBtn: document.getElementById('designNowBtn'),
        
        // Modals
        sizeGuideBtn: document.getElementById('sizeGuideBtn'),
        sizeGuideModal: document.getElementById('sizeGuideModal'),
        closeSizeGuide: document.getElementById('closeSizeGuide'),
        designEditorModal: document.getElementById('designEditorModal'),
        closeEditor: document.getElementById('closeEditor'),
        doneDesign: document.getElementById('doneDesign'),
        
        // Editor tools
        logoUpload: document.getElementById('logoUpload'),
        uploadPreview: document.getElementById('uploadPreview'),
        previewImage: document.getElementById('previewImage')
    };

    // === Image Compression & LocalStorage Helpers ===
    function compressBase64Image(base64, maxWidth = 800, quality = 0.7) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = function() {
                const canvas = document.createElement('canvas');
                let width = img.width;
                let height = img.height;
                
                // Scale down if too large
                if (width > maxWidth) {
                    height = (height * maxWidth) / width;
                    width = maxWidth;
                }
                
                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);
                
                // Compress as JPEG (smaller than PNG)
                const compressed = canvas.toDataURL('image/jpeg', quality);
                resolve(compressed);
            };
            img.onerror = () => reject(new Error('Failed to load image'));
            img.src = base64;
        });
    }

    async function compressItemImages(item) {
        // Compress main image
        if (item.colorImage && item.colorImage.startsWith('data:')) {
            try {
                item.colorImage = await compressBase64Image(item.colorImage);
            } catch (e) {
                console.warn('Failed to compress colorImage:', e);
            }
        }
        
        // Compress customization images
        if (item.customizations && Array.isArray(item.customizations)) {
            for (let custom of item.customizations) {
                if (custom.content && custom.content.startsWith('data:')) {
                    try {
                        custom.content = await compressBase64Image(custom.content);
                    } catch (e) {
                        console.warn('Failed to compress customization image:', e);
                    }
                }
            }
        }
        
        // Compress position designs
        if (item.positionDesigns) {
            for (let [key, design] of Object.entries(item.positionDesigns)) {
                if (design.logo && design.logo.startsWith('data:')) {
                    try {
                        design.logo = await compressBase64Image(design.logo);
                    } catch (e) {
                        console.warn('Failed to compress position design:', e);
                    }
                }
            }
        }
        
        return item;
    }

    function getLocalStorageSize() {
        let total = 0;
        for (let key in localStorage) {
            if (localStorage.hasOwnProperty(key)) {
                total += (localStorage[key].length + key.length) * 2; // UTF-16 = 2 bytes per char
            }
        }
        return total;
    }

    async function cleanupLocalStorageIfNeeded() {
        const sizeBytes = getLocalStorageSize();
        const sizeMB = sizeBytes / 1024 / 1024;
        
        console.log(`?? LocalStorage size: ${sizeMB.toFixed(2)} MB`);
        
        // If over 1MB, compress basket images
        if (sizeMB > 1) {
            console.log('?? LocalStorage over 1MB, compressing basket images...');
            try {
                let basket = JSON.parse(localStorage.getItem('quoteBasket') || '[]');
                for (let i = 0; i < basket.length; i++) {
                    basket[i] = await compressItemImages(basket[i]);
                }
                localStorage.setItem('quoteBasket', JSON.stringify(basket));
                console.log('? Basket images compressed');
            } catch (e) {
                console.error('Failed to compress basket:', e);
            }
        }
        
        // If over 3MB, show warning
        if (sizeMB > 3) {
            showToast('Storage is getting full. Consider completing your quote soon.');
        }
    }

    // === Initialize ===
    async function init() {
        console.log('?? INIT STARTED');
        console.log('DOM Ready State:', document.readyState);
        
        // CRITICAL FIX: Clear selectedColorImage first to prevent showing old product's image
        // This ensures we don't show the previous product's image while loading new product
        state.selectedColorImage = null;
        state.selectedColor = null;
        state.selectedColorName = null;
        console.log('?? Cleared color selection state before loading new product');

        // CRITICAL FIX: Load product data FIRST, then restore customization state
        // This ensures PRODUCT_COLORS is populated before we try to match saved colors
        try {
            const loadedEarly = await loadProductFromSessionOrApi();
            if (loadedEarly) {
                console.log('? Product loaded early during init:', state.product.code, state.product.name);
                
                // Now restore customization state (colors will be matched against new product's colors)
                restoreCustomizationState();
                
                // Refresh DOM with correct product data
                refreshProductDOM();
                
                // Update position cards with product-specific images (apron, hoodie, etc.)
                updatePositionCardsForProductType(state.product.rawData);
            } else {
                // If product didn't load, still try to restore state (will use fallback)
                restoreCustomizationState();
            }
        } catch (e) {
            console.warn('Early product load failed, continuing with fallback', e);
            restoreCustomizationState();
        }

        // Check if coming from shop page with selected color (apply after loading product)
        const shopSelectedColorName = sessionStorage.getItem('selectedColorName');
        const shopSelectedColorUrl = sessionStorage.getItem('selectedColorUrl');
        if (shopSelectedColorName && shopSelectedColorUrl) {
            console.log('?? Found color from shop:', shopSelectedColorName);
            // Find matching color in PRODUCT_COLORS
            const matchingColor = PRODUCT_COLORS.find(c => 
                c.name.toLowerCase() === shopSelectedColorName.toLowerCase() ||
                c.image === shopSelectedColorUrl
            );
            if (matchingColor) {
                state.selectedColor = matchingColor.id;
                state.selectedColorName = matchingColor.name;
                state.selectedColorImage = matchingColor.image;
                console.log('? Applied shop color:', matchingColor.name);
                
                // Update main image immediately
                setTimeout(() => {
                    const mainImage = document.querySelector('.gallery-main img');
                    if (mainImage) {
                        mainImage.src = matchingColor.image;
                        console.log('??? Updated main image to:', matchingColor.image);
                    }
                    // Update color label
                    const selectedColorEl = document.getElementById('selectedColor');
                    if (selectedColorEl) {
                        selectedColorEl.textContent = matchingColor.name;
                    }
                    // Update active button
                    const colorOptions = document.getElementById('colorOptions');
                    if (colorOptions) {
                        colorOptions.querySelectorAll('.color-btn').forEach(b => {
                            b.classList.toggle('active', b.dataset.color === matchingColor.id);
                        });
                    }
                }, 100);
            }
            // Clear the shop session storage so it doesn't override next time
            sessionStorage.removeItem('selectedColorName');
            sessionStorage.removeItem('selectedColorUrl');
        }
        
        // Setup state persistence for when user navigates away
        setupStatePersistence();
        
        // Check and cleanup localStorage if needed
        cleanupLocalStorageIfNeeded();
        
        // Force render colors first (PRODUCT_COLORS may have been updated)
        console.log('About to call renderColorButtons...');
        renderColorButtons();
        console.log('renderColorButtons called');
        
        setupVatToggle();
        setupColorSelection();
        setupSizeSelection();
        setupQuantityControl();
        setupTechniqueSelection();
        setupQuickUpload();
        setupPositionSelection();
        setupDeleteLogoButtons(); // Handle delete logo buttons in position cards
        initializePOABadges(); // Initialize POA badges
        setupGallery();
        setupModals();
        setupDesignEditor();
        initDesignModal();
        initCustomizationTypeModal(); // Initialize customization type selection modal
        // setupOrderCard(); // REMOVED - card viola eliminata
        setupSaveSelectionButton();
        setupSubmitQuoteButton();
        setupScrollBlock();
        updateVatToggleUI();
        updatePricingTiers();
        updatePricingSummary();
        // updateOrderCard(); // REMOVED - card viola eliminata
        updateDeliveryDate();
        updateQuoteButtonState();
    // Ensure sizes/quantities are recalculated after UI setup
    try { updateSizeQuantities(); } catch (e) { /* ignore if not yet defined */ }
        
        // Update total pieces counter to show basket items at init
        const totalSpan = document.getElementById('totalQty');
        if (totalSpan) {
            const basketQty = getBasketQuantityForProduct(state.product.code);
            totalSpan.textContent = state.quantity + basketQty;
        }
        
        // Initialize selection as saved (no items yet)
        state.selectionSaved = true;
        
        // Restore UI from state if we had saved state (after all UI is rendered)
        setTimeout(() => {
            console.log('? Running restoreUIFromState after timeout...');
            restoreUIFromState();
        }, 300);
        
        console.log('? INIT COMPLETE');
        
        // Force clear size rows after everything is loaded (only if no restored state)
        setTimeout(() => {
            if (!state.sizeQuantities || Object.keys(state.sizeQuantities).length === 0) {
                const selectedSizes = document.querySelector('.selected-sizes');
                if (selectedSizes) {
                    selectedSizes.innerHTML = '';
                    console.log('FORCED CLEAR of all size rows');
                }
            }
        }, 100);
    }

    // === Order Card Accordion ===
    function setupOrderCard() {
        const card = document.getElementById('orderCard');
        const cardFace = document.getElementById('orderCardFace');
        const closeBtn = document.getElementById('orderCardClose');
        const cardHeader = card?.querySelector('.order-card-header');
        
        if (!card) return;
        
        // Open card on click
        if (cardFace) {
            cardFace.addEventListener('click', () => {
                card.classList.add('active');
                updateOrderCardItemsList();
                if (navigator.vibrate) navigator.vibrate(10);
            });
        }
        
        // Close card - entire header is clickable
        if (cardHeader) {
            cardHeader.addEventListener('click', () => {
                card.classList.remove('active');
                if (navigator.vibrate) navigator.vibrate(10);
            });
            // Make header appear clickable
            cardHeader.style.cursor = 'pointer';
        }
        
        // Also keep the close button functional (redundant but doesn't hurt)
        if (closeBtn) {
            closeBtn.addEventListener('click', (e) => {
                e.stopPropagation(); // Prevent double trigger
                card.classList.remove('active');
                if (navigator.vibrate) navigator.vibrate(10);
            });
        }
        
        // Update date
        updateOrderCardDate();
    }
    
    // === Save Selection Button ===
    function setupSaveSelectionButton() {
        const saveBtn = document.getElementById('saveSelectionBtn');
        if (!saveBtn) return;
        
        saveBtn.addEventListener('click', () => {
            console.log('?? SAVE BUTTON CLICKED!');
            console.log('?? state.positionMethods BEFORE save:', JSON.stringify(state.positionMethods));
            console.log('?? state.quantity:', state.quantity);
            
            // Check if there's anything to save
            if (state.quantity <= 0) {
                showToast('Please select at least one size first');
                return;
            }
            
            // Add current selection to basket
            addCurrentSelectionToBasket();
            
            // Mark selection as saved
            state.selectionSaved = true;
            
            // Update button appearance
            saveBtn.classList.add('saved');
            saveBtn.innerHTML = `
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M5 13l4 4L19 7"/>
                </svg>
                Saved!
            `;
            
            // Vibrate feedback
            if (navigator.vibrate) navigator.vibrate([10, 50, 10]);
            
            // Reset the size selection form after a moment
            setTimeout(() => {
                // Reset the form for a new selection
                resetSizeSelectionForm();
                
                // Reset button to initial state
                saveBtn.classList.remove('saved');
                saveBtn.innerHTML = `
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/>
                        <polyline points="17 21 17 13 7 13 7 21"/>
                        <polyline points="7 3 7 8 15 8"/>
                    </svg>
                    Save & Continue
                `;
                
                showToast('Ready to add more items!');
            }, 1200);
        });
    }
    
    // Add current size selection to basket
    function addCurrentSelectionToBasket() {
        const basket = JSON.parse(localStorage.getItem('quoteBasket') || '[]');
        
        // Build positions object for any selected branding
        const positions = {};
        const customizations = [];
        
        // DEBUG: Check if positionMethods exists and has data
        let methodsCount = state.positionMethods ? Object.keys(state.positionMethods).length : 0;
        console.log('DEBUG - Initial positionMethods count:', methodsCount);
        console.log('DEBUG - state.positionMethods:', JSON.stringify(state.positionMethods));
        
        // If positionMethods is empty, rebuild from UI (fallback)
        if (methodsCount === 0) {
            console.log('WARNING: positionMethods is empty! Rebuilding from UI...');
            
            if (!state.positionMethods) state.positionMethods = {};
            
            // Rebuild from UI - check all position cards with active badges
            document.querySelectorAll('.position-card').forEach(card => {
                const checkbox = card.querySelector('input[type="checkbox"]');
                const position = checkbox?.value;
                
                // Check for active badge
                const activeBadge = card.querySelector('.price-badge.active');
                if (activeBadge && position) {
                    const method = activeBadge.dataset.method;
                    if (method) {
                        state.positionMethods[position] = method;
                        console.log('REBUILT position:', position, '=', method);
                    }
                }
            });
            
            methodsCount = Object.keys(state.positionMethods).length;
            console.log('After rebuild - positionMethods count:', methodsCount);
        }
        
        console.log('FINAL positionMethods:', JSON.stringify(state.positionMethods));
        console.log('quantity:', state.quantity);
        
        if (state.positionMethods && Object.keys(state.positionMethods).length > 0) {
            Object.entries(state.positionMethods).forEach(([pos, method]) => {
                // method is 'embroidery' or 'print' (lowercase)
                const unitPrice = method.toLowerCase() === 'embroidery' ? 5.00 : 3.50;
                const totalPrice = unitPrice * state.quantity;
                const methodLabel = method.toLowerCase() === 'embroidery' ? 'Embroidery' : 'Print';
                
                // Convert position ID to readable name
                const positionNames = {
                    'left-chest': 'Left Chest',
                    'right-chest': 'Right Chest',
                    'front-center': 'Front Center',
                    'back-large': 'Back Large',
                    'left-sleeve': 'Left Sleeve',
                    'right-sleeve': 'Right Sleeve',
                    'left-breast': 'Left Chest',
                    'right-breast': 'Right Chest'
                };
                const positionLabel = positionNames[pos] || pos.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
                
                positions[pos] = {
                    method: methodLabel,
                    unitPrice: unitPrice,
                    totalPrice: totalPrice,
                    name: positionLabel
                };
                
                // Also add to customizations array for basket display
                customizations.push({
                    position: positionLabel,
                    method: methodLabel,
                    unitPrice: unitPrice,
                    total: totalPrice,
                    qty: state.quantity
                });
            });
        }
        
        // Create new item
        const newItem = {
            id: Date.now().toString(),
            productCode: state.product?.code || 'GD067',
            productName: state.product?.name || 'Gildan Softstyle� Midweight Hoodie',
            color: state.selectedColorName || state.selectedColor || 'Black',
            colorId: state.selectedColor,
            colorImage: state.selectedColorImage,
            quantities: { ...state.sizeQuantities },
            totalQty: state.quantity,
            unitPrice: getCurrentUnitPrice(),
            priceMode: localStorage.getItem('brandeduk-vat-mode') === 'on' ? 'inc' : 'ex',
            positions: positions,
            customizations: customizations,
            addedAt: new Date().toISOString()
        };
        
        console.log('?? New Item to save:', JSON.stringify(newItem, null, 2));
        console.log('?? positions object:', JSON.stringify(positions));
        console.log('?? customizations array:', JSON.stringify(customizations));
        
        // Add to basket
        basket.push(newItem);
        localStorage.setItem('quoteBasket', JSON.stringify(basket));
        
        console.log('? Basket saved! Total items:', basket.length);
        
        // Update UI
        updateCartBadge();
        updateBasketCount();
        updatePricingSummary();
        
        console.log('? Added to basket:', newItem.totalQty, 'items, customizations:', customizations.length);
    }
    
    // Reset size selection form (but keep color)
    function resetSizeSelectionForm() {
        // Reset quantities
        state.quantity = 0;
        state.sizeQuantities = {};
        state.selectionSaved = false;
        
        // Clear ALL size rows
        const container = document.querySelector('.selected-sizes');
        if (container) {
            container.innerHTML = '<!-- Size rows will be added dynamically -->';
        }
        
        // Update displays
        updateSizeQuantities();
        updatePricingSummary();
        updateLiveBadge();
    }
    
    // === Submit Quote Button Handler ===
    function setupSubmitQuoteButton() {
        const submitBtn = document.getElementById('submitQuoteBtn');
        const popupOverlay = document.getElementById('quotePopupOverlay');
        const closePopupBtn = document.getElementById('closeQuotePopup');
        const quoteForm = document.getElementById('quoteRequestForm');
        const popupSubmitBtn = document.getElementById('quotePopupSubmitBtn');
        
        if (!submitBtn) return;
        
        // Open popup when clicking Submit Quote button
        submitBtn.addEventListener('click', () => {
            if (popupOverlay) {
                popupOverlay.classList.add('active');
                document.body.style.overflow = 'hidden';
                
                // Haptic feedback
                if (navigator.vibrate) navigator.vibrate(10);
            }
        });
        
        // Close popup when clicking X
        if (closePopupBtn) {
            closePopupBtn.addEventListener('click', () => {
                popupOverlay.classList.remove('active');
                document.body.style.overflow = '';
            });
        }
        
        // Close popup when clicking overlay background
        if (popupOverlay) {
            popupOverlay.addEventListener('click', (e) => {
                if (e.target === popupOverlay) {
                    popupOverlay.classList.remove('active');
                    document.body.style.overflow = '';
                }
            });
        }
        
        // Handle form submission
        if (quoteForm) {
            quoteForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                
                // Prevent double submit
                if (popupSubmitBtn.classList.contains('submitted')) return;
                
                // Get form data
                const name = document.getElementById('quoteName').value.trim();
                const company = document.getElementById('quoteCompany')?.value.trim() || '';
                const phone = document.getElementById('quotePhone').value.trim();
                const emailValue = document.getElementById('quoteEmail').value.trim();
                const address = document.getElementById('quoteAddress')?.value.trim() || '';
                
                // Validate email
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                if (!emailValue || !emailRegex.test(emailValue)) {
                    const emailInput = document.getElementById('quoteEmail');
                    emailInput.classList.add('invalid-email');
                    
                    // Show error message
                    let errorMsg = emailInput.parentElement.querySelector('.email-error');
                    if (!errorMsg) {
                        errorMsg = document.createElement('span');
                        errorMsg.className = 'email-error';
                        errorMsg.textContent = 'Insert valid email address';
                        emailInput.parentElement.appendChild(errorMsg);
                    }
                    
                    // Haptic feedback for error
                    if (navigator.vibrate) navigator.vibrate([50, 30, 50]);
                    
                    return; // Don't submit
                }

                // Basic validation
                if (!name || !phone) {
                    alert('Please fill in all fields');
                    return;
                }

                // Show loading state
                if (popupSubmitBtn) {
                    popupSubmitBtn.textContent = 'Sending...';
                    popupSubmitBtn.disabled = true;
                }

                const showToastOrAlert = (message) => {
                    // Try to use toast if available, otherwise alert
                    if (typeof showToast === 'function') {
                        showToast(message);
                    } else {
                        alert(message);
                    }
                };

                try {
                    // Get basket from localStorage
                    let basket = [];
                    try {
                        basket = JSON.parse(localStorage.getItem('quoteBasket')) || [];
                    } catch {
                        basket = [];
                    }

                    // Get product data from sessionStorage
                    let productData = {};
                    try {
                        const savedProductData = sessionStorage.getItem('selectedProductData');
                        if (savedProductData) {
                            productData = JSON.parse(savedProductData);
                        }
                    } catch {
                        // Ignore
                    }

                    // Get customizations from state or sessionStorage
                    let positionCustomizations = {};
                    try {
                        const savedCustomizations = sessionStorage.getItem('positionCustomizations');
                        if (savedCustomizations) {
                            positionCustomizations = JSON.parse(savedCustomizations);
                        } else if (state.positionCustomizations) {
                            positionCustomizations = state.positionCustomizations;
                        }
                    } catch {
                        // Ignore
                    }

                    // Calculate summary totals and build detailed basket items
                    let totalGarmentCost = 0;
                    let totalQuantity = 0;
                    let customizationTotal = 0;
                    let digitizingFee = 0;
                    const basketItems = [];
                    const customizationsList = [];

                    // Process basket items
                    basket.forEach((item) => {
                        const qtyMap = item.quantities || item.sizes || {};
                        const itemQuantity = item.quantity || Object.values(qtyMap).reduce((sum, q) => sum + (Number(q) || 0), 0);
                        const unitPrice = Number(item.price) || 0;
                        const itemTotal = unitPrice * itemQuantity;
                        
                        totalGarmentCost += itemTotal;
                        totalQuantity += itemQuantity;
                        
                        const sizesBreakdown = Object.entries(qtyMap)
                            .filter(([size, qty]) => Number(qty) > 0)
                            .reduce((acc, [size, qty]) => {
                                acc[size] = Number(qty);
                                return acc;
                            }, {});
                        
                        basketItems.push({
                            name: item.name || productData.name || 'Product',
                            code: item.code || productData.code || '',
                            color: item.color || item.selectedColorName || state.selectedColorName || '',
                            sizes: sizesBreakdown,
                            quantity: itemQuantity,
                            unitPrice: unitPrice,
                            itemTotal: itemTotal
                        });
                    });

                    // Process customizations
                    const customizationsEntries = Object.entries(positionCustomizations);
                    customizationsEntries.forEach(([position, customization]) => {
                        if (!customization) return;
                        
                        const method = customization.method || 'embroidery';
                        const type = customization.type || 'logo';
                        const unitPrice = Number(customization.unitPrice) || 0;
                        const quantity = Number(customization.quantity) || totalQuantity;
                        const hasLogo = !!(customization.logoUrl || customization.logoData || customization.uploadedLogo);
                        
                        let lineTotal = 'POA';
                        if (customization.lineTotal && customization.lineTotal !== 'POA') {
                            lineTotal = Number(customization.lineTotal);
                            customizationTotal += lineTotal;
                        } else if (unitPrice > 0 && quantity > 0) {
                            lineTotal = unitPrice * quantity;
                            customizationTotal += lineTotal;
                        }
                        
                        // Check if digitizing fee applies (first logo upload)
                        if (hasLogo && method === 'embroidery' && !customization.digitizingFeePaid) {
                            digitizingFee = 25.00; // Standard digitizing fee
                        }
                        
                        customizationsList.push({
                            position: position,
                            method: method,
                            type: type,
                            unitPrice: unitPrice,
                            quantity: quantity,
                            lineTotal: lineTotal,
                            hasLogo: hasLogo,
                            customizationName: customization.name || ''
                        });
                    });

                    // Calculate totals
                    const isVatIncluded = localStorage.getItem('brandeduk-vat-mode') === 'on';
                    const vatRate = 0.20;
                    const totalCostExVat = totalGarmentCost + customizationTotal + digitizingFee;
                    const vatAmount = totalCostExVat * vatRate;
                    const totalCostIncVat = totalCostExVat + vatAmount;

                    const quoteData = {
                        customer: {
                            fullName: name,
                            company: company,
                            phone: phone,
                            email: emailValue,
                            address: address
                        },
                        summary: {
                            totalQuantity: totalQuantity,
                            totalItems: basket.length,
                            garmentCost: totalGarmentCost,
                            customizationCost: customizationTotal,
                            digitizingFee: digitizingFee,
                            subtotal: totalCostExVat,
                            vatRate: vatRate,
                            vatAmount: vatAmount,
                            totalExVat: totalCostExVat,
                            totalIncVat: totalCostIncVat,
                            vatMode: isVatIncluded ? 'inc' : 'ex',
                            displayTotal: isVatIncluded ? totalCostIncVat : totalCostExVat,
                            hasPoa: customizationsList.some(c => c.lineTotal === 'POA')
                        },
                        basket: basketItems,
                        customizations: customizationsList,
                        timestamp: new Date().toISOString()
                    };

                    // Submit quote via API
                    let result = { success: false };
                    const API_BASE_URL = 'https://brandeduk-backend.onrender.com';
                    
                    try {
                        // Try using BrandedAPI if available
                        if (window.BrandedAPI && typeof window.BrandedAPI.submitQuote === 'function') {
                            result = await window.BrandedAPI.submitQuote(quoteData);
                        } else {
                            // Fallback: direct fetch to API
                            const response = await fetch(`${API_BASE_URL}/api/quotes`, {
                                method: 'POST',
                                headers: {
                                    'Content-Type': 'application/json'
                                },
                                body: JSON.stringify(quoteData)
                            });

                            if (!response.ok) {
                                const errorText = await response.text();
                                throw new Error(`API Error: ${response.status} - ${errorText}`);
                            }

                            const contentType = response.headers.get('content-type');
                            if (contentType && contentType.includes('application/json')) {
                                result = await response.json();
                            } else {
                                const text = await response.text();
                                console.error('Non-JSON response:', text);
                                throw new Error('Server returned non-JSON response');
                            }
                        }
                    } catch (apiError) {
                        console.error('Quote API error:', apiError);
                        showToastOrAlert('Failed to send quote. Please contact info@brandeduk.com directly.');
                        if (popupSubmitBtn) {
                            popupSubmitBtn.textContent = 'Submit Quote Request';
                            popupSubmitBtn.disabled = false;
                        }
                        return;
                    }

                    if (result.success) {
                        console.log('? Quote submitted successfully');
                        
                        // Update button to submitted state
                        if (popupSubmitBtn) {
                            popupSubmitBtn.classList.add('submitted');
                            popupSubmitBtn.textContent = 'Quote Submitted! ?';
                        }
                        
                        // Also update the main Submit Quote button
                        if (submitBtn) {
                            submitBtn.classList.add('submitted');
                            submitBtn.innerHTML = `
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                    <polyline points="20 6 9 17 4 12"></polyline>
                                </svg>
                                Quote Submitted!
                            `;
                        }
                        
                        // Haptic feedback
                        if (navigator.vibrate) navigator.vibrate([10, 50, 10]);
                        
                        // Clear storage and redirect after delay
                        setTimeout(() => {
                            // Clear the basket
                            localStorage.removeItem('quoteBasket');
                            localStorage.setItem('quoteBasket', '[]');
                            
                            // Clear ALL customization state
                            sessionStorage.removeItem('brandeduk-customize-state');
                            sessionStorage.removeItem('quoteFormData');
                            sessionStorage.removeItem('selectedColorName');
                            sessionStorage.removeItem('selectedColorUrl');
                            sessionStorage.removeItem('selectedProduct');
                            sessionStorage.removeItem('selectedProductData');
                            sessionStorage.removeItem('customizingProduct');
                            sessionStorage.removeItem('selectedPositions');
                            sessionStorage.removeItem('positionCustomizations');
                            sessionStorage.removeItem('brandeduk-filters');
                            sessionStorage.removeItem('uploadedLogo');
                            sessionStorage.removeItem('logoPreview');
                            
                            // Reset in-memory state
                            state.positionMethods = {};
                            state.positionCustomizations = {};
                            state.positionDesigns = {};
                            state.positions = [];
                            state.sizeQuantities = {};
                            state.quantity = 0;
                            state.selectedColor = null;
                            state.selectedColorName = null;
                            state.selectedColorImage = null;
                            
                            // Close popup
                            if (popupOverlay) {
                                popupOverlay.classList.remove('active');
                                document.body.style.overflow = '';
                            }
                            
                            // Redirect to index-mobile.html
                            window.location.replace('index-mobile.html');
                        }, 1500);
                    } else {
                        throw new Error(result.message || 'Unknown error');
                    }
                } catch (error) {
                    console.error('Quote submission error:', error);
                    showToastOrAlert('Failed to send quote. Please try again or contact info@brandeduk.com directly.');
                    if (popupSubmitBtn) {
                        popupSubmitBtn.textContent = 'Submit Quote Request';
                        popupSubmitBtn.disabled = false;
                    }
                }
            });
        }
        
        // Remove error state when user starts typing again
        const emailInput = document.getElementById('quoteEmail');
        if (emailInput) {
            emailInput.addEventListener('input', () => {
                emailInput.classList.remove('invalid-email');
                const errorMsg = emailInput.parentElement.querySelector('.email-error');
                if (errorMsg) errorMsg.remove();
            });
        }
        
        // Setup phone validation - only allow numbers and spaces
        const phoneInput = document.getElementById('quotePhone');
        if (phoneInput) {
            phoneInput.addEventListener('input', (e) => {
                // Remove any non-numeric characters except spaces
                let value = e.target.value.replace(/[^0-9\s]/g, '');
                
                // Remove leading 0 if present (since +44 replaces it)
                if (value.startsWith('0')) {
                    value = value.substring(1);
                }
                
                e.target.value = value;
            });
            
            // Prevent non-numeric input
            phoneInput.addEventListener('keypress', (e) => {
                if (!/[0-9\s]/.test(e.key) && e.key !== 'Backspace' && e.key !== 'Delete') {
                    e.preventDefault();
                }
            });
        }
    }
    
    // === Block Scroll when selection not saved ===
    function setupScrollBlock() {
        let lastScrollTop = 0;
        const sizeSection = document.querySelector('.size-section');
        
        window.addEventListener('scroll', (e) => {
            // Only block if there are unsaved items
            if (state.quantity > 0 && !state.selectionSaved) {
                const currentScrollTop = window.pageYOffset || document.documentElement.scrollTop;
                
                // Check if scrolling down
                if (currentScrollTop > lastScrollTop) {
                    // Get the position of the size section
                    if (sizeSection) {
                        const sectionBottom = sizeSection.getBoundingClientRect().bottom;
                        
                        // If trying to scroll past the size section, block it
                        if (sectionBottom < 200) {
                            window.scrollTo({
                                top: lastScrollTop,
                                behavior: 'instant'
                            });
                            
                            // Flash the save button to draw attention
                            const saveBtn = document.getElementById('saveSelectionBtn');
                            if (saveBtn) {
                                saveBtn.style.transform = 'scale(1.05)';
                                saveBtn.style.boxShadow = '0 0 20px rgba(124, 58, 237, 0.6)';
                                setTimeout(() => {
                                    saveBtn.style.transform = '';
                                    saveBtn.style.boxShadow = '';
                                }, 300);
                            }
                            return;
                        }
                    }
                }
                
                lastScrollTop = currentScrollTop <= 0 ? 0 : currentScrollTop;
            }
        }, { passive: false });
    }
    
    function updateOrderCardDate() {
        const dateEl = document.getElementById('cardDate');
        if (dateEl) {
            const now = new Date();
            const day = String(now.getDate()).padStart(2, '0');
            const month = String(now.getMonth() + 1).padStart(2, '0');
            const year = now.getFullYear();
            dateEl.textContent = `${day}/${month}/${year}`;
        }
    }
    
    function updateOrderCard() {
        // Calculate totals from BOTH basket AND current selection
        const basket = JSON.parse(localStorage.getItem('quoteBasket') || '[]');
        
        // First, calculate TOTAL quantity to determine correct tier
        let basketQty = 0;
        basket.forEach(item => {
            basketQty += item.totalQty || item.quantity || 0;
        });
        const currentQty = state.quantity || 0;
        const totalQty = basketQty + currentQty;
        
        // Get the CORRECT unit price based on total quantity (cumulative discount)
        const correctUnitPrice = getDiscountedUnitPrice(currentQty); // This already includes basket in its calculation
        
        // Now recalculate basket total with correct pricing
        let basketTotal = 0;
        let basketBrandingCount = 0;
        
        basket.forEach(item => {
            const itemQty = item.totalQty || item.quantity || 0;
            const itemCode = item.productCode || item.code;
            
            // Use cumulative discount price for same product
            let itemPrice;
            if (itemCode === state.product.code) {
                // Same product - use the cumulative tier price
                itemPrice = correctUnitPrice;
            } else {
                // Different product - use saved price (TODO: implement cross-product discounting)
                itemPrice = parseFloat(item.unitPrice || item.price) || 0;
            }
            
            basketTotal += itemQty * itemPrice;
            
            // Add customization costs for basket items
            if (item.customizations && item.customizations.length > 0) {
                basketBrandingCount += item.customizations.length;
                // Note: customization costs should also be calculated per item
                // but for now we're using the saved values
            }
        });
        
        // Current selection totals
        // Count only positions that have a method selected (embroidery or print)
        let currentBrandingQty = 0;
        if (state.positionMethods && typeof state.positionMethods === 'object') {
            currentBrandingQty = Object.keys(state.positionMethods).length;
        }
        const currentSubtotal = calculateSubtotal();
        
        // Combined totals
        const totalBranding = basketBrandingCount + currentBrandingQty;
        
        // Update card face stats (but NOT the totals - those come from updatePricingSummary)
        const cardItemsQty = document.getElementById('cardItemsQty');
        const cardBrandingQty = document.getElementById('cardBrandingQty');
        const cardLogoQty = document.getElementById('cardLogoQty');
        
        if (cardItemsQty) cardItemsQty.textContent = totalQty; // TOTAL items (basket + current)
        if (cardBrandingQty) cardBrandingQty.textContent = totalBranding; // TOTAL brandings (basket + current)
        if (cardLogoQty) cardLogoQty.textContent = `(${totalQty})`;
        
        // Update item preview rows
        updateOrderCardPreviewRows();
        
        // Update logos list
        updateOrderCardLogosList();
    }
    
    function updateOrderCardPreviewRows() {
        const row1 = document.getElementById('cardItemRow1');
        const row2 = document.getElementById('cardItemRow2');
        
        // Get selected color info
        const colorName = state.selectedColorName || 'Select Color';
        const productCode = state.product?.code || 'GD067';
        
        if (row1) {
            row1.innerHTML = `
                <span class="item-code">${productCode}</span>
                <img src="https://i.postimg.cc/DwLMYJL8/logo-gildan.png" alt="Gildan" class="brand-logo-mini">
                <span class="item-color">${colorName}</span>
            `;
        }
        
        // Second row shows sizes if available
        if (row2) {
            const sizes = Object.entries(state.sizeQuantities || {})
                .filter(([_, qty]) => qty > 0)
                .map(([size, qty]) => `${qty}�${size}`)
                .join(', ');
            
            if (sizes) {
                row2.innerHTML = `
                    <span class="item-code">Sizes:</span>
                    <span class="item-color">${sizes}</span>
                `;
                row2.style.display = 'flex';
            } else {
                row2.style.display = 'none';
            }
        }
    }
    
    function updateOrderCardItemsList() {
        const listContainer = document.getElementById('orderCardItemsList');
        if (!listContainer) return;
        
        let itemsHtml = '';
        
        // PART 1: Show items already in the basket (from localStorage)
        const basket = JSON.parse(localStorage.getItem('quoteBasket') || '[]');
        
        // Calculate correct unit price based on cumulative quantity
        const cumulativeUnitPrice = getUnitPrice(state.quantity); // Already considers basket
        
        basket.forEach((item, basketIndex) => {
            const itemQty = item.totalQty || item.quantity || 0;
            const itemCode = item.productCode || item.code || 'N/A';
            
            // Use cumulative price for same product code
            const unitPrice = (itemCode === state.product.code) 
                ? cumulativeUnitPrice 
                : (parseFloat(item.unitPrice || item.price) || 0);
            
            const productName = item.productName || item.name || 'Product';
            const colorName = item.color || 'Unknown';
            const colorImage = item.colorImage || item.image || 'https://via.placeholder.com/60';
            
            // Build customizations HTML for this item
            let customizationsHtml = '';
            if (item.customizations && Array.isArray(item.customizations) && item.customizations.length > 0) {
                customizationsHtml = '<div class="order-item-customizations">';
                item.customizations.forEach(custom => {
                    const posName = custom.position || custom.zone || 'Position';
                    const methodName = custom.method || (custom.type === 'embroidery' ? 'Embroidery' : 'Print');
                    const custPrice = custom.unitPrice || 0;
                    const custQty = item.totalQty || item.quantity || 0;
                    const custTotal = custQty * custPrice;
                    customizationsHtml += `
                        <div class="customization-badge-mini">
                            <span class="badge-icon">${methodName === 'Embroidery' ? '??' : '???'}</span>
                            <span class="badge-text">${posName} - ${methodName}</span>
                            <span class="badge-price">${custQty} � ${formatCurrency(custPrice)} = ${formatCurrency(custTotal)}</span>
                        </div>
                    `;
                });
                customizationsHtml += '</div>';
            }
            
            // For basket items with multiple sizes, create ONE card per SIZE (so each has +/- controls)
            if (item.quantities && typeof item.quantities === 'object') {
                Object.entries(item.quantities).forEach(([size, sizeQty]) => {
                    if (sizeQty <= 0) return;
                    
                    const sizeTotal = sizeQty * unitPrice;
                    
                    itemsHtml += `
                        <div class="order-item-card basket-item" data-basket-index="${basketIndex}" data-size="${size}">
                            <img src="${colorImage}" alt="${productName}" class="order-item-image">
                            <div class="order-item-details">
                                <div class="order-item-name">${productName}</div>
                                <div class="order-item-meta">${itemCode} - ${colorName}</div>
                                <div class="order-item-size">${sizeQty}�${size}</div>
                                ${customizationsHtml}
                                <div class="order-item-qty-control">
                                    <button class="order-item-qty-btn basket-qty-btn" data-action="decrease" data-basket-index="${basketIndex}" data-size="${size}">-</button>
                                    <span class="order-item-qty-value">${sizeQty}</span>
                                    <button class="order-item-qty-btn basket-qty-btn" data-action="increase" data-basket-index="${basketIndex}" data-size="${size}">+</button>
                                </div>
                                <div class="order-item-price">${sizeQty} � ${formatCurrency(unitPrice)} = <strong>${formatCurrency(sizeTotal)}</strong> ${vatSuffix()}</div>
                            </div>
                            <button class="order-item-delete basket-delete" data-basket-index="${basketIndex}" data-size="${size}" title="Remove size">
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <polyline points="3 6 5 6 21 6"></polyline>
                                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                                </svg>
                            </button>
                        </div>
                    `;
                });
            } else {
                // Single size item (legacy format)
                const sizesStr = item.size ? `${itemQty}�${item.size}` : `${itemQty} pcs`;
                const itemTotal = itemQty * unitPrice;
                
                itemsHtml += `
                    <div class="order-item-card basket-item" data-basket-index="${basketIndex}">
                        <img src="${colorImage}" alt="${productName}" class="order-item-image">
                        <div class="order-item-details">
                            <div class="order-item-name">${productName}</div>
                            <div class="order-item-meta">${itemCode} - ${colorName}</div>
                            <div class="order-item-size">${sizesStr}</div>
                            ${customizationsHtml}
                            <div class="order-item-price">${itemQty} � ${formatCurrency(unitPrice)} = <strong>${formatCurrency(itemTotal)}</strong> ${vatSuffix()}</div>
                        </div>
                        <button class="order-item-delete basket-delete" data-basket-index="${basketIndex}" title="Remove from basket">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <polyline points="3 6 5 6 21 6"></polyline>
                                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                            </svg>
                        </button>
                    </div>
                `;
            }
        });
        
        // PART 2: Show current selection (not yet saved to basket)
        const unitPrice = getUnitPrice(state.quantity);
        const productName = state.product?.name || 'Gildan Softstyle Hoodie';
        const productCode = state.product?.code || 'GD067';
        const colorName = state.selectedColorName || 'Black';
        const colorImage = state.selectedColorImage || 'https://i.postimg.cc/R0ds95rf/GD067-Black-FT.jpg';
        
        // Build current selection customizations
        let currentCustomizationsHtml = '';
        if (state.positionMethods && Object.keys(state.positionMethods).length > 0) {
            currentCustomizationsHtml = '<div class="order-item-customizations">';
            Object.entries(state.positionMethods).forEach(([position, method]) => {
                const posName = position.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
                const methodName = method === 'embroidery' ? 'Embroidery' : 'Print';
                const custPrice = method === 'embroidery' ? 5.00 : 3.50;
                const currentQty = state.quantity || 0;
                const custTotal = currentQty * custPrice;
                currentCustomizationsHtml += `
                    <div class="customization-badge-mini">
                        <span class="badge-icon">${methodName === 'Embroidery' ? '??' : '???'}</span>
                        <span class="badge-text">${posName} - ${methodName}</span>
                        <span class="badge-price">${currentQty} � ${formatCurrency(custPrice)} = ${formatCurrency(custTotal)}</span>
                    </div>
                `;
            });
            currentCustomizationsHtml += '</div>';
        }
        
        // Generate item cards for each size in current selection
        Object.entries(state.sizeQuantities || {}).forEach(([size, qty]) => {
            if (qty <= 0) return;
            
            const itemTotal = qty * unitPrice;
            
            itemsHtml += `
                <div class="order-item-card current-selection" data-size="${size}">
                    <img src="${colorImage}" alt="${productName}" class="order-item-image">
                    <div class="order-item-details">
                        <div class="order-item-name">${productName}</div>
                        <div class="order-item-meta">${productCode} - ${colorName}</div>
                        <div class="order-item-size">${qty}�${size}</div>
                        ${currentCustomizationsHtml}
                        <div class="order-item-qty-control">
                            <button class="order-item-qty-btn" data-action="decrease" data-size="${size}">-</button>
                            <span class="order-item-qty-value">${qty}</span>
                            <button class="order-item-qty-btn" data-action="increase" data-size="${size}">+</button>
                        </div>
                        <div class="order-item-price">${qty} � ${formatCurrency(unitPrice)} = <strong>${formatCurrency(itemTotal)}</strong> ${vatSuffix()}</div>
                    </div>
                    <button class="order-item-delete" data-size="${size}" title="Remove">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <polyline points="3 6 5 6 21 6"></polyline>
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                        </svg>
                    </button>
                </div>
            `;
        });
        
        if (!itemsHtml) {
            itemsHtml = '<div class="order-item-card"><p style="color: var(--gray-500); text-align: center; width: 100%;">No items added yet. Select sizes above.</p></div>';
        }
        
        listContainer.innerHTML = itemsHtml;
        
        // Add event listeners for basket delete buttons
        listContainer.querySelectorAll('.basket-delete').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const basketIndex = parseInt(btn.dataset.basketIndex);
                let basket = JSON.parse(localStorage.getItem('quoteBasket') || '[]');
                basket.splice(basketIndex, 1);
                localStorage.setItem('quoteBasket', JSON.stringify(basket));
                
                // Update UI
                updateOrderCardItemsList();
                // updateOrderCard(); // REMOVED
                updatePricingTiers();
                updateCartBadge();
                
                if (navigator.vibrate) navigator.vibrate(10);
                showToast('Item removed from basket');
            });
        });
        
        // Add event listeners for BASKET item qty buttons (+/-)
        listContainer.querySelectorAll('.basket-qty-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const basketIndex = parseInt(btn.dataset.basketIndex);
                const size = btn.dataset.size;
                const action = btn.dataset.action;
                
                let basket = JSON.parse(localStorage.getItem('quoteBasket') || '[]');
                if (!basket[basketIndex]) return;
                
                const item = basket[basketIndex];
                if (!item.quantities) item.quantities = {};
                
                if (action === 'increase') {
                    item.quantities[size] = (item.quantities[size] || 0) + 1;
                } else if (action === 'decrease') {
                    if (item.quantities[size] > 1) {
                        item.quantities[size] -= 1;
                    } else {
                        // Remove size if qty becomes 0
                        delete item.quantities[size];
                    }
                }
                
                // Recalculate totalQty for this item
                item.totalQty = Object.values(item.quantities).reduce((sum, q) => sum + q, 0);
                
                // If no sizes left, remove the entire item
                if (item.totalQty === 0) {
                    basket.splice(basketIndex, 1);
                    showToast('Item removed from basket');
                }
                
                // Save back to localStorage
                localStorage.setItem('quoteBasket', JSON.stringify(basket));
                
                console.log('?? Basket updated, recalculating totals...');
                
                // Update UI - DON'T recreate entire list, just update the specific row
                const row = btn.closest('.order-item-card');
                if (row) {
                    const qtyDisplay = row.querySelector('.order-item-qty-value');
                    const newQty = item.quantities[size] || 0;
                    if (qtyDisplay) qtyDisplay.textContent = newQty;
                    
                    // Update price
                    const priceEl = row.querySelector('.order-item-price');
                    const unitPrice = parseFloat(item.unitPrice || item.price) || 0;
                    const newTotal = newQty * unitPrice;
                    if (priceEl) {
                        priceEl.innerHTML = `${newQty} � ${formatCurrency(unitPrice)} = <strong>${formatCurrency(newTotal)}</strong> ${vatSuffix()}`;
                    }
                }
                
                // Update totals without recreating HTML
                // updateOrderCard(); // REMOVED
                updatePricingSummary();
                updatePricingTiers();
                updateLiveBadge();
                updateCartBadge();
                
                console.log('? All updates complete');
                
                if (navigator.vibrate) navigator.vibrate(5);
            });
        });
        
        // Add event listeners for current selection qty buttons (NOT basket)
        listContainer.querySelectorAll('.order-item-qty-btn:not(.basket-qty-btn)').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const size = btn.dataset.size;
                const action = btn.dataset.action;
                
                if (action === 'increase') {
                    state.sizeQuantities[size] = (state.sizeQuantities[size] || 0) + 1;
                } else if (action === 'decrease' && state.sizeQuantities[size] > 1) {
                    state.sizeQuantities[size] -= 1;
                }
                
                // Recalculate total quantity
                state.quantity = Object.values(state.sizeQuantities).reduce((sum, q) => sum + q, 0);
                
                // Update UI
                updateOrderCardItemsList();
                updateOrderCard();
                updatePricingSummary();
                updatePricingTiers();
                syncSizeSelectionUI();
                
                if (navigator.vibrate) navigator.vibrate(5);
            });
        });
        
        // Add event listeners for delete buttons (current selection only)
        listContainer.querySelectorAll('.order-item-delete:not(.basket-delete)').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const size = btn.dataset.size;
                delete state.sizeQuantities[size];
                
                // Recalculate total quantity
                state.quantity = Object.values(state.sizeQuantities).reduce((sum, q) => sum + q, 0);
                
                // Update UI
                updateOrderCardItemsList();
                updateOrderCard();
                updatePricingSummary();
                updatePricingTiers();
                syncSizeSelectionUI();
                
                if (navigator.vibrate) navigator.vibrate(10);
                showToast('Item removed');
            });
        });
    }
    
    function syncSizeSelectionUI() {
        // Sync the size selection section with updated quantities
        // Since we use event delegation, no need to re-setup listeners
        updateSizeQuantities();
    }
    
    function calculateSubtotal() {
        const qty = state.quantity || 0;
        const unitPrice = getUnitPrice(qty);
        const garmentTotal = qty * unitPrice;
        
        // Calculate customization costs
        let customTotal = 0;
        if (state.positions && state.positions.length > 0) {
            state.positions.forEach(pos => {
                const method = state.positionMethods?.[pos] || 'embroidery';
                const card = document.querySelector(`.position-card[data-position="${pos}"], .position-card input[value="${pos}"]`)?.closest('.position-card');
                const price = method === 'print' 
                    ? parseFloat(card?.dataset?.print || 3.50)
                    : parseFloat(card?.dataset?.embroidery || 5.00);
                customTotal += price * qty;
            });
        }
        
        return garmentTotal + customTotal;
    }

    // === VAT Toggle Setup ===
    function setupVatToggle() {
        // VAT toggle click is handled by mobile.js
        // We just initialize state and listen for the global event
        state.vatIncluded = isVatOn();
        
        // Listen for VAT toggle changes from mobile.js
        window.addEventListener('vatToggleChanged', function(e) {
            state.vatIncluded = e.detail.vatOn;
            state.isVatToggling = true; // Flag to prevent auto-scroll
            updateVatToggleUI();
            updatePricingTiers();
            updatePricingSummary();
            updateOrderCardItemsList(); // Update item prices in order card
            updateOrderCard(); // Update order card total
            state.isVatToggling = false;
        });
    }

    // === Update Pricing Tiers Display ===
    function updatePricingTiers() {
        const tiersContainer = document.getElementById('pricingTiers');
        if (!tiersContainer) return;

        const tiers = [
            { min: 1, max: 9, label: '1-9' },
            { min: 10, max: 24, label: '10-24' },
            { min: 25, max: 49, label: '25-49' },
            { min: 50, max: 99, label: '50-99' },
            { min: 100, max: 249, label: '100-249' },
            { min: 250, max: Infinity, label: '250+' }
        ];

        // Use cumulative quantity (current + basket) for tier highlighting
        const basketQty = getBasketQuantityForProduct(state.product.code);
        const totalQty = state.quantity + basketQty;

        // Get priceBreaks DIRECTLY from API - no sessionStorage, no modifications
        const priceBreaks = state.product.priceBreaks || [];
        const vatOn = isVatOn();
        const basePrice = state.product.basePrice || state.product.price || 0;

        tiersContainer.innerHTML = tiers.map(tier => {
            // Find matching priceBreak from API by matching min value exactly
            let rawPrice = basePrice; // fallback to basePrice
            const matchingBreak = priceBreaks.find(pb => pb.min === tier.min);
            
            if (matchingBreak) {
                rawPrice = Number(matchingBreak.price || matchingBreak.unitPrice || matchingBreak.rate || basePrice);
            }
            
            // Apply VAT ONLY if VAT toggle is ON, otherwise use raw price
            const displayPrice = vatOn ? rawPrice * (1 + VAT_RATE) : rawPrice;
            
            // Calculate discount percentage compared to first tier (1-9)
            const firstTierBreak = priceBreaks.find(pb => pb.min === 1) || priceBreaks[0];
            const firstTierPrice = firstTierBreak ? Number(firstTierBreak.price || firstTierBreak.unitPrice || firstTierBreak.rate || basePrice) : basePrice;
            const discount = firstTierPrice > 0 && rawPrice < firstTierPrice 
                ? Math.round(((firstTierPrice - rawPrice) / firstTierPrice) * 100) 
                : 0;
            
            // Highlight tier based on TOTAL quantity (current + basket)
            const isActive = totalQty >= tier.min && (tier.max === Infinity || totalQty <= tier.max);
            
            return `
                <div class="tier-card ${isActive ? 'active' : ''}" data-min="${tier.min}" data-max="${tier.max === Infinity ? '999999' : tier.max}">
                    <div class="tier-qty">${tier.label}</div>
                    <div class="tier-price">�${displayPrice.toFixed(2)}</div>
                    <div class="tier-suffix">${vatSuffix()}</div>
                    ${discount > 0 ? `<div class="tier-save">SAVE ${discount}%</div>` : ''}
                </div>
            `;
        }).join('');
        
        // Update basket quantity notice
        const basketNotice = document.getElementById('basketQtyNotice');
        const basketQtyCount = document.getElementById('basketQtyCount');
        if (basketNotice && basketQtyCount) {
            if (basketQty > 0) {
                basketQtyCount.textContent = basketQty;
                basketNotice.style.display = 'flex';
            } else {
                basketNotice.style.display = 'none';
            }
        }
        
        // DISABLED: No auto-scroll - user stays where they are
        // if (state.quantity > 0 && !state.isSelectingPosition && !state.isVatToggling && !state.isUpdatingQuantity) {
        //     setTimeout(() => {
        //         const activeTier = tiersContainer.querySelector('.tier-card.active');
        //         if (activeTier) {
        //             const rect = activeTier.getBoundingClientRect();
        //             const isVisible = rect.top >= 0 && rect.bottom <= window.innerHeight;
        //             if (!isVisible) {
        //                 activeTier.scrollIntoView({ 
        //                     behavior: 'smooth', 
        //                     block: 'nearest',
        //                     inline: 'center'
        //                 });
        //             }
        //         }
        //     }, 100);
        // }
    }

    // === Color Selection ===
    function setupColorSelection() {
        const colorOptions = document.getElementById('colorOptions');
        if (!colorOptions) {
            console.error('? colorOptions not found in setupColorSelection');
            return;
        }

        colorOptions.addEventListener('click', (e) => {
            const btn = e.target.closest('.color-btn');
            if (!btn) return;
            
            // Check if same color is clicked
            if (btn.dataset.color === state.selectedColor) return;

            // Check if there are sizes selected
            const hasSelection = Object.values(state.sizeQuantities || {}).some(qty => qty > 0);
            
            // Only show confirmation if has selection AND not yet saved
            if (hasSelection && !state.selectionSaved) {
                showColorChangeConfirm(btn);
                return;
            }

            // If already saved or no selection, clear and proceed directly
            if (hasSelection && state.selectionSaved) {
                clearSizeSelection();
            }
            
            applyColorChange(btn);
        });
    }
    
    // Show confirmation dialog before changing color
    function showColorChangeConfirm(btn) {
        // Remove existing modal to force fresh creation
        const existingModal = document.getElementById('colorChangeModal');
        if (existingModal) existingModal.remove();
        
        // Create modal
        const modal = document.createElement('div');
        modal.id = 'colorChangeModal';
        modal.className = 'modal-overlay';
        modal.innerHTML = `
            <div class="modal-content confirm-modal">
                <div class="confirm-icon">??</div>
                <h3>Save Your Selection?</h3>
                <p>You have <strong id="modalQtyCount">0</strong> items selected in <strong id="modalColorName">this colour</strong>.</p>
                <p class="confirm-subtitle">What would you like to do?</p>
                <div class="confirm-actions-vertical">
                    <button class="confirm-btn save-continue">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/>
                            <polyline points="17 21 17 13 7 13 7 21"/>
                            <polyline points="7 3 7 8 15 8"/>
                        </svg>
                        Save to Quote & Continue
                    </button>
                    <button class="confirm-btn discard">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <polyline points="3 6 5 6 21 6"/>
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                        </svg>
                        Discard & Change Colour
                    </button>
                    <button class="confirm-btn cancel-link">Cancel</button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
        
        // Add styles if not present
        if (!document.getElementById('confirmModalStyles')) {
            const style = document.createElement('style');
            style.id = 'confirmModalStyles';
            style.textContent = `
                .confirm-modal {
                    text-align: center;
                    padding: 24px;
                    max-width: 320px;
                }
                .confirm-icon {
                    font-size: 48px;
                    margin-bottom: 12px;
                }
                .confirm-modal h3 {
                    margin: 0 0 12px;
                    font-size: 20px;
                    font-weight: 700;
                    color: #1a1a2e;
                }
                .confirm-modal p {
                    margin: 0 0 8px;
                    font-size: 14px;
                    color: #666;
                }
                .confirm-modal p strong {
                    color: #7c3aed;
                }
                .confirm-subtitle {
                    margin-top: 12px !important;
                    font-size: 13px !important;
                    color: #999 !important;
                }
                .confirm-actions-vertical {
                    display: flex;
                    flex-direction: column;
                    gap: 10px;
                    margin-top: 16px;
                }
                .confirm-btn {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 8px;
                    padding: 14px 16px;
                    border-radius: 12px;
                    font-weight: 600;
                    font-size: 14px;
                    border: none;
                    cursor: pointer;
                    transition: all 0.2s;
                }
                .confirm-btn.save-continue {
                    background: linear-gradient(135deg, #7c3aed 0%, #6b21a8 100%);
                    color: white;
                }
                .confirm-btn.save-continue:active {
                    transform: scale(0.98);
                }
                .confirm-btn.discard {
                    background: #fff;
                    color: #666;
                    border: 1px solid #e5e5e5;
                }
                .confirm-btn.discard:active {
                    background: #f5f5f5;
                }
                .confirm-btn.cancel-link {
                    background: transparent;
                    color: #999;
                    font-weight: 500;
                    padding: 8px;
                }
            `;
            document.head.appendChild(style);
        }
        
        // Update modal content with current selection info
        const modalQtyCount = modal.querySelector('#modalQtyCount');
        const modalColorName = modal.querySelector('#modalColorName');
        if (modalQtyCount) modalQtyCount.textContent = state.quantity || 0;
        if (modalColorName) modalColorName.textContent = state.selectedColorName || 'this colour';
        
        // Show modal
        modal.classList.add('active');
        
        // Handle buttons
        const saveBtn = modal.querySelector('.confirm-btn.save-continue');
        const discardBtn = modal.querySelector('.confirm-btn.discard');
        const cancelBtn = modal.querySelector('.confirm-btn.cancel-link');
        
        const closeModal = () => {
            modal.classList.remove('active');
        };
        
        cancelBtn.onclick = closeModal;
        modal.onclick = (e) => {
            if (e.target === modal) closeModal();
        };
        
        // Save to quote, then change colour
        saveBtn.onclick = () => {
            // Add current selection to basket (silent = no second popup)
            addToQuote({ silent: true });
            
            // Visual feedback: change button to "Saved to Quote" with checkmark
            saveBtn.innerHTML = `
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
                    <polyline points="20 6 9 17 4 12"/>
                </svg>
                Saved to Quote!
            `;
            saveBtn.style.background = 'linear-gradient(135deg, #16a34a 0%, #15803d 100%)';
            saveBtn.disabled = true;
            
            // After a short delay, close modal and change colour
            setTimeout(() => {
                closeModal();
                clearSizeSelection();
                applyColorChange(btn);
            }, 800);
        };
        
        // Discard and change colour
        discardBtn.onclick = () => {
            closeModal();
            // Clear size selection and apply color change
            clearSizeSelection();
            applyColorChange(btn);
        };
    }
    
    // Clear all size selections and optionally positions
    function clearSizeSelection(clearPositions = true) {
        state.sizeQuantities = {};
        state.quantity = 0;
        
        // Remove all size rows from UI
        const selectedSizes = document.querySelector('.selected-sizes');
        if (selectedSizes) {
            selectedSizes.innerHTML = '';
        }
        
        // Update totals - show basket qty even when current selection is 0
        const totalSpan = document.getElementById('totalQty');
        if (totalSpan) {
            const basketQty = getBasketQuantityForProduct(state.product.code);
            totalSpan.textContent = basketQty;
        }
        
        // Also clear position selections when saving to quote
        if (clearPositions) {
            // Reset all position checkboxes
            document.querySelectorAll('.position-card input[type="checkbox"]').forEach(checkbox => {
                if (checkbox.checked) {
                    checkbox.checked = false;
                    const card = checkbox.closest('.position-card');
                    if (card) {
                        card.classList.remove('selected');
                        // Reset badges
                        const embBadge = card.querySelector('.price-emb');
                        const printBadge = card.querySelector('.price-print');
                        if (embBadge) resetPriceBadge(embBadge);
                        if (printBadge) resetPriceBadge(printBadge);
                        
                        // Hide preview
                        const previewContent = card.querySelector('.position-preview-content');
                        const placeholder = card.querySelector('.position-placeholder');
                        const pill = card.querySelector('.customization-pill');
                        if (previewContent) previewContent.hidden = true;
                        if (placeholder) placeholder.hidden = false;
                        if (pill) pill.hidden = true;
                    }
                }
            });
            
            // Clear position state
            state.positions = [];
            state.positionMethods = {};
            state.positionCustomizations = {};
            state.positionDesigns = {};
        }
        
        updatePricingTiers();
        updatePricingSummary();
        updateLiveBadge();
        updateQuoteButtonState();
    }
    
    // Apply color change
    function applyColorChange(btn) {
        const colorOptions = document.getElementById('colorOptions');
        
        // Update state
        const colorData = PRODUCT_COLORS.find(c => c.id === btn.dataset.color);
        if (colorData) {
            state.selectedColor = colorData.id;
            state.selectedColorName = colorData.name;
            state.selectedColorImage = colorData.image;
            
            // Update main gallery image with cache buster
            const mainImage = document.getElementById('mainImage') || document.querySelector('.gallery-main img');
            if (mainImage) {
                mainImage.src = '';
                const cacheBuster = '_t=' + Date.now();
                mainImage.src = colorData.image + (colorData.image.includes('?') ? '&' : '?') + cacheBuster;
                if (state.product?.name) {
                    mainImage.alt = state.product.name;
                }
            }
            
            // Update gallery thumbnails with new color
            const galleryThumbs = document.querySelectorAll('.gallery-thumbs .thumb');
            if (galleryThumbs.length > 0) {
                const thumbImage = colorData.thumb || colorData.image;
                galleryThumbs.forEach((thumb) => {
                    const thumbImg = thumb.querySelector('img');
                    if (thumbImg && thumbImage) {
                        thumbImg.src = '';
                        const cacheBuster = '_t=' + Date.now();
                        thumbImg.src = thumbImage + (thumbImage.includes('?') ? '&' : '?') + cacheBuster;
                        const view = thumb.getAttribute('data-view') || 'product';
                        thumbImg.alt = `${state.product?.name || 'Product'} - ${view.charAt(0).toUpperCase() + view.slice(1)}`;
                    }
                });
            }
        }
        
        // Update UI
        colorOptions.querySelectorAll('.color-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        
        // Update label
        const selectedColorEl = document.getElementById('selectedColor');
        if (selectedColorEl) {
            selectedColorEl.textContent = state.selectedColorName;
        }

        // Haptic feedback
        if (navigator.vibrate) navigator.vibrate(10);

        // Update summary
        updatePricingSummary();
    }

    // Render color buttons with product thumbnails
    function renderColorButtons() {
        const colorOptions = document.getElementById('colorOptions');
        if (!colorOptions) {
            console.error('? colorOptions element not found!');
            return;
        }
        
        console.log('?? Rendering', PRODUCT_COLORS.length, 'colors...');
        console.log('?? First color image:', PRODUCT_COLORS[0]?.image);
        
        if (PRODUCT_COLORS.length === 0) {
            console.warn('?? No colors to render!');
            colorOptions.innerHTML = '<p style="color: #6b7280; padding: 16px;">No colors available</p>';
            return;
        }
        
        colorOptions.innerHTML = PRODUCT_COLORS.map((color, index) => {
            // Use color image with cache buster to prevent showing cached images from other products
            const imageUrl = color.image || '';
            const cacheBuster = imageUrl ? (imageUrl.includes('?') ? '&' : '?') + '_t=' + Date.now() + '_' + index : '';
            const fullImageUrl = imageUrl + cacheBuster;
            
            return `
            <button class="color-btn ${color.id === state.selectedColor ? 'active' : ''}" 
                    data-color="${color.id}" 
                    data-name="${color.name}"
                    style="background-image: url('${fullImageUrl}'); background-size: cover; background-position: center;">
                <svg class="color-check" width="14" height="14" viewBox="0 0 24 24" fill="white">
                    <polyline points="20 6 9 17 4 12" stroke="white" stroke-width="3" fill="none"/>
                </svg>
            </button>
        `;
        }).join('');

        // Update color count
        const colorCount = document.querySelector('.color-count');
        if (colorCount) {
            colorCount.textContent = `${PRODUCT_COLORS.length} colors`;
        }
        
        // Re-render color thumbnails in gallery when colors are updated
        renderColorThumbnails();
        
        console.log('? Colors rendered successfully!');
    }

    // Render color thumbnails in gallery (showing different color variants)
    function renderColorThumbnails() {
        const galleryThumbsContainer = document.getElementById('galleryThumbsContainer') || document.querySelector('.gallery-thumbs');
        if (!galleryThumbsContainer) {
            console.warn('?? Gallery thumbs container not found');
            return;
        }

        if (!PRODUCT_COLORS || PRODUCT_COLORS.length === 0) {
            console.warn('?? No colors available for thumbnails');
            return;
        }

        console.log('?? Rendering', PRODUCT_COLORS.length, 'color thumbnails in gallery...');

        // Clear existing thumbnails
        galleryThumbsContainer.innerHTML = '';

        // Create thumbnails for each color
        PRODUCT_COLORS.forEach((color, index) => {
            const isActive = color.id === state.selectedColor;
            const thumbButton = document.createElement('button');
            thumbButton.className = `thumb ${isActive ? 'active' : ''}`;
            thumbButton.setAttribute('data-color-id', color.id);
            thumbButton.setAttribute('data-color-index', index);
            
            const thumbPlaceholder = document.createElement('div');
            thumbPlaceholder.className = 'thumb-placeholder';
            
            const thumbImg = document.createElement('img');
            const imageUrl = color.thumb || color.image || '';
            if (imageUrl) {
                const cacheBuster = '_t=' + Date.now() + '_' + index;
                thumbImg.src = imageUrl + (imageUrl.includes('?') ? '&' : '?') + cacheBuster;
            }
            thumbImg.alt = `${state.product?.name || 'Product'} - ${color.name}`;
            
            thumbPlaceholder.appendChild(thumbImg);
            thumbButton.appendChild(thumbPlaceholder);
            
            // Add click handler to change main image and selected color
            thumbButton.addEventListener('click', () => {
                // Update active state
                galleryThumbsContainer.querySelectorAll('.thumb').forEach(t => t.classList.remove('active'));
                thumbButton.classList.add('active');
                
                // Update selected color state
                state.selectedColor = color.id;
                state.selectedColorName = color.name;
                state.selectedColorImage = color.image;
                
                // Update main image
                const mainImg = document.getElementById('mainImage');
                if (mainImg && color.image) {
                    mainImg.src = '';
                    const cacheBuster = '_t=' + Date.now();
                    mainImg.src = color.image + (color.image.includes('?') ? '&' : '?') + cacheBuster;
                    mainImg.alt = `${state.product?.name || 'Product'} - ${color.name}`;
                }
                
                // Update selected color label
                const selectedColorEl = document.getElementById('selectedColor');
                if (selectedColorEl) {
                    selectedColorEl.textContent = color.name;
                }
                
                // Update active color button in color options
                const colorOptions = document.getElementById('colorOptions');
                if (colorOptions) {
                    colorOptions.querySelectorAll('.color-btn').forEach(btn => {
                        btn.classList.toggle('active', btn.dataset.color === color.id);
                    });
                }
                
                // Haptic feedback
                if (navigator.vibrate) navigator.vibrate(10);
                
                // Update pricing summary
                updatePricingSummary();
            });
            
            galleryThumbsContainer.appendChild(thumbButton);
        });

        console.log('? Color thumbnails rendered:', PRODUCT_COLORS.length);
    }

    // === Get product sizes from API or fallback ===
    function getProductSizes() {
        // Get sizes from product data
        let sizes = state.product?.sizes || [];
        
        // Normalize: if it's a string, convert to array
        if (typeof sizes === 'string') {
            sizes = [sizes];
        }
        
        // If no sizes from API, use default sizes
        if (!sizes || sizes.length === 0) {
            sizes = ['XS', 'S', 'M', 'L', 'XL', '2XL', '3XL', '4XL', '5XL'];
        }
        
        return sizes;
    }

    // === Add "One size" row with plus/minus quantity selector ===
    function addOneSizeRow(container) {
        const selectedSizes = container.querySelector('.selected-sizes');
        if (!selectedSizes) return;
        
        const newRow = document.createElement('div');
        newRow.className = 'size-qty-item one-size-item';
        newRow.innerHTML = `
            <div class="one-size-label">One Size</div>
            <div class="item-qty-control">
                <button type="button" class="item-qty-btn minus">-</button>
                <input type="number" class="item-qty-input" value="0" min="0" max="999" data-size="One size">
                <button type="button" class="item-qty-btn plus">+</button>
            </div>
        `;
        
        // Store the size value for quantity tracking
        newRow.dataset.size = 'One size';
        
        selectedSizes.appendChild(newRow);
        updateSizeQuantities();
    }

    // === Size/Qty Compact Selection ===
    function setupSizeSelection() {
        const container = document.querySelector('.size-qty-compact');
        if (!container) return;

        // Initialize state for size quantities
        state.sizeQuantities = {};

        // Clear any existing rows (in case browser cached them)
        const selectedSizes = container.querySelector('.selected-sizes');
        if (selectedSizes) {
            selectedSizes.innerHTML = '';
        }

        // Get product sizes from API - fallback to default if not available
        const productSizes = getProductSizes();
        const isOneSize = productSizes.length === 1 && 
            (productSizes[0].toLowerCase() === 'one size' || 
             productSizes[0].toLowerCase() === 'onesize' ||
             productSizes[0].toLowerCase() === 'os');

        // Add size button
        const addBtn = container.querySelector('.add-size-btn');
        
        if (isOneSize) {
            // For "One size" products: hide "Add Size" button and auto-create a row
            if (addBtn) {
                addBtn.style.display = 'none';
            }
            // Auto-add a "One size" row
            addOneSizeRow(container);
            console.log('📐 Product is "One size" - auto-added row with quantity selector');
        } else {
            // For multi-size products: show "Add Size" button
            if (addBtn) {
                addBtn.style.display = '';
                // Remove any existing listener to prevent duplicates
                const newBtn = addBtn.cloneNode(true);
                addBtn.parentNode.replaceChild(newBtn, addBtn);
                
                newBtn.addEventListener('click', () => {
                    addSizeRow(container);
                    if (navigator.vibrate) navigator.vibrate(10);
                });
            }
        }

        // Event delegation for size/qty items
        container.addEventListener('click', (e) => {
            const btn = e.target.closest('.item-qty-btn');
            if (btn) {
                const row = btn.closest('.size-qty-item');
                const input = row.querySelector('.item-qty-input');
                const isPlus = btn.classList.contains('plus');
                let value = parseInt(input.value) || 0;
                
                if (isPlus && value < 999) {
                    value++;
                } else if (!isPlus && value > 0) {
                    value--;
                }
                
                input.value = value;
                updateSizeQuantities();
                if (navigator.vibrate) navigator.vibrate(10);
            }

            const removeBtn = e.target.closest('.remove-size-btn');
            if (removeBtn) {
                const row = removeBtn.closest('.size-qty-item');
                row.remove();
                updateAvailableSizes(container);
                updateSizeQuantities();
                if (navigator.vibrate) navigator.vibrate(10);
            }
        });

    // Extra listeners to ensure any direct input/change triggers a quantities recalculation
    container.addEventListener('input', () => updateSizeQuantities());
    container.addEventListener('change', () => updateSizeQuantities());

        // Event delegation for select and input changes
        container.addEventListener('change', (e) => {
            if (e.target.classList.contains('size-select') || e.target.classList.contains('item-qty-input')) {
                updateSizeQuantities();
            }
        });

        // Save Selection button handler
        const saveBtn = document.getElementById('saveSelectionBtn');
        if (saveBtn) {
            saveBtn.addEventListener('click', () => {
                if (state.quantity > 0) {
                    // Change button to green "Saved to Quote"
                    saveBtn.classList.add('saved');
                    saveBtn.style.background = 'linear-gradient(135deg, #16a34a 0%, #15803d 100%)';
                    saveBtn.innerHTML = `
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M5 13l4 4L19 7"/>
                        </svg>
                        Saved to Quote
                    `;
                    state.selectionSaved = true;
                    
                    if (navigator.vibrate) navigator.vibrate(15);
                }
            });
        }

        // Initial update
        updateSizeQuantities();
    }

    function addSizeRow(container) {
        const selectedSizes = container.querySelector('.selected-sizes');
        
        // Get already selected sizes for this color
        const alreadySelected = new Set();
        selectedSizes.querySelectorAll('.size-select').forEach(select => {
            if (select.value) {
                alreadySelected.add(select.value);
            }
        });
        
        const newRow = document.createElement('div');
        newRow.className = 'size-qty-item';
        
        // Build options excluding already selected sizes - use product sizes from API
        let optionsHTML = '<option value="">Size</option>';
        const allSizes = getProductSizes();
        allSizes.forEach(size => {
            if (!alreadySelected.has(size)) {
                optionsHTML += `<option value="${size}">${size}</option>`;
            }
        });
        
        newRow.innerHTML = `
            <select class="size-select">
                ${optionsHTML}
            </select>
            <div class="item-qty-control">
                <button type="button" class="item-qty-btn minus">-</button>
                <input type="number" class="item-qty-input" value="0" min="0" max="999">
                <button type="button" class="item-qty-btn plus">+</button>
            </div>
            <button type="button" class="remove-size-btn">×</button>
        `;
        
        // Add event listener to update available sizes when a size is selected
        const select = newRow.querySelector('.size-select');
        select.addEventListener('change', function() {
            updateAvailableSizes(container);
        });
        
        selectedSizes.appendChild(newRow);
        updateSizeQuantities();
    }

    // New function to update available sizes across all dropdowns
    function updateAvailableSizes(container) {
        const selectedSizes = container.querySelector('.selected-sizes');
        const allSelects = selectedSizes.querySelectorAll('.size-select');
        const allSizes = getProductSizes(); // Use product sizes from API
        
        // Collect all selected sizes
        const selected = new Set();
        allSelects.forEach(select => {
            if (select.value) {
                selected.add(select.value);
            }
        });
        
        // Update each select to show only available options
        allSelects.forEach(currentSelect => {
            const currentValue = currentSelect.value;
            
            // Build new options
            let optionsHTML = '<option value="">Size</option>';
            allSizes.forEach(size => {
                if (size === currentValue || !selected.has(size)) {
                    const selectedAttr = size === currentValue ? ' selected' : '';
                    optionsHTML += `<option value="${size}"${selectedAttr}>${size}</option>`;
                }
            });
            
            currentSelect.innerHTML = optionsHTML;
        });
    }

    function updateSizeQuantities() {
        const container = document.querySelector('.size-qty-compact');
        if (!container) return;

        console.log('DEBUG: updateSizeQuantities called');
        try { console.log('DEBUG: container exists?', !!container, 'selected sizes count=', container.querySelectorAll('.size-qty-item').length); } catch(e){}

        let total = 0;
        state.sizeQuantities = {};

        container.querySelectorAll('.size-qty-item').forEach(row => {
            const select = row.querySelector('.size-select');
            const input = row.querySelector('.item-qty-input');
            
            // Get size from select OR from data attribute (for "One size" rows)
            let size = '';
            if (select) {
                size = select.value;
            } else if (row.dataset.size) {
                size = row.dataset.size;
            } else if (input && input.dataset.size) {
                size = input.dataset.size;
            }
            
            // Primary: read from input.value
            let qty = 0;
            try {
                if (input) {
                    // prefer numeric value property
                    qty = parseInt(input.value || input.getAttribute('value') || 0) || 0;
                }
            } catch (e) {
                qty = 0;
            }

            // Fallback: some UI variants render the qty as plain text inside buttons/divs
            if ((!qty || qty === 0) && row) {
                // look for data attributes first
                const dataVal = row.querySelector('[data-qty], [data-value]');
                if (dataVal) {
                    const v = dataVal.getAttribute('data-qty') || dataVal.getAttribute('data-value');
                    qty = parseInt(v) || qty;
                }
            }

            if ((!qty || qty === 0) && row) {
                // look for any child element that contains only digits (visible number)
                const children = Array.from(row.querySelectorAll('*'));
                for (const el of children) {
                    try {
                        const text = (el.innerText || '').trim();
                        if (/^\d+$/.test(text)) {
                            qty = parseInt(text, 10) || qty;
                            break;
                        }
                    } catch (e) { /* ignore */ }
                }
            }

            // If no explicit size selected but a quantity exists, count it under 'unspecified'
            let sizeKey = size;
            if ((!sizeKey || sizeKey === '') && qty > 0) {
                sizeKey = 'unspecified';
                console.log('DEBUG: size not selected for a row but quantity present - counting under "unspecified"');
            }

            if (sizeKey && qty > 0) {
                state.sizeQuantities[sizeKey] = (state.sizeQuantities[sizeKey] || 0) + qty;
                total += qty;
            }
        });

        // Update total display - show current selection + basket items
        const totalSpan = document.getElementById('totalQty');
        if (totalSpan) {
            // Get basket qty for this product
            const basketQty = getBasketQuantityForProduct(state.product.code);
            totalSpan.textContent = total + basketQty;
        }

        // Update global quantity for pricing
        state.quantity = total;
        
        // Always show Save Selection button, but disable if no selection
        const saveBtn = document.getElementById('saveSelectionBtn');
        if (saveBtn) {
            // Always visible
            saveBtn.style.display = 'flex';
            
            if (total > 0) {
                // Has selection - enable and mark as unsaved
                console.log('DEBUG: enabling save button, total=', total);
                saveBtn.disabled = false;
                saveBtn.classList.remove('saved');
                saveBtn.style.opacity = '1';
                saveBtn.style.cursor = 'pointer';
                saveBtn.innerHTML = `
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M5 13l4 4L19 7"/>
                    </svg>
                    Save & Continue
                `;
                state.selectionSaved = false;
            } else {
                // No selection - disable button
                console.log('DEBUG: disabling save button, total=', total);
                saveBtn.disabled = true;
                saveBtn.classList.remove('saved');
                saveBtn.style.opacity = '0.5';
                saveBtn.style.cursor = 'not-allowed';
                saveBtn.innerHTML = `
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M5 13l4 4L19 7"/>
                    </svg>
                    Save & Continue
                `;
                state.selectionSaved = true;
            }
        }
        
        // Set flag to prevent auto-scroll when updating quantities
        state.isUpdatingQuantity = true;
        updatePricingTiers();  // Rebuild tiers with correct active state
        updatePricingSummary();
        state.isUpdatingQuantity = false;
        
        // Update live badge with current selection
        updateLiveBadge();
        
        // Update Add to Quote button state
        updateQuoteButtonState();
    }

    // === Quantity Control ===
    function setupQuantityControl() {
        if (!elements.qtyInput) return;

        elements.qtyMinus?.addEventListener('click', () => {
            const current = parseInt(elements.qtyInput.value) || 1;
            if (current > 1) {
                state.quantity = current - 1;
                elements.qtyInput.value = state.quantity;
                updatePricingTier();
                updatePricingSummary();
            }
        });

        elements.qtyPlus?.addEventListener('click', () => {
            const current = parseInt(elements.qtyInput.value) || 1;
            if (current < 9999) {
                state.quantity = current + 1;
                elements.qtyInput.value = state.quantity;
                updatePricingTier();
                updatePricingSummary();
            }
        });

        elements.qtyInput.addEventListener('change', () => {
            let value = parseInt(elements.qtyInput.value) || 1;
            value = Math.max(1, Math.min(9999, value));
            state.quantity = value;
            elements.qtyInput.value = value;
            updatePricingTier();
            updatePricingSummary();
        });
    }

    // === Pricing Tier ===
    function updatePricingTier() {
        if (!elements.pricingTiers) return;

        // Support both old (.pricing-tier) and new (.tier-card) selectors
        const tiers = elements.pricingTiers.querySelectorAll('.tier-card, .pricing-tier');
        
        tiers.forEach(tier => {
            const min = parseInt(tier.dataset.min) || 0;
            const max = parseInt(tier.dataset.max) || 999999;
            const isActive = state.quantity >= min && state.quantity <= max;
            tier.classList.toggle('active', isActive);
        });
    }

    function getCurrentUnitPrice() {
        return getDiscountedUnitPrice(state.quantity);
    }

    // === Technique Selection ===
    function setupTechniqueSelection() {
        if (!elements.techniqueOptions) return;

        elements.techniqueOptions.addEventListener('click', (e) => {
            // Support both old .technique-btn and new .technique-pill
            const btn = e.target.closest('.technique-btn, .technique-pill');
            if (!btn) return;

            // Update state
            state.technique = btn.dataset.technique;
            
            // Update UI
            elements.techniqueOptions.querySelectorAll('.technique-btn, .technique-pill').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            // Update description (if exists)
            if (elements.techniqueDesc) {
                elements.techniqueDesc.innerHTML = `<p>${state.techniqueDescriptions[state.technique]}</p>`;
            }

            // Haptic feedback
            if (navigator.vibrate) navigator.vibrate(10);

            updatePricingSummary();
        });
    }

    // === Quick Upload ===
    function setupQuickUpload() {
        const uploadInput = document.getElementById('quickLogoUpload');
        const previewContainer = document.getElementById('quickUploadPreview');
        const previewImg = document.getElementById('quickPreviewImg');
        const uploadZone = document.getElementById('quickUploadZone');
        const removeBtn = document.getElementById('removeUpload');
        
        if (!uploadInput) return;

        uploadInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (!file) return;

            // Show preview for images
            if (file.type.startsWith('image/')) {
                const reader = new FileReader();
                reader.onload = (ev) => {
                    previewImg.src = ev.target.result;
                    previewContainer.style.display = 'flex';
                    uploadZone.querySelector('.upload-prompt').style.display = 'none';
                };
                reader.readAsDataURL(file);
            } else {
                // For non-image files, show filename
                previewImg.src = '';
                previewImg.alt = file.name;
                previewContainer.style.display = 'flex';
                uploadZone.querySelector('.upload-prompt').style.display = 'none';
            }

            state.uploadedLogo = file;
            if (navigator.vibrate) navigator.vibrate(10);
            showToast('Logo uploaded!');
        });

        if (removeBtn) {
            removeBtn.addEventListener('click', () => {
                uploadInput.value = '';
                previewContainer.style.display = 'none';
                uploadZone.querySelector('.upload-prompt').style.display = 'flex';
                state.uploadedLogo = null;
                if (navigator.vibrate) navigator.vibrate(10);
            });
        }
    }

    // === Delete Logo Buttons in Position Cards ===
    function setupDeleteLogoButtons() {
        document.querySelectorAll('.delete-logo-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const card = btn.closest('.position-card');
                if (!card) return;
                
                const checkbox = card.querySelector('input[type="checkbox"]');
                const position = card.dataset.position || checkbox?.value;
                
                // Deseleziona la checkbox e triggera il reset completo
                if (checkbox && checkbox.checked) {
                    checkbox.checked = false;
                    checkbox.dispatchEvent(new Event('change'));
                }
                
                // Hide the logo from product preview
                const uploadedLogoPreview = card.querySelector('.uploaded-logo-preview');
                if (uploadedLogoPreview) {
                    uploadedLogoPreview.src = '';
                    uploadedLogoPreview.hidden = true;
                }
                
                // Hide the logo container below product
                const uploadedLogoContainer = card.querySelector('.uploaded-logo-container');
                if (uploadedLogoContainer) {
                    uploadedLogoContainer.hidden = true;
                }
                
                // Reset uploaded logo thumb
                const uploadedLogoThumb = card.querySelector('.uploaded-logo-thumb');
                if (uploadedLogoThumb) {
                    uploadedLogoThumb.src = '';
                }
                
                // Reset customization pill
                const pill = card.querySelector('.customization-pill');
                if (pill) {
                    pill.hidden = true;
                }
                
                // Reset logo added pill
                const logoAddedPill = card.querySelector('.logo-added-pill');
                if (logoAddedPill) {
                    logoAddedPill.hidden = true;
                }
                
                // Remove from state
                if (state.positionDesigns && state.positionDesigns[position]) {
                    delete state.positionDesigns[position];
                }
                if (state.positionCustomizations && state.positionCustomizations[position]) {
                    delete state.positionCustomizations[position];
                }
                if (state.positionMethods && state.positionMethods[position]) {
                    delete state.positionMethods[position];
                }
                
                // Reset price badges
                const embBadge = card.querySelector('.price-emb');
                const printBadge = card.querySelector('.price-print');
                if (embBadge) {
                    embBadge.classList.remove('active', 'add-logo-btn', 'logo-added');
                    embBadge.dataset.role = 'method';
                }
                if (printBadge) {
                    printBadge.classList.remove('active', 'add-logo-btn', 'logo-added');
                    printBadge.dataset.role = 'method';
                }
                
                // Update pricing
                updatePricingTiers();
                updatePricingSummary();
                
                // Show toast
                showToast('Customization removed');
                
                // Haptic feedback
                if (navigator.vibrate) navigator.vibrate(10);
            });
        });
    }

    // === Position Selection ===
    function setupPositionSelection() {
        const cards = document.querySelectorAll('.position-card');
        console.log('?? setupPositionSelection called. Found', cards.length, 'position cards');
        
        cards.forEach(card => {
            const checkbox = card.querySelector('input[type="checkbox"]');
            const position = checkbox ? checkbox.value : null;
            
            if (!position) {
                console.warn('?? Card missing checkbox or position value:', card);
                return;
            }
            
            console.log('? Setting up position:', position);
            
            // Initialize position method storage
            if (!state.positionMethods) {
                state.positionMethods = {};
            }
            
            // Click handler for price badges (EMBROIDERY/PRINT buttons)
            card.querySelectorAll('.price-badge').forEach(badge => {
                console.log('?? Attaching click handler to badge:', badge.dataset.method, 'for position:', position);
                badge.addEventListener('click', (e) => {
                    console.log('??? BADGE CLICKED!', badge.dataset.method, 'for position:', position);
                    e.stopPropagation();
                    
                    const role = badge.dataset.role || 'method';
                    
                    // Handle "Add Logo" button click
                    if (role === 'add-logo') {
                        const activeMethod = badge.dataset.activeMethod || state.positionMethods[position];
                        if (!activeMethod) return;
                        
                        if (!checkbox.checked) {
                            checkbox.checked = true;
                            checkbox.dispatchEvent(new Event('change'));
                        }
                        
                        // Open customization modal
                        openCustomizationModal(position, activeMethod);
                        return;
                    }
                    
                    const method = badge.dataset.method; // 'embroidery' or 'print'
                    if (!method) return;
                    
                    // Check if this is a POA badge (disabled for embroidery on large positions)
                    const isPOA = badge.classList.contains('poa-badge') || badge.querySelector('.price-value')?.textContent === 'POA';
                    if (isPOA) {
                        // Show toast notification for POA
                        showToast('Price On Application - Contact us for a custom quote');
                        if (navigator.vibrate) navigator.vibrate([10, 50, 10]);
                        return; // Don't allow selection
                    }
                    
                    // Check if this badge is already active (allow toggle off)
                    const isCurrentlyActive = badge.classList.contains('active');
                    
                    if (isCurrentlyActive) {
                        // Deselect: uncheck the position and reset
                        checkbox.checked = false;
                        card.classList.remove('selected');
                        
                        // Reset badges
                        const embBadge = card.querySelector('.price-emb');
                        const printBadge = card.querySelector('.price-print');
                        resetPriceBadge(embBadge);
                        resetPriceBadge(printBadge);
                        
                        // Clear position method and customization data
                        delete state.positionMethods[position];
                        if (state.positionCustomizations) {
                            delete state.positionCustomizations[position];
                        }
                        if (state.positionDesigns) {
                            delete state.positionDesigns[position];
                        }
                        
                        // Hide and clear customization preview
                        const previewContent = card.querySelector('.position-preview-content');
                        const placeholder = card.querySelector('.position-placeholder');
                        const pill = card.querySelector('.customization-pill');
                        const previewImage = card.querySelector('.preview-image');
                        const previewText = card.querySelector('.preview-text');
                        
                        // Pulisci anche il logo overlay sul prodotto
                        const logoOverlayBox = card.querySelector('.logo-overlay-box');
                        const logoOverlayImg = card.querySelector('.logo-overlay-img');
                        if (logoOverlayBox) {
                            logoOverlayBox.hidden = true;
                        }
                        if (logoOverlayImg) {
                            logoOverlayImg.src = '';
                        }
                        
                        if (previewContent) previewContent.hidden = true;
                        if (placeholder) placeholder.hidden = false;
                        if (pill) pill.hidden = true;
                        
                        // Pulisci anche i contenuti dell'anteprima
                        if (previewImage) {
                            previewImage.src = '';
                            previewImage.hidden = true;
                        }
                        if (previewText) {
                            previewText.textContent = '';
                            previewText.hidden = true;
                        }
                        
                        // Update positions array
                        state.positions = Array.from(
                            document.querySelectorAll('.position-card input:checked')
                        ).map(input => input.value);
                        
                        // Haptic feedback
                        if (navigator.vibrate) navigator.vibrate(10);
                        
                        // Update pricing
                        updatePricingTiers();
                        updatePricingSummary();
                        return;
                    }
                    
                    // Store selected method for this position
                    state.positionMethods[position] = method;
                    console.log('?? METHOD SELECTED!', position, '=', method);
                    console.log('?? Current positionMethods:', JSON.stringify(state.positionMethods));
                    
                    // Save state immediately for persistence
                    saveCustomizationState();
                    
                    // Apply method UI (transform other badge to "Add Logo")
                    applyMethodUI(card, method);
                    
                    // Auto-check the checkbox if not already checked
                    if (!checkbox.checked) {
                        checkbox.checked = true;
                        checkbox.dispatchEvent(new Event('change'));
                    }
                    
                    // Haptic feedback
                    if (navigator.vibrate) navigator.vibrate(10);
                    
                    // Update pricing
                    updatePricingSummary();
                });
            });
            
            // Checkbox change handler
            checkbox.addEventListener('change', () => {
                // Set flag to prevent auto-scroll during position selection
                state.isSelectingPosition = true;
                
                if (checkbox.checked) {
                    card.classList.add('selected');
                } else {
                    card.classList.remove('selected');
                    // Reset badges when unchecked
                    const embBadge = card.querySelector('.price-emb');
                    const printBadge = card.querySelector('.price-print');
                    resetPriceBadge(embBadge);
                    resetPriceBadge(printBadge);
                    delete state.positionMethods[position];
                    
                    // Also clear customization data
                    if (state.positionCustomizations) {
                        delete state.positionCustomizations[position];
                    }
                    if (state.positionDesigns) {
                        delete state.positionDesigns[position];
                    }
                    
                    // Hide and clear customization preview
                    const previewContent = card.querySelector('.position-preview-content');
                    const placeholder = card.querySelector('.position-placeholder');
                    const pill = card.querySelector('.customization-pill');
                    const previewImage = card.querySelector('.preview-image');
                    const previewText = card.querySelector('.preview-text');
                    
                    // Pulisci anche il logo overlay sul prodotto
                    const logoOverlayBox = card.querySelector('.logo-overlay-box');
                    const logoOverlayImg = card.querySelector('.logo-overlay-img');
                    if (logoOverlayBox) {
                        logoOverlayBox.hidden = true;
                    }
                    if (logoOverlayImg) {
                        logoOverlayImg.src = '';
                    }
                    
                    if (previewContent) previewContent.hidden = true;
                    if (placeholder) placeholder.hidden = false;
                    if (pill) pill.hidden = true;
                    
                    // Pulisci anche i contenuti dell'anteprima
                    if (previewImage) {
                        previewImage.src = '';
                        previewImage.hidden = true;
                    }
                    if (previewText) {
                        previewText.textContent = '';
                        previewText.hidden = true;
                    }
                }
                
                // Update state
                state.positions = Array.from(
                    document.querySelectorAll('.position-card input:checked')
                ).map(input => input.value);
                
                // Haptic feedback
                if (navigator.vibrate) navigator.vibrate(10);
                
                updatePricingTiers();
                updatePricingSummary();
                
                // Reset flag after a delay
                setTimeout(() => {
                    state.isSelectingPosition = false;
                }, 500);
            });
            
            // Click handler on card itself - only deselect if NO logo is loaded
            card.addEventListener('click', (e) => {
                // Ignore clicks on interactive elements
                if (e.target.closest('.price-badge') || 
                    e.target.closest('.preview-delete-btn') ||
                    e.target.closest('input[type="checkbox"]') ||
                    e.target.closest('.position-checkbox')) {
                    return;
                }
                
                // Check if there's a logo loaded - if so, do nothing (user must use bin to remove)
                const logoOverlayBox = card.querySelector('.logo-overlay-box');
                const logoOverlayImg = card.querySelector('.logo-overlay-img');
                const hasLogo = logoOverlayBox && !logoOverlayBox.hidden && logoOverlayImg && logoOverlayImg.src;
                
                // Also check if there's customization data
                const hasCustomization = state.positionCustomizations && 
                                         state.positionCustomizations[position] && 
                                         (state.positionCustomizations[position].logo || 
                                          state.positionCustomizations[position].text);
                
                // If logo is loaded, don't allow deselection via card click
                if (hasLogo || hasCustomization) {
                    return; // User must use the bin button to remove
                }
                
                // If position is selected but NO logo, allow deselection
                if (checkbox.checked) {
                    // Deselect: uncheck the position and reset
                    checkbox.checked = false;
                    card.classList.remove('selected');
                    
                    // Reset badges
                    const embBadge = card.querySelector('.price-emb');
                    const printBadge = card.querySelector('.price-print');
                    resetPriceBadge(embBadge);
                    resetPriceBadge(printBadge);
                    
                    // Clear position method and customization data
                    delete state.positionMethods[position];
                    if (state.positionCustomizations) {
                        delete state.positionCustomizations[position];
                    }
                    if (state.positionDesigns) {
                        delete state.positionDesigns[position];
                    }
                    
                    // Hide and clear customization preview
                    const previewContent = card.querySelector('.position-preview-content');
                    const placeholder = card.querySelector('.position-placeholder');
                    const pill = card.querySelector('.customization-pill');
                    const previewImage = card.querySelector('.preview-image');
                    const previewText = card.querySelector('.preview-text');
                    
                    // Pulisci anche il logo overlay sul prodotto
                    if (logoOverlayBox) {
                        logoOverlayBox.hidden = true;
                    }
                    if (logoOverlayImg) {
                        logoOverlayImg.src = '';
                    }
                    
                    if (previewContent) previewContent.hidden = true;
                    if (placeholder) placeholder.hidden = false;
                    if (pill) pill.hidden = true;
                    
                    // Pulisci anche i contenuti dell'anteprima
                    if (previewImage) {
                        previewImage.src = '';
                        previewImage.hidden = true;
                    }
                    if (previewText) {
                        previewText.textContent = '';
                        previewText.hidden = true;
                    }
                    
                    // Update positions array
                    state.positions = Array.from(
                        document.querySelectorAll('.position-card input:checked')
                    ).map(input => input.value);
                    
                    // Haptic feedback
                    if (navigator.vibrate) navigator.vibrate(10);
                    
                    // Update pricing
                    updatePricingTiers();
                    updatePricingSummary();
                }
            });
            
            // Click handler for preview delete button (cestino)
            const deleteBtn = card.querySelector('.preview-delete-btn');
            if (deleteBtn) {
                deleteBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    
                    // Deselect the card
                    checkbox.checked = false;
                    checkbox.dispatchEvent(new Event('change'));
                    
                    // Show toast feedback
                    showToast('Customization removed');
                    
                    // Haptic feedback
                    if (navigator.vibrate) navigator.vibrate(10);
                });
            }
            
            // Logo drag disabled - logos are now fixed in predefined positions
            // const logoOverlayBox = card.querySelector('.logo-overlay-box');
            // if (logoOverlayBox) {
            //     setupLogoDrag(logoOverlayBox, card);
            // }
        });
    }
    
    // === Logo Drag & Drop ===
    function setupLogoDrag(logoBox, card) {
        let isDragging = false;
        let isPinching = false;
        let isActive = false;
        let startX, startY;
        let initialLeft, initialTop;
        let initialDistance, initialWidth, initialHeight;
        let activeTimeout;
        const preview = card.querySelector('.position-preview');
        
        // Calculate distance between two touch points
        function getTouchDistance(touches) {
            const dx = touches[0].clientX - touches[1].clientX;
            const dy = touches[0].clientY - touches[1].clientY;
            return Math.sqrt(dx * dx + dy * dy);
        }
        
        // Get center point between two touches
        function getTouchCenter(touches) {
            return {
                x: (touches[0].clientX + touches[1].clientX) / 2,
                y: (touches[0].clientY + touches[1].clientY) / 2
            };
        }
        
        // Lock scroll
        function lockScroll() {
            document.body.style.overflow = 'hidden';
            document.body.style.touchAction = 'none';
            document.documentElement.style.overflow = 'hidden';
        }
        
        // Unlock scroll
        function unlockScroll() {
            document.body.style.overflow = '';
            document.body.style.touchAction = '';
            document.documentElement.style.overflow = '';
        }
        
        // Activate logo editing mode
        function activateLogo() {
            isActive = true;
            logoBox.classList.add('active');
            lockScroll();
            if (navigator.vibrate) navigator.vibrate(15);
        }
        
        // Deactivate logo editing mode
        function deactivateLogo() {
            isActive = false;
            logoBox.classList.remove('active');
            unlockScroll();
        }
        
        // Deactivate frame after delay (only if not dragging/pinching)
        function deactivateFrame() {
            clearTimeout(activeTimeout);
            activeTimeout = setTimeout(() => {
                if (!isDragging && !isPinching) {
                    deactivateLogo();
                }
            }, 2000);
        }
        
        // Touch start - handle both drag (1 finger) and pinch (2 fingers)
        logoBox.addEventListener('touchstart', (e) => {
            if (logoBox.hidden) return;
            e.preventDefault();
            e.stopPropagation();
            
            clearTimeout(activeTimeout);
            
            // Toggle active state on single tap
            if (!isActive) {
                activateLogo();
            }
            
            if (e.touches.length === 2) {
                // Pinch to resize
                isPinching = true;
                isDragging = false;
                logoBox.classList.add('resizing');
                logoBox.classList.remove('dragging');
                
                initialDistance = getTouchDistance(e.touches);
                initialWidth = logoBox.offsetWidth;
                initialHeight = logoBox.offsetHeight;
                
                if (navigator.vibrate) navigator.vibrate(10);
            } else if (e.touches.length === 1) {
                // Single finger drag
                isDragging = true;
                isPinching = false;
                logoBox.classList.add('dragging');
                logoBox.classList.remove('resizing');
                
                const touch = e.touches[0];
                startX = touch.clientX;
                startY = touch.clientY;
                
                const rect = logoBox.getBoundingClientRect();
                const parentRect = preview.getBoundingClientRect();
                initialLeft = rect.left - parentRect.left;
                initialTop = rect.top - parentRect.top;
                
                logoBox.style.left = initialLeft + 'px';
                logoBox.style.top = initialTop + 'px';
                logoBox.style.right = 'auto';
                logoBox.style.transform = 'none';
            }
        }, { passive: false });
        
        // Touch move - drag or pinch
        logoBox.addEventListener('touchmove', (e) => {
            if (!isDragging && !isPinching) return;
            e.preventDefault();
            e.stopPropagation();
            
            if (isPinching && e.touches.length === 2) {
                // Pinch to resize - smooth sensitivity
                const currentDistance = getTouchDistance(e.touches);
                const distanceChange = currentDistance - initialDistance;
                
                // Balanced sensitivity (2x - smooth and controlled)
                const sensitivity = 2;
                const sizeChange = distanceChange * sensitivity;
                
                const parentRect = preview.getBoundingClientRect();
                const logoLeft = parseFloat(logoBox.style.left) || 0;
                const logoTop = parseFloat(logoBox.style.top) || 0;
                
                // Calculate new size based on distance change
                let newSize = Math.max(15, initialWidth + sizeChange);
                
                // Constrain to parent bounds and max size
                const maxWidth = parentRect.width - logoLeft;
                const maxHeight = parentRect.height - logoTop;
                newSize = Math.min(newSize, maxWidth, maxHeight, 180);
                
                logoBox.style.width = newSize + 'px';
                logoBox.style.height = newSize + 'px';
                
            } else if (isDragging && e.touches.length === 1) {
                // Single finger drag
                const touch = e.touches[0];
                const deltaX = touch.clientX - startX;
                const deltaY = touch.clientY - startY;
                
                const parentRect = preview.getBoundingClientRect();
                const boxWidth = logoBox.offsetWidth;
                const boxHeight = logoBox.offsetHeight;
                
                let newLeft = initialLeft + deltaX;
                let newTop = initialTop + deltaY;
                
                newLeft = Math.max(0, Math.min(newLeft, parentRect.width - boxWidth));
                newTop = Math.max(0, Math.min(newTop, parentRect.height - boxHeight));
                
                logoBox.style.left = newLeft + 'px';
                logoBox.style.top = newTop + 'px';
            }
        }, { passive: false });
        
        // Touch end
        logoBox.addEventListener('touchend', (e) => {
            if (!isDragging && !isPinching) return;
            
            // If we still have 2 fingers, don't end pinch yet
            if (e.touches.length >= 1 && isPinching) {
                // Switch to drag mode with remaining finger
                isPinching = false;
                isDragging = true;
                logoBox.classList.remove('resizing');
                logoBox.classList.add('dragging');
                
                const touch = e.touches[0];
                startX = touch.clientX;
                startY = touch.clientY;
                
                const rect = logoBox.getBoundingClientRect();
                const parentRect = preview.getBoundingClientRect();
                initialLeft = rect.left - parentRect.left;
                initialTop = rect.top - parentRect.top;
                return;
            }
            
            isDragging = false;
            isPinching = false;
            logoBox.classList.remove('dragging', 'resizing');
            
            deactivateFrame();
            
            // Save position and size to state
            const position = card.dataset.position || card.querySelector('input[type="checkbox"]')?.value;
            if (position && state.positionDesigns && state.positionDesigns[position]) {
                state.positionDesigns[position].logoPosition = {
                    left: logoBox.style.left,
                    top: logoBox.style.top,
                    width: logoBox.style.width,
                    height: logoBox.style.height
                };
            }
            
            if (navigator.vibrate) navigator.vibrate(5);
        });
        
        // Mouse support for desktop testing
        logoBox.addEventListener('mousedown', (e) => {
            if (logoBox.hidden) return;
            e.preventDefault();
            e.stopPropagation();
            
            clearTimeout(activeTimeout);
            
            if (!isActive) {
                activateLogo();
            }
            
            isDragging = true;
            logoBox.classList.add('dragging');
            
            startX = e.clientX;
            startY = e.clientY;
            
            const rect = logoBox.getBoundingClientRect();
            const parentRect = preview.getBoundingClientRect();
            initialLeft = rect.left - parentRect.left;
            initialTop = rect.top - parentRect.top;
            
            logoBox.style.left = initialLeft + 'px';
            logoBox.style.top = initialTop + 'px';
            logoBox.style.right = 'auto';
            logoBox.style.transform = 'none';
        });
        
        document.addEventListener('mousemove', (e) => {
            if (!isDragging) return;
            
            const deltaX = e.clientX - startX;
            const deltaY = e.clientY - startY;
            
            const parentRect = preview.getBoundingClientRect();
            const boxWidth = logoBox.offsetWidth;
            const boxHeight = logoBox.offsetHeight;
            
            let newLeft = initialLeft + deltaX;
            let newTop = initialTop + deltaY;
            
            newLeft = Math.max(0, Math.min(newLeft, parentRect.width - boxWidth));
            newTop = Math.max(0, Math.min(newTop, parentRect.height - boxHeight));
            
            logoBox.style.left = newLeft + 'px';
            logoBox.style.top = newTop + 'px';
        });
        
        document.addEventListener('mouseup', () => {
            if (!isDragging) return;
            isDragging = false;
            logoBox.classList.remove('dragging');
            
            deactivateFrame();
            
            const position = card.dataset.position || card.querySelector('input[type="checkbox"]')?.value;
            if (position && state.positionDesigns && state.positionDesigns[position]) {
                state.positionDesigns[position].logoPosition = {
                    left: logoBox.style.left,
                    top: logoBox.style.top,
                    width: logoBox.style.width,
                    height: logoBox.style.height
                };
            }
        });
        
        // Mouse wheel for resize on desktop
        logoBox.addEventListener('wheel', (e) => {
            if (logoBox.hidden) return;
            e.preventDefault();
            
            clearTimeout(activeTimeout);
            if (!isActive) activateLogo();
            
            const parentRect = preview.getBoundingClientRect();
            const logoLeft = parseFloat(logoBox.style.left) || 0;
            const logoTop = parseFloat(logoBox.style.top) || 0;
            
            const currentWidth = logoBox.offsetWidth;
            const currentHeight = logoBox.offsetHeight;
            const delta = e.deltaY > 0 ? -5 : 5;
            
            let newSize = Math.max(15, Math.min(currentWidth + delta, 180));
            newSize = Math.min(newSize, parentRect.width - logoLeft, parentRect.height - logoTop);
            
            logoBox.style.width = newSize + 'px';
            logoBox.style.height = newSize + 'px';
            
            deactivateFrame();
        }, { passive: false });
        
        // Click outside logo to deactivate
        document.addEventListener('touchstart', (e) => {
            if (!isActive) return;
            // Allow touches on entire card area for expanded pinch zone
            if (card.contains(e.target)) return;
            if (!logoBox.contains(e.target)) {
                deactivateLogo();
            }
        }, { passive: true });
        
        document.addEventListener('mousedown', (e) => {
            if (!isActive) return;
            if (card.contains(e.target)) return;
            if (!logoBox.contains(e.target)) {
                deactivateLogo();
            }
        });
        
        // Expanded pinch area - listen on entire CARD when active (much larger area)
        card.addEventListener('touchstart', (e) => {
            // Don't interfere with badge clicks
            if (e.target.closest('.price-badge') || 
                e.target.closest('.preview-delete-btn') ||
                e.target.closest('input[type="checkbox"]')) {
                return;
            }
            
            if (logoBox.hidden || !isActive) return;
            if (e.touches.length === 2) {
                e.preventDefault();
                e.stopPropagation();
                
                isPinching = true;
                isDragging = false;
                logoBox.classList.add('resizing');
                logoBox.classList.remove('dragging');
                
                initialDistance = getTouchDistance(e.touches);
                initialWidth = logoBox.offsetWidth;
                initialHeight = logoBox.offsetHeight;
                
                if (navigator.vibrate) navigator.vibrate(10);
            }
        }, { passive: false });
        
        card.addEventListener('touchmove', (e) => {
            if (!isPinching || e.touches.length !== 2) return;
            e.preventDefault();
            e.stopPropagation();
            
            // Pinch to resize - smooth and controlled
            const currentDistance = getTouchDistance(e.touches);
            const distanceChange = currentDistance - initialDistance;
            
            // Balanced sensitivity (2x - smooth and controlled)
            const sensitivity = 2;
            const sizeChange = distanceChange * sensitivity;
            
            const parentRect = preview.getBoundingClientRect();
            const logoLeft = parseFloat(logoBox.style.left) || 0;
            const logoTop = parseFloat(logoBox.style.top) || 0;
            
            // Calculate new size based on distance change
            let newSize = Math.max(12, initialWidth + sizeChange);
            
            // Constrain to parent bounds and max size
            const maxWidth = parentRect.width - logoLeft;
            const maxHeight = parentRect.height - logoTop;
            newSize = Math.min(newSize, maxWidth, maxHeight, 200);
            
            logoBox.style.width = newSize + 'px';
            logoBox.style.height = newSize + 'px';
        }, { passive: false });
        
        card.addEventListener('touchend', (e) => {
            if (!isPinching) return;
            if (e.touches.length === 0) {
                isPinching = false;
                logoBox.classList.remove('resizing');
                
                // Save size to state
                const position = card.dataset.position || card.querySelector('input[type="checkbox"]')?.value;
                if (position && state.positionDesigns && state.positionDesigns[position]) {
                    state.positionDesigns[position].logoPosition = {
                        left: logoBox.style.left,
                        top: logoBox.style.top,
                        width: logoBox.style.width,
                        height: logoBox.style.height
                    };
                }
                
                deactivateFrame();
                if (navigator.vibrate) navigator.vibrate(5);
            }
        });
    }

    // === Initialize POA Badges ===
    function initializePOABadges() {
        // Find all position cards and check for POA pricing
        document.querySelectorAll('.position-card').forEach(card => {
            const embroideryPrice = card.dataset.embroidery;
            const printPrice = card.dataset.print;
            
            // Check embroidery badge for POA
            if (embroideryPrice === 'POA') {
                const embBadge = card.querySelector('.price-emb');
                if (embBadge) {
                    embBadge.classList.add('poa-badge');
                    embBadge.style.cursor = 'not-allowed';
                }
            }
            
            // Check print badge for POA (if needed in future)
            if (printPrice === 'POA') {
                const printBadge = card.querySelector('.price-print');
                if (printBadge) {
                    printBadge.classList.add('poa-badge');
                    printBadge.style.cursor = 'not-allowed';
                }
            }
        });
        
        console.log('? POA badges initialized');
    }

    // === Quantity Adjusters in Order Summary ===
    function setupQuantityAdjusters() {
        const adjustBtns = document.querySelectorAll('.qty-adjust-btn');
        adjustBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                const action = btn.dataset.action;
                const currentQty = state.quantity;
                
                if (action === 'decrease' && currentQty > 1) {
                    state.quantity = currentQty - 1;
                } else if (action === 'increase' && currentQty < 9999) {
                    state.quantity = currentQty + 1;
                }
                
                // Update quantity input
                const qtyInput = document.getElementById('quantityInput');
                if (qtyInput) qtyInput.value = state.quantity;
                
                // Haptic feedback
                if (navigator.vibrate) navigator.vibrate(5);
                
                // Recalculate
                updatePricingTiers();
                updatePricingSummary();
            });
        });
    }

    // === Apply Method UI (Transform badges) ===
    function applyMethodUI(card, method) {
        if (!card) return;
        
        const embBadge = card.querySelector('.price-emb');
        const printBadge = card.querySelector('.price-print');
        
        // Reset both badges first
        resetPriceBadge(embBadge);
        resetPriceBadge(printBadge);
        
        if (!method) return;
        
        // Active badge (the selected method)
        const methodBadge = method === 'embroidery' ? embBadge : printBadge;
        // Other badge (becomes "Add Logo" with cloud animation)
        const addBadge = method === 'embroidery' ? printBadge : embBadge;
        
        if (methodBadge) {
            methodBadge.classList.add('active');
            methodBadge.dataset.role = 'method';
        }
        
        if (addBadge) {
            addBadge.classList.remove('active');
            addBadge.classList.add('add-logo-btn');
            addBadge.dataset.role = 'add-logo';
            addBadge.dataset.activeMethod = method;
            // Cloud upload animation SVG - unique ID per badge
            const uniqueId = 'cloud-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
            addBadge.innerHTML = `
                <svg class="add-logo-cloud-icon" width="40" height="40" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <defs>
                        <clipPath id="${uniqueId}">
                            <path fill-rule="evenodd" clip-rule="evenodd" d="M76.3818 41.5239C76.3818 41.7358 76.3818 41.7358 76.3818 41.9477C86.9769 44.0667 94.3935 54.0261 93.334 64.8332C92.2745 75.6402 83.1627 83.9044 72.1438 83.9044H29.7633C18.9563 83.9044 9.84454 75.6402 8.57313 64.8332C7.30172 54.0261 14.9302 44.0667 25.5253 41.9477C25.5253 41.7358 25.5253 41.7358 25.5253 41.5239C25.5253 27.5384 36.968 16.0957 50.9536 16.0957C64.9391 16.0957 76.3818 27.5384 76.3818 41.5239Z" />
                        </clipPath>
                    </defs>
                    <g clip-path="url(#${uniqueId})">
                        <path fill-rule="evenodd" clip-rule="evenodd" d="M100 -100H0V200H100V-100ZM34.8377 49.1524L47.426 36.4383C48.2652 35.5907 49.3142 35.1669 50.3632 35.1669C51.4122 35.1669 52.671 35.5907 53.3005 36.4383L65.8888 49.1524C66.9378 50.4238 67.3574 52.3309 66.728 53.8143C66.0986 55.2976 64.6299 56.3571 62.9514 56.3571H54.5593V69.0712C54.5593 71.4021 52.671 73.3093 50.3632 73.3093C48.0554 73.3093 46.1672 71.4021 46.1672 69.0712V56.3571H37.775C36.0966 56.3571 34.6279 55.2976 33.9985 53.8143C33.3691 52.119 33.5789 50.4238 34.8377 49.1524Z" fill="white" class="cloud-arrow-anim" />
                    </g>
                </svg>
            `;
        }
    }

    // === Reset Price Badge ===
    function resetPriceBadge(badge) {
        if (!badge) return;
        
        badge.classList.remove('active', 'add-logo-btn', 'logo-added');
        badge.dataset.role = 'method';
        delete badge.dataset.activeMethod;
        
        // Restore original content
        const method = badge.dataset.method;
        const defaultLabel = badge.dataset.defaultLabel || (method === 'embroidery' ? 'EMBROIDERY' : 'PRINT');
        const defaultPrice = badge.dataset.defaultPrice || '+ �0.00';
        
        badge.innerHTML = `
            <span class="price-label">${defaultLabel}</span>
            <span class="price-value">${defaultPrice}</span>
        `;
    }

    // === Open Customization Type Modal (Choose Your Customization) ===
    // Now directly opens the design modal since only logo upload option exists
    function openCustomizationTypeModal(position, method) {
        // Open design modal directly for logo upload
        openDesignModal(position, method, 'logo');
    }
    
    function closeCustomizationTypeModal() {
        const modal = document.getElementById('customizationTypeModal');
        if (modal) {
            modal.classList.remove('active');
            document.body.style.overflow = '';
        }
    }
    
    function initCustomizationTypeModal() {
        // No longer needed - direct logo upload now
    }

    // === Open Design Modal (with specific section focus) ===
    function openDesignModal(position, method, section = 'all') {
        const modal = document.getElementById('designModal');
        const modalTitle = document.getElementById('designModalTitle');
        
        if (!modal) return;
        
        // Get position name from the card
        const card = document.querySelector(`.position-card[data-position="${position}"], .position-card input[value="${position}"]`)?.closest('.position-card');
        const positionName = card?.querySelector('.position-checkbox span')?.textContent || position.replace(/-/g, ' ');
        
        // Update modal title based on section
        if (modalTitle) {
            let titleText = `Customise ${positionName}`;
            if (section === 'logo') titleText = `Upload Logo - ${positionName}`;
            else if (section === 'text') titleText = `Add Text - ${positionName}`;
            else if (section === 'artwork') titleText = `Pick Artwork - ${positionName}`;
            modalTitle.textContent = titleText;
        }
        
        // Store current position/method for when applying design
        modal.dataset.position = position;
        modal.dataset.method = method;
        
        // Reset modal state
        resetDesignModal();
        
        // Scroll to specific section based on selection
        setTimeout(() => {
            const modalBody = modal.querySelector('.design-modal-body');
            if (modalBody && section !== 'all') {
                let targetSection = null;
                if (section === 'logo') {
                    targetSection = document.getElementById('uploadLogoSection');
                } else if (section === 'text') {
                    targetSection = modal.querySelector('.design-section-title')?.closest('.design-section');
                    // Find the "Add Text" section
                    const sections = modal.querySelectorAll('.design-section');
                    sections.forEach(sec => {
                        const title = sec.querySelector('.design-section-title');
                        if (title && title.textContent.includes('Add Text')) {
                            targetSection = sec;
                        }
                    });
                } else if (section === 'artwork') {
                    // Find the clipart section
                    const sections = modal.querySelectorAll('.design-section');
                    sections.forEach(sec => {
                        const title = sec.querySelector('.design-section-title');
                        if (title && title.textContent.includes('Clipart')) {
                            targetSection = sec;
                        }
                    });
                }
                if (targetSection) {
                    targetSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
            }
        }, 350);
        
        // Open modal
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
        
        // Haptic feedback
        if (navigator.vibrate) navigator.vibrate(10);
    }

    // === Open Customization Modal (legacy - now opens type selection first) ===
    function openCustomizationModal(position, method) {
        // Now opens the type selection modal first
        openCustomizationTypeModal(position, method);
    }
    
    function closeCustomizationModal() {
        const modal = document.getElementById('designModal');
        if (modal) {
            modal.classList.remove('active');
            document.body.style.overflow = '';
        }
    }
    
    function resetDesignModal() {
        // Reset upload
        const uploadZone = document.getElementById('designUploadZone');
        const uploadPreview = document.getElementById('designUploadPreview');
        const previewImg = document.getElementById('designPreviewImg');
        const fileInput = document.getElementById('designLogoUpload');
        
        // Ripristina la dropzone (visibilit� e display)
        if (uploadZone) {
            uploadZone.hidden = false;
            uploadZone.style.display = '';
        }
        if (uploadPreview) uploadPreview.hidden = true;
        if (previewImg) previewImg.src = '';
        if (fileInput) fileInput.value = '';
        
        // Ripristina il titolo a "Upload Logo"
        const uploadTitle = document.getElementById('uploadLogoTitle');
        if (uploadTitle) uploadTitle.textContent = 'Upload Logo';
        
        // Reset Remove BG button
        const removeBgBtn = document.getElementById('removeBgBtn');
        if (removeBgBtn) {
            removeBgBtn.classList.remove('processing', 'done');
            const btnText = removeBgBtn.querySelector('span');
            if (btnText) btnText.textContent = 'Remove BG';
        }
        
        // Reset Undo button and original image state
        const undoBgBtn = document.getElementById('undoBgBtn');
        if (undoBgBtn) {
            undoBgBtn.hidden = true;
        }
        state.originalLogoImage = null;
        
        // Reset text
        const textInput = document.getElementById('designTextInput');
        if (textInput) textInput.value = '';
        
        // Reset colors
        document.querySelectorAll('#designModal .color-circle').forEach((c, i) => {
            c.classList.toggle('active', i === 0);
        });
        document.querySelectorAll('#designModal .stroke-circle').forEach((c, i) => {
            c.classList.toggle('active', i === 0);
        });
        
        // Reset clipart
        document.querySelectorAll('#designModal .clipart-item').forEach(c => {
            c.classList.remove('selected');
        });
        document.querySelectorAll('#designModal .clipart-tab').forEach((t, i) => {
            t.classList.toggle('active', i === 0);
        });
        
        // Reset none checkbox
        const noneCheckbox = document.getElementById('textColorNone');
        if (noneCheckbox) noneCheckbox.checked = false;
    }
    
    function initDesignModal() {
        const modal = document.getElementById('designModal');
        if (!modal) return;
        
        // Close button
        const closeBtn = document.getElementById('closeDesignModal');
        if (closeBtn) {
            closeBtn.addEventListener('click', closeCustomizationModal);
        }
        
        // Close on overlay click
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                closeCustomizationModal();
            }
        });
        
        // Upload dropzone
        const uploadZone = document.getElementById('designUploadZone');
        const fileInput = document.getElementById('designLogoUpload');
        const uploadPreview = document.getElementById('designUploadPreview');
        const previewImg = document.getElementById('designPreviewImg');
        const removeBtn = document.getElementById('removeUploadedLogo');
        
        if (uploadZone && fileInput) {
            uploadZone.addEventListener('click', () => fileInput.click());
            
            fileInput.addEventListener('change', (e) => {
                const file = e.target.files[0];
                if (file) {
                    const reader = new FileReader();
                    reader.onload = (ev) => {
                        if (previewImg) previewImg.src = ev.target.result;
                        // Nascondi completamente la dropzone (non solo hidden)
                        if (uploadZone) {
                            uploadZone.hidden = true;
                            uploadZone.style.display = 'none';
                        }
                        if (uploadPreview) uploadPreview.hidden = false;
                        
                        // Cambia il titolo da "Upload Logo" a "Your Logo"
                        const uploadTitle = document.getElementById('uploadLogoTitle');
                        if (uploadTitle) uploadTitle.textContent = 'Your Logo';
                        
                        // REMOVED: Don't show logo on main product preview - only in customization section
                        // The logo should only appear in the position cards, not on the main product thumbnail
                        // const logoOverlayBox = document.getElementById('logoOverlayBox');
                        // const logoOverlayImg = document.getElementById('logoOverlayImg');
                        // if (logoOverlayBox && logoOverlayImg) {
                        //     logoOverlayImg.src = ev.target.result;
                        //     logoOverlayBox.classList.add('active');
                        // }
                        
                        // Auto-remove background per immagini JPEG/JPG
                        const isJpeg = file.type === 'image/jpeg' || file.type === 'image/jpg' || 
                                       file.name.toLowerCase().endsWith('.jpg') || 
                                       file.name.toLowerCase().endsWith('.jpeg');
                        if (isJpeg) {
                            // Salva l'immagine originale prima della rimozione automatica
                            state.originalLogoImage = ev.target.result;
                            // Rimuovi automaticamente lo sfondo
                            setTimeout(() => removeImageBackground(), 100);
                        }
                    };
                    reader.readAsDataURL(file);
                }
            });
        }
        
        if (removeBtn) {
            removeBtn.addEventListener('click', () => {
                if (fileInput) fileInput.value = '';
                if (previewImg) previewImg.src = '';
                // Ripristina la dropzone
                if (uploadZone) {
                    uploadZone.hidden = false;
                    uploadZone.style.display = '';
                }
                if (uploadPreview) uploadPreview.hidden = true;
                
                // Ripristina il titolo a "Upload Logo"
                const uploadTitle = document.getElementById('uploadLogoTitle');
                if (uploadTitle) uploadTitle.textContent = 'Upload Logo';
                
                // Nascondi il logo dalla preview del prodotto
                const logoOverlayBox = document.getElementById('logoOverlayBox');
                const logoOverlayImg = document.getElementById('logoOverlayImg');
                if (logoOverlayBox) logoOverlayBox.classList.remove('active');
                if (logoOverlayImg) logoOverlayImg.src = '';
                
                // Reset completo dello state per nuovo logo
                state.originalLogoImage = null;
                
                // Reset Remove BG button
                const removeBgBtn = document.getElementById('removeBgBtn');
                if (removeBgBtn) {
                    removeBgBtn.classList.remove('processing', 'done');
                    const btnText = removeBgBtn.querySelector('span');
                    if (btnText) btnText.textContent = 'Remove BG';
                    // Ripristina funzionalit� originale
                    removeBgBtn.onclick = function() {
                        removeImageBackground();
                    };
                }
            });
        }
        
        // Color circles
        modal.querySelectorAll('.color-circle').forEach(circle => {
            circle.addEventListener('click', () => {
                modal.querySelectorAll('.color-circle').forEach(c => c.classList.remove('active'));
                circle.classList.add('active');
                const noneCheckbox = document.getElementById('textColorNone');
                if (noneCheckbox) noneCheckbox.checked = false;
            });
        });
        
        // Stroke circles
        modal.querySelectorAll('.stroke-circle').forEach(circle => {
            circle.addEventListener('click', () => {
                modal.querySelectorAll('.stroke-circle').forEach(c => c.classList.remove('active'));
                circle.classList.add('active');
            });
        });
        
        // Clipart tabs
        modal.querySelectorAll('.clipart-tab').forEach(tab => {
            tab.addEventListener('click', () => {
                modal.querySelectorAll('.clipart-tab').forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                // TODO: Filter clipart by category
            });
        });
        
        // Clipart items
        modal.querySelectorAll('.clipart-item').forEach(item => {
            item.addEventListener('click', () => {
                modal.querySelectorAll('.clipart-item').forEach(i => i.classList.remove('selected'));
                item.classList.add('selected');
                if (navigator.vibrate) navigator.vibrate(10);
            });
        });
        
        // Apply design button (main bottom button)
        const applyBtn = document.getElementById('applyDesignBtn');
        if (applyBtn) {
            applyBtn.addEventListener('click', () => {
                applyDesignToPosition();
            });
        }
        
        // Quick Apply Logo button (inside preview container)
        const quickApplyBtn = document.getElementById('quickApplyLogo');
        if (quickApplyBtn) {
            quickApplyBtn.addEventListener('click', () => {
                applyDesignToPosition();
            });
        }
        
        // Remove Background button - toggle behavior based on state
        const removeBgBtn = document.getElementById('removeBgBtn');
        if (removeBgBtn) {
            removeBgBtn.addEventListener('click', () => {
                // Check if background was already removed (button shows "Keep Background")
                if (state.backgroundRemoved) {
                    restoreOriginalImage();
                } else {
                    removeImageBackground();
                }
            });
        }
        
        // Undo Background Removal button
        const undoBgBtn = document.getElementById('undoBgBtn');
        if (undoBgBtn) {
            undoBgBtn.addEventListener('click', () => {
                restoreOriginalImage();
            });
        }
    }
    
    // === Background Removal Algorithm ===
    function removeImageBackground() {
        const previewImg = document.getElementById('designPreviewImg');
        const canvas = document.getElementById('bgRemovalCanvas');
        const removeBgBtn = document.getElementById('removeBgBtn');
        const undoBgBtn = document.getElementById('undoBgBtn');
        
        if (!previewImg || !previewImg.src || !canvas) return;
        
        // Save original image for undo functionality
        if (!state.originalLogoImage) {
            state.originalLogoImage = previewImg.src;
        }
        
        // Show processing state
        if (removeBgBtn) {
            removeBgBtn.classList.add('processing');
            removeBgBtn.querySelector('span').textContent = 'Processing';
        }
        
        // Use setTimeout to allow UI to update
        setTimeout(() => {
            try {
                const ctx = canvas.getContext('2d', { willReadFrequently: true });
                const img = new Image();
                img.crossOrigin = 'Anonymous';
                
                img.onload = function() {
                    // Set canvas size to match image
                    canvas.width = img.width;
                    canvas.height = img.height;
                    
                    // Draw image to canvas
                    ctx.drawImage(img, 0, 0);
                    
                    // Get image data
                    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                    const data = imageData.data;
                    const width = canvas.width;
                    const height = canvas.height;
                    
                    // Sample corner pixels to detect background color
                    const corners = [
                        getPixelColorAt(data, 0, 0, width),
                        getPixelColorAt(data, width - 1, 0, width),
                        getPixelColorAt(data, 0, height - 1, width),
                        getPixelColorAt(data, width - 1, height - 1, width)
                    ];
                    
                    // Find the most common corner color (likely background)
                    const bgColor = findDominantCornerColor(corners);
                    
                    // Tolerance for color matching
                    const tolerance = 45;
                    
                    // Track visited pixels
                    const visited = new Uint8Array(width * height);
                    
                    // Flood fill from all edge pixels - THIS PRESERVES INTERNAL COLORS
                    const queue = [];
                    
                    // Add all edge pixels to queue
                    for (let x = 0; x < width; x++) {
                        queue.push([x, 0]);           // Top edge
                        queue.push([x, height - 1]);  // Bottom edge
                    }
                    for (let y = 1; y < height - 1; y++) {
                        queue.push([0, y]);           // Left edge
                        queue.push([width - 1, y]);   // Right edge
                    }
                    
                    // Process queue (Flood Fill)
                    while (queue.length > 0) {
                        const [x, y] = queue.shift();
                        
                        // Check bounds
                        if (x < 0 || x >= width || y < 0 || y >= height) continue;
                        
                        const idx = y * width + x;
                        
                        // Skip if already visited
                        if (visited[idx]) continue;
                        visited[idx] = 1;
                        
                        // Get pixel color
                        const pixelIdx = idx * 4;
                        const r = data[pixelIdx];
                        const g = data[pixelIdx + 1];
                        const b = data[pixelIdx + 2];
                        
                        // Check if pixel matches background color
                        if (isColorSimilarTo(r, g, b, bgColor, tolerance)) {
                            // Make transparent
                            data[pixelIdx + 3] = 0;
                            
                            // Add neighbors to queue
                            queue.push([x + 1, y]);
                            queue.push([x - 1, y]);
                            queue.push([x, y + 1]);
                            queue.push([x, y - 1]);
                        }
                    }
                    
                    // Put processed image data back
                    ctx.putImageData(imageData, 0, 0);
                    
                    // Convert canvas to data URL and update preview
                    const processedImageUrl = canvas.toDataURL('image/png');
                    previewImg.src = processedImageUrl;
                    
                    // REMOVED: Don't update main product preview - only customization section
                    // The logo should only appear in the position cards, not on the main product thumbnail
                    // const logoOverlayImg = document.getElementById('logoOverlayImg');
                    // if (logoOverlayImg) {
                    //     logoOverlayImg.src = processedImageUrl;
                    // }
                    
                    // Update button state - cambia in "Keep Background"
                    if (removeBgBtn) {
                        removeBgBtn.classList.remove('processing');
                        removeBgBtn.classList.add('done');
                        removeBgBtn.querySelector('span').textContent = 'Keep Background';
                    }
                    
                    // Set state flag to track background was removed
                    state.backgroundRemoved = true;
                    
                    // Nascondi Undo button (non pi� necessario, usa il pulsante principale)
                    if (undoBgBtn) {
                        undoBgBtn.hidden = true;
                    }
                    
                    // Haptic feedback
                    if (navigator.vibrate) navigator.vibrate([10, 50, 10]);
                };
                
                img.onerror = function() {
                    console.error('Failed to load image for background removal');
                    if (removeBgBtn) {
                        removeBgBtn.classList.remove('processing');
                        removeBgBtn.querySelector('span').textContent = 'Remove BG';
                    }
                };
                
                img.src = previewImg.src;
                
            } catch (e) {
                console.error('Background removal error:', e);
                if (removeBgBtn) {
                    removeBgBtn.classList.remove('processing');
                    removeBgBtn.querySelector('span').textContent = 'Remove BG';
                }
            }
        }, 50);
    }
    
    // Get pixel color at specific coordinates
    function getPixelColorAt(data, x, y, width) {
        const idx = (y * width + x) * 4;
        return {
            r: data[idx],
            g: data[idx + 1],
            b: data[idx + 2]
        };
    }
    
    // Find the most common color from corner samples
    function findDominantCornerColor(colors) {
        const avgR = Math.round(colors.reduce((sum, c) => sum + c.r, 0) / colors.length);
        const avgG = Math.round(colors.reduce((sum, c) => sum + c.g, 0) / colors.length);
        const avgB = Math.round(colors.reduce((sum, c) => sum + c.b, 0) / colors.length);
        
        return { r: avgR, g: avgG, b: avgB };
    }
    
    // Check if two colors are similar within tolerance
    function isColorSimilarTo(r, g, b, target, tolerance) {
        const dr = Math.abs(r - target.r);
        const dg = Math.abs(g - target.g);
        const db = Math.abs(b - target.b);
        
        return dr <= tolerance && dg <= tolerance && db <= tolerance;
    }
    
    // === Restore Original Image (Undo Background Removal) ===
    function restoreOriginalImage() {
        const previewImg = document.getElementById('designPreviewImg');
        const removeBgBtn = document.getElementById('removeBgBtn');
        const undoBgBtn = document.getElementById('undoBgBtn');
        const logoOverlayImg = document.getElementById('logoOverlayImg');
        
        if (!previewImg || !state.originalLogoImage) return;
        
        // Restore original image
        previewImg.src = state.originalLogoImage;
        
        // REMOVED: Don't update main product preview - only customization section
        // The logo should only appear in the position cards, not on the main product thumbnail
        // if (logoOverlayImg) {
        //     logoOverlayImg.src = state.originalLogoImage;
        // }
        
        // Reset Remove BG button - torna a "Remove BG"
        if (removeBgBtn) {
            removeBgBtn.classList.remove('processing', 'done');
            const btnText = removeBgBtn.querySelector('span');
            if (btnText) btnText.textContent = 'Remove BG';
        }
        
        // Reset state flag
        state.backgroundRemoved = false;
        
        // Hide Undo button
        if (undoBgBtn) {
            undoBgBtn.hidden = true;
        }
        
        // NON cancellare l'immagine originale (permette di alternare)
        // state.originalLogoImage = null;
        
        // Haptic feedback
        if (navigator.vibrate) navigator.vibrate(10);
        
        // Show toast
        showToast('Background restored');
    }
    
    function applyDesignToPosition() {
        const modal = document.getElementById('designModal');
        if (!modal) return;
        
        const position = modal.dataset.position;
        const method = modal.dataset.method;
        
        // Gather design data
        const designData = {
            position,
            method,
            logo: document.getElementById('designPreviewImg')?.src || null,
            text: document.getElementById('designTextInput')?.value || '',
            textColor: modal.querySelector('.color-circle.active')?.dataset.color || '#1f2937',
            strokeColor: modal.querySelector('.stroke-circle.active')?.dataset.color || '#1f2937',
            clipart: modal.querySelector('.clipart-item.selected')?.textContent || null
        };
        
        // CRITICAL: Ensure positionMethods is updated for basket saving
        if (!state.positionMethods) state.positionMethods = {};
        state.positionMethods[position] = method;
        console.log('?? applyDesignToPosition - Updated positionMethods:', state.positionMethods);
        
        // Store in state (both positionDesigns and positionCustomizations for compatibility)
        if (!state.positionDesigns) state.positionDesigns = {};
        state.positionDesigns[position] = designData;
        
        // Also store in positionCustomizations for glow effect tracking
        if (!state.positionCustomizations) state.positionCustomizations = {};
        state.positionCustomizations[position] = designData;
        
        // Update the position card preview
        const card = document.querySelector(`.position-card[data-position="${position}"], .position-card input[value="${position}"]`)?.closest('.position-card');
        if (card) {
            const previewContent = card.querySelector('.position-preview-content');
            const previewImage = card.querySelector('.preview-image');
            const previewText = card.querySelector('.preview-text');
            const pill = card.querySelector('.customization-pill');
            
            // Show logo on product image (logo overlay box)
            const logoOverlayBox = card.querySelector('.logo-overlay-box');
            const logoOverlayImg = card.querySelector('.logo-overlay-img');
            if (designData.logo && logoOverlayBox && logoOverlayImg) {
                logoOverlayImg.src = designData.logo;
                logoOverlayBox.hidden = false;
            }
            
            if (previewContent) {
                previewContent.hidden = false;
                
                if (designData.logo && previewImage) {
                    previewImage.src = designData.logo;
                    previewImage.hidden = false;
                }
                
                if (designData.text && previewText) {
                    previewText.textContent = designData.text;
                    previewText.style.color = designData.textColor;
                    previewText.hidden = false;
                }
            }
            
            if (pill) {
                pill.hidden = false;
                pill.textContent = 'CUSTOMIZATION READY';
            }
            
            // Transform "ADD LOGO" button to green "LOGO ADDED" when logo is uploaded
            if (designData.logo) {
                const addLogoBtn = card.querySelector('.price-badge.add-logo-btn');
                if (addLogoBtn) {
                    addLogoBtn.classList.add('logo-added');
                    addLogoBtn.innerHTML = `<span class="add-logo-text">LOGO ADDED</span>`;
                }
            }
        }
        
        // Update order card logo preview
        updateOrderCardLogo(designData);
        
        // Close modal
        closeCustomizationModal();
        
        // Haptic feedback
        if (navigator.vibrate) navigator.vibrate([10, 50, 10]);
        
        // Save state for persistence
        saveCustomizationState();
        
        // Update pricing
        updatePricingSummary();
        
        // Update logos list in order card
        updateOrderCardLogosList();
    }
    
    function updateOrderCardLogo(designData) {
        // This function is now replaced by updateOrderCardLogosList
        updateOrderCardLogosList();
    }
    
    // Update the logos list in the order card - shows all logos from basket and current selection
    function updateOrderCardLogosList() {
        const logosList = document.getElementById('cardLogosList');
        if (!logosList) return;
        
        let logosHtml = '';
        let hasLogos = false;
        
        // PART 1: Get logos from basket items
        const basket = JSON.parse(localStorage.getItem('quoteBasket') || '[]');
        
        basket.forEach((item, itemIndex) => {
            // Check positionDesigns or customizations
            if (item.customizations && item.customizations.length > 0) {
                item.customizations.forEach(custom => {
                    if (custom.type === 'logo' && custom.content) {
                        hasLogos = true;
                        const positionName = custom.zone.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
                        
                        logosHtml += `
                            <div class="logo-section-content">
                                <div class="logo-preview-thumb">
                                    <img src="${custom.content}" alt="Logo">
                                </div>
                                <div class="logo-section-info">
                                    <span class="logo-position">${positionName}</span>
                                    <span class="logo-method">${item.color || 'Product'}</span>
                                </div>
                            </div>
                        `;
                    }
                });
            }
        });
        
        // PART 2: Get logos from current selection (positionDesigns or positionCustomizations)
        if (state.positionDesigns) {
            Object.entries(state.positionDesigns).forEach(([position, design]) => {
                if (design && design.logo) {
                    hasLogos = true;
                    const positionName = position.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
                    const methodName = design.method === 'embroidery' ? 'Embroidery' : 'Print';
                    
                    logosHtml += `
                        <div class="logo-section-content">
                            <div class="logo-preview-thumb">
                                <img src="${design.logo}" alt="Logo">
                            </div>
                            <div class="logo-section-info">
                                <span class="logo-position">${positionName}</span>
                                <span class="logo-method">${methodName} - ${state.selectedColorName || 'Current'}</span>
                            </div>
                        </div>
                    `;
                }
            });
        }
        
        // If no logos, show empty state
        if (!hasLogos) {
            logosHtml = `
                <div class="logo-section-content empty-logo">
                    <div class="logo-preview-thumb">
                        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" stroke-width="1.5">
                            <rect x="3" y="3" width="18" height="18" rx="2"/>
                            <circle cx="8.5" cy="8.5" r="1.5"/>
                            <path d="M21 15l-5-5L5 21"/>
                        </svg>
                    </div>
                    <div class="logo-section-info">
                        <span class="logo-method">No logo added</span>
                        <span class="logo-hint">Select a position and add your logo</span>
                    </div>
                </div>
            `;
        }
        
        logosList.innerHTML = logosHtml;
    }

    // === Pricing Summary ===
    // === Pricing Summary ===
    // Shows FULL ORDER: basket items + current selection
    // Uses SAME logic as updateOrderCard() for consistency
    function updatePricingSummary() {
        // Read basket EXACTLY like updateOrderCard does
        const basket = JSON.parse(localStorage.getItem('quoteBasket') || '[]');
        
        // Calculate total qty from basket (SAME keys as updateOrderCard)
        let basketQty = 0;
        basket.forEach(item => {
            basketQty += item.totalQty || item.quantity || 0;
        });
        const currentQty = state.quantity || 0;
        const totalQty = basketQty + currentQty;
        
        console.log('?? PRICING SUMMARY:', { currentQty, basketQty, totalQty, basketLength: basket.length });
        
        // Get unit price based on TOTAL quantity (cumulative tier)
        const basePrice = PRICING_RULES[state.product.code]?.basePrice || state.product.basePrice;
        const tiers = PRICING_RULES[state.product.code]?.tiers || [];
        
        // Find correct tier for total quantity
        let unitPrice = basePrice;
        for (let i = tiers.length - 1; i >= 0; i--) {
            if (totalQty >= tiers[i].min) {
                unitPrice = tiers[i].price;
                break;
            }
        }
        
        console.log('?? UNIT PRICE:', unitPrice, 'for', totalQty, 'items');
        
        const currentTier = getCurrentTier();
        
        // ===== GET ALL BASKET ITEMS =====
        // Calculate FULL basket totals (ALL items)
        let totalBasketGarmentCost = 0;
        let allBasketCustomizations = [];
        let hasEmbroidery = false;
        
        // First, group all items by productCode to calculate cumulative customization quantity
        const productCodeGroups = {};
        basket.forEach(item => {
            const itemCode = item.productCode || item.code;
            const itemQty = item.totalQty || item.quantity || 0;
            
            if (!productCodeGroups[itemCode]) {
                productCodeGroups[itemCode] = {
                    totalQty: 0,
                    items: []
                };
            }
            productCodeGroups[itemCode].totalQty += itemQty;
            productCodeGroups[itemCode].items.push(item);
        });
        
        basket.forEach(item => {
            const itemCode = item.productCode || item.code;
            const itemQty = item.totalQty || item.quantity || 0;
            
            // Get the correct unit price for this item based on cumulative tier
            let itemUnitPrice = basePrice;
            if (itemCode === state.product.code) {
                // Same product - use cumulative tier price
                itemUnitPrice = unitPrice;
            } else {
                // Different product - use its own pricing
                itemUnitPrice = parseFloat(item.unitPrice || item.price) || 17.58;
            }
            
            console.log('?? BASKET ITEM:', itemCode, 'qty:', itemQty, 'unitPrice:', itemUnitPrice, 'total:', itemUnitPrice * itemQty);
            
            totalBasketGarmentCost += itemUnitPrice * itemQty;
            
            // CRITICAL FIX: Customizations apply to ALL items with same productCode
            const cumulativeQtyForThisProduct = productCodeGroups[itemCode]?.totalQty || itemQty;
            
            // Collect basket customizations
            if (item.positions && Array.isArray(item.positions)) {
                item.positions.forEach(pos => {
                    if (pos.method) {
                        const custUnitPrice = pos.unitPrice || (pos.method === 'embroidery' ? 5.00 : 3.50);
                        // Check if this customization was already added for this productCode
                        const existingCustom = allBasketCustomizations.find(c => 
                            c.productCode === itemCode && 
                            (c.position === (pos.name || pos.position)) && 
                            c.method === (pos.method === 'embroidery' ? 'Embroidery' : 'Print')
                        );
                        
                        if (!existingCustom) {
                            allBasketCustomizations.push({
                                productCode: itemCode,
                                position: pos.name || pos.position,
                                method: pos.method === 'embroidery' ? 'Embroidery' : 'Print',
                                unitPrice: custUnitPrice,
                                qty: cumulativeQtyForThisProduct,
                                total: custUnitPrice * cumulativeQtyForThisProduct,
                                color: item.color || item.colorName
                            });
                        }
                        if (pos.method === 'embroidery') hasEmbroidery = true;
                    }
                });
            }
            // Also check customizations object format
            if (item.customizations && typeof item.customizations === 'object') {
                Object.entries(item.customizations).forEach(([posKey, posData]) => {
                    if (posData && posData.method) {
                        const custUnitPrice = posData.unitPrice || (posData.method === 'embroidery' ? 5.00 : 3.50);
                        // Check if this customization was already added for this productCode
                        const existingCustom = allBasketCustomizations.find(c => 
                            c.productCode === itemCode && 
                            (c.position === (posData.name || posKey)) && 
                            c.method === (posData.method === 'embroidery' ? 'Embroidery' : 'Print')
                        );
                        
                        if (!existingCustom) {
                            allBasketCustomizations.push({
                                productCode: itemCode,
                                position: posData.name || posKey,
                                method: posData.method === 'embroidery' ? 'Embroidery' : 'Print',
                                unitPrice: custUnitPrice,
                                qty: cumulativeQtyForThisProduct,
                                total: custUnitPrice * cumulativeQtyForThisProduct,
                                color: item.color || item.colorName
                            });
                        }
                        if (posData.method === 'embroidery') hasEmbroidery = true;
                    }
                });
            }
        });
        
        // ===== CURRENT SELECTION (not yet saved) =====
        const currentGarmentTotal = unitPrice * currentQty;
        let currentCustomTotal = 0;
        const currentCustomizations = [];
        
        // Calculate TOTAL quantity (basket + current) for customization calculations
        let totalQtyForCustomizations = basketQty + currentQty;
        
        // Get all checked position cards
        const checkedCards = document.querySelectorAll('.position-card input[type="checkbox"]:checked');
        console.log('?? Checked position cards:', checkedCards.length);
        
        checkedCards.forEach(checkbox => {
            const card = checkbox.closest('.position-card');
            const position = checkbox.value;
            const positionName = checkbox.parentElement.querySelector('span').textContent.trim();
            const method = state.positionMethods && state.positionMethods[position];
            
            console.log('?? Analyzing position:', { position, positionName, method, totalQtyForCustomizations });
            
            if (method && totalQtyForCustomizations > 0) {
                // Get price from active badge
                const activeBadge = card.querySelector(`.price-badge.price-${method === 'embroidery' ? 'emb' : 'print'}.active`);
                console.log('?? Active badge found:', activeBadge, 'for method:', method);
                
                if (activeBadge) {
                    const priceText = activeBadge.querySelector('.price-value').textContent;
                    const priceMatch = priceText.match(/[\d.]+/);
                    if (priceMatch) {
                        const pricePerItem = parseFloat(priceMatch[0]);
                        const totalForPosition = pricePerItem * totalQtyForCustomizations;
                        currentCustomTotal += totalForPosition;
                        
                        console.log('?? Adding customization cost:', { position, method, pricePerItem, totalQtyForCustomizations, totalForPosition });
                        
                        if (method === 'embroidery') hasEmbroidery = true;
                        
                        currentCustomizations.push({
                            position: positionName,
                            method: method === 'embroidery' ? 'Embroidery' : 'Print',
                            unitPrice: pricePerItem,
                            qty: totalQtyForCustomizations,
                            total: totalForPosition
                        });
                    }
                }
            }
        });
        
        // ===== GRAND TOTALS =====
        const grandGarmentTotal = totalBasketGarmentCost + currentGarmentTotal;
        const allCustomizations = [...allBasketCustomizations, ...currentCustomizations];
        let grandCustomTotal = 0;
        allCustomizations.forEach(c => grandCustomTotal += c.total);
        
        // Setup fee (�25 one-time for embroidery only)
        const setupFeeBase = hasEmbroidery ? 25.00 : 0;
        
        // GRAND TOTAL (ex VAT)
        const grandTotal = grandGarmentTotal + grandCustomTotal + setupFeeBase;
        
        console.log('?? GRAND TOTALS:', {
            basketGarment: totalBasketGarmentCost,
            currentGarment: currentGarmentTotal,
            grandGarment: grandGarmentTotal,
            customizations: grandCustomTotal,
            setup: setupFeeBase,
            GRAND_TOTAL: grandTotal
        });

        // Update summary color
        const summaryColor = document.getElementById('summaryColor');
        if (summaryColor) {
            summaryColor.textContent = state.selectedColorName || state.selectedColor;
        }

        // Update size breakdown
        const summarySizes = document.getElementById('summarySizes');
        if (summarySizes) {
            let sizesHtml = '';
            if (state.sizeQuantities && Object.keys(state.sizeQuantities).length > 0) {
                Object.entries(state.sizeQuantities).forEach(([size, sizeQty]) => {
                    if (sizeQty > 0) {
                        sizesHtml += `<div class="size-row"><span>${size}</span><span>�${sizeQty}</span></div>`;
                    }
                });
            } else {
                sizesHtml = `<div class="size-row"><span>Select sizes above</span></div>`;
            }
            summarySizes.innerHTML = sizesHtml;
        }

        // Get total items count from basket
        let totalItemsInBasket = 0;
        basket.forEach(item => {
            // Check for totalQty first (new format), then quantity/qty, then sum sizes/quantities objects
            if (item.totalQty) {
                totalItemsInBasket += item.totalQty;
            } else if (item.quantity || item.qty) {
                totalItemsInBasket += item.quantity || item.qty || 0;
            } else if (item.sizes) {
                // Sum up sizes object
                Object.values(item.sizes).forEach(qty => {
                    totalItemsInBasket += parseInt(qty) || 0;
                });
            } else if (item.quantities) {
                // Sum up quantities object
                Object.values(item.quantities).forEach(qty => {
                    totalItemsInBasket += parseInt(qty) || 0;
                });
            }
        });
        const displayQty = totalItemsInBasket + currentQty;
        
        console.log('?? DISPLAY QTY:', { totalItemsInBasket, currentQty, displayQty, basketLength: basket.length });

        // Update quantity and prices
        const summaryQty = document.getElementById('summaryQty');
        if (summaryQty) summaryQty.textContent = displayQty;

        const summaryUnitPrice = document.getElementById('summaryUnitPrice');
        if (summaryUnitPrice) {
            summaryUnitPrice.textContent = formatCurrency(unitPrice);
        }

        // TOTAL garment cost (ALL basket + current)
        const summaryGarmentTotal = document.getElementById('summaryGarmentTotal');
        if (summaryGarmentTotal) {
            summaryGarmentTotal.textContent = formatCurrency(grandGarmentTotal);
        }

        // Discount row (based on current tier)
        const summaryDiscountRow = document.getElementById('summaryDiscount');
        if (summaryDiscountRow) {
            if (currentTier && currentTier.discount > 0) {
                summaryDiscountRow.style.display = 'flex';
                document.getElementById('summaryDiscountPercent').textContent = `-${currentTier.discount}%`;
                const fullPriceTotal = basePrice * displayQty;
                const discountAmount = fullPriceTotal - grandGarmentTotal;
                document.getElementById('summaryDiscountAmount').textContent = `-${formatCurrency(discountAmount)}`;
            } else {
                summaryDiscountRow.style.display = 'none';
            }
        }

        // Update customization breakdown - ALL customizations (basket + current)
        const summaryCustomizationBreakdown = document.getElementById('summaryCustomizationBreakdown');
        if (summaryCustomizationBreakdown) {
            if (allCustomizations.length > 0) {
                let breakdownHtml = '';
                allCustomizations.forEach(item => {
                    const methodClass = item.method === 'Embroidery' ? 'customization-card-embroidery' : 'customization-card-print';
                    
                    breakdownHtml += `
                        <div class="customization-card ${methodClass}">
                            <div class="customization-card-header">
                                <span class="customization-position">${item.position} ${item.method}</span>
                                <span class="customization-total">${item.qty} � ${formatCurrency(item.unitPrice)} = ${formatCurrency(item.total)} <span class="vat-suffix">${vatSuffix()}</span></span>
                            </div>
                        </div>
                    `;
                });
                summaryCustomizationBreakdown.innerHTML = breakdownHtml;
            } else {
                summaryCustomizationBreakdown.innerHTML = '';
            }
        }
        
        // ===== UPDATE NEW SIDEBAR-COSTS (PC-style) =====
        // Update Garment Cost in sidebar
        const sidebarGarmentCost = document.getElementById('sidebarGarmentCost');
        if (sidebarGarmentCost) {
            sidebarGarmentCost.textContent = formatCurrency(grandGarmentTotal);
        }
        
        const garmentUnitPriceEl = document.getElementById('garmentUnitPrice');
        if (garmentUnitPriceEl) {
            garmentUnitPriceEl.textContent = formatCurrency(unitPrice);
        }
        
        const garmentQtyEl = document.getElementById('garmentQty');
        if (garmentQtyEl) {
            garmentQtyEl.textContent = `Qty: ${displayQty}`;
        }
        
        // Update customization costs list with colored cards
        const customizationCostsList = document.getElementById('customizationCostsList');
        if (customizationCostsList) {
            if (allCustomizations.length > 0) {
                let costsHtml = '';
                allCustomizations.forEach(item => {
                    // Use different class for print vs embroidery
                    const sectionClass = item.method === 'Print' ? 'section print-method' : 'section embroidery';
                    const methodLabel = item.method === 'Embroidery' ? 'Embroidery' : 'Print';
                    
                    costsHtml += `
                        <div class="${sectionClass}">
                            <div class="row">
                                <span class="label white">${item.position} ${methodLabel}</span>
                                <span class="value white">${formatCurrency(item.total)}</span>
                            </div>
                            <div class="row detail white">
                                <span>Unit Price: ${formatCurrency(item.unitPrice)}</span>
                                <span>Qty: ${item.qty}</span>
                            </div>
                        </div>
                    `;
                });
                
                // Add digitizing fee if embroidery
                if (hasEmbroidery) {
                    costsHtml += `
                        <div class="row detail" style="padding: 10px 0; border-top: 1px dashed #e5e7eb; margin-top: 8px;">
                            <span style="color: #666;">Digitizing Fee (one-time)</span>
                            <span style="color: #666;">�25.00 ${vatSuffix()}</span>
                        </div>
                    `;
                }
                
                customizationCostsList.innerHTML = costsHtml;
            } else {
                customizationCostsList.innerHTML = '<p style="color: #9ca3af; text-align: center; padding: 12px 0; font-size: 13px;">No customizations selected</p>';
            }
        }
        
        // Update sidebar total
        const sidebarTotalCost = document.getElementById('sidebarTotalCost');
        if (sidebarTotalCost) {
            sidebarTotalCost.innerHTML = `${formatCurrency(grandTotal)} <span class="vat-suffix">${vatSuffix()}</span>`;
        }
        
        // Update basket items list
        updateBasketItemsList(basket, unitPrice);
        
        // Show/hide Digitizing Fee row
        const digitizingFeeRow = document.getElementById('digitizingFeeRow');
        if (digitizingFeeRow) {
            digitizingFeeRow.style.display = hasEmbroidery ? 'flex' : 'none';
        }
        
        // Calculate and update Branding Total (customizations + digitizing if applicable)
        const brandingTotalEl = document.getElementById('brandingTotal');
        if (brandingTotalEl) {
            const brandingTotal = grandCustomTotal + (hasEmbroidery ? 25.00 : 0);
            brandingTotalEl.textContent = formatCurrency(brandingTotal);
        }

        // GRAND TOTAL (ALL basket + current)
        const summaryTotal = document.getElementById('summaryTotal');
        if (summaryTotal) {
            summaryTotal.innerHTML = `<span style="color: #10b981; font-weight: 600;">${formatCurrency(grandTotal)}</span> <span class="vat-suffix">${vatSuffix()}</span>`;
        }
        
        // Also update the card header total to match
        const cardHeaderTotal = document.getElementById('cardHeaderTotal');
        if (cardHeaderTotal) {
            cardHeaderTotal.textContent = formatCurrency(grandTotal);
        }
        
        // And the card face total
        const cardTotal = document.getElementById('cardTotal');
        if (cardTotal) {
            cardTotal.textContent = formatCurrency(grandTotal);
        }

        // Update VAT suffix labels
        document.querySelectorAll('.vat-suffix').forEach(el => {
            el.textContent = vatSuffix();
        });

        // Update action bar total - GRAND TOTAL (basket + current)
        const actionBarTotal = document.getElementById('actionBarTotal');
        if (actionBarTotal) {
            actionBarTotal.textContent = formatCurrency(grandTotal);
        }
        
        // Update action bar suffix
        const actionVatSuffix = document.querySelector('.action-bar .price-suffix');
        if (actionVatSuffix) {
            actionVatSuffix.textContent = vatSuffix();
        }
        
        // Update order card
        updateOrderCard();
    }

    // === Update Basket Count Badge in Navigation ===
    function updateBasketCount() {
        const basket = JSON.parse(localStorage.getItem('quoteBasket') || '[]');
        let totalItems = 0;
        
        basket.forEach(item => {
            if (item.sizes) {
                Object.values(item.sizes).forEach(qty => {
                    totalItems += qty;
                });
            }
        });
        
        // Update all basket badges in navigation
        const badges = document.querySelectorAll('.nav-badge');
        badges.forEach(badge => {
            if (totalItems > 0) {
                badge.textContent = totalItems > 99 ? '99+' : totalItems;
                badge.style.display = 'flex';
            } else {
                badge.style.display = 'none';
            }
        });
    }

    // === Update Basket Items List with +/- controls ===
    function updateBasketItemsList(basket, unitPrice) {
        const basketItemsList = document.getElementById('basketItemsList');
        if (!basketItemsList) return;
        
        if (!basket || basket.length === 0) {
            basketItemsList.innerHTML = '<p style="color: #9ca3af; text-align: center; padding: 16px 0; font-size: 13px;">No items in basket</p>';
            return;
        }
        
        let itemsHtml = '';
        basket.forEach((item, index) => {
            const itemImage = item.colorImage || item.image || 'assets/images/products/default.jpg';
            const itemColor = item.color || 'Black';
            const itemName = item.productName || item.name || 'Custom Product';
            
            // Support both 'sizes' and 'quantities' keys
            const sizes = item.sizes || item.quantities || {};
            
            // Build sizes display (read-only, no +/- controls)
            let sizesHtml = '';
            if (Object.keys(sizes).length > 0) {
                const sizesList = Object.entries(sizes)
                    .filter(([, qty]) => qty > 0)
                    .map(([size, qty]) => `${size}: ${qty}`)
                    .join(', ');
                sizesHtml = `<span class="sizes-text">${sizesList}</span>`;
            }
            
            itemsHtml += `
                <div class="basket-item-card" data-index="${index}">
                    <div class="basket-item-image">
                        <img src="${itemImage}" alt="${itemName}" onerror="this.src='../brandedukv15-child/assets/images/products/default.jpg'">
                    </div>
                    <div class="basket-item-info">
                        <h4>${itemName}</h4>
                        <p class="item-color">Color: ${itemColor}</p>
                        <div class="item-sizes">
                            ${sizesHtml}
                        </div>
                    </div>
                    <button type="button" class="basket-item-remove" data-index="${index}">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2"/>
                            <line x1="10" y1="11" x2="10" y2="17"/>
                            <line x1="14" y1="11" x2="14" y2="17"/>
                        </svg>
                    </button>
                </div>
            `;
        });
        
        basketItemsList.innerHTML = itemsHtml;
        
        // Attach event listeners for remove buttons only
        basketItemsList.querySelectorAll('.basket-item-remove').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                const index = parseInt(btn.dataset.index);
                removeBasketItem(index);
            });
        });
    }
    
    // Handle +/- quantity changes in basket
    function handleBasketQtyChange(itemIndex, size, isIncrement) {
        let basket = JSON.parse(localStorage.getItem('quoteBasket') || '[]');
        
        if (itemIndex < 0 || itemIndex >= basket.length) return;
        
        const item = basket[itemIndex];
        if (!item.sizes || !item.sizes[size]) return;
        
        if (isIncrement) {
            item.sizes[size]++;
        } else {
            item.sizes[size]--;
            if (item.sizes[size] <= 0) {
                delete item.sizes[size];
            }
        }
        
        // Remove item if no sizes left
        if (Object.keys(item.sizes).length === 0) {
            basket.splice(itemIndex, 1);
        }
        
        localStorage.setItem('quoteBasket', JSON.stringify(basket));
        updateBasketCount();
        updatePricingSummary();
    }
    
    // Remove item from basket
    function removeBasketItem(itemIndex) {
        let basket = JSON.parse(localStorage.getItem('quoteBasket') || '[]');
        
        if (itemIndex < 0 || itemIndex >= basket.length) return;
        
        basket.splice(itemIndex, 1);
        localStorage.setItem('quoteBasket', JSON.stringify(basket));
        updateBasketCount();
        updatePricingSummary();
    }

    // === Add to Quote Button State ===
    function hasUploadedDesign() {
        // Check if there's any uploaded logo in sessionStorage or state
        const customizingPosition = sessionStorage.getItem('customizingPosition');
        if (customizingPosition) {
            // Check if there's an uploaded image for this position
            const uploadedKey = `uploaded_${customizingPosition}`;
            return sessionStorage.getItem(uploadedKey) !== null;
        }
        
        // Check if any position has a design uploaded
        const positions = ['left-chest', 'right-chest', 'front-center', 'back-large', 'left-sleeve', 'right-sleeve'];
        return positions.some(pos => {
            const uploadedKey = `uploaded_${pos}`;
            return sessionStorage.getItem(uploadedKey) !== null;
        });
    }

    function updateQuoteButtonState() {
        const quoteBtn = document.getElementById('designNowBtn');
        if (!quoteBtn) return;

        const hasSizes = state.quantity > 0;
        const hasDesign = hasUploadedDesign();
        
        if (hasSizes && hasDesign) {
            quoteBtn.classList.add('enabled');
        } else {
            quoteBtn.classList.remove('enabled');
        }
    }

    // === Position Selection ===

    // === Delivery Date ===
    function updateDeliveryDate() {
        const deliveryDate = document.getElementById('deliveryDate');
        if (!deliveryDate) return;

        const today = new Date();
        const minDays = 5; // production + shipping min
        const maxDays = 8; // production + shipping max

        const minDate = new Date(today);
        minDate.setDate(today.getDate() + minDays);

        const maxDate = new Date(today);
        maxDate.setDate(today.getDate() + maxDays);

        const formatDate = (date) => {
            const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
            return `${months[date.getMonth()]} ${date.getDate()}`;
        };

        deliveryDate.textContent = `${formatDate(minDate)} - ${formatDate(maxDate)}`;
    }

    // === Gallery ===
    function setupGallery() {
        // Gallery thumbnails are now dynamically rendered by renderColorThumbnails()
        // This function is kept for backward compatibility
        // Thumbnails will be rendered when colors are loaded via refreshProductDOM()
        console.log('? Gallery setup complete (thumbnails rendered dynamically)');
    }

    // === Modals ===
    function setupModals() {
        // Size Guide Modal
        elements.sizeGuideBtn?.addEventListener('click', (e) => {
            e.preventDefault();
            openModal(elements.sizeGuideModal);
        });

        elements.closeSizeGuide?.addEventListener('click', () => {
            closeModal(elements.sizeGuideModal);
        });

        // Design Editor Modal
        elements.designNowBtn?.addEventListener('click', () => {
            openModal(elements.designEditorModal);
            updateZoneVisibility();
            setupZoneDeleteButtons();
        });

        elements.closeEditor?.addEventListener('click', () => {
            closeModal(elements.designEditorModal);
        });

        elements.doneDesign?.addEventListener('click', () => {
            addToQuote();
        });

        // Close on backdrop click
        document.querySelectorAll('.modal-overlay').forEach(modal => {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    closeModal(modal);
                }
            });
        });
    }

    function openModal(modal) {
        if (!modal) return;
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }

    function closeModal(modal) {
        if (!modal) return;
        modal.classList.remove('active');
        document.body.style.overflow = '';
    }

    // === Design Editor ===
    function setupDesignEditor() {
        // Browse link and upload dropzone
        const browseLink = document.getElementById('browseLink');
        const uploadDropzone = document.getElementById('uploadDropzone');
        
        browseLink?.addEventListener('click', (e) => {
            e.stopPropagation();
            elements.logoUpload?.click();
        });
        
        uploadDropzone?.addEventListener('click', () => {
            elements.logoUpload?.click();
        });

        elements.logoUpload?.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                handleFileUpload(file);
            }
        });

        // Color circles for text
        const colorCircles = document.querySelectorAll('.color-circle:not(.none-circle)');
        colorCircles.forEach(circle => {
            circle.addEventListener('click', () => {
                colorCircles.forEach(c => c.classList.remove('active'));
                circle.classList.add('active');
            });
        });

        // Stroke color circles
        const strokeCircles = document.querySelectorAll('.stroke-circle');
        strokeCircles.forEach(circle => {
            circle.addEventListener('click', () => {
                strokeCircles.forEach(c => c.classList.remove('active'));
                circle.classList.add('active');
            });
        });

        // Clipart tabs
        const clipartTabs = document.querySelectorAll('.clipart-tab');
        clipartTabs.forEach(tab => {
            tab.addEventListener('click', () => {
                clipartTabs.forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
            });
        });



        // Text panel
        const addTextBtn = document.getElementById('addTextBtn');
        const designText = document.getElementById('designText');
        
        addTextBtn?.addEventListener('click', () => {
            const text = designText?.value.trim();
            if (text) {
                showToast(`Text "${text}" added to design`);
                designText.value = '';
            }
        });

        // Text colors
        document.querySelectorAll('.text-color').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.text-color').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
            });
        });

        // Font size control
        const fontSizeValue = document.getElementById('fontSizeValue');
        document.querySelectorAll('.font-size-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                let size = parseInt(fontSizeValue?.textContent) || 24;
                if (btn.dataset.action === 'increase') {
                    size = Math.min(72, size + 2);
                } else {
                    size = Math.max(8, size - 2);
                }
                if (fontSizeValue) fontSizeValue.textContent = size;
            });
        });

        // Clipart categories
        document.querySelectorAll('.clipart-cat').forEach(cat => {
            cat.addEventListener('click', () => {
                document.querySelectorAll('.clipart-cat').forEach(c => c.classList.remove('active'));
                cat.classList.add('active');
            });
        });

        // Clipart items
        document.querySelectorAll('.clipart-item').forEach(item => {
            item.addEventListener('click', () => {
                showToast('Clipart added to design');
            });
        });
    }

    function handleFileUpload(file) {
        if (!file.type.startsWith('image/')) {
            showToast('Please upload an image file');
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            const logoSrc = e.target.result;
            
            // Update panel preview
            if (elements.previewImage) {
                elements.previewImage.src = logoSrc;
            }
            if (elements.uploadDropzone) {
                elements.uploadDropzone.style.display = 'none';
            }
            if (elements.uploadPreview) {
                elements.uploadPreview.style.display = 'block';
            }
            
            // Show logo in active design zone(s)
            state.positions.forEach(posId => {
                const zone = document.querySelector(`.design-zone[data-zone="${posId}"]`);
                if (zone) {
                    const zoneLogo = zone.querySelector('.zone-logo');
                    if (zoneLogo) {
                        zoneLogo.src = logoSrc;
                        zoneLogo.style.display = 'block';
                        zone.classList.add('has-logo');
                    }
                }
            });
            
            // Save uploaded logo to sessionStorage
            const customizingPosition = sessionStorage.getItem('customizingPosition');
            if (customizingPosition) {
                const uploadedKey = `uploaded_${customizingPosition}`;
                sessionStorage.setItem(uploadedKey, logoSrc);
            }
            
            showToast('Logo uploaded successfully!');
            
            // Update quote button state
            updateQuoteButtonState();
        };
        reader.readAsDataURL(file);

        // Setup replace/remove buttons
        const replaceBtn = elements.uploadPreview?.querySelector('.replace');
        const removeBtn = elements.uploadPreview?.querySelector('.remove');

        replaceBtn?.addEventListener('click', () => {
            elements.logoUpload?.click();
        });

        removeBtn?.addEventListener('click', () => {
            if (elements.uploadDropzone) {
                elements.uploadDropzone.style.display = 'flex';
            }
            if (elements.uploadPreview) {
                elements.uploadPreview.style.display = 'none';
            }
            if (elements.previewImage) {
                elements.previewImage.src = '';
            }
            // Also remove from all zones
            clearAllZoneLogos();
            
            // Remove from sessionStorage
            const customizingPosition = sessionStorage.getItem('customizingPosition');
            if (customizingPosition) {
                const uploadedKey = `uploaded_${customizingPosition}`;
                sessionStorage.removeItem(uploadedKey);
            }
            
            // Update quote button state
            updateQuoteButtonState();
        });
    }
    
    // === Zone Logo Management ===
    function clearAllZoneLogos() {
        document.querySelectorAll('.design-zone').forEach(zone => {
            const zoneLogo = zone.querySelector('.zone-logo');
            if (zoneLogo) {
                zoneLogo.src = '';
                zoneLogo.style.display = 'none';
            }
            zone.classList.remove('has-logo');
        });
    }
    
    function clearZoneLogo(zone) {
        const zoneLogo = zone.querySelector('.zone-logo');
        if (zoneLogo) {
            zoneLogo.src = '';
            zoneLogo.style.display = 'none';
        }
        zone.classList.remove('has-logo');
    }
    
    function setupZoneDeleteButtons() {
        document.querySelectorAll('.zone-delete').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const zone = btn.closest('.design-zone');
                if (zone) {
                    clearZoneLogo(zone);
                    showToast('Logo removed from ' + zone.querySelector('.zone-label')?.textContent);
                }
            });
        });
    }
    
    function updateZoneVisibility() {
        // Hide all zones first
        document.querySelectorAll('.design-zone').forEach(zone => {
            zone.style.display = 'none';
        });
        
        // Show only selected position zones
        state.positions.forEach(posId => {
            const zone = document.querySelector(`.design-zone[data-zone="${posId}"]`);
            if (zone) {
                zone.style.display = 'flex';
            }
        });
    }

    // === Toast Notification ===
    function showToast(message) {
        // Remove existing toast
        const existing = document.querySelector('.toast');
        if (existing) existing.remove();

        // Create toast
        const toast = document.createElement('div');
        toast.className = 'toast';
        toast.textContent = message;
        toast.style.cssText = `
            position: fixed;
            bottom: 100px;
            left: 50%;
            transform: translateX(-50%);
            padding: 12px 24px;
            background: rgba(31, 41, 55, 0.95);
            color: white;
            font-size: 14px;
            font-weight: 500;
            border-radius: 8px;
            z-index: 1000;
            animation: slideUp 0.3s ease;
        `;

        document.body.appendChild(toast);

        // Remove after delay
        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transition = 'opacity 0.3s';
            setTimeout(() => toast.remove(), 300);
        }, 2500);
    }

    // === Add to Quote ===
    function addToQuote(options = {}) {
        const { silent = false } = options; // silent = true skips the success modal
        
        // Validate that we have items
        if (state.quantity === 0) {
            showToast('Please add at least one item', true);
            return;
        }

        // Get current basket from localStorage
        const basket = JSON.parse(localStorage.getItem('quoteBasket') || '[]');
        
        // Build positions array with method and pricing for each selected position
        const positions = [];
        const checkedCards = document.querySelectorAll('.position-card input[type="checkbox"]:checked');
        checkedCards.forEach(checkbox => {
            const card = checkbox.closest('.position-card');
            const position = checkbox.value;
            const positionName = checkbox.parentElement.querySelector('span')?.textContent.trim() || position;
            const method = state.positionMethods && state.positionMethods[position];
            
            if (method) {
                // Get price from active badge
                const activeBadge = card.querySelector(`.price-badge.price-${method === 'embroidery' ? 'emb' : 'print'}.active`);
                let unitPrice = method === 'embroidery' ? 5.00 : 3.50; // defaults
                if (activeBadge) {
                    const priceText = activeBadge.querySelector('.price-value')?.textContent || '';
                    const priceMatch = priceText.match(/[\d.]+/);
                    if (priceMatch) {
                        unitPrice = parseFloat(priceMatch[0]);
                    }
                }
                
                positions.push({
                    position: position,
                    name: positionName,
                    method: method, // 'print' or 'embroidery'
                    unitPrice: unitPrice
                });
            }
        });
        
        // Create item object with all customization data
        const newItem = {
            id: Date.now().toString(),
            productCode: state.product?.code || 'GD067',
            productName: state.product?.name || 'Gildan Softstyle� Midweight Hoodie',
            color: state.selectedColorName || state.selectedColor,
            colorId: state.selectedColor,
            colorImage: state.selectedColorImage,
            quantities: { ...state.sizeQuantities },
            totalQty: state.quantity,
            unitPrice: getCurrentUnitPrice(),
            priceMode: localStorage.getItem('brandeduk-vat-mode') === 'on' ? 'inc' : 'ex',
            // Branding positions with method and pricing
            positions: positions,
            // Customization zones (logos/text) - legacy format
            customizations: getActiveCustomizations(),
            addedAt: new Date().toISOString()
        };
        
        console.log('?? Adding to basket:', {
            quantities: newItem.quantities,
            totalQty: newItem.totalQty,
            color: newItem.color,
            positions: newItem.positions
        });
        
        // Add to basket
        basket.push(newItem);
        
        console.log('? Basket after push:', basket.length, 'items, total quantities:', basket.map(i => i.totalQty));
        
        // Save to localStorage with error handling
        try {
            localStorage.setItem('quoteBasket', JSON.stringify(basket));
        } catch (e) {
            if (e.name === 'QuotaExceededError') {
                console.error('?? LocalStorage quota exceeded!');
                
                // Try to compress and save again
                compressItemImages(newItem).then(compressedItem => {
                    basket[basket.length - 1] = compressedItem;
                    try {
                        localStorage.setItem('quoteBasket', JSON.stringify(basket));
                        showToast('Item added (images compressed due to storage limit)');
                    } catch (e2) {
                        showToast('Storage full! Please complete your quote or remove items.', true);
                        basket.pop(); // Remove the item we just added
                    }
                });
                return; // Exit early, will continue after compression
            } else {
                throw e; // Re-throw other errors
            }
        }
        
        // Close the editor modal
        closeModal(elements.designEditorModal);
        
        // Update the cart badge
        updateCartBadge();
        
        // Show success message with option to go to basket (unless silent)
        if (!silent) {
            showAddedToQuoteModal(newItem);
        }
    }

    // Note: getCurrentUnitPrice() is defined earlier in the file (around line 1039)
    // and uses state.pricing.tiers correctly

    function getActiveCustomizations() {
        const customizations = [];
        
        // Check each zone for content
        document.querySelectorAll('.design-zone').forEach(zone => {
            const zoneName = zone.getAttribute('data-zone');
            const logoImg = zone.querySelector('.zone-logo');
            const textEl = zone.querySelector('.zone-text');
            
            if (logoImg && logoImg.style.display !== 'none' && logoImg.src) {
                customizations.push({
                    zone: zoneName,
                    type: 'logo',
                    content: logoImg.src
                });
            }
            
            if (textEl && textEl.style.display !== 'none' && textEl.textContent) {
                customizations.push({
                    zone: zoneName,
                    type: 'text',
                    content: textEl.textContent,
                    font: textEl.style.fontFamily || 'Arial',
                    color: textEl.style.color || '#000'
                });
            }
        });
        
        return customizations;
    }

    function showAddedToQuoteModal(item) {
        // Create overlay
        const modal = document.createElement('div');
        modal.className = 'quote-added-modal';
        modal.innerHTML = `
            <div class="quote-added-content">
                <div class="quote-added-check">
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#16a34a" stroke-width="2.5">
                        <circle cx="12" cy="12" r="10"/>
                        <path d="M8 12l2.5 2.5L16 9"/>
                    </svg>
                </div>
                <h3>Added to Quote!</h3>
                <p class="quote-added-summary">
                    ${item.totalQty}� ${item.productName}<br>
                    <span class="text-muted">${item.color}</span>
                </p>
                <div class="quote-added-actions">
                    <button class="btn-secondary" id="addAnotherBtn">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <line x1="12" y1="5" x2="12" y2="19"/>
                            <line x1="5" y1="12" x2="19" y2="12"/>
                        </svg>
                        Add Another Color/Size
                    </button>
                    <button class="btn-primary" id="viewQuoteBtn">View Quote Basket</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Add entrance animation
        requestAnimationFrame(() => {
            modal.classList.add('active');
        });
        
        // Button handlers
        modal.querySelector('#addAnotherBtn').addEventListener('click', () => {
            modal.remove();
            // Reset the form for new item
            resetCustomizationForm();
        });
        
        modal.querySelector('#viewQuoteBtn').addEventListener('click', () => {
            window.location.href = 'basket-mobile.html';
        });
    }

    function resetCustomizationForm() {
        // Reset quantities
        state.quantity = 0;
        state.sizeQuantities = {};
        
        // Clear ALL size rows
        const container = document.querySelector('.selected-sizes');
        if (container) {
            container.innerHTML = '<!-- Size rows will be added dynamically -->';
        }
        
        // Update displays
        updateSizeQuantities();
        updatePricingSummary();
        updateLiveBadge();
        
        // Show toast
        showToast('Ready for next item!');
    }

    // === Cart Badge ===
    function updateCartBadge() {
        // Try all badge IDs (header and bottom nav)
        const badges = [
            document.getElementById('cartBadge'),
            document.getElementById('cartCount'),
            document.getElementById('navCartBadge')
        ].filter(Boolean);
        
        if (badges.length === 0) return;

        try {
            const basket = JSON.parse(localStorage.getItem('quoteBasket') || '[]');
            let totalItems = 0;
            
            // Count total quantities across all items
            basket.forEach(item => {
                if (item.quantities && typeof item.quantities === 'object') {
                    Object.values(item.quantities).forEach(qty => {
                        totalItems += parseInt(qty) || 0;
                    });
                } else if (item.quantity) {
                    totalItems += parseInt(item.quantity) || 0;
                } else {
                    totalItems += 1; // Count item itself if no quantity
                }
            });
            
            badges.forEach(badge => {
                badge.textContent = totalItems;
                badge.style.display = totalItems > 0 ? 'flex' : 'none';
            });
        } catch (e) {
            badges.forEach(badge => {
                badge.style.display = 'none';
            });
        }
    }

    // Update badge with CURRENT selection + basket items
    function updateLiveBadge() {
        const badges = [
            document.getElementById('cartBadge'),
            document.getElementById('cartCount'),
            document.getElementById('navCartBadge')
        ].filter(Boolean);
        
        if (badges.length === 0) return;

        // Current selection from state
        let currentQty = state.quantity || 0;
        
        // Plus items already in basket
        try {
            const basket = JSON.parse(localStorage.getItem('quoteBasket') || '[]');
            basket.forEach(item => {
                if (item.quantities && typeof item.quantities === 'object') {
                    Object.values(item.quantities).forEach(qty => {
                        currentQty += parseInt(qty) || 0;
                    });
                } else if (item.quantity) {
                    currentQty += parseInt(item.quantity) || 0;
                }
            });
        } catch (e) {}
        
        badges.forEach(badge => {
            badge.textContent = currentQty;
            badge.style.display = currentQty > 0 ? 'flex' : 'none';
        });
    }

    // === Initialize on DOM Ready ===
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    // Update cart badge with live quantities
    updateLiveBadge();

})();

