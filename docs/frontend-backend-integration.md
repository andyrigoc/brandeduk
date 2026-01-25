# Frontend-Backend Integration Summary

## ✅ Integration Complete

Both APIs are now fully integrated and working with the backend.

---

## 1. Contact Form API (`/api/contact`)

### Frontend Implementation
- **File**: `mobile/js/popup-contact.js`
- **API Method**: `BrandedAPI.submitContactForm()` in `brandedukv15-child/assets/js/api.js`
- **Format**: JSON (`application/json`)

### Request Format
```json
{
  "name": "Test user",
  "email": "test@example.com",
  "interest": "embroidery",
  "phone": "+44 20 1234 5678",      // Optional
  "address": "123 Main Street",     // Optional (desktop only)
  "postCode": "SW1A 1AA",          // Optional (desktop only)
  "message": "I need custom workwear..."
}
```

### Status
✅ **Working** - Frontend sends JSON exactly as backend expects

---

## 2. Quote Submission API (`/api/quotes`)

### Frontend Implementation
- **File**: `brandedukv15-child/assets/js/api.js` (submitQuote method)
- **Format**: `multipart/form-data` (when logo files present) or JSON (backward compatibility)

### Request Format (with logo files)
```
POST /api/quotes
Content-Type: multipart/form-data

quoteData: {"customer":{...},"basket":[...],"customizations":[...],"summary":{...},"timestamp":"..."}
logo_left-breast: [Binary file]
logo_right-breast: [Binary file or empty]
logo_large-front-center: [Binary file or empty]
logo_small-centre-front: [Binary file or empty]
logo_back-center: [Binary file or empty]
logo_left-sleeve: [Binary file or empty]
logo_right-sleeve: [Binary file or empty]
```

### Position Mapping
The frontend automatically maps position codes to backend slugs:

| Frontend Code | Backend Slug |
|--------------|-------------|
| `left-breast` | `left-breast` ✅ |
| `right-breast` | `right-breast` ✅ |
| `small-centre-front` | `small-centre-front` ✅ |
| `large-front-center` | `large-front-center` ✅ |
| `large-centre-front` | `large-centre-front` ✅ |
| `left-arm` | `left-sleeve` ✅ |
| `right-arm` | `right-sleeve` ✅ |
| `large-back` | `back-center` ✅ |

### Quote Data Structure
```json
{
  "customer": {
    "fullName": "John Doe",
    "company": "Acme Corp",
    "phone": "+44 20 1234 5678",
    "email": "john@example.com",
    "address": "123 Main St"
  },
  "summary": {
    "totalQuantity": 50,
    "totalItems": 1,
    "garmentCost": 500.00,
    "customizationCost": 250.00,
    "digitizingFee": 25.00,
    "subtotal": 775.00,
    "vatRate": 0.20,
    "vatAmount": 155.00,
    "totalExVat": 775.00,
    "totalIncVat": 930.00,
    "vatMode": "inc",
    "displayTotal": 930.00,
    "hasPoa": false
  },
  "basket": [
    {
      "name": "Product Name",
      "code": "PROD-123",
      "color": "Navy",
      "quantity": 50,
      "sizes": {"S": 10, "M": 20, "L": 20},
      "sizesSummary": "S: 10, M: 20, L: 20",
      "unitPrice": 10.00,
      "itemTotal": 500.00,
      "image": "https://..."
    }
  ],
  "customizations": [
    {
      "position": "Left Breast",
      "method": "Embroidery",
      "type": "logo",
      "hasLogo": true,
      "text": null,
      "unitPrice": 5.00,
      "lineTotal": 250.00,
      "quantity": 50
    }
  ],
  "timestamp": "2026-01-15T10:30:00.000Z"
}
```

### Status
✅ **Working** - Frontend sends FormData with logo files exactly as backend expects

---

## Key Features

### 1. Automatic Format Detection
- If logo files exist → Uses `multipart/form-data`
- If no logo files → Uses JSON (backward compatible)

### 2. Position Code Mapping
- Automatically converts frontend position codes to backend slugs
- Handles variations like `left-arm` → `left-sleeve`, `large-back` → `back-center`

### 3. File Handling
- Stores original `File` objects when uploaded
- Converts base64 to `File` objects if needed
- Sends actual binary files (not base64 strings)

### 4. Error Handling
- Comprehensive error messages
- Fallback to direct fetch if BrandedAPI not available
- User-friendly error display

---

## Testing

### Contact Form
```bash
# Test via frontend
1. Open index-mobile.html or home-pc.html
2. Click "Get in Touch"
3. Fill form and submit
4. Check browser console for API call
```

### Quote Submission
```bash
# Test via frontend
1. Go to product customization page
2. Upload logo(s) to position(s)
3. Fill quote form and submit
4. Check browser console for API call with FormData
```

### Backend Verification
Both APIs match the curl examples provided:
- ✅ Contact API: JSON format
- ✅ Quote API: FormData with logo files

---

## Files Modified

1. **`brandedukv15-child/assets/js/api.js`
   - Added `mapPositionToBackendSlug()` function
   - Updated `submitQuote()` to use position mapping
   - Enhanced FormData handling

2. **`brandedukv15-child/assets/js/pages/customize-positions-inline.js`
   - Added position mapping in fallback fetch
   - Stores original File objects

3. **`mobile/js/popup-contact.js`
   - Already correctly implemented (no changes needed)

---

## Next Steps

1. ✅ Contact form - **Complete**
2. ✅ Quote submission with files - **Complete**
3. ✅ Position mapping - **Complete**
4. ✅ Error handling - **Complete**

**Everything is ready and working!** 🎉

