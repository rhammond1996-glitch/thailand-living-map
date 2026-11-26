'use strict';
/* Thailand Living Map — GitHub Pages front end.
   Live source: the public, read-only Google Sheets visualization feed.
   Backup: places.json, a snapshot from the same Google Sheet. */
const CONFIG={
  sheetId:'1IBkBs5BBwmalgLfNBYnEakbKVt-Lw4kYu7VIDcxyjx4',
  gid:'426752005', refreshMs:60000
};
const FIELDS=['id','name','city','categories','location_type','address','highlights','price_note','priority','status','lat','lng','verification'];
// A restrained four-color category system; all modes share the same semantics.
// Related categories intentionally share a color and a readable icon.
const CATEGORIES=[
 [
  "All",
  "All places",
  "#69769A"
 ],
 [
  "Fragrances",
  "Fragrance",
  "#D94E9D"
 ],
 [
  "Independent fashion",
  "Fashion",
  "#D94E9D"
 ],
 [
  "Designer replicas",
  "Replicas",
  "#D94E9D"
 ],
 [
  "Vintage",
  "Vintage",
  "#D94E9D"
 ],
 [
  "Jewelry & artisan",
  "Artisan",
  "#D94E9D"
 ],
 [
  "Creative districts",
  "Design",
  "#4286D6"
 ],
 [
  "Gay Nightlife",
  "Nightlife",
  "#8563D8"
 ],
 [
  "Underground & Raves",
  "Raves",
  "#8563D8"
 ],
 [
  "Architecture & heritage",
  "Architecture",
  "#4286D6"
 ],
 [
  "Temples & culture",
  "Temples",
  "#4286D6"
 ],
 [
  "Art & design",
  "Art",
  "#4286D6"
 ],
 [
  "Bangkok Art Biennale",
  "Biennale",
  "#4286D6"
 ],
 [
  "Nature & adventure",
  "Nature",
  "#229B79"
 ],
 [
  "Wildlife",
  "Wildlife",
  "#229B79"
 ],
 [
  "Markets & shopping",
  "Markets",
  "#D94E9D"
 ],
 [
  "Wellness & beauty",
  "Wellness",
  "#229B79"
 ]
];
/* PRINT CLUB / graphic symbol language.
 * Handmade 32×32 SVGs, built from geometric silhouettes, not stock pictograms.
 * Reused unchanged on map markers, filter options, list rows and place details.
 * Every icon's background is the fixed solid category color.
 */
const CATEGORY_SYMBOLS={
  // Four connected petals: one place, many interests
  'All':'<rect x="13" y="4" width="6" height="24" rx="3"/><rect x="4" y="13" width="24" height="6" rx="3"/><circle cx="16" cy="16" r="4"/>',
  // Abstract fragrance droplet
  'Fragrances':'<path d="M16 2C13 8 6.4 13.3 6.4 20a9.6 9.6 0 0 0 19.2 0C25.6 13.3 19 8 16 2Z"/>',
  // Reduced folded garment with sculpted neckline
  'Independent fashion':'<path fill-rule="evenodd" d="M10 4 16 7l6-3 8 8-6 6-3-3v14H11V15l-3 3-6-6 8-8Zm3 3a3 3 0 0 0 6 0l-3 1.5L13 7Z"/>',
  // Interlocked tags, referencing alternative design and exchange
  'Designer replicas':'<path fill-rule="evenodd" d="M3 7a4 4 0 0 1 4-4h11l11 11-12 12L3 12V7Zm8 1.5a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5Z"/><path d="m13 25 4 4 12-12-3-3-13 11Z"/>',
  // Eight-point printmaking burst
  'Vintage':'<path d="m16 1.8 3.1 8.2 8.5-4.6-4.6 8.5 8.2 3.1-8.2 3.1 4.6 8.5-8.5-4.6-3.1 8.2-3.1-8.2-8.5 4.6 4.6-8.5-8.2-3.1 8.2-3.1-4.6-8.5 8.5 4.6Z"/>',
  // Jewel as an architectural facet
  'Jewelry & artisan':'<path fill-rule="evenodd" d="M8 3h16l7 10-15 17L1 13 8 3Zm3 5L7 13h18l-4-5H11ZM16 25l6-10H10l6 10Z"/>',
  // Modular grid with one offset cell
  'Creative districts':'<rect x="3" y="3" width="12" height="12" rx="1.5"/><rect x="18" y="3" width="11" height="11" rx="1.5"/><rect x="3" y="18" width="11" height="11" rx="1.5"/><rect x="19" y="19" width="10" height="10" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1"/>',
  // Clover-like blooming club mark
  'Gay Nightlife':'<circle cx="16" cy="8" r="7"/><circle cx="24" cy="16" r="7"/><circle cx="16" cy="24" r="7"/><circle cx="8" cy="16" r="7"/><circle cx="16" cy="16" r="4.5"/>',
  // Opposed strobe bars, expressive X silhouette
  'Underground & Raves':'<path d="M7 3 16 12 25 3l4 4-9 9 9 9-4 4-9-9-9 9-4-4 9-9-9-9 4-4Z"/><rect x="14" y="1" width="4" height="5" rx="1"/><rect x="14" y="26" width="4" height="5" rx="1"/>',
  // Single monumental arch
  'Architecture & heritage':'<path fill-rule="evenodd" d="M3 29V15C3 7.8 8.8 2 16 2s13 5.8 13 13v14H3Zm9-1h8V15a4 4 0 1 0-8 0v13Z"/>',
  // Abstract tiered roof silhouette
  'Temples & culture':'<path d="M16 1 22 8H10L16 1ZM7 10h18l5 7H2l5-7ZM5 19h22l3 5H2l3-5ZM7 26h18v5H7v-5Z"/>',
  // Offset cross-spark with diamond accents
  'Art & design':'<path d="M13 1h6l-1 11 11-1v6l-11-1 1 11h-6l1-11-11 1v-6l11 1-1-11Z"/><circle cx="26" cy="26" r="4"/><circle cx="5" cy="27" r="2"/>',
  // Framed starburst: a temporary exhibition set within its host city
  'Bangkok Art Biennale':'<path fill-rule="evenodd" d="M3 3h26v26H3V3Zm5 5v16h16V8H8Z"/><path d="m16 9 2.1 4.9L23 16l-4.9 2.1L16 23l-2.1-4.9L9 16l4.9-2.1L16 9Z"/>',
  // Leaf, sharply pointed and asymmetrical
  'Nature & adventure':'<path fill-rule="evenodd" d="M29 3C14 3 4 9 4 19c0 5.5 3.5 9 8.5 9C23 28 29 16 29 3ZM7 29l2 2C16 22 21 16 28 9c-11 6-17 13-21 20Z"/>',
  // Graphic paw cluster
  'Wildlife':'<ellipse cx="8" cy="9" rx="3" ry="4.5" transform="rotate(-25 8 9)"/><ellipse cx="16" cy="6" rx="3" ry="4.5"/><ellipse cx="24" cy="9" rx="3" ry="4.5" transform="rotate(25 24 9)"/><path d="M16 14c-4.4 0-5.6 3.3-9.8 7.4C1.6 26 6.3 30 11 28.6c3-1 7-1 10 0C25.7 30 30.4 26 25.8 21.4 21.6 17.3 20.4 14 16 14Z"/>',
  // Market stall canopy reduced to modular bars
  'Markets & shopping':'<path d="M5 4h22l4 11H1L5 4ZM5 17h22v13H5V17Zm6 4v9h10v-9H11Z"/><rect x="11" y="22" width="10" height="2" fill="#fff9f0"/>',
  // Four balanced petals / recovery emblem
  'Wellness & beauty':'<ellipse cx="16" cy="9" rx="5" ry="8"/><ellipse cx="23" cy="16" rx="8" ry="5"/><ellipse cx="16" cy="23" rx="5" ry="8"/><ellipse cx="9" cy="16" rx="8" ry="5"/><circle cx="16" cy="16" r="3"/>'
};
/* CMY plate glyphs: recognizable map categories, with slightly misregistered
 * translucent ink overlaps rather than flat black silhouettes.
 * Drawn on the existing category tiles; no decorative artwork on the map.
 */
