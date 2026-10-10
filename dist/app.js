import {stages,planets,lightTargets} from './data.js';

const $=id=>document.getElementById(id);
const pad=n=>String(n).padStart(2,'0');
const reducedMotion=window.matchMedia('(prefers-reduced-motion: reduce)');
let stageIndex=0,planetIndex=2,paused=reducedMotion.matches,autoTimer=null,frameId=0,lastFrame=0,time=0;
let heroVisible=true,sceneVisible=false;
const starCanvas=$('starfield'),sceneCanvas=$('scene');
const starCtx=starCanvas.getContext('2d'),ctx=sceneCanvas.getContext('2d');
const earthImage=new Image();earthImage.src='assets/earth.webp';earthImage.addEventListener('load',()=>drawScene(time));
function rng(seed){return()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};}
const random=rng(8403);
const stars=Array.from({length:145},()=>({x:random(),y:random(),r:random()*1.1+.2,a:random()*.6+.2,p:random()*6.28}));
const spiralPoints=Array.from({length:1900},()=>({r:Math.pow(random(),.72),arm:Math.floor(random()*4),jitter:(random()-.5),z:(random()-.5),brightness:random()}));
const universePoints=Array.from({length:660},()=>{const theta=random()*Math.PI*2;const rad=Math.sqrt(random());return{x:Math.cos(theta)*rad,y:Math.sin(theta)*rad,s:random(),p:random()*6.28};});
const cloudPoints=Array.from({length:1100},()=>({u:random(),v:random(),w:random(),p:random()*6.28}));

function makeButton(label,cls,onClick){const b=document.createElement('button');b.type='button';b.className=cls;b.addEventListener('click',onClick);b.setAttribute('aria-label',label);return b;}
stages.forEach((s,i)=>{const b=makeButton(`第 ${i+1} 站：${s.name}`,'stage-tab',()=>{stopTour();setStage(i,true);});b.innerHTML=`<span>${pad(i+1)}</span><strong>${s.name}</strong>`;b.setAttribute('aria-pressed','false');$('stage-nav').append(b);});
planets.forEach((p,i)=>{const b=makeButton(p.name,'planet-button',()=>setPlanet(i));b.innerHTML=`<span class="planet-visual" aria-hidden="true"><span class="planet-orb ${p.en.toLowerCase()}" style="--diameter:${p.visual}px"></span></span><span class="planet-label">${p.name}</span><span class="planet-en">${p.en}</span>`;b.setAttribute('aria-pressed','false');$('planet-nav').append(b);});

