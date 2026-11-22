'use strict';
/* Thailand Living Map — GitHub Pages front end.
   Live source: the public, read-only Google Sheets visualization feed.
   Backup: places.json, a snapshot from the same Google Sheet. */
const CONFIG={
  sheetId:'1IBkBs5BBwmalgLfNBYnEakbKVt-Lw4kYu7VIDcxyjx4',
  gid:'426752005', refreshMs:60000
};
const FIELDS=['id','name','city','categories','location_type','address','highlights','price_note','priority','status','lat','lng','verification'];
// Every category has one fixed, saturated, high-contrast ink color.
// The same token drives filter badges, lists, and map stamps.
const CATEGORIES=[
 ['All','All places','#151515'],
 ['Fragrances','Fragrance','#F5008E'],
 ['Independent fashion','Fashion','#1546FF'],
 ['Designer replicas','Replicas','#FF4D00'],
 ['Vintage','Vintage','#009E49'],
 ['Jewelry & artisan','Artisan','#922EFF'],
 ['Creative districts','Design','#00ABD6'],
 ['Gay Nightlife','Nightlife','#FF224A'],
 ['Underground & Raves','Raves','#202020'],
 ['Architecture & heritage','Architecture','#FFCB00'],
 ['Temples & culture','Temples','#F08B00'],
 ['Art & design','Art','#6748D8'],
 ['Bangkok Art Biennale','Biennale','#B542D6'],
 ['Nature & adventure','Nature','#008B77'],
 ['Wildlife','Wildlife','#8DD900'],
 ['Markets & shopping','Markets','#E62BB9'],
 ['Wellness & beauty','Wellness','#07B2A1']
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
function symbolSVG(category,size=21){
 const path=CATEGORY_SYMBOLS[category]||CATEGORY_SYMBOLS.All;
 return '<svg class="category-icon" width="'+size+'" height="'+size+'" viewBox="0 0 32 32" aria-hidden="true" focusable="false" fill="currentColor" xmlns="http://www.w3.org/2000/svg">'+path+'</svg>';
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
let map,markers,markerById=new Map(),geoLayer=null,loading=false,feedFailed=false;
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
 '<span class="place-title"><strong class="place-name">'+esc(p.name)+'</strong><small>'+esc(p.city)+' / '+esc(type.label)+'</small></span>'+
 '<span class="place-go" aria-hidden="true">↗</span></button>'+favoriteButton(p)+'</div></article>';
}
function render(preserveView=false){
 if(window.renderTripMode&&window.renderTripMode(preserveView))return;
 chips();const list=filtered();
 const area=$('map-area-indicator');
 if(area)area.innerHTML=esc(state.city==='All'?'ALL THAILAND':state.city.toUpperCase())+' <span aria-hidden="true">⌄</span>';
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
 window.addEventListener('resize',()=>map.invalidateSize({pan:false}));
}
function renderPins(list,preserveView=false){
 if(!map)return;
 markers.clearLayers();markerById.clear();
 const positions=[];
 for(const p of list){
  if(!coords(p))continue;
  const primary=cats(p)[0]||'All';
  const t=STYLES[primary]||STYLES.All;
  const saved=favorites.has(String(p.id));
  const markup='<div class="print-stamp-pin graphic-pin '+(saved?'favorite':'')+'" style="--pin:'+t.color+';--pin-ink:'+categoryInk(t.color)+'" aria-label="'+esc(t.label)+'"><span class="stamp-symbol">'+symbolSVG(primary,24)+'</span>'+(saved?'<span class="stamp-favorite">'+starSVG(true,11)+'</span>':'')+'</div>';
  const icon=L.divIcon({html:markup,className:'map-marker',iconSize:[38,38],iconAnchor:[19,19]});
  const popup='<div class="popup"><div class="popup-title"><strong>'+esc(p.name)+'</strong>'+favoriteButton(p,'popup')+'</div><p>'+esc(p.highlights||p.location_type)+'</p><a href="'+gmaps(p)+'" target="_blank" rel="noopener noreferrer">Open in Google Maps ↗</a></div>';
  const marker=L.marker([Number(p.lat),Number(p.lng)],{icon,title:String(p.name)}).addTo(markers);
  marker.on('click',()=>focus(p.id));
  markerById.set(p.id,marker);
  positions.push(marker.getLatLng());
 }
 if(preserveView)return;
 if(positions.length===1)map.setView(positions[0],14);
 else if(positions.length>1)map.fitBounds(positions,{paddingTopLeft:[35,70],paddingBottomRight:mobile()?[35,45]:[45,45],maxZoom:state.city==='All'?8:14,animate:false});
 else map.setView(state.city==='Bangkok'?[13.75,100.53]:state.city==='Chiang Mai'?[18.79,98.99]:[16.3,99.5],state.city==='All'?6:12);
 setTimeout(()=>map.invalidateSize({pan:false}),100);
}
/* Discover is a floating, keyboard-accessible dialog, never a persistent sheet. */
function discoverIsOpen(){return !$('places-panel').hidden;}
function setCityMenuOpen(open){
 const nav=$('map-cities'),btn=$('city-toggle');
 if(!nav||!btn)return;
 nav.hidden=!open;
 btn.setAttribute('aria-expanded',String(open));
 btn.classList.toggle('is-open',open);
}
function syncCityMenuLabel(){
 const button=$('city-toggle'),label=$('city-label');
 if(!button||!label)return;
 const text=state.city==='All'?'ALL':state.city==='Bangkok'?'BKK':'CHIANG MAI';
 label.textContent=text;
 button.setAttribute('aria-label','Choose city: '+(state.city==='All'?'All Thailand':state.city));
}
function setDiscoverOpen(open,restoreFocus=false){
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
  setCityMenuOpen(false);
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
 if(title)title.innerHTML=(route?'YOUR ROUTE':'DISCOVER')+' <span aria-hidden="true">↗</span>';
 const loc=$('discover-location');
 if(loc)loc.hidden=route;
 if(route)setCityMenuOpen(false);
 const indicator=$('map-area-indicator');
 if(indicator)indicator.hidden=route;
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
function chooseCity(city){
 if(!['All','Bangkok','Chiang Mai'].includes(city))return;
 state.city=city;closeDetails();
 document.querySelectorAll('button[data-city]').forEach(b=>{const on=b.dataset.city===city;b.classList.toggle('active',on);b.setAttribute('aria-pressed',String(on));});
 syncCityMenuLabel();
 setCityMenuOpen(false);
 render();
}
function init(){
 initializeMap();
 $('city-toggle').addEventListener('click',()=>setCityMenuOpen($('map-cities').hidden));
 $('map-cities').addEventListener('click',e=>{const b=e.target.closest('button[data-city]');if(b){chooseCity(b.dataset.city);$('city-toggle').focus({preventScroll:true});}});
 document.addEventListener('click',e=>{if(!e.target.closest('#discover-location')&&!$('map-cities').hidden)setCityMenuOpen(false);});
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
 $('map-area-indicator').addEventListener('click',()=>{setDiscoverOpen(true);setCityMenuOpen(true);$('city-toggle').focus({preventScroll:true});});
 // A dialog can be closed without sacrificing map position or filters.
 document.addEventListener('keydown',e=>{
  if(e.key==='Escape'){
   if(discoverIsOpen()&&!$('map-cities').hidden){e.preventDefault();setCityMenuOpen(false);$('city-toggle').focus({preventScroll:true});return;}
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
 syncCityMenuLabel();
 updateDiscoverLabel();
 loadSnapshot().then(syncPlaces);
 setInterval(()=>{if(!document.hidden)syncPlaces();},CONFIG.refreshMs);
}
window.addEventListener('DOMContentLoaded',init);
