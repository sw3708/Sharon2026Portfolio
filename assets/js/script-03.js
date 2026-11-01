/* A small isolated hero orb replaces the cursor and ripple canvas. */
(() => {
 const fine=matchMedia('(hover: hover) and (pointer: fine)'),reduced=matchMedia('(prefers-reduced-motion: reduce)');
 const dot=document.createElement('div');dot.id='mouse-dot';dot.setAttribute('aria-hidden','true');
 const video=document.createElement('video');video.src='assets/videos/cursor-orb.mp4';video.muted=true;video.defaultMuted=true;video.loop=true;video.playsInline=true;video.preload='auto';video.setAttribute('muted','');video.setAttribute('playsinline','');video.tabIndex=-1;
 dot.appendChild(video);document.body.appendChild(dot);
 const style=document.createElement('style');
 style.textContent=`
 #mouse-dot,#mouse-dot[data-mode="eye"],#mouse-dot[data-mode="wave"]{width:32px;height:32px;background:#080808;border-radius:50%;overflow:hidden;mix-blend-mode:normal;box-shadow:0 0 0 1px #ffffff48,0 1px 5px #0006;z-index:2147483647;transition:width .18s ease,height .18s ease;pointer-events:none;}
 #mouse-dot[data-mode="link"]{width:42px;height:42px;}
 #mouse-dot video{display:block;width:100%;height:100%;object-fit:cover;pointer-events:none;}
 #mouse-waves{display:none!important;}
 @media(prefers-reduced-motion:reduce){#mouse-dot{transition:none;}}
 `;
 document.head.appendChild(style);
 let visible=false,failed=false,refreshFrame=0,x=0,y=0;
 function portal(){
  const owner=document.querySelector('.case-ripple-transition')||[...document.querySelectorAll('dialog[open]')].at(-1)||document.body;
  if(dot.parentElement!==owner)owner.appendChild(dot);
 }
 function hide(){visible=false;dot.style.opacity='0';document.documentElement.classList.remove('custom-pointer');video.pause();}
 function syncPlayback(){if(visible&&!document.hidden&&!reduced.matches){if(video.paused)video.play().catch(()=>{});}else video.pause();}
 function mode(target){
  if(!target||!target.closest)return;
  if(target.closest('input,textarea,select,iframe,video[controls],[contenteditable="true"]')){hide();return false;}
  dot.dataset.mode=target.closest('a,button,[role="button"],[data-project],.pg-tile')?'link':'orb';return true;
 }
 function refresh(){refreshFrame=0;portal();if(visible)mode(document.elementFromPoint(x,y));}
 function schedule(){if(!refreshFrame)refreshFrame=requestAnimationFrame(refresh);}
 document.addEventListener('pointermove',event=>{
  if(failed||!fine.matches||(event.pointerType&&event.pointerType!=='mouse')){hide();return;}
  if(mode(event.target)===false)return;
  x=event.clientX;y=event.clientY;
  dot.style.transform='translate3d('+x+'px,'+y+'px,0) translate(-50%,-50%)';
  if(!visible){portal();visible=true;dot.style.opacity='1';document.documentElement.classList.add('custom-pointer');syncPlayback();}
 },{passive:true});
 document.addEventListener('pointerover',event=>{if(visible)mode(event.target);},{passive:true});
 document.addEventListener('pointerleave',hide);
 document.addEventListener('keydown',event=>{if(event.key==='Tab')hide();});
 window.addEventListener('blur',hide);
 document.addEventListener('visibilitychange',()=>{if(document.hidden)hide();});
 window.addEventListener('scroll',schedule,{passive:true});
 document.addEventListener('close',schedule,true);
 document.addEventListener('case-ripple-finished',schedule);
 new MutationObserver(schedule).observe(document.body,{childList:true,subtree:true});
 fine.addEventListener('change',()=>{if(!fine.matches)hide();});
 reduced.addEventListener('change',syncPlayback);
 video.addEventListener('error',()=>{failed=true;hide();});
})();
