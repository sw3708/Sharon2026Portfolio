
/* Contextual cursor: a dot, an eye for case studies, and a greeting over Sharon's name. */
(() => {
 const fine=matchMedia('(hover: hover) and (pointer: fine)'),reduced=matchMedia('(prefers-reduced-motion: reduce)');
 const dot=document.createElement('div');dot.id='mouse-dot';dot.setAttribute('aria-hidden','true');dot.dataset.mode='dot';
 dot.innerHTML='<svg class="cursor-eye" viewBox="0 0 32 32" fill="none" aria-hidden="true"><g><path d="M3 16c6-10 20-10 26 0-6 10-20 10-26 0Z"/><circle cx="16" cy="16" r="4"/></g></svg><svg class="cursor-hand" viewBox="-4 -4 34 34" fill="none" aria-hidden="true"><g><path d="M18 11V7a2 2 0 0 0-4 0v4M14 10V5a2 2 0 0 0-4 0v6M10 10.5V7a2 2 0 0 0-4 0v9M18 8a2 2 0 0 1 4 0v8a8 8 0 0 1-8 8h-2c-2.8 0-4.5-1-6-3L2 16.5a2 2 0 0 1 3-3l3 3"/></g><path class="hand-greeting" d="M-1 7c-2-3-1-6 1-8M25 1c3 1 4 4 4 7"/></svg>';
 const canvas=document.createElement('canvas');canvas.id='mouse-waves';canvas.setAttribute('aria-hidden','true');document.body.append(canvas,dot);
 const ctx=canvas.getContext('2d'),waves=[];let raf=0,portalRaf=0,lastSpawn=-Infinity,lastX=0,lastY=0,wasVisible=false,mode='dot';
 function setMode(next){if(next===mode)return;mode=next;dot.dataset.mode=next;}
 function modeFor(target){
  if(!target||!target.closest)return 'dot';
  if(document.body.classList.contains('is-dragging')||target.closest('.priority-pill,.fall-replay,input,textarea,select,video[controls],iframe,.case-ripple-transition'))return 'dot';
  if(target.closest('.site-name,.hero-title .line:first-child,[data-name]'))return 'wave';
  if(target.closest('#slides .slide[data-project],[data-gallery-project],[data-sn-project],.pg-tile,[data-gallery-art],.sandbox-fall'))return 'eye';
  return 'dot';
 }
 function portal(){
  const layer=document.querySelector('.case-ripple-transition'),dialogs=[...document.querySelectorAll('dialog[open]')];
  const owner=layer||dialogs.at(-1)||document.body;
  if(dot.parentElement!==owner)owner.appendChild(dot);
  if(canvas.parentElement!==owner)owner.appendChild(canvas);
 }
 function refresh(){
  portalRaf=0;portal();if(wasVisible)setMode(modeFor(document.elementFromPoint(lastX,lastY)));
 }
 function scheduleRefresh(){if(!portalRaf)portalRaf=requestAnimationFrame(refresh);}
 function resize(){const ratio=Math.min(devicePixelRatio||1,1.5);canvas.width=Math.round(innerWidth*ratio);canvas.height=Math.round(innerHeight*ratio);if(ctx)ctx.setTransform(ratio,0,0,ratio,0,0);}
 function hide(){
  dot.style.opacity='0';wasVisible=false;waves.length=0;setMode('dot');document.documentElement.classList.remove('custom-pointer');
  if(raf)cancelAnimationFrame(raf);raf=0;if(ctx)ctx.clearRect(0,0,innerWidth,innerHeight);
 }
 function draw(now){
  raf=0;if(!ctx)return;ctx.clearRect(0,0,innerWidth,innerHeight);
  for(let i=waves.length-1;i>=0;i--){
   const wave=waves[i],age=(now-wave.born)/680;if(age>=1){waves.splice(i,1);continue;}
   const t=Math.max(0,age),fade=Math.pow(1-t,2),radius=7+(1-Math.pow(1-t,2))*42;
   ctx.strokeStyle='rgba(255,255,255,'+(.075*fade).toFixed(4)+')';ctx.lineWidth=.8;ctx.beginPath();ctx.ellipse(wave.x,wave.y,radius*1.07,radius*.90,wave.angle,0,Math.PI*2);ctx.stroke();
   ctx.strokeStyle='rgba(255,255,255,'+(.035*fade).toFixed(4)+')';ctx.beginPath();ctx.ellipse(wave.x,wave.y,radius*.74,radius*.67,wave.angle,0,Math.PI*2);ctx.stroke();
  }
  if(waves.length)raf=requestAnimationFrame(draw);
 }
 document.addEventListener('pointermove',event=>{
  if(!fine.matches||(event.pointerType&&event.pointerType!=='mouse')){hide();return;}
  if(event.target&&event.target.closest('iframe')){hide();return;}
  portal();setMode(modeFor(event.target));document.documentElement.classList.add('custom-pointer');
  dot.style.transform='translate3d('+event.clientX+'px,'+event.clientY+'px,0) translate(-50%,-50%)';dot.style.opacity='1';
  const now=performance.now(),dx=event.clientX-lastX,dy=event.clientY-lastY;
  if(wasVisible&&ctx&&!reduced.matches&&now-lastSpawn>=45&&Math.hypot(dx,dy)>5){
   waves.push({x:event.clientX,y:event.clientY,born:now,angle:Math.atan2(dy,dx)});if(waves.length>18)waves.shift();lastSpawn=now;if(!raf)raf=requestAnimationFrame(draw);
  }
  lastX=event.clientX;lastY=event.clientY;wasVisible=true;
 },{passive:true});
 document.addEventListener('pointerover',event=>{if(wasVisible)setMode(modeFor(event.target));},{passive:true});
 document.addEventListener('pointerleave',hide);document.addEventListener('keydown',event=>{if(event.key==='Tab')hide();});
 document.addEventListener('visibilitychange',()=>{if(document.hidden)hide();});window.addEventListener('blur',hide);
 window.addEventListener('resize',resize,{passive:true});window.addEventListener('scroll',scheduleRefresh,{passive:true});
 document.addEventListener('close',scheduleRefresh,true);document.addEventListener('case-ripple-finished',scheduleRefresh);
 if(typeof MutationObserver!=='undefined')new MutationObserver(scheduleRefresh).observe(document.body,{childList:true,subtree:true});
 fine.addEventListener('change',()=>{if(!fine.matches)hide();});reduced.addEventListener('change',hide);resize();
})();

