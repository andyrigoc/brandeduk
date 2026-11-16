const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {JSDOM}=require('jsdom');
const repo=path.resolve(__dirname,'..');

function setup({signedIn=true,consent=true,ack=true,draft=null,sent=false,uploadFailure=false}={}){
    const dom=new JSDOM('<!doctype html><head></head><body></body>',{url:'https://www.brandeduk.com/index-mobile.html',runScripts:'outside-only',pretendToBeVisual:true});
    const w=dom.window;
    const env={w,dom,signedIn,consent,ack,messages:[],hooks:{},uploads:0};
    w.__brandedCrispLoaded=true;
    w.BrandedAccountPanel={isSignedIn:()=>env.signedIn};
    w.BrandedCrispConsent={allowed:()=>env.consent};
    w.localStorage.setItem('authToken','test-only');
    if(draft)w.sessionStorage.setItem('buk_prechat_draft_v3',JSON.stringify(draft));
    if(sent)w.sessionStorage.setItem('buk_prechat_sent_v3','1');
    w.$crisp=[];w.$crisp.is=()=>true;
    const schedule=w.setTimeout.bind(w);
    w.setTimeout=(fn,ms,...args)=>schedule(fn,ms===14000?30:ms,...args);
    w.$crisp.push=command=>{
        if(command[0]==='on')(env.hooks[command[1]]||=([])).push(command[2]);
        if(command[0]==='do'&&command[1]==='message:send'){
            env.messages.push(command[2][1]);
            if(env.ack)schedule(()=>env.emit('message:sent',{type:'text',content:command[2][1]}),2);
        }
    };
    env.emit=(event,data)=>(env.hooks[event]||[]).forEach(fn=>fn(data));
    w.fetch=async url=>{
        env.uploads++;
        if(uploadFailure)return {ok:false,json:async()=>({error:'Artwork upload unavailable'})};
        return url==='/api/prechat-upload'?{ok:true,json:async()=>({success:true,upload:{url:'https://uploads.example.test/object',fields:{key:'test'}},url:'https://uploads.example.test/private?signature=test',expiresAt:Date.now()+86400000})}:{ok:true};
    };
    ['whatsapp.js','prechat.js'].forEach(file=>{
        Object.defineProperty(w.document,'currentScript',{configurable:true,value:{src:'https://www.brandeduk.com/mobile/js/'+file}});
        w.eval(fs.readFileSync(path.join(repo,'mobile/js',file),'utf8'));
    });
    env.q=selector=>w.document.querySelector(selector);
    env.click=selector=>{const node=env.q(selector);assert.ok(node,'Missing '+selector);node.click();};
    env.next=()=>env.click('[data-pc="next"]');
    env.toLogo=()=>{env.next();env.click('[data-item="polos"]');env.click('[data-item="hoodies"]');env.next();env.click('[data-qty="26–50 items"]');env.next();};
    env.toReview=()=>{env.toLogo();env.click('[data-pc="logo-skip"]');};
    env.selectFile=file=>{const input=env.q('#bukPcFile');Object.defineProperty(input,'files',{configurable:true,value:[file]});input.dispatchEvent(new w.Event('change'));};
    env.flush=()=>new Promise(resolve=>setTimeout(resolve,60));
    return env;
}

test('requires garments/quantity, gates authentication and consent, confirms once then uses native replies',async t=>{
    const e=setup({signedIn:false,consent:false});t.after(()=>e.dom.window.close());
    assert.equal(e.q('#waChatInput').disabled,true);
    e.next();assert.equal(e.q('[data-pc="next"]').disabled,true);
    e.click('[data-item="polos"]');e.next();assert.equal(e.q('[data-pc="next"]').disabled,true);
    e.click('[data-qty="11–25 items"]');e.next();e.click('[data-pc="logo-skip"]');e.click('[data-pc="submit"]');
    assert.ok(e.q('[data-pc="google"]'));assert.equal(e.messages.length,0);
    e.signedIn=true;e.w.dispatchEvent(new e.w.Event('branded:auth-changed'));
    assert.ok(e.q('[data-pc="cookies"]'));assert.equal(e.messages.length,0);
    e.consent=true;e.w.dispatchEvent(new e.w.Event('brandeduk:consent'));
    assert.ok(e.q('[data-pc="submit"]'));assert.equal(e.messages.length,0,'Auth resumption must not submit automatically');
    e.click('[data-pc="submit"]');e.click('[data-pc="submit"]');await e.flush();
    assert.equal(e.messages.length,1);assert.match(e.messages[0],/Garments: Polos\nQuantity: 11–25 items/);
    assert.ok(e.q('[data-pc="open-chat"]'));assert.equal(e.hooks['message:sent'].length,1);
    e.click('[data-pc="open-chat"]');assert.equal(e.q('#waChatInput').disabled,false);
    e.emit('message:received',{type:'text',content:'Operator reply'});
    assert.match(e.q('#waChatBody').textContent,/Operator reply/);
});

