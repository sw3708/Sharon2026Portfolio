
/* Fall Into Me: the cover and preview restart on each visit, then hold black. */
(() => {
 const cover=document.querySelector('#slides .slide[data-project="fall-into-me"]');
 const preview=document.getElementById('fallProjectVideo'),dialog=document.getElementById('portfolioProject');
 const film=document.createElement('video');film.className='fall-cover-video';
 film.muted=true;film.playsInline=true;film.preload='none';film.defaultPlaybackRate=.55;film.playbackRate=.55;film.poster=cover.querySelector('.bg img').src;
 film.setAttribute('aria-hidden','true');cover.querySelector('.bg').appendChild(film);
 film.addEventListener('loadedmetadata',()=>{film.currentTime=1;});
 const replay=document.createElement('button');replay.type='button';replay.className='fall-replay';replay.textContent='Replay film ↺';replay.hidden=true;cover.appendChild(replay);
 film.addEventListener('ended',()=>{replay.hidden=false;});
 replay.addEventListener('click',e=>{e.stopPropagation();replay.hidden=true;film.currentTime=1;film.play().catch(()=>{});});
 replay.addEventListener('keydown',e=>e.stopPropagation());
 let inView=false,wasPlaying=false;
 function sync(){
  if(film.dataset.caseRippleLive==='true'){if(!document.hidden&&!matchMedia('(prefers-reduced-motion: reduce)').matches&&!film.ended)film.play().catch(()=>{});return;}
  const visible=inView&&!cover.hidden&&!document.hidden&&!document.body.classList.contains('portfolio-dialog-open')&&!document.body.classList.contains('case-open')&&!matchMedia('(prefers-reduced-motion: reduce)').matches;
  if(visible){if(!film.src)film.src=preview.src;if(!wasPlaying){replay.hidden=true;film.currentTime=1;film.play().catch(()=>{});}}
  else film.pause();
  wasPlaying=visible;
 }
 if(typeof IntersectionObserver!=='undefined')new IntersectionObserver(entries=>{inView=entries[0].isIntersecting;sync();},{threshold:.2}).observe(cover);
 document.addEventListener('visibilitychange',sync);document.addEventListener('case-ripple-finished',sync);
 new MutationObserver(sync).observe(document.body,{attributes:true,attributeFilter:['class']});
 new MutationObserver(sync).observe(cover,{attributes:true,attributeFilter:['hidden']});
 dialog.addEventListener('close',()=>{preview.pause();preview.currentTime=0;sync();});
})();

