# SEO STRUCTURED DATA TEMPLATES - BrandedUK.com

Questo documento contiene tutti i template JSON-LD per Schema.org da implementare per migliorare il SEO.

---

## 1. PRODUCT SCHEMA (Per ogni prodotto in shop.html)

```json
{
  "@context": "https://schema.org",
  "@type": "Product",
  "name": "Gildan Heavy Cotton T-Shirt",
  "image": [
    "https://www.brandeduk.com/brandedukv15-child/assets/images/products/gildan-5000-white.jpg",
    "https://www.brandeduk.com/brandedukv15-child/assets/images/products/gildan-5000-black.jpg"
  ],
  "description": "Premium heavyweight cotton t-shirt perfect for workwear, events, and custom printing. Available in 30+ colours. Embroidery and screen print ready.",
  "sku": "GD01",
  "mpn": "5000",
  "brand": {
    "@type": "Brand",
    "name": "Gildan"
  },
  "offers": {
    "@type": "AggregateOffer",
    "url": "https://www.brandeduk.com/shop.html?product=gildan-5000",
    "priceCurrency": "GBP",
    "lowPrice": "5.99",
    "highPrice": "12.99",
    "priceValidUntil": "2026-12-31",
    "availability": "https://schema.org/InStock",
    "itemCondition": "https://schema.org/NewCondition"
  },
  "aggregateRating": {
    "@type": "AggregateRating",
    "ratingValue": "4.8",
    "reviewCount": "127",
    "bestRating": "5",
    "worstRating": "1"
  },
  "review": [
    {
      "@type": "Review",
      "reviewRating": {
        "@type": "Rating",
        "ratingValue": "5",
        "bestRating": "5"
      },
      "author": {
        "@type": "Person",
        "name": "John Smith"
      },
      "reviewBody": "Great quality t-shirts for our construction team. Embroidery looks professional and they wash well."
    }
  ],
  "category": "T-Shirts",
  "color": ["White", "Black", "Navy", "Red", "Grey"],
  "material": "100% Cotton",
  "size": ["S", "M", "L", "XL", "2XL", "3XL"]
}
```

---

## 2. FAQPAGE SCHEMA (Per homepage FAQ section)

```json
{
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    {
      "@type": "Question",
      "name": "What is embroidery?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Embroidery is a decoration method where thread is stitched directly into the fabric using computerised machines. It creates a premium, textured finish that's extremely durable and professional-looking. Perfect for polo shirts, hoodies, jackets and corporate workwear."
      }
    },
    {
      "@type": "Question",
      "name": "Best garments for embroidery?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Polo shirts, hoodies, jackets, caps and fleeces work best. Perfect for corporate workwear and professional uniforms. NOT suitable for hi-vis due to reflective material. Thicker fabrics provide excellent stitch definition."
      }
    },
    {
      "@type": "Question",
      "name": "What is DTF printing?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Direct-to-Film (DTF) printing creates full-colour transfers that are heat-pressed onto garments. Perfect for event t-shirts, branded hoodies and complex logos on any fabric colour. No minimum order - from just 1 piece."
      }
    },
    {
      "@type": "Question",
      "name": "What is screen printing?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Screen printing pushes ink through mesh screens onto fabric. Best for bulk t-shirts, hoodies and hi-vis workwear. The ONLY method suitable for hi-vis reflective material. Get up to 30% OFF with bulk orders. Minimum 25 pieces recommended."
      }
    },
    {
      "@type": "Question",
      "name": "What are vinyl heat press best for?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Ideal for names, numbers, simple logos on team t-shirts, sports hoodies and restaurant uniforms. Popular for sports kits, hen parties and personalised pub t-shirts. Available in 50+ colours including metallic and reflective finishes."
      }
    },
    {
      "@type": "Question",
      "name": "Do you offer bulk discounts?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Yes! 20-49 units = 10% OFF, 50-99 units = 20% OFF, 100+ units = 30% OFF. Perfect for event t-shirts, team hoodies and hi-vis workwear for construction/trade. Free UK delivery over £99."
      }
    },
    {
      "@type": "Question",
      "name": "What is your turnaround time?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Standard embroidery: 5-7 working days. Screen printing: 7-10 working days. DTF printing: 3-5 working days. Vinyl: 2-4 working days. Rush services available for urgent orders - contact us for express options."
      }
    },
    {
      "@type": "Question",
      "name": "Do you have minimum order quantities?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "DTF and vinyl: No minimum - from 1 piece. Embroidery: From 6 pieces. Screen printing: 25+ pieces recommended for cost-effectiveness. Check our Starter Bundle from £24.99 for package deals."
      }
    }
  ]
}
```

