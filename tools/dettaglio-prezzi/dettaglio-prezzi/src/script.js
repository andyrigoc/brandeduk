document.addEventListener("DOMContentLoaded",()=>{
    const vals=document.querySelectorAll(".grand,.inclvat,.value");
    vals.forEach(el=>{
        el.style.opacity=0;
        setTimeout(()=>{
            el.style.transition="0.5s";
            el.style.opacity=1;
        },200);
    });
});
