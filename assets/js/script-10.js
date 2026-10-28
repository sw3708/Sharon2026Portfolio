
/* Shared, visibility-aware playback for the new project footage. */
(() => {
 const sources={buildscape:document.getElementById('buildscapeMediaSource'),'logo-animations':document.getElementById('logosMediaSource')};
 for(const [key,source] of Object.entries(sources)){
  const cover=document.querySelector('#slides .slide[data-project="'+key+'"]');
  const video=document.createElement('video');video.className='project-motion-video';video.dataset.motionProject=key;
  video.src=source.src;video.poster=cover.querySelector('.bg img').src;video.muted=true;video.playsInline=true;video.preload='none';video.setAttribute('aria-hidden','true');cover.querySelector('.bg').appendChild(video);
 }
 const states=new Map(),motion=matchMedia('(prefers-reduced-motion: reduce)');
 function sync(video,state){
  if(video.dataset.caseRippleLive==='true'){if(!document.hidden&&!motion.matches&&!video.ended)video.play().catch(()=>{});state.playing=true;return;}
  const caseFilm=!!video.closest('#caseView');
  const blocked=caseFilm?!document.body.classList.contains('case-open'):document.body.classList.contains('case-open')||document.body.classList.contains('portfolio-dialog-open');
  const play=state.visible&&!document.hidden&&!blocked&&!motion.matches;
  if(!play){video.pause();state.playing=false;return;}
  if(!state.playing&&!video.dataset.manual){if(!state.visited)video.currentTime=0;state.visited=true;video.play().catch(()=>{});}
  state.playing=true;
 }
 const observer=typeof IntersectionObserver!=='undefined'?new IntersectionObserver(entries=>entries.forEach(entry=>{const state=states.get(entry.target);if(!state)return;state.visible=entry.isIntersecting;if(!state.visible)state.visited=false;sync(entry.target,state);}),{threshold:.12}):null;
 function scan(){
  for(const [video] of states)if(!video.isConnected){video.pause();if(observer)observer.unobserve(video);states.delete(video);}
  document.querySelectorAll('.project-motion-video').forEach(video=>{
   if(states.has(video))return;
   video.muted=true;video.defaultMuted=true;video.playsInline=true;video.loop=video.dataset.motionProject!=='fall-into-me'&&!video.dataset.manual;
   video.defaultPlaybackRate=video.dataset.motionProject==='fall-into-me'?.55:1;video.playbackRate=video.defaultPlaybackRate;
   const state={visible:false,playing:false,visited:false};states.set(video,state);if(observer)observer.observe(video);
  });
 }
 document.addEventListener('portfolio-media-update',scan);
 function syncAll(){for(const [video,state] of states)sync(video,state);}
 document.addEventListener('visibilitychange',syncAll);document.addEventListener('case-ripple-finished',syncAll);motion.addEventListener('change',syncAll);
 new MutationObserver(syncAll).observe(document.body,{attributes:true,attributeFilter:['class']});
 document.getElementById('portfolioProject').addEventListener('close',()=>document.getElementById('portfolioMotionVideo').pause());
 scan();
})();

