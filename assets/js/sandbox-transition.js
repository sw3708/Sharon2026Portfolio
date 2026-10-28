/* A brief film bridge into Sandbox; never delays navigation. */
(() => {
 const toggle=document.getElementById('themeToggle');
 const film=document.createElement('video');
 film.src='assets/videos/sandbox-transition.mp4';
 film.muted=true;film.playsInline=true;film.preload='auto';
 film.setAttribute('aria-hidden','true');
 film.style.cssText='position:fixed;inset:0;width:100%;height:100%;object-fit:cover;background:#000;z-index:999999;pointer-events:none;opacity:0;visibility:hidden;transition:opacity 180ms ease';
 document.body.appendChild(film);
 let timer,cleanup;
 const hide=()=>{clearTimeout(timer);film.style.opacity='0';cleanup=setTimeout(()=>{film.pause();film.style.visibility='hidden';},200);};
 toggle.addEventListener('click',()=>{
  clearTimeout(cleanup);
  if(document.documentElement.getAttribute('data-theme')!=='dark'||matchMedia('(prefers-reduced-motion: reduce)').matches){hide();return;}
  film.currentTime=0;film.style.visibility='visible';film.style.opacity='1';
  film.play().catch(hide);
  clearTimeout(timer);timer=setTimeout(hide,4000);
 });
 film.addEventListener('playing',()=>{clearTimeout(timer);timer=setTimeout(hide,1050);});
 film.addEventListener('ended',hide);film.addEventListener('error',hide);
})();
