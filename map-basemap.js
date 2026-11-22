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
    buildingOutline:'rgba(113,143,183,0.16)',
    buildingLine:'#718FAC',
    minor:'#304764',
    lime:'#D6F64B',
    // Pre-toned opaque road inks: no semi-transparent street segments.
    roadMajor:'#34465F',
    roadSecondary:'#42546E',
    roadMinor:'#24334B',
    roadCasing:'#13223B',
    roadRail:'#32445B',
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
  // OpenFreeMap's highway_major_inner contains primary AND secondary AND
  // tertiary roads. Color must be data-driven by each feature's class;
  // coloring the whole 'highway_major' layer neon is why the street grid glowed.
  const ROAD_COLORS=['match',['get','class'],
    ['motorway','trunk','primary'],COLORS.lime,
    ['secondary','tertiary'],COLORS.roadSecondary,
    ['minor','service','track','path','pedestrian','residential','living_street','unclassified'],COLORS.roadMinor,
    COLORS.roadMajor
  ];
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
              // Subtle single-pixel geometry edge, not a bright street grid.
              gl.setPaintProperty(layerId,'fill-outline-color',COLORS.buildingOutline);
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
            }else if(/building/.test(name)){
              gl.setPaintProperty(layerId,'line-color',COLORS.buildingLine);
              gl.setPaintProperty(layerId,'line-opacity',0.16);
            }else if(/landcover|park|forest|wood|grass|garden/.test(name)){
              gl.setPaintProperty(layerId,'line-color',COLORS.minor);
              gl.setPaintProperty(layerId,'line-opacity',0.38);
            }else if(/transport|road|highway|motorway|street|bridge|tunnel|path|rail|trunk|primary|secondary|tertiary|footway|track/.test(name)){
              const casing=/casing|outline/.test(id);
              const rail=/railway|rail|transit|tram|subway/.test(id);
              const minor=/highway_minor|highway_path|footway|pedestrian|service|track|cycle/.test(id);
              if(casing){
                // Opaque tonal casing frames streets without overlap darkening.
                gl.setPaintProperty(layerId,'line-color',COLORS.roadCasing);
              }else if(rail){
                gl.setPaintProperty(layerId,'line-color',COLORS.roadRail);
              }else if(minor){
                gl.setPaintProperty(layerId,'line-color',COLORS.roadMinor);
              }else{
                // Feature-class colors remain per road, but are now fully
                // opaque, including intersections and overlapping geometry.
                gl.setPaintProperty(layerId,'line-color',ROAD_COLORS);
              }
              gl.setPaintProperty(layerId,'line-opacity',1);
              // Some upstream style layers inherit dashed/patterned street
              // strokes, which can read as dark blocks at junctions.
              gl.setPaintProperty(layerId,'line-dasharray',null);
              gl.setPaintProperty(layerId,'line-pattern',null);
              gl.setPaintProperty(layerId,'line-blur',0);
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