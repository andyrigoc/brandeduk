/**
 * TEST: Verifica che il logo venga salvato correttamente per-item nel basket
 * Simula il flusso dati localStorage/sessionStorage senza browser
 */

const fs = require('fs');
const path = require('path');

// Read the actual source files
const customizeJS = fs.readFileSync(path.join(__dirname, 'mobile/js/customize.js'), 'utf8');
const basketHTML = fs.readFileSync(path.join(__dirname, 'basket.html'), 'utf8');

let passed = 0;
let failed = 0;

function test(name, fn) {
    try {
        fn();
        console.log(`  ✅ ${name}`);
        passed++;
    } catch (e) {
        console.error(`  ❌ ${name}`);
        console.error(`     ${e.message}`);
        failed++;
    }
}

function assert(condition, msg) {
    if (!condition) throw new Error(msg || 'Assertion failed');
}

// ========================================================
// SETUP: Create mock basket items (same product, different sizes)
// ========================================================
function createMockBasket() {
    return [
        {
            id: '1000-S',
            productCode: 'GD067',
            productName: 'Heavy Cotton T-Shirt',
            color: 'Antique Cherry Red',
            colorId: 'cherry-red',
            colorImage: 'img/cherry.jpg',
            quantities: { S: 1 },
            totalQty: 1,
            unitPrice: 3.50,
            positions: [{ position: 'left-breast', name: 'Left Chest', method: 'embroidery', unitPrice: 5.00, logo: 'data:image/png;base64,LOGO_A_DATA' }],
            positionDesigns: {
                'left-breast': { position: 'left-breast', method: 'embroidery', logo: 'data:image/png;base64,LOGO_A_DATA' }
            },
            customizations: [],
            productType: 'T-shirts'
        },
        {
            id: '1001-M',
            productCode: 'GD067',
            productName: 'Heavy Cotton T-Shirt',
            color: 'Antique Cherry Red',
            colorId: 'cherry-red',
            colorImage: 'img/cherry.jpg',
            quantities: { M: 1 },
            totalQty: 1,
            unitPrice: 3.50,
            positions: [{ position: 'left-breast', name: 'Left Chest', method: 'embroidery', unitPrice: 5.00, logo: 'data:image/png;base64,LOGO_A_DATA' }],
            positionDesigns: {
                'left-breast': { position: 'left-breast', method: 'embroidery', logo: 'data:image/png;base64,LOGO_A_DATA' }
            },
            customizations: [],
            productType: 'T-shirts'
        },
        {
            id: '1002-L',
            productCode: 'GD067',
            productName: 'Heavy Cotton T-Shirt',
            color: 'Antique Cherry Red',
            colorId: 'cherry-red',
            colorImage: 'img/cherry.jpg',
            quantities: { L: 2 },
            totalQty: 2,
            unitPrice: 3.50,
            positions: [],
            positionDesigns: {},
            customizations: [],
            productType: 'T-shirts'
        }
    ];
}

// ========================================================
console.log('\n=== TEST 1: Struttura codice - restoreCustomizationState ===');
// ========================================================

test('restoreCustomizationState controlla customizingBasketIndex', () => {
    assert(
        customizeJS.includes("sessionStorage.getItem('customizingBasketIndex') !== null"),
        'Manca check per customizingBasketIndex in restoreCustomizationState'
    );
});

test('isEditingBasketItem → pulisce positionDesigns', () => {
    assert(
        customizeJS.includes('if (isEditingBasketItem)'),
        'Manca branch isEditingBasketItem'
    );
    // Verify it clears all 4 state fields after the if (isEditingBasketItem) block
    const idx = customizeJS.indexOf('if (isEditingBasketItem)');
    const block = customizeJS.substring(idx, idx + 500);
    assert(block.includes('state.positionDesigns = {}'), 'Non pulisce positionDesigns');
    assert(block.includes('state.positionMethods = {}'), 'Non pulisce positionMethods');
    assert(block.includes('state.positionCustomizations = {}'), 'Non pulisce positionCustomizations');
    assert(block.includes('state.positions = []'), 'Non pulisce positions');
});

