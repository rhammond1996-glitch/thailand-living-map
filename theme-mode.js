/* Shared day/night appearance for Thailand Living Map.
   Explicit user choice is stored only on this browser/device. */
(function(){
  'use strict';
  const KEY='thailand-living-map:appearance:v1';
  const root=document.documentElement;
  const allowed=['day','night'];
  const buttons=()=>Array.from(document.querySelectorAll('#theme-toggle [data-ui-choice]'));
  function commit(mode,save){
    const value=allowed.includes(mode)?mode:'day';
    root.dataset.uiTheme=value;
    root.style.colorScheme=value==='night'?'dark':'light';
    const meta=document.querySelector('meta[name="theme-color"]');
    if(meta)meta.setAttribute('content',value==='night'?'#0b1326':'#f7f7fe');
    for(const button of buttons()){
      const active=button.dataset.uiChoice===value;
      button.setAttribute('aria-pressed',String(active));
      button.classList.toggle('active',active);
    }
    if(save){try{localStorage.setItem(KEY,value);}catch{}}
    document.dispatchEvent(new CustomEvent('thailand:themechange',{detail:{theme:value}}));
  }
  document.addEventListener('DOMContentLoaded',()=>{
    // The early script in the head sets the initial theme without a flash.
    commit(root.dataset.uiTheme||'day',false);
    const toggle=document.getElementById('theme-toggle');
    toggle?.addEventListener('click',e=>{
      const target=e.target.closest('[data-ui-choice]');
      if(target&&toggle.contains(target))commit(target.dataset.uiChoice,true);
    });
  });
  window.setThailandAppearance=mode=>commit(mode,true);
})();
