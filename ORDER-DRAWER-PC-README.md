# Order Drawer PC - Processo d'ordine separato per PC

## 📋 Overview

Sistema di drawer slide-in per il processo d'ordine **esclusivo per la versione PC**. 
Non tocca in alcun modo le versioni mobile e tablet esistenti.

## 🎯 Obiettivo

Creare un'esperienza di checkout moderna per PC con drawer animato, mantenendo completamente separati:
- ✅ **PC**: Nuovo drawer slide-in (questo sistema)
- ✅ **Mobile**: Usa `mobile/basket-mobile.html`, `mobile/checkout-mobile.html`  
- ✅ **Tablet/Root**: Usa `basket.html`, `checkout.html`

## 📁 File Coinvolti

### File Nuovi (PC-only)
- `order-drawer-pc.js` - Logica e UI del drawer slide-in

### File Modificati (solo PC)
- `home-pc.html` - Include script e aggiorna link basket

### File NON Toccati (Mobile/Tablet)
- `basket.html` ✓ (rimane per tablet/responsive)
- `checkout.html` ✓ (rimane per tablet/responsive)
- `mobile/basket-mobile.html` ✓
- `mobile/checkout-mobile.html` ✓
- Qualsiasi altro file nella cartella `mobile/`

## 🚀 Come Funziona

### Step del Drawer

1. **Step 1: Basket**
   - Mostra tutti gli articoli nel carrello
   - Calcolo totale
   - Pulsante "Proceed to Checkout"

2. **Step 2: Checkout**
   - Form con dati contatto
   - Indirizzo di spedizione
   - Note aggiuntive

3. **Step 3: Confirmation**
   - Messaggio di successo
   - Riepilogo ordine
   - Numero di riferimento

### Animazioni

- ✨ **Slide in from right**: Il drawer appare da destra
- ✨ **Horizontal transitions**: Gli step scorrono orizzontalmente
- ✨ **Smooth easing**: Animazioni fluide con cubic-bezier

## 💻 Utilizzo

### Aprire il Drawer

```javascript
// Da JavaScript
openOrderDrawer();

// Da HTML
<button onclick="openOrderDrawer()">View Basket</button>
```

### Esempio nel codice

In `home-pc.html`:
```html
<a href="#" onclick="event.preventDefault(); openOrderDrawer();" aria-label="View quote">
    <!-- Basket icon -->
</a>
```

## 🔧 Personalizzazione

### Modificare gli step

Apri `order-drawer-pc.js` e modifica la funzione `updateStep()`:

```javascript
const titles = {
    1: 'Your Basket',
    2: 'Checkout',
    3: 'Order Complete'
};
```

### Cambiare colori

Nel CSS inline dentro `order-drawer-pc.js`, cerca:

```css
:root {
    --purple: #273469;  /* Colore principale */
    --gray-50: #f9fafb;
    /* ... */
}
```

### Backend Integration

La funzione `submitQuote()` in `order-drawer-pc.js` è pronta per integrazione API:

```javascript
function submitQuote() {
    // ... codice esistente ...
    
    // Aggiungi chiamata API qui
    fetch('/api/submit-quote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            reference: ref,
            customer: Object.fromEntries(formData),
            items: basket,
            total: total
        })
    })
    .then(response => response.json())
    .then(data => {
        console.log('Quote submitted:', data);
    });
}
```

## 🧪 Testing

### Test PC (deve usare drawer)
1. Apri `home-pc.html` su browser desktop
2. Clicca l'icona basket nell'header
3. ✅ Deve aprire il drawer da destra
4. ✅ Deve mostrare gli step con animazioni

### Test Mobile (NON deve usare drawer)
1. Apri `index.html` o `basket.html` su mobile
2. Clicca l'icona basket
3. ✅ Deve navigare a `basket.html` normale
4. ✅ NON deve aprire drawer

### Test Tablet (NON deve usare drawer)
1. Apri `basket.html` su tablet
2. ✅ Deve usare la versione responsive esistente
3. ✅ NON deve aprire drawer

## 📦 LocalStorage

Il drawer legge dal `localStorage`:

```javascript
// Basket items
const basket = JSON.parse(localStorage.getItem('quoteBasket') || '[]');

// Formato item:
{
    name: "Product Name",
    code: "ABC123",
    image: "path/to/image.jpg",
    color: "Navy",
    quantity: 10,
    price: 12.50,
    positions: [...]  // customization positions
}
```

## 🎨 Design Features

- **Max width**: 600px
- **Overlay**: Semi-transparent backdrop
- **Transitions**: 0.4s cubic-bezier
- **Progress bar**: Visual step indicator
- **Responsive**: Adatta a larghezze diverse
- **Form validation**: Built-in HTML5 validation

## 🔒 Separazione PC/Mobile/Tablet

### Come è garantita la separazione?

1. **File separati**: `order-drawer-pc.js` è incluso SOLO in `home-pc.html`
2. **Nessuna dipendenza**: Non modifica file condivisi
3. **LocalStorage**: Usa stesso formato ma non interferisce
4. **Link condizionali**: Solo `home-pc.html` usa `onclick="openOrderDrawer()"`

### File tree

```
brandeduk/
├── home-pc.html               ← Include order-drawer-pc.js (PC only)
├── order-drawer-pc.js         ← Nuovo file (PC only)
├── basket.html                ← NON modificato (tablet/responsive)
├── checkout.html              ← NON modificato (tablet/responsive)
└── mobile/
    ├── basket-mobile.html     ← NON modificato
    └── checkout-mobile.html   ← NON modificato
```

## 🚨 Troubleshooting

### Il drawer non si apre
- Controlla che `order-drawer-pc.js` sia caricato
- Controlla la console per errori
- Verifica che `openOrderDrawer()` sia definita globalmente

### Gli step non scorrono
- Controlla che il CSS sia caricato correttamente
- Verifica le transitions nel CSS
- Controlla `order-drawer-track` transform

### Il form non si invia
- Verifica la validazione HTML5
- Controlla i campi required
- Vedi console per errori

## 📝 Changelog

### v1.0.0 (2026-05-09)
- ✨ Drawer slide-in iniziale
- ✨ 3 step: Basket → Checkout → Confirmation
- ✨ Form di checkout completo
- ✨ Animazioni smooth
- ✨ Separazione completa da mobile/tablet

## 🤝 Contributing

Quando modifichi il drawer:
1. ✅ Modifica SOLO `order-drawer-pc.js` e `home-pc.html`
2. ❌ NON toccare file nella cartella `mobile/`
3. ❌ NON modificare `basket.html` o `checkout.html` (usati da tablet)
4. ✅ Testa su tutte le risoluzioni (desktop, tablet, mobile)

## 📞 Support

Per problemi o domande, contatta il team di sviluppo.