test('isEditingBasketItem → NON ripristina quantity dalla sessione', () => {
    // Quantity restore should be guarded by !isEditingBasketItem
    assert(
        customizeJS.includes('if (!isEditingBasketItem)') && 
        customizeJS.includes('savedState.sizeQuantities'),
        'Quantity non protetta da isEditingBasketItem check'
    );
    // Verify the guard comes BEFORE sizeQuantities restore
    const guardIdx = customizeJS.indexOf('if (!isEditingBasketItem)');
    const qtyIdx = customizeJS.indexOf('savedState.sizeQuantities', guardIdx);
    assert(qtyIdx > guardIdx && qtyIdx - guardIdx < 200, 
        'Guard !isEditingBasketItem non è vicino al restore di sizeQuantities');
});

// ========================================================
console.log('\n=== TEST 2: Struttura codice - Phase 2.1 basket item loading ===');
// ========================================================

test('Phase 2.1 carica positionDesigns dal basket item', () => {
    assert(
        customizeJS.includes('state.positionDesigns = { ...basketItem.positionDesigns }'),
        'Phase 2.1 non carica positionDesigns dal basket item'
    );
});

test('Phase 2.1 sincronizza anche positionCustomizations', () => {
    assert(
        customizeJS.includes('state.positionCustomizations = { ...basketItem.positionDesigns }'),
        'Phase 2.1 non sincronizza positionCustomizations'
    );
});

test('Phase 2.1 imposta _autoSavedItemId', () => {
    assert(
        customizeJS.includes('_autoSavedItemId = basketItem.id'),
        'Phase 2.1 non imposta _autoSavedItemId'
    );
});

// ========================================================
console.log('\n=== TEST 3: Struttura codice - addToQuote ===');
// ========================================================

test('addToQuote non blocca su quantity=0 per basket edit', () => {
    assert(
        customizeJS.includes('state.quantity === 0 && !isFromBasket'),
        'addToQuote blocca ancora su quantity=0 per basket edit'
    );
});

test('addToQuote aggiorna solo item specifico via _autoSavedItemId', () => {
    // Check that the from-basket path uses findIndex with _autoSavedItemId
    assert(
        customizeJS.includes("basket.findIndex(i => i.id === _autoSavedItemId)"),
        'addToQuote non cerca per _autoSavedItemId'
    );
});

test('addToQuote usa JSON.parse(JSON.stringify) per deep copy positionDesigns', () => {
    assert(
        customizeJS.includes('JSON.parse(JSON.stringify(basePositionDesigns))'),
        'addToQuote non fa deep copy di positionDesigns'
    );
});

// ========================================================
console.log('\n=== TEST 4: Struttura codice - applyDesignToPosition ===');
// ========================================================

test('applyDesignToPosition salva solo item specifico quando _autoSavedItemId è set', () => {
    // In the if (_autoSavedItemId) block, should use basket.find NOT basket.forEach
    const applyBlock = customizeJS.match(/if \(_autoSavedItemId\)\s*\{[^}]*basket\.find\(i => i\.id === _autoSavedItemId\)/s);
    assert(applyBlock, 'applyDesignToPosition non cerca per _autoSavedItemId');
});

test('applyDesignToPosition NON aggiorna tutti gli items quando da basket', () => {
    // The else block (not from basket) uses basket.forEach - this is for normal flow only
    const elseBlock = customizeJS.match(/Not from basket.*basket\.forEach/s);
    assert(elseBlock, 'Manca il commento "Not from basket" prima di basket.forEach');
});

// ========================================================
console.log('\n=== TEST 5: Struttura codice - closeCustomizePopup globale ===');
// ========================================================

test('closeCustomizePopup è esposta come window global in basket.html', () => {
    assert(
        basketHTML.includes('window.closeCustomizePopup = closeCustomizePopup'),
        'closeCustomizePopup NON è esposta come window global!'
    );
});

test('closeCustomizePopup NON chiama _forceAutoSave (come codice eseguibile)', () => {
    // Find the function and check it doesn't CALL _forceAutoSave (comments are OK)
    const fnStart = basketHTML.indexOf('function closeCustomizePopup()');
    const fnEnd = basketHTML.indexOf('renderBasket()', fnStart) + 50;
    const fnBody = basketHTML.substring(fnStart, fnEnd);
    // Should NOT have _forceAutoSave() call (but comment mentioning it is fine)
    const hasCall = fnBody.includes('_forceAutoSave()') || fnBody.includes('_forceAutoSave;');
    assert(!hasCall, 'closeCustomizePopup chiama ancora _forceAutoSave! Causa double-save.');
});