const CMY_GLYPHS={
 'All':'<rect x="2" y="3" width="12" height="12" fill="#28D5F1"/><rect x="18" y="3" width="12" height="12" fill="#FFDA33"/><rect x="2" y="18" width="12" height="12" fill="#F52D9B"/><rect x="18" y="18" width="12" height="12" fill="#2040DD"/>',
 'Fragrances':'<rect x="7" y="10" width="18" height="19" rx="1.5" fill="#19DFFA"/><rect x="11" y="5" width="10" height="6" fill="#FFF8F0"/><rect x="13" y="2" width="6" height="4" fill="#152EDD"/><path d="M7 20c7-12 14-5 18 0v9H7z" fill="#F92B9B" opacity=".84"/><path d="M13 15a3 3 0 1 1 6 0 3 3 0 0 1-6 0Z" fill="#E3FF42"/>',
 'Independent fashion':'<path d="m16 3 4 3v2l-4 2-4-2V6z" fill="#1D42F4"/><path d="M16 10 3 23h26L16 10Z" fill="#F52F9A"/><path d="M3 23h26v5H3z" fill="#19D9ED"/><path d="M10 23 16 15l6 8Z" fill="#E7FD44" opacity=".85"/>',
 'Designer replicas':'<rect x="4" y="10" width="24" height="20" rx="1.5" fill="#FFDB36"/><path d="M10 13V8a6 6 0 0 1 12 0v5" fill="none" stroke="#F42D9A" stroke-width="4" stroke-linecap="round"/><path d="M4 19H28V30H4Z" fill="#F52D9A" opacity=".7"/><circle cx="20" cy="23" r="6" fill="#1EDBF4" opacity=".72"/>',
 'Vintage':'<path d="m16 1 3.2 8.2 8.3-4.7-4.7 8.3 8.2 3.2-8.2 3.2 4.7 8.3-8.3-4.7-3.2 8.2-3.2-8.2-8.3 4.7 4.7-8.3-8.2-3.2 8.2-3.2-4.7-8.3 8.3 4.7Z" fill="#FFF7EB"/><circle cx="16" cy="16" r="6" fill="#F72E99"/><circle cx="16" cy="16" r="2.5" fill="#19DDF2"/>',
 'Jewelry & artisan':'<path d="M7 6h18l7 9-16 16L0 15Z" fill="#13DFF6"/><path d="m0 15 8-9 8 9Z" fill="#F42E9D"/><path d="m16 15 9-9 7 9Z" fill="#E2FE3D"/><path d="m0 15 16 16 0-16Z" fill="#FC32A2" opacity=".83"/><path d="m16 15 16 0-16 16Z" fill="#1B44E5" opacity=".75"/>',
 'Creative districts':'<rect x="2" y="2" width="14" height="14" fill="#F32C9C"/><rect x="18" y="2" width="12" height="12" fill="#E8FF41"/><rect x="3" y="18" width="13" height="12" fill="#1344E8"/><rect x="19" y="17" width="11" height="13" fill="#FFF8F1"/><path d="M10 10h12v12H10z" fill="#18DEF3" opacity=".75"/>',
 'Gay Nightlife':'<path d="M16 29 3.5 17.5C-3 9.5 4 2 11 5c2.5 1 4 3 5 4.6C19 4 24 2 28 6c6 6 2 13-12 23Z" fill="#F327A0"/><path d="m16 29-2-19C20 1 28 4 30 10c2 8-6 14-14 19Z" fill="#24D9F3" opacity=".8"/><path d="M3 14h25l-12 15Z" fill="#DFFF3C" opacity=".56"/>',
 'Underground & Raves':'<path d="M17 1 5 17h9l-3 14 17-20h-11Z" fill="#E3FF39"/><path d="M9 20h17l-15 11Z" fill="#F32998" opacity=".9"/><rect x="3" y="3" width="5" height="5" fill="#1BDFF0"/><rect x="25" y="23" width="5" height="5" fill="#16D9F3"/>',
 'Architecture & heritage':'<path d="M3 9 16 2l13 7Z" fill="#F72999"/><rect x="3" y="10" width="26" height="4" fill="#E7FC49"/><rect x="6" y="15" width="5" height="12" fill="#1AD6F5"/><rect x="14" y="15" width="5" height="12" fill="#FFF9EF"/><rect x="22" y="15" width="5" height="12" fill="#1AD6F5"/><rect x="2" y="28" width="28" height="3" fill="#E3FC40"/>',
 'Temples & culture':'<path d="m16 0 4 7h-8Z" fill="#E4FF3F"/><path d="M9 9h14l5 5H4z" fill="#F42C9B"/><path d="M5 16h22l4 6H1Z" fill="#FFAC39"/><path d="M9 23h14v7H9Z" fill="#FFF7EA"/><path d="M13 23h6v7h-6Z" fill="#28D7F5"/>',
 'Art & design':'<path d="m16 1 15 15-15 15L1 16Z" fill="#28DFF8"/><path d="m16 1 15 15-15 0Z" fill="#F02F9A" opacity=".86"/><path d="m1 16 15 15 0-15Z" fill="#E2FE42" opacity=".9"/><path d="M16 9 23 16 16 23 9 16Z" fill="#1A35D6" opacity=".78"/>',
 'Bangkok Art Biennale':'<rect x="2" y="2" width="28" height="28" fill="#FFEE60"/><rect x="5" y="5" width="22" height="22" fill="#F42D9C"/><path d="m16 4 2.8 8.8L28 16l-9.2 3.2L16 28l-2.8-8.8L4 16l9.2-3.2Z" fill="#1AD9EE"/><circle cx="16" cy="16" r="4" fill="#FFF7EF"/>',
 'Nature & adventure':'<path d="M0 29 13 6 24 29Z" fill="#26DFF5"/><path d="m11 29 11-17 10 17Z" fill="#1439E8"/><circle cx="25" cy="6" r="6" fill="#E8FF43"/><path d="m0 29 13-23 0 23Z" fill="#E3FF3A" opacity=".76"/>',
 'Wildlife':'<ellipse cx="7" cy="9" rx="3.5" ry="5" fill="#E2FE43"/><ellipse cx="16" cy="6" rx="3.5" ry="5" fill="#FFF8ED"/><ellipse cx="25" cy="9" rx="3.5" ry="5" fill="#1AD8EF"/><path d="M16 14c-5 0-7 5-11 9-3 6 3 8 8 5 2-1 4-1 6 0 5 3 11 1 8-5-4-4-6-9-11-9Z" fill="#F32D9A"/>',
 'Markets & shopping':'<rect x="3" y="12" width="26" height="18" fill="#FFF7ED"/><rect x="3" y="4" width="26" height="8" fill="#E3FF3C"/><path d="M3 4h7v8H3zm13 0h6v8h-6Z" fill="#F32D9A"/><path d="M10 13v16h12V13Z" fill="#1BD8F5" opacity=".8"/><rect x="12" y="20" width="8" height="10" fill="#1743E4"/>',
 'Wellness & beauty':'<path d="M16 16 8 1C4 8 5 15 16 16Z" fill="#F72D9A"/><path d="M16 16 24 1c4 8 3 15-8 15Z" fill="#1BDCF2"/><path d="M16 16 2 13c1 10 6 12 14 3Z" fill="#E2FD42" opacity=".86"/><path d="m16 16 14-3c-1 10-6 12-14 3Z" fill="#FF6C36" opacity=".83"/><path d="m16 16-10 7c5 9 10 8 10-7Z" fill="#19DDF4"/><path d="m16 16 10 7c-5 9-10 8-10-7Z" fill="#F42F99"/>'
};
const STYLES=Object.fromEntries(CATEGORIES.map(([key,label,color])=>[
 key,{label,color,symbol:CATEGORY_SYMBOLS[key]||CATEGORY_SYMBOLS.All}
]));
// Contrast-aware foreground: black graphic marks on bright pigments,
// white on the handful of deep colors where black would disappear.
function categoryInk(hex){
 const channels=hex.replace('#','').match(/.{2}/g).map(h=>parseInt(h,16)/255);
 const linear=channels.map(v=>v<=.04045?v/12.92:((v+.055)/1.055)**2.4);
 const luminance=.2126*linear[0]+.7152*linear[1]+.0722*linear[2];
 return luminance>.18?'#151515':'#FFFFFF';
}
/* One visual vocabulary across light/dark and across all 17 interests.
   Each detailed interest uses a recognizable icon from its broader category. */