function setStage(i,keepInView=false){
 stageIndex=Math.max(0,Math.min(stages.length-1,Number(i)));const s=stages[stageIndex];
 for(const [id,value] of Object.entries({'stage-en':s.en,'stage-title':s.name==='拉尼亚凯亚'?'拉尼亚凯亚超星系团':s.name,'stage-size':s.size,'stage-unit':s.unit,'stage-size-label':s.label,'stage-description':s.description,'stage-note':s.note,'scene-index':`${pad(stageIndex+1)} / 07`,'scene-scale':s.scale,'scene-marker':s.marker,'journey-location':`当前位置：${s.name}`}))$(id).textContent=value;
 $('stage-source').href=s.source;sceneCanvas.setAttribute('aria-label',`${s.name}结构示意，${s.label} ${s.size} ${s.unit}，图中大小与间距未按比例`);
 [...$('stage-nav').children].forEach((b,j)=>b.setAttribute('aria-pressed',String(j===stageIndex)));
 $('scale-range').value=stageIndex;$('scale-range').style.setProperty('--range-progress',`${stageIndex/6*100}%`);$('scale-range').setAttribute('aria-valuetext',`${s.name}，第 ${stageIndex+1} 站，共七站`);
 $('prev-stage').disabled=stageIndex===0;$('next-stage').disabled=stageIndex===6;
 if(keepInView){const nav=$('stage-nav'),b=nav.children[stageIndex];nav.scrollTo({left:Math.max(0,b.offsetLeft-nav.offsetLeft-(nav.clientWidth-b.offsetWidth)/2),behavior:paused?'instant':'smooth'});}
 drawScene(time);
}
function setPlanet(i){
 planetIndex=i;const p=planets[i];$('planet-order').textContent=pad(i+1);$('planet-en').textContent=p.en.toUpperCase();$('planet-name').textContent=p.name;$('planet-type').textContent=p.type;$('planet-description').textContent=p.description;$('planet-source').href=p.source;
 $('planet-diameter').innerHTML=`${p.diameter.toLocaleString('en-US')} <small>km</small>`;$('planet-distance').innerHTML=`${p.au} <small>AU</small>`;$('planet-period').innerHTML=`${p.period} <small>${p.periodUnit}</small>`;
 [...$('planet-nav').children].forEach((b,j)=>b.setAttribute('aria-pressed',String(j===i)));
}
function bindArrowKeys(element,getValue,max,update){element.addEventListener('keydown',e=>{if(!['ArrowLeft','ArrowRight','Home','End'].includes(e.key))return;e.preventDefault();stopTour();const i=e.key==='Home'?0:e.key==='End'?max:Math.max(0,Math.min(max,getValue()+(e.key==='ArrowRight'?1:-1)));update(i);element.children[i].focus();});}
bindArrowKeys($('stage-nav'),()=>stageIndex,6,i=>setStage(i,true));bindArrowKeys($('planet-nav'),()=>planetIndex,7,setPlanet);
$('prev-stage').addEventListener('click',()=>{stopTour();setStage(stageIndex-1,true);});$('next-stage').addEventListener('click',()=>{stopTour();setStage(stageIndex+1,true);});$('scale-range').addEventListener('input',e=>{stopTour();setStage(e.target.value,true);});
function stopTour(){clearInterval(autoTimer);autoTimer=null;$('autoplay').setAttribute('aria-pressed','false');$('autoplay').innerHTML='<span aria-hidden="true">▷</span> 自动漫游';}
$('autoplay').addEventListener('click',()=>{if(autoTimer){stopTour();return;}if(stageIndex===6)setStage(0,true);$('autoplay').setAttribute('aria-pressed','true');$('autoplay').innerHTML='<span aria-hidden="true">Ⅱ</span> 暂停漫游';autoTimer=setInterval(()=>{if(document.hidden)return;setStage(stageIndex+1,true);if(stageIndex===6)stopTour();},7500);});
$('return-journey').addEventListener('click',()=>{stopTour();setStage(6,true);});
$('light-target').addEventListener('change',e=>{const l=lightTargets[e.target.value];$('light-time').innerHTML=l.display;$('light-note').textContent=l.note;});

function syncMotion(){document.documentElement.classList.toggle('motion-paused',paused);$('motion-toggle').setAttribute('aria-pressed',String(paused));$('motion-toggle').title=paused?'开启背景动效':'暂停背景动效';$('motion-toggle').setAttribute('aria-label',$('motion-toggle').title);$('motion-toggle').querySelector('.motion-label').textContent=paused?'开启动效':'暂停动效';$('motion-toggle').querySelector('.motion-icon').textContent=paused?'▷':'Ⅱ';cancelAnimationFrame(frameId);drawStars(time);drawScene(time);if(!paused&&!document.hidden)frameId=requestAnimationFrame(animate);}
$('motion-toggle').addEventListener('click',()=>{paused=!paused;if(paused)stopTour();syncMotion();});reducedMotion.addEventListener('change',e=>{paused=e.matches;syncMotion();});
document.addEventListener('visibilitychange',()=>{cancelAnimationFrame(frameId);if(!paused&&!document.hidden){lastFrame=0;frameId=requestAnimationFrame(animate);}});

