# BrandedUK API Integration Agent

## Project Overview

**Goal**: Connect the static frontend to a backend API for dynamic product catalog data. **No UI/frontend changes** - only data binding and API integration.

---

## API Configuration

| Setting | Value |
|---------|-------|
| **Base URL** | `https://api.brandeduk.com` |
| **Authentication** | None required (Public API) |
| **Main Endpoint** | `GET /api/products` |
| **Total Products** | ~4,047 |
| **Product Types** | 110 |

---

## Product Types (110 Categories) - Complete List

### Tier 1: Primary Categories (High Volume)
| Name | Slug | Count |
|------|------|-------|
| Bags | `bags` | 459 |
| T-Shirts | `t-shirts` | 411 |
| Jackets | `jackets` | 374 |
| Caps | `caps` | 344 |
| Hoodies | `hoodies` | 254 |
| Polos | `polos` | 240 |
| Gilets & Body Warmers | `gilets-&-body-warmers` | 176 |
| Sweatshirts | `sweatshirts` | 175 |
| Shirts | `shirts` | 157 |
| Beanies | `beanies` | 154 |
| Softshells | `softshells` | 134 |
| Fleece | `fleece` | 125 |
| Shorts | `shorts` | 124 |
| Trousers | `trousers` | 108 |

### Tier 2: Secondary Categories
| Name | Slug | Count |
|------|------|-------|
| Vests (t-shirt) | `vests-(t-shirt)` | 75 |
| Sweatpants | `sweatpants` | 69 |
| Hats | `hats` | 62 |
| Leggings | `leggings` | 52 |
| Soft Toys | `soft-toys` | 51 |
| Aprons | `aprons` | 45 |
| Knitted Jumpers | `knitted-jumpers` | 42 |
| Gloves | `gloves` | 40 |
| Towels | `towels` | 37 |
| Safety Vests | `safety-vests` | 34 |
| Baselayers | `baselayers` | 29 |
| Sports Overtops | `sports-overtops` | 29 |
| Socks | `socks` | 25 |
| Blankets | `blankets` | 24 |
| Snoods | `snoods` | 24 |
| Blouses | `blouses` | 21 |
| Boots | `boots` | 20 |
| Trackwear | `trackwear` | 19 |
| Trainers | `trainers` | 19 |
| Bras | `bras` | 17 |
| Ties | `ties` | 17 |
| Cardigans | `cardigans` | 16 |
| Scarves | `scarves` | 16 |
| Chinos | `chinos` | 15 |
| Accessories | `accessories` | 15 |
| Chef Jackets | `chef-jackets` | 14 |
| Robes | `robes` | 14 |
| Dresses | `dresses` | 13 |
| Pyjamas | `pyjamas` | 12 |

### Tier 3: Specialty & Niche
| Name | Slug | Count |
|------|------|-------|
| Bodysuits | `bodysuits` | 11 |
| Loungewear Bottoms | `loungewear-bottoms` | 11 |
| Belts | `belts` | 10 |
| Tunics | `tunics` | 9 |
| Keyrings | `keyrings` | 8 |
| Onesies | `onesies` | 8 |
| Rain Suits | `rain-suits` | 8 |
| Rugby Shirts | `rugby-shirts` | 7 |
| Headbands | `headbands` | 7 |
| Tabards | `tabards` | 7 |
| Coveralls | `coveralls` | 6 |
| Hot Water Bottles & Covers | `hot-water-bottles-&-covers` | 6 |
| Slippers | `slippers` | 6 |
| Umbrellas | `umbrellas` | 6 |
| Wallets | `wallets` | 6 |
| Jeans | `jeans` | 5 |
| Kneepads | `kneepads` | 5 |
| Laptop Cases | `laptop-cases` | 5 |
| Ponchos | `ponchos` | 5 |
| And many more... | | |

---

## Frontend → API Slug Mapping

```javascript
const FRONTEND_TO_API_SLUG = {
    // Frontend URL param → API productType value
    'all': null,                          // No filter
    'tshirts': 't-shirts',                // ⚠️ Different!
    'polo': 'polos',                      // ⚠️ Different!
    'fleeces': 'fleece',                  // ⚠️ Different!
    'hivis': 'safety-vests',              // ⚠️ Map to safety-vests
    
    // These match exactly:
    'hoodies': 'hoodies',
    'jackets': 'jackets',
    'caps': 'caps',
    'beanies': 'beanies',
    'trousers': 'trousers',
    'aprons': 'aprons',
    'sweatshirts': 'sweatshirts',
    'softshells': 'softshells',
    'shorts': 'shorts',
    'shirts': 'shirts',
    'bags': 'bags',
    
    // New categories available:
    'gilets': 'gilets-&-body-warmers',
    'leggings': 'leggings',
    'towels': 'towels',
    'gloves': 'gloves',
    'hats': 'hats',
    'boots': 'boots',
    'trainers': 'trainers'
};
```

