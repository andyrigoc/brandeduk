/**
 * BrandedUK Shared Configuration
 * ================================
 * Single source of truth for category titles, product types,
 * slug mappings, and filter definitions.
 *
 * Include this file BEFORE any page-specific JS that needs these values.
 * Everything is exposed on window.BrandedConfig.
 */
window.BrandedConfig = (function () {
    'use strict';

    // ──────────────────────────────────────────────
    // CATEGORY TITLES  (slug → display title)
    // ──────────────────────────────────────────────
    const CATEGORY_TITLES = {
        'all':        'All Products',
        'tshirts':    'Personalised T-Shirts',
        't-shirts':   'Personalised T-Shirts',
        'polo':       'Personalised Polo Shirts',
        'polos':      'Personalised Polo Shirts',
        'hoodies':    'Personalised Hoodies',
        'jackets':    'Personalised Jackets',
        'hivis':      'Hi-Vis Workwear',
        'safety-vests': 'Hi-Vis Workwear',
        'trousers':   'Work Trousers',
        'fleeces':    'Personalised Fleeces',
        'fleece':     'Personalised Fleeces',
        'bags':       'Personalised Bags',
        'caps':       'Personalised Caps',
        'beanies':    'Personalised Beanies',
        'headwear':   'Personalised Headwear',
        'hats':       'Personalised Hats',
        'aprons':     'Personalised Aprons',
        'sustainable':'Sustainable Workwear',
        'workwear':   'Workwear',
        'sweatshirts':'Sweatshirts',
        'softshells': 'Softshell Jackets',
        'shorts':     'Shorts',
        'shirts':     'Shirts',
        'gilets':     'Gilets & Body Warmers',
        'gilets-&-body-warmers': 'Gilets & Body Warmers'
    };

    // ──────────────────────────────────────────────
    // CATEGORY INFO  (slug → { title, desc })
    // ──────────────────────────────────────────────
    const CATEGORY_INFO = {
        'all':      { title: 'All Products', desc: 'Browse our full range of customisable workwear and uniforms.' },
        'tshirts':  { title: 'Personalised T-Shirts', desc: 'Cost-effective custom t-shirts for promotions, staff uniforms, and events. Available in a wide range of fabrics and fits with multiple print methods. Optimised for large orders with consistent quality and fast turnaround.' },
        'polo':     { title: 'Personalised Polo Shirts', desc: 'Professional custom polo shirts for corporate, trade, and hospitality sectors. High-quality embroidery or print for a clean, long-lasting finish. A versatile uniform solution balancing comfort, durability, and brand image.' },
        'hoodies':  { title: 'Personalised Hoodies', desc: 'Premium custom hoodies for workwear, events, and corporate teams. Available with embroidery, screen printing, or DTF for sharp, durable logos. Comfortable, hard-wearing garments suitable for daily use and brand visibility.' },
        'jackets':  { title: 'Personalised Jackets', desc: 'Custom jackets and outerwear built for performance and brand exposure. Weather-resistant options ideal for outdoor teams and work environments. Advanced embroidery and print techniques ensure premium logo presentation.' },
        'hivis':    { title: 'Hi-Vis Workwear', desc: 'Certified high-visibility clothing compliant with UK safety standards. Essential for construction, logistics, and industrial workplaces. Custom branding available without compromising safety or compliance.' },
        'trousers': { title: 'Work Trousers', desc: 'Durable work trousers designed for demanding trade and industrial use. Reinforced materials and functional design for maximum performance. Optional branding solutions to complete your professional workwear set.' },
        'fleeces':  { title: 'Personalised Fleeces', desc: '' },
        'bags':     { title: 'Personalised Bags', desc: '' },
        'caps':     { title: 'Personalised Caps', desc: 'Custom beanies, caps, and headwear designed for year-round branding. Perfect for promotional use, uniforms, and outdoor work environments. High-quality embroidery ensures strong brand recognition and durability.' },
        'beanies':  { title: 'Personalised Beanies', desc: 'Custom beanies, caps, and headwear designed for year-round branding. Perfect for promotional use, uniforms, and outdoor work environments. High-quality embroidery ensures strong brand recognition and durability.' },
        'aprons':   { title: 'Personalised Aprons', desc: 'High-quality custom aprons designed for hospitality, catering, and retail environments. Durable fabrics with professional embroidery or print options for long-lasting branding. Ideal for restaurants, cafés, and trade professionals seeking a polished, branded look.' },
        'sustainable': { title: 'Sustainable Workwear', desc: 'Eco-friendly clothing options made from organic and recycled materials. Ideal for brands focused on sustainability and ethical sourcing. Custom branding available with reduced environmental impact.' }
    };

    // ──────────────────────────────────────────────
    // PRODUCT TYPES  (autocomplete / menu list)
    // ──────────────────────────────────────────────
    const PRODUCT_TYPES = [
        'Accessories','Aprons','Arm Guards','Armbands',
        'Bags','Baselayers','Batteries','Beanies','Bedding','Belts','Bibs','Bin Bags','Blankets','Blouses','Bodysuits','Boots','Bottles','Boxers','Braces','Bras',
        'Caps','Cardigans','Chef Jacket Studs','Chef Jackets','Chinos','Coveralls','Cushion Covers','Cushions',
        'Document Wallets','Dog Vests','Dresses','Dungarees',
        'Ear Muffs','Embroidery Accessories','Embroidery Backing',
        'First Aid Boxes','Fleece','Freezer Blocks',
        'Gilets & Body Warmers','Glasses','Gloves','Gowns',
        'Hats','Headbands','Helmets','Hoodies','Hot Water Bottles & Covers',
        'Jackets','Jeans',
        'Keyrings','Kneepads','Knitted Jumpers',
        'Laptop Cases','Leggings','Loungewear Bottoms',
        'Mail Order Bags',
        'Onesies',
        'Packing Tape','Paper','Pencil Cases','Polos','Ponchos','Pyjamas',
        'Quad Guards',
        'Rain Suits','Reflective Tape','Robes','Rugby Shirts',
        'Safety Vests','Scarves','Shirt Bags','Shirts','Shoes','Shorts','Skirts','Skorts','Sleepsuits','Slippers','Snoods','Socks','Soft Toys','Softshells','Sports Overtops','Storage','Straps','Sweatpants','Sweatshirts',
        'T-Shirts','Tabards','Tablecloths','Ties','Towels','Trackwear','Trainers','Travel Sets','Trousers','Tunics',
        'Umbrellas','Unitards',
        'Vests (t-shirt)',
        'Waistcoats','Wallets','Winter Accessory Sets',
        'Yoga Mats',
        'Zips Pulls'
    ];

    // ──────────────────────────────────────────────
    // CATEGORY SLUG MAP  (frontend slug → API productType)
    // ──────────────────────────────────────────────
    const CATEGORY_SLUG_MAP = {
        'all': null,
        'tshirts': 't-shirts',
        't-shirt': 't-shirts',
        't-shirts': 't-shirts',
        'tees': 't-shirts',
        'polo': 'polos',
        'polo-shirts': 'polos',
        'fleeces': 'fleece',
        'hivis': 'hi-vis',
        'hi-vis': 'hi-vis',
        'hi-viz': 'hi-vis',
        'headwear': 'headwear',
        'sustainable': null,
        'workwear': null,
        // Direct matches
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
        'gilets': 'gilets-&-body-warmers',
        'fleece': 'fleece',
        'towels': 'towels',
        'gloves': 'gloves',
        'hats': 'hats',
        'boots': 'boots',
        'trainers': 'trainers',
        'leggings': 'leggings',
        'sweatpants': 'sweatpants',
        'scarves': 'scarves',
        'socks': 'socks'
    };

    // ──────────────────────────────────────────────
    // NORMALIZE CATEGORY  (alias → canonical slug)
    // ──────────────────────────────────────────────
    const CATEGORY_ALIASES = {
        't-shirt': 'tshirts', 't-shirts': 'tshirts', 'tees': 'tshirts', 'tee': 'tshirts',
        'polo-shirts': 'polo', 'polos': 'polo',
        'hi-viz': 'hivis', 'hi-vis': 'hivis', 'hi vis': 'hivis', 'hi-vis clothing': 'hivis', 'hi-viz clothing': 'hivis',
        'safety-vests': 'hivis',
        'fleece': 'fleeces',
        'chef-jacket': 'chef-jackets', 'chef-jackets': 'chef-jackets',
        'bodywarmers': 'gilets', 'gilets-body-warmers': 'gilets',
        'sports-overtops': 'sports-overtops', 'sports overtops': 'sports-overtops'
    };

    function normalizeCategory(raw) {
        var value = String(raw || '').trim().toLowerCase();
        if (!value) return 'all';
        return CATEGORY_ALIASES[value] || value;
    }

    // ──────────────────────────────────────────────
    // SLUG → API NAME  (frontend slug → API display name)
    // ──────────────────────────────────────────────
    const SLUG_TO_API_NAME = {
        'tshirts': 'T-Shirts',
        't-shirts': 'T-Shirts',
        'caps': 'Caps',
        'hats': 'Hats',
        'hoodies': 'Hoodies',
        'jackets': 'Jackets',
        'polo': 'Polos',
        'polos': 'Polos',
        'shirts': 'Shirts',
        'sweatshirts': 'Sweatshirts',
        'beanies': 'Beanies',
        'blouses': 'Blouses',
        'chinos': 'Chinos',
        'fleeces': 'Fleece',
        'fleece': 'Fleece',
        'hivis': 'Hi Vis',
        'hi-vis': 'Hi Vis',
        'trousers': 'Trousers',
        'aprons': 'Aprons',
        'bags': 'Bags',
        'shorts': 'Shorts',
        'softshells': 'Softshells',
        'gilets': 'Gilets & Body Warmers',
        'chef-jackets': 'Chef Jackets',
        'tunics': 'Tunics',
        'sports-overtops': 'Sports Overtops'
    };

    function getApiCategoryName(categorySlug) {
        return SLUG_TO_API_NAME[categorySlug] || null;
    }

    // ──────────────────────────────────────────────
    // FILTER MAPPINGS  (filter group → value maps)
    // ──────────────────────────────────────────────
    const FILTER_MAPPINGS = {
        quickFilter: {
            'new-in': 'new-in',
            'bradeal': 'raladeal',
            'offers': 'offers',
            'in-stock': 'in-stock',
            'recycled': 'recycled-organic'
        },
        gender: {
            'female': 'female',
            'male': 'male',
            'unisex': 'unisex'
        },
        ageGroup: {
            'adult': 'adult',
            'infant': 'infant',
            'kids': 'kids'
        },
        sleeve: {
            'long-sleeve-2': 'long-sleeve-2',
            'short-sleeve-2': 'short-sleeve-2',
            'sleeveless': 'sleeveless',
            'raglan-sleeve': 'raglan-sleeve',
            'set-in-sleeve': 'set-in-sleeve',
            'roll-sleeve': 'roll-sleeve'
        },
        neckline: {
            'crew-neck-2': 'crew-neck-2',
            'v-neck-2': 'v-neck-2',
            'mandarin': 'mandarin',
            'wide-neck': 'wide-neck',
            'roll-neck': 'roll-neck',
            'button-down-collar': 'button-down-collar',
            'keyhole': 'keyhole',
            'polo-neck-2': 'polo-neck-2',
            'hooded-2': 'hooded-2',
            'scoop-neck-2': 'scoop-neck-2',
            'zip-neck-2': 'zip-neck-2'
        },
        accreditations: {
            'vegan-tested': 'vegan-tested',
            'oeko-tex': 'oeko-tex',
            'global-compact': 'global-compact',
            'sedex': 'sedex',
            'un-global-compact': 'un-global-compact',
            'polylana': 'polylana',
            'ocs-blended-licence': 'ocs-blended-licence',
            'ocs-100-licence': 'ocs-100-licence',
            'oeko-tex-step': 'oeko-tex-step',
            'rcs-blended-licence': 'rcs-blended-licence',
            'global-recycled-standard': 'global-recycled-standard',
            'sa8000': 'sa8000',
            'amfori-bsci': 'amfori-bsci',
            'recycled': 'recycled',
            'b-corp': 'b-corp',
            'gots-licence': 'gots-licence',
            'organic': 'organic',
            'fairtrade-': 'fairtrade-',
            'certified-organic': 'certified-organic',
            'en-iso-20471': 'en-iso-20471',
            'ris-3279-tom-rail': 'ris-3279-tom-rail'
        },
        primaryColour: {
            'black': 'black',
            'blue': 'blue',
            'grey': 'grey',
            'green': 'green',
            'white': 'white',
            'red': 'red',
            'pink': 'pink',
            'yellow': 'yellow',
            'neutral': 'neutral',
            'purple': 'purple',
            'orange': 'orange',
            'brown': 'brown',
            'pattern': 'pattern',
            'other': 'other'
        },
        colourShade: {
            'black - black': 'black - black',
            'blue - navy': 'blue - navy',
            'grey - dark grey': 'grey - dark grey',
            'white - white': 'white - white'
        },
        style: {
            'classic': 'classic',
            'crew-neck-1': 'crew-neck-1',
            'hooded-1': 'hooded-1',
            'long-sleeve-1': 'long-sleeve-1',
            'oversized': 'oversized',
            'pocket': 'pocket',
            'regular': 'regular',
            'slim-1': 'slim-1',
            'v-neck': 'v-neck',
            'zipped': 'zipped'
        },
        feature: {
            'anti-bacterial': 'anti-bacterial',
            'breathable': 'breathable',
            'eco': 'eco',
            'heavyweight': 'heavyweight',
            'tear-away': 'tear-away',
            'uv-protection': 'uv-protection',
            'water-resistant': 'water-resistant'
        },
        size: {
            's': 's', 'm': 'm', 'l': 'l', 'xl': 'xl',
            '2xl': '2xl', '3xl': '3xl', 'xs': 'xs',
            'one-size': 'one-size', '4xl': '4xl', '5xl': '5xl'
        },
        fabric: {
            'recycled-100': 'recycled-100',
            'organic-100': 'organic-100',
            'polyester-100': 'polyester-100',
            'cotton-100': 'cotton-100',
            'nylon-100': 'nylon-100',
            'ringspun-100': 'ringspun-100'
        },
        weight: {
            '0-50gsm': '0-50gsm',
            '051-100gsm': '051-100gsm',
            '101-150gsm': '101-150gsm',
            '151-200gsm': '151-200gsm',
            '201-250gsm': '201-250gsm',
            '251-300gsm': '251-300gsm',
            'over-300gsm': 'over-300gsm'
        },
        fit: {
            'classic': 'classic',
            'comfort': 'comfort',
            'crop': 'crop',
            'fashion': 'fashion',
            'fitted': 'fitted',
            'oversized': 'oversized',
            'relaxed': 'relaxed',
            'semi-fitted': 'semi-fitted'
        },
        sector: {
            'sport': 'Sport',
            'corporate': 'Corporate',
            'hospitality': 'Hospitality',
            'travel': 'Travel',
            'fashion': 'Fashion',
            'school': 'School',
            'safety': 'Safety',
            'outdoor': 'Outdoor',
            'athleisure': 'Athleisure',
            'home': 'Home'
        },
        sport: {
            'golf': 'golf',
            'gym': 'gym',
            'swimming': 'swimming',
            'rugby': 'rugby'
        },
        tag: {
            'adhesives': 'adhesives',
            'cut-away-inner-label': 'cut-away-inner-label',
            'sewn-tag': 'sewn-tag',
            'tagless': 'tagless'
        },
        effect: {
            'melange': 'melange',
            'heather': 'heather',
            'tie-dye': 'tie-dye',
            'triblend': 'triblend',
            'washed': 'washed',
            'acid-wash': 'acid-wash'
        }
    };

    // ──────────────────────────────────────────────
    // VERIFIED NAV LANDINGS  (current API only)
    // Multiple productTypes are server-side OR.
    // productTypes + sectors are (A OR B) AND sector.
    // Workwear is a mega-menu container, not a landing.
    // sort=price-lh is not fully reliable on OR pages.
    // ──────────────────────────────────────────────
    const NAV_LANDINGS = {
        hospitality: {
            title: 'Hospitality',
            productTypes: ['T-Shirts', 'Polos', 'Shirts', 'Aprons', 'Chef Jackets', 'Tunics'],
            sectors: ['Hospitality']
        },
        school: {
            title: 'School',
            productTypes: ['T-Shirts', 'Hoodies', 'Sweatshirts'],
            sectors: ['School']
        },
        safety: {
            title: 'Safety',
            productTypes: ['Hi Vis', 'Jackets', 'Trousers', 'Polos', 'T-Shirts'],
            sectors: ['Safety']
        },
        corporate: {
            title: 'Corporate',
            productTypes: ['Polos', 'T-Shirts', 'Shirts', 'Blouses', 'Jackets', 'Fleece'],
            sectors: ['Corporate']
        },
        outdoor: {
            title: 'Outdoor',
            productTypes: ['Jackets', 'Fleece', 'Gilets & Body Warmers'],
            sectors: ['Outdoor']
        },
        sport: {
            title: 'Sport',
            productTypes: ['T-Shirts', 'Polos', 'Shorts', 'Hoodies', 'Sports Overtops', 'Caps'],
            sectors: ['Sport']
        },
        headwear: {
            title: 'Headwear',
            productTypes: ['Caps', 'Hats', 'Beanies'],
            sectors: []
        },
        deals: {
            title: 'Deals',
            productTypes: [],
            sectors: [],
            flags: ['offers']
        }
    };

    function collectSearchValues(params, name) {
        if (!params) return [];
        return []
            .concat(params.getAll(name) || [])
            .concat(params.getAll(name + '[]') || [])
            .map(function (value) { return String(value || '').trim(); })
            .filter(Boolean);
    }

    function uniquePreserve(values) {
        var seen = {};
        var out = [];
        (values || []).forEach(function (value) {
            var key = String(value).toLowerCase();
            if (!key || seen[key]) return;
            seen[key] = true;
            out.push(value);
        });
        return out;
    }

    function matchNavLanding(productTypes, sectors, flags) {
        var typeKey = uniquePreserve(productTypes).map(function (value) {
            return String(value).toLowerCase();
        }).sort().join('|');
        var sectorKey = uniquePreserve(sectors).map(function (value) {
            return String(value).toLowerCase();
        }).sort().join('|');
        var flagKey = uniquePreserve(flags).map(function (value) {
            return String(value).toLowerCase();
        }).sort().join('|');

        var keys = Object.keys(NAV_LANDINGS);
        for (var i = 0; i < keys.length; i++) {
            var landing = NAV_LANDINGS[keys[i]];
            var landingTypes = (landing.productTypes || []).map(function (value) {
                return String(value).toLowerCase();
            }).sort().join('|');
            var landingSectors = (landing.sectors || []).map(function (value) {
                return String(value).toLowerCase();
            }).sort().join('|');
            var landingFlags = (landing.flags || []).map(function (value) {
                return String(value).toLowerCase();
            }).sort().join('|');
            if (typeKey === landingTypes && sectorKey === landingSectors && flagKey === landingFlags) {
                return Object.assign({ id: keys[i] }, landing);
            }
        }
        return null;
    }

    function isAggregatedOrQuery(productTypes) {
        return Array.isArray(productTypes) && productTypes.length > 1;
    }

    // ──────────────────────────────────────────────
    // MEGA DROP HERO IMAGES & ICONS
    // ──────────────────────────────────────────────
    // Edit heroImage and icon / icons here to change every drop window.
    // Paths are relative to the site root. Do not put these URLs in CSS.
    // heroImage → <img data-mega-hero>    icon → <i data-mega-icon>
    // icons.fit / icons.style / … → <i data-mega-icon="fit">
    const MEGA_DROP_ASSETS = {
        allproducts: {
            heroImage: 'blog/images/corporate-staff-uniforms-planning-guide.webp',
            heroAlt: '',
            icon: 'fa-solid fa-border-all'
        },
        industries: {
            heroImage: 'blog/images/hospitality-uniforms-cafe-restaurant-hotel.webp',
            heroAlt: '',
            icon: 'fa-solid fa-industry',
            icons: {
                corporate: 'fa-solid fa-building',
                hospitality: 'fa-solid fa-utensils',
                school: 'fa-solid fa-graduation-cap',
                safety: 'fa-solid fa-shield-halved',
                sport: 'fa-solid fa-trophy',
                outdoor: 'fa-solid fa-tree'
            }
        },
        tshirts: {
            heroImage: 'blog/images/custom-t-shirts-printing-guide.webp',
            heroAlt: '',
            icon: 'fa-solid fa-shirt',
            icons: {
                fit: 'fa-solid fa-user-group',
                style: 'fa-solid fa-shirt',
                industry: 'fa-solid fa-building',
                brands: 'fa-solid fa-star'
            }
        },
        polos: {
            heroImage: 'blog/images/personalised-embroidered-polo-shirts-guide.webp',
            heroAlt: '',
            icon: 'fa-solid fa-shirt',
            icons: {
                fit: 'fa-solid fa-user-group',
                style: 'fa-solid fa-shirt',
                industry: 'fa-solid fa-building',
                brands: 'fa-solid fa-star'
            }
        },
        hoodies: {
            heroImage: 'blog/images/personalised-hoodies-sweatshirts-jackets-guide.webp',
            heroAlt: '',
            icon: 'fa-solid fa-shirt',
            icons: {
                fit: 'fa-solid fa-user-group',
                style: 'fa-solid fa-shirt',
                industry: 'fa-solid fa-building',
                brands: 'fa-solid fa-star'
            }
        },
        sweatshirts: {
            heroImage: 'blog/images/personalised-hoodies-sweatshirts-jackets-guide.webp',
            heroAlt: '',
            icon: 'fa-solid fa-shirt',
            icons: {
                fit: 'fa-solid fa-user-group',
                style: 'fa-solid fa-shirt',
                industry: 'fa-solid fa-building',
                brands: 'fa-solid fa-star'
            }
        },
        jackets: {
            heroImage: 'blog/images/personalised-workwear-team-guide.webp',
            heroAlt: '',
            icon: 'fa-solid fa-vest',
            icons: {
                type: 'fa-solid fa-vest',
                fit: 'fa-solid fa-user-group',
                industry: 'fa-solid fa-building',
                brands: 'fa-solid fa-star'
            }
        },
        hivis: {
            heroImage: 'blog/images/construction-custom-hi-vis-workwear-guide.webp',
            heroAlt: '',
            icon: 'fa-solid fa-person-hiking',
            icons: {
                type: 'fa-solid fa-person-hiking',
                fit: 'fa-solid fa-user-group',
                industry: 'fa-solid fa-building',
                brands: 'fa-solid fa-star'
            }
        },
        workwear: {
            heroImage: 'blog/images/personalised-workwear-team-guide.webp',
            heroAlt: '',
            icon: 'fa-solid fa-helmet-safety',
            icons: {
                type: 'fa-solid fa-helmet-safety',
                fit: 'fa-solid fa-user-group',
                brands: 'fa-solid fa-star'
            }
        },
        headwear: {
            heroImage: 'blog/images/custom-t-shirts-printing-guide.webp',
            heroAlt: '',
            icon: 'fa-solid fa-hat-cowboy',
            icons: {
                type: 'fa-solid fa-hat-cowboy',
                fit: 'fa-solid fa-user-group',
                brands: 'fa-solid fa-star'
            }
        }
    };

    function resolveMegaAssetUrl(path) {
        if (!path) return '';
        if (/^(?:https?:|data:|\/)/i.test(path)) return path;
        try {
            return new URL(path, document.baseURI).href;
        } catch (error) {
            return path;
        }
    }

    function applyMegaDropAssets(root) {
        var scope = root && root.querySelectorAll ? root : document;
        Object.keys(MEGA_DROP_ASSETS).forEach(function (key) {
            var cfg = MEGA_DROP_ASSETS[key];
            scope.querySelectorAll('[data-mega-key="' + key + '"]').forEach(function (drop) {
                drop.querySelectorAll('[data-mega-hero]').forEach(function (img) {
                    if (!cfg.heroImage) return;
                    img.setAttribute('src', resolveMegaAssetUrl(cfg.heroImage));
                    img.setAttribute('alt', cfg.heroAlt || '');
                });
                drop.querySelectorAll('[data-mega-icon]').forEach(function (iconEl) {
                    var iconKey = iconEl.getAttribute('data-mega-icon');
                    var iconClass = (cfg.icons && iconKey && cfg.icons[iconKey]) || cfg.icon;
                    if (iconClass) iconEl.className = iconClass;
                });
            });
        });
    }

    // ──────────────────────────────────────────────
    // PUBLIC API
    // ──────────────────────────────────────────────
    return {
        CATEGORY_TITLES:    CATEGORY_TITLES,
        CATEGORY_INFO:      CATEGORY_INFO,
        PRODUCT_TYPES:      PRODUCT_TYPES,
        CATEGORY_SLUG_MAP:  CATEGORY_SLUG_MAP,
        CATEGORY_ALIASES:   CATEGORY_ALIASES,
        SLUG_TO_API_NAME:   SLUG_TO_API_NAME,
        FILTER_MAPPINGS:    FILTER_MAPPINGS,
        NAV_LANDINGS:       NAV_LANDINGS,
        normalizeCategory:  normalizeCategory,
        getApiCategoryName: getApiCategoryName,
        collectSearchValues: collectSearchValues,
        uniquePreserve: uniquePreserve,
        matchNavLanding: matchNavLanding,
        isAggregatedOrQuery: isAggregatedOrQuery,
        MEGA_DROP_ASSETS: MEGA_DROP_ASSETS,
        applyMegaDropAssets: applyMegaDropAssets,

        /** Convenience: get category title for a slug */
        getCategoryTitle: function (slug) {
            var norm = normalizeCategory(slug);
            return CATEGORY_TITLES[norm] || CATEGORY_TITLES[slug] || 'All Products';
        },

        /** Convenience: get category info (title + desc) */
        getCategoryInfo: function (slug) {
            var norm = normalizeCategory(slug);
            return CATEGORY_INFO[norm] || CATEGORY_INFO[slug] || CATEGORY_INFO['all'];
        }
    };
})();