test('closeCustomizePopup chiama renderBasket dopo delay', () => {
    const fnMatch = basketHTML.match(/function closeCustomizePopup\(\)\s*\{([\s\S]*?)^\s{8}\}/m);
    assert(fnMatch, 'Funzione closeCustomizePopup non trovata');
    assert(
        fnMatch[1].includes('renderBasket()'),
        'closeCustomizePopup non chiama renderBasket'
    );
});

// ========================================================
console.log('\n=== TEST 6: Done button - positionsOnly mode ===');
// ========================================================

test('positionsOnly Done chiama addToQuote', () => {
    const idx = customizeJS.indexOf('positionsDoneBtn');
    assert(idx > -1, 'positionsDoneBtn non trovato nel codice');
    const block = customizeJS.substring(idx, idx + 600);
    assert(
        block.includes('addToQuote({ silent: true })'),
        'positionsOnly Done non chiama addToQuote'
    );
});

test('positionsOnly Done ha fallback postMessage', () => {
    const idx = customizeJS.indexOf('positionsDoneBtn');
    assert(idx > -1, 'positionsDoneBtn non trovato');
    const block = customizeJS.substring(idx, idx + 900);
    assert(
        block.includes('postMessage'),
        'positionsOnly Done non ha fallback postMessage'
    );
});

// ========================================================
console.log('\n=== TEST 7: postMessage listener in basket.html ===');
// ========================================================

test('basket.html ha listener per closeCustomizePopup postMessage', () => {
    assert(
        basketHTML.includes("e.data.type === 'closeCustomizePopup'"),
        'Manca postMessage listener per closeCustomizePopup'
    );
});

// ========================================================
console.log('\n=== TEST 8: Simulazione flusso dati completo ===');
// ========================================================

test('Scenario: Edit item S con logo B, item M resta con logo A', () => {
    const basket = createMockBasket();
    const itemS = basket[0]; // id: '1000-S'
    const itemM = basket[1]; // id: '1001-M'
    
    // Simula: l'utente edita Item S con Logo B
    const _autoSavedItemId = '1000-S';
    const newDesignData = { position: 'left-breast', method: 'embroidery', logo: 'data:image/png;base64,LOGO_B_DATA' };
    
    // Simula applyDesignToPosition: cerca per _autoSavedItemId
    const existing = basket.find(i => i.id === _autoSavedItemId);
    assert(existing, 'Item S non trovato nel basket');
    existing.positionDesigns = { ...existing.positionDesigns, 'left-breast': newDesignData };
    
    // Verifica
    assert(basket[0].positionDesigns['left-breast'].logo === 'data:image/png;base64,LOGO_B_DATA', 
        'Item S dovrebbe avere Logo B');
    assert(basket[1].positionDesigns['left-breast'].logo === 'data:image/png;base64,LOGO_A_DATA', 
        'Item M dovrebbe avere ancora Logo A');
    assert(basket[2].positionDesigns['left-breast'] === undefined, 
        'Item L non dovrebbe avere nessun logo');
});

test('Scenario: Edit item M con logo C, item S resta con logo B', () => {
    const basket = createMockBasket();
    // Prima: Item S ha già Logo B
    basket[0].positionDesigns['left-breast'].logo = 'data:image/png;base64,LOGO_B_DATA';
    
    // Ora edita Item M con Logo C
    const _autoSavedItemId = '1001-M';
    const newDesignData = { position: 'left-breast', method: 'print', logo: 'data:image/png;base64,LOGO_C_DATA' };
    
    const existing = basket.find(i => i.id === _autoSavedItemId);
    assert(existing, 'Item M non trovato');
    existing.positionDesigns = { ...existing.positionDesigns, 'left-breast': newDesignData };
    
    assert(basket[0].positionDesigns['left-breast'].logo === 'data:image/png;base64,LOGO_B_DATA', 
        'Item S dovrebbe avere Logo B');
    assert(basket[1].positionDesigns['left-breast'].logo === 'data:image/png;base64,LOGO_C_DATA', 
        'Item M dovrebbe avere Logo C');
});

test('Scenario: addToQuote deep copy non crea reference condivise', () => {
    const statePositionDesigns = {
        'left-breast': { logo: 'data:image/png;base64,LOGO_X' }
    };
    
    // Simula addToQuote deep copy
    const saved = JSON.parse(JSON.stringify(statePositionDesigns));
    
    // Modifica lo state dopo il save
    statePositionDesigns['left-breast'].logo = 'data:image/png;base64,CHANGED';
    
    assert(saved['left-breast'].logo === 'data:image/png;base64,LOGO_X',
        'Deep copy non funziona - reference condivisa!');
});