---

## 3. SERVICE SCHEMA (Per services.html)

```json
{
  "@context": "https://schema.org",
  "@type": "ItemList",
  "itemListElement": [
    {
      "@type": "Service",
      "position": 1,
      "name": "Embroidery Services",
      "description": "Professional embroidery for workwear, uniforms, polo shirts, hoodies and jackets. From £2.95 per item. Perfect for corporate branding.",
      "provider": {
        "@id": "https://www.brandeduk.com/#organization"
      },
      "serviceType": "Custom Embroidery",
      "areaServed": {
        "@type": "Country",
        "name": "United Kingdom"
      },
      "hasOfferCatalog": {
        "@type": "OfferCatalog",
        "name": "Embroidery Services",
        "itemListElement": [
          {
            "@type": "Offer",
            "itemOffered": {
              "@type": "Service",
              "name": "Logo Embroidery"
            },
            "price": "2.95",
            "priceCurrency": "GBP",
            "priceSpecification": {
              "@type": "UnitPriceSpecification",
              "price": "2.95",
              "priceCurrency": "GBP",
              "referenceQuantity": {
                "@type": "QuantitativeValue",
                "value": "1",
                "unitCode": "EA"
              }
            }
          }
        ]
      }
    },
    {
      "@type": "Service",
      "position": 2,
      "name": "Screen Printing",
      "description": "High-volume screen printing for t-shirts, hoodies and hi-vis workwear. Best for bulk orders 25+. Up to 30% OFF on 100+ pieces.",
      "provider": {
        "@id": "https://www.brandeduk.com/#organization"
      },
      "serviceType": "Screen Printing",
      "areaServed": {
        "@type": "Country",
        "name": "United Kingdom"
      }
    },
    {
      "@type": "Service",
      "position": 3,
      "name": "DTF Printing",
      "description": "Direct-to-Film printing for full-colour designs. No minimum order - from 1 piece. Perfect for events, small teams and complex logos.",
      "provider": {
        "@id": "https://www.brandeduk.com/#organization"
      },
      "serviceType": "DTF Printing",
      "areaServed": {
        "@type": "Country",
        "name": "United Kingdom"
      }
    },
    {
      "@type": "Service",
      "position": 4,
      "name": "Vinyl Heat Transfer",
      "description": "Heat transfer vinyl for names, numbers and simple logos. Perfect for team kits, sports uniforms and personalisation.",
      "provider": {
        "@id": "https://www.brandeduk.com/#organization"
      },
      "serviceType": "Vinyl Heat Press",
      "areaServed": {
        "@type": "Country",
        "name": "United Kingdom"
      }
    }
  ]
}
```

---

## 4. LOCALBUSINESS SCHEMA (Se hai negozio fisico o area servita)

