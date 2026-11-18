/* Branded UK pre-chat questionnaire component */
/**
 * Branded UK — Pre-Chat (Crisp inbox only; existing Branded customer UI).
 * Add after the existing onsite chat script through the shared footer loader.
 * Does not touch, open or display the Crisp visitor UI.
 * No third-party chat channel is used.
 */
(function () {
  'use strict';
  if (window.__bukPrechatLoaded) return;
  window.__bukPrechatLoaded = true;

  var STORAGE = 'buk_prechat_draft_v3';
  var SENT = 'buk_prechat_sent_v3';
  var SCRIPT_SRC = document.currentScript && document.currentScript.src;
  var REFERENCE = new URL('../images/prechat/reference-artwork.webp', SCRIPT_SRC || location.href).href;
  // Same assets as the site header lockup (animated circle + sharp wordmark).
  var LOGO_BADGE = '/brandedukv15-child/assets/videos/use-the-provided-circular-1727756126.gif?v=20261001-newgif';
  var LOGO_WORD = '/brandedukv15-child/assets/images/ui/Branded%20UK%20Logo%20on%20Transparent%20Background.png?v=20261002-logocombo';
  var chat = window.BrandedOnsiteChat;
  var MAX_FILE = 10 * 1024 * 1024;
  var ALLOWED = ['png','jpg','jpeg','pdf','ai','eps','svg'];
  var ITEMS = [
    { id:'tshirts', label:'T-Shirts', photo:[399,264,44,47] },
    { id:'polos', label:'Polos', photo:[552,264,44,47] },
    { id:'hoodies', label:'Hoodies', photo:[400,324,44,46] },
    { id:'sweatshirts', label:'Sweatshirts', photo:[552,325,44,47] },
    { id:'jackets', label:'Jackets', photo:[400,383,44,48] },
    { id:'workwear', label:'Workwear', photo:[552,382,44,49] },
    { id:'hivis', label:'Hi-Vis', photo:[400,442,44,47] },
    { id:'other', label:'Other / Not listed', icon:'other' }
  ];
  var QUANTITIES = ['1–10 items','11–25 items','26–50 items','51–75 items','76+ items'];
  var live = false, panel = null, root = null, popup = null, file = null, sending = false;
  var state = { step:1, items:[], quantity:'', logoName:'', logoType:'', notes:'', orderRef:'', fastTrack:false, stage:'collect', handoffId:'', handoffAck:false };
  var attachment = null;

  function fromStore() {
    try {
      var d = JSON.parse(sessionStorage.getItem(STORAGE) || 'null');
      if (!d || !Array.isArray(d.items)) return;
      state = Object.assign(state, d);
      delete state.logoPreview;
      delete state.logoPendingNote;
      state.items = state.items.filter(function(id){return ITEMS.some(function(item){return item.id===id;});});
      state.quantity = QUANTITIES.indexOf(state.quantity)>=0 ? state.quantity : '';
      state.step = Math.max(1,Math.min(5,Number(state.step)||1));
      state.notes = String(state.notes||'').slice(0,500);
      state.orderRef = String(state.orderRef||'').slice(0,80);
      if (['collect','auth','support','done','sent','sending'].indexOf(state.stage)<0) state.stage='collect';
      if (state.stage === 'sent') state.stage = 'done';
      if (state.stage === 'sending') state.stage = 'collect';
      if (state.logoName && !file) state.logoMissingAfterNavigation = true;
    } catch(e) {}
  }
  function save() {
    try {
      var s = Object.assign({}, state); delete s.logoMissingAfterNavigation; delete s.logoPreview; delete s.logoPendingNote;
      sessionStorage.setItem(STORAGE, JSON.stringify(s));
    } catch(e) {}
  }
  function el(tag, cls, text) {
    var node = document.createElement(tag);
    if(cls) node.className = cls;
    if(text != null) node.textContent = text;
    return node;
  }
  function button(label, cls, onClick) {
    var b = el('button', cls, label);
    b.type = 'button'; b.addEventListener('click', onClick); return b;
  }
  function escapeText(s) {
    return String(s || '').replace(/[&<>"']/g, function(ch) {
      return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch];
    });
  }
  function headerLogoMarkup() {
    return '<img class="wa-popup__brand-badge" src="' + escapeText(LOGO_BADGE) + '" alt="" width="400" height="400" data-buk-logo-src="' + escapeText(LOGO_BADGE) + '" aria-hidden="true">' +
      '<img class="wa-popup__brand-word" src="' + escapeText(LOGO_WORD) + '" alt="" width="1916" height="821">';
  }
  function replayChatLogo() {
    var img = document.querySelector('#waPopup .buk-pc-brand .wa-popup__brand-badge');
    if (!img || !img.parentNode) return;
    var src = img.getAttribute('data-buk-logo-src') || LOGO_BADGE;
    var fresh = document.createElement('img');
    fresh.className = 'wa-popup__brand-badge';
    fresh.alt = '';
    fresh.width = 400;
    fresh.height = 400;
    fresh.setAttribute('aria-hidden', 'true');
    fresh.setAttribute('data-buk-logo-src', src);
    img.parentNode.replaceChild(fresh, img);
    fresh.src = src;
  }
  // Display the supplied artwork through a viewBox. The source pixels are
  // preserved; no generated replacements or substitute product photography.
  function referencePhoto(box, cls) {
    return '<svg class="'+cls+'" viewBox="'+box.join(' ')+'" aria-hidden="true" focusable="false"><image href="'+escapeText(REFERENCE)+'" x="0" y="0" width="1069" height="1472"/></svg>';
  }
  function icon(name, size) {
    var artwork={tshirt:[397,188,40,35],users:[746,189,43,31],image:[44,918,43,33],note:[395,915,30,35],upload:[155,1032,57,47],bolt:[61,655,22,23],box:[282,655,23,23],cart:[869,1141,32,30]};
    if(size<=20){
      artwork.tshirt=[399,1138,25,23];artwork.users=[400,1167,25,23];artwork.image=[400,1197,24,20];artwork.note=[173,655,22,24];
    }else{artwork.bolt=[766,1141,27,31];}
    if(artwork[name]) return referencePhoto(artwork[name],'buk-pc-art-icon').replace('<svg ','<svg width="'+(size||25)+'" height="'+(size||25)+'" ');
    var start = '<svg width="'+(size||25)+'" height="'+(size||25)+'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">';
    var drawings = {
      tshirt:'<path d="M9 3H7L2 6l2 5 3-1v11h10V10l3 1 2-5-5-3h-2a3 3 0 0 1-6 0Z"/>',
      polo:'<path d="M8 3 5 4 2 7l3 4 2-1v11h10V10l2 1 3-4-3-3-3-1-4 5-4-5Z"/><path d="m9 4 3 4 3-4M12 8v5"/>',
      hoodie:'<path d="M7 7C7 4 9 2 12 2s5 2 5 5l3 3 2 11h-6l-1-5v5H9v-5l-1 5H2l2-11 3-3Z"/><path d="M9 6c0 4 6 4 6 0M10 10v4m4-4v4"/>',
      sweatshirt:'<path d="m7 4-4 4-1 8 5 1v4h10v-4l5-1-1-8-4-4-2 2H9L7 4Z"/><path d="M9 4c0 2 6 2 6 0"/>',
      jacket:'<path d="M7 3 3 7 2 17l5 1v3h10v-3l5-1-1-10-4-4-5 3-5-3Z"/><path d="M12 6v15m-5-15 5 5 5-5"/>',
      vest:'<path d="m7 3-4 4v14h18V7l-4-4h-3l-2 5-2-5H7Z"/><path d="M3 12h18M3 16h18M12 9v12"/>',
      other:'<circle cx="5" cy="12" r="2"/><circle cx="12" cy="12" r="2"/><circle cx="19" cy="12" r="2"/>',
      users:'<circle cx="9" cy="8" r="3"/><path d="M2 21v-2a7 7 0 0 1 14 0v2M16 5a3 3 0 0 1 0 6m2 3a6 6 0 0 1 4 6"/>',
      image:'<rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8" cy="8" r="1"/><path d="m3 17 5-5 4 4 3-3 6 6"/>',
      note:'<path d="M5 2h10l5 5v15H5Z"/><path d="M15 2v5h5M8 12h9m-9 4h9"/>',
      upload:'<path d="M6 18H5a4 4 0 0 1-1-7.9A7 7 0 0 1 17.8 8a5 5 0 0 1 1.2 10h-1M12 21V10m-5 5 5-5 5 5"/>',
      bolt:'<path d="m13 2-9 12h7l-1 8 10-13h-7l1-7Z"/>',
      cart:'<path d="M2 3h3l3 13h11l3-10H6M9 19h.01M18 19h.01"/><circle cx="9" cy="20" r="1"/><circle cx="18" cy="20" r="1"/>',
      box:'<path d="m12 2 9 5v10l-9 5-9-5V7l9-5Zm0 10 9-5m-9 5L3 7m9 5v10M7.5 4.5l9 5"/>',
      trash:'<path d="M3 6h18M9 6V3h6v3M5 6l1 15h12l1-15M10 10v7m4-7v7"/>',
      send:'<path d="M22 2 11 13M22 2l-7 20-4-9-9-4Z"/>',
      clock:'<circle cx="12" cy="12" r="9"/><path d="M12 7v5l4 2"/>',
      check:'<path d="m5 12 5 5 9-10"/>',
      back:'<path d="m15 18-6-6 6-6m-6 6h12"/>',
      edit:'<path d="m15 5 4 4M4 20l5-.8L20 8a2.8 2.8 0 0 0-4-4L5 15Z"/>'
    };
    return start + (drawings[name]||drawings.note) + '</svg>';
  }
  function svgMark(name, sz) { return '<span class="buk-pc-icon">' + icon(name,sz||28) + '</span>'; }
  function isSignedIn() {
    if (chat) return chat.isSignedIn();
    try {
      if(window.BrandedAccountPanel && typeof window.BrandedAccountPanel.isSignedIn === 'function') return !!window.BrandedAccountPanel.isSignedIn();
      if(window.BrandedAccount && typeof window.BrandedAccount.token === 'function') return !!window.BrandedAccount.token();
      return !!(localStorage.getItem('authToken') || localStorage.getItem('coAuthToken'));
    } catch(e){ return false; }
  }
  function cookieAllowed() {
    try {
      if (window.BrandedCrispConsent && typeof window.BrandedCrispConsent.allowed === 'function') return !!window.BrandedCrispConsent.allowed();
      var consent=window.BrandedCookieConsent;
      return !!(consent && typeof consent.get==='function' && consent.get() && consent.get().analytics);
    } catch(e) { return false; }
  }
  function crispReady() {
    if(chat) return chat.isReady();
    try { return !!(window.$crisp && typeof window.$crisp.is==='function'); } catch(e){return false;}
  }
  function hasSent() {
    try { return sessionStorage.getItem(SENT)==='1'; } catch(e){return false;}
  }
  function setStatus(msg) {
    var status = root && root.querySelector('#bukPcStatus');
    if(!status && root) {
      status=el('p','buk-pc-status');status.id='bukPcStatus';status.setAttribute('role','status');
      root.querySelector('.buk-pc-inner').appendChild(status);
    }
    if(status) status.textContent=msg||'';
  }
  function title(title, subtitle, kind) {
    return '<div class="buk-pc-section-title">'+svgMark(kind,29)+'<div><h3>'+escapeText(title).replace(/\n/g,'<br>')+'</h3><p>'+escapeText(subtitle)+'</p></div></div>';
  }
  function stepper() {
    var a = '<div class="buk-pc-steps" aria-label="Step '+state.step+' of 5">';
    for(var i=1;i<=5;i++) {
      var cls = i<state.step ? ' done' : (i===state.step ? ' current' : '');
      a+='<span class="buk-pc-step'+cls+'" aria-label="'+(i<state.step?'Completed step '+i:'Step '+i)+'">'+(i<state.step?'✓':i)+'</span>';
      if(i<5) a+='<span class="buk-pc-step-line"></span>';
    }
    return a+'</div>';
  }
  function nav(showBack, nextText, enabled) {
    return '<div class="buk-pc-nav">'+(showBack?'<button type="button" class="buk-pc-back" data-pc="back">'+icon('back',16)+' Back</button>':'<span></span>')+
      '<button type="button" class="buk-pc-main buk-pc-next" data-pc="next" '+(!enabled?'disabled':'')+'>'+escapeText(nextText)+' <span aria-hidden="true">→</span></button></div>';
  }
  function stepOne(){
    return '<div class="buk-pc-intro">'+
      '<div class="buk-pc-intro-text"><span class="buk-pc-eyebrow">QUICK ENQUIRY</span><h2>Tell us about<br>your order</h2>'+
      '<ul><li>Garment &amp; quantity</li><li>Your logo</li><li>Fast, accurate quote</li></ul>'+
      '<p class="buk-pc-time">'+icon('clock',16)+' Takes less than 1 minute</p></div>'+
      referencePhoto([193,207,155,272],'buk-pc-hero')+'</div>'+
      '<button type="button" class="buk-pc-main buk-pc-start" data-pc="next">Let\'s get started '+icon('back',19).replace('m15 18-6-6 6-6m-6 6h12','m9 6 6 6-6 6M3 12h12')+'</button>';
  }
  function stepTwo() {
    var cards=ITEMS.map(function(p){
      var selected=state.items.indexOf(p.id)>=0;
      return '<button type="button" class="buk-pc-item'+(selected?' selected':'')+'" data-item="'+p.id+'" aria-pressed="'+selected+'">'+
        '<span class="buk-pc-product">'+(p.photo?referencePhoto(p.photo,'buk-pc-product-photo'):icon('other',28))+'</span><span class="buk-pc-item-label">'+(p.id==='other'?'Other /<br>Not listed':escapeText(p.label))+'</span><span class="buk-pc-check">'+(selected?'✓':'')+'</span></button>';
    }).join('');
    return title('What type of garments\ndo you need?','Select one or more options.','tshirt')+'<div class="buk-pc-products">'+cards+'</div>'+nav(true,'Next',state.items.length>0);
  }
  function stepThree() {
    var rows=QUANTITIES.map(function(q){var selected=state.quantity===q;return '<button type="button" class="buk-pc-qty'+(selected?' selected':'')+'" data-qty="'+escapeText(q)+'" aria-pressed="'+selected+'"><strong>'+escapeText(q).replace('–',' – ')+'</strong><span class="buk-pc-radio"></span></button>';}).join('');
    return title('How many items\ndo you need?','Choose the closest range.','users')+'<div class="buk-pc-qty-list">'+rows+'</div>'+nav(true,'Next',!!state.quantity);
  }
  function stepFour() {
    var size=file ? (file.size/1048576).toFixed(1)+' MB' : '';
    var uploaded=state.logoName ? '<div class="buk-pc-file"><span class="buk-pc-file-icon">'+(state.logoPreview?'<img src="'+escapeText(state.logoPreview)+'" alt="Selected logo">':icon('image',30))+'</span><span class="buk-pc-file-copy"><strong>'+escapeText(state.logoName)+'</strong><small>'+(state.logoMissingAfterNavigation?'Please reselect the file after signing in':size)+'</small></span><span class="buk-pc-file-ok">'+(file?'✓':'!')+'</span><button type="button" data-pc="remove-file" aria-label="Remove selected logo">'+icon('trash',19)+'</button></div>' : '';
    return title('Do you already have\nyour logo?','Upload your logo so we can give you an accurate quote.','image')+
      '<label class="buk-pc-upload" for="bukPcFile"><span>'+icon('upload',48)+'</span><strong>Upload your logo</strong><small>Drag &amp; drop a file here or tap to browse</small><div class="buk-pc-filetypes"><i>PNG</i><i>JPG</i><i>PDF</i><i>AI</i><i>EPS</i></div></label>'+
      '<input type="file" id="bukPcFile" class="buk-pc-file-input" aria-label="Upload your logo (maximum 10 MB)" accept=".png,.jpg,.jpeg,.pdf,.ai,.eps,.svg">'+uploaded+
      '<button type="button" class="buk-pc-skip'+(state.logoName?' buk-pc-sr-only':'')+'" data-pc="logo-skip">I\'ll send my logo later</button>'+nav(true,'Next',!state.logoName||!!file);
  }
  function itemLabels() {
    return state.items.map(function(id){var x=ITEMS.find(function(i){return i.id===id;});return x?x.label:id;}).join(', ');
  }
  function canPreview(f) {
    var type = String(f && f.type || '').toLowerCase();
    if (['image/png','image/jpeg','image/jpg','image/gif','image/webp','image/svg+xml','image/pjpeg','image/x-png'].indexOf(type) >= 0) return true;
    if (type && type !== 'application/octet-stream') return false;
    return /\.(png|jpe?g|gif|webp|svg)$/i.test(String(f && f.name || ''));
  }
  function safePreview(url) {
    var value = String(url || '');
    if (/^blob:[A-Za-z0-9.+_-]+:\/[^\s"'<>]+$/.test(value) || /^blob:[A-Za-z0-9.+_-]+$/.test(value)) return value;
    if (/^data:image\/(?:png|jpe?g|gif|webp|svg\+xml);base64,[a-z0-9+/=\s]+$/i.test(value)) return value.replace(/\s/g, '');
    return '';
  }
  function revokePreview() {
    if (state.logoPreview && /^blob:/.test(state.logoPreview) && window.URL && typeof URL.revokeObjectURL === 'function') {
      try { URL.revokeObjectURL(state.logoPreview); } catch (e) {}
    }
  }
  function rememberPreview(f) {
    revokePreview();
    state.logoPreview = '';
    if (!canPreview(f)) return;
    try {
      if (window.URL && typeof URL.createObjectURL === 'function') {
        state.logoPreview = URL.createObjectURL(f);
        return;
      }
    } catch (e) {}
    if (!window.FileReader) return;
    var reader = new FileReader();
    reader.onload = function () {
      if (file !== f || sending) return;
      var url = safePreview(reader.result);
      if (!url) return;
      state.logoPreview = url;
      if (root && (root.querySelector('.buk-pc-summary') || root.querySelector('.buk-pc-file'))) render();
    };
    try { reader.readAsDataURL(f); } catch (e) {}
  }
  function bindPreviewErrors(scope) {
    if (!scope) return;
    scope.querySelectorAll('img.buk-pc-summary-logo').forEach(function (img) {
      img.addEventListener('error', function () { if (img.parentNode) img.remove(); });
    });
  }
  function summaryCard(opts) {
    opts = opts || {};
    var preview = safePreview(state.logoPreview);
    var name = state.logoName || 'Will send later';
    var image = preview ? '<img class="buk-pc-summary-logo" src="'+escapeText(preview)+'" alt="Selected logo preview">' : '';
    var note = opts.note ? '<small class="buk-pc-summary-logo-note">'+escapeText(opts.note)+'</small>' : '';
    var edit = opts.edit ? '<button type="button" data-pc="edit">Edit '+icon('edit',14)+'</button>' : '';
    return '<div class="buk-pc-summary"><div class="buk-pc-summary-head"><strong><span>✓</span> Your enquiry summary</strong>'+edit+'</div>'+
      '<div class="buk-pc-summary-row">'+icon('tshirt',18)+' <span>Garments:</span><b>'+escapeText(itemLabels()||'Not specified')+'</b></div>'+
      '<div class="buk-pc-summary-row">'+icon('users',18)+' <span>Quantity:</span><b>'+escapeText(state.quantity||'Not specified').replace('–',' – ')+'</b></div>'+
      '<div class="buk-pc-summary-row buk-pc-summary-row--logo">'+icon('image',18)+' <span>Logo:</span><b>'+image+'<span class="buk-pc-summary-logo-name">'+escapeText(name)+'</span>'+note+'</b></div></div>';
  }
  function enquiryChatHtml(note) {
    var follow = '';
    if (state.notes) follow += '<p class="buk-pc-summary-follow">'+escapeText(state.notes)+'</p>';
    follow += '<p class="buk-pc-summary-follow">Please connect me with a human operator.</p>';
    return summaryCard({note: note || ''}) + follow;
  }
  function stepFive() {
    return title('Anything else we should know?','Add any extra details like colours, sizes, positions (e.g. left chest, large back), or a deadline.','note')+
      '<div class="buk-pc-notebox"><textarea id="bukPcNotes" aria-label="Additional details" maxlength="500" rows="3" placeholder="e.g. Colours, sizes, logo position,\ndeadline, or any special requirements..."></textarea><small><span id="bukPcCount">'+state.notes.length+'</span> / 500</small></div>'+
      summaryCard({edit:true,note:state.logoPendingNote||''})+
      '<p id="bukPcStatus" class="buk-pc-status" role="status" aria-live="polite"></p>'+
      '<button type="button" class="buk-pc-main buk-pc-submit" data-pc="submit">'+icon('send',18)+' Send to our team</button>';
  }
  function stepSupport() {
    return title('How can we help?','Existing order or general question — no questionnaire required.','note')+
      '<div class="buk-pc-support-fields"><label for="bukPcOrder">Order number (optional)</label><input id="bukPcOrder" type="text" maxlength="80" placeholder="e.g. BUK-12345" value="'+escapeText(state.orderRef||'')+'">'+
      '<label for="bukPcSupportNotes">Your message</label><textarea id="bukPcSupportNotes" rows="4" maxlength="500" placeholder="Tell us what you need...">'+escapeText(state.notes||'')+'</textarea></div>'+
      '<p id="bukPcStatus" class="buk-pc-status" role="status"></p>'+
      '<button type="button" class="buk-pc-main buk-pc-submit" data-pc="submit">Connect to our team →</button>'+
      '<button type="button" class="buk-pc-back-small" data-pc="start-over">← Back</button>';
  }
  function stepAuth() {
    var auth=!isSignedIn(), consent=!cookieAllowed();
    return '<div class="buk-pc-permission">'+svgMark(auth?'users':'note',36)+'<h2>'+(auth?'One last step':'Connect your chat')+'</h2><p>'+
      (auth?'Sign in with Google to send your enquiry to our team. Your answers are saved.':'Please allow the chat cookies to connect with our operator.')+'</p>'+
      (auth?'<button type="button" class="buk-pc-main" data-pc="google">Continue with Google →</button>':'')+
      (consent?'<button type="button" class="buk-pc-outline" data-pc="cookies">Open cookie settings</button>':'')+
      '<button type="button" class="buk-pc-link" data-pc="edit">Edit enquiry</button><p class="buk-pc-status" id="bukPcStatus" role="status"></p></div>';
  }
  function stepDone() {
    var waves='<svg class="buk-pc-waves" viewBox="716 792 340 506" preserveAspectRatio="none" aria-hidden="true"><defs><clipPath id="bukPcWaves"><rect x="716" y="892" width="93" height="126"/><rect x="994" y="1090" width="62" height="36"/><rect x="914" y="1218" width="142" height="80"/></clipPath></defs><image href="'+escapeText(REFERENCE)+'" width="1069" height="1472" clip-path="url(#bukPcWaves)"/></svg>';
    return '<div class="buk-pc-finish">'+waves+referencePhoto([803,817,187,153],'buk-pc-team-photo')+'<h2>Thanks! <span>✓</span></h2><h3>Connecting you to our team...</h3><p>We\'ve got your details and a member<br>of our team will be with you shortly.</p><div class="buk-pc-benefits"><span>'+icon('bolt',26)+'<small>Fast quotes</small></span><span>'+icon('cart',26)+'<small>Product advice</small></span><span>'+icon('tshirt',26)+'<small>Order support</small></span></div><button type="button" class="buk-pc-sr-only" data-pc="open-chat">Open live conversation</button></div>';
  }
  function render() {
    if(!root) return;
    popup.dataset.prechatStep=state.stage==='collect'?String(state.step):state.stage;
    var content=el('div','buk-pc-inner');
    if(state.stage==='auth') {
      content.innerHTML=stepAuth();
    } else if (state.stage==='support') {
      content.innerHTML=stepSupport();
    } else if (state.stage==='done') {
      content.innerHTML=stepDone();
    } else {
      content.innerHTML=stepper() + '<div class="buk-pc-step-content">'+
        (state.step===1?stepOne():state.step===2?stepTwo():state.step===3?stepThree():state.step===4?stepFour():stepFive())+'</div>';
    }
    root.replaceChildren(content);
    root.setAttribute('aria-busy','false');
    var heading=root.querySelector('h2,h3');
    if(heading)heading.tabIndex=-1;
    if(state.stage==='support') {
      var order=root.querySelector('#bukPcOrder');var msg=root.querySelector('#bukPcSupportNotes');
      if(order)order.addEventListener('input',function(){state.orderRef=order.value;save();});
      if(msg)msg.addEventListener('input',function(){state.notes=msg.value;save();});
    }
    if(state.stage==='collect' && state.step===5) {
      var textarea=root.querySelector('#bukPcNotes');
      if(textarea) {
        textarea.value=state.notes;
        textarea.addEventListener('input',function(){ state.notes=textarea.value;save();root.querySelector('#bukPcCount').textContent=state.notes.length;});
      }
    }
    if(state.stage==='collect' && state.step===4) {
      var input=root.querySelector('#bukPcFile');
      if(input)input.addEventListener('change',handleFile);
      var drop=root.querySelector('.buk-pc-upload');
      if(drop){
        drop.addEventListener('dragover',function(ev){ev.preventDefault();drop.classList.add('dragging');});
        drop.addEventListener('dragleave',function(){drop.classList.remove('dragging');});
        drop.addEventListener('drop',function(ev){ev.preventDefault();drop.classList.remove('dragging');if(ev.dataTransfer.files&&ev.dataTransfer.files[0])acceptFile(ev.dataTransfer.files[0]);});
      }
    }
    if(panel) panel.scrollTop=0;
    bindPreviewErrors(root);
    save();
  }
  function handleFile(e){var f=e.target.files && e.target.files[0];if(f)acceptFile(f);}
  function acceptFile(f){
    var ext=String(f.name||'').split('.').pop().toLowerCase();
    if(ALLOWED.indexOf(ext)<0){setStatus('Please select PNG, JPG, PDF, AI, EPS or SVG.');return;}
    if(!f.size || f.size>MAX_FILE){setStatus('Select a non-empty file up to 10 MB.');return;}
    attachment=null;
    state.logoPendingNote='';
    file=f;state.logoName=f.name;state.logoType=f.type||'application/octet-stream';state.logoMissingAfterNavigation=false;
    rememberPreview(f);
    render();
  }
  function clearFile(){
    revokePreview();
    attachment=null;file=null;state.logoName='';state.logoType='';state.logoPreview='';state.logoPendingNote='';state.logoMissingAfterNavigation=false;
  }
  function next() {
    if(state.step===2 && !state.items.length)return;
    if(state.step===3 && !state.quantity)return;
    if(state.step===4 && state.logoName && !file)return;
    if(state.step<5){state.step++;render();}
  }
  function back() {
    if(state.stage==='auth'){state.stage=state.fastTrack?'support':'collect';if(!state.fastTrack)state.step=5;render();return;}
    if(state.step>1){state.step--;render();}
  }
  function startGoogle() {
    save();
    try{
      var u=new URL(location.href);u.searchParams.delete('token');u.searchParams.delete('error');localStorage.setItem('authReturnTo',u.toString());
    }catch(e){}
    if(window.BrandedAccountPanel && typeof window.BrandedAccountPanel.startGoogle==='function') window.BrandedAccountPanel.startGoogle();
    else {
      var base = window.BrandedAccount && typeof window.BrandedAccount.apiBaseUrl==='function' ? window.BrandedAccount.apiBaseUrl() : (window.API_BASE_URL || 'https://api.brandeduk.com');
      location.href=String(base).replace(/\/+$/,'')+'/auth/google';
    }
  }
  function openCookies(){
    var consent=window.BrandedCookieConsent;
    if(consent && typeof consent.open==='function') consent.open();
    else setStatus('Cookie settings are not available. Try again or contact us by email.');
  }
  function logoLine(){
    if(!state.logoName) return 'Will send later';
    if(attachment && attachment.status==='uploaded') return state.logoName+' (uploaded)';
    if(attachment && attachment.status==='local') return state.logoName+' (selected on this device; will be sent later)';
    return state.logoName+(file?' (upload pending)':' (reselect after login)');
  }
  function makeSummary(){
    if(state.fastTrack)return 'CUSTOMER SUPPORT — BRANDED UK\nOrder number: '+(state.orderRef||'Not provided')+'\nMessage: '+(state.notes||'Please connect me with an operator.')+'\nRequested: Human operator.';
    return 'NEW ENQUIRY — BRANDED UK\n'+
      'Garments: '+(itemLabels()||'Not specified')+'\n'+
      'Quantity: '+(state.quantity||'Not specified')+'\n'+
      'Logo: '+logoLine()+'\n'+
      'Additional details: '+(state.notes||'None provided')+'\n'+
      'Request: Please connect me with a human operator.';
  }
  function releaseNativeChat(){
    state.stage='sent';save();
    if(popup){popup.classList.remove('buk-prechat-collect');popup.classList.add('buk-prechat-conversation');}
    if(root)root.hidden=true;
    if(chat) chat.setCollecting(false);
    var composer = document.getElementById('waComposer');
    if(composer && isSignedIn()){ composer.removeAttribute('hidden');composer.setAttribute('aria-hidden','false'); }
    var box=document.getElementById('waChatBody');
    if(box)box.scrollTop=box.scrollHeight;
  }
  function addLocalSummary(payload){
    if(chat) {chat.showEnquiry(payload);bindPreviewErrors(document.getElementById('waChatBody'));return;}
    var box=document.getElementById('waChatBody');if(!box)return;
    var wrap=el('div','wa-msg wa-msg--user buk-pc-native-summary');
    var bubble=el('div','wa-msg__bubble');
    if(payload && typeof payload==='object' && payload.html) bubble.innerHTML=payload.html;
    else bubble.textContent=typeof payload==='string'?payload:(payload&&payload.text)||'';
    wrap.appendChild(bubble);box.appendChild(wrap);bindPreviewErrors(wrap);box.scrollTop=box.scrollHeight;
  }
  async function uploadLogoIfPossible(){
    if(!file) return {status:'none'};
    if(attachment && attachment.expiresAt>Date.now()+60000) return attachment;
    // Authenticated signing endpoint. Artwork stays private; the operator gets
    // a time-limited download link in the same confirmed enquiry message.
    var bearer='';try{bearer=window.BrandedAccount&&typeof window.BrandedAccount.token==='function'?window.BrandedAccount.token():(localStorage.getItem('authToken')||localStorage.getItem('coAuthToken')||'');}catch(e){}
    var headers={'Content-Type':'application/json'};if(bearer)headers.Authorization='Bearer '+bearer;
    var response=await fetch('/api/prechat-upload',{method:'POST',headers:headers,body:JSON.stringify({name:file.name,size:file.size,type:file.type}),credentials:'same-origin',signal:AbortSignal.timeout(20000)});
    var data=await response.json().catch(function(){return {};});
    if(!response.ok||!data.success)throw new Error(data.error||'Artwork upload is unavailable. Please try again or choose “I’ll send it later”.');
    if(!data.upload||!/^https:\/\//.test(data.upload.url)||!/^https:\/\//.test(data.url))throw new Error('Invalid artwork upload response.');
    var fd=new FormData();
    Object.keys(data.upload.fields).forEach(function(key){fd.append(key,data.upload.fields[key]);});
    fd.append('file',file);
    var uploaded=await fetch(data.upload.url,{method:'POST',body:fd,signal:AbortSignal.timeout(60000)});
    if(!uploaded.ok)throw new Error('Your logo was not uploaded. Try again, or go Back and choose “I’ll send it later”.');
    attachment={status:'uploaded',url:data.url,name:file.name,expiresAt:data.expiresAt};
    return attachment;
  }
  function writeCrispData(){
    window.$crisp.push(['set','session:data',[ [
      ['enquiry_type',state.fastTrack?'customer_support':'new_quote'],
      ['prechat_garments',state.fastTrack?'':itemLabels()],
      ['prechat_order_number',state.orderRef||''],
      ['prechat_quantity',state.quantity],
      ['prechat_logo',state.logoName||'to_follow'],
      ['prechat_notes',state.notes||'']
    ] ]]);
  }
  async function submit(){
    if(sending)return;
    if(!state.fastTrack && (!state.items.length||!state.quantity)) {state.stage='collect';state.step=!state.items.length?2:3;render();return;}
    if(!state.fastTrack && state.logoName && !file) {state.stage='collect';state.step=4;render();setStatus('Please reselect your logo, or choose “I’ll send it later”.');return;}
    if(!isSignedIn()){state.stage='auth';render();return;}
    if(!cookieAllowed()){state.stage='auth';render();return;}
    if(!crispReady()){setStatus('Connecting to live support. Please check your connection and try again.');return;}
    if(hasSent()){state.stage='done';render();return;}
    sending=true;
    root.inert=true;root.setAttribute('aria-busy','true');
    var btn=root.querySelector('[data-pc="submit"]');if(btn){btn.disabled=true;btn.textContent='Sending enquiry...';}
    setStatus('Sending your details securely to our team...');
    try{
      var uploaded={status:'none'};
      state.logoPendingNote='';
      if(!state.fastTrack && file){
        try { uploaded=await uploadLogoIfPossible(); }
        catch(uploadError){
          uploaded={status:'local',name:file.name};
          state.logoPendingNote='This logo will be sent later.';
        }
        attachment=uploaded;
      }
      writeCrispData();
      var summary=makeSummary();
      var message=summary;
      if(uploaded.status==='uploaded') message+='\nArtwork download (private link, valid 7 days): '+uploaded.url;
      if(uploaded.status==='local') message+='\nArtwork note: the file is still on the customer\'s device and was not uploaded.';
      await chat.sendConfirmed(message);
      state.summary=summary;
      addLocalSummary(state.fastTrack ? summary : {text:summary, html:enquiryChatHtml(state.logoPendingNote)});
      state.handoffAck=true;state.stage='done';try{sessionStorage.setItem(SENT,'1');}catch(e){}
      render();
      window.setTimeout(function(){if(state.stage==='done')releaseNativeChat();},4200);
    }catch(err){
      var message=err.message||'The enquiry was not confirmed as delivered. Please try again.';
      if(state.logoPendingNote) render();
      setStatus(message);
      if(!root.querySelector('[data-pc="back"]')) root.querySelector('#bukPcStatus').insertAdjacentHTML('afterend','<button type="button" class="buk-pc-back-small" data-pc="back">← Back</button>');
      var b=root.querySelector('[data-pc="submit"]');if(b){b.disabled=false;b.textContent='Try sending again';}
    }finally{sending=false;root.inert=false;root.setAttribute('aria-busy','false');}
  }
  function onClick(event){
    if(sending)return;
    var action=event.target.closest('[data-pc]');
    if(action){
      var a=action.getAttribute('data-pc');
      if((state.stage==='sent'||state.stage==='done') && ['fast-track','quote-support','quick-replies'].indexOf(a)>=0){
        if(state.stage==='done')releaseNativeChat();
        var input=document.getElementById('waChatInput');
        if(input){input.value=a==='fast-track'?'I need help with my order.':a==='quote-support'?'I need help with a quote.':'';input.focus();}
        return;
      }
      if(a==='next')next();
      else if(a==='back')back();
      else if(a==='start-over'){state.stage='collect';state.step=1;state.fastTrack=false;render();}
      else if(a==='fast-track'){state.fastTrack=true;state.stage='support';render();}
      else if(a==='quote-support'){state.fastTrack=false;state.stage='collect';state.step=1;render();}
      else if(a==='quick-replies'){
        var menu=popup.querySelector('.buk-pc-quick-menu');
        if(menu){menu.remove();return;}
        menu=el('div','buk-pc-quick-menu');
        ['Delivery times','Logo setup','Minimum order'].forEach(function(label){menu.appendChild(button(label,'',function(){state.fastTrack=true;state.stage='support';state.notes=label;menu.remove();render();}));});
        var footer=popup.querySelector('.buk-pc-footer');
        if(footer) footer.insertAdjacentElement('beforebegin',menu);
      }
      else if(a==='edit'){state.stage=state.fastTrack?'support':'collect';if(!state.fastTrack)state.step=2;render();}
      else if(a==='submit')submit();
      else if(a==='google')startGoogle();
      else if(a==='cookies')openCookies();
      else if(a==='open-chat')releaseNativeChat();
      else if(a==='logo-skip'){clearFile();next();}
      else if(a==='remove-file'){clearFile();render();}
      return;
    }
    var item=event.target.closest('[data-item]');
    if(item){var id=item.getAttribute('data-item'),idx=state.items.indexOf(id);if(idx>=0)state.items.splice(idx,1);else state.items.push(id);render();return;}
    var qty=event.target.closest('[data-qty]');
    if(qty){state.quantity=qty.getAttribute('data-qty');render();return;}
  }
  function onResume(){
    if(!root || state.stage==='sent'||sending)return;
    if(state.stage==='auth' && isSignedIn() && cookieAllowed()){
      state.stage=state.fastTrack?'support':'collect';
      if(!state.fastTrack)state.step=state.logoName&&!file?4:5;
      render();
      if(window.openBrandedChat)window.openBrandedChat();
      return;
    }
    if(state.stage==='auth') render();
  }
  function mount(){
    if(live)return true;
    popup=document.getElementById('waPopup');
    if(!popup || !popup.querySelector('.wa-popup__card'))return false;
    var card=popup.querySelector('.wa-popup__card');
    fromStore();
    var brand=card.querySelector('.wa-popup__brand');
    brand.classList.add('buk-pc-brand');
    brand.setAttribute('aria-label','Branded UK');
    brand.innerHTML=headerLogoMarkup();
    if (popup.classList.contains('is-active')) replayChatLogo();
    if(hasSent()) {
      state.stage='sent';live=true;
      chat.setCollecting(false);
      if(state.summary && isSignedIn())addLocalSummary(state.summary);
      return true;
    }
    var welcome=el('div','wa-popup__welcome buk-pc-welcome');
    welcome.innerHTML=referencePhoto([34,78,94,44],'buk-pc-welcome-photo')+'<div class="wa-popup__welcome-copy"><h3>Hi, welcome to Branded.</h3><p>Let’s get a few details so we can<br>help you faster.</p></div>';
    card.querySelector('.wa-popup__topbar').insertAdjacentElement('afterend',welcome);
    root=el('section','buk-pc-root');root.id='bukPrechat';root.setAttribute('aria-label','Quick enquiry questionnaire');
    welcome.insertAdjacentElement('afterend',root);
    panel=root;
    popup.classList.add('buk-prechat-collect');
    chat.setCollecting(true);
    root.addEventListener('click',onClick);
    render();live=true;
    if(state.stage==='auth')onResume();
    window.dispatchEvent(new CustomEvent('branded:prechat-ready'));
    return true;
  }
  if(!mount()){
    var observer=new MutationObserver(function(){if(mount())observer.disconnect();});
    observer.observe(document.documentElement,{childList:true,subtree:true});
    setTimeout(function(){observer.disconnect();},20000);
  }
  window.addEventListener('branded:chat-opened', replayChatLogo);
  window.addEventListener('branded:auth-changed',onResume);
  window.addEventListener('brandeduk:consent',onResume);
  window.addEventListener('pageshow',onResume);
  window.addEventListener('storage',onResume);
})();