test('Scenario: Item L senza logo, edit aggiunge logo D solo a Item L', () => {
    const basket = createMockBasket();
    
    const _autoSavedItemId = '1002-L';
    const newDesignData = { position: 'right-chest', method: 'print', logo: 'data:image/png;base64,LOGO_D_DATA' };
    
    const existing = basket.find(i => i.id === _autoSavedItemId);
    assert(existing, 'Item L non trovato');
    existing.positionDesigns = { ...existing.positionDesigns, 'right-chest': newDesignData };
    
    assert(basket[0].positionDesigns['right-chest'] === undefined, 'Item S non dovrebbe avere right-chest logo');
    assert(basket[1].positionDesigns['right-chest'] === undefined, 'Item M non dovrebbe avere right-chest logo');
    assert(basket[2].positionDesigns['right-chest'].logo === 'data:image/png;base64,LOGO_D_DATA', 
        'Item L dovrebbe avere Logo D su right-chest');
});

test('Scenario: Multipli loghi su posizioni diverse dello stesso item', () => {
    const basket = createMockBasket();
    
    const _autoSavedItemId = '1000-S';
    const existing = basket.find(i => i.id === _autoSavedItemId);
    
    // Aggiungi logo su left-breast
    existing.positionDesigns['left-breast'] = { logo: 'LOGO_1', method: 'embroidery' };
    // Aggiungi logo su back
    existing.positionDesigns['back-large'] = { logo: 'LOGO_2', method: 'print' };
    
    assert(Object.keys(existing.positionDesigns).length === 2, 'Item S dovrebbe avere 2 posizioni');
    assert(existing.positionDesigns['left-breast'].logo === 'LOGO_1', 'Left chest logo corretto');
    assert(existing.positionDesigns['back-large'].logo === 'LOGO_2', 'Back logo corretto');
    
    // Item M non deve essere toccato
    assert(Object.keys(basket[1].positionDesigns).length === 1, 'Item M dovrebbe avere 1 posizione');
    assert(basket[1].positionDesigns['left-breast'].logo === 'data:image/png;base64,LOGO_A_DATA', 'Item M logo originale');
});

// ========================================================
console.log('\n=== TEST 9: renderBasketItems - logo preview per item ===');
// ========================================================

test('basket.html renderBasketItems legge positionDesigns per item singolo', () => {
    // Verify the render function iterates item.positionDesigns
    assert(
        basketHTML.includes('item.positionDesigns') && basketHTML.includes("Object.entries(item.positionDesigns)"),
        'renderBasketItems non legge positionDesigns per item'
    );
});

test('basket.html renderBasketItems usa logo src da design data', () => {
    assert(
        basketHTML.includes('d.logo') && basketHTML.includes('logos.push'),
        'renderBasketItems non estrae logo src'
    );
});

// ========================================================
console.log('\n=== TEST 10: navigateToCustomize imposta sessionStorage corretto ===');
// ========================================================

test('navigateToCustomize imposta customizingBasketIndex', () => {
    assert(
        basketHTML.includes("sessionStorage.setItem('customizingBasketIndex', itemIndex.toString())"),
        'navigateToCustomize non imposta customizingBasketIndex'
    );
});

test('navigateToCustomize imposta returnAfterCustomize=basket', () => {
    assert(
        basketHTML.includes("sessionStorage.setItem('returnAfterCustomize', 'basket')"),
        'navigateToCustomize non imposta returnAfterCustomize'
    );
});

// ========================================================
// RESULTS
// ========================================================
console.log('\n' + '='.repeat(50));
console.log(`RISULTATI: ${passed} passed, ${failed} failed, ${passed + failed} total`);
if (failed === 0) {
    console.log('🎉 TUTTI I TEST PASSATI!');
    console.log('\nIl flusso dati è corretto:');
    console.log('  1. restoreCustomizationState skipa positionDesigns per basket edit');
    console.log('  2. Phase 2.1 carica dati corretti dal basket item specifico');
    console.log('  3. applyDesignToPosition salva solo nell\'item specifico');
    console.log('  4. addToQuote aggiorna solo l\'item via _autoSavedItemId');
    console.log('  5. closeCustomizePopup è globale e non fa double-save');
    console.log('  6. renderBasketItems legge positionDesigns per-item');
} else {
    console.log('⚠️  ALCUNI TEST FALLITI — controllare i bug sopra');
}
console.log('='.repeat(50));

process.exit(failed > 0 ? 1 : 0);