---

## Filter Parameters - Complete Reference

### Gender (`gender`)
| Value | Display |
|-------|---------|
| `female` | Female |
| `male` | Male |
| `unisex` | Unisex |

### Age Group (`ageGroup`)
| Value | Display |
|-------|---------|
| `adult` | Adult |
| `infant` | Infant |
| `kids` | Kids |

### Sleeve (`sleeve`)
| Value | Display |
|-------|---------|
| `long-sleeve-2` | Long Sleeve |
| `short-sleeve-2` | Short Sleeve |
| `sleeveless` | Sleeveless |
| `raglan-sleeve` | Raglan Sleeve |
| `set-in-sleeve` | Set-In Sleeve |
| `roll-sleeve` | Roll-Sleeve |

### Neckline (`neckline`)
| Value | Display |
|-------|---------|
| `crew-neck-2` | Crew Neck |
| `v-neck-2` | V-Neck |
| `mandarin` | Mandarin |
| `wide-neck` | Wide Neck |
| `roll-neck` | Roll Neck |
| `button-down-collar` | Button-Down Collar |
| `keyhole` | Keyhole |

### Primary Colour (`primaryColour`)
| Value | Display |
|-------|---------|
| `black` | Black |
| `blue` | Blue |
| `grey` | Grey |
| `green` | Green |
| `white` | White |
| `red` | Red |
| `pink` | Pink |
| `yellow` | Yellow |
| `neutral` | Neutral |
| `purple` | Purple |
| `orange` | Orange |
| `brown` | Brown |
| `pattern` | Pattern |
| `other` | Other |

### Size (`size`)
| Value | Display |
|-------|---------|
| `xxs` | XXS |
| `xs` | XS |
| `s` | S |
| `m` | M |
| `l` | L |
| `xl` | XL |
| `2xl` | 2XL |
| `3xl` | 3XL |
| `4xl` | 4XL |
| `5xl` | 5XL |
| `one-size` | One Size |
| `34-years-1` | 3/4 Years |
| `56-years-1` | 5/6 Years |
| `78-years-1` | 7/8 Years |
| `911-years-1` | 9/11 Years |

### Fabric (`fabric`)
| Value | Display |
|-------|---------|
| `recycled-100` | Recycled (100%) |
| `organic-100` | Organic (100%) |
| `polyester-100` | Polyester (100%) |
| `polyester-blend` | Polyester Blend |
| `nylon-100` | Nylon (100%) |
| `nylon-blend` | Nylon Blend |
| `cotton-100` | Cotton (100%) |
| `cotton-blend` | Cotton Blend |
| `ringspun-100` | Ringspun (100%) |
| `combed-100` | Combed (100%) |
| `heavyweight-100` | Heavyweight (100%) |

### Weight (`weight`)
| Value | Display |
|-------|---------|
| `0-50gsm` | 0 - 50gsm |
| `051-100gsm` | 51 - 100gsm |
| `101-150gsm` | 101 - 150gsm |
| `151-200gsm` | 151 - 200gsm |
| `201-250gsm` | 201 - 250gsm |
| `251-300gsm` | 251 - 300gsm |
| `over-300gsm` | Over 300gsm |

### Fit (`fit`)
| Value | Display |
|-------|---------|
| `classic` | Classic Fit |
| `comfort` | Comfort |
| `crop` | Crop |
| `fashion` | Fashion Fit |
| `feminine` | Feminine Fit |
| `fitted` | Fitted |
| `longline` | Longline |
| `oversized` | Oversized |
| `relaxed` | Relaxed Fit |
| `semi-fitted` | Semi-Fitted |

### Related Sector (`sector`)
| Value | Display |
|-------|---------|
| `sport` | Sport |
| `corporate` | Corporate |
| `hospitality` | Hospitality |
| `travel` | Travel |
| `fashion` | Fashion |
| `athleisure` | Athleisure |
| `home` | Home |
| `safety` | Safety |
| `school` | School |
| `outdoor` | Outdoor |

### Related Sport (`sport`)
| Value | Display |
|-------|---------|
| `golf` | Golf |
| `gym` | Gym |
| `swimming` | Swimming |
| `rugby` | Rugby |

### Tag (`tag`)
| Value | Display |
|-------|---------|
| `adhesives` | Adhesives |
| `cut-away-inner-label` | Cut-away inner label |
| `sewn-tag` | Sewn Tag |
| `tagless` | Tagless |
| `tear-away` | Tear-away |
| `tear-out` | Tear-out |

