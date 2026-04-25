# Backend Task: Add Retail Descriptions and Accreditations to Products API

## Problem
The current API endpoint `/api/products/{code}` needs two additional fields:
1. **Retail Description** - longer marketing text for product pages
2. **Accreditations** - certification badges (Sedex, Vegan, BSCI, etc.)

## Current Situation
- **API endpoint**: `https://api.brandeduk.com/api/products/{code}`
- **Current field**: `description` - contains short specifications (e.g., "Relaxed fit T. Short sleeves. Side seams...")
- **Missing field**: `retailDescription` - longer marketing text from CSV (e.g., "The new T is here to make you rethink the t, redefining what value t-shirts can offer...")

## CSV Data Source
File: `CustomerDataFull.csv` (available on desktop)

**Relevant columns:**
- `Style Code` - Product code (e.g., "AT001")
- `Specification` - Short description (already in API as `description`)
- `Retail Description` - Long marketing description (MISSING from API)
- `Accreditations` - Certifications (e.g., "SEDEX|Amfori BSCI|Oeko-Tex Standard 100|Better Cotton|Peta Approved Vegan|WRAP")

## Required Changes

### 1. Dwo fields from CSV into your products database:
- Add column `retailDescription` (or `retail_description`) - TEXT type
- Add column `accreditations` (or `accreditations`) - TEXT or JSON type
- Map CSV `Style Code` → database product code
- Import CSV `Retail Description` → database `retailDescription`
- Import CSV `Accreditations` (pipe-separated: "SEDEX|Amfori BSCI|...") → split and store as array
- Import CSV `Retail Description` → database `retailDescription`

### 2. API Response Update
Modify the `/api/products/{code}` endpoint to include the new field:

**Current response:**
```json
{
  "code": "AT001",
  "name": "The AWDis 150 T",
  "description": "Relaxed fit T. Short sleeves...",
  ...
}
```

**Required response:**
```json
{
  "brand": "AWDis",
  "description": "Relaxed fit T. Short sleeves...",
  "retailDescription": "The new T is here to make you rethink the t, redefining what value t-shirts can offer by bringing unmatched quality, versatility, and style to the printing and embroidery market. At the core of the T is the innovative PurePrint fabric, exclusively designed to set a new standard for the industry. From bold DTG designs to intricate screen prints and stunning embroideries, PurePrint ensures every detail pops with clarity and precision.",
  "accreditations": ["SEDEX", "Amfori BSCI", "Oeko-Tex Standard 100", "Better Cotton", "Peta Approved Vegan", "WRAP"]
  "description": "Relaxed fit T. Short sleeves...",
  "retailDescription": "The new T is here to make you rethink the t, redefining what value t-shirts can offer by bringing unmatched quality, versatility, and style to the printing and embroidery market. At the core of the T is the innovative PurePrint fabric, exclusively designed to set a new standard for the industry. From bold DTG designs to intricate screen prints and stunning embroideries, PurePrint ensures every detail pops with clarity and precision.",
  ...
- If `retailDescription` is empty/null, fall back to `description`
- If `accreditations` is empty/null, return empty array `[]`

```javascript
const displayDescription = product.retailDescription || product.description;
const certifications = product.accreditations || []
### 3. Fallback Logic
If `retailDescription` is empty or null, fall back to `description`:
```javascript
const displayDescription = product.retailDescription || product.description;
```
**Expected results:**
- `retailDescription` should start with: "The new T is here to make you rethink the t..."
- `accreditations` should be an array: `["SEDEX", "Amfori BSCI", "Oeko-Tex Standard 100", "Better Cotton", "Peta Approved Vegan", "WRAP"]`
## Testing
Test with product code **AT001** (The AWDis 150 T):
```bash, SEO, and trust signals. The longer descriptions improve user experience and search rankings. Certification badges increase customer confidence
curl https://api.brandeduk.com/api/products/AT001
```

Expected `retailDescription` should start with: "The new T is here to make you rethink the t..."

## Priority
**High** - Affects product pages visibility and SEO. The longer, richer descriptions improve user experience and search rankings.

## Questions?
Contact the frontend team for clarification or to coordinate deployment timing.
