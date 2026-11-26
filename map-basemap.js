/* Thailand Living Map — two cohesive cartographic palettes.
   Shared OpenFreeMap vector data, English labels, live paint changes;
   switching appearance never recreates Leaflet map, markers or itinerary. */
(function(){
 'use strict';
 const STYLE='https://tiles.openfreemap.org/styles/dark';
 const mode=()=>document.documentElement.dataset.uiTheme==='night'?'night':'day';
 const PALETTES={
  day:{
   background:'#f2f3fa',land:'#f3f2f8',water:'#bfdcf0',waterLine:'#9fc7e2',
   park:'#d9e9d8',building:'#e4e5ef',buildingOutline:'#d6daeb',
   minor:'#dce1ea',roadMajor:'#c9d2e2',roadSecondary:'#e1e4ee',
   roadMinor:'#e5e8f0',roadCasing:'#f8f8fc',roadRail:'#b7c9e3',
   boundary:'#c6bad9',white:'#34425a',roadLabel:'#66758e',
   parkLabel:'#557966',waterLabel:'#5b8cab',halo:'#f9f9ff'
  },
  night:{
   background:'#0d1729',land:'#121e34',water:'#12324a',waterLine:'#285f7d',
   park:'#1b3435',building:'#1c2940',buildingOutline:'#25354c',
   minor:'#2a3b54',roadMajor:'#415471',roadSecondary:'#34445c',
   roadMinor:'#283850',roadCasing:'#0e1a30',roadRail:'#445c7a',
   boundary:'#514569',white:'#d8e2f3',roadLabel:'#b2bfda',
   parkLabel:'#80a99b',waterLabel:'#8cbbd2',halo:'#0a1528'
  }
 };
 const EXCLUDED_LABELS=/shield|housenumber|route-number|exit-number|motorway-junction|road-number|oneway/i;
 const NAME_LABELS=/label|name|place|poi|city|town|village|country|state|transport|road|street|waterway|airport|park/i;
 const ENGLISH_NAME=['coalesce',
  ['get','name_en'],['get','name:en'],['get','name:latin'],
  ['get','name:international'],['get','name_int'],['get','name_latin'],['get','name'],['get','ref'],''];
 let activeGL=null,activeRaster=null,vectorLoaded=false;
 function applyColors(gl){
  const C=PALETTES[mode()];
  const roadColors=['match',['get','class'],
   ['motorway','trunk','primary'],C.roadMajor,
   ['secondary','tertiary'],C.roadSecondary,
   ['minor','service','track','path','pedestrian','residential','living_street','unclassified'],C.roadMinor,
   C.roadMajor];
  try{
   for(const layer of gl.getStyle()?.layers||[]){
    const id=String(layer.id||'').toLowerCase(),lid=layer.id;
    const name=id+' '+String(layer['source-layer']||'').toLowerCase();
    try{
     if(layer.type==='background'){
      gl.setPaintProperty(lid,'background-color',C.background);
     }else if(layer.type==='fill'){
      if(/water|ocean|lake|river|wetland/.test(name)&&!/landcover/.test(name)){
       gl.setPaintProperty(lid,'fill-color',C.water);
      }else if(/park|forest|wood|grass|garden|nature|protected|landcover|green/.test(name)){
       gl.setPaintProperty(lid,'fill-color',C.park);
      }else if(/building/.test(name)){
       gl.setPaintProperty(lid,'fill-color',C.building);
       gl.setPaintProperty(lid,'fill-outline-color',C.buildingOutline);
      }else if(/land|earth|residential|industrial/.test(name)){
       gl.setPaintProperty(lid,'fill-color',C.land);
      }
     }else if(layer.type==='line'){
      if(/water|ocean|stream|river|canal/.test(name)){
       gl.setPaintProperty(lid,'line-color',C.waterLine);
       gl.setPaintProperty(lid,'line-opacity',0.64);
      }else if(/boundary|admin|border|country|province|state/.test(name)){
       gl.setPaintProperty(lid,'line-color',C.boundary);
       gl.setPaintProperty(lid,'line-opacity',0.38);
      }else if(/building/.test(name)){
       gl.setPaintProperty(lid,'line-color',C.buildingOutline);
       gl.setPaintProperty(lid,'line-opacity',0.44);
      }else if(/landcover|park|forest|wood|grass|garden/.test(name)){
       gl.setPaintProperty(lid,'line-color',C.minor);
       gl.setPaintProperty(lid,'line-opacity',0.3);
      }else if(/transport|road|highway|motorway|street|bridge|tunnel|path|rail|trunk|primary|secondary|tertiary|footway|track/.test(name)){
       const casing=/casing|outline/.test(id),rail=/railway|rail|transit|tram|subway/.test(id);
       const minor=/highway_minor|highway_path|footway|pedestrian|service|track|cycle/.test(id);
       gl.setPaintProperty(lid,'line-color',
        casing?C.roadCasing:rail?C.roadRail:minor?C.roadMinor:roadColors);
       gl.setPaintProperty(lid,'line-opacity',1);
       gl.setPaintProperty(lid,'line-dasharray',null);
       gl.setPaintProperty(lid,'line-pattern',null);
       gl.setPaintProperty(lid,'line-blur',0);
      }else{
       gl.setPaintProperty(lid,'line-color',C.minor);
       gl.setPaintProperty(lid,'line-opacity',0.34);
      }
     }else if(layer.type==='symbol'&&layer.layout&&layer.layout['text-field']){
      if(NAME_LABELS.test(name)&&!EXCLUDED_LABELS.test(name)){
       gl.setLayoutProperty(lid,'text-field',ENGLISH_NAME);
      }
      const water=/water|river|ocean|lake/.test(name);
      const park=/park|garden|forest|wood|grass/.test(name);
      const road=/road|street|transport|highway/.test(name);
      gl.setPaintProperty(lid,'text-color',water?C.waterLabel:park?C.parkLabel:road?C.roadLabel:C.white);
      gl.setPaintProperty(lid,'text-halo-color',C.halo);
      gl.setPaintProperty(lid,'text-halo-width',1.5);
     }
    }catch(error){console.debug('Skipped map paint property',lid,error?.message||error);}
   }
  }catch(error){console.warn('Map palette update unavailable:',error);}
 }
 function rasterURL(){return 'https://basemaps.cartocdn.com/'+(mode()==='day'?'light_all':'dark_all')+'/{z}/{x}/{y}{r}.png';}
 function fallback(map){
  if(activeRaster)return activeRaster;
  activeGL=null;vectorLoaded=false;
  activeRaster=L.tileLayer(rasterURL(),{
   maxZoom:19,
   attribution:'&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'
  }).addTo(map);
  const notice=document.getElementById('map-error');
  if(notice){
   notice.textContent='Vector map unavailable; using a simplified '+mode()+' map. Destinations remain available.';
   notice.hidden=false;
  }
  return activeRaster;
 }
 document.addEventListener('thailand:themechange',()=>{
  if(activeGL&&vectorLoaded){
   applyColors(activeGL);
   activeGL.triggerRepaint?.();
  }else if(activeRaster){
   activeRaster.setUrl(rasterURL());
  }
 });
 window.installPrintBasemap=function(leafletMap){
  if(typeof L==='undefined'||!L.maplibreGL||!window.maplibregl)return fallback(leafletMap);
  let layer,abandoned=false;
  try{
   layer=L.maplibreGL({style:STYLE,attributionControl:false}).addTo(leafletMap);
   leafletMap.attributionControl?.addAttribution(
    '<a href="https://openfreemap.org/">OpenFreeMap</a> · '+
    '<a href="https://www.openmaptiles.org/">OpenMapTiles</a> · '+
    '<a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
   );
   const gl=layer.getMaplibreMap();
   if(!gl){leafletMap.removeLayer(layer);return fallback(leafletMap);}
   activeGL=gl;
   const onLoad=()=>{
    if(abandoned)return;
    vectorLoaded=true;
    applyColors(gl);
   };
   if(gl.isStyleLoaded())onLoad();else gl.once('load',onLoad);
   setTimeout(()=>{
    if(vectorLoaded||abandoned)return;
    abandoned=true;
    activeGL=null;
    try{leafletMap.removeLayer(layer);}catch{}
    fallback(leafletMap);
   },16000);
   return layer;
  }catch(error){
   abandoned=true;
   console.warn('Vector map unavailable:',error);
   if(layer){try{leafletMap.removeLayer(layer);}catch{}}
   return fallback(leafletMap);
  }
 };
})();
