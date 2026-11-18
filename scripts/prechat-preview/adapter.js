/* Only injected by the local dev server with ?prechat-preview=1. */
(function(){
    'use strict';
    if (!['localhost','127.0.0.1','::1'].includes(location.hostname)) return;
    var handlers={};
    window.__brandedCrispLoaded=true;
    window.BrandedCrispConsent={allowed:function(){return true;}};
    window.$crisp=[];
    window.$crisp.is=function(){return true;};
    window.$crisp.push=function(command){
        if(command[0]==='on') (handlers[command[1]]||(handlers[command[1]]=[])).push(command[2]);
        if(command[0]==='do'&&command[1]==='message:send') {
            var type=command[2][0],content=command[2][1];
            setTimeout(function(){(handlers['message:sent']||[]).forEach(function(fn){fn({type:type,content:content});});},350);
            setTimeout(function(){(handlers['message:received']||[]).forEach(function(fn){fn({type:'text',content:'LOCAL TEST: your enquiry is shown here. No message or file has been sent to Branded UK.'});});},1800);
        }
        return 0;
    };
    var realFetch=window.fetch.bind(window);
    window.fetch=function(input,options){
        var url=typeof input==='string'?input:input.url;
        if(url==='/api/prechat-upload')return Promise.resolve(new Response(JSON.stringify({success:true,upload:{url:'https://prechat-upload.invalid/local-test',fields:{key:'local-test'}},url:'https://prechat-upload.invalid/selected-file',expiresAt:Date.now()+604800000}),{status:200,headers:{'Content-Type':'application/json'}}));
        if(url.startsWith('https://prechat-upload.invalid/'))return Promise.resolve(new Response(null,{status:204}));
        return realFetch(input,options);
    };
    window.addEventListener('branded:prechat-ready',function(){window.openBrandedChat();});
    window.addEventListener('message',function(event){
        if(event.origin!==location.origin||event.source!==parent)return;
        if(event.data&&event.data.type==='prechat-preview-reset'){
            sessionStorage.removeItem('buk_prechat_draft_v3');
            sessionStorage.removeItem('buk_prechat_sent_v3');
            location.reload();
        }
    });
})();
