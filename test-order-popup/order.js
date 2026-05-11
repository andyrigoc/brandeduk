// order.js - Updated for real product data

// Global variables
window.current = 0;
window.selectedColour = null;
window.quantities = {};
window.productData = null;

let total = 2; // Start with just 2 pages for now

// Sample product data (will be loaded from API)
const sampleProduct = {
    code: "GD002",
    name: "Ultra Cotton adult t-shirt",
    brand: "GILDAN",
    price: 5.90,
    description: "Classic heavyweight t-shirt made from premium US cotton. Perfect for printing and embroidery. Durable, comfortable, and ideal for workwear.",
    fabric: "100% US Cotton. Ash: 99% US Cotton, 1% Polyester",
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
};

// Initialize
$(document).ready(function() {
    // Only load sample data if running standalone (not integrated)
    if (!window.openOrderPopup) {
        loadProductData();
        setupSizeQuantityControls();
        setupUploadBox();
    }
});

// Navigation function - exposed globally
window.goToPage = function(index) {
    // Validation before moving forward
    if (index > window.current) {
        // Page 1 (index 1) -> Page 2: Must select colour AND quantities
        if (window.current === 1 && !window.selectedColour) {
            alert("Please select a colour");
            return;
        }
        if (window.current === 1) {
            const totalQty = Object.values(window.quantities).reduce((a, b) => a + (b || 0), 0);
            if (totalQty === 0) {
                alert("Please select at least one size/quantity");
                return;
            }
        }
        // Page 4 -> Page 5: Must fill form
        if (window.current === 4) {
            if (!$("#customerName").val() || !$("#customerEmail").val() || !$("#customerPhone").val()) {
                alert("Please fill in all required fields");
                return;
            }
        }
    }
    
    const target = -(index * 100) + "%";
    
    $(".track").stop().animate(
        { left: target },
        {
            duration: 700,
            easing: "easeInOutBack"
        }
    );
    
    window.current = index;
};

// Load product data - exposed globally for integration
window.loadProductData = function() {
    // In real implementation, get from URL params or API
    window.productData = sampleProduct;
    
    $("#productTitle").text(window.productData.name);
    $("#productCode").text(window.productData.code);
    $("#productName").text(window.productData.name);
    $("#productBrand").text(window.productData.brand);
    $("#productPrice").text("£" + window.productData.price.toFixed(2));
    $("#productFabric").text(window.productData.fabric);
    $("#productSizes").text(window.productData.sizes.join(", "));
    $("#productMainImage").attr("src", window.productData.image);
    
    // Set description if available
    if (window.productData.description) {
        $("#productDescription").text(window.productData.description);
    }
    
    // Set colour count
    if (window.productData.colours) {
        $("#productColourCount").text(window.productData.colours.length + " colours");
    }
    
    // Load colours
    loadColours();
};

