/* Branded UK · workwear industries motion page. Native JS; DM Sans unchanged. */
const SECTORS = {
 construction: {name:'Construction',label:'BUILT FOR THE SITE',image:'assets/construction-site.jpg',description:'Practical, durable workwear for teams that need to look professional while working safely and comfortably on site.',products:['Hi-vis jackets and vests','Embroidered polos and hoodies','Softshell jackets and work trousers']},
 hospitality: {name:'Hospitality',label:'READY FOR SERVICE',image:'assets/hospitality-apron.jpg',description:'A cohesive look for cafés, restaurants, bars and front-of-house staff. Mix easy-care garments and refined details that suit your venue.',products:['Bib and waist aprons','Shirts and polos','Chefwear and branded layers']},
 sport: {name:'Sport',label:'ONE TEAM. ONE IDENTITY.',image:'assets/sport-training.jpg',description:'From grassroots clubs to coaching and leisure teams, coordinated sportswear helps everyone represent the same identity.',products:['Training tops and team T-shirts','Tracksuits and hoodies','Branded jackets and headwear']},
 cleaning: {name:'Cleaning',label:'PROFESSIONAL EVERY SHIFT',image:'assets/cleaning-workwear.jpg',description:'Comfortable workwear that helps cleaning and facilities teams look consistent across sites and client-facing jobs.',products:['Easy-care polos and T-shirts','Fleece and softshell layers','Hi-vis options and practical uniforms']}
};
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
const cards = [...document.querySelectorAll('.cards-row .card')];
const hero = document.querySelector('.hero');
const results = document.querySelector('.big-results');
const little = document.querySelector('.small-team');
const subline = document.querySelector('.subline');
const nav = document.querySelector('.nav');
const dialog = document.querySelector('#sector-dialog');
let pointerX=0,pointerY=0,currentX=0,currentY=0,scrollProgress=0,frame=0;
const moves=[[-260,-40,-25],[-200,20,-18],[-120,80,-10],[-40,120,-4],[40,120,4],[120,80,12],[200,20,22],[260,-40,28]];

cards.forEach((card,i)=>{
  card.style.setProperty('--rot',card.dataset.rot || '0');
  card.style.setProperty('--i',i);
  card.addEventListener('mousemove',e=>{
    if(reduceMotion.matches)return;
    const r=card.getBoundingClientRect();
    const x=(e.clientX-r.left)/r.width-.5, y=(e.clientY-r.top)/r.height-.5;
    card.style.setProperty('--rx',String(-y*12));
    card.style.setProperty('--ry',String(x*12));
    card.style.setProperty('--scale','1.09');
    card.style.zIndex='30';
  });
  card.addEventListener('mouseleave',()=>{
    card.style.setProperty('--rx','0');card.style.setProperty('--ry','0');card.style.setProperty('--scale','1');card.style.zIndex='';
  });
});

function pointerMove(e){const r=hero.getBoundingClientRect();pointerX=((e.clientX-r.left)/r.width-.5)*2;pointerY=((e.clientY-r.top)/r.height-.5)*2;}
hero.addEventListener('pointermove',pointerMove);
hero.addEventListener('pointerleave',()=>{pointerX=0;pointerY=0;});
function updateScroll(){const r=hero.getBoundingClientRect();scrollProgress=Math.max(0,Math.min(1,-r.top/Math.max(1,r.height)));nav.classList.toggle('is-scrolled',scrollY>30);}
window.addEventListener('scroll',updateScroll,{passive:true});updateScroll();
function tick(){
  currentX+=(pointerX-currentX)*.055;currentY+=(pointerY-currentY)*.055;
  if(!reduceMotion.matches){
    const isMobile=window.innerWidth<750;
    cards.forEach((card,i)=>{
      const d=Number(card.dataset.depth||8),m=moves[i],f=isMobile?.17:1;
      card.style.setProperty('--px',`${currentX*d}px`);
      card.style.setProperty('--py',`${currentY*d*.52}px`);
      card.style.setProperty('--sx',`${m[0]*scrollProgress*f}px`);
      card.style.setProperty('--sy',`${m[1]*scrollProgress*f}px`);
      card.style.setProperty('--srot',`${m[2]*scrollProgress*f}`);
    });
    results.style.transform=`scale(${1+.12*scrollProgress})`;
    results.style.opacity=String(1-.37*scrollProgress);
    little.style.translate=`0 ${-55*scrollProgress}px`;
    little.style.opacity=String(Math.max(0,1-1.4*scrollProgress));
    subline.style.opacity=String(Math.max(0,1-1.8*scrollProgress));
  }
  frame=requestAnimationFrame(tick);
}
if(!reduceMotion.matches)frame=requestAnimationFrame(tick);

// Subtle staggered reveal on scroll; content remains visible if JS is disabled.
if('IntersectionObserver' in window&&!reduceMotion.matches){
 const observer=new IntersectionObserver(entries=>{for(const entry of entries){if(entry.isIntersecting){entry.target.classList.add('is-visible');observer.unobserve(entry.target);}}},{threshold:.08});
 const reveal=[...document.querySelectorAll('.team-head,.t-card,.stats-inner')];
 reveal.forEach(el=>{el.classList.add('reveal');observer.observe(el);});
}else document.querySelectorAll('.reveal').forEach(el=>el.classList.add('is-visible'));

function openSector(id){
 const sector=SECTORS[id];if(!sector)return;
 document.querySelector('#sector-dialog-eyebrow').textContent=sector.label;
 document.querySelector('#sector-dialog-title').textContent=sector.name+' uniforms';
 document.querySelector('#sector-dialog-description').textContent=sector.description;
 const img=document.querySelector('#sector-dialog-image');img.src=sector.image;img.alt=sector.name+' uniform example';
 const list=document.querySelector('#sector-dialog-products');list.replaceChildren();
 for(const product of sector.products){const li=document.createElement('li');li.textContent=product;list.append(li);}
 const subject=encodeURIComponent(sector.name+' uniforms enquiry');
 document.querySelector('#sector-dialog-cta').href='mailto:info@brandeduk.com?subject='+subject;
 dialog.showModal();
}
document.querySelectorAll('[data-sector]').forEach(el=>el.addEventListener('click',()=>openSector(el.dataset.sector)));
document.querySelector('#sector-dialog-close').addEventListener('click',()=>dialog.close());
dialog.addEventListener('click',e=>{if(e.target===dialog)dialog.close();});

// Demonstration counters. Actual 2001 establishment year stays literal.
if('IntersectionObserver' in window&&!reduceMotion.matches){
 const counted=new IntersectionObserver((entries,observer)=>{
  for(const entry of entries){if(!entry.isIntersecting)continue;
   const span=entry.target.querySelector('span');const target=Number(entry.target.dataset.count);
   const start=performance.now(),duration=1000;
   function animate(now){const progress=Math.min(1,(now-start)/duration);const eased=1-Math.pow(1-progress,3);span.textContent=String(Math.round(target*eased));if(progress<1)requestAnimationFrame(animate);}
   requestAnimationFrame(animate);observer.unobserve(entry.target);
  }
 },{threshold:.6});
 document.querySelectorAll('.stat-block .num[data-count]').forEach(el=>counted.observe(el));
}
window.addEventListener('pagehide',()=>cancelAnimationFrame(frame));
