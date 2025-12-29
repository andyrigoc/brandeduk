# Hero Banners System

## Struttura
Ogni hero ha la sua cartella con:
- `config.json` - configurazione pannelli
- `images/` - immagini per ogni pannello

## Heroes Disponibili
1. `workwear-default/` - Hero principale con categorie prodotto
2. (aggiungi altri qui)

## Come Usare
Nel file `home-mobile.html`, cambia la variabile `ACTIVE_HERO`:

```javascript
const ACTIVE_HERO = 'workwear-default'; // Cambia con il nome della cartella hero
```

## Creare un Nuovo Hero

1. Crea una nuova cartella: `heroes/nome-hero/`
2. Aggiungi `config.json`:
```json
{
  "name": "Nome Hero",
  "panels": [
    {
      "id": "panel1",
      "title": "Titolo",
      "subtitle": "Sottotitolo",
      "image": "images/panel1.jpg",
      "link": "shop-mobile.html?category=xxx"
    }
  ]
}
```
3. Aggiungi le immagini in `images/`
4. Aggiorna `ACTIVE_HERO` in home-mobile.html
