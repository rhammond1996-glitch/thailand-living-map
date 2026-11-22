'use strict';
/* Thailand Living Map — GitHub Pages front end.
   Live source: the public, read-only Google Sheets visualization feed.
   Backup: places.json, a snapshot from the same Google Sheet. */
const CONFIG={
  sheetId:'1IBkBs5BBwmalgLfNBYnEakbKVt-Lw4kYu7VIDcxyjx4',
  gid:'426752005', refreshMs:60000
};
const FIELDS=['id','name','city','categories','location_type','address','highlights','price_note','priority','status','lat','lng','verification'];
const CATEGORIES=[
 ['All','All places','#925b77'],
 ['Fragrances','Fragrance','#b16b9a'],
 ['Independent fashion','Fashion','#347fa3'],
 ['Designer replicas','Replicas','#bd8551'],
 ['Vintage','Vintage','#73956b'],
 ['Jewelry & artisan','Artisan','#b08851'],
 ['Creative districts','Design','#8180b8'],
 ['Gay Nightlife','Nightlife','#9a5bba'],
 ['Underground & Raves','Raves','#5369c5'],
 ['Architecture & heritage','Architecture','#b77961'],
 ['Temples & culture','Temples','#9b8052'],
 ['Art & design','Art','#9565a9'],
 ['Nature & adventure','Nature','#408875'],
 ['Wildlife','Wildlife','#6e9b68'],
 ['Markets & shopping','Markets','#ca7551'],
 ['Wellness & beauty','Wellness','#bd7396']
];
const STYLES=Object.fromEntries(CATEGORIES.map(([key,label,color])=>[key,{label,color}]));
const ICON_PATHS={
 'All':'<path d="M3 8h18M3 16h18M8 3v18M16 3v18"/>',
 'Fragrances':'<rect x="7" y="8" width="10" height="13" rx="2"/><path d="M10 8V5h4v3M9 3h6M19 5h2"/>',
 'Independent fashion':'<path d="m8 4 4 2 4-2 5 5-3 3-2-2v11H8V10l-2 2-3-3 5-5z"/>',
 'Designer replicas':'<path d="M5 9h14l-1 12H6L5 9z"/><path d="M9 10V7a3 3 0 0 1 6 0v3"/>',
 'Vintage':'<circle cx="12" cy="12" r="9"/><path d="M12 6v6l4 2"/>',
 'Jewelry & artisan':'<path d="M6 4h12l4 6-10 11L2 10l4-6zM2 10h20M9 4l-2 6 5 11 5-11-2-6"/>',
 'Creative districts':'<rect x="3" y="3" width="8" height="8" rx="1"/><rect x="13" y="3" width="8" height="8" rx="1"/><rect x="3" y="13" width="8" height="8" rx="1"/><path d="M13 17h8m-4-4v8"/>',
 'Gay Nightlife':'<path d="M20.5 13A9 9 0 0 1 11 3.5 9 9 0 1 0 20.5 13Z"/>',
 'Underground & Raves':'<path d="M3 11v2M7 7v10M11 3v18M15 7v10M19 10v4M22 12v1"/>'
,
 'Architecture & heritage':'<path d="M3 21h18M5 21V9l7-6 7 6v12M9 21v-7h6v7M3 10h18"/>',
 'Temples & culture':'<path d="M3 21h18M5 21v-9h14v9M2 12l10-9 10 9M9 21v-5h6v5"/>',
 'Art & design':'<rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8" cy="8" r="2"/><path d="m4 18 5-5 4 3 3-4 4 6"/>',
 'Nature & adventure':'<path d="M2 20h20M3 17l6-10 3 5 3-8 6 13M12 19v-8"/>',
 'Wildlife':'<path d="M12 21c-5 0-8-3-8-8V7h4v5h8V7h4v6c0 5-3 8-8 8ZM8 7V4m8 3V4"/>',
 'Markets & shopping':'<path d="M3 10h18l-2-6H5l-2 6ZM5 10v11h14V10M9 21v-8h6v8"/>',
 'Wellness & beauty':'<path d="M12 21c-5-4-8-7-8-11a5 5 0 0 1 8-4 5 5 0 0 1 8 4c0 4-3 7-8 11ZM12 8v6m-3-3h6"/>'
};
function iconSVG(category,size=18){
 return '<svg viewBox="0 0 24 24" width="'+size+'" height="'+size+'" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'+(ICON_PATHS[category]||ICON_PATHS.All)+'</svg>';
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

const state={places:[],city:'All',category:'All',query:'',favoritesOnly:false,selected:null,level:'peek',source:'',signature:''};
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
 $('categories').innerHTML=CATEGORIES.map(([key,label])=>'<button type="button" data-category="'+esc(key)+'" aria-pressed="'+(state.category===key)+'" class="'+(state.category===key?'active':'')+'">'+iconSVG(key,16)+' '+esc(label)+'</button>').join('');
}
function placeCard(p){
 const primary=cats(p)[0]||'All';
 const type=STYLES[primary]||STYLES.All;
 return '<article class="place '+(state.selected===p.id?'selected':'')+'" data-id="'+esc(p.id)+'" role="button" tabindex="0" aria-label="Show '+esc(p.name)+'">'+
 '<div class="place-head"><span class="place-category-icon" style="--category:'+type.color+'">'+iconSVG(primary,19)+'</span><div class="place-title"><h3>'+esc(p.name)+'</h3><small>'+esc(p.city)+' · '+esc(type.label)+'</small></div>'+favoriteButton(p)+'</div>'+
 '<p>'+esc(p.highlights||p.location_type||'')+'</p>'+
 (p.price_note?'<div class="place-meta">'+esc(p.price_note)+'</div>':'')+
 (!coords(p)?'<div class="place-meta">Location to confirm</div>':'')+'</article>';
}
function render(preserveView=false){
 if(window.renderTripMode&&window.renderTripMode(preserveView))return;
 chips();const list=filtered();
 $('results').textContent=list.length+' places';
 $('favorites-count').textContent=favorites.size;
 $('favorites-only').classList.toggle('active',state.favoritesOnly);
 $('favorites-only').setAttribute('aria-pressed',String(state.favoritesOnly));
 $('drawer-summary').textContent=list.length+' places'+(state.city==='All'?'':' · '+state.city);
 $('places-list').innerHTML=list.length?list.map(placeCard).join(''):'<div class="empty">'+(state.favoritesOnly?'No favorites here yet. Choose All places and tap a star to save something.':'No places match these filters. Try another category.')+'</div>';
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
 const tiles=L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:19,attribution:'&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap contributors</a>'});
 tiles.on('tileerror',()=>{$('map-error').hidden=false;});tiles.addTo(map);
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
  const markup='<div class="pin '+(saved?'favorite':'')+'" style="--pin:'+t.color+'">'+iconSVG(primary,19)+(saved?'<span class="pin-favorite">'+starSVG(true,11)+'</span>':'')+'</div>';
  const icon=L.divIcon({html:markup,className:'map-marker',iconSize:[34,34],iconAnchor:[17,17]});
  const popup='<div class="popup"><div class="popup-title"><strong>'+esc(p.name)+'</strong>'+favoriteButton(p,'popup')+'</div><p>'+esc(p.highlights||p.location_type)+'</p><a href="'+gmaps(p)+'" target="_blank" rel="noopener noreferrer">Open in Google Maps ↗</a></div>';
  const marker=L.marker([Number(p.lat),Number(p.lng)],{icon,title:String(p.name)}).bindPopup(popup).addTo(markers);
  marker.on('click',()=>focus(p.id));
  markerById.set(p.id,marker);
  positions.push(marker.getLatLng());
 }
 if(preserveView)return;
 if(positions.length===1)map.setView(positions[0],14);
 else if(positions.length>1)map.fitBounds(positions,{paddingTopLeft:[35,70],paddingBottomRight:mobile()?[35,220]:[45,45],maxZoom:state.city==='All'?8:14,animate:false});
 else map.setView(state.city==='Bangkok'?[13.75,100.53]:state.city==='Chiang Mai'?[18.79,98.99]:[16.3,99.5],state.city==='All'?6:12);
 setTimeout(()=>map.invalidateSize({pan:false}),100);
}
function setLevel(level){
 if(!['peek','middle','full'].includes(level))return;state.level=level;
 $('places-panel').dataset.level=level;
 $('drawer-grab').setAttribute('aria-expanded',String(level!=='peek'));
 $('drawer-grab').setAttribute('aria-label',level==='peek'?'Expand places drawer':level==='middle'?'Expand to full list':'Minimize places drawer');
 $('grab-arrow').textContent=level==='full'?'⌄':'⌃';
 if(map)setTimeout(()=>map.invalidateSize({pan:false}),270);
}
function closeDetails(){state.selected=null;$('place-detail').hidden=true;document.querySelectorAll('.place').forEach(x=>x.classList.remove('selected'));}
function focus(id){
 const p=state.places.find(x=>String(x.id)===String(id));if(!p)return;
 state.selected=p.id;
 document.querySelectorAll('.place').forEach(x=>x.classList.toggle('selected',x.dataset.id===String(id)));
 const marker=markerById.get(id);
 if(mobile()){
  setLevel('peek');
  const top=cats(p)[0]||'All';
  const category=STYLES[top]||STYLES.All;
  $('place-detail').innerHTML='<div class="detail-top"><div class="detail-title"><strong>'+esc(p.name)+'</strong><div class="detail-sub">'+esc(p.city)+' · '+esc(category.label)+'</div></div>'+favoriteButton(p,'detail')+'<button class="close-detail" type="button" aria-label="Close place details">×</button></div>'+
   '<p>'+esc(p.highlights||p.location_type)+'</p><div class="detail-foot"><small>'+esc(p.price_note||p.location_type)+'</small><a class="directions" href="'+directions(p)+'" target="_blank" rel="noopener noreferrer">Directions ↗</a></div>';
  $('place-detail').hidden=false;
  if(marker&&map){map.flyTo(marker.getLatLng(),Math.max(14,map.getZoom()),{duration:.4});setTimeout(()=>{if(state.selected===p.id)map.panBy([0,65],{animate:true,duration:.2});},450);}
 }else if(marker&&map){map.flyTo(marker.getLatLng(),Math.max(14,map.getZoom()),{duration:.5});marker.openPopup();}
 else window.open(gmaps(p),'_blank','noopener');
}
function chooseCity(city){
 if(!['All','Bangkok','Chiang Mai'].includes(city))return;
 state.city=city;closeDetails();
 document.querySelectorAll('button[data-city]').forEach(b=>{const on=b.dataset.city===city;b.classList.toggle('active',on);b.setAttribute('aria-pressed',String(on));});
 render();
}
function init(){
 initializeMap();
 $('map-cities').addEventListener('click',e=>{const b=e.target.closest('button[data-city]');if(b)chooseCity(b.dataset.city);});
 $('categories').addEventListener('click',e=>{const b=e.target.closest('button[data-category]');if(b){state.category=b.dataset.category;closeDetails();render();}});
 $('place-search').addEventListener('input',e=>{state.query=e.target.value.trim().toLowerCase();render();});
 $('favorites-only').addEventListener('click',()=>{state.favoritesOnly=!state.favoritesOnly;closeDetails();render();});
 $('places-list').addEventListener('click',e=>{const star=e.target.closest('button[data-favorite]');if(star){toggleFavorite(star.dataset.favorite);return;}const c=e.target.closest('.place');if(c)focus(c.dataset.id);});
 $('places-list').addEventListener('keydown',e=>{if(e.target.closest('button[data-favorite]'))return;if(['Enter',' '].includes(e.key)){const c=e.target.closest('.place');if(c){e.preventDefault();focus(c.dataset.id);}}});
 $('place-detail').addEventListener('click',e=>{const star=e.target.closest('button[data-favorite]');if(star){toggleFavorite(star.dataset.favorite);return;}if(e.target.closest('.close-detail'))closeDetails();});
 $('map').addEventListener('click',e=>{const star=e.target.closest('button[data-favorite]');if(star){e.preventDefault();e.stopPropagation();toggleFavorite(star.dataset.favorite);}});
 $('place-search').addEventListener('focus',()=>{if(mobile()&&state.level==='peek')setLevel('middle');});
 const grab=$('drawer-grab');let start=null,swiped=false;
 grab.addEventListener('pointerdown',e=>{if(mobile()){start=e.clientY;swiped=false;}});
 grab.addEventListener('pointerup',e=>{if(start===null)return;const dist=e.clientY-start;start=null;if(Math.abs(dist)>35){swiped=true;const levels=['peek','middle','full'];setLevel(levels[Math.max(0,Math.min(2,levels.indexOf(state.level)+(dist<0?1:-1)))]);setTimeout(()=>swiped=false,120);}});
 grab.addEventListener('pointercancel',()=>start=null);
 grab.addEventListener('click',()=>{if(!swiped)setLevel(state.level==='peek'?'middle':state.level==='middle'?'full':'peek');});
 $('locate').addEventListener('click',()=>{
  if(!navigator.geolocation){alert('Location is not available on this device.');return;}
  const btn=$('locate');btn.disabled=true;btn.textContent='…';
  navigator.geolocation.getCurrentPosition(pos=>{
   btn.disabled=false;btn.textContent='⌖';
   if(map){const loc=[pos.coords.latitude,pos.coords.longitude];map.setView(loc,14,{animate:true});if(geoLayer)map.removeLayer(geoLayer);geoLayer=L.circleMarker(loc,{radius:8,color:'#fff',weight:3,fillColor:'#276dd5',fillOpacity:1}).addTo(map).bindTooltip('You are here');}
   setLevel('peek');closeDetails();
  },()=>{btn.disabled=false;btn.textContent='⌖';alert('Location not available or permission was declined.');},{enableHighAccuracy:false,timeout:12000,maximumAge:30000});
 });
 $('share').addEventListener('click',async()=>{
  try{if(navigator.share)await navigator.share({title:'Thailand Living Map',url:location.href});
  else if(navigator.clipboard){await navigator.clipboard.writeText(location.href);$('share').textContent='Copied ✓';setTimeout(()=>$('share').textContent='Share ↗',1800);}
  else prompt('Copy map URL:',location.href);}
  catch(e){if(e.name!=='AbortError')prompt('Copy map URL:',location.href);}
 });
 loadSnapshot().then(syncPlaces);
 setInterval(()=>{if(!document.hidden)syncPlaces();},CONFIG.refreshMs);
}
window.addEventListener('DOMContentLoaded',init);
