
/* Round glyph dust stays attached to each letter's actual lifted 3D plane. */
(() => {
 const hero=document.getElementById('home'),title=hero.querySelector('h1.hero-title');
 const letters=[...title.querySelectorAll('.hero-letter')];if(!letters.length)return;
 const motion=matchMedia('(prefers-reduced-motion: reduce)'),fine=matchMedia('(hover:hover) and (pointer:fine)');
 const canvas=document.createElement('canvas');canvas.className='hero-text-particles';canvas.setAttribute('aria-hidden','true');hero.appendChild(canvas);
 const ctx=canvas.getContext('2d'),sample=document.createElement('canvas'),sc=sample.getContext('2d',{willReadFrequently:true});if(!ctx||!sc)return;
 const cache=new Map();let px=-1000,py=-1000,lastMove=-10000,last=0,frame=0,strength=0,active=false,visible=true,w=1,h=1;
 // A projected letter plane, with an inverse for placing the cursor mask exactly.
 function letterPlane(matrix,originX,originY,width,height,rect){
  function local(x,y){x-=originX;y-=originY;const k=matrix.m14*x+matrix.m24*y+matrix.m44;return {x:originX+(matrix.m11*x+matrix.m21*y+matrix.m41)/k,y:originY+(matrix.m12*x+matrix.m22*y+matrix.m42)/k};}
  const corners=[local(0,0),local(width,0),local(width,height),local(0,height)];
  const offsetX=rect.left-Math.min(...corners.map(p=>p.x)),offsetY=rect.top-Math.min(...corners.map(p=>p.y));
  return {
   project(x,y){const p=local(x,y);return {x:p.x+offsetX,y:p.y+offsetY};},
   unproject(x,y){
    const u=x-offsetX-originX,v=y-offsetY-originY;
    const a=matrix.m11-u*matrix.m14,b=matrix.m21-u*matrix.m24,c=u*matrix.m44-matrix.m41;
    const d=matrix.m12-v*matrix.m14,e=matrix.m22-v*matrix.m24,f=v*matrix.m44-matrix.m42,det=a*e-b*d;
    return Math.abs(det)<1e-8?{x:-1000,y:-1000}:{x:(c*e-b*f)/det+originX,y:(a*f-c*d)/det+originY};
   }
  };
 }
 function rebuild(){
  const hr=hero.getBoundingClientRect(),dpr=Math.min(devicePixelRatio||1,1.5);w=hr.width;h=hr.height;canvas.width=Math.ceil(w*dpr);canvas.height=Math.ceil(h*dpr);ctx.setTransform(dpr,0,0,dpr,0,0);
  for(const el of letters){
   const cs=getComputedStyle(el),width=Math.max(1,el.offsetWidth),height=Math.max(1,el.offsetHeight);
   sample.width=Math.ceil(width);sample.height=Math.ceil(height);sc.font=cs.fontWeight+' '+cs.fontSize+' '+cs.fontFamily;sc.fillStyle='#fff';
   const metrics=sc.measureText(el.textContent),size=parseFloat(cs.fontSize),ascent=metrics.fontBoundingBoxAscent||size*.85,descent=metrics.fontBoundingBoxDescent||size*.2;
   sc.fillText(el.textContent,parseFloat(cs.paddingLeft)||0,(height-ascent-descent)/2+ascent);
   const pixels=sc.getImageData(0,0,sample.width,sample.height).data,points=[];
   for(let y=0;y<sample.height;y+=3)for(let x=0;x<sample.width;x+=3)if(pixels[(y*sample.width+x)*4+3]>110)points.push({x,y,energy:0,phase:Math.random()*Math.PI*2,size:.55+Math.random()*.8});
   cache.set(el,{points,width,height});
  }
 }
 function clear(){
  active=false;strength=0;if(frame)cancelAnimationFrame(frame);frame=0;
  letters.forEach(el=>el.style.setProperty('--particle-r','0px'));for(const info of cache.values())for(const p of info.points)p.energy=0;ctx.clearRect(0,0,w,h);
 }
 function animate(now){
  frame=0;if(!visible||document.hidden||motion.matches){clear();return;}
  const dt=Math.min((now-last)/1000||.016,.04);last=now;
  strength+=((active&&now-lastMove<450?1:0)-strength)*(1-Math.exp(-dt*13));const radius=54*strength,hr=hero.getBoundingClientRect();ctx.clearRect(0,0,w,h);let alive=false;
  for(const el of letters){
   const info=cache.get(el);if(!info)continue;
   const cs=getComputedStyle(el),rect=el.getBoundingClientRect(),origin=cs.transformOrigin.split(' ').map(parseFloat);
   const plane=letterPlane(new DOMMatrix(cs.transform==='none'?undefined:cs.transform),origin[0],origin[1],info.width,info.height,rect),cursor=plane.unproject(px,py);
   el.style.setProperty('--particle-x',cursor.x.toFixed(2)+'px');el.style.setProperty('--particle-y',cursor.y.toFixed(2)+'px');el.style.setProperty('--particle-r',radius.toFixed(2)+'px');
   for(const p of info.points){
    const distance=Math.hypot(p.x-cursor.x,p.y-cursor.y),target=radius>1?Math.max(0,1-distance/radius)*strength:0;
    p.energy+=(target-p.energy)*(1-Math.exp(-dt*16));if(p.energy<.006)continue;alive=true;
    const theta=Math.atan2(p.y-cursor.y,p.x-cursor.x),spread=9*p.energy;
    // Reproject from glyph coordinates every frame: motes rise and rotate with the letter.
    const point=plane.project(p.x+Math.cos(theta)*spread+Math.sin(p.phase+now*.003)*2*p.energy,p.y+Math.sin(theta)*spread+Math.cos(p.phase+now*.002)*2*p.energy);
    ctx.globalAlpha=Math.min(.95,.4+p.energy*.65)*Math.min(1,p.energy*8);ctx.fillStyle='#fff';
    ctx.beginPath();ctx.arc(point.x-hr.left,point.y-hr.top,p.size*(.8+p.energy*.5),0,Math.PI*2);ctx.fill();
   }
  }
  ctx.globalAlpha=1;
  if(strength>.004||alive)frame=requestAnimationFrame(animate);else clear();
 }
 title.addEventListener('pointermove',event=>{
  if(motion.matches||!fine.matches||event.pointerType==='touch')return;
  px=event.clientX;py=event.clientY;lastMove=performance.now();active=true;if(!frame){last=lastMove;frame=requestAnimationFrame(animate);}
 },{passive:true});
 title.addEventListener('pointerleave',()=>{active=false;});
 window.addEventListener('resize',()=>requestAnimationFrame(rebuild),{passive:true});
 if(document.fonts&&document.fonts.ready)document.fonts.ready.then(rebuild);
 motion.addEventListener('change',clear);document.addEventListener('visibilitychange',()=>{if(document.hidden)clear();});
 window.addEventListener('portfolio-mode-change',()=>{
  clear();letters.splice(0,letters.length,...title.querySelectorAll('.hero-letter'));cache.clear();requestAnimationFrame(rebuild);
 });
 if(typeof IntersectionObserver!=='undefined')new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;if(!visible)clear();}).observe(hero);
 rebuild();
})();

