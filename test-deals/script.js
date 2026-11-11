/* Branded UK · workwear industries motion page. Native JS; DM Sans unchanged. */
const DEALS = {
  construction: {
    code: '01',
    sector: 'Construction',
    tagline: 'Ready for every shift.',
    description: 'Hard-wearing uniform systems for site teams.',
    perk: 'Free logo & setup',
    banner: 'assets/construction-deal-01-banner.jpg',
    bannerAlt: 'Site team wearing a navy hoodie, a charcoal softshell and a hi-vis jacket',
    items: [
      { qty: 3, name: 'Navy hoodies', image: 'assets/deals/construction/navy-hoodie.jpg' },
      { qty: 2, name: 'Charcoal softshells', image: 'assets/deals/construction/charcoal-softshell.jpg' },
      { qty: 1, name: 'Hi-vis jacket', image: 'assets/deals/construction/hivis-jacket.jpg' },
      { qty: 2, name: 'Hi-vis vests', image: 'assets/deals/construction/hivis-vest.jpg' },
      { qty: 3, name: 'Work trousers', image: 'assets/deals/construction/work-trousers.jpg' }
    ]
  },
  hospitality: {
    code: '03',
    sector: 'Hospitality',
    tagline: 'Built for the busiest service.',
    description: 'A refined everyday uniform for cafés, restaurants and front-of-house teams.',
    perk: 'Free logo & setup',
    banner: 'hospitality-bar.jpg',
    bannerAlt: 'Bar team in white shirts and brown aprons',
    items: [
      { qty: 2, name: 'Bib aprons', image: 'products/bib-apron.svg' },
      { qty: 3, name: 'Shirts', image: 'products/shirt.svg' },
      { qty: 1, name: 'Waist apron', image: 'products/waist-apron.svg' }
    ]
  },
  sport: {
    code: '01',
    sector: 'Sport',
    tagline: 'One team. One identity.',
    description: 'Coordinated training kit for clubs, coaches and match-day staff.',
    perk: 'Free logo & setup',
    banner: 'assets/sport-teamwear.jpg',
    bannerAlt: 'Athlete wearing a navy sports team jacket',
    items: [
      { qty: 4, name: 'Training tops' },
      { qty: 2, name: 'Hoodies' },
      { qty: 1, name: 'Team jackets' }
    ]
  },
  cleaning: {
    code: '01',
    sector: 'Cleaning',
    tagline: 'Professional every shift.',
    description: 'Easy-care uniforms for cleaning and facilities teams on every site.',
    perk: 'Free logo & setup',
    banner: 'assets/cleaning-workwear.jpg',
    bannerAlt: 'Cleaner wearing a navy workwear polo',
    items: [
      { qty: 4, name: 'Polos' },
      { qty: 2, name: 'Softshells' },
      { qty: 2, name: 'Hi-vis vests' }
    ]
  }
};
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
const cards = [...document.querySelectorAll('.cards-row .card')];
const hero = document.querySelector('.hero');
const results = document.querySelector('.big-results');
const little = document.querySelector('.small-team');
const subline = document.querySelector('.subline');
const nav = document.querySelector('.nav');
const dialog = document.querySelector('#deal-pop');
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

function openDeal(id){
 const deal=DEALS[id];if(!deal||!dialog)return;
 document.querySelector('#deal-pop-kicker').textContent=deal.sector+' deal '+deal.code;
 document.querySelector('#deal-pop-title').textContent=deal.sector;
 document.querySelector('#deal-pop-tagline').textContent=deal.tagline;
 document.querySelector('#deal-pop-lead').textContent=deal.description;
 document.querySelector('#deal-pop-perk').textContent=deal.perk;
 const banner=document.querySelector('#deal-pop-banner');
 banner.src=deal.banner;
 banner.alt=deal.bannerAlt;
 const list=document.querySelector('#deal-pop-items');
 list.style.gridTemplateColumns='repeat('+deal.items.length+', minmax(0, 1fr))';
 list.replaceChildren();
 for(const item of deal.items){
  const li=document.createElement('li');
  li.className='deal-pop__item';
  const shot=document.createElement('div');
  shot.className='deal-pop__shot';
  if(item.image){
   const img=document.createElement('img');
   img.src=item.image;
   img.alt='';
   shot.append(img);
  }
  const qty=document.createElement('p');
  qty.className='deal-pop__qty';
  qty.textContent='\u00d7'+item.qty;
  const name=document.createElement('p');
  name.className='deal-pop__name';
  name.textContent=item.name;
  li.append(shot,qty,name);
  list.append(li);
 }
 dialog.showModal();
}
document.querySelectorAll('[data-sector]').forEach(el=>el.addEventListener('click',()=>openDeal(el.dataset.sector)));
document.querySelector('#deal-pop-close').addEventListener('click',()=>dialog.close());
dialog.addEventListener('click',e=>{if(e.target===dialog)dialog.close();});
document.querySelector('#deal-pop-cta').addEventListener('click',event=>event.preventDefault());
const requestedDeal=new URLSearchParams(location.search).get('deal');
if(requestedDeal)openDeal(requestedDeal);

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