// Load colour swatches
function loadColours() {
    const colourGrid = $("#colourGrid");
    colourGrid.empty();
    
    if (!window.productData || !window.productData.colours) return;
    
    window.productData.colours.forEach(function(colour) {
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

// Setup size/quantity controls - exposed globally
window.setupSizeQuantityControls = function() {
    const grid = $("#sizeQuantityGrid");
    grid.empty();
    
    if (!window.productData || !window.productData.sizes) return;
    
    window.productData.sizes.forEach(function(size) {
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
};

// Setup quantity button handlers (only once)
$(document).on("click", ".qty-minus", function() {
    const size = $(this).data("size");
    if (window.quantities[size] > 0) {
        window.quantities[size]--;
        updateQuantityDisplay(size);
    }
});

$(document).on("click", ".qty-plus", function() {
    const size = $(this).data("size");
    window.quantities[size]++;
    updateQuantityDisplay(size);
});

// Update quantity display
function updateQuantityDisplay(size) {
    $(`.qty-value[data-size="${size}"]`).text(window.quantities[size]);
    updateTotals();
}

// Update totals
function updateTotals() {
    if (!window.productData) return;
    
    let totalPieces = 0;
    Object.values(window.quantities).forEach(qty => totalPieces += qty);
    
    const totalCost = totalPieces * window.productData.price;
    
    $("#totalPieces").text(totalPieces);
    $("#totalCost").text("£" + totalCost.toFixed(2));
}

// Setup upload box - exposed globally
window.setupUploadBox = function() {
    $("#uploadBox").off("click").click(function() {
        $("#logoUpload").click();
    });
    
    $("#logoUpload").off("change").change(function() {
        if (this.files && this.files[0]) {
            $("#uploadBox").html(`
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M9 11l3 3L22 4"/>
                    <path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/>
                </svg>
                <p style="color:#10b981">Logo uploaded: ${this.files[0].name}</p>
            `).css("border-color", "#10b981");
        }
    });
};

// Expose productData setter for integration
window.setProductData = function(data) {
    window.productData = data;
};

$(".next").click(function(){
    if(window.current < total - 1){
        window.goToPage(window.current + 1);
    }
});

$(".back").click(function(){
    if(window.current > 0){
        window.goToPage(window.current - 1);
    }
});

// Submit
$(".submit").click(function(){
    const orderData = {
        product: window.productData.code,
        colour: window.selectedColour,
        quantities: window.quantities,
        customer: {
            name: $("#customerName").val(),
            company: $("#customerCompany").val(),
            email: $("#customerEmail").val(),
            phone: $("#customerPhone").val(),
            address: $("#customerAddress").val(),
            city: $("#customerCity").val(),
            postcode: $("#customerPostcode").val(),
            notes: $("#customerNotes").val()
        }
    };
    
    // Generate reference
    const ref = "ORD-" + Date.now().toString().slice(-8);
    $("#orderRef").text("#" + ref);
    
    console.log("Order submitted:", orderData);
    
    // Move to confirmation page
    window.goToPage(5);
    
    // Here you would send to API
    // fetch('/api/submit-quote', { method: 'POST', body: JSON.stringify(orderData) })
});

/* ========================================
   PAGE 2: Colour & Quantities Logic
======================================== */

// Handle colour swatch selection (PAGE 2)
$(document).on("click", ".colour-swatch-item", function() {
    // Remove selection from all swatches
    $(".colour-swatch-item").removeClass("selected");
    
    // Add selection to clicked swatch
    $(this).addClass("selected");
    
    // Store selected colour
    const colourName = $(this).data("colour");
    const colourHex = $(this).data("hex");
    window.selectedColour = colourName;
    
    // Update summary display
    $("#selectedColourName").text(colourName);
    
    console.log("Selected colour:", colourName);
});

// Handle quantity controls (PAGE 2)
$(document).on("click", ".qty-btn.minus", function() {
    const input = $(this).siblings(".qty-input");
    let currentValue = parseInt(input.val()) || 0;
    
    if (currentValue > 0) {
        currentValue--;
        input.val(currentValue);
        updatePage2Summary();
        updateBoxHighlight($(this).closest(".size-qty-box"));
    }
});

$(document).on("click", ".qty-btn.plus", function() {
    const input = $(this).siblings(".qty-input");
    let currentValue = parseInt(input.val()) || 0;
    
    currentValue++;
    input.val(currentValue);
    updatePage2Summary();
    updateBoxHighlight($(this).closest(".size-qty-box"));
});

// Handle manual input change
$(document).on("change", ".qty-input", function() {
    let value = parseInt($(this).val()) || 0;
    
    // Ensure positive value
    if (value < 0) value = 0;
    
    $(this).val(value);
    updatePage2Summary();
    updateBoxHighlight($(this).closest(".size-qty-box"));
});

// Update summary totals
function updatePage2Summary() {
    let totalItems = 0;
    
    // Calculate total from all inputs
    $(".qty-input").each(function() {
        totalItems += parseInt($(this).val()) || 0;
    });
    
    // Update display
    $("#totalItems").text(totalItems);
    
    // Store in window object for later use
    window.quantities = {};
    $(".size-qty-box").each(function() {
        const sizeName = $(this).find(".size-name").text().trim();
        const qty = parseInt($(this).find(".qty-input").val()) || 0;
        if (qty > 0) {
            window.quantities[sizeName] = qty;
        }
    });
    
    console.log("Updated quantities:", window.quantities, "Total:", totalItems);
}

// Highlight box if has quantity
function updateBoxHighlight(box) {
    const qty = parseInt(box.find(".qty-input").val()) || 0;
    
    if (qty > 0) {
        box.addClass("has-qty");
    } else {
        box.removeClass("has-qty");
    }
}