test('logo validation, upload and private link are included in the one acknowledged enquiry',async t=>{
    const e=setup();t.after(()=>e.dom.window.close());e.toLogo();
    e.selectFile(new e.w.File(['x'],'bad.exe'));assert.match(e.q('#bukPcStatus').textContent,/Please select/);
    e.selectFile({name:'large.png',size:10*1024*1024+1,type:'image/png'});assert.match(e.q('#bukPcStatus').textContent,/10 MB/);
    e.selectFile(new e.w.File(['artwork'],'logo.pdf',{type:'application/pdf'}));e.next();e.click('[data-pc="submit"]');await e.flush();
    assert.equal(e.uploads,2);assert.equal(e.messages.length,1);
    assert.match(e.messages[0],/logo.pdf \(uploaded\)/);assert.match(e.messages[0],/Artwork download \(private link, valid 7 days\): https:/);
    assert.ok(e.q('[data-pc="open-chat"]'));
});

test('failed upload blocks delivery; choosing send later is explicit',async t=>{
    const e=setup({uploadFailure:true});t.after(()=>e.dom.window.close());e.toLogo();
    e.selectFile(new e.w.File(['logo'],'logo.png',{type:'image/png'}));e.next();e.click('[data-pc="submit"]');await e.flush();
    assert.equal(e.messages.length,0);assert.match(e.q('#bukPcStatus').textContent,/unavailable/);
    e.click('[data-pc="back"]');e.click('[data-pc="logo-skip"]');e.click('[data-pc="submit"]');await e.flush();
    assert.equal(e.messages.length,1);assert.match(e.messages[0],/Logo: Will send later/);
});

test('missing receipt never reports success; a late receipt prevents duplicate retry',async t=>{
    const e=setup({ack:false});t.after(()=>e.dom.window.close());e.toReview();e.click('[data-pc="submit"]');await e.flush();
    assert.equal(e.messages.length,1);assert.match(e.q('#bukPcStatus').textContent,/not confirmed/);
    assert.equal(e.w.sessionStorage.getItem('buk_prechat_sent_v3'),null);
    e.emit('message:sent',{type:'text',content:e.messages[0]});
    e.click('[data-pc="submit"]');await e.flush();assert.equal(e.messages.length,1);assert.ok(e.q('[data-pc="open-chat"]'));
});

test('support bypasses questionnaire and treats customer text as text',async t=>{
    const e=setup();t.after(()=>e.dom.window.close());e.click('[data-pc="fast-track"]');
    const note=e.q('#bukPcSupportNotes');note.value='<img src=x onerror=alert(1)>';note.dispatchEvent(new e.w.Event('input'));
    e.click('[data-pc="submit"]');await e.flush();
    assert.match(e.messages[0],/^CUSTOMER SUPPORT/);assert.equal(e.q('#waChatBody img[src="x"]'),null);
});

test('draft survives reload and requires artwork reselection after login',t=>{
    const e=setup({draft:{items:['polos'],quantity:'11–25 items',step:5,stage:'auth',logoName:'logo.pdf',notes:'Saved notes'}});t.after(()=>e.dom.window.close());
    assert.ok(e.q('#bukPcFile'));assert.equal(e.q('[data-pc="next"]').disabled,true);
    assert.match(e.q('.buk-pc-file-copy').textContent,/reselect/);
    e.click('[data-pc="logo-skip"]');assert.equal(e.q('#bukPcNotes').value,'Saved notes');
    e.w.closeBrandedChat();e.w.openBrandedChat();assert.equal(e.q('#bukPcNotes').value,'Saved notes');
});

test('previously confirmed enquiry restores the native conversation without sending again',t=>{
    const e=setup({sent:true,draft:{items:['polos'],stage:'sent',summary:'Saved enquiry'}});t.after(()=>e.dom.window.close());
    assert.equal(e.q('#bukPrechat'),null);assert.equal(e.q('#waChatInput').disabled,false);
    assert.match(e.q('#waChatBody').textContent,/Saved enquiry/);assert.equal(e.messages.length,0);
    e.click('[data-pc="fast-track"]');assert.equal(e.q('#waChatInput').value,'I need help with my order.');
    e.click('[data-pc="quote-support"]');assert.equal(e.q('#waChatInput').value,'I need help with a quote.');
    assert.equal(e.messages.length,0,'Footer shortcuts must not send a message automatically');
});