```json
{
  "@context": "https://schema.org",
  "@type": "LocalBusiness",
  "@id": "https://www.brandeduk.com/#localbusiness",
  "name": "BrandedUK",
  "image": "https://www.brandeduk.com/brandedukv15-child/assets/images/ui/bd-logo-3d.png",
  "url": "https://www.brandeduk.com",
  "telephone": "+44-208-974-2722",
  "email": "info@brandeduk.com",
  "priceRange": "££",
  "address": {
    "@type": "PostalAddress",
    "streetAddress": "Your Street Address",
    "addressLocality": "London",
    "addressRegion": "Greater London",
    "postalCode": "SW19 XXX",
    "addressCountry": "GB"
  },
  "geo": {
    "@type": "GeoCoordinates",
    "latitude": "51.4085",
    "longitude": "-0.2989"
  },
  "openingHoursSpecification": [
    {
      "@type": "OpeningHoursSpecification",
      "dayOfWeek": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
      "opens": "09:00",
      "closes": "18:00"
    },
    {
      "@type": "OpeningHoursSpecification",
      "dayOfWeek": "Saturday",
      "opens": "10:00",
      "closes": "14:00"
    }
  ],
  "sameAs": [
    "https://www.facebook.com/profile.php?id=100083540654262",
    "https://www.instagram.com/brandeduk_workwear/",
    "https://www.linkedin.com/in/anderson-ricotta-92a394321/"
  ],
  "areaServed": [
    {
      "@type": "City",
      "name": "London"
    },
    {
      "@type": "AdministrativeArea",
      "name": "South West London"
    },
    {
      "@type": "Country",
      "name": "United Kingdom"
    }
  ]
}
```

---

## 5. BREADCRUMBLIST SCHEMA (Per category/product pages)

### Per T-Shirts Category:
```json
{
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  "itemListElement": [
    {
      "@type": "ListItem",
      "position": 1,
      "name": "Home",
      "item": "https://www.brandeduk.com"
    },
    {
      "@type": "ListItem",
      "position": 2,
      "name": "Shop",
      "item": "https://www.brandeduk.com/shop.html"
    },
    {
      "@type": "ListItem",
      "position": 3,
      "name": "T-Shirts",
      "item": "https://www.brandeduk.com/tshirts.html"
    }
  ]
}
```

### Per Product Detail:
```json
{
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  "itemListElement": [
    {
      "@type": "ListItem",
      "position": 1,
      "name": "Home",
      "item": "https://www.brandeduk.com"
    },
    {
      "@type": "ListItem",
      "position": 2,
      "name": "Shop",
      "item": "https://www.brandeduk.com/shop.html"
    },
    {
      "@type": "ListItem",
      "position": 3,
      "name": "T-Shirts",
      "item": "https://www.brandeduk.com/tshirts.html"
    },
    {
      "@type": "ListItem",
      "position": 4,
      "name": "Gildan Heavy Cotton T-Shirt",
      "item": "https://www.brandeduk.com/product-detail.html?sku=GD01"
    }
  ]
}
```

---

## 6. BLOG POST SCHEMA (Per ogni blog article)

```json
{
  "@context": "https://schema.org",
  "@type": "BlogPosting",
  "headline": "Best Logo Size for Workwear: Complete Guide 2026",
  "image": "https://www.brandeduk.com/blog/images/logo-size-guide.jpg",
  "author": {
    "@type": "Person",
    "name": "Anderson Ricotta"
  },
  "publisher": {
    "@id": "https://www.brandeduk.com/#organization"
  },
  "datePublished": "2026-04-15",
  "dateModified": "2026-04-20",
  "description": "Complete guide to choosing the right logo size for embroidery and printing on workwear. Best practices for chest logos, back designs and sleeve logos.",
  "articleBody": "Full article text here...",
  "wordCount": "1500",
  "mainEntityOfPage": {
    "@type": "WebPage",
    "@id": "https://www.brandeduk.com/blog/best-logo-size-workwear.html"
  },
  "articleSection": "Workwear Guides",
  "keywords": ["workwear", "logo size", "embroidery", "printing", "corporate uniforms"]
}
```

---

## 7. OFFERS/DISCOUNT SCHEMA (Per bulk-orders.html e bundles.html)