const UI_ICON_GROUP={
 'Fragrances':'shopping','Independent fashion':'shopping','Designer replicas':'shopping',
 'Vintage':'shopping','Jewelry & artisan':'shopping','Markets & shopping':'shopping',
 'Gay Nightlife':'nightlife','Underground & Raves':'nightlife',
 'Creative districts':'art','Architecture & heritage':'art','Temples & culture':'art',
 'Art & design':'art','Bangkok Art Biennale':'art',
 'Nature & adventure':'nature','Wildlife':'nature','Wellness & beauty':'nature','All':'all'
};
const UI_ICON_PATH={
 shopping:'<rect x="4" y="8" width="16" height="13" rx="2"/><path d="M8 9V6a4 4 0 0 1 8 0v3"/>',
 nightlife:'<path d="M9 18V5l12-2v13"/><circle cx="6.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="16.5" r="2.5"/>',
 art:'<rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="8" cy="9" r="1"/><path d="m5 17 5-5 3 3 3-4 3 6"/>',
 nature:'<path d="M20 4c-8 0-15 3-15 11a6 6 0 0 0 6 6c8 0 11-7 9-17Z"/><path d="M5 20c3-4 7-7 12-10"/>',
 all:'<circle cx="12" cy="12" r="9"/><path d="M12 5v14M5 12h14"/>'
};
function symbolSVG(category,size=21){
 const group=UI_ICON_GROUP[category]||'all';
 return '<svg class="category-icon" width="'+size+'" height="'+size+'" viewBox="0 0 24 24" aria-hidden="true" focusable="false" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" xmlns="http://www.w3.org/2000/svg">'+UI_ICON_PATH[group]+'</svg>';
}
function categoryStamp(category){
 const item=STYLES[category]||STYLES.All;
 return '<span class="category-swatch" style="--category:'+item.color+';--category-ink:'+categoryInk(item.color)+'" aria-hidden="true">'+symbolSVG(category,20)+'</span>';
}
const STAR_PATH='<path d="m12 2.7 2.9 5.9 6.5.9-4.7 4.6 1.1 6.5L12 17.5l-5.8 3.1 1.1-6.5-4.7-4.6 6.5-.9z"/>';
function starSVG(active,size=19){
 return '<svg viewBox="0 0 24 24" width="'+size+'" height="'+size+'" stroke="currentColor" fill="'+(active?'currentColor':'none')+'" stroke-width="1.7" stroke-linejoin="round" aria-hidden="true">'+STAR_PATH+'</svg>';
}
const FAVORITES_KEY='thailand-living-map:favorites:v1';
function readFavorites(){
 try{const data=JSON.parse(localStorage.getItem(FAVORITES_KEY)||'[]');return new Set(Array.isArray(data)?data.map(String):[]);}catch{return new Set();}
}
const favorites=readFavorites();
function favoriteButton(p,where='list'){
 const saved=favorites.has(String(p.id));
 return '<button type="button" class="favorite-star '+(saved?'is-favorite':'')+'" data-favorite="'+esc(p.id)+'" aria-pressed="'+saved+'" aria-label="'+(saved?'Remove ':'Add ')+esc(p.name)+(saved?' from favorites':' to favorites')+'" title="'+(saved?'Remove from favorites':'Add to favorites')+'">'+starSVG(saved,where==='detail'?22:19)+'</button>';
}
function syncFavoriteButtons(){
 document.querySelectorAll('button[data-favorite]').forEach(button=>{
  const id=button.dataset.favorite,p=state.places.find(p=>String(p.id)===String(id));
  const selected=favorites.has(String(id));
  button.classList.toggle('is-favorite',selected);
  button.setAttribute('aria-pressed',String(selected));
  button.setAttribute('aria-label',(selected?'Remove ':'Add ')+(p?.name||'place')+(selected?' from favorites':' to favorites'));
  button.title=selected?'Remove from favorites':'Add to favorites';
  button.innerHTML=starSVG(selected,button.closest('#place-detail')?22:19);
 });
}
function toggleFavorite(id){
 const p=state.places.find(p=>String(p.id)===String(id));if(!p)return;
 const key=String(id);
 if(favorites.has(key))favorites.delete(key);else favorites.add(key);
 try{localStorage.setItem(FAVORITES_KEY,JSON.stringify([...favorites]));}catch(err){console.warn('Favorites could not be saved on this device',err);}
 if(state.favoritesOnly&&!favorites.has(key))closeDetails();
 render(true);
 syncFavoriteButtons();
}

