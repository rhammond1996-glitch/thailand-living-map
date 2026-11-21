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
 ['All','All places','✳','#377c61'],
 ['Fragrances','Fragrance','🌸','#b16b9a'],
 ['Independent fashion','Fashion','👕','#347fa3'],
 ['Designer replicas','Replicas','👜','#bd8551'],
 ['Vintage','Vintage','♻','#72956b'],
 ['Jewelry & artisan','Artisan','💍','#bd9664'],
 ['Creative districts','Design districts','✦','#8180b8'],
 ['Gay Nightlife','Gay nightlife','🪩','#9a5bba'],
 ['Underground & Raves','Underground & raves','🔊','#5369c5']
];
const STYLES=Object.fromEntries(CATEGORIES.map(([key,label,icon,color])=>[key,{label,icon,color}]));
const state={places:[],city:'All',category:'All',query:'',top:false,selected:null,level:'middle',source:'',signature:''};
let map,markers,markerById=new Map(),geoLayer=null,loading=false,feedFailed=false;
const $=id=>document.getElementById(id);
const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','\'':'&#39;'}[c]));
const cats=p=>String(p.categories||'').split('|').map(s=>s.trim()).filter(Boolean);
const mobile=()=>matchMedia('(max-width:720px)').matches;
const coords=p=>p.lat!==null&&p.lng!==null&&p.lat!==''&&p.lng!==''&&Number.isFinite(Number(p.lat))&&Number.isFinite(Number(p.lng))&&Number(p.lat)>5&&Number(p.lat)<22&&Number(p.lng)>97&&Number(p.lng)<107;
const gmaps=p=>'https://www.google.com/maps/search/?api=1&query='+encodeURIComponent(p.name+', '+p.address);
const directions=p=>'https://www.google.com/maps/dir/?api=1&destination='+encodeURIComponent(p.name+', '+p.address);
const priority=p=>p.priority==='Top'?0:p.priority==='High'?1:p.priority==='Medium'?2:3;
function clean(rows){
 const seen=new Set();
 return rows.map(row=>{const p={};for(const field of FIELDS)p[field]=row[field]??'';p.lat=p.lat===''||p.lat===null?null:Number(p.lat);p.lng=p.lng===''||p.lng===null?null:Number(p.lng);return p;})
 .filter(p=>{if(!p.id||!p.name||seen.has(String(p.id))||['hidden','archived'].includes(String(p.status).toLowerCase()))return false;seen.add(String(p.id));return true;});
}
function filtered(){
 return state.places.filter(p=>(state.city==='All'||p.city===state.city)&&
 (state.category==='All'||cats(p).includes(state.category))&&
 (!state.top||['High','Top'].includes(p.priority))&&
 (!state.query||[p.name,p.city,p.categories,p.location_type,p.address,p.highlights,p.price_note].join(' ').toLowerCase().includes(state.query)))
 .sort((a,b)=>priority(a)-priority(b)||String(a.city).localeCompare(String(b.city))||String(a.name).localeCompare(String(b.name)));
}
function refreshStatus(message,type='live'){
 $('sync-label').textContent=message;
 $('sync-status').className='sync '+(type==='live'?'':type);
 $('sync-status').title=message;
}
function updatePlaces(data,source){
 if(!data?.places||!Array.isArray(data.places))throw new Error('Invalid destination feed');
 const places=clean(data.places);
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
 $('categories').innerHTML=CATEGORIES.map(([key,label,icon])=>'<button type="button" data-category="'+esc(key)+'" aria-pressed="'+(state.category===key)+'" class="'+(state.category===key?'active':'')+'">'+icon+' '+esc(label)+'</button>').join('');
}
function placeCard(p){
 const badges=cats(p).slice(0,3).map(t=>'<span class="pill">'+(STYLES[t]?.icon||'•')+' '+esc(STYLES[t]?.label||t)+'</span>').join('');
 const pin=coords(p)?'':'<span class="missing">Pin pending · </span>';
 return '<article class="place '+(state.selected===p.id?'selected':'')+'" data-id="'+esc(p.id)+'" role="button" tabindex="0" aria-label="Show '+esc(p.name)+'">'+
 '<div class="place-head"><h3>'+esc(p.name)+'</h3><small>'+esc(p.city)+'</small></div>'+
 '<div class="badges">'+badges+'</div><p>'+esc(p.highlights||p.location_type||'')+'</p>'+
 '<div class="place-foot"><span>'+pin+esc(p.price_note||p.location_type||'')+'</span><span class="priority">'+(['High','Top'].includes(p.priority)?'★ '+(p.priority==='Top'?'Must visit':'High priority'):esc(p.priority))+'</span></div></article>';
}
function render(){
 chips();const list=filtered();
 $('total').textContent=state.places.length+' saved';
 $('results').textContent=list.length+' matching';
 $('drawer-summary').textContent=list.length+' places'+(state.city==='All'?' across Thailand':' in '+state.city)+(state.category!=='All'?' · '+STYLES[state.category]?.label:'');
 $('places-list').innerHTML=list.length?list.map(placeCard).join(''):'<div class="empty">No places match these filters. Try a different city or category.</div>';
 $('top-only').classList.toggle('active',state.top);
 $('top-only').setAttribute('aria-pressed',String(state.top));
 renderPins(list);
}
function initializeMap(){
 if(!window.L){$('map-error').hidden=false;return;}
 map=L.map('map',{zoomControl:false,scrollWheelZoom:false}).setView([16.3,99.5],6);
 L.control.zoom({position:'bottomright'}).addTo(map);
 const tiles=L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:19,attribution:'&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap contributors</a>'});
 tiles.on('tileerror',()=>{$('map-error').hidden=false;});tiles.addTo(map);
 markers=L.layerGroup().addTo(map);
 window.addEventListener('resize',()=>map.invalidateSize({pan:false}));
}
function renderPins(list){
 if(!map)return;
 markers.clearLayers();markerById.clear();
 const positions=[];
 for(const p of list){
  if(!coords(p))continue;
  const t=STYLES[cats(p)[0]]||STYLES['Creative districts'];
  const markup='<div class="pin '+(p.priority==='Top'?'top':'')+'" style="--pin:'+t.color+'"><span>'+t.icon+'</span></div>';
  const icon=L.divIcon({html:markup,className:'',iconSize:[36,36],iconAnchor:[18,31]});
  const popup='<div class="popup"><strong>'+esc(p.name)+'</strong><p>'+esc(p.highlights)+'</p><a href="'+gmaps(p)+'" target="_blank" rel="noopener noreferrer">Open Google Maps ↗</a></div>';
  const marker=L.marker([Number(p.lat),Number(p.lng)],{icon,title:String(p.name)}).bindPopup(popup).addTo(markers);
  marker.on('click',()=>focus(p.id));markerById.set(p.id,marker);positions.push(marker.getLatLng());
 }
 $('pin-count').textContent=positions.length+' on map';
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
  const top=cats(p)[0];$('place-detail').innerHTML='<div class="detail-top"><div><strong>'+esc(p.name)+'</strong><div class="detail-sub">'+esc(p.city)+' · '+esc(STYLES[top]?.label||p.location_type)+'</div></div><button class="close-detail" type="button" aria-label="Close place details">×</button></div>'+
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
 $('panel-cities').addEventListener('click',e=>{const b=e.target.closest('button[data-city]');if(b)chooseCity(b.dataset.city);});
 $('categories').addEventListener('click',e=>{const b=e.target.closest('button[data-category]');if(b){state.category=b.dataset.category;closeDetails();render();}});
 $('place-search').addEventListener('input',e=>{state.query=e.target.value.trim().toLowerCase();render();});
 $('top-only').addEventListener('click',()=>{state.top=!state.top;closeDetails();render();});
 $('places-list').addEventListener('click',e=>{const c=e.target.closest('.place');if(c)focus(c.dataset.id);});
 $('places-list').addEventListener('keydown',e=>{if(['Enter',' '].includes(e.key)){const c=e.target.closest('.place');if(c){e.preventDefault();focus(c.dataset.id);}}});
 $('place-detail').addEventListener('click',e=>{if(e.target.closest('.close-detail'))closeDetails();});
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
 $('refresh').addEventListener('click',()=>{loadSnapshot().then(syncPlaces);});
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
