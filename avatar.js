(()=>{
 const stage=document.getElementById('avatar-stage');if(!stage)return;
 const character=stage.querySelector('.avatar-character'),layers=[...stage.querySelectorAll('[data-gaze]')],button=document.getElementById('avatar-motion'),caption=document.getElementById('avatar-caption');
 const reduced=matchMedia('(prefers-reduced-motion: reduce)'),fine=matchMedia('(hover: hover) and (pointer: fine)');
 let ready=false,paused=false,visible=true,frame=0,blinkTimer=0,blinkEnd=0,blinking=false,gaze='center',candidate='center',candidateAt=0,lastTime=0;
 const target={x:0,y:0},current={x:0,y:0};let bounds=null;
 const active=()=>ready&&!paused&&!reduced.matches&&visible&&!document.hidden;
 function show(state){character.dataset.state=state;layers.forEach(layer=>layer.classList.toggle('is-active',layer.dataset.gaze===state));}
 function paint(){stage.style.setProperty('--character-x',(current.x*9).toFixed(3)+'px');stage.style.setProperty('--character-y',(current.y*5).toFixed(3)+'px');stage.style.setProperty('--character-rx',(-current.y*1.7).toFixed(3)+'deg');stage.style.setProperty('--character-ry',(current.x*2.3).toFixed(3)+'deg');stage.style.setProperty('--orbit-x',(-current.x*13).toFixed(3)+'px');stage.style.setProperty('--orbit-y',(-current.y*9).toFixed(3)+'px');}
 function tick(time){
  frame=0;if(!active())return;
  const dt=Math.min(50,lastTime?time-lastTime:16.67);lastTime=time;
  const amount=1-Math.exp(-dt/150);
  current.x+=(target.x-current.x)*amount;current.y+=(target.y-current.y)*amount;
  paint();
  // Continuous weights avoid jumping when the pointer crosses a direction threshold.
  const x=current.x*.72,y=current.y*.55;
  const weights={left:Math.max(0,-x),right:Math.max(0,x),up:Math.max(0,-y),down:Math.max(0,y)};
  const sum=Object.values(weights).reduce((a,b)=>a+b,0);
  weights.center=Math.max(0,1-sum);const total=Math.max(1,sum);
  layers.forEach(layer=>{const weight=(weights[layer.dataset.gaze]||0)/total;layer.style.opacity=weight.toFixed(4);});
  const moving=Math.abs(target.x-current.x)+Math.abs(target.y-current.y)>.0002;
  if(moving)frame=requestAnimationFrame(tick);else lastTime=0;
 }
 function animate(){if(active()&&!frame)frame=requestAnimationFrame(tick);}
 function blink(){}
 function refresh(){clearTimeout(blinkTimer);clearTimeout(blinkEnd);cancelAnimationFrame(frame);frame=0;lastTime=0;blinking=false;target.x=target.y=current.x=current.y=0;gaze=candidate='center';layers.forEach(layer=>layer.style.opacity=layer.dataset.gaze==='center'?'1':'0');show('center');paint();stage.classList.toggle('motion-paused',paused||reduced.matches);stage.classList.toggle('motion-offscreen',!visible||document.hidden);button.disabled=reduced.matches;button.setAttribute('aria-pressed',String(paused||reduced.matches));button.textContent=paused||reduced.matches?'▶':'Ⅱ';button.setAttribute('aria-label',paused?'Bật chuyển động nhân vật':'Tạm dừng chuyển động nhân vật');caption.textContent=reduced.matches?'Chuyển động đã giảm theo cài đặt thiết bị':paused?'Chuyển động đã tạm dừng':fine.matches?'Di chuyển chuột — Hùng sẽ nhìn theo bạn':'Xin chào, mình là Hùng 👋';blink();}
 function measure(){bounds=stage.getBoundingClientRect();}
 button.addEventListener('click',()=>{paused=!paused;refresh();});document.addEventListener('pointermove',event=>{if(event.pointerType==='touch'||!fine.matches||!active())return;if(!bounds)measure();target.x=Math.max(-1,Math.min(1,(event.clientX-(bounds.left+bounds.width*.5))/(bounds.width*.48)));target.y=Math.max(-1,Math.min(1,(event.clientY-(bounds.top+bounds.height*.32))/(bounds.height*.45)));animate();},{passive:true});document.documentElement.addEventListener('pointerleave',()=>{target.x=target.y=0;animate();});
 window.addEventListener('resize',measure,{passive:true});window.addEventListener('scroll',measure,{passive:true});document.addEventListener('visibilitychange',refresh);reduced.addEventListener('change',refresh);fine.addEventListener('change',refresh);if('ResizeObserver' in window)new ResizeObserver(measure).observe(stage);if('IntersectionObserver' in window)new IntersectionObserver(entries=>{const next=entries[0].isIntersecting;if(next!==visible){visible=next;refresh();}},{threshold:.1}).observe(stage);
 Promise.all(['assets/hung-states.webp','assets/hung-icons.webp'].map(src=>new Promise((resolve,reject)=>{const image=new Image();image.onload=resolve;image.onerror=reject;image.src=src;}))).then(()=>{ready=true;measure();stage.classList.add('avatar-ready');refresh();}).catch(()=>{caption.textContent='Nguyễn Nam Hùng · Fullstack Developer';});
})();
