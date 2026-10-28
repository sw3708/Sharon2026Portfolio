/* Full Sandbox film: black lead-in, gentle zoom, black exit. */
(() => {
 const toggle=document.getElementById('themeToggle');
 if(!toggle)return;
 const layer=document.createElement('div'),film=document.createElement('video');
 layer.setAttribute('aria-hidden','true');
 layer.style.cssText='position:fixed;inset:0;overflow:hidden;background:#000;z-index:2147483646;opacity:0;visibility:hidden;transition:opacity 220ms ease;pointer-events:none';
 film.src='assets/videos/sandbox-transition-full.mp4';
 film.muted=true;film.playsInline=true;film.preload='auto';
 film.style.cssText='width:100%;height:100%;display:block;object-fit:cover;opacity:0;transition:opacity 220ms ease;transform:scale(1)';
 layer.appendChild(film);document.body.appendChild(layer);
 let active=false,sequence=0,watchdog,zoom;
 const wait=ms=>new Promise(resolve=>setTimeout(resolve,ms));
 async function finish(){
  if(!active)return;
  active=false;const id=++sequence;clearTimeout(watchdog);
  film.style.opacity='0';await wait(240);
  if(id!==sequence)return;
  film.pause();if(zoom)zoom.cancel();
  layer.style.opacity='0';await wait(240);
  if(id!==sequence)return;
  layer.style.visibility='hidden';layer.style.pointerEvents='none';
 }
 layer.addEventListener('wheel',e=>e.preventDefault(),{passive:false});
 layer.addEventListener('touchmove',e=>e.preventDefault(),{passive:false});
 toggle.addEventListener('click',async()=>{
  if(document.documentElement.getAttribute('data-theme')!=='dark'){finish();return;}
  if(matchMedia('(prefers-reduced-motion: reduce)').matches)return;
  const id=++sequence;active=true;clearTimeout(watchdog);
  if(zoom)zoom.cancel();
  film.pause();film.currentTime=0;film.style.opacity='0';
  layer.style.visibility='visible';layer.style.pointerEvents='auto';
  layer.getBoundingClientRect();layer.style.opacity='1';
  await wait(300);if(id!==sequence||!active)return;
  watchdog=setTimeout(finish,12000);
  film.play().catch(finish);
 });
 film.addEventListener('playing',()=>{
  if(!active){film.pause();return;}
  film.style.opacity='1';
  if(zoom)zoom.cancel();
  zoom=film.animate([
   {transform:'scale(1)',offset:0},
   {transform:'scale(1.13)',offset:.28},
   {transform:'scale(1.025)',offset:.55},
   {transform:'scale(1.16)',offset:.8},
   {transform:'scale(1)',offset:1}
  ],{duration:(Number.isFinite(film.duration)?film.duration:6)*1000,easing:'ease-in-out',fill:'forwards'});
 });
 film.addEventListener('ended',finish);film.addEventListener('error',finish);
 document.addEventListener('keydown',e=>{if(active&&e.key==='Escape')finish();});
})();