test('reference photographs remain selectable and footer shortcuts preserve the enquiry without sending',t=>{
    const e=setup();t.after(()=>e.dom.window.close());e.next();
    const photos=[...e.w.document.querySelectorAll('[data-item] .buk-pc-product image')];
    assert.equal(photos.length,7,'All seven garment categories use the supplied photographs');
    assert.ok(photos.every(image=>image.getAttribute('href').endsWith('/mobile/images/prechat/reference-artwork.webp')));
    e.click('[data-item="polos"]');e.click('[data-pc="quote-support"]');e.next();
    assert.equal(e.q('[data-item="polos"]').getAttribute('aria-pressed'),'true');
    e.click('[data-pc="quick-replies"]');e.click('.buk-pc-quick-menu button');
    assert.equal(e.q('#bukPcSupportNotes').value,'Delivery times');assert.equal(e.messages.length,0);
});

test('replacing, removing or postponing a logo releases its temporary preview',t=>{
    const e=setup();t.after(()=>e.dom.window.close());e.toLogo();
    const released=[];let n=0;e.w.URL.createObjectURL=()=>`blob:local-${++n}`;e.w.URL.revokeObjectURL=url=>released.push(url);
    const file=()=>new e.w.File(['logo'],'logo.png',{type:'image/png'});
    e.selectFile(file());assert.equal(e.q('.buk-pc-file-icon img').src,'blob:local-1');
    e.selectFile(file());assert.deepEqual(released,['blob:local-1']);
    e.click('[data-pc="remove-file"]');assert.deepEqual(released,['blob:local-1','blob:local-2']);
    e.selectFile(file());e.click('[data-pc="logo-skip"]');assert.deepEqual(released,['blob:local-1','blob:local-2','blob:local-3']);
    assert.equal(e.w.sessionStorage.getItem('buk_prechat_draft_v3').includes('blob:local-'),false);
});

test('upload endpoint validates authentication and generates private bounded signed policy',async()=>{
    const {default:handler,validateArtwork}=await import('../api/prechat-upload.js');
    assert.throws(()=>validateArtwork({name:'file.exe',size:1}));
    assert.throws(()=>validateArtwork({name:'file.pdf',size:0}));
    assert.throws(()=>validateArtwork({name:'file.pdf',size:10485761}));
    const call=async req=>{const out={};const res={setHeader(){},status(code){out.status=code;return this;},json(body){out.body=body;return this;}};await handler(req,res);return out;};
    assert.equal((await call({method:'POST',headers:{},body:{name:'logo.pdf',size:10}})).status,401);
    assert.equal((await call({method:'POST',headers:{origin:'https://other.example'},body:{}})).status,403);
    const originalFetch=global.fetch;const originalKey=process.env.DO_SPACES_KEY;const originalSecret=process.env.DO_SPACES_SECRET;
    try {
        global.fetch=async()=>({ok:false});
        assert.equal((await call({method:'POST',headers:{authorization:'Bearer test'},body:{name:'logo.pdf',size:10}})).status,401);
        global.fetch=async()=>({ok:true,json:async()=>({user:{email:'test@example.invalid'}})});
        process.env.DO_SPACES_KEY='test-only';process.env.DO_SPACES_SECRET='test-only';
        const out=await call({method:'POST',headers:{authorization:'Bearer test'},body:{name:'logo.pdf',size:10}});
        assert.equal(out.status,200);assert.equal(out.body.upload.fields.acl,'private');
        const policy=JSON.parse(Buffer.from(out.body.upload.fields.Policy,'base64'));
        assert.ok(policy.conditions.some(c=>Array.isArray(c)&&c[0]==='content-length-range'&&c[1]===10&&c[2]===10));
        assert.ok(out.body.url.includes('X-Amz-Expires=604800'));
    } finally {
        global.fetch=originalFetch;
        if(originalKey===undefined)delete process.env.DO_SPACES_KEY;else process.env.DO_SPACES_KEY=originalKey;
        if(originalSecret===undefined)delete process.env.DO_SPACES_SECRET;else process.env.DO_SPACES_SECRET=originalSecret;
    }
});
