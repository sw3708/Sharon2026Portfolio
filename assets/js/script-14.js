

/* The supplied experiment runs in an isolated document and is created only on demand. */
(() => {
 let player=null,opener=null,urls=[],frame=null,muted=false,escapeBridge=null,readyTimer=0;
 function buildURL(){return new URL('experiments/fall-into-me/index.html',document.baseURI).href;}
 function close(){if(player&&player.open)player.close();}
 window.openFallExperience=source=>{
  if(player)return;
  opener=source;muted=false;
  player=document.createElement('dialog');player.id='fallExperience';player.className='fall-experience';player.setAttribute('aria-label','Fall Into Me interactive experiment');
  player.innerHTML='<header class="fall-player-bar"><div><strong>Fall Into Me</strong><span>Interactive experiment</span></div><nav aria-label="Experiment controls"><button type="button" data-fall-restart>Restart ↺</button><button type="button" data-fall-sound aria-pressed="false" aria-label="Mute experiment sound">Mute</button><button type="button" data-fall-close>Close ×</button></nav></header><div class="fall-player-stage"><p class="fall-player-loading" role="status">Preparing the experiment…</p></div><footer>Scroll or use ↑ ↓ to enter · M toggles sound · Esc closes</footer>';
  player.querySelector('[data-fall-close]').onclick=close;
  player.querySelector('[data-fall-sound]').onclick=()=>{muted=!muted;syncSound();send({type:'fall:mute',muted});};
  player.querySelector('[data-fall-restart]').onclick=()=>mount(true);
  player.addEventListener('close',()=>{
   clearTimeout(readyTimer);if(frame){frame.src='about:blank';frame.remove();frame=null;}
   urls.forEach(url=>URL.revokeObjectURL(url));urls=[];
   window.removeEventListener('message',escapeBridge);document.removeEventListener('visibilitychange',visibility);
   ['mouse-dot','mouse-waves'].forEach(id=>{const node=document.getElementById(id);if(node&&player.contains(node))document.body.appendChild(node);});
   player.remove();player=null;if(opener&&opener.isConnected)opener.focus({preventScroll:true});opener=null;
  },{once:true});
  escapeBridge=event=>{if(!frame||event.source!==frame.contentWindow||!event.data)return;const type=event.data.type;if(type==='fall:close')close();if(type==='fall:phase'){player.querySelector('footer').textContent=event.data.phase==='gravity'?'Move your cursor to steer gravity · 1–5 adjusts strength · M toggles sound · Esc closes':'Scroll or use ↑ ↓ to enter · M toggles sound · Esc closes';}if(type==='fall:sound'){muted=!!event.data.muted;syncSound();}if(type==='fall:ready'){clearTimeout(readyTimer);player.querySelector('.fall-player-loading').hidden=true;frame.focus();}};
  window.addEventListener('message',escapeBridge);document.addEventListener('visibilitychange',visibility);
  document.body.append(player);player.showModal();
  requestAnimationFrame(()=>{try{player.dataset.entry=buildURL();mount(false);}catch(error){player.querySelector('.fall-player-loading').textContent='The experiment could not start. Close and try again.';console.error('Fall Into Me could not start',error);}});
 };
 function syncSound(){if(!player)return;const button=player.querySelector('[data-fall-sound]');button.textContent=muted?'Enable sound':'Mute';button.setAttribute('aria-label',muted?'Enable experiment sound':'Mute experiment sound');button.setAttribute('aria-pressed',String(muted));}
 function send(message){if(frame)frame.contentWindow.postMessage(message,'*');}
 function visibility(){send({type:'fall:visibility',hidden:document.hidden});}
 function mount(restart){
  if(!player)return;clearTimeout(readyTimer);
  if(frame){frame.src='about:blank';frame.remove();}
  const loading=player.querySelector('.fall-player-loading');loading.hidden=false;loading.textContent=restart?'Restarting…':'Preparing the experiment…';
  frame=document.createElement('iframe');frame.title='Fall Into Me playable prototype';frame.allow='autoplay; fullscreen';frame.src=player.dataset.entry;
  frame.addEventListener('load',()=>send({type:'fall:mute',muted}),{once:true});
  player.querySelector('.fall-player-stage').append(frame);
  readyTimer=setTimeout(()=>{if(player)loading.hidden=true;},18000);
 }
})();