const state={places:[],city:'All',category:'All',query:'',favoritesOnly:false,selected:null,source:'',signature:''};
let map,markers,markerById=new Map(),exploreEntries=[],geoLayer=null,loading=false,feedFailed=false;
const $=id=>document.getElementById(id);
const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','\'':'&#39;'}[c]));
const cats=p=>String(p.categories||'').split('|').map(s=>s.trim()).filter(Boolean);
const mobile=()=>matchMedia('(max-width:720px)').matches;
const coords=p=>p.lat!==null&&p.lng!==null&&p.lat!==''&&p.lng!==''&&Number.isFinite(Number(p.lat))&&Number.isFinite(Number(p.lng))&&Number(p.lat)>5&&Number(p.lat)<22&&Number(p.lng)>97&&Number(p.lng)<107;
const gmaps=p=>'https://www.google.com/maps/search/?api=1&query='+encodeURIComponent(p.name+', '+p.address);
const directions=p=>'https://www.google.com/maps/dir/?api=1&destination='+encodeURIComponent(p.name+', '+p.address);
function clean(rows){
 const seen=new Set();
 return rows.map(row=>{const p={};for(const field of FIELDS)p[field]=row[field]??'';p.lat=p.lat===''||p.lat===null?null:Number(p.lat);p.lng=p.lng===''||p.lng===null?null:Number(p.lng);return p;})
 .filter(p=>{if(!p.id||!p.name||seen.has(String(p.id))||['hidden','archived'].includes(String(p.status).toLowerCase()))return false;seen.add(String(p.id));return true;});
}
function filtered(){
 return state.places.filter(p=>(state.city==='All'||p.city===state.city)&&
 (state.category==='All'||cats(p).includes(state.category))&&
 (!state.favoritesOnly||favorites.has(String(p.id)))&&
 (!state.query||[p.name,p.city,p.categories,p.location_type,p.address,p.highlights,p.price_note].join(' ').toLowerCase().includes(state.query)))
 .sort((a,b)=>String(a.city).localeCompare(String(b.city))||String(a.name).localeCompare(String(b.name)));
}
function refreshStatus(message,type='live'){
 $('sync-label').textContent=message;
 $('sync-status').className='sync '+(type==='live'?'':type);
 $('sync-status').title=message;
}
function updatePlaces(data,source){
 if(!data?.places||!Array.isArray(data.places))throw new Error('Invalid destination feed');
 const places=clean([...data.places,...(window.TRIP_PLACES||[])]);
 if(!places.length)throw new Error('Destination feed is empty');
 const signature=JSON.stringify(places);
 state.source=source;
 refreshStatus(source==='live'?'Live · Google Sheets':'Saved snapshot',source==='live'?'live':'snapshot');
 if(signature!==state.signature){state.signature=signature;state.places=places;render();}
}
async function loadSnapshot(){
 try{const response=await fetch('./places.json?version=1',{cache:'no-store'});if(!response.ok)throw new Error('Snapshot unavailable');const data=await response.json();if(state.source!=='live')updatePlaces(data,'snapshot');}
 catch(err){if(!state.places.length){$('places-list').innerHTML='<div class="empty">Could not load saved destinations. Please reload the map.</div>';refreshStatus('Offline','error');}}
}
// Google Visualization public read-only sheet endpoint uses JSONP. No Sheets API key,
// private Google account credentials, or database write permissions are embedded in the website.
function loadLive(){
 return new Promise((resolve,reject)=>{
  if(loading){resolve(false);return;}
  loading=true;
  const cb='__thaiSheet'+Math.random().toString(36).slice(2);
  const script=document.createElement('script');
  let done=false;
  const finish=(error,response)=>{if(done)return;done=true;clearTimeout(timer);delete window[cb];script.remove();loading=false;error?reject(error):resolve(response);};
  window[cb]=response=>{
   try{
    if(response?.status==='error')throw new Error('Google Sheet is not published for public reading');
    const cols=response?.table?.cols||[];
    const rows=response?.table?.rows||[];
    if(!cols.length)throw new Error('Invalid Google Sheet response');
    const names=cols.map((col,i)=>String(col.label||FIELDS[i]||'').trim());
    const data=rows.map(row=>Object.fromEntries(names.map((name,i)=>[name,row.c?.[i]?.v??''])));
    updatePlaces({places:data},'live');
    feedFailed=false;
    finish(null,true);
   }catch(err){finish(err);}
  };
  script.onerror=()=>finish(new Error('Could not reach published Sheet'));
  const timer=setTimeout(()=>finish(new Error('Google Sheet timed out')),9000);
  const tqx='out:json;responseHandler:'+cb;
  script.src='https://docs.google.com/spreadsheets/d/'+CONFIG.sheetId+'/gviz/tq?gid='+CONFIG.gid+'&headers=1&tqx='+encodeURIComponent(tqx)+'&cachebust='+Date.now();
  document.head.appendChild(script);
 });
}
async function syncPlaces(){
 try{await loadLive();}catch(err){feedFailed=true;if(!state.places.length)await loadSnapshot();else refreshStatus('Saved snapshot','snapshot');console.info('Live Sheet unavailable; using snapshot:',err.message);}
}
function chips(){
 $('categories').innerHTML=CATEGORIES.map(([key,label])=>'<button type="button" data-category="'+esc(key)+'" aria-pressed="'+(state.category===key)+'" class="'+(state.category===key?'active':'')+'">'+categoryStamp(key)+'<span>'+esc(label)+'</span></button>').join('');
}
function setFilterOpen(open){
 $('filter-panel').hidden=!open;
 $('category-toggle').setAttribute('aria-expanded',String(open));
 $('places-panel').classList.toggle('filters-open',open);
}
function placeCard(p,index=0){
 const primary=cats(p)[0]||'All';
 const type=STYLES[primary]||STYLES.All;
 return '<article class="place '+(state.selected===p.id?'selected':'')+'" data-id="'+esc(p.id)+'">'+
 '<div class="place-head"><button type="button" class="place-open" data-place-open="'+esc(p.id)+'" aria-label="View '+esc(p.name)+' details">'+
 '<span class="place-number">'+String(index+1).padStart(2,'0')+'</span>'+categoryStamp(primary)+
 '<span class="place-title"><strong class="place-name">'+esc(p.name)+'</strong><small>'+esc(p.city)+' / '+esc(type.label)+(window.VENUE_RESEARCH?.[p.id]?.confidence==='needs-review'?' · <span class="place-to-review">VERIFY STORE</span>':'')+'</small></span>'+
 '<span class="place-go" aria-hidden="true">↗</span></button>'+favoriteButton(p)+'</div></article>';
}
function render(preserveView=false){
 if(window.renderTripMode&&window.renderTripMode(preserveView))return;
 chips();const list=filtered();
 syncMapAreaSelector();
 $('results').textContent=list.length+' places';
 $('favorites-count').textContent=favorites.size;
 $('filter-value').textContent=state.category==='All'?'FILTER':(STYLES[state.category]?.label||'FILTER');
 $('category-toggle').setAttribute('aria-label',state.category==='All'?'Filter by interest':'Filter by interest, selected: '+(STYLES[state.category]?.label||state.category));
 $('favorites-only').setAttribute('aria-label',(state.favoritesOnly?'Show all places':'Show saved places')+' ('+favorites.size+')');
 $('favorites-only').title=state.favoritesOnly?'Show all places':'Show saved places';
 $('category-toggle').classList.toggle('has-filter',state.category!=='All');
 $('favorites-only').classList.toggle('active',state.favoritesOnly);
 $('favorites-only').setAttribute('aria-pressed',String(state.favoritesOnly));
 $('drawer-summary').textContent=list.length+' places'+(state.city==='All'?'':' · '+state.city);
 $('places-list').innerHTML=list.length?list.map((p,i)=>placeCard(p,i)).join(''):'<div class="empty">'+(state.favoritesOnly?'No favorites here yet. Choose All places and tap a star to save something.':'No places match these filters. Try another category.')+'</div>';
 renderPins(list,preserveView);
}

