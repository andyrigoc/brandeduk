<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST');

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    // Get JSON data
    $json = file_get_contents('php://input');
    $data = json_decode($json, true);
    
    $customer = $data['customer'];
    $product = $data['product'];
    $customizations = $data['customizations'];
    
    // Email settings
    $to = 'info@brandeduk.com';
    $subject = 'New Quote Request from ' . $customer['firstName'] . ' ' . $customer['lastName'];
    
    // Build email body
    $message = "
    <html>
    <head>
        <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; }
            .header { background: #7c3aed; color: white; padding: 20px; }
            .section { background: #f9fafb; padding: 15px; margin: 10px 0; border-radius: 8px; }
            .label { font-weight: bold; color: #374151; }
            .value { color: #111827; }
            table { width: 100%; border-collapse: collapse; }
            td { padding: 8px; border-bottom: 1px solid #e5e7eb; }
        </style>
    </head>
    <body>
        <div class='header'>
            <h1>🎉 New Quote Request</h1>
        </div>
        
        <div class='section'>
            <h2>👤 Customer Details</h2>
            <table>
                <tr><td class='label'>Name:</td><td class='value'>{$customer['firstName']} {$customer['lastName']}</td></tr>
                <tr><td class='label'>Email:</td><td class='value'>{$customer['email']}</td></tr>
                <tr><td class='label'>Phone:</td><td class='value'>{$customer['phone']}</td></tr>
                <tr><td class='label'>Address:</td><td class='value'>{$customer['address']}, {$customer['city']}, {$customer['postcode']}, {$customer['country']}</td></tr>
            </table>
        </div>
        
        <div class='section'>
            <h2>👕 Product Details</h2>
            <table>
                <tr><td class='label'>Product:</td><td class='value'>{$product['name']}</td></tr>
                <tr><td class='label'>Code:</td><td class='value'>{$product['code']}</td></tr>
                <tr><td class='label'>Color:</td><td class='value'>{$product['selectedColorName']}</td></tr>
                <tr><td class='label'>Quantity:</td><td class='value'>{$product['quantity']} units</td></tr>
                <tr><td class='label'>Price:</td><td class='value'>£{$product['price']} each</td></tr>
            </table>
        </div>
        
        <div class='section'>
            <h2>🎨 Customizations</h2>
            <table>";
    
    foreach ($customizations as $custom) {
        $method = strtoupper($custom['method']);
        $logo = isset($custom['uploadedLogo']) ? '✅ Logo uploaded' : '❌ No logo';
        $message .= "
                <tr>
                    <td class='label'>{$custom['position']}</td>
                    <td class='value'><strong>{$method}</strong> - {$custom['type']} - {$logo}</td>
                </tr>";
    }
    
    $message .= "
            </table>
        </div>
        
        <div class='section'>
            <h2>💰 Request Date</h2>
            <p>" . date('d/m/Y H:i:s') . "</p>
        </div>
        
        <p style='color: #6b7280; font-size: 12px;'>This quote was automatically generated from the BrandedUK website.</p>
    </body>
    </html>
    ";
    
    // Headers for HTML email
    $headers = "MIME-Version: 1.0" . "\r\n";
    $headers .= "Content-type:text/html;charset=UTF-8" . "\r\n";
    $headers .= "From: BrandedUK Quote System <noreply@brandeduk.com>" . "\r\n";
    $headers .= "Reply-To: {$customer['email']}" . "\r\n";
    
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
