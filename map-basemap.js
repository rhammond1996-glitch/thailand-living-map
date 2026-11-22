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
    background:'#0A122A', land:'#101B36',water:'#063A57',waterLine:'#20D9F1',
    park:'#0C4338',building:'#182D4B',minor:'#2D516F',
    cyan:'#27DFFC',lime:'#D6F64B',pink:'#FA3FA4',
    road:'#8AD8ED',white:'#F6F6FF',halo:'#091429'
  };
  const EXCLUDED_LABELS=/shield|housenumber|route-number|exit-number|motorway-junction|road-number|oneway/i;
  const NAME_LABELS=/label|name|place|poi|city|town|village|country|state|transport|road|street|waterway|airport|park/i;
  const ENGLISH_NAME=['coalesce',
    ['get','name_en'],['get','name:en'],['get','name:latin'],
    ['get','name:international'],['get','name_int'],['get','name_latin'],['get','name'],['get','ref'],''];
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
              gl.setPaintProperty(layerId,'line-opacity',0.7);
            }else if(/boundary|admin|border|country|province|state/.test(name)){
              gl.setPaintProperty(layerId,'line-color',COLORS.pink);
              gl.setPaintProperty(layerId,'line-opacity',0.7);
            }else if(/transport|road|highway|motorway|street|bridge|tunnel|path|railway|trunk|primary|secondary|tertiary|footway|minor/.test(name)){
              const main=/motorway|trunk|primary|highway|major/.test(name);
              const secondary=/secondary|tertiary|railway/.test(name);
              const pedestrian=/footway|path|pedestrian|track|service/.test(name);
              gl.setPaintProperty(layerId,'line-color',main?COLORS.lime:secondary?COLORS.cyan:pedestrian?COLORS.minor:COLORS.road);
              gl.setPaintProperty(layerId,'line-opacity',main?0.92:secondary?0.83:pedestrian?0.5:0.66);
            }
          }else if(kind==='symbol'&&layer.layout&&layer.layout['text-field']){
            if(NAME_LABELS.test(name)&&!EXCLUDED_LABELS.test(name)){
              gl.setLayoutProperty(layer.id,'text-field',ENGLISH_NAME);
            }
            const water=/water|river|ocean|lake/.test(name);
            const road=/road|street|transport|highway/.test(name);
            gl.setPaintProperty(layer.id,'text-color',water?COLORS.cyan:road?'#D1DDF0':COLORS.white);
            gl.setPaintProperty(layer.id,'text-halo-color',COLORS.halo);
            gl.setPaintProperty(layer.id,'text-halo-width',1.8);
          }
        }catch(error){
          console.debug('Map layer styling skipped:',layer.id,error?.message||error);
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