<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// Handle preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    // Get JSON data
    $json = file_get_contents('php://input');
    $data = json_decode($json, true);
    
    // Check for new format (customer.fullName) or old format (customer.firstName)
    $customer = $data['customer'];
    $summary = isset($data['summary']) ? $data['summary'] : [];
    $customizations = isset($data['customizations']) ? $data['customizations'] : [];
    $basket = isset($data['basket']) ? $data['basket'] : [];
    $product = isset($data['product']) ? $data['product'] : []; // Legacy support
    
    // Get customer name (support both formats)
    $customerName = isset($customer['fullName']) ? $customer['fullName'] : 
                   (isset($customer['firstName']) ? $customer['firstName'] . ' ' . $customer['lastName'] : 'Customer');
    $customerEmail = isset($customer['email']) ? $customer['email'] : '';
    $customerPhone = isset($customer['phone']) ? $customer['phone'] : '';
    
    // Email settings
    $to = 'devfaizanarshad@gmail.com'; // Test email - change back to 'info@brandeduk.com' for production
    $subject = 'New Quote Request from ' . $customerName;
    
    // Build email body
    $message = "
    <html>
    <head>
        <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #111827; }
            .header { background: #7c3aed; color: white; padding: 20px; border-radius: 8px 8px 0 0; }
            .section { background: #f9fafb; padding: 20px; margin: 15px 0; border-radius: 8px; border-left: 4px solid #7c3aed; }
            .section h2 { margin-top: 0; color: #374151; }
            .label { font-weight: bold; color: #374151; width: 150px; }
            .value { color: #111827; }
            table { width: 100%; border-collapse: collapse; margin-top: 10px; }
            td { padding: 10px; border-bottom: 1px solid #e5e7eb; vertical-align: top; }
            tr:last-child td { border-bottom: none; }
            .summary-box { background: #ede9fe; padding: 15px; border-radius: 8px; margin-top: 10px; }
            .summary-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #ddd4fe; }
            .summary-row:last-child { border-bottom: none; font-weight: bold; font-size: 1.1em; }
            .basket-item { background: white; padding: 12px; margin: 8px 0; border-radius: 6px; border: 1px solid #e5e7eb; }
            .basket-item-header { font-weight: bold; color: #7c3aed; margin-bottom: 8px; }
            .sizes-detail { color: #6b7280; font-size: 0.9em; margin-top: 4px; }
        </style>
    </head>
    <body>
        <div class='header'>
            <h1>🎉 New Quote Request</h1>
        </div>
        
        <div class='section'>
            <h2>👤 Customer Details</h2>
            <table>
                <tr><td class='label'>Name:</td><td class='value'>{$customerName}</td></tr>
                <tr><td class='label'>Email:</td><td class='value'>{$customerEmail}</td></tr>
                <tr><td class='label'>Phone:</td><td class='value'>{$customerPhone}</td></tr>
            </table>
        </div>
        
        <div class='section'>
            <h2>🛒 Basket Items (" . count($basket) . " " . (count($basket) == 1 ? 'item' : 'items') . ")</h2>";
    
    if (!empty($basket)) {
        foreach ($basket as $index => $item) {
            $itemName = isset($item['name']) ? htmlspecialchars($item['name']) : 'Product';
            $itemCode = isset($item['code']) ? htmlspecialchars($item['code']) : 'N/A';
            $itemColor = isset($item['color']) ? htmlspecialchars($item['color']) : 'N/A';
            $itemQty = isset($item['quantity']) ? $item['quantity'] : 0;
            $unitPrice = isset($item['unitPrice']) ? number_format($item['unitPrice'], 2) : '0.00';
            $itemTotal = isset($item['itemTotal']) ? number_format($item['itemTotal'], 2) : '0.00';
            
            // Build sizes breakdown
            $sizesText = '';
            if (isset($item['sizes']) && is_array($item['sizes'])) {
                $sizesArray = [];
                foreach ($item['sizes'] as $size => $qty) {
                    if ($qty > 0) {
                        $sizesArray[] = "{$size}: {$qty}";
                    }
                }
                $sizesText = !empty($sizesArray) ? implode(', ', $sizesArray) : (isset($item['sizesSummary']) ? $item['sizesSummary'] : '');
            } else {
                $sizesText = isset($item['sizesSummary']) ? $item['sizesSummary'] : '';
            }
            
            $message .= "
            <div class='basket-item'>
                <div class='basket-item-header'>Item #" . ($index + 1) . ": {$itemName} ({$itemCode})</div>
                <table>
                    <tr><td class='label'>Color:</td><td class='value'>{$itemColor}</td></tr>
                    <tr><td class='label'>Total Quantity:</td><td class='value'><strong>{$itemQty} units</strong></td></tr>";
            
            if ($sizesText) {
                $message .= "<tr><td class='label'>Sizes:</td><td class='value sizes-detail'>{$sizesText}</td></tr>";
            }
            
            $message .= "
                    <tr><td class='label'>Unit Price:</td><td class='value'>£{$unitPrice}</td></tr>
                    <tr><td class='label'>Item Total:</td><td class='value'><strong>£{$itemTotal}</strong></td></tr>
                </table>
            </div>";
        }
    } else {
        // Fallback to old product format if basket is empty
        $message .= "<p>Product: " . (isset($product['name']) ? htmlspecialchars($product['name']) : 'N/A') . "</p>";
        $message .= "<p>Code: " . (isset($product['code']) ? htmlspecialchars($product['code']) : 'N/A') . "</p>";
        $message .= "<p>Quantity: " . (isset($product['quantity']) ? $product['quantity'] : '0') . " units</p>";
    }
    
    $message .= "
        </div>
        
        <div class='section'>
            <h2>🎨 Customizations</h2>
            <table>";
    
    if (!empty($customizations)) {
        foreach ($customizations as $custom) {
            $method = isset($custom['method']) ? strtoupper($custom['method']) : 'N/A';
            $type = isset($custom['type']) ? $custom['type'] : 'N/A';
            $position = isset($custom['position']) ? htmlspecialchars($custom['position']) : 'Unknown';
            $hasLogo = isset($custom['hasLogo']) ? $custom['hasLogo'] : (isset($custom['uploadedLogo']) ? $custom['uploadedLogo'] : false);
            $logo = $hasLogo ? '✅ Yes' : '❌ No';
            $text = isset($custom['text']) && $custom['text'] ? " - Text: " . htmlspecialchars($custom['text']) : '';
            $unitPrice = isset($custom['unitPrice']) ? ($custom['unitPrice'] === 'POA' ? 'POA' : '£' . number_format($custom['unitPrice'], 2)) : 'N/A';
            $lineTotal = isset($custom['lineTotal']) ? ($custom['lineTotal'] === 'POA' ? 'POA' : '£' . number_format($custom['lineTotal'], 2)) : 'N/A';
            $qty = isset($custom['quantity']) ? $custom['quantity'] : 0;
            
            $message .= "
                <tr>
                    <td class='label'>{$position}</td>
                    <td class='value'>
                        <strong>{$method}</strong> - {$type}<br>
                        Logo Uploaded: {$logo}{$text}<br>
                        <small>Unit: {$unitPrice} × Qty: {$qty} = {$lineTotal}</small>
                    </td>
                </tr>";
        }
    } else {
        $message .= "<tr><td colspan='2'>No customizations selected</td></tr>";
    }
    
    $message .= "
            </table>
        </div>
        
        <div class='section'>
            <h2>💰 Quote Summary</h2>
            <div class='summary-box'>";
    
    if (!empty($summary)) {
        $garmentCost = isset($summary['garmentCost']) ? number_format($summary['garmentCost'], 2) : '0.00';
        $customizationCost = isset($summary['customizationCost']) ? number_format($summary['customizationCost'], 2) : '0.00';
        $digitizingFee = isset($summary['digitizingFee']) ? number_format($summary['digitizingFee'], 2) : '0.00';
        $subtotal = isset($summary['subtotal']) ? number_format($summary['subtotal'], 2) : '0.00';
        $vatAmount = isset($summary['vatAmount']) ? number_format($summary['vatAmount'], 2) : '0.00';
        $totalExVat = isset($summary['totalExVat']) ? number_format($summary['totalExVat'], 2) : '0.00';
        $totalIncVat = isset($summary['totalIncVat']) ? number_format($summary['totalIncVat'], 2) : '0.00';
        $vatMode = isset($summary['vatMode']) ? $summary['vatMode'] : 'ex';
        $displayTotal = isset($summary['displayTotal']) ? number_format($summary['displayTotal'], 2) : $totalExVat;
        $totalQty = isset($summary['totalQuantity']) ? $summary['totalQuantity'] : 0;
        $totalItems = isset($summary['totalItems']) ? $summary['totalItems'] : 0;
        
        $message .= "
                <div class='summary-row'>
                    <span>Total Items:</span>
                    <span><strong>{$totalItems} " . ($totalItems == 1 ? 'product' : 'products') . "</strong></span>
                </div>
                <div class='summary-row'>
                    <span>Total Quantity:</span>
                    <span><strong>{$totalQty} units</strong></span>
                </div>
                <div class='summary-row'>
                    <span>Garment Cost:</span>
                    <span>£{$garmentCost} ex VAT</span>
                </div>
                <div class='summary-row'>
                    <span>Customization Cost:</span>
                    <span>£{$customizationCost} ex VAT</span>
                </div>";
        
        if ($digitizingFee > 0) {
            $message .= "
                <div class='summary-row'>
                    <span>Digitizing Fee (one-time):</span>
                    <span>£{$digitizingFee} ex VAT</span>
                </div>";
        }
        
        $message .= "
                <div class='summary-row'>
                    <span>Subtotal (ex VAT):</span>
                    <span>£{$subtotal}</span>
                </div>
                <div class='summary-row'>
                    <span>VAT (20%):</span>
                    <span>£{$vatAmount}</span>
                </div>
                <div class='summary-row'>
                    <span><strong>Total (" . ($vatMode === 'inc' ? 'inc' : 'ex') . " VAT):</strong></span>
                    <span><strong>£{$displayTotal}</strong></span>
                </div>";
    } else {
        $message .= "<p>Summary not available</p>";
    }
    
    $message .= "
            </div>
        </div>
        
        <div class='section'>
            <h2>📅 Request Date</h2>
            <p>" . date('d/m/Y H:i:s') . "</p>
        </div>
        
        <p style='color: #6b7280; font-size: 12px; margin-top: 20px;'>This quote was automatically generated from the BrandedUK website.</p>
    </body>
    </html>
    ";
    
    // Headers for HTML email
    $headers = "MIME-Version: 1.0" . "\r\n";
    $headers .= "Content-type:text/html;charset=UTF-8" . "\r\n";
    $headers .= "From: BrandedUK Quote System <noreply@brandeduk.com>" . "\r\n";
    $headers .= "Reply-To: {$customerEmail}" . "\r\n";
    
    // Send email
    if (mail($to, $subject, $message, $headers)) {
        echo json_encode(['success' => true, 'message' => 'Quote sent successfully']);
    } else {
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Failed to send email']);
    }
} else {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method not allowed']);
}
?>
