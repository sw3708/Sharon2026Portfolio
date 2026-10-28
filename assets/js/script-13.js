
/* Load motion only in Sandbox, pause outside the viewport, and cap simultaneous playback. */
(()=>{
 const wall=document.querySelector('.pg-wall');if(!wall)return;
 const tiles=[...wall.querySelectorAll('.pg-tile')],toggle=document.getElementById('pgMotionToggle');
 const reduced=matchMedia('(prefers-reduced-motion: reduce)');
 const media={"pg01":"assets/videos/93568020f0abcd7e.mp4","pg02":"assets/videos/a7cf56ed25e0767a.mp4","pg03":"assets/videos/75255c5d548c9b16.mp4","pg04":"assets/videos/79f4f502d3f992cc.mp4","pg05":"assets/videos/3a8433343eb7d20f.mp4","pg06":"assets/videos/46b0a759ae9da4da.mp4","pg07":"assets/videos/f2bf41b3926e7f63.mp4","pg08":"assets/videos/a6ad66d9a879f669.mp4","pg09":"assets/videos/a86b5bd29a323cb9.mp4","pg10":"assets/videos/df56c9810f0fc168.mp4","pg11":"assets/videos/caf3120a78503f26.mp4","pg12":"assets/videos/4861c91d577f33b4.mp4","pg13":"assets/videos/bec550b1cef00680.mp4","pg14":"assets/videos/a3d1c9883be61e2d.mp4","pg15":"assets/videos/2c85543d773736e6.mp4","pg16":"assets/videos/7c4356c0f941f8af.mp4","pg17":"assets/videos/cf504b699b0afc1c.mp4","pg18":"assets/videos/9aca6f00ef78f815.mp4","pg19":"assets/videos/cf7fc38fb7333f06.mp4"},urls=new Map(),loading=new Map(),inView=new Set();
 let paused=reduced.matches,viewer=null,viewerId=null,focused=null,frame=0,wanted=new Set();
 const isSandbox=()=>document.documentElement.dataset.theme==='dark';
 const enabled=()=>isSandbox()&&!document.hidden&&!paused&&!viewer;
 const source=id=>{
  if(urls.has(id))return Promise.resolve(urls.get(id));
  if(loading.has(id))return loading.get(id);
  const promise=fetch(media[id]).then(r=>r.blob()).then(blob=>{const url=URL.createObjectURL(blob);urls.set(id,url);return url;}).finally(()=>loading.delete(id));
  loading.set(id,promise);return promise;
 };
 function release(tile){
  const video=tile.querySelector('video');video.pause();tile.classList.remove('pg-playing');
  if(video.hasAttribute('src')){video.removeAttribute('src');video.load();}
  if(urls.has(tile.dataset.pgId)){URL.revokeObjectURL(urls.get(tile.dataset.pgId));urls.delete(tile.dataset.pgId);}
 }
 function sync(){
  frame=0;
  const ranked=enabled()?[...inView].filter(tile=>{const r=tile.getBoundingClientRect();return r.bottom>0&&r.top<innerHeight;}).sort((a,b)=>{
   if(a===focused)return -1;if(b===focused)return 1;
   const ar=a.getBoundingClientRect(),br=b.getBoundingClientRect();return Math.abs((ar.top+ar.bottom)/2-innerHeight/2)-Math.abs((br.top+br.bottom)/2-innerHeight/2);
  }).slice(0,matchMedia('(max-width:560px)').matches?3:6):[];
  const active=new Set(ranked);wanted=active;
  tiles.forEach(tile=>{
   const video=tile.querySelector('video');
   if(!active.has(tile)){
    video.pause();
    if(!inView.has(tile)||!isSandbox())release(tile);
    return;
   }
   const ticket=tile.dataset.pgId;
   source(ticket).then(url=>{
    if(!enabled()||!inView.has(tile)||!wanted.has(tile)){if(viewerId!==ticket&&(!inView.has(tile)||!isSandbox()))release(tile);return;}
    if(video.getAttribute('src')!==url){video.src=url;video.muted=true;}
    const result=video.play();if(result)result.catch(()=>tile.classList.remove('pg-playing'));
   }).catch(()=>tile.classList.remove('pg-playing'));
  });
 }
 const schedule=()=>{if(!frame)frame=requestAnimationFrame(sync);};
 function sizeTiles(){
  const gap=parseFloat(getComputedStyle(wall).rowGap)||18,row=8;
  tiles.forEach(tile=>{const box=tile.querySelector('.pg-art'),caption=tile.querySelector('.pg-caption');
   tile.style.gridRowEnd='span '+Math.ceil((box.getBoundingClientRect().height+caption.getBoundingClientRect().height+gap)/(row+gap));
  });
 }
 function updateToggle(){toggle.setAttribute('aria-pressed',String(paused));toggle.querySelector('span').textContent=paused?'Play motion':'Pause motion';}
 toggle.addEventListener('click',()=>{paused=!paused;updateToggle();schedule();});updateToggle();
 const observer=new IntersectionObserver(entries=>{entries.forEach(entry=>{if(entry.isIntersecting)inView.add(entry.target);else inView.delete(entry.target);});schedule();},{threshold:0});
 tiles.forEach(tile=>{
  observer.observe(tile);
  tile.querySelector('video').addEventListener('playing',()=>tile.classList.add('pg-playing'));
  tile.addEventListener('pointerenter',()=>{focused=tile;schedule();});tile.addEventListener('pointerleave',()=>{focused=null;schedule();});
  tile.addEventListener('click',()=>open(tile));
 });
 function open(tile){
  if(viewer)return;
  const dialog=document.createElement('dialog'),film=document.createElement('video'),heading=document.createElement('h2'),close=document.createElement('button');
  viewer=dialog;viewerId=tile.dataset.pgId;dialog.className='pg-video-viewer';dialog.setAttribute('aria-labelledby','pgViewerTitle');
  heading.id='pgViewerTitle';heading.textContent=tile.dataset.pgTitle;
  close.type='button';close.className='pg-viewer-close';close.setAttribute('aria-label','Close video');close.textContent='×';
  film.controls=true;film.playsInline=true;film.loop=true;film.muted=true;film.poster=tile.querySelector('img').src;
  const preview=tile.querySelector('video'),time=preview.currentTime;
  dialog.append(close,film,heading);document.body.append(dialog);dialog.showModal();sync();
  close.addEventListener('click',()=>dialog.close());dialog.addEventListener('click',e=>{if(e.target===dialog)dialog.close();});
  dialog.addEventListener('keydown',e=>{if(e.key==='Escape')e.stopPropagation();});
  dialog.addEventListener('close',()=>{
   film.pause();film.removeAttribute('src');film.load();
   // Move the shared custom cursor out before removing a native dialog.
   ['mouse-dot','mouse-waves'].forEach(id=>{const el=document.getElementById(id);if(el&&dialog.contains(el))document.body.append(el);});
   dialog.remove();viewer=null;viewerId=null;tile.focus({preventScroll:true});schedule();
  },{once:true});
  source(tile.dataset.pgId).then(url=>{if(!dialog.open)return;film.src=url;
   film.addEventListener('loadedmetadata',()=>{film.currentTime=Math.min(time,Math.max(0,film.duration-.1));if(!reduced.matches)film.play().catch(()=>{});},{once:true});
  }).catch(()=>{heading.textContent=tile.dataset.pgTitle+' — use the play control to retry';});
 }
 const resize=new ResizeObserver(()=>{sizeTiles();schedule();});resize.observe(wall);
 window.addEventListener('scroll',schedule,{passive:true});
 window.addEventListener('portfolio-mode-change',()=>{if(!isSandbox()&&viewer)viewer.close();requestAnimationFrame(()=>{sizeTiles();schedule();});});
 document.addEventListener('visibilitychange',()=>{if(document.hidden&&viewer)viewer.querySelector('video').pause();schedule();});
 reduced.addEventListener('change',()=>{paused=reduced.matches;if(paused&&viewer)viewer.querySelector('video').pause();updateToggle();schedule();});
 window.addEventListener('pagehide',()=>{tiles.forEach(release);urls.forEach(url=>URL.revokeObjectURL(url));urls.clear();});
 sizeTiles();
})();

