/* English-first, Print Club cartography.
 * Uses OpenFreeMap vector tiles; falls back to classic raster tiles if
 * MapLibre, WebGL or the vector style is unavailable.
 * API-key free. Original Leaflet map and trip overlays stay intact.
 */
(function(){
  'use strict';
  const STYLE='https://tiles.openfreemap.org/styles/dark';
  // Near-black navy with legible electric routes. No map-wide gradient artwork.
  const COLORS={
    background:'#081126',
    land:'#0E1A33',
    water:'#0A3550',
    waterLine:'#2BC7E8',
    park:'#17392F',
    building:'#162742',
    minor:'#304764',
    lime:'#D6F64B',
    roadMajor:'#9FB7C9',
    roadSecondary:'#5F738D',
    roadMinor:'#3B4C63',
    boundary:'#7D4B80',
    white:'#F3F5FF',
    roadLabel:'#B4BED4',
    halo:'#091429'
  };
  const EXCLUDED_LABELS=/shield|housenumber|route-number|exit-number|motorway-junction|road-number|oneway/i;
  const NAME_LABELS=/label|name|place|poi|city|town|village|country|state|transport|road|street|waterway|airport|park/i;
  const ENGLISH_NAME=['coalesce',
    ['get','name_en'],['get','name:en'],['get','name:latin'],
    ['get','name:international'],['get','name_int'],['get','name_latin'],['get','name'],['get','ref'],''];
  // Use actual road layer names and source filters for road hierarchy.
  // The transportation source-layer contains *every* road class, so its
  // presence alone must never turn an entire network lime.
  function roadClass(layer){
    const id=String(layer.id||'').toLowerCase();
    const filter=JSON.stringify(layer.filter||[]).toLowerCase();
    const pedestrian=/footway|path|pedestrian|track|service|steps|cycleway|residential|living.street|minor|alley/.test(id);
    const rail=/rail|train|subway|tram/.test(id);
    const minor=/minor|service|residential|path|pedestrian|footway|cycle|track|unclassified|living.street/.test(id);
    const secondary=/secondary|tertiary|collector/.test(id);
    const major=/motorway|trunk|primary|expressway|major/.test(id);
    if(rail)return 'rail';
    if(pedestrian||minor)return 'minor';
    if(secondary)return 'secondary';
    if(major)return 'major';

    // Generic style layer names can carry an explicit class filter. Classify
    // as major only if that filter does not ALSO include smaller roads.
    const filterMajor=/motorway|trunk|primary|expressway/.test(filter);
    const filterSecondary=/secondary|tertiary|collector/.test(filter);
    const filterMinor=/residential|service|minor|path|footway|pedestrian|unclassified|track|cycle/.test(filter);
    if(filterMajor&&!filterSecondary&&!filterMinor)return 'major';
    if(filterSecondary&&!filterMajor&&!filterMinor)return 'secondary';
    if(filterMinor&&!filterMajor&&!filterSecondary)return 'minor';
    return 'local';
  }
  function applyInkStyle(gl){
    try{
      for(const layer of gl.getStyle()?.layers||[]){
        const id=String(layer.id||'').toLowerCase();
        const layerId=layer.id;
        const sourceLayer=String(layer['source-layer']||'').toLowerCase();
        const name=id+' '+sourceLayer;
        const kind=layer.type;
        try{
          if(kind==='background'){
            gl.setPaintProperty(layerId,'background-color',COLORS.background);
          }else if(kind==='fill'){
            if(/water|ocean|lake|river|wetland/.test(name)&&!/landcover/.test(name)){
              gl.setPaintProperty(layerId,'fill-color',COLORS.water);
            }else if(/park|forest|wood|grass|garden|nature|protected|landcover|green/.test(name)){
              gl.setPaintProperty(layerId,'fill-color',COLORS.park);
            }else if(/building/.test(name)){
              gl.setPaintProperty(layerId,'fill-color',COLORS.building);
            }else if(/land|earth|residential|industrial/.test(name)){
              gl.setPaintProperty(layerId,'fill-color',COLORS.land);
            }
          }else if(kind==='line'){
            if(/water|ocean|stream|river|canal/.test(name)){
              gl.setPaintProperty(layerId,'line-color',COLORS.waterLine);
              gl.setPaintProperty(layerId,'line-opacity',0.45);
            }else if(/boundary|admin|border|country|province|state/.test(name)){
              gl.setPaintProperty(layerId,'line-color',COLORS.boundary);
              gl.setPaintProperty(layerId,'line-opacity',0.3);
            }else if(/building|landcover|park|forest|wood|grass|garden/.test(name)){
              gl.setPaintProperty(layerId,'line-color',COLORS.minor);
              gl.setPaintProperty(layerId,'line-opacity',0.38);
            }else if(/transport|road|highway|motorway|street|bridge|tunnel|path|rail|trunk|primary|secondary|tertiary|footway|track/.test(name)){
              const cls=roadClass(layer);
              const ink=cls==='major'?COLORS.lime:
                cls==='secondary'?COLORS.roadSecondary:
                cls==='rail'?COLORS.roadSecondary:
                cls==='minor'?COLORS.roadMinor:COLORS.roadMajor;
              const opacity=cls==='major'?0.91:
                cls==='secondary'?0.58:
                cls==='rail'?0.38:
                cls==='minor'?0.38:0.46;
              gl.setPaintProperty(layerId,'line-color',ink);
              gl.setPaintProperty(layerId,'line-opacity',opacity);
            }else{
              // Any extra vector outlines also recede instead of competing
              // with primary roads and destination markers.
              gl.setPaintProperty(layerId,'line-color',COLORS.minor);
              gl.setPaintProperty(layerId,'line-opacity',0.36);
            }
          }else if(kind==='symbol'&&layer.layout&&layer.layout['text-field']){
            if(NAME_LABELS.test(name)&&!EXCLUDED_LABELS.test(name)){
              gl.setLayoutProperty(layerId,'text-field',ENGLISH_NAME);
            }
            const water=/water|river|ocean|lake/.test(name);
            const road=/road|street|transport|highway/.test(name);
            gl.setPaintProperty(layerId,'text-color',water?'#83CADB':road?COLORS.roadLabel:COLORS.white);
            gl.setPaintProperty(layerId,'text-halo-color',COLORS.halo);
            gl.setPaintProperty(layerId,'text-halo-width',1.6);
          }
        }catch(error){
          console.debug('Map layer styling skipped:',layerId,error?.message||error);
        }
      }
    }catch(error){console.warn('Dark map styling unavailable:',error);}
  }
  function installFallback(map){
    const raster=L.tileLayer('https://basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',{
      maxZoom:19,
      attribution:'&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'
    });
    raster.addTo(map);
    const notice=document.getElementById('map-error');
    if(notice){
      notice.textContent='Detailed vector map unavailable; showing a simplified dark map. Place names and directions remain available.';
      notice.hidden=false;
    }
    return raster;
  }
  window.installPrintBasemap=function(leafletMap){
    if(typeof L==='undefined'||!L.maplibreGL||!window.maplibregl){
      return installFallback(leafletMap);
    }
    let layer,loaded=false,abandoned=false;
    try{
      layer=L.maplibreGL({style:STYLE,attributionControl:false}).addTo(leafletMap);
      // Required tile/data attribution is visible with the Leaflet controls.
      leafletMap.attributionControl?.addAttribution(
        '<a href="https://openfreemap.org/">OpenFreeMap</a> · '+
        '<a href="https://www.openmaptiles.org/">OpenMapTiles</a> · '+
        '<a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
      );
      const gl=layer.getMaplibreMap();
      if(!gl){leafletMap.removeLayer(layer);return installFallback(leafletMap);}
      const onLoad=()=>{
        if(abandoned)return;
        loaded=true;
        applyInkStyle(gl);
      };
      if(gl.isStyleLoaded())onLoad();else gl.once('load',onLoad);
      // Browser/WebGL/CDN failures should never leave a permanently blank map.
      setTimeout(()=>{
        if(loaded||abandoned)return;
        abandoned=true;
        try{leafletMap.removeLayer(layer)}catch{}
        installFallback(leafletMap);
      },16000);
      return layer;
    }catch(error){
      abandoned=true;
      console.warn('Vector basemap unavailable:',error);
      if(layer){try{leafletMap.removeLayer(layer)}catch{}}
      return installFallback(leafletMap);
    }
  };
})();