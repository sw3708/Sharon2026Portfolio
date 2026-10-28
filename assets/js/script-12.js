
/* One outward wave distorts the current project media, then dissolves its center. */
(() => {
 const motion=matchMedia('(prefers-reduced-motion: reduce)');
 let active=false,stop=null;
 const vertex=`attribute vec2 position;varying vec2 uv;void main(){uv=position*.5+.5;gl_Position=vec4(position,0.,1.);}`;
 const fragment=`
 #ifdef GL_FRAGMENT_PRECISION_HIGH
 precision highp float;
 #else
 precision mediump float;
 #endif
 varying vec2 uv;uniform sampler2D media;uniform vec2 size;uniform vec4 startRect;uniform float aspect;uniform float progress;
 float ease(float x){return x*x*(3.-2.*x);}
 void main(){
  vec2 pixel=vec2(uv.x,1.-uv.y)*size;
  float zoom=1.-pow(1.-clamp(progress/.32,0.,1.),3.);
  vec4 bounds=mix(startRect,vec4(0.,0.,size),zoom);
  vec2 center=size*.5,delta=pixel-center;float dist=length(delta);
  float farthest=length(center),feather=max(45.,min(size.x,size.y)*.10);
  float reveal=ease(clamp((progress-.08)/.92,0.,1.));
  float front=mix(-feather,farthest+feather,reveal);
  float band=(dist-front)/max(28.,min(size.x,size.y)*.075);
  float wave=sin(band*3.14159265)*exp(-band*band)*17.*(1.-progress*.45);
  vec2 warped=pixel+(dist>.1?delta/dist:vec2(0.))*wave;
  vec2 sampleUV=(warped-bounds.xy)/bounds.zw;
  float rectAspect=bounds.z/bounds.w;
  if(aspect>rectAspect)sampleUV.x=(sampleUV.x-.5)*(rectAspect/aspect)+.5;
  else sampleUV.y=(sampleUV.y-.5)*(aspect/rectAspect)+.5;
  vec3 color=texture2D(media,clamp(sampleUV,vec2(0.),vec2(1.))).rgb;
  float inside=step(bounds.x,pixel.x)*step(pixel.x,bounds.x+bounds.z)*step(bounds.y,pixel.y)*step(pixel.y,bounds.y+bounds.w);
  color*=inside;
  float alpha=smoothstep(front-feather,front+feather,dist);
  gl_FragColor=vec4(color,alpha);
 }`;
 function shader(gl,type,code){
  const item=gl.createShader(type);gl.shaderSource(item,code);gl.compileShader(item);
  if(!gl.getShaderParameter(item,gl.COMPILE_STATUS)){gl.deleteShader(item);throw Error('Shader unavailable');}return item;
 }
 function sourceFor(tile){
  const video=[...tile.querySelectorAll('.bg video')].find(video=>video.readyState>=2);
  return video||tile.querySelector('.bg img')||tile.querySelector('img');
 }
 function captionFor(tile,layer){
  const original=tile.querySelector('.slide-content')||tile.querySelector('.grid-copy');if(!original)return null;
  const rect=original.getBoundingClientRect(),copy=original.cloneNode(true);
  function freeze(source,target){
   const style=getComputedStyle(source);
   for(const name of style)target.style.setProperty(name,style.getPropertyValue(name));
   target.removeAttribute('id');target.style.transition='none';target.style.animation='none';
   [...source.children].forEach((child,index)=>freeze(child,target.children[index]));
  }
  freeze(original,copy);copy.classList.add('case-ripple-caption');
  Object.assign(copy.style,{position:'fixed',left:rect.left+'px',top:rect.top+'px',right:'auto',bottom:'auto',width:rect.width+'px',height:rect.height+'px',margin:'0',transform:'none',pointerEvents:'none',opacity:'1'});
  layer.appendChild(copy);return copy;
 }
 function carryPlayback(source,liveTargets){
  if(!source.videoWidth)return;
  const candidates=[...document.querySelectorAll('#portfolioProject[open] video:not([hidden]),#caseView.open .image-layer video,#caseView.logo-case.open .la-overview video')];
  const target=candidates.find(video=>(video.currentSrc||video.src)===(source.currentSrc||source.src));if(!target)return;
  const wasPlaying=!source.paused&&!source.ended;
  if(wasPlaying){target.dataset.caseRippleLive='true';liveTargets.push(target);}
  const seek=()=>{
   target.playbackRate=source.playbackRate||1;
   try{target.currentTime=source.currentTime;}catch{}
   if(wasPlaying&&!source.ended){const play=target.play();if(play&&play.catch)play.catch(()=>{});}else target.pause();
  };
  seek();if(target.readyState<1)target.addEventListener('loadedmetadata',seek,{once:true});
 }
 function open(tile,showStudy){
  if(active)return;
  if(motion.matches){showStudy();return;}
  const source=tile&&sourceFor(tile);
  const sw=source&&(source.videoWidth||source.naturalWidth),sh=source&&(source.videoHeight||source.naturalHeight);
  if(!source||!sw||!sh){showStudy();return;}
  const rect=tile.getBoundingClientRect(),width=innerWidth,height=innerHeight,dpr=Math.min(devicePixelRatio||1,1.5);
  const layer=document.createElement('div');layer.className='case-ripple-transition';layer.setAttribute('aria-hidden','true');
  if(typeof layer.showPopover==='function')layer.setAttribute('popover','manual');
  const canvas=document.createElement('canvas');canvas.width=Math.round(width*dpr);canvas.height=Math.round(height*dpr);layer.appendChild(canvas);
  let gl=null,program=null,texture=null,buffer=null,vs=null,fs=null,draw=null,frame=0,watchdog=0,done=false;
  const liveTargets=[];let lastTextureTime=source.currentTime;
  const shade=document.createElement('div');shade.className='case-ripple-shade';
  const bg=tile.querySelector('.bg');let tint=bg?getComputedStyle(bg,'::after').backgroundImage:'none';
  if(!tint||tint==='none')tint=getComputedStyle(tile,'::before').backgroundImage;
  shade.style.backgroundImage=tint&&tint!=='none'?tint:'linear-gradient(#0003,#0003)';layer.appendChild(shade);
  const caption=captionFor(tile,layer);
  function updateCaption(value){
   const t=Math.max(0,Math.min(1,(value-.02)/.52)),ease=t*t*(3-2*t);
   if(caption)caption.style.opacity=(1-ease).toFixed(3);
   const t2=Math.max(0,Math.min(1,(value-.08)/.92)),e=t2*t2*(3-2*t2),f=Math.max(45,Math.min(width,height)*.1),r=-f+(Math.hypot(width/2,height/2)+2*f)*e;
   const mask=r<=-f?'none':'radial-gradient(circle at 50% 50%,transparent '+Math.max(0,r-f)+'px,#000 '+Math.max(.1,r+f)+'px)';
   shade.style.maskImage=mask;shade.style.webkitMaskImage=mask;
  }
  function finish(){
   if(done)return;done=true;active=false;stop=null;cancelAnimationFrame(frame);clearTimeout(watchdog);
   document.removeEventListener('keydown',key,true);window.removeEventListener('resize',finish);document.removeEventListener('visibilitychange',hidden);
   try{if(layer.matches(':popover-open'))layer.hidePopover();}catch{}
   layer.remove();
   for(const video of liveTargets)delete video.dataset.caseRippleLive;
   document.dispatchEvent(new Event('case-ripple-finished'));
   if(gl){if(texture)gl.deleteTexture(texture);if(buffer)gl.deleteBuffer(buffer);if(program)gl.deleteProgram(program);if(vs)gl.deleteShader(vs);if(fs)gl.deleteShader(fs);const lose=gl.getExtension('WEBGL_lose_context');if(lose)lose.loseContext();}
  }
  function key(event){if(event.key==='Escape')finish();}
  function hidden(){if(document.hidden)finish();}
  try{
   gl=canvas.getContext('webgl',{alpha:true,premultipliedAlpha:false,antialias:false,preserveDrawingBuffer:false});
   if(!gl)throw Error('WebGL unavailable');
   vs=shader(gl,gl.VERTEX_SHADER,vertex);fs=shader(gl,gl.FRAGMENT_SHADER,fragment);program=gl.createProgram();gl.attachShader(program,vs);gl.attachShader(program,fs);gl.linkProgram(program);
   if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw Error('Program unavailable');
   gl.useProgram(program);buffer=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,buffer);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,-1,1,1,-1,1,1]),gl.STATIC_DRAW);
   const position=gl.getAttribLocation(program,'position');gl.enableVertexAttribArray(position);gl.vertexAttribPointer(position,2,gl.FLOAT,false,0,0);
   texture=gl.createTexture();gl.activeTexture(gl.TEXTURE0);gl.bindTexture(gl.TEXTURE_2D,texture);gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL,false);
   gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);
   gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,source);
   if(gl.getError()!==gl.NO_ERROR)throw Error('Media texture unavailable');
   gl.uniform1i(gl.getUniformLocation(program,'media'),0);gl.uniform2f(gl.getUniformLocation(program,'size'),width,height);gl.uniform4f(gl.getUniformLocation(program,'startRect'),rect.left,rect.top,rect.width,rect.height);gl.uniform1f(gl.getUniformLocation(program,'aspect'),sw/sh);
   const progress=gl.getUniformLocation(program,'progress');gl.viewport(0,0,canvas.width,canvas.height);
   draw=value=>{
    if(source.videoWidth&&source.readyState>=2&&source.currentTime!==lastTextureTime){
     gl.bindTexture(gl.TEXTURE_2D,texture);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,source);lastTextureTime=source.currentTime;
    }
    gl.uniform1f(progress,value);gl.drawArrays(gl.TRIANGLES,0,6);updateCaption(value);
   };
  }catch{
   if(gl){const lose=gl.getExtension('WEBGL_lose_context');if(lose)lose.loseContext();gl=null;}
   // A canvas snapshot retains the same center-out reveal when WebGL is unavailable.
   const fallback=document.createElement('canvas');fallback.width=canvas.width;fallback.height=canvas.height;canvas.replaceWith(fallback);
   const ctx=fallback.getContext('2d');
   if(!ctx){showStudy();return;}
   ctx.scale(dpr,dpr);
   draw=value=>{
    updateCaption(value);
    const zoom=1-Math.pow(1-Math.min(value/.32,1),3),r={x:rect.left*(1-zoom),y:rect.top*(1-zoom),w:rect.width+(width-rect.width)*zoom,h:rect.height+(height-rect.height)*zoom};
    ctx.clearRect(0,0,width,height);ctx.fillStyle='#000';ctx.fillRect(0,0,width,height);
    const scale=Math.max(r.w/sw,r.h/sh);ctx.save();ctx.beginPath();ctx.rect(r.x,r.y,r.w,r.h);ctx.clip();ctx.drawImage(source,r.x+(r.w-sw*scale)/2,r.y+(r.h-sh*scale)/2,sw*scale,sh*scale);ctx.restore();
    const t=Math.max(0,Math.min(1,(value-.08)/.92)),e=t*t*(3-2*t),feather=Math.max(45,Math.min(width,height)*.1),radius=-feather+(Math.hypot(width/2,height/2)+2*feather)*e;
    if(radius>0){const mask=ctx.createRadialGradient(width/2,height/2,Math.max(0,radius-feather),width/2,height/2,radius+feather);mask.addColorStop(0,'#000');mask.addColorStop(1,'transparent');ctx.globalCompositeOperation='destination-out';ctx.fillStyle=mask;ctx.fillRect(0,0,width,height);ctx.globalCompositeOperation='source-over';}
   };
  }
  if(source.videoWidth&&!source.paused&&!source.ended){source.dataset.caseRippleLive='true';liveTargets.push(source);}
  active=true;stop=finish;
  try{draw(0);showStudy();carryPlayback(source,liveTargets);document.body.appendChild(layer);
   // A manual popover sits above native project dialogs without moving their focus.
   if(typeof layer.showPopover==='function')layer.showPopover();
   else{const dialog=document.querySelector('#portfolioProject[open]');if(dialog)dialog.appendChild(layer);}
  }catch(error){finish();throw error;}
  document.addEventListener('keydown',key,true);window.addEventListener('resize',finish);document.addEventListener('visibilitychange',hidden);
  layer.addEventListener('pointerdown',event=>{event.preventDefault();event.stopPropagation();});
  const start=performance.now(),duration=1650;
  function animate(now){if(done)return;const progress=Math.min(1,(now-start)/duration);try{draw(progress);}catch{finish();return;}if(progress<1)frame=requestAnimationFrame(animate);else finish();}
  frame=requestAnimationFrame(animate);watchdog=setTimeout(finish,duration+700);
 }
 motion.addEventListener('change',()=>{if(motion.matches&&stop)stop();});
 window.caseStudyRipple={open,get active(){return active;}};
})();