```json
{
  "@context": "https://schema.org",
  "@type": "Offer",
  "name": "Bulk Order Discounts - Up to 30% OFF",
  "description": "Volume discounts on custom workwear: 20-49 units = 10% OFF, 50-99 units = 20% OFF, 100+ units = 30% OFF",
  "url": "https://www.brandeduk.com/bulk-orders.html",
  "priceCurrency": "GBP",
  "priceSpecification": [
    {
      "@type": "UnitPriceSpecification",
      "price": "10% OFF",
      "minPrice": "20",
      "maxPrice": "49",
      "priceCurrency": "GBP",
      "referenceQuantity": {
        "@type": "QuantitativeValue",
        "value": "20-49",
        "unitText": "units"
      }
    },
    {
      "@type": "UnitPriceSpecification",
      "price": "20% OFF",
      "minPrice": "50",
      "maxPrice": "99",
      "priceCurrency": "GBP"
    },
    {
      "@type": "UnitPriceSpecification",
      "price": "30% OFF",
      "minPrice": "100",
      "priceCurrency": "GBP"
    }
  ],
  "availability": "https://schema.org/InStock",
  "validFrom": "2026-01-01",
  "validThrough": "2026-12-31",
  "seller": {
    "@id": "https://www.brandeduk.com/#organization"
  }
}
```

---

## 8. VIDEO SCHEMA (Se aggiungi tutorial/demo video)

```json
{
  "@context": "https://schema.org",
  "@type": "VideoObject",
  "name": "How to Order Custom Embroidered Workwear - BrandedUK Tutorial",
  "description": "Step-by-step guide to ordering custom embroidered workwear with BrandedUK. Learn how to upload your logo, choose products and get a quote in minutes.",
  "thumbnailUrl": "https://www.brandeduk.com/videos/thumbnails/how-to-order.jpg",
  "uploadDate": "2026-04-01",
  "duration": "PT3M45S",
  "contentUrl": "https://www.youtube.com/watch?v=XXXXXXX",
  "embedUrl": "https://www.youtube.com/embed/XXXXXXX",
  "publisher": {
    "@id": "https://www.brandeduk.com/#organization"
  }
}
```

---

## 9. HOWTO SCHEMA (Per guide/tutorial pages)

```json
{
  "@context": "https://schema.org",
  "@type": "HowTo",
  "name": "How to Prepare Your Logo for Embroidery",
  "description": "Complete guide to preparing your company logo for professional embroidery on workwear and uniforms.",
  "image": "https://www.brandeduk.com/blog/images/prepare-logo.jpg",
  "totalTime": "PT10M",
  "estimatedCost": {
    "@type": "MonetaryAmount",
    "currency": "GBP",
    "value": "0"
  },
  "tool": [
    {
      "@type": "HowToTool",
      "name": "Vector graphics software (Adobe Illustrator, Inkscape)"
    },
    {
      "@type": "HowToTool",
      "name": "Original logo file (AI, EPS, PDF, or high-res PNG)"
    }
  ],
  "step": [
    {
      "@type": "HowToStep",
      "position": 1,
      "name": "Check logo format",
      "text": "Ensure your logo is in vector format (AI, EPS, PDF) or high-resolution PNG (300 DPI minimum)."
    },
    {
      "@type": "HowToStep",
      "position": 2,
      "name": "Simplify complex details",
      "text": "Remove very fine lines or text smaller than 5mm. Embroidery has limitations on detail."
    },
    {
      "@type": "HowToStep",
      "position": 3,
      "name": "Choose thread colours",
      "text": "Select up to 15 thread colours. Each colour adds to stitch count and cost."
    },
    {
      "@type": "HowToStep",
      "position": 4,
      "name": "Submit to BrandedUK",
      "text": "Upload your logo via our quote form. Our team will digitise it for embroidery."
    }
  ]
}
```

---

## 10. ITEMLIST SCHEMA (Per shop.html category listings)