/**
 * Leaflet 1.9's doubleClickZoom responds to a 'dblclick' event, which mobile
 * Safari may not dispatch on a finger double tap. Detect actual touch taps.
 * Keep pinch zoom and dragging untouched; ignore map controls and markers.
 */
function enableMobileDoubleTap(activeMap){
 const surface=activeMap.getContainer();
 let press=null, previousTap=null;
 const TAP_MS=340, PRESS_MS=320, SPREAD_PX=42, MOVE_PX=18;
 const isUI=target=>!!(target instanceof Element &&
  target.closest('.leaflet-marker-icon, .leaflet-popup, .leaflet-control, button, a, input, [role="button"]'));
 const point=t=>({x:t.clientX,y:t.clientY});
 const distance=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
 surface.addEventListener('touchstart',event=>{
  if(event.touches.length!==1||isUI(event.target)){
   press=null;previousTap=null;return;
  }
  press={...point(event.touches[0]),time:performance.now(),moved:false};
 },{capture:true,passive:true});
 surface.addEventListener('touchmove',event=>{
  if(!press)return;
  if(event.touches.length!==1){press=null;previousTap=null;return;}
  if(distance(point(event.touches[0]),press)>MOVE_PX){
   press.moved=true;previousTap=null;
  }
 },{capture:true,passive:true});
 surface.addEventListener('touchcancel',()=>{press=null;previousTap=null;},{capture:true,passive:true});
 surface.addEventListener('touchend',event=>{
  if(!press||event.changedTouches.length!==1||event.touches.length!==0){
   press=null;return;
  }
  const ended=point(event.changedTouches[0]);
  const now=performance.now();
  const valid=!press.moved&&now-press.time<=PRESS_MS&&distance(ended,press)<=MOVE_PX;
  press=null;
  if(!valid){previousTap=null;return;}
  if(previousTap&&now-previousTap.time<=TAP_MS&&distance(ended,previousTap)<=SPREAD_PX){
   previousTap=null;
   // Prevent Safari's browser-page double-tap zoom; only the map should zoom.
   if(event.cancelable)event.preventDefault();
   event.stopPropagation();
   const rect=surface.getBoundingClientRect();
   const anchor=L.point(ended.x-rect.left,ended.y-rect.top);
   const nextZoom=Math.min(activeMap.getMaxZoom(),activeMap.getZoom()+1);
   activeMap.setZoomAround(anchor,nextZoom,{animate:true});
  }else{
   previousTap={...ended,time:now};
  }
 },{capture:true,passive:false});
}

