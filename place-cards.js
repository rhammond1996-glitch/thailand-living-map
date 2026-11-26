/* Thailand Living Map — adaptive destination dossier.
   The photo service uses Wikimedia's public, open-licensed media endpoints.
   No private keys, scraping of the biennale's photos, or fabricated venue hours. */
(function(){
 "use strict";
 const profiles=window.MAP_PROFILES||{},sources=window.VENUE_RESEARCH||{},editorial=window.PLACE_EDITORIAL||{};
 const cards=Object.fromEntries([...new Set([...Object.keys(sources),...Object.keys(profiles)])].map(id=>[id,
  {...sources[id],...profiles[id],links:[...(sources[id]?.links||[]),...(profiles[id]?.links||[])]}]));
 const cache=new Map();
 const cardEl=()=>document.getElementById("place-detail");
 const html=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
 const asText=s=>html(String(s??""));
 const split=p=>String(p.categories||"").split("|").map(s=>s.trim()).filter(Boolean);
 const isBab=p=>split(p).includes("Bangkok Art Biennale");
 const searchName=p=>String(p.name||"").replace(/\s*[—–]\s*(Bangkok Art Biennale|Biennale|BACC).*$/i,"").replace(/\s*\/.*/,"").trim();
 const displayName=(p,o)=>o.title||searchName(p)||p.name;
 function renderHero(p,o){
  const photos=cache.get(p.id)?.photos||[];
  if(photos.length){
   const n=photos.length;
   const slides=photos.map((photo,i)=>
    '<div class="visit-hero-slide" role="group" aria-roledescription="slide" aria-label="'+(i+1)+' of '+n+'">'+
    '<button type="button" class="visit-hero-image-button" data-photo-index="'+i+'" aria-label="Enlarge photo '+(i+1)+': '+html(photo.title||displayName(p,o))+'">'+
    '<img src="'+html(photo.url)+'" alt="'+html(photo.title||displayName(p,o))+'" loading="'+(i===0?'eager':'lazy')+'" decoding="async"></button></div>'
   ).join('');
   return '<div class="visit-photo visit-photo-carousel" role="region" aria-roledescription="carousel" aria-label="Photos of '+html(displayName(p,o))+'">'+
    '<div class="visit-photo-track" data-photo-track tabindex="0" aria-label="Swipe left or right to browse photographs">'+slides+'</div>'+
    '<div class="visit-photo-toolbar"><span class="visit-photo-collection">'+html(o.photoLabel||'DESTINATION PHOTOS')+'</span>'+
    '<div class="visit-photo-controls">'+
    (n>1?'<button type="button" data-photo-step="-1" aria-label="Previous photograph">‹</button>':'')+
    '<span class="visit-photo-counter" data-photo-counter aria-live="polite">1 / '+n+'</span>'+
    (n>1?'<button type="button" data-photo-step="1" aria-label="Next photograph">›</button>':'')+
    '</div></div>'+
    (n>1?'<div class="visit-photo-progress" aria-hidden="true"><span data-photo-progress style="width:'+(100/n)+'%"></span></div>':'')+
    '</div>';
  }
  return '<div class="visit-poster" style="--visit-ink:'+html((STYLES?.[split(p)[0]]||{color:"#6748D8"}).color)+'">'+
   '<div class="visit-poster-upper"><span>'+html(p.city.toUpperCase())+' / THAILAND</span><span>° 2027</span></div>'+
   '<div class="visit-poster-symbol" aria-hidden="true">✳</div>'+
   '<strong>'+html(displayName(p,o))+'</strong></div>';
 }
  function renderCredits(photos){
  if(!photos.length)return "";
  return '<details class="visit-photo-credits"><summary>Image sources &amp; credits</summary><ol>'+
   photos.map((f,i)=>'<li><a href="'+html(f.page)+'" target="_blank" rel="noopener noreferrer">Photo '+(i+1)+'</a>'+
    ' · '+html(f.artist||"Photo source")+
    (f.kind?' · '+html(f.kind):"")+
    (f.license?' · '+(f.licenseUrl?'<a href="'+html(f.licenseUrl)+'" target="_blank" rel="noopener noreferrer">'+html(f.license)+'</a>':html(f.license)):"")+
    '</li>').join("")+'</ol></details>';
 }
 function renderRetailDirectory(o){
  if(!o.retailDirectory||!Array.isArray(o.items))return '';
  // Only named, explicitly saved store stops belong in a store directory.
  // Generic retail categories remain in the location summary, not as fake shops.
  const stores=o.items.filter(item=>item&&String(item.name||'').trim()&&
    !/^(independent designers|other shops|stores|browse)$/i.test(String(item.name).trim()));
  if(!stores.length)return '';
  const rows=stores.map((item,index)=>{
   const name=String(item.name||'').trim(),where=String(item.where||'').trim();
   const type=String(item.type||'').trim(),note=String(item.note||'').trim();
   const unverified=/confirm|verify|not established|unconfirmed|tbc|tbd/i.test(where);
   return '<li class="visit-store-row">'+
    '<span class="visit-store-num" aria-hidden="true">'+String(index+1).padStart(2,'0')+'</span>'+
    '<div class="visit-store-info"><div class="visit-store-top"><strong>'+html(name)+'</strong>'+
    (type?'<span class="visit-store-category">'+html(type)+'</span>':'')+'</div>'+
    (where?'<span class="visit-store-location '+(unverified?'is-unverified':'')+'">'+html(where)+'</span>':'')+
    (note?'<p>'+html(note)+'</p>':'')+
    '</div></li>';
  }).join('');
  return '<section class="visit-store-guide" aria-label="Stores and stops inside this location">'+
   '<header class="visit-store-guide-header"><h3>OUR STOPS INSIDE</h3><span>'+
    stores.length+' '+(stores.length===1?'PLACE':'PLACES')+'</span></header>'+
   '<ol class="visit-store-list">'+rows+'</ol>'+
   '<p class="visit-store-fineprint">Floor and unit information reflects saved research and can change. Unconfirmed locations are marked.</p>'+
   '</section>';
 }
 function makeCard(p){
  const o=cards[p.id]||{};
  const primary=split(p)[0]||"All",c=STYLES?.[primary]||{color:"#6748D8",label:primary};
  const copy=editorial[p.id]||[];
  const description=String(copy[0]||p.highlights||"").trim();
  const highlights=Array.isArray(copy[1])?copy[1]:[];
  const storeGuide=renderRetailDirectory(o);
  const heading=html(displayName(p,o));
  const sub=html(p.city+" / "+(p.location_type||c.label||primary));
  return '<div class="visit-shell visit-compact" style="--visit-accent:'+html(c.color)+'" data-place-id="'+html(p.id)+'">'+
   '<div class="visit-heading"><div class="visit-identity"><span class="visit-kicker">'+sub+'</span>'+
   '<h2>'+heading+'</h2>'+'</div>'+
   '<div class="visit-actions">'+favoriteButton(p,"detail")+'<button class="close-detail" type="button" aria-label="Close destination card">×</button></div></div>'+
   '<div class="visit-hero" aria-label="Destination or collection photography">'+renderHero(p,o)+'</div>'+
   '<div class="visit-hero-credit">'+renderCredits(cache.get(p.id)?.photos||[])+'</div>'+
   (description?'<p class="visit-summary">'+html(description)+'</p>':"")+
   (storeGuide||(
    highlights.length?'<section class="visit-highlights" aria-label="Location highlights">'+
     '<h3>HIGHLIGHTS</h3><ul>'+
     highlights.map(t=>'<li><span class="visit-highlight-marker" aria-hidden="true"></span><span>'+html(t)+'</span></li>').join("")+
     '</ul></section>':""))+
   '<button type="button" class="visit-map-button" data-map-chooser aria-label="Choose a map app for '+heading+'">'+
   '<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m3 6 6-3 6 3 6-3v15l-6 3-6-3-6 3z"/><path d="M9 3v15M15 6v15"/><circle cx="12" cy="11" r="2" fill="currentColor" stroke="none"/></svg>'+
   '<span>OPEN IN MAPS</span><span aria-hidden="true">⌄</span></button>'+
   '</div>';
 }
 function metadataText(value){
  return String(value||"").replace(/<[^>]*>/g," ").replace(/&(?:nbsp|#160);/gi," ")
   .replace(/&amp;/gi,"&").replace(/&quot;/gi,'"').replace(/\s+/g," ").trim().slice(0,170);
 }
 function candidateFromPage(item,curated=false){
  const info=item.imageinfo?.[0],title=String(item.title||"");
  if(!info||!/[\s\S]\.(?:jpg|jpeg|png|webp)$/i.test(title))return null;
  if(/logo|map|diagram|flag|icon|poster|advertis|stamp|seal|document|screenshot|signature|drawing|painting|brochure|floor.?plan|graphic/i.test(title))return null;
  if(Number(info.width||0)<660||Number(info.height||0)<450)return null;
  const url=info.thumburl||info.url,page=info.descriptionurl;
  if(!/^https:\/\//.test(url||"")||!/^https:\/\//.test(page||""))return null;
  const metadata=info.extmetadata||{};
  const license=metadataText(metadata.LicenseShortName?.value);
  if(/all rights reserved|noncommercial|no derivatives/i.test(license))return null;
  const licenseUrl=String(metadata.LicenseUrl?.value||"");
  const artist=metadataText(metadata.Artist?.value||metadata.Credit?.value).slice(0,100);
  const width=Number(info.width)||1200,height=Number(info.height)||800;
  const ratio=width/height;
  const keyword=/temple|stupa|chedi|pagoda|gallery|exhibition|cityscape|night|sunset|garden|architec|waterfall|mountain|market|interior|facade|skyline|view|sculpture|art|food/i.test(title);
  const historical=/^(?:file:)?(?:old|historical)|19[0-7]\d|circa|black.and.white|archive|1900|1930/i.test(title);
  const score=(curated?25:0)+(ratio>1.25&&ratio<2.7?8:ratio>=0.7?3:0)+
   (Math.min(5,width/950))+(keyword?3:0)-(historical?14:0);
  return {title,url,page,artist,license,licenseUrl:/^https:\/\//.test(licenseUrl)?licenseUrl:"",width,height,score,curated};
 }
 async function commonsRequest(parameters){
  const params=new URLSearchParams({action:"query",format:"json",origin:"*",prop:"imageinfo",
   iiprop:"url|size|extmetadata",iiurlwidth:"1180",...parameters});
  const response=await fetch("https://commons.wikimedia.org/w/api.php?"+params.toString());
  if(!response.ok)throw Error("Image search unavailable");
  const json=await response.json();
  return Object.values(json.query?.pages||{});
 }
 function photoSearchMatch(title,p,o){
  const file=String(title||"").toLowerCase().replace(/[^\p{L}\p{N} ]/gu," ");
  const fileWords=new Set(file.split(/\s+/).filter(Boolean));
  // Screen out attractive but misleading nearby places (e.g. a waterfall
  // photographed at the same reservoir as the bamboo-raft dining stop).
  if((o.photoExclude||[]).some(x=>file.includes(String(x).toLowerCase())))return false;
  const stop=new Set(["the","at","and","of","in","thai","thailand","chiang","mai","bangkok","city","wat","temple","gallery","museum","market","park","art","center","centre","night","festival","bamboo","dining","shop","store","village","nature","lake","road","roadside","official","photograph","photos","raft","architecture","district"]);
  const aliases=[o.wiki,...(o.photoQueries||[]),searchName(p)].filter(Boolean);
  return aliases.some(alias=>{
   const terms=String(alias).toLowerCase().replace(/[^\p{L}\p{N} ]/gu," ").split(/\s+/)
    .filter(t=>t.length>2&&!stop.has(t));
   if(!terms.length)return false;
   // Require all distinctive place tokens for a strict match. A single
   // "gallery" or "lake" is never enough to establish image identity.
   return terms.length>1||terms[0]?.length>=9?terms.every(t=>fileWords.has(t)):false;
  });
 }
 async function fetchWikipediaLead(o){
  if(!o.wiki)return [];
  try{
   const q=new URLSearchParams({action:"query",format:"json",origin:"*",prop:"pageimages",
    titles:o.wiki,pithumbsize:"1180"});
   const response=await fetch("https://en.wikipedia.org/w/api.php?"+q.toString());
   if(!response.ok)return [];
   const j=await response.json();
   const name=Object.values(j.query?.pages||{}).find(p=>p.pageimage)?.pageimage;
   if(!name)return [];
   // Metadata and actual image license come from Commons, never from a
   // guessed Wikipedia thumbnail URL.
   return commonsRequest({titles:"File:"+name});
  }catch(error){console.debug("Wiki lead unavailable",error);return [];}
 }
 function exactSourcePhotos(o){
  // A link to a venue is not a photo source. Display only hand-reviewed URLs.
  if(!Array.isArray(o.photoSelections))return [];
  return o.photoSelections.filter(f=>f&&/^https:\/\//.test(f.url||"")&&/^https:\/\//.test(f.page||""))
   .slice(0,14).map((f,i)=>({
    title:String(f.title||"Verified photo "+(i+1)),url:f.url,page:f.page,
    artist:String(f.artist||"Official source"),license:String(f.license||""),
    licenseUrl:String(f.licenseUrl||""),kind:String(f.kind||"Source-identified image"),curated:true
   }));
 }
 const RETAIL_PHOTO_CATEGORIES=new Set(["Fragrances","Independent fashion","Designer replicas","Vintage","Jewelry & artisan","Markets & shopping","Wellness & beauty"]);
 async function fetchPhotos(p,o){
  const selected=exactSourcePhotos(o);
  if(selected.length)return selected;
  // Do not substitute similarly named objects or people for a retail venue.
  if(split(p).some(c=>RETAIL_PHOTO_CATEGORIES.has(c))&&!o.commonsCategory&&!o.wiki)return [];
  const collected=new Map();
  function addRows(rows,curated=false){
   for(const item of rows){
    const candidate=candidateFromPage(item,curated);
    if(!candidate)continue;
    if((o.photoExclude||[]).some(x=>candidate.title.toLowerCase().includes(String(x).toLowerCase())))continue;
    if(curated&&(o.photoInclude||[]).length&&!(o.photoInclude||[]).some(x=>candidate.title.toLowerCase().includes(String(x).toLowerCase())))continue;
    if(!curated&&!photoSearchMatch(candidate.title,p,o))continue;
    const key=candidate.title.toLowerCase();
    if(!collected.has(key))collected.set(key,candidate);
   }
  }
  // 1. The cover of a specific, named Wikipedia article is more reliable
  // than a generic Commons search result.
  if(o.wiki)addRows(await fetchWikipediaLead(o),true);
  // 2. An exact-location Wikimedia Commons category, where available.
  if(o.commonsCategory){
   try{
    const pages=await commonsRequest({generator:"categorymembers",
     gcmtitle:"Category:"+o.commonsCategory,gcmtype:"file",gcmlimit:"50"});
    addRows(pages,true);
   }catch(error){console.debug("Commons venue category unavailable",error);}
  }
  // 3. Carefully matched filenames for this *specific* venue. Using
  // alternate transliterations catches places the English spelling misses.
  const terms=[...(o.photoQueries||[]),o.wiki,searchName(p)].filter(Boolean);
  const queryNames=[...new Set(terms.map(x=>String(x).trim()).filter(Boolean))].slice(0,4);
  for(const q of queryNames){
   if(collected.size>=25)break;
   try{
    const pages=await commonsRequest({generator:"search",gsrsearch:q,
     gsrnamespace:"6",gsrlimit:"35"});
    addRows(pages,false);
   }catch(error){console.debug("Commons search unavailable",error);}
  }
  const heroRank=photo=>{
   const text=photo.title.toLowerCase(),preferred=o.photoHeroPrefer||[];
   const rank=preferred.findIndex(x=>text.includes(String(x).toLowerCase()));
   return rank<0?0:30-rank*5;
  };
  const ranked=[...collected.values()].sort((a,b)=>(b.score+heroRank(b))-(a.score+heroRank(a))||a.title.localeCompare(b.title));
  const limited=[],seriesCount=new Map();
  for(const photo of ranked){
   const series=photo.title.toLowerCase().replace(/\d{1,5}/g,"").replace(/[_()\-.]/g," ").replace(/\s+/g," ").trim();
   const n=seriesCount.get(series)||0;
   if(n>=6)continue;
   limited.push(photo);seriesCount.set(series,n+1);
   if(limited.length===14)break;
  }
  return limited;
 }
 let lightbox=null;
 function showPhoto(p,index){
  const photos=cache.get(p.id)?.photos||[];
  if(!photos.length)return;
  let selected=((Number(index)||0)+photos.length)%photos.length;
  if(lightbox)lightbox.remove();
  const el=document.createElement("div");
  el.className="visit-lightbox";
  el.setAttribute("role","dialog");
  el.setAttribute("aria-modal","true");
  el.setAttribute("aria-label","Destination photo gallery");
  const paint=()=>{
   selected=(selected+photos.length)%photos.length;
   const f=photos[selected];
   el.innerHTML='<div class="visit-lightbox-bar"><span>'+html(displayName(p,cards[p.id]||{}))+
     ' <small>'+String(selected+1)+' / '+photos.length+'</small></span>'+
     '<button type="button" data-lightbox-close aria-label="Close gallery">×</button></div>'+
     '<div class="visit-lightbox-stage"><button type="button" data-lightbox-prev aria-label="Previous photo">‹</button>'+
     '<img src="'+html(f.url)+'" alt="'+html(displayName(p,cards[p.id]||{})+' photo '+(selected+1))+'">'+
     '<button type="button" data-lightbox-next aria-label="Next photo">›</button></div>'+
     '<div class="visit-lightbox-bottom"><span>'+String(selected+1).padStart(2,"0")+
     ' / '+String(photos.length).padStart(2,"0")+'</span><span>SWIPE THROUGH THE PLACE</span></div>';
  };
  paint();
  el.addEventListener("click",e=>{
   if(e.target===el||e.target.closest("[data-lightbox-close]")){close();return;}
   if(e.target.closest("[data-lightbox-prev]")){selected--;paint();}
   if(e.target.closest("[data-lightbox-next]")){selected++;paint();}
  });
  let touchStart=null;
  el.addEventListener("touchstart",e=>{touchStart=e.touches?.[0]?.clientX??null;},{passive:true});
  el.addEventListener("touchend",e=>{
   if(touchStart===null)return;
   const dx=(e.changedTouches?.[0]?.clientX??touchStart)-touchStart;
   touchStart=null;
   if(Math.abs(dx)>50){selected+=dx<0?1:-1;paint();}
  },{passive:true});
  const onKey=e=>{
   if(e.key==="Escape"){e.preventDefault();e.stopPropagation();close();}
   else if(e.key==="ArrowRight"){e.preventDefault();selected++;paint();}
   else if(e.key==="ArrowLeft"){e.preventDefault();selected--;paint();}
  };
  function close(){document.removeEventListener("keydown",onKey,true);el.remove();if(lightbox===el)lightbox=null;}
  document.addEventListener("keydown",onKey,true);
  document.body.appendChild(el);lightbox=el;
  el.querySelector("[data-lightbox-close]")?.focus();
 }
 function changeHeroPhoto(track,delta){
  const photos=cache.get(cardEl()?.dataset.placeId)?.photos||[];
  if(!track||photos.length<2)return;
  const width=track.clientWidth||1;
  const index=Math.min(photos.length-1,Math.max(0,Math.round(track.scrollLeft/width)));
  const next=Math.max(0,Math.min(photos.length-1,index+delta));
  const reduce=window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches;
  track.scrollTo({left:next*width,behavior:reduce?'auto':'smooth'});
 }
 function wireHeroCarousel(panel){
  const track=panel?.querySelector('[data-photo-track]');if(!track)return;
  const hero=track.closest('.visit-photo-carousel'),count=hero?.querySelector('[data-photo-counter]');
  const progress=hero?.querySelector('[data-photo-progress]'),total=track.children.length;
  const refresh=()=>{
   const index=Math.min(total-1,Math.max(0,Math.round(track.scrollLeft/Math.max(1,track.clientWidth))));
   if(count)count.textContent=(index+1)+' / '+total;
   if(progress)progress.style.transform='translateX('+(index*100)+'%)';
   hero?.querySelectorAll('[data-photo-step]').forEach(btn=>{
    const step=Number(btn.dataset.photoStep);
    btn.disabled=step<0?index===0:index===total-1;
   });
  };
  track.addEventListener('scroll',refresh,{passive:true});
  track.addEventListener('keydown',e=>{
   if(e.key==='ArrowLeft'||e.key==='ArrowRight'){
    e.preventDefault();changeHeroPhoto(track,e.key==='ArrowRight'?1:-1);
   }
  });
  refresh();
 }
 function syncPhotos(id){
  const panel=cardEl(), p=state.places?.find(x=>String(x.id)===String(id));
  if(!p||panel.hidden||panel.dataset.placeId!==String(id))return;
  const o=cards[id]||{};
  const hero=panel.querySelector(".visit-hero");
  if(hero)hero.innerHTML=renderHero(p,o);
  const credits=panel.querySelector('.visit-hero-credit');
  if(credits)credits.innerHTML=renderCredits(cache.get(p.id)?.photos||[]);
  wireHeroCarousel(panel);
 }
 let mapChooser=null,mapChooserKeyHandler=null,mapChooserTrigger=null;
 function closeMapChooser(restoreFocus=true){
  if(!mapChooser)return;
  mapChooser.remove();
  mapChooser=null;
  if(mapChooserKeyHandler){
   document.removeEventListener('keydown',mapChooserKeyHandler,true);
   mapChooserKeyHandler=null;
  }
  const previous=mapChooserTrigger;
  mapChooserTrigger=null;
  if(restoreFocus&&previous?.isConnected)previous.focus();
 }
 function openMapChooser(p,trigger){
  closeMapChooser(false);
  if(!p)return;
  mapChooserTrigger=trigger||null;
  const placeName=displayName(p,cards[p.id]||{});
  // Universal map links let the device open the named app when supported,
  // otherwise a compatible web map. No forced native scheme or app install.
  const query=[searchName(p),p.address].filter(Boolean).join(', ');
  const appleURL='https://maps.apple.com/?q='+encodeURIComponent(query)+
   (p.lat!=null&&p.lng!=null&&p.lat!==''&&p.lng!==''&&Number.isFinite(Number(p.lat))&&Number.isFinite(Number(p.lng))?
    '&ll='+encodeURIComponent(String(p.lat)+','+String(p.lng)):'');
  const googleURL=gmaps(p);
  const overlay=document.createElement('div');
  overlay.className='visit-map-chooser-overlay';
  overlay.innerHTML='<section class="visit-map-chooser" role="dialog" aria-modal="true" aria-labelledby="visit-map-choice-title" aria-describedby="visit-map-choice-place">'+
   '<header class="visit-map-choice-header"><div><span class="visit-map-choice-kicker">MAPS / OPEN LOCATION</span>'+
   '<h2 id="visit-map-choice-title">CHOOSE YOUR MAP APP</h2>'+
   '<p id="visit-map-choice-place">'+html(placeName)+'</p></div>'+
   '<button type="button" class="visit-map-choice-close" data-map-close aria-label="Close map app chooser">×</button></header>'+
   '<div class="visit-map-options">'+
   '<a class="visit-map-option visit-map-option-apple" href="'+html(appleURL)+'" data-map-app="apple" aria-label="Open '+html(placeName)+' in Apple Maps">'+
   '<span class="visit-map-option-icon" aria-hidden="true">A</span>'+
   '<span>Apple Maps<small>Apple devices &amp; web</small></span><span class="visit-map-option-arrow" aria-hidden="true">↗</span></a>'+
   '<a class="visit-map-option visit-map-option-google" href="'+html(googleURL)+'" data-map-app="google" aria-label="Open '+html(placeName)+' in Google Maps">'+
   '<span class="visit-map-option-icon" aria-hidden="true">G</span>'+
   '<span>Google Maps<small>Google Maps app &amp; web</small></span><span class="visit-map-option-arrow" aria-hidden="true">↗</span></a></div>'+
   '<p class="visit-map-choice-footnote">Your device chooses the installed app or web version.</p></section>';
  overlay.addEventListener('click',event=>{
   if(event.target===overlay||event.target.closest('[data-map-close]'))closeMapChooser();
  });
  document.body.appendChild(overlay);
  mapChooser=overlay;
  mapChooserKeyHandler=event=>{
   if(event.key==='Escape'){event.preventDefault();closeMapChooser();return;}
   if(event.key!=='Tab')return;
   const focusable=Array.from(overlay.querySelectorAll('a[href],button:not([disabled])'));
   const first=focusable[0],last=focusable[focusable.length-1];
   if(event.shiftKey&&document.activeElement===first){event.preventDefault();last?.focus();}
   else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first?.focus();}
  };
  document.addEventListener('keydown',mapChooserKeyHandler,true);
  overlay.querySelector('[data-map-app="apple"]')?.focus();
 }
 window.openPlaceProfile=function(p){
  closeMapChooser(false);
  const panel=cardEl();if(!panel||!p)return;
  panel.dataset.placeId=String(p.id);
  panel.innerHTML=makeCard(p);
  wireHeroCarousel(panel);
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
 // Remote editorial sites can block hotlinked images or change asset URLs.
 // Remove a failed image from the current gallery, rather than leaving a
 // broken-photo icon or retrying another unrelated search result.
 document.addEventListener("error",function(e){
  const img=e.target;
  if(!(img instanceof HTMLImageElement)||!img.closest("#place-detail"))return;
  const panel=cardEl(),id=panel?.dataset.placeId,entry=cache.get(id);
  if(!entry?.photos?.length)return;
  const failed=img.getAttribute("src"),before=entry.photos.length;
  entry.photos=entry.photos.filter(photo=>photo.url!==failed);
  if(entry.photos.length!==before)syncPhotos(id);
 },true);
 document.addEventListener("click",function(e){
  const opener=e.target.closest('#place-detail [data-map-chooser]');
  if(opener){
   e.preventDefault();
   const id=cardEl()?.dataset.placeId;
   const p=state.places?.find(place=>String(place.id)===String(id));
   if(p)openMapChooser(p,opener);
   return;
  }
  const arrow=e.target.closest("#place-detail [data-photo-step]");
  if(arrow){
   e.preventDefault();
   changeHeroPhoto(arrow.closest('.visit-photo-carousel')?.querySelector('[data-photo-track]'),Number(arrow.dataset.photoStep));
   return;
  }
  const photo=e.target.closest("#place-detail [data-photo-index]");
  if(photo){
   const id=cardEl()?.dataset.placeId;
   const p=state.places?.find(x=>String(x.id)===String(id));
   if(p){e.preventDefault();showPhoto(p,photo.dataset.photoIndex);}
   return;
  }
 });
})();
