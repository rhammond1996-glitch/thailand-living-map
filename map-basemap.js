/* English-first, Print Club cartography.
 * Uses OpenFreeMap vector tiles; falls back to classic raster tiles if
 * MapLibre, WebGL or the vector style is unavailable.
 * API-key free. Original Leaflet map and trip overlays stay intact.
 */
(function(){
  'use strict';
  const STYLE='https://tiles.openfreemap.org/styles/positron';
  const PAPER='#fbf7ec',INK='#24252b',WATER='#cbe6f7',PARK='#dbedbd';
  const EXCLUDED_LABELS=/shield|housenumber|route-number|exit-number|motorway-junction|road-number|oneway/i;
  const NAME_LABELS=/label|name|place|poi|city|town|village|country|state|transport|road|street|waterway|airport|park/i;
  const ENGLISH_NAME=['coalesce',
    ['get','name_en'],['get','name:en'],['get','name:latin'],
    ['get','name:international'],['get','name_int'],['get','name'],['get','ref'],''];
  function stylePrintCartography(gl){
    try{
      const layers=gl.getStyle()?.layers||[];
      for(const layer of layers){
        const id=layer.id||'',kind=layer.type;
        try{
          if(kind==='background'){
            gl.setPaintProperty(id,'background-color',PAPER);
          }else if(kind==='fill'){
            if(/water|ocean|lake|river/i.test(id)&&!/land/i.test(id))gl.setPaintProperty(id,'fill-color',WATER);
            else if(/park|wood|forest|nature|garden|grass/i.test(id))gl.setPaintProperty(id,'fill-color',PARK);
          }else if(kind==='symbol'&&layer.layout&&layer.layout['text-field']){
            if(NAME_LABELS.test(id)&&!EXCLUDED_LABELS.test(id)){
              // The underlying vector tiles may lack an English name for
              // a smaller local POI, so original/local text is the fallback.
              gl.setLayoutProperty(id,'text-field',ENGLISH_NAME);
            }
            gl.setPaintProperty(id,'text-color',INK);
            gl.setPaintProperty(id,'text-halo-color','#fffdf6');
            gl.setPaintProperty(id,'text-halo-width',1.35);
          }
        }catch(error){
          // Third-party style layers have diverse paint/expression layouts.
          // A single unsupported layer must not blank the entire map.
          console.debug('Cartography layer skipped:',id,error?.message||error);
        }
      }
    }catch(error){console.warn('Could not apply English-first map labels:',error);}
  }
  function installFallback(map){
    const raster=L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png',{
      maxZoom:19,
      attribution:'&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap contributors</a>'
    });
    raster.addTo(map);
    const notice=document.getElementById('map-error');
    if(notice){
      notice.textContent='English-first map temporarily unavailable. Standard map shown; our place names and directions remain in English.';
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
      const gl=layer.getMaplibreMap();
      if(!gl){leafletMap.removeLayer(layer);return installFallback(leafletMap);}
      const onLoad=()=>{
        if(abandoned)return;
        loaded=true;
        stylePrintCartography(gl);
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