function initializeMap(){
 if(!window.L){$('map-error').hidden=false;return;}
 map=L.map('map',{zoomControl:false,scrollWheelZoom:!L.Browser.touch,doubleClickZoom:!L.Browser.touch,touchZoom:true,tapHold:false}).setView([16.3,99.5],6);
 if(L.Browser.touch)enableMobileDoubleTap(map);
 L.control.zoom({position:'bottomright'}).addTo(map);
 // Vector labels prefer English, and the print-style basemap is drawn beneath
 // all existing Leaflet markers, favorites, and itinerary paths.
 if(typeof window.installPrintBasemap==='function')window.installPrintBasemap(map);
 else{
  L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:19,attribution:'&copy; OpenStreetMap contributors'}).addTo(map);
 }
 markers=L.layerGroup().addTo(map);
 // Recompose only Explore pins when zoom changes; itinerary route pins and
 // polylines remain fully independent and are never clustered.
 map.on('zoomend',()=>{if(!document.body.classList.contains('itinerary-mode'))renderExploreClusters();});
 $('map').addEventListener('click',event=>{
  const place=event.target.closest('[data-cluster-focus]');
  if(!place)return;
  event.preventDefault();
  event.stopPropagation();
  map.closePopup();
  focus(place.dataset.clusterFocus);
 });
 window.addEventListener('resize',()=>map.invalidateSize({pan:false}));
}
/* Print atlas clustering. Each place keeps its exact geographical coordinate.
 * At broader zoom levels, nearby points become a transparent overprint badge
 * with a numeric count for groups of six or more. Groups of 2–5
 * stay individually visible and may overlap; zooming separates them.
 * Same-building duplicates remain discoverable in a small list at street zoom.
 */
