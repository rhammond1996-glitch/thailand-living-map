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
  const facts=[];
  // Only show details we actually know; no fabricated opening times or
  // compulsory "flexible stop" rows.
  if(o.hours&&!/check|confirm|unknown|varies|tba/i.test(o.hours))facts.push(["HOURS",o.hours]);
  if(o.dates||isBab(p))facts.push(["EVENT",o.dates||(isBab(p)?"29 Oct 2026 – 28 Feb 2027":"")]);
  if(o.visit&&!/flexible|tbd|check|confirm/i.test(o.visit))facts.push(["ALLOW",o.visit]);
  if(o.transit)facts.push(["GETTING THERE",o.transit]);
  return facts;
 };
  const itemsFor=(p,o)=>{
  if(o.items?.length){
   return o.items.filter(it=>it&&String(it.name||"").trim());
  }
  const note=String(p.highlights||"").trim();
  if(!note)return [];
  const parts=note.split(/\s*;\s*/).map(x=>x.trim()).filter(Boolean);
  // No invented "feature" for a single sentence: that belongs in the
  // editorial introduction, not a forced numbered list.
  return parts.length>1?parts.slice(0,7).map(name=>({name})):[];
 };
 const introFor=(p,o)=>{
  const text=String(o.intro||p.highlights||"").trim();
  return /^(saved stop|explore this|check.*hours|flexible stop)/i.test(text)?"":text;
 };
 const needsCheck=value=>!!value&&!/^(approximate neighborhood|pin checked|verify entrance|pin needs|check pin|approximate pin)/i.test(String(value).trim());
 const goodNote=value=>!!String(value||"").trim()&&!/^(none|n\/a|no notes|to be confirmed)$/i.test(String(value).trim());
  function chipIcon(p){
  const c=split(p)[0]||"All";
  try{return categoryStamp(c)}catch{return '<span class="visit-mark">✳</span>'}
 }
 function renderHero(p,o){
  const photos=cache.get(p.id)?.photos||[];
  if(photos.length){
   const photo=photos[0];
   return '<div class="visit-photo"><button type="button" class="visit-photo-open" data-visit-tab-open="photos" aria-label="Explore photographs of '+html(displayName(p,o))+'">'+
    '<img src="'+html(photo.url)+'" alt="'+html(displayName(p,o))+'" loading="eager" decoding="async">'+
    '<span class="visit-photo-invite">VIEW PHOTOS <span aria-hidden="true">↗</span></span></button></div>';
  }
  return '<div class="visit-poster" style="--visit-ink:'+html((STYLES?.[split(p)[0]]||{color:"#6748D8"}).color)+'">'+
   '<div class="visit-poster-upper"><span>'+html(p.city.toUpperCase())+' / THAILAND</span><span>° 2027</span></div>'+
   '<div class="visit-poster-symbol" aria-hidden="true">✳</div>'+
   '<strong>'+html(displayName(p,o))+'</strong></div>';
 }
  function renderMainTab(p,o){
  const items=itemsFor(p,o);
  const more=String(o.more||"").trim();
  if(!items.length&&!more)return "";
  return (items.length?
   '<div class="visit-section-kicker">WHAT TO LOOK FOR</div><div class="visit-items">'+
   items.map((it,i)=>'<article class="visit-item"><span class="visit-item-num">'+String(i+1).padStart(2,"0")+'</span>'+
    '<div class="visit-item-copy"><strong>'+html(it.name)+'</strong>'+
    (it.type?'<small class="visit-item-type">'+html(it.type)+'</small>':'')+
    (it.where?'<span class="visit-item-loc">'+html(it.where)+'</span>':'')+
    (it.note?'<p>'+html(it.note)+'</p>':'')+
    '</div></article>').join("")+'</div>':"")+
   (more?'<p class="visit-about-text visit-extra-note">'+html(more)+'</p>':"");
 }
  function renderCredits(photos){
  if(!photos.length)return "";
  return '<details class="visit-photo-credits"><summary>Photo sources &amp; licenses</summary><ol>'+
   photos.map((f,i)=>'<li><a href="'+html(f.page)+'" target="_blank" rel="noopener noreferrer">Photo '+(i+1)+'</a>'+
    ' · '+html(f.artist||"Wikimedia Commons")+
    (f.license?' · '+(f.licenseUrl?'<a href="'+html(f.licenseUrl)+'" target="_blank" rel="noopener noreferrer">'+html(f.license)+'</a>':html(f.license)):"")+
    '</li>').join("")+'</ol></details>';
 }
 function renderPhotoTab(p,o){
  const entry=cache.get(p.id);
  if(!entry||entry.loading)return '<div class="visit-gallery-loading"><span class="visit-gallery-orbit" aria-hidden="true"></span>Finding photographs of this place…</div>';
  const photos=entry.photos||[];
  if(!photos.length)return '<div class="visit-gallery-empty"><p>We haven’t found a reliable gallery of this exact place yet.</p>'+
   '<a href="'+html(gmaps(p))+'" target="_blank" rel="noopener noreferrer">SEE VISITOR PHOTOS ON GOOGLE MAPS ↗</a></div>';
  return '<div class="visit-gallery-heading"><span>THE PLACE, IN PICTURES</span><span>'+photos.length+' PHOTOS</span></div>'+
   '<div class="visit-gallery">'+photos.map((f,i)=>
    '<figure><button type="button" data-photo-index="'+i+'" aria-label="View photograph '+(i+1)+' enlarged">'+
    '<img src="'+html(f.url)+'" loading="'+(i<4?"eager":"lazy")+'" decoding="async" alt="'+html(displayName(p,o)+' — photo '+(i+1))+'"></button></figure>'
   ).join("")+'</div>'+renderCredits(photos);
 }
 function renderPlanTab(p,o){
  const rows=[];
  if(goodNote(o.hours))rows.push(["OPENING HOURS",o.hours]);
  if(goodNote(o.transit))rows.push(["HOW TO GET THERE",o.transit]);
  if(goodNote(o.visit))rows.push(["TIME TO ALLOW",o.visit]);
  if(goodNote(o.dates))rows.push(["EVENT DATES",o.dates]);
  if(goodNote(p.price_note))rows.push(["COST / NOTES",p.price_note]);
  if(goodNote(o.practical))rows.push(["GOOD TO KNOW",o.practical]);
  if(needsCheck(p.verification)&&!/^(pin|location)/i.test(String(p.verification).trim()))rows.push(["BEFORE YOU GO",p.verification]);
  return '<div class="visit-section-kicker">MAKE IT HAPPEN</div>'+
   '<div class="visit-plan-actions"><a class="visit-primary-link" href="'+html(directions(p))+'" target="_blank" rel="noopener noreferrer">GET DIRECTIONS ↗</a>'+
   '<a href="'+html(gmaps(p))+'" target="_blank" rel="noopener noreferrer">MAPS &amp; REVIEWS ↗</a></div>'+
   rows.map(([k,v])=>'<div class="visit-address"><span>'+html(k)+'</span><p>'+html(v)+'</p></div>').join("")+
   (p.address?'<div class="visit-address"><span>ADDRESS</span><p>'+html(p.address)+'</p></div>':"")+
   (o.quickLink?'<a class="visit-reference-link" href="'+html(o.quickLink)+'" target="_blank" rel="noopener noreferrer">OFFICIAL WEBSITE / EVENT GUIDE ↗</a>':"");
 }
 function renderTab(p,o,tab){
  if(tab==="photos")return renderPhotoTab(p,o);
  if(tab==="features")return renderMainTab(p,o);
  return renderPlanTab(p,o);
 }
  function makeCard(p){
  const o=cards[p.id]||{};
  const primary=split(p)[0]||"All",c=STYLES?.[primary]||{color:"#6748D8",label:primary};
  const sub=o.eyebrow||(isBab(p)?"BANGKOK ART BIENNALE / 2026–27":"THAILAND / "+(c.label||primary).toUpperCase());
  const facts=factsFor(p,o),lead=introFor(p,o);
  const showHighlights=itemsFor(p,o).length>0||goodNote(o.more);
  const tabs=[["photos","PHOTOS"],...(showHighlights?[["features","HIGHLIGHTS"]]:[]),["plan","PLAN"]];
  return '<div class="visit-shell" style="--visit-accent:'+html(c.color)+'" data-place-id="'+html(p.id)+'">'+
   '<div class="visit-heading"><div class="visit-identity"><span class="visit-kicker">'+html(sub)+'</span>'+
   '<h2>'+html(displayName(p,o))+'</h2>'+(o.thai?'<div class="visit-thai" lang="th">'+html(o.thai)+'</div>':"")+'</div>'+
   '<div class="visit-actions">'+favoriteButton(p,"detail")+'<button class="close-detail" type="button" aria-label="Close destination card">×</button></div></div>'+
   '<div class="visit-hero" aria-label="Location photograph">'+renderHero(p,o)+'</div>'+
   (lead?'<p class="visit-lead">'+html(lead)+'</p>':"")+
   (facts.length?'<div class="visit-facts">'+facts.map(([label,value])=>'<div class="visit-fact"><span>'+html(label)+'</span><strong>'+html(value)+'</strong></div>').join("")+'</div>':"")+
   '<div class="visit-place-guide"><span class="visit-guide-dot"></span><span>'+html(p.city.toUpperCase())+' / '+html(p.location_type||c.label)+'</span>'+
   '<a href="'+html(directions(p))+'" target="_blank" rel="noopener noreferrer">DIRECTIONS ↗</a></div>'+
   '<div class="visit-tabs" role="tablist" aria-label="Destination information">'+tabs.map(([id,label])=>
    '<button role="tab" type="button" class="visit-tab '+(id==="photos"?"is-active":"")+'" data-visit-tab="'+id+'" aria-selected="'+(id==="photos")+'">'+html(label)+'</button>').join("")+'</div>'+
   '<div class="visit-tab-panel" role="tabpanel" aria-live="polite">'+renderPhotoTab(p,o)+'</div>'+
   '<div class="visit-footer"><a href="'+html(gmaps(p))+'" target="_blank" rel="noopener noreferrer">GOOGLE MAPS ↗</a>'+
   (o.quickLink?'<a href="'+html(o.quickLink)+'" target="_blank" rel="noopener noreferrer">OFFICIAL GUIDE ↗</a>':"")+'</div></div>';
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
  const key=(o.wiki||searchName(p)).toLowerCase().replace(/[^\p{L}\p{N} ]/gu," ");
  const ignored=new Set(["wat","the","and","chiang","mai","bangkok","of","at","one","art","national","market","thailand","temple","museum"]);
  const parts=key.split(/\s+/).filter(t=>t.length>=3&&!ignored.has(t));
  const filename=String(title||"").toLowerCase().replace(/[^\p{L}\p{N} ]/gu," ");
  if(parts.length===0)return filename.includes(searchName(p).toLowerCase().split(" ")[0]);
  return parts.every(t=>filename.includes(t));
 }
 async function fetchPhotos(p,o){
  const collected=new Map();
  function addRows(rows,curated=false){
   for(const item of rows){
    const candidate=candidateFromPage(item,curated);
    if(!candidate||(!curated&&!photoSearchMatch(candidate.title,p,o)))continue;
    const key=candidate.title.toLowerCase();
    if(!collected.has(key))collected.set(key,candidate);
   }
  }
  if(o.commonsCategory){
   try{
    const pages=await commonsRequest({generator:"categorymembers",
     gcmtitle:"Category:"+o.commonsCategory,gcmtype:"file",gcmlimit:"50"});
    addRows(pages,true);
   }catch(error){console.debug("Commons venue category unavailable",error);}
  }
  // A named venue is important: query the exact name first. Broad category
  // searches, which can show unrelated parts of the city, are not acceptable.
  const term=String(o.wiki||searchName(p)).trim();
  const queryNames=[term+" "+p.city,term].filter((x,i,arr)=>x&&arr.indexOf(x)===i);
  for(const q of queryNames){
   if(collected.size>=18)break;
   try{
    const pages=await commonsRequest({generator:"search",gsrsearch:q,
      gsrnamespace:"6",gsrlimit:"40"});
    addRows(pages,false);
   }catch(error){console.debug("Commons search unavailable",error);}
  }
  const ranked=[...collected.values()].sort((a,b)=>b.score-a.score||a.title.localeCompare(b.title));
  // Avoid displaying an entire gallery from a single numbered camera burst.
  const limited=[],seriesCount=new Map();
  for(const photo of ranked){
   const series=photo.title.toLowerCase().replace(/\d{1,5}/g,"").replace(/[_()\-.]/g," ").replace(/\s+/g," ").trim();
   const n=seriesCount.get(series)||0;
   if(n>=4)continue;
   limited.push(photo);seriesCount.set(series,n+1);
   if(limited.length===14)break;
  }
  return limited;
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