```json
{
  "@context": "https://schema.org",
  "@type": "ItemList",
  "name": "T-Shirts Collection",
  "description": "Custom printed and embroidered t-shirts for workwear, events and teams. 50+ styles available.",
  "numberOfItems": 45,
  "itemListElement": [
    {
      "@type": "ListItem",
      "position": 1,
      "item": {
        "@type": "Product",
        "name": "Gildan Heavy Cotton T-Shirt",
        "url": "https://www.brandeduk.com/product-detail.html?sku=GD01",
        "image": "https://www.brandeduk.com/images/products/gildan-5000.jpg",
        "offers": {
          "@type": "Offer",
          "price": "5.99",
          "priceCurrency": "GBP"
        }
      }
    },
    {
      "@type": "ListItem",
      "position": 2,
      "item": {
        "@type": "Product",
        "name": "Fruit of the Loom Value T-Shirt",
        "url": "https://www.brandeduk.com/product-detail.html?sku=FL01",
        "image": "https://www.brandeduk.com/images/products/fotl-valueweight.jpg",
        "offers": {
          "@type": "Offer",
          "price": "4.99",
          "priceCurrency": "GBP"
        }
      }
    }
  ]
}
```

---

## 11. COLLECTION PAGE SCHEMA (Per category pages)

```json
{
  "@context": "https://schema.org",
  "@type": "CollectionPage",
  "name": "Custom T-Shirts UK - Embroidery & Printing",
  "description": "Browse custom t-shirts for workwear, events and teams. Screen printing, DTF and embroidery available. Bulk discounts from 20% OFF.",
  "url": "https://www.brandeduk.com/tshirts.html",
  "mainEntity": {
    "@type": "ItemList",
    "numberOfItems": 45
  },
  "breadcrumb": {
    "@id": "https://www.brandeduk.com/tshirts.html#breadcrumb"
  }
}
```

---

## DOVE IMPLEMENTARE OGNI SCHEMA:

### **Homepage (index-mobile.html + home-pc.html):**
- ✅ Organization (già fatto)
- ✅ WebSite (già fatto)
- ✅ SiteNavigationElement (già fatto)
- ➕ FAQPage (da aggiungere)
- ➕ LocalBusiness (da aggiungere)

### **Shop.html (category listings):**
- ➕ CollectionPage
- ➕ ItemList
- ➕ BreadcrumbList

### **Product-detail.html:**
- ➕ Product
- ➕ AggregateRating
- ➕ BreadcrumbList

### **Services.html:**
- ✅ BreadcrumbList (già fatto)
- ➕ Service (ItemList)

### **Bundles.html + Bulk-orders.html:**
- ➕ Offer
- ➕ BreadcrumbList

### **Blog posts (tutti i .html in /blog/):**
- ➕ BlogPosting
- ➕ BreadcrumbList

### **Category pages (tshirts.html, polos.html, etc.):**
- ✅ BreadcrumbList (già fatto per alcuni)
- ➕ CollectionPage

---

## COME USARE QUESTI TEMPLATE:

1. **Copia il JSON** del tipo di pagina
2. **Sostituisci i valori** con i tuoi dati reali
3. **Incolla nel `<head>`** dentro `<script type="application/ld+json">`
4. **Testa con Google Rich Results Test**: https://search.google.com/test/rich-results
5. **Valida con Schema.org Validator**: https://validator.schema.org/

---

## PRIORITY IMPLEMENTATION ORDER:

1. **FAQPage** (homepage) - MASSIMO IMPATTO
2. **Product Schema** (20 prodotti top) - ALTO IMPATTO
3. **LocalBusiness** (homepage) - ALTO IMPATTO
4. **Service Schema** (services.html) - MEDIO IMPATTO
5. **BlogPosting** (tutti i blog) - MEDIO IMPATTO
6. **CollectionPage + ItemList** (category pages) - MEDIO IMPATTO
7. **Offer Schema** (bundles/bulk) - BASSO IMPATTO
8. **Video/HowTo** (se aggiungi video) - BONUS

---

**NOTA:** Tutti gli schema vanno inseriti nel `<head>` della pagina dentro:
```html
<script type="application/ld+json">
{
  // JSON qui
}
</script>
```

**VALIDAZIONE OBBLIGATORIA:** Dopo ogni implementazione, testa su:
- https://search.google.com/test/rich-results
- https://validator.schema.org/

---

**FINE DOCUMENTO**
Salva questo file per riferimento futuro o usa con ChatGPT/Claude per implementazioni.