function clusterRadius(zoom){
 return zoom<=8?66:zoom<=11?59:zoom<=14?51:zoom<=16?43:35;
}
function collectMapClusters(entries,zoom,project){
 const radius=clusterRadius(zoom);
 const squared=radius*radius;
 const groups=[];
 // Input rows keep a stable order so zooming/panning does not shuffle markers.
 for(const item of entries){
  const xy=project(item.latlng,zoom);
  let nearest=null,nearestDistance=squared;
  for(const group of groups){
   const dx=xy.x-group.x,dy=xy.y-group.y;
   const distance=dx*dx+dy*dy;
   if(distance<nearestDistance){nearest=group;nearestDistance=distance;}
  }
  if(nearest){
   const n=nearest.items.length;
   nearest.x=(nearest.x*n+xy.x)/(n+1);
   nearest.y=(nearest.y*n+xy.y)/(n+1);
   nearest.items.push(item);
  }else{
   groups.push({x:xy.x,y:xy.y,items:[item]});
  }
 }
 return groups;
}
function clusterCard(cluster){
 const count=cluster.items.length;
 const countLabel=count>99?'99+':String(count);
 const saved=cluster.items.filter(x=>favorites.has(String(x.p.id))).length;
 return '<div class="ink-cluster" aria-hidden="true">'+
  '<span class="ink-cluster-plate plate-magenta"></span>'+
  '<span class="ink-cluster-plate plate-cyan"></span>'+
  '<span class="ink-cluster-plate plate-lime"></span>'+
  '<span class="ink-cluster-center">'+countLabel+'</span>'+
  '<span class="ink-cluster-plus">+</span>'+
  (saved?'<span class="ink-cluster-saved">'+starSVG(true,11)+'</span>':'')+
  '</div>';
}
function clusterPlaceList(cluster){
 const names=cluster.items.slice(0,40).map(entry=>{
  const p=entry.p;
  const type=STYLES[cats(p)[0]||'All']||STYLES.All;
  return '<button type="button" class="cluster-place-choice" data-cluster-focus="'+esc(p.id)+'">'+
   '<span class="cluster-choice-ink" style="background:'+type.color+'"></span>'+
   '<span>'+esc(p.name)+'</span><span aria-hidden="true">↗</span></button>';
 }).join('');
 const remaining=cluster.items.length-40;
 return '<div class="cluster-popup-list"><strong>'+cluster.items.length+' PLACES HERE</strong>'+
   '<p>Multiple destinations share this area. Choose one to explore.</p>'+
   '<div class="cluster-choice-list">'+names+'</div>'+
   (remaining>0?'<small>More places are available in Discover.</small>':'')+'</div>';
}
function renderExploreClusters(){
 if(!map||!markers||document.body.classList.contains('itinerary-mode'))return;
 markers.clearLayers();
 if(!exploreEntries.length)return;
 const zoom=map.getZoom();
 const groups=collectMapClusters(exploreEntries,zoom,(latlng,z)=>map.project(latlng,z));
 for(const group of groups){
  if(group.items.length<6){
   // Groups of 2–5 remain individual destination glyphs, even if overlapping.
   // Only six or more nearby places are represented by a combined cluster.
   for(const entry of group.items)markers.addLayer(entry.marker);
   continue;
  }
  const centroid=map.unproject(L.point(group.x,group.y),zoom);
  const n=group.items.length;
  const icon=L.divIcon({
   html:clusterCard(group),
   className:'map-marker ink-cluster-marker',
   iconSize:[50,50],
   iconAnchor:[25,25]
  });
  const clusterMarker=L.marker(centroid,{
   icon,
   keyboard:true,
   title:n+' places nearby. '+(zoom<17?'Zoom in to see them.':'Select a place.'),
   alt:n+' places. '+(zoom<17?'Tap to zoom in.':'Tap to choose a destination.'),
   zIndexOffset:100
  }).addTo(markers);
  clusterMarker.on('click',()=>{
   if(map.getZoom()<17){
    // Two levels at a time gives an obvious reveal without losing context.
    map.flyTo(centroid,Math.min(17,map.getZoom()+2),{animate:true,duration:0.45});
   }else{
    const popup=L.popup({maxWidth:290,minWidth:210,autoPan:true,closeButton:true})
     .setLatLng(centroid)
     .setContent(clusterPlaceList(group))
     .openOn(map);
    // Leaflet stops popup click events before they reach the map container.
    // Bind the destination choices on the popup itself so they always work.
    const element=popup.getElement();
    if(element)element.addEventListener('click',event=>{
     const place=event.target.closest('[data-cluster-focus]');
     if(!place)return;
     event.preventDefault();
     event.stopPropagation();
     map.closePopup(popup);
     focus(place.dataset.clusterFocus);
    });
   }
  });
 }
}
function renderPins(list,preserveView=false){
 if(!map)return;
 markers.clearLayers();
 markerById.clear();
 exploreEntries=[];
 const positions=[];
 for(const p of list){
  if(!coords(p))continue;
  const primary=cats(p)[0]||'All';
  const t=STYLES[primary]||STYLES.All;
  const saved=favorites.has(String(p.id));
  const markup='<span class="ink-free-pin '+(saved?'favorite':'')+'" style="--pin:'+t.color+'" aria-hidden="true">'+
   '<span class="ink-free-icon">'+symbolSVG(primary,34)+'</span>'+
   (saved?'<span class="ink-free-favorite">'+starSVG(true,11)+'</span>':'')+
   '</span>';
  const icon=L.divIcon({html:markup,className:'map-marker map-glyph-marker',iconSize:[42,42],iconAnchor:[21,21]});
  const marker=L.marker([Number(p.lat),Number(p.lng)],{icon,title:String(p.name),alt:String(p.name)});
  marker.on('click',()=>focus(p.id));
  markerById.set(p.id,marker);
  const latlng=marker.getLatLng();
  exploreEntries.push({p,marker,latlng});
  positions.push(latlng);
 }
 // Re-render clusters whenever the map changes scale. No view animation
 // means filtered results preserve the precise city/selection the user chose.
 if(!preserveView){
  if(positions.length===1)map.setView(positions[0],14);
  else if(positions.length>1)map.fitBounds(positions,{paddingTopLeft:[35,70],paddingBottomRight:mobile()?[35,45]:[45,45],maxZoom:state.city==='All'?8:14,animate:false});
  else map.setView(state.city==='Bangkok'?[13.75,100.53]:state.city==='Chiang Mai'?[18.79,98.99]:[16.3,99.5],state.city==='All'?6:12);
  setTimeout(()=>map.invalidateSize({pan:false}),100);
 }
 renderExploreClusters();
}
/* Discover is a floating, keyboard-accessible dialog, never a persistent sheet. */
function discoverIsOpen(){return !$('places-panel').hidden;}
function setDiscoverOpen(open,restoreFocus=false){
 if(open)setMapAreaMenuOpen(false);
 const panel=$('places-panel'),scrim=$('discover-scrim'),toggle=$('discover-toggle');
 if(open===discoverIsOpen())return;
 if(open){
  closeDetails();
  panel.hidden=false;
  scrim.hidden=false;
  document.body.classList.add('discover-open');
  toggle.setAttribute('aria-expanded','true');
  toggle.setAttribute('aria-label',document.body.classList.contains('itinerary-mode')?'Close route panel':'Close Discover destinations');
  // Focus the close control, not the search input: no surprise iOS keyboard.
  $('discover-close').focus({preventScroll:true});
 }else{
  panel.hidden=true;
  scrim.hidden=true;
  document.body.classList.remove('discover-open');
  toggle.setAttribute('aria-expanded','false');
  toggle.setAttribute('aria-label',document.body.classList.contains('itinerary-mode')?'Open route panel':'Open Discover destinations');
  if(restoreFocus)toggle.focus({preventScroll:true});
 }
}
function updateDiscoverLabel(){
 const route=document.body.classList.contains('itinerary-mode');
 const toggle=$('discover-toggle'),title=$('discover-title');
 if(toggle){
  const label=toggle.querySelector('.discover-button-label');
  if(label)label.textContent=route?'ROUTE':'DISCOVER';
  toggle.setAttribute('aria-label',(discoverIsOpen()?'Close ':'Open ')+(route?'route panel':'Discover destinations'));
 }
 if(title)title.textContent=route?'YOUR ROUTE':'DISCOVER';
 const loc=$('discover-location');
 if(loc)loc.hidden=route;
 const selector=$('map-area-selector');
 if(selector)selector.hidden=route;
 if(route)setMapAreaMenuOpen(false);
}
function closeDetails(){state.selected=null;$('place-detail').hidden=true;document.querySelectorAll('.place').forEach(x=>x.classList.remove('selected'));}
function focus(id){
 const p=state.places.find(x=>String(x.id)===String(id));if(!p)return;
 state.selected=p.id;
 document.querySelectorAll('.place').forEach(x=>x.classList.toggle('selected',x.dataset.id===String(id)));
 setDiscoverOpen(false);
 const marker=markerById.get(p.id);
 // All destinations now open the same contextual dossier on mobile and desktop.
 if(typeof window.openPlaceProfile==='function')window.openPlaceProfile(p);
 if(marker&&map){
  if(typeof marker.closePopup==='function')marker.closePopup();
  const destination=marker.getLatLng();
  map.flyTo(destination,Math.max(14,map.getZoom()),{duration:.45});
  if(!mobile())map.once('moveend',()=>{if(state.selected===p.id)map.panBy([Math.min(175,Math.max(0,Math.floor(map.getSize().x/4))),0],{animate:true,duration:.25});});
 }else if(map&&coords(p)){
  map.flyTo([Number(p.lat),Number(p.lng)],Math.max(13,map.getZoom()),{duration:.45});
 }
}
function setMapAreaMenuOpen(open,restoreFocus=false){
 const menu=$('map-area-menu'),button=$('map-area-indicator');
 if(!menu||!button)return;
 menu.hidden=!open;
 button.setAttribute('aria-expanded',String(open));
 button.classList.toggle('is-open',open);
 if(restoreFocus)button.focus({preventScroll:true});
}
function syncMapAreaSelector(){
 const name=state.city==='All'?'All Thailand':state.city;
 const button=$('map-area-indicator');
 if(button){
  button.innerHTML=esc(name.toUpperCase())+' <span aria-hidden="true">⌄</span>';
  button.setAttribute('aria-label','Choose map area: '+name);
 }
 document.querySelectorAll('button[data-map-city]').forEach(b=>{
  const selected=b.dataset.mapCity===state.city;
  b.classList.toggle('active',selected);
  b.setAttribute('aria-pressed',String(selected));
 });
}
function chooseCity(city){
 if(!['All','Bangkok','Chiang Mai'].includes(city))return;
 state.city=city;closeDetails();
 setMapAreaMenuOpen(false);
 document.querySelectorAll('button[data-city]').forEach(b=>{const on=b.dataset.city===city;b.classList.toggle('active',on);b.setAttribute('aria-pressed',String(on));});
 syncMapAreaSelector();
 render();
}
function init(){
 initializeMap();
 $('map-cities').addEventListener('click',e=>{const b=e.target.closest('button[data-city]');if(b)chooseCity(b.dataset.city);});
 $('categories').addEventListener('click',e=>{const b=e.target.closest('button[data-category]');if(b){state.category=b.dataset.category;closeDetails();render();setFilterOpen(false);}});
 $('category-toggle').addEventListener('click',()=>setFilterOpen($('filter-panel').hidden));
 $('clear-category').addEventListener('click',()=>{state.category='All';closeDetails();render();setFilterOpen(false);});
 $('place-search').addEventListener('input',e=>{state.query=e.target.value.trim().toLowerCase();render();});
 $('favorites-only').addEventListener('click',()=>{state.favoritesOnly=!state.favoritesOnly;closeDetails();render();});
 $('places-list').addEventListener('click',e=>{const star=e.target.closest('button[data-favorite]');if(star){toggleFavorite(star.dataset.favorite);return;}const c=e.target.closest('.place');if(c)focus(c.dataset.id);});
 $('places-list').addEventListener('keydown',e=>{if(e.target.closest('button'))return;if(['Enter',' '].includes(e.key)){const c=e.target.closest('.place');if(c){e.preventDefault();focus(c.dataset.id);}}});
 $('place-detail').addEventListener('click',e=>{const star=e.target.closest('button[data-favorite]');if(star){toggleFavorite(star.dataset.favorite);return;}if(e.target.closest('.close-detail'))closeDetails();});
 $('map').addEventListener('click',e=>{const star=e.target.closest('button[data-favorite]');if(star){e.preventDefault();e.stopPropagation();toggleFavorite(star.dataset.favorite);}});
 $('discover-toggle').addEventListener('click',()=>setDiscoverOpen(!discoverIsOpen(),true));
 $('discover-close').addEventListener('click',()=>setDiscoverOpen(false,true));
 $('discover-scrim').addEventListener('click',()=>setDiscoverOpen(false,true));
 $('map-area-indicator').addEventListener('click',()=>setMapAreaMenuOpen($('map-area-menu').hidden));
 $('map-area-menu').addEventListener('click',e=>{
  const selected=e.target.closest('button[data-map-city]');
  if(selected){chooseCity(selected.dataset.mapCity);$('map-area-indicator').focus({preventScroll:true});}
 });
 document.addEventListener('pointerdown',e=>{
  if(!$('map-area-menu').hidden&&!e.target.closest('#map-area-selector'))setMapAreaMenuOpen(false);
 });
 // A dialog can be closed without sacrificing map position or filters.
 document.addEventListener('keydown',e=>{
  if(e.key==='Escape'){
   if(!$('map-area-menu').hidden){e.preventDefault();setMapAreaMenuOpen(false,true);return;}
   if(discoverIsOpen()){e.preventDefault();setDiscoverOpen(false,true);}
   else if(state.selected!==null){e.preventDefault();closeDetails();}
   return;
  }
  if(e.key!=='Tab'||!discoverIsOpen())return;
  const panel=$('places-panel');
  const focusable=Array.from(panel.querySelectorAll('button:not([disabled]),input:not([disabled]),a[href],select:not([disabled]),[tabindex]:not([tabindex="-1"])'))
   .filter(el=>el.getClientRects().length>0);
  if(!focusable.length)return;
  const first=focusable[0],last=focusable[focusable.length-1];
  if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus();}
  else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();}
 });
 $('locate').addEventListener('click',()=>{
  if(!navigator.geolocation){alert('Location is not available on this device.');return;}
  const btn=$('locate');btn.disabled=true;btn.textContent='…';
  navigator.geolocation.getCurrentPosition(pos=>{
   btn.disabled=false;btn.textContent='⌖';
   if(map){const loc=[pos.coords.latitude,pos.coords.longitude];map.setView(loc,14,{animate:true});if(geoLayer)map.removeLayer(geoLayer);geoLayer=L.circleMarker(loc,{radius:8,color:'#fff',weight:3,fillColor:'#276dd5',fillOpacity:1}).addTo(map).bindTooltip('You are here');}
   setDiscoverOpen(false);closeDetails();
  },()=>{btn.disabled=false;btn.textContent='⌖';alert('Location not available or permission was declined.');},{enableHighAccuracy:false,timeout:12000,maximumAge:30000});
 });
 updateDiscoverLabel();
 loadSnapshot().then(syncPlaces);
 setInterval(()=>{if(!document.hidden)syncPlaces();},CONFIG.refreshMs);
}
window.addEventListener('DOMContentLoaded',init);
