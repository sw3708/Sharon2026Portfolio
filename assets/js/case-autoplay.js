/* One visible case-study film at a time, with controls that stay in reach. */
(() => {
 let muted=false,active=null,queued=false;
 const states=new Map(),reduced=matchMedia('(prefers-reduced-motion: reduce)');
 const style=document.createElement('style');
 style.textContent='.study-media-controls{position:fixed;z-index:240;right:90px;bottom:28px;display:flex;gap:8px;padding:7px;border:1px solid #ffffff55;border-radius:99px;background:#171719ed;color:#fff;box-shadow:0 4px 18px #0002}.study-media-controls[hidden]{display:none!important}.study-media-controls button{padding:9px 14px;border:1px solid #ffffff50;border-radius:99px;background:transparent;color:inherit;font:500 12px/1.3 Arial,sans-serif;cursor:pointer}.study-media-controls button:focus-visible{outline:2px solid #fff;outline-offset:3px}@media(max-width:700px){.study-media-controls{right:16px;bottom:76px}.study-media-controls button{font-size:12px;min-height:40px}}';
 document.head.appendChild(style);
 function label(state){
  state.sound.textContent=state.video.muted?'Enable sound':'Mute';
  state.sound.setAttribute('aria-label',state.video.muted?'Enable video sound':'Mute video sound');
  state.sound.setAttribute('aria-pressed',String(state.video.muted));
  state.play.textContent=state.video.ended?'Replay':state.video.paused?'Play':'Pause';
 }
 function setMuted(state,value){state.expectedMuted=value;state.video.muted=value;label(state);}
 function applyPreference(){states.forEach(state=>setMuted(state,muted));}
 function play(state){
  const video=state.video;if(!video.getAttribute('src'))return;
  if(active&&active!==video)active.pause();
  active=video;setMuted(state,muted);
  const attempt=video.play();
  if(attempt)attempt.catch(error=>{
   if(active!==video||!state.entered||error.name!=='NotAllowedError')return;
   setMuted(state,true);video.play().catch(()=>label(state));
  });
 }
 function update(){
  queued=false;let best=null,bestArea=0;
  const open=document.body.classList.contains('case-open')&&!document.hidden;
  states.forEach(state=>{
   const video=state.video,r=video.getBoundingClientRect(),section=video.closest('.sn-panel');
   const eligible=open&&video.isConnected&&r.width>0&&r.height>0&&!video.closest('[inert]')&&(!section||section.getAttribute('aria-hidden')!=='true');
   const visibleHeight=Math.max(0,Math.min(r.bottom,innerHeight)-Math.max(r.top,150));
   const area=eligible?visibleHeight*Math.max(0,Math.min(r.right,innerWidth)-Math.max(0,r.left)):0;
   if(visibleHeight>=Math.min(r.height*.4,180)&&area>bestArea){best=state;bestArea=area;}
  });
  states.forEach(state=>{state.controls.hidden=state!==best;if(state!==best){state.entered=false;state.video.pause();}});
  if(best&&!best.entered&&best.video.getAttribute('src')){best.entered=true;active=best.video;if(!reduced.matches)play(best);label(best);}
  if(!best)active=null;
 }
 function schedule(){if(!queued){queued=true;requestAnimationFrame(update);}}
 const observer=new IntersectionObserver(schedule,{threshold:[0,.2,.4,.6,.8,1]});
 function discover(){
  document.querySelectorAll('.sn-slide-deck video').forEach(video=>{
   if(states.has(video))return;
   const controls=document.createElement('div'),sound=document.createElement('button'),playButton=document.createElement('button');
   controls.className='study-media-controls';controls.hidden=true;controls.setAttribute('role','group');controls.setAttribute('aria-label',(video.getAttribute('aria-label')||'Case study video')+' playback');
   sound.type=playButton.type='button';controls.append(playButton,sound);
   video.controls=true;video.playsInline=true;
   const state={video,controls,sound,play:playButton,entered:false,expectedMuted:video.muted};states.set(video,state);
   document.getElementById('caseView').appendChild(controls);label(state);
   sound.addEventListener('click',()=>{muted=!video.muted;applyPreference();});
   playButton.addEventListener('click',()=>{if(!video.paused){video.pause();return;}if(video.ended)video.currentTime=0;play(state);});
   video.addEventListener('volumechange',()=>{if(video.muted!==state.expectedMuted){muted=video.muted;applyPreference();}else label(state);});
   ['play','pause','ended'].forEach(event=>video.addEventListener(event,()=>label(state)));
   video.addEventListener('loadedmetadata',schedule);observer.observe(video);
  });
  states.forEach((state,video)=>{if(!video.isConnected){video.pause();observer.unobserve(video);state.controls.remove();states.delete(video);}});
  schedule();
 }
 new MutationObserver(discover).observe(document.body,{childList:true,subtree:true,attributes:true,attributeFilter:['src','class','inert','aria-hidden']});
 document.addEventListener('scroll',schedule,true);document.addEventListener('visibilitychange',schedule);window.addEventListener('resize',schedule);reduced.addEventListener('change',()=>{if(reduced.matches&&active)active.pause();schedule();});
 discover();
})();
