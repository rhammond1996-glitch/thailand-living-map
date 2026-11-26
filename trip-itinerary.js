
'use strict';
/* Adaptive day routing without changing the shared Google Sheet.
   Draft order changes persist on this device only. */
(function(){
 const days=[...(window.TRIP_BANGKOK_DAYS||[]),...(window.TRIP_DAYS||[])];
 const DRAFT_KEY='thailand-living-map:itinerary-draft:v1';
 const params=new URLSearchParams(location.search);
 let mode=params.get('view')==='itinerary'?'itinerary':'explore';
 const linkedDay=days.find(d=>d.id===params.get('day'));
 let tripCity=linkedDay?.city||(params.get('tripCity')==='Chiang Mai'?'Chiang Mai':'Bangkok');
 let day=params.get('day')==='all'?'all':linkedDay?.id||days.find(d=>d.city===tripCity)?.id||'all';
 let showNear=true, radiusKm=3, drafts={};
 try{const saved=JSON.parse(localStorage.getItem(DRAFT_KEY)||'{}');if(saved&&typeof saved==='object')drafts=saved;}catch{}
 let explorer={city:'All',category:'All',query:'',favoritesOnly:false};
 const lookup=id=>state.places.find(p=>String(p.id)===String(id));
 const byDay=id=>days.find(d=>d.id===id);
 const escapeText=s=>esc(String(s||''));
 const valid=p=>p&&coords(p);
 const point=p=>[Number(p.lat),Number(p.lng)];
 const dayIds=d=>{
  const original=d.stops||[];
  const candidate=Array.isArray(drafts[d.id])?drafts[d.id]:original;
  return [...new Set(candidate.filter(id=>typeof id==='string' && (original.includes(id)||!!lookup(id))))];
 };
 const cityDays=()=>days.filter(d=>d.city===tripCity);
 const activeDays=()=>day==='all'?cityDays():[byDay(day)].filter(d=>d&&d.city===tripCity);
 const distanceKm=(a,b)=>{
  const r=Math.PI/180,dlat=(Number(b.lat)-Number(a.lat))*r,dlng=(Number(b.lng)-Number(a.lng))*r;
  const x=Math.sin(dlat/2)**2+Math.cos(Number(a.lat)*r)*Math.cos(Number(b.lat)*r)*Math.sin(dlng/2)**2;
  return 12742*Math.asin(Math.min(1,Math.sqrt(x)));
 };
 const fmtDist=v=>v<1?Math.round(v*1000)+' m':v.toFixed(1)+' km';
 const persist=()=>{
  try{localStorage.setItem(DRAFT_KEY,JSON.stringify(drafts));}catch(e){console.warn('Itinerary changes not saved',e);}
 };
 function setUrl(){
  try{const url=new URL(location.href);if(mode==='itinerary'){url.searchParams.set('view','itinerary');url.searchParams.set('day',day);url.searchParams.set('tripCity',tripCity);}else{url.searchParams.delete('view');url.searchParams.delete('day');url.searchParams.delete('tripCity');}history.replaceState(null,'',url);}catch(e){}
 }
 function findNearby(){
  if(!showNear||!state.places.length)return [];
  const chosen=activeDays().flatMap(d=>dayIds(d)).map(lookup).filter(valid);
  const selected=new Set(chosen.map(p=>String(p.id)));
  if(!chosen.length)return [];
  return state.places.filter(p=>p.city===tripCity&&valid(p)&&!selected.has(String(p.id))).map(p=>{
   let distance=Infinity,anchor=null;
   for(const main of chosen){const next=distanceKm(p,main);if(next<distance){distance=next;anchor=main;}}
   const scheduled=cityDays().find(d=>dayIds(d).includes(p.id));
   return {p,distance,anchor,scheduled:scheduled?.id||''};
  }).filter(x=>x.distance<=radiusKm).sort((a,b)=>a.distance-b.distance||a.p.name.localeCompare(b.p.name)).slice(0,day==='all'?32:24);
 }
 function addToDay(id){
  const d=byDay(day==='all'?cityDays()[0]?.id:day),p=lookup(id);
  if(!d||!p)return;
  const ids=dayIds(d);
  if(ids.includes(id))return;
  // Insert near the nearest already-planned stop instead of appending at random.
  let at=ids.length-1,closest=Infinity;
  ids.forEach((sid,i)=>{const s=lookup(sid);if(!valid(s)||!valid(p))return;const dist=distanceKm(s,p);if(dist<closest){closest=dist;at=i;}});
  ids.splice(Math.max(0,at+1),0,id);
  drafts[d.id]=ids;persist();closeDetails();render();
 }
 function skipFromDay(id,did){
  const d=byDay(did||day);if(!d)return;
  drafts[d.id]=dayIds(d).filter(x=>x!==id);persist();closeDetails();render();
 }
 function resetDraft(){
  for(const d of activeDays())delete drafts[d.id];
  persist();closeDetails();render();
 }
 function popup(p,kind,index,number,fromDay){
  const tag=kind==='primary'?'Planned stop '+number:'Nearby alternative';
  return '<div class="popup trip-popup"><strong>'+escapeText(p.name)+'</strong><small>'+escapeText(tag)+'</small><p>'+escapeText(p.highlights)+'</p><div class="trip-popup-actions">'+
   (kind==='aux'&&day!=='all'?'<button type="button" data-trip-add="'+escapeText(p.id)+'">Add to today</button>':'')+
   '<button type="button" data-trip-focus="'+escapeText(p.id)+'">Place details &amp; Maps</button></div></div>';
 }
 function putMarker(p,kind,d,index,number){
  if(!valid(p))return;
  let marker;
  if(kind==='primary'){
   const icon=L.divIcon({html:'<div class="trip-pin" style="--trip-color:'+d.color+'">'+number+'</div>',className:'map-marker',iconSize:[39,39],iconAnchor:[19,19]});
   marker=L.marker(point(p),{icon,zIndexOffset:1100,title:p.name}).addTo(markers);
  }else{
   marker=L.circleMarker(point(p),{radius:6,color:'#b3a5b2',weight:1.5,opacity:.78,fillColor:'#fff',fillOpacity:.72}).addTo(markers);
  }
  marker.bindPopup(popup(p,kind,index,number,d?.id));
  marker.on('click',()=>{focus(p.id);marker.closePopup();});
  if(!markerById.has(p.id)||kind==='primary')markerById.set(p.id,marker);
 }
 function listOneDay(d){
  const ids=dayIds(d);
  return '<div class="trip-header" style="--trip-color:'+d.color+'"><span>DAY '+(d.number||d.id)+'</span><span>'+escapeText(d.date)+' / '+escapeText(d.short)+'</span></div>'+
   (!ids.length?'<div class="empty">All stops skipped for this day. Use nearby suggestions or Reset.</div>':'')+
   ids.map((id,i)=>{
    const p=lookup(id);if(!p)return '';
    const originalIndex=d.stops.indexOf(id),transfer=originalIndex>=0?d.transfers[originalIndex]:'Inserted near the closest planned stop; travel time not estimated';
    return '<article class="trip-stop" style="--trip-color:'+d.color+'"><div class="trip-stop-top"><div class="trip-index">'+(i+1)+'</div>'+
     '<div class="trip-stop-main" role="button" tabindex="0" data-trip-focus="'+escapeText(id)+'" aria-label="Show '+escapeText(p.name)+' on map"><strong>'+escapeText(p.name)+'</strong><small>'+escapeText(cats(p)[0]||p.location_type)+'</small></div><span class="trip-step-arrow" aria-hidden="true">↗</span></div>'+
     '<details class="trip-step-info"><summary>Travel details & options</summary><div class="trip-step-expanded">'+
     '<p><b>GETTING THERE</b> '+escapeText(transfer)+'</p>'+
     '<p>'+escapeText(p.highlights||'')+'</p>'+
     '<div class="trip-stop-actions"><button type="button" data-trip-skip="'+escapeText(id)+'" data-trip-skip-day="'+d.id+'">Skip this stop</button>'+
     '<button type="button" class="trip-directions" data-trip-focus="'+escapeText(id)+'">Place details &amp; Maps</button></div></div></details></article>';
   }).join('')+
   (d.wellness?'<details class="trip-wellness"><summary>Optional evening idea</summary><p>'+escapeText(d.wellness)+'</p></details>':'');
 }
 function alternativesHtml(nearby){
  if(!showNear)return '';
  return '<details class="trip-alternatives"><summary><span>NEARBY OPTIONS</span><span class="trip-alts-count">'+nearby.length+'</span></summary><div class="trip-alternatives-inner">'+
    (nearby.length?nearby.map(x=>'<article class="trip-option"><span class="trip-alt-marker"></span>'+
     '<div class="trip-stop-main" role="button" tabindex="0" data-trip-focus="'+escapeText(x.p.id)+'">'+
     '<strong>'+escapeText(x.p.name)+'</strong>'+
     '<small>'+escapeText(fmtDist(x.distance))+' straight line from '+escapeText(x.anchor.name)+'</small></div>'+
     (day!=='all'?'<button type="button" data-trip-add="'+escapeText(x.p.id)+'">+ ADD</button>':'')+
     '</article>').join(''):'<div class="empty">No mapped alternatives at this distance. Increase the radius in Route options.</div>')+
     '<p class="trip-hint">Nearby distance is straight-line, not driving distance.</p></div></details>';
 }
 function renderTripMode(preserveView=false){
  if(mode!=='itinerary')return false;
  if(!map)return true;
  const active=activeDays();
  const nearby=findNearby();
  markers.clearLayers();markerById.clear();
  const all=[];
  for(const d of active){
   const ordered=dayIds(d).map(lookup).filter(valid);
   // Straight, dashed joins show sequence, never imply a navigable driving route.
   if(ordered.length>1)L.polyline(ordered.map(point),{color:d.color,opacity:.55,weight:3,dashArray:'7,8',interactive:false}).addTo(markers);
   ordered.forEach((p,i)=>{putMarker(p,'primary',d,i,i+1);all.push(point(p));});
  }
  for(const a of nearby)putMarker(a.p,'aux',null,null,null);
  $('places-list').innerHTML=(state.places.length?active.map(listOneDay).join(''):'<div class="empty">Loading places and route…</div>')+alternativesHtml(nearby);
  $('drawer-summary').textContent=day==='all'?'All '+tripCity+' days':(tripCity+' · DAY '+(byDay(day)?.number||day)+' / '+(byDay(day)?.short||''));
  const drawerHeading=document.querySelector('#drawer-grab .grab-copy strong');if(drawerHeading)drawerHeading.textContent='YOUR ROUTE';
  const thisDay=byDay(day);
  $('trip-controls').innerHTML='<div class="trip-kicker">'+escapeText(tripCity.toUpperCase())+' / YOUR ROUTE</div>'+
   '<h2>'+(thisDay?escapeText(thisDay.title):'Four days / '+escapeText(tripCity))+'</h2>'+
   '<p>'+(thisDay?escapeText(thisDay.summary):'Choose a day to see its planned route.')+'</p>'+
   (thisDay&&thisDay.warning?'<p class="trip-warning">'+escapeText(thisDay.warning)+'</p>':'')+
   '<details class="trip-settings"><summary>ROUTE OPTIONS <span aria-hidden="true">+</span></summary><div class="trip-settings-body">'+
   '<div class="trip-control-row"><label><input type="checkbox" id="trip-show-near" '+(showNear?'checked':'')+'> Show nearby options</label>'+
   '<label>Within <select id="trip-radius"><option value="1" '+(radiusKm===1?'selected':'')+'>1 km</option><option value="3" '+(radiusKm===3?'selected':'')+'>3 km</option><option value="7" '+(radiusKm===7?'selected':'')+'>7 km</option><option value="20" '+(radiusKm===20?'selected':'')+'>20 km</option></select></label>'+
   '<button id="trip-reset" type="button">Reset draft</button></div>'+
   '<p class="trip-hint">Numbered pins are your stops. Outlined dots are optional. Dashed lines show order, not roads. Edits save only on this device.</p></div></details>';
  $('results').textContent=active.reduce((n,d)=>n+dayIds(d).length,0)+' planned';
  document.querySelectorAll('#trip-day-picker button[data-day]').forEach(b=>{
   const active=b.dataset.day===day;b.classList.toggle('active',active);b.setAttribute('aria-pressed',String(active));
  });
  if(!preserveView&&all.length){
   if(all.length===1)map.setView(all[0],13,{animate:false});
   else map.fitBounds(all,{paddingTopLeft:[38,85],paddingBottomRight:mobile()?[38,220]:[58,58],maxZoom:14,animate:false});
   setTimeout(()=>map.invalidateSize({pan:false}),100);
  }
  return true;
 }
 window.renderTripMode=renderTripMode;
 function setMode(next){
  if(!['explore','itinerary'].includes(next)||next===mode)return;
  if(next==='itinerary'){
   explorer={city:state.city,category:state.category,query:state.query,favoritesOnly:state.favoritesOnly};
   mode='itinerary';
  }else{
   mode='explore';
   state.city=explorer.city;state.category=explorer.category;state.query=explorer.query;state.favoritesOnly=explorer.favoritesOnly;
   $('place-search').value=explorer.query;
   document.querySelectorAll('button[data-city]').forEach(b=>{const active=b.dataset.city===state.city;b.classList.toggle('active',active);b.setAttribute('aria-pressed',String(active));});
  }
  document.body.classList.toggle('itinerary-mode',mode==='itinerary');
  if(typeof updateDiscoverLabel==='function')updateDiscoverLabel();
  $('trip-day-picker').hidden=mode!=='itinerary';
  $('trip-controls').hidden=mode!=='itinerary';
  document.querySelectorAll('#mode-picker button[data-mode]').forEach(b=>{const selected=b.dataset.mode===mode;b.classList.toggle('active',selected);b.setAttribute('aria-pressed',String(selected));});
  const title=document.querySelector('#drawer-grab .grab-copy strong');if(title)title.textContent=mode==='itinerary'?'YOUR ROUTE':'DISCOVER ↗';
  closeDetails();setUrl();render();
 }
 function selectDay(id){if(id!=='all'&&(!byDay(id)||byDay(id).city!==tripCity))return;day=id;closeDetails();setUrl();render();}
 function setTripCity(city){
  if(!['Bangkok','Chiang Mai'].includes(city)||city===tripCity)return;
  tripCity=city;
  day=cityDays()[0]?.id||'all';
  closeDetails();renderDayPicker();setUrl();render();
 }
 function renderDayPicker(){
  const nav=$('trip-day-picker');
  nav.innerHTML='<div class="trip-city-switch" role="group" aria-label="Itinerary city">'+
    ['Bangkok','Chiang Mai'].map(city=>'<button type="button" data-trip-city="'+city+'" class="'+(city===tripCity?'active':'')+'" aria-pressed="'+(city===tripCity)+'">'+city+'</button>').join('')+
    '</div><div class="trip-day-scroll" role="group" aria-label="'+tripCity+' itinerary days">'+
    cityDays().map(d=>'<button type="button" data-day="'+d.id+'" class="'+(d.id===day?'active':'')+'" aria-pressed="'+(d.id===day)+'">Day '+(d.number||d.id)+'</button>').join('')+
    '<button type="button" data-day="all" class="'+(day==='all'?'active':'')+'" aria-pressed="'+(day==='all')+'">All</button></div>';
 }
 function tripClick(e){
  const add=e.target.closest('[data-trip-add]');if(add){e.preventDefault();e.stopPropagation();addToDay(add.dataset.tripAdd);return;}
  const skip=e.target.closest('[data-trip-skip]');if(skip){e.preventDefault();e.stopPropagation();skipFromDay(skip.dataset.tripSkip,skip.dataset.tripSkipDay);return;}
  const focusButton=e.target.closest('[data-trip-focus]');if(focusButton){focus(focusButton.dataset.tripFocus);return;}
 }
 function initTrip(){
  const nav=$('trip-day-picker');
  renderDayPicker();
  $('mode-picker').addEventListener('click',e=>{const b=e.target.closest('[data-mode]');if(b)setMode(b.dataset.mode);});
  nav.addEventListener('click',e=>{
   const city=e.target.closest('[data-trip-city]');
   if(city){setTripCity(city.dataset.tripCity);return;}
   const b=e.target.closest('[data-day]');
   if(b)selectDay(b.dataset.day);
  });
  $('trip-controls').addEventListener('change',e=>{
   if(e.target.id==='trip-show-near'){showNear=e.target.checked;render(true);}
   else if(e.target.id==='trip-radius'){radiusKm=Number(e.target.value)||3;render(true);}
  });
  $('trip-controls').addEventListener('click',e=>{if(e.target.closest('#trip-reset'))resetDraft();});
  $('places-list').addEventListener('click',tripClick);
  $('places-list').addEventListener('keydown',e=>{
   if(e.key==='Enter'||e.key===' '){const b=e.target.closest('[data-trip-focus]');if(b){e.preventDefault();focus(b.dataset.tripFocus);}}
  });
  $('map').addEventListener('click',e=>{const b=e.target.closest('[data-trip-add]');if(b){e.preventDefault();e.stopPropagation();addToDay(b.dataset.tripAdd);}});
  const legend=document.createElement('div');legend.className='trip-map-legend';legend.id='trip-legend';
  legend.innerHTML='<span class="solid">NUMBERED / PLAN</span> · <span class="muted">OUTLINE / OPTIONAL</span>';
  $('map').parentElement.appendChild(legend);
  if(mode==='itinerary'){mode='explore';setMode('itinerary');}else{legend.hidden=true;}
  // Keep legend visibility in step with mode changes via a lightweight observer.
  const obs=new MutationObserver(()=>{legend.hidden=!document.body.classList.contains('itinerary-mode');});
  obs.observe(document.body,{attributes:true,attributeFilter:['class']});
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',initTrip);else initTrip();
})();
