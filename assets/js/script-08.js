
/* A shallow typographic sculpture: individual letters lift into a passing wave. */
(() => {
 const title=document.querySelector('h1.hero-title');if(!title)return;
 const reduced=matchMedia('(prefers-reduced-motion: reduce)'),fine=matchMedia('(hover:hover) and (pointer:fine)');
 const letters=[];
 function buildLetters(){
  const word=document.documentElement.getAttribute('data-theme')==='dark'?'Sandbox':'Portfolio';
  title.setAttribute('aria-label',"Sharon's "+word);
  const lines=[...title.querySelectorAll('.line>span')];
  letters.length=0;
  lines.forEach((line,index)=>{
   const text=index===lines.length-1?word:line.textContent;
   line.removeAttribute('data-outline-text');line.setAttribute('aria-hidden','true');line.textContent='';
   for(const char of text){const el=document.createElement('span');el.className='hero-letter';el.textContent=char===' '?'\u00a0':char;line.appendChild(el);letters.push({el,x:0,y:0,ry:0,rx:0,lift:0});}
  });
 }
 buildLetters();
 let px=0,py=0,active=false,frame=0,last=0;
 window.addEventListener('portfolio-mode-change',()=>{
  active=false;if(frame)cancelAnimationFrame(frame);frame=0;last=0;buildLetters();
 });
 function animate(now){
  frame=0;const ease=1-Math.exp(-Math.min((now-last)||16,50)/65);last=now;let unsettled=false;
  for(const letter of letters){
   const rect=letter.el.getBoundingClientRect(),dx=px-(rect.left+rect.width/2-letter.x),dy=py-(rect.top+rect.height/2-letter.y);
   const near=active?Math.exp(-(dx*dx+dy*dy)/(155*155)):0;
   const y=-13*near,ry=-dx/155*12*near,rx=dy/155*8*near;
   letter.y+=(y-letter.y)*ease;letter.ry+=(ry-letter.ry)*ease;letter.rx+=(rx-letter.rx)*ease;letter.lift+=(near-letter.lift)*ease;
   letter.el.style.transform='perspective(800px) translate3d(0,'+letter.y.toFixed(2)+'px,'+(letter.lift*20).toFixed(2)+'px) rotateX('+letter.rx.toFixed(2)+'deg) rotateY('+letter.ry.toFixed(2)+'deg)';
   letter.el.style.setProperty('--letter-light',letter.lift.toFixed(3));
   if(Math.abs(letter.y-y)>.02||Math.abs(letter.ry-ry)>.02||Math.abs(letter.rx-rx)>.02)unsettled=true;
  }
  if(active||unsettled)frame=requestAnimationFrame(animate);
 }
 function schedule(){if(!frame){last=performance.now();frame=requestAnimationFrame(animate);}}
 title.addEventListener('pointermove',event=>{if(reduced.matches||!fine.matches||event.pointerType==='touch')return;px=event.clientX;py=event.clientY;active=true;schedule();},{passive:true});
 title.addEventListener('pointerleave',()=>{active=false;schedule();});
 reduced.addEventListener('change',()=>{active=false;for(const letter of letters){letter.y=letter.ry=letter.rx=letter.lift=0;letter.el.style.transform='none';letter.el.style.setProperty('--letter-light','0');}if(frame)cancelAnimationFrame(frame);frame=0;});
 document.addEventListener('visibilitychange',()=>{if(document.hidden){active=false;if(frame)cancelAnimationFrame(frame);frame=0;for(const letter of letters){letter.y=letter.ry=letter.rx=letter.lift=0;letter.el.style.transform='none';letter.el.style.setProperty('--letter-light','0');}}});
})();

