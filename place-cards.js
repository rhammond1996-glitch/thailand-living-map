/* Thailand Living Map — adaptive destination dossier.
   The photo service uses Wikimedia's public, open-licensed media endpoints.
   No private keys, scraping of the biennale's photos, or fabricated venue hours. */
(function(){
 "use strict";
 const cards=window.MAP_PROFILES||{};
 const cache=new Map();
 const cardEl=()=>document.getElementById("place-detail");
 const html=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
 const asText=s=>html(String(s??""));
 const split=p=>String(p.categories||"").split("|").map(s=>s.trim()).filter(Boolean);
 const isBab=p=>split(p).includes("Bangkok Art Biennale");
 const searchName=p=>String(p.name||"").replace(/\s*[—–]\s*(Bangkok Art Biennale|Biennale|BACC).*$/i,"").replace(/\s*\/.*/,"").trim();
 const displayName=(p,o)=>o.title||searchName(p)||p.name;
 const typeFor=p=>{
  const c=split(p);
  if(c.includes("Bangkok Art Biennale"))return "ARTISTS";
  if(c.some(x=>["Fragrances","Independent fashion","Designer replicas","Vintage","Jewelry & artisan"].includes(x)))return "STORES";
  if(c.includes("Markets & shopping"))return "FINDS";
  if(c.includes("Nature & adventure"))return "EXPLORE";
  if(c.includes("Temples & culture")||c.includes("Architecture & heritage"))return "HIGHLIGHTS";
  if(c.includes("Gay Nightlife")||c.includes("Underground & Raves"))return "THE SCENE";
  if(c.includes("Wellness & beauty"))return "EXPERIENCES";
  return "HIGHLIGHTS";
 };
 const factsFor=(p,o)=>{
  const x=[];
  x.push(["OPEN",o.hours||"Check current venue hours"]);
  if(o.dates||isBab(p))x.push(["DATES",o.dates||"29 Oct 2026 – 28 Feb 2027"]);
  if(o.count)x.push(["ARTWORKS",o.count]);
  else if(o.items?.length)x.push([o.listing==="ARTISTS"?"FEATURES":o.listing==="STORES"?"SAVED STOPS":"TO EXPLORE",o.items.length+" bookmarked"]);
  x.push(["VISIT TIME",o.visit||"Flexible stop"]);
  if(o.transit)x.push(["GETTING THERE",o.transit]);
  return x;
 };
 const itemsFor=(p,o)=>{
  if(o.items?.length)return o.items;
  const h=String(p.highlights||"");
  const pieces=h.split(/\s*;\s*/).map(s=>s.trim()).filter(Boolean);
  // When source notes are one narrative sentence, don't pretend it is multiple vendors.
  if(pieces.length>1)return pieces.slice(0,9).map(v=>({name:v}));
  if(!h)return [];
  // A single narrative highlight is still useful: present it as our own field
  // note, never as an invented store, exhibit, artist or event.
  const type=typeFor(p);
  const label=type==="STORES"?"Our shopping focus":type==="EXPLORE"?"What to experience":type==="THE SCENE"?"The atmosphere":type==="FINDS"?"What to look for":"Why we saved it";
  return [{name:label,where:p.location_type||p.city,note:h}];
 };
 const introFor=(p,o)=>o.intro||String(p.highlights||p.location_type||"Discover this stop in our Thailand field guide.");
 function chipIcon(p){
  const c=split(p)[0]||"All";
  try{return categoryStamp(c)}catch{return '<span class="visit-mark">✳</span>'}
 }
 function renderHero(p,o){
  const photos=cache.get(p.id)?.photos||[];
  const photo=photos[0];
  if(photo){
   return '<div class="visit-photo"><img src="'+html(photo.url)+'" alt="'+html("Photo of "+displayName(p,o))+'" loading="eager" decoding="async">'+
    '<div class="visit-photo-foot"><span>FIELD NOTES / '+html(p.city.toUpperCase())+'</span><a href="'+html(photo.page)+'" target="_blank" rel="noopener noreferrer">IMAGE SOURCE ↗</a></div></div>';
  }
  return '<div class="visit-poster" style="--visit-ink:'+html((STYLES?.[split(p)[0]]||{color:"#6748D8"}).color)+'">'+
   '<div class="visit-poster-upper"><span>'+html(p.city.toUpperCase())+' / THAILAND</span><span>° 2027</span></div>'+
   '<div class="visit-poster-symbol" aria-hidden="true">✳</div>'+
   '<strong>'+html(displayName(p,o))+'</strong><small>OUR LIVING FIELD GUIDE</small>'+
   '</div>';
 }
 function renderMainTab(p,o){
  const items=itemsFor(p,o);
  if(!items.length)return '<div class="visit-empty"><strong>Our field notes</strong><p>'+html(introFor(p,o))+'</p>'+
   '<p>Specific '+html((o.listing||typeFor(p)).toLowerCase())+' can be added as we discover them. We have not invented a store list or lineup.</p></div>';
  return '<div class="visit-section-kicker">'+html(o.listing||typeFor(p))+' / '+items.length+' NOTES</div>'+
   '<div class="visit-items">'+items.map((it,i)=>
    '<article class="visit-item"><span class="visit-item-num">'+String(i+1).padStart(2,"0")+'</span>'+
    '<div class="visit-item-copy"><strong>'+html(it.name)+'</strong>'+
    (it.type?'<small class="visit-item-type">'+html(it.type)+'</small>':'')+
    (it.where?'<span class="visit-item-loc">'+html(it.where)+'</span>':'')+
    (it.note?'<p>'+html(it.note)+'</p>':'')+
    '</div></article>').join("")+'</div>';
 }
 function renderPhotoTab(p,o){
  const entry=cache.get(p.id);
  if(!entry||entry.loading)return '<div class="visit-empty"><strong>Gathering location photographs…</strong><p>Checking Wikimedia Commons for freely licensed photographs of this place.</p></div>';
  const photos=entry.photos||[];
  if(!photos.length)return '<div class="visit-empty"><strong>No verified photo available yet</strong><p>We have not substituted an unrelated stock image. You can still browse visitor photos on Google Maps.</p><a href="'+html(gmaps(p))+'" target="_blank" rel="noopener noreferrer">VIEW PLACE PHOTOS ↗</a></div>';
  return '<div class="visit-section-kicker">OPEN-LICENSED PHOTOGRAPHS / '+photos.length+'</div><div class="visit-gallery">'+
   photos.map((f,i)=>'<figure><a href="'+html(f.page)+'" target="_blank" rel="noopener noreferrer" aria-label="Open image and attribution in Wikimedia Commons"><img src="'+html(f.url)+'" loading="lazy" decoding="async" alt="'+html(displayName(p,o)+" photo "+(i+1))+'"></a><figcaption>WIKIMEDIA / '+String(i+1).padStart(2,"0")+' <span>VIEW CREDIT ↗</span></figcaption></figure>').join("")+
   '</div><p class="visit-credit-note">Photos show the venue or surroundings, not necessarily the current exhibition or individual shops. Tap an image for author and licensing details.</p>';
 }
 function renderAboutTab(p,o){
  return '<div class="visit-section-kicker">WHY WE SAVED IT</div><p class="visit-about-text">'+html(introFor(p,o))+'</p>'+
   (o.more?'<p class="visit-about-text">'+html(o.more)+'</p>':'')+
   '<div class="visit-address"><span>ADDRESS</span><p>'+html(p.address||p.city+", Thailand")+'</p></div>'+
   (p.price_note?'<div class="visit-address"><span>PRICE / NOTES</span><p>'+html(p.price_note)+'</p></div>':'')+
   (p.verification?'<div class="visit-address"><span>CHECK BEFORE VISITING</span><p>'+html(p.verification)+'</p></div>':'')+
   (isBab(p)?'<p class="visit-credit-note">Biennale season: 29 October 2026–28 February 2027. Museum/temple admissions and operating hours can differ from exhibition hours.</p>':'');
 }
 function renderTab(p,o,tab){
  if(tab==="photos")return renderPhotoTab(p,o);
  if(tab==="about")return renderAboutTab(p,o);
  return renderMainTab(p,o);
 }
 function makeCard(p){
  const o=cards[p.id]||{};
  const primary=split(p)[0]||"All", c=STYLES?.[primary]||{color:"#6748D8",label:primary};
  const sub=o.eyebrow||(isBab(p)?"BANGKOK ART BIENNALE / 2026–27":"THAILAND / "+(c.label||primary).toUpperCase());
  const facts=factsFor(p,o), tabName=o.listing||typeFor(p), poster=renderHero(p,o);
  const tabs=[["photos","PHOTOS"],["features",tabName],["about","ABOUT"]];
  return '<div class="visit-shell" style="--visit-accent:'+html(c.color)+'" data-place-id="'+html(p.id)+'">'+
   '<div class="visit-heading"><div class="visit-identity"><span class="visit-kicker">'+html(sub)+'</span>'+
   '<h2>'+html(displayName(p,o))+'</h2>'+(o.thai?'<div class="visit-thai" lang="th">'+html(o.thai)+'</div>':'')+'</div>'+
   '<div class="visit-actions">'+favoriteButton(p,"detail")+'<button class="close-detail" type="button" aria-label="Close destination card">×</button></div></div>'+
   '<div class="visit-hero" aria-label="Location image">'+poster+'</div>'+
   '<div class="visit-facts">'+(facts.length?facts.map(([label,value])=>'<div class="visit-fact"><span>'+html(label)+'</span><strong>'+html(value)+'</strong></div>').join("") :
   '<div class="visit-fact"><span>TYPE</span><strong>'+html(p.location_type||c.label||primary)+'</strong></div>')+
   '</div>'+
   '<div class="visit-place-guide"><span class="visit-guide-dot"></span><span>'+html(p.city.toUpperCase())+' / '+html(p.location_type||c.label)+'</span>'+
   '<a href="'+html(directions(p))+'" target="_blank" rel="noopener noreferrer">DIRECTIONS ↗</a></div>'+
   '<div class="visit-tabs" role="tablist" aria-label="Destination information">'+tabs.map(([id,label])=>
    '<button role="tab" type="button" class="visit-tab '+(id==="features"?"is-active":"")+'" data-visit-tab="'+id+'" aria-selected="'+(id==="features")+'">'+html(label)+'</button>').join("")+'</div>'+
   '<div class="visit-tab-panel" role="tabpanel" aria-live="polite">'+renderMainTab(p,o)+'</div>'+
   '<div class="visit-footer"><a href="'+html(gmaps(p))+'" target="_blank" rel="noopener noreferrer">GOOGLE MAPS ↗</a>'+
   (o.quickLink?'<a href="'+html(o.quickLink)+'" target="_blank" rel="noopener noreferrer">OFFICIAL GUIDE ↗</a>':'')+
   '</div></div>';
 }
 async function fetchPhotos(p,o){
  const wanted=(o.wiki||"").trim();
  const query=searchName(p)+" "+p.city;
  const found=[];
  try{
   if(wanted){
    const params=new URLSearchParams({action:"query",format:"json",origin:"*",prop:"pageimages",titles:wanted,pithumbsize:"1100"});
    const r=await fetch("https://en.wikipedia.org/w/api.php?"+params.toString());
    if(r.ok){
     const j=await r.json();
     for(const page of Object.values(j.query?.pages||{})){
      const photo=page.thumbnail?.source;
      if(photo&&/^https:\/\//.test(photo))found.push({url:photo,page:page.pageimage?"https://commons.wikimedia.org/wiki/File:"+encodeURIComponent(page.pageimage.replace(/ /g,"_")):"https://en.wikipedia.org/wiki/"+encodeURIComponent(page.title.replace(/ /g,"_"))});
     }
    }
   }
  }catch(e){ /* Wikimedia may be blocked on a travel connection */ }
  try{
   const q=new URLSearchParams({action:"query",format:"json",origin:"*",generator:"search",gsrsearch:query,gsrnamespace:"6",gsrlimit:"8",prop:"imageinfo",iiprop:"url",iiurlwidth:"900"});
   const r=await fetch("https://commons.wikimedia.org/w/api.php?"+q.toString());
   if(r.ok){
    const j=await r.json();
    const pages=Object.values(j.query?.pages||{}).sort((a,b)=>(a.index||0)-(b.index||0));
    for(const item of pages){
     const info=item.imageinfo?.[0], title=String(item.title||"");
     if(!info||!/\.(jpg|jpeg|png|webp)$/i.test(title)||/logo|map|diagram|flag|icon|poster|advertis/i.test(title))continue;
     const url=info.thumburl||info.url,page=info.descriptionurl;
     if(url&&page&&/^https:\/\//.test(url)&&/^https:\/\//.test(page)&&!found.some(x=>x.url===url))found.push({url,page});
     if(found.length>=5)break;
    }
   }
  }catch(e){ /* Graceful offline fallback */ }
  return found.slice(0,5);
 }
 function syncPhotos(id){
  const panel=cardEl(), p=state.places?.find(x=>String(x.id)===String(id));
  if(!p||panel.hidden||panel.dataset.placeId!==String(id))return;
  const o=cards[id]||{};
  const hero=panel.querySelector(".visit-hero");
  if(hero)hero.innerHTML=renderHero(p,o);
  if(panel.querySelector(".visit-tab.is-active")?.dataset.visitTab==="photos"){
   const body=panel.querySelector(".visit-tab-panel");
   if(body)body.innerHTML=renderPhotoTab(p,o);
  }
 }
 window.openPlaceProfile=function(p){
  const panel=cardEl();if(!panel||!p)return;
  panel.dataset.placeId=String(p.id);
  panel.innerHTML=makeCard(p);
  panel.hidden=false;
  panel.scrollTop=0;
  const entry=cache.get(p.id);
  if(!entry){
   cache.set(p.id,{loading:true,photos:[]});
   fetchPhotos(p,cards[p.id]||{}).then(photos=>{
    cache.set(p.id,{loading:false,photos});
    syncPhotos(p.id);
   }).catch(()=>{cache.set(p.id,{loading:false,photos:[]});syncPhotos(p.id);});
  }else syncPhotos(p.id);
 };
 document.addEventListener("click",function(e){
  const tab=e.target.closest("#place-detail [data-visit-tab]");
  if(!tab)return;
  const panel=cardEl(), id=panel.dataset.placeId;
  const p=state.places?.find(x=>String(x.id)===String(id));
  if(!p)return;
  const chosen=tab.dataset.visitTab;
  panel.querySelectorAll(".visit-tab").forEach(b=>{const active=b===tab;b.classList.toggle("is-active",active);b.setAttribute("aria-selected",String(active));});
  const body=panel.querySelector(".visit-tab-panel");
  if(body)body.innerHTML=renderTab(p,cards[id]||{},chosen);
 });
})();