### Effect (`effect`)
| Value | Display |
|-------|---------|
| `melange` | Melange |
| `heather` | Heather |
| `marble` | Marble |
| `tie-dye` | Tie-Dye |
| `triblend` | TriBlend |
| `washed` | Washed |
| `acid-wash` | Acid Wash |

### Style (`style`)
| Value | Display |
|-------|---------|
| `classic` | Classic |
| `crew-neck-1` | Crew Neck |
| `hooded-1` | Hooded |
| `long-sleeve-1` | Long Sleeve |
| `oversized` | Oversized |
| `pocket` | Pocket |
| `pockets` | Pockets |
| `regular` | Regular |
| `relaxed-1` | Relaxed |
| `short-sleeve` | Short Sleeve |
| `slim-1` | Slim |
| `v-neck` | V-Neck |
| `zipped` | Zipped |
| `fitted` | Fitted |

---

## API Product Response Format

```json
{
  "items": [
    {
      "code": "UA046",
      "name": "UA Blitzing cap",
      "price": 10.8,
      "image": "https://cdn.pimber.ly/...",
      "colors": [
        {
          "name": "Black/Black",
          "main": "https://cdn.pimber.ly/...",
          "thumb": "https://cdn.pimber.ly/..."
        }
      ],
      "sizes": ["L/XL", "M/L", "S/M"],
      "customization": ["embroidery", "print"],
      "brand": "Under Armour",
      "priceBreaks": [
        { "min": 1, "max": 9, "price": 12.6 },
        { "min": 10, "max": 24, "price": 11.66 },
        { "min": 25, "max": 99999, "price": 10.8 }
      ]
    }
  ],
  "page": 1,
  "limit": 24,
  "total": 335,
  "priceRange": { "min": 1.64, "max": 21.75 }
}
```

---

## Example API Calls

```bash
# All products
GET /api/products?page=1&limit=24

# T-Shirts only
GET /api/products?productType=t-shirts&limit=24

# Hoodies + Size XL
GET /api/products?productType=hoodies&size=xl

# Black items under £20
GET /api/products?primaryColour=black&priceMax=20

# Adult Male Polos
GET /api/products?productType=polos&gender=male&ageGroup=adult

# Search + filter
GET /api/products?q=hoodie&productType=hoodies&priceMin=10&priceMax=50

# Sort by price low to high
GET /api/products?productType=t-shirts&sort=price-low
```

---

## Files to Modify

| Priority | File | Action |
|----------|------|--------|
| 1 | `shop.html` | Replace static PRODUCTS_DB with API fetch |
| 2 | `mobile/shop-mobile.html` | Same as above for mobile |
| 3 | `product-detail.html` | Fetch single product by code |
| 4 | Filter sidebar JS | Wire filter values to API params |

---

## Implementation Notes

1. **Price is Number** - API returns `price: 10.8`, frontend may need string
2. **priceBreaks Included** - No separate lookup needed
3. **Filter Stacking** - All filters combine with AND logic
4. **Pagination** - Use `page` and `limit`, response has `total`
5. **Sort Options** - `newest`, `price-low`, `price-high`, `name`

---

## ✅ IMPLEMENTATION COMPLETE

### Files Created/Modified

| File | Action | Description |
|------|--------|-------------|
| `brandedukv15-child/assets/js/api.js` | Created | Core API service module with all endpoints |
| `brandedukv15-child/assets/js/shop-api.js` | Created | Shop page integration (products, filters, pagination) |
| `brandedukv15-child/assets/css/shop-api.css` | Created | Pagination, loading states, skeleton UI |
| `shop.html` | Modified | Replaced static PRODUCTS_DB with API calls |
| `mobile/shop-mobile.html` | Modified | Mobile version API integration |

### What's Working

1. **Product Catalog** - Products load dynamically from API
2. **Category Filtering** - Category buttons filter via API `productType` param
3. **Search** - Search input triggers API search with debounce
4. **Pagination** - Automatic pagination for large result sets
5. **Price Display** - VAT toggle works with API prices
6. **Color Swatches** - Display colors from API response
7. **Product Click** - Saves full product data to sessionStorage for customize page

### API Endpoints Used

```
GET /api/products              - Main product listing
GET /api/products?productType= - Category filtering
GET /api/products?q=           - Search
GET /api/products/{code}       - Single product (ready for detail page)
GET /api/products/{code}/related - Related products
```

### How to Test

1. Open `shop.html` in browser
2. Open DevTools Console to see API calls
3. Click category buttons - should reload products
4. Use search - should filter products
5. Click product - should navigate to customize with data

### Next Steps (Optional Enhancements)

- [ ] Infinite scroll instead of pagination
- [ ] Filter counts from `/api/products/filters`
- [ ] Brand filter dropdown
- [ ] Sort dropdown functionality
- [ ] Related products on detail page