function sizeCanvas(canvas){const box=canvas.getBoundingClientRect(),dpr=Math.min(window.devicePixelRatio||1,2);canvas.width=Math.round(box.width*dpr);canvas.height=Math.round(box.height*dpr);canvas.getContext('2d').setTransform(dpr,0,0,dpr,0,0);return{w:box.width,h:box.height};}
let starSize={w:0,h:0},sceneSize={w:0,h:0};
function resize(){starSize=sizeCanvas(starCanvas);sceneSize=sizeCanvas(sceneCanvas);drawStars(time);drawScene(time);}
new ResizeObserver(resize).observe(document.body);
const observer=new IntersectionObserver(entries=>{for(const entry of entries){if(entry.target===sceneCanvas)sceneVisible=entry.isIntersecting;else heroVisible=entry.isIntersecting;}},{threshold:0});observer.observe(sceneCanvas);observer.observe(starCanvas);
function dot(context,x,y,r,color){context.beginPath();context.arc(x,y,Math.max(.1,r),0,Math.PI*2);context.fillStyle=color;context.fill();}
function glow(context,x,y,r,inner,outer='rgba(10,17,32,0)'){const gradient=context.createRadialGradient(x,y,0,x,y,r);gradient.addColorStop(0,inner);gradient.addColorStop(1,outer);context.fillStyle=gradient;context.fillRect(x-r,y-r,r*2,r*2);}
function ellipse(context,x,y,rx,ry,color,rotation=0){context.beginPath();context.ellipse(x,y,rx,ry,rotation,0,Math.PI*2);context.strokeStyle=color;context.lineWidth=.7;context.stroke();}
function drawStars(t){if(!starCtx)return;const{w,h}=starSize;starCtx.clearRect(0,0,w,h);for(const s of stars){const a=s.a*(.7+.3*Math.sin(t*.35+s.p));dot(starCtx,s.x*w,s.y*h,s.r,`rgba(199,213,242,${a})`);}}
function textLabel(text,x,y,color='#8f9cb6',size=9,align='center'){ctx.fillStyle=color;ctx.font=`${size}px -apple-system,BlinkMacSystemFont,"PingFang SC",sans-serif`;ctx.textAlign=align;ctx.fillText(text,x,y);}
function background(){const{w,h}=sceneSize;ctx.clearRect(0,0,w,h);for(const s of stars.slice(0,80))dot(ctx,s.x*w,s.y*h,s.r*.6,`rgba(167,192,231,${s.a*.3})`);}
function galaxy(x,y,r,t=0,tilt=.6,angle=-.4,quantity=1900){
 ctx.save();ctx.translate(x,y);ctx.rotate(angle);ctx.scale(1,tilt);glow(ctx,0,0,r*.95,'rgba(65,85,152,.13)');
 for(let i=0;i<quantity;i++){const p=spiralPoints[i],rad=p.r*r,theta=p.arm*Math.PI/2+p.r*7+t*.014+p.jitter*(.25+.75*p.r);const px=Math.cos(theta)*rad,py=Math.sin(theta)*rad+p.z*r*.065;const core=p.r<.2;const alpha=(.13+p.brightness*.65)*(1-p.r*.5);dot(ctx,px,py,.4+p.brightness*.7,core?`rgba(255,219,164,${alpha})`:`rgba(${p.brightness>.8?'234,199,167':'133,159,218'},${alpha})`);}
 glow(ctx,0,0,r*.24,'rgba(239,198,145,.64)');glow(ctx,0,0,r*.075,'rgba(255,237,198,.91)');ctx.restore();
}
function drawUniverse(t){const{w,h}=sceneSize,cx=w*.5,cy=h*.47,r=Math.min(w*.39,h*.37);glow(ctx,cx,cy,r*1.3,'rgba(50,58,111,.24)');ellipse(ctx,cx,cy,r,r,'rgba(124,149,196,.2)');ellipse(ctx,cx,cy,r*.84,r*.84,'rgba(124,149,196,.07)');
 for(const p of universePoints){const angle=t*.006;const x=(p.x*Math.cos(angle)-p.y*Math.sin(angle))*r,y=(p.y*Math.cos(angle)+p.x*Math.sin(angle))*r;if(p.s>.96)glow(ctx,cx+x,cy+y,6,'rgba(225,179,133,.2)');ctx.save();ctx.translate(cx+x,cy+y);ctx.rotate(p.p);ctx.scale(1,.43+p.s*.4);dot(ctx,0,0,p.s*1.6+.25,`rgba(${p.s>.72?'224,193,147':'137,156,196'},${.2+p.s*.7})`);ctx.restore();}
 textLabel('可 观 测 视 界',cx,cy-r-12,'#7c8ba4',8);dot(ctx,cx,cy,2,'#ecd5b0');ellipse(ctx,cx,cy,7,7,'#d7bb8b66');
}
function drawWeb(t){const{w,h}=sceneSize,cx=w*.48,cy=h*.47,r=Math.min(w*.42,h*.38);glow(ctx,cx,cy,r*1.3,'rgba(93,65,57,.19)');
 for(let i=0;i<7;i++){ctx.beginPath();for(let j=0;j<=60;j++){const u=j/60;const a=i*Math.PI*2/7+u*1.5;const x=cx+Math.cos(a)*r*u,y=cy+Math.sin(a)*r*u*.86; j?ctx.lineTo(x,y):ctx.moveTo(x,y);}ctx.lineWidth=.7;ctx.strokeStyle='rgba(215,184,134,.15)';ctx.stroke();}
 for(const p of cloudPoints){const arm=Math.floor(p.w*7),u=p.u,a=arm*Math.PI*2/7+u*1.5+(p.v-.5)*.55;const x=cx+Math.cos(a)*r*u+(p.v-.5)*r*.15,y=cy+Math.sin(a)*r*u*.86+Math.sin(p.p+u*6)*r*.07;const alpha=(.2+.5*p.w)*(.8+Math.sin(t*.12+p.p)*.2);dot(ctx,x,y,.35+p.v,`rgba(${p.v>.7?'211,187,150':'148,165,192'},${alpha})`);}
 const px=cx+r*.55,py=cy+r*.4;dot(ctx,px,py,2.5,'#d7bb8b');ellipse(ctx,px,py,9,9,'#d7bb8b77');textLabel('本星系群',px+15,py+3,'#dac6a8',9,'left');
}
function drawGroup(t){const{w,h}=sceneSize,r=Math.min(w*.19,h*.19);galaxy(w*.38,h*.52,r,t,.55,-.4,950);galaxy(w*.69,h*.32,r*1.15,t,.4,-.7,1100);galaxy(w*.73,h*.66,r*.4,t,.7,.4,500);textLabel('银河系',w*.3,h*.7,'#d8c7aa');textLabel('仙女座星系 M31',w*.7,h*.2);textLabel('三角座星系 M33',w*.76,h*.77);for(const p of universePoints.slice(0,35))dot(ctx,w*.5+p.x*w*.4,h*.46+p.y*h*.33,p.s+1,`rgba(140,158,201,${p.s*.4+.2})`);}
function drawMilkyWay(t){const{w,h}=sceneSize,r=Math.min(w*.39,h*.43);galaxy(w*.5,h*.45,r,t,.68,-.42);const angle=2.9+t*.014,rad=r*.57;const xx=Math.cos(angle)*rad,yy=Math.sin(angle)*rad*.68;const x=w*.5+xx*Math.cos(-.42)-yy*Math.sin(-.42),y=h*.45+xx*Math.sin(-.42)+yy*Math.cos(-.42);ellipse(ctx,x,y,9,9,'#e3c49088');dot(ctx,x,y,2.1,'#e5c898');textLabel('太阳系 · 示意位置',x-13,y+27,'#dcc9aa',9);}
function drawSolar(t){const{w,h}=sceneSize,cx=w*.5,cy=h*.47,maxR=Math.min(w*.42,h*.38);const colors=['#afa79e','#cead7a','#74a3bf','#c48668','#cabaa1','#c9b88b','#9eced3','#6d97c8'];glow(ctx,cx,cy,30,'rgba(224,156,68,.37)');dot(ctx,cx,cy,8,'#f4cd8c');for(let i=0;i<8;i++){const r=maxR*(.18+i*.117),a=.8+i*2.34+t*(.16/(i+1));ellipse(ctx,cx,cy,r,r*.7,'rgba(140,158,194,.2)',-.3);const xx=Math.cos(a)*r,yy=Math.sin(a)*r*.7;const x=cx+xx*Math.cos(-.3)-yy*Math.sin(-.3),y=cy+xx*Math.sin(-.3)+yy*Math.cos(-.3);dot(ctx,x,y,i<4?2.1:4.1,colors[i]);if(i===5)ellipse(ctx,x,y,7,2.2,'#c9b88b99',-.45);if(i===2)textLabel('地球',x+8,y-9,'#b2c9e3',9,'left');}textLabel('太阳',cx,cy+24,'#dac29c',8);}
function drawEarthMoon(t){const{w,h}=sceneSize,cx=w*.34,cy=h*.47,er=Math.min(w*.095,34),mx=w*.78,my=h*.39;glow(ctx,cx,cy,er*1.4,'rgba(93,154,223,.19)');drawEarth(cx,cy,er);ctx.beginPath();ctx.moveTo(cx+er+12,cy);ctx.lineTo(mx-13,my);ctx.setLineDash([3,5]);ctx.strokeStyle='#9aaec13d';ctx.lineWidth=1;ctx.stroke();ctx.setLineDash([]);const pulse=(t*.18)%1;dot(ctx,cx+er+12+(mx-13-cx-er-12)*pulse,cy+(my-cy)*pulse,1.7,'#e4d2b0');const gr=ctx.createRadialGradient(mx-3,my-3,1,mx,my,10);gr.addColorStop(0,'#c7c4bb');gr.addColorStop(1,'#42444d');dot(ctx,mx,my,10,gr);textLabel('地球',cx,cy+er+21,'#b9cde3');textLabel('月球',mx,my+29);textLabel('平均距离 384,400 km',w*.57,h*.64,'#c7b595',10);}
function drawEarth(x,y,r){if(earthImage.complete&&earthImage.naturalWidth){ctx.save();ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.clip();ctx.drawImage(earthImage,x-r,y-r,r*2,r*2);ctx.restore();}else{const g=ctx.createRadialGradient(x-r*.35,y-r*.35,0,x,y,r);g.addColorStop(0,'#538bc0');g.addColorStop(.6,'#204a79');g.addColorStop(1,'#07101f');dot(ctx,x,y,r,g);}}
function drawHome(t){const{w,h}=sceneSize,cx=w*.5,cy=h*.45,r=Math.min(w*.26,h*.31);glow(ctx,cx,cy,r*1.3,'rgba(45,109,184,.19)');ellipse(ctx,cx,cy,r+14,r+14,'rgba(132,176,225,.19)');drawEarth(cx,cy,r);ellipse(ctx,cx,cy,r*1.32,r*.38,'rgba(152,179,211,.19)',-.6);textLabel('YOU ARE HERE',cx,cy+r+33,'#c6d5e7',9);}
const renderers=[drawUniverse,drawWeb,drawGroup,drawMilkyWay,drawSolar,drawEarthMoon,drawHome];
function drawScene(t){if(!ctx||!sceneSize.w)return;background();renderers[stageIndex](t);}
function animate(timestamp){if(paused||document.hidden)return;if(timestamp-lastFrame>=32){const delta=lastFrame?Math.min((timestamp-lastFrame)/1000,.1):.032;time+=delta;lastFrame=timestamp;if(heroVisible)drawStars(time);if(sceneVisible)drawScene(time);}frameId=requestAnimationFrame(animate);}
function updateProgress(){const total=document.documentElement.scrollHeight-innerHeight;$('reading-progress').style.width=`${total>0?scrollY/total*100:0}%`;}
window.addEventListener('scroll',updateProgress,{passive:true});
setStage(0);setPlanet(2);resize();syncMotion();updateProgress();
