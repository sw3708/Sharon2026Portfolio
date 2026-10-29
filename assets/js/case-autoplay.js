/* Case-study films: play on arrival, one soundtrack at a time. */
(() => {
 let muted=false,active=null,queued=false;
 const states=new Map();
 const style=document.createElement('style');
 style.textContent='.study-sound-control{display:block;margin:10px 0 10px auto;padding:8px 13px;border:1px solid currentColor;border-radius:999px;background:transparent;color:inherit;font:inherit;font-size:12px;cursor:pointer}.study-sound-control:focus-visible{outline:2px solid currentColor;outline-offset:4px}';
 document.head.appendChild(style);
 function label(state){
  state.button.textContent=state.video.muted?'Enable sound':'Mute';
  state.button.setAttribute('aria-label',state.video.muted?'Enable video sound':'Mute video sound');
 }
 function applyPreference(){
  states.forEach(state=>{state.video.muted=muted;label(state);});
 }
 function start(state){
  const video=state.video;
  if(!video.getAttribute('src'))return;
  if(active&&active!==video)active.pause();
  active=video;state.entered=true;video.muted=muted;label(state);
  const attempt=video.play();
  if(attempt)attempt.catch(error=>{
   if(active!==video||!state.entered||error.name!=='NotAllowedError')return;
   video.muted=true;label(state);
   video.play().catch(()=>{});
  });
 }
 function update(){
  queued=false;
  let best=null,bestArea=0;
  const open=document.body.classList.contains('case-open')&&!document.hidden;
  states.forEach(state=>{
   const video=state.video,r=video.getBoundingClientRect();
   const section=video.closest('.sn-panel');
   const eligible=open&&video.isConnected&&r.width>0&&r.height>0&&!video.closest('[inert]')&&(!section||section.getAttribute('aria-hidden')!=='true');
   const visibleHeight=Math.max(0,Math.min(r.bottom,innerHeight)-Math.max(r.top,120));
   const area=eligible?visibleHeight*Math.max(0,Math.min(r.right,innerWidth)-Math.max(0,r.left)):0;
   if(visibleHeight>=Math.min(r.height*.4,180)&&area>bestArea){best=state;bestArea=area;}
  });
  states.forEach(state=>{
   if(state!==best){state.entered=false;state.video.pause();}
  });
  if(best&&!best.entered)start(best);
  if(!best)active=null;
 }
 function schedule(){if(!queued){queued=true;requestAnimationFrame(update);}}
 const observer=new IntersectionObserver(schedule,{threshold:[0,.2,.4,.6,.8,1]});
 function discover(){
  document.querySelectorAll('.sn-slide-deck video').forEach(video=>{
   if(states.has(video))return;
   const button=document.createElement('button');
   button.type='button';button.className='study-sound-control';
   video.controls=true;video.playsInline=true;
   const state={video,button,entered:false};states.set(video,state);
   video.insertAdjacentElement('afterend',button);label(state);
   button.addEventListener('click',()=>{
    muted=!video.muted;applyPreference();
    if(video.paused)video.play().catch(()=>{});
   });
   video.addEventListener('volumechange',()=>label(state));
   video.addEventListener('loadedmetadata',schedule);
   observer.observe(video);
  });
  states.forEach((state,video)=>{if(!video.isConnected){video.pause();observer.unobserve(video);states.delete(video);}});
  schedule();
 }
 new MutationObserver(discover).observe(document.body,{childList:true,subtree:true,attributes:true,attributeFilter:['src','class','inert','aria-hidden']});
 document.addEventListener('scroll',schedule,true);
 document.addEventListener('visibilitychange',schedule);
 window.addEventListener('resize',schedule);
 discover();
})();
