/* Original procedural character: lit 3D surfaces rasterized into ASCII cells. */
(()=>{
const canvas=document.getElementById('ascii'),ctx=canvas.getContext('2d',{alpha:true});
const media=matchMedia('(prefers-reduced-motion: reduce)');let reduced=media.matches;
const groups={body:[],head:[],leftUpper:[],leftLower:[],rightUpper:[],rightLower:[],leftHand:[],rightHand:[],scene:[]};
let seed=321;const rand=()=>{seed=(seed*16807)%2147483647;return(seed-1)/2147483646};
function ell(g,c,r,tone=1,count=900,clip){for(let i=0;i<count;i++){let y=1-2*rand(),a=rand()*Math.PI*2,s=Math.sqrt(1-y*y),nx=s*Math.cos(a),nz=s*Math.sin(a);const p=[c[0]+nx*r[0],c[1]+y*r[1],c[2]+nz*r[2]];if(clip&&!clip(p))continue;groups[g].push([...p,nx/r[0],y/r[1],nz/r[2],tone]);}}
function box(g,c,s,tone=.8){for(let axis=0;axis<3;axis++)for(let sign of [-1,1]){const others=[0,1,2].filter(v=>v!==axis);let u=others[0],v=others[1],nu=Math.ceil(s[u]*65),nv=Math.ceil(s[v]*65);for(let i=0;i<=nu;i++)for(let j=0;j<=nv;j++){let p=[...c],n=[0,0,0];p[axis]+=s[axis]/2*sign;p[u]+=(i/nu-.5)*s[u];p[v]+=(j/nv-.5)*s[v];n[axis]=sign;groups[g].push([...p,...n,tone]);}}}
// Seated figure, oversized hoodie, trousers and sneakers.
ell('body',[0,.55,-.2],[.48,.65,.32],.62,3200);
ell('body',[0,1.07,-.21],[.38,.25,.31],.53,700);
ell('body',[0,1.18,-.12],[.13,.2,.14],1,350);
ell('body',[-.27,-.23,.08],[.24,.22,.51],.42,750);
ell('body',[.28,-.23,.08],[.24,.22,.51],.46,750);
ell('scene',[-.28,-.7,.4],[.16,.54,.16],.4,650);
ell('scene',[.29,-.7,.4],[.16,.54,.16],.43,650);
ell('scene',[-.28,-1.2,.55],[.2,.12,.34],.8,650);
ell('scene',[.29,-1.2,.55],[.2,.12,.34],.75,650);
// Head coordinates are local; facial features have their own surface depth.
ell('head',[0,0,0],[.255,.34,.235],.98,2600);
ell('head',[0,.19,-.035],[.272,.22,.251],.35,1450,p=>p[1]>.10||p[2]<-.08);
ell('head',[-.254,-.01,0],[.045,.095,.06],.82,200);
ell('head',[.254,-.01,0],[.045,.095,.06],.9,200);
ell('head',[0,-.035,.245],[.047,.08,.07],1.15,250);
for(let i=0;i<50;i++){const x=(i/49-.5)*.16;groups.head.push([x,-.148-3*x*x,.213,0,0,1,.28]);}
for(const x of [-.105,.105]){ell('head',[x,.045,.213],[.068,.038,.025],.3,180);ell('head',[x,.042,.238],[.022,.014,.013],1.2,90);for(let i=0;i<35;i++){const bx=x+(i/34-.5)*.12;groups.head.push([bx,.06+Math.abs(bx)*.38,.223,0,0,1,.27]);}}
// Fine hoodie seams and drawstrings.
for(let side of [-1,1]){for(let i=0;i<45;i++)groups.body.push([side*.09,.97-i*.007,.105,0,0,1,.95]);}
// Articulated arms: normalized limb meshes, transformed every frame.
for(const g of ['leftUpper','rightUpper'])ell(g,[0,.5,0],[.16,.54,.17],.64,650);
for(const g of ['leftLower','rightLower'])ell(g,[0,.5,0],[.13,.54,.13],.7,550);
for(const g of ['leftHand','rightHand']){ell(g,[0,0,0],[.11,.065,.14],1,320);for(let f=0;f<4;f++)ell(g,[(f-1.5)*.043,-.01,.15],[.023,.026,.09],1,75);}
// Chair, desk, laptop. No external image or model dependency.
box('scene',[0,-.04,-.55],[.8,.14,.68],.35);box('scene',[0,.5,-.58],[.75,.9,.1],.35);
box('scene',[0,-.72,-.45],[.07,1.35,.07],.6);box('scene',[0,-1.33,-.45],[1.1,.055,.08],.5);
box('scene',[0,.02,.96],[2.1,.08,1.1],.62);
for(let x of [-.9,.9])box('scene',[x,-.67,1.24],[.045,1.37,.045],.47);
box('scene',[.05,.095,.9],[.97,.035,.66],.95);
box('scene',[.05,.43,1.15],[.98,.65,.035],.8);
box('scene',[.05,.44,1.177],[.88,.55,.012],.25);
// A simple luminous mark on the laptop lid.
for(let i=0;i<25;i++){let y=(i/24-.5)*.11;groups.scene.push([.015+Math.abs(y)*.6,.43+y,1.19,0,0,1,1.25]);}
// Coffee cup to the right of the laptop.
ell('scene',[.78,.18,.7],[.085,.13,.085],.8,450);
for(const points of Object.values(groups))for(const p of points)p[7]=1/Math.hypot(p[3],p[4],p[5]);
const zeroOffset=[0,0,0],bodyPoint=new Float64Array(8),limbPoint=new Float64Array(8),mouthPoint=new Float64Array([0,0,0,0,0,1,0,1]);
const cameraCos=Math.cos(-.48),cameraSin=Math.sin(-.48);
let lastRx=NaN,lastRy=NaN,sinX=0,cosX=1,sinY=0,cosY=1,projectionScale=1,projectionCenterY=0;
let cols=144,rows=94,width=900,height=620,paused=reduced,visible=true,last=0,time=reduced?3.7:0;
const glyphs=' .,:;irsXA253hMHGS#9B&@',palette=['#6f725e','#8a8c70','#b0ab91','#ccc4a6','#ded4b7','#eee2c3'];let depth,values,sceneDepth,sceneValues;
// Shape each glyph once per resize, then copy its pixels during animation.
const glyphSheet=document.createElement('canvas'),glyphCtx=glyphSheet.getContext('2d');let glyphPitch=1,glyphPixels=1;
function cacheGlyphs(dpr){const fontSize=Math.ceil(height/rows*1.13);glyphPixels=Math.ceil((fontSize*1.8+4)*dpr);glyphPitch=glyphPixels/dpr;glyphSheet.width=glyphPixels*glyphs.length;glyphSheet.height=glyphPixels*palette.length;glyphCtx.setTransform(dpr,0,0,dpr,0,0);glyphCtx.font=`${fontSize}px "SFMono-Regular",Consolas,monospace`;glyphCtx.textAlign='center';glyphCtx.textBaseline='middle';for(let b=0;b<palette.length;b++){glyphCtx.fillStyle=palette[b];for(let g=1;g<glyphs.length;g++)glyphCtx.fillText(glyphs[g],(g+.5)*glyphPitch,(b+.5)*glyphPitch);}}

function resize(){const rect=canvas.getBoundingClientRect();width=Math.max(1,rect.width);height=Math.max(1,rect.height);cols=Math.max(100,Math.min(220,Math.round(width/3.2)));rows=Math.max(20,Math.round(cols*(height/width)*.6));projectionScale=Math.min(cols*.48,rows*.46/(1.16*.59));projectionCenterY=rows*.87;const dpr=Math.min(devicePixelRatio||1,2);canvas.width=Math.round(width*dpr);canvas.height=Math.round(height*dpr);ctx.setTransform(dpr,0,0,dpr,0,0);cacheGlyphs(dpr);depth=new Float32Array(cols*rows);values=new Float32Array(cols*rows);depth.fill(-999);for(const p of groups.scene)plot(p);sceneDepth=depth.slice();sceneValues=values.slice();draw();}
function rotate(x,y,z,rx,ry){let yy=y*Math.cos(rx)-z*Math.sin(rx),zz=y*Math.sin(rx)+z*Math.cos(rx);return[x*Math.cos(ry)+zz*Math.sin(ry),yy,-x*Math.sin(ry)+zz*Math.cos(ry)];}
function plot(p,offset=zeroOffset,rx=0,ry=0){
if(rx!==lastRx||ry!==lastRy){lastRx=rx;lastRy=ry;sinX=Math.sin(rx);cosX=Math.cos(rx);sinY=Math.sin(ry);cosY=Math.cos(ry);}
const py=p[1]*cosX-p[2]*sinX,pz=p[1]*sinX+p[2]*cosX;
const x=p[0]*cosY+pz*sinY+offset[0],y=py+offset[1],z=-p[0]*sinY+pz*cosY+offset[2];
const xx=x*cameraCos+z*cameraSin,viewZ=-x*cameraSin+z*cameraCos;
const yy=y*.965-viewZ*.26,zz=y*.26+viewZ*.965;
const sx=Math.round(cols*.5+xx*projectionScale),sy=Math.round(projectionCenterY-yy*projectionScale*.59);
if(sx<0||sx>=cols||sy<0||sy>=rows)return;
const idx=sy*cols+sx;if(zz<depth[idx])return;depth[idx]=zz;
if(p[6]<0){values[idx]=0;return;}
const ny=p[4]*cosX-p[5]*sinX,nz=p[4]*sinX+p[5]*cosX;
const nx=p[3]*cosY+nz*sinY,nzz=-p[3]*sinY+nz*cosY;
const inverseLength=p[7]||1/Math.hypot(p[3],p[4],p[5]);
const light=Math.max(0,(-nx*.55+ny*.7+nzz*.65)*inverseLength);
values[idx]=Math.min(1,(.42+light*.58)*p[6]);
}
function limb(g,a,b){const dx=b[0]-a[0],dy=b[1]-a[1],dz=b[2]-a[2],len=Math.hypot(dx,dy,dz);let u=[dy,-dx,0],ul=Math.hypot(...u);if(ul<.001){u=[1,0,0];ul=1;}u=u.map(v=>v/ul);let v=[dx/len,dy/len,dz/len],w=[u[1]*v[2]-u[2]*v[1],u[2]*v[0]-u[0]*v[2],u[0]*v[1]-u[1]*v[0]];for(const p of groups[g]){const q=limbPoint;q[6]=p[6];q[7]=p[7];for(let k=0;k<3;k++){q[k]=a[k]+u[k]*p[0]+v[k]*p[1]*len+w[k]*p[2];q[k+3]=u[k]*p[3]+v[k]*p[4]+w[k]*p[5];}plot(q);}}
function smooth(a,b,x){const v=Math.max(0,Math.min(1,(x-a)/(b-a)));return v*v*(3-2*v);}
function posture(point,lean){const p=rotate(point[0],point[1]+.15,point[2]+.2,lean,0);return[p[0],p[1]-.15,p[2]-.2];}
function blend(a,b,p){return a.map((value,index)=>value+(b[index]-value)*p);}
function draw(){if(!depth)return;depth.set(sceneDepth);values.set(sceneValues);
const t=time,cycle=t%6.2;
const bangWindow=smooth(.9,1.04,cycle)*(1-smooth(2.55,2.75,cycle));
const bang=Math.pow(Math.max(0,Math.sin((cycle-1.0)*Math.PI*2/.39)),1.15)*bangWindow;
const scream=smooth(2.9,3.15,cycle)*(1-smooth(4.45,4.75,cycle));
const lean=bang*.9-scream*.045;
const breath=Math.sin(t*5)*.01;
const bodyOffset=[0,-.15+breath,-.2];
for(const p of groups.body){for(let k=0;k<8;k++)bodyPoint[k]=p[k];bodyPoint[1]+=.15;bodyPoint[2]+=.2;plot(bodyPoint,bodyOffset,lean,0);}
const neck=posture([0,1.18,-.12],lean);
const headPitch=.16+bang*.91-scream*.42;
const headYaw=.12+Math.sin(t*3)*.035+scream*(.36+Math.sin(t*27)*.07);
const headVector=rotate(0,.31,.13,headPitch,0);
const headOffset=[neck[0]+bang*Math.sin(t*70)*.012,neck[1]+headVector[1]+breath,neck[2]+headVector[2]];
for(const p of groups.head)plot(p,headOffset,headPitch,headYaw);
if(scream>.06){
  for(let ring=0;ring<=12;ring++)for(let i=0;i<42;i++){
    const angle=i/42*Math.PI*2,r=ring/12;
    mouthPoint[0]=Math.cos(angle)*.088*r;mouthPoint[1]=-.155+Math.sin(angle)*.115*scream*r;mouthPoint[2]=.255;mouthPoint[6]=-1;plot(mouthPoint,headOffset,headPitch,headYaw);
  }
  for(let i=0;i<100;i++){
    const angle=i/100*Math.PI*2;
    mouthPoint[0]=Math.cos(angle)*.095;mouthPoint[1]=-.155+Math.sin(angle)*.122*scream;mouthPoint[2]=.263;mouthPoint[6]=.66;plot(mouthPoint,headOffset,headPitch,headYaw);
  }
}
const lShoulder=posture([-.39,.89,-.15],lean),rShoulder=posture([.39,.89,-.15],lean);
const lElbow=blend([-.58,.35+bang*.04,.2+bang*.35],[-.72,.91,.02],scream);
const rElbow=blend([.58,.35+bang*.04,.2+bang*.35],[.72,.91,.02],scream);
const typing=(1-bang)*(1-scream);
const lWrist=blend([-.23,.19+typing*Math.sin(t*38)*.035,.8],[-.67,1.53+Math.sin(t*30)*.025,.12],scream);
const rWrist=blend([.25,.19+typing*Math.sin(t*43)*.035,.8],[.67,1.53+Math.sin(t*31)*.025,.12],scream);
limb('leftUpper',lShoulder,lElbow);limb('leftLower',lElbow,lWrist);limb('rightUpper',rShoulder,rElbow);limb('rightLower',rElbow,rWrist);
for(const p of groups.leftHand)plot(p,lWrist,-scream*1.4);for(const p of groups.rightHand)plot(p,rWrist,-scream*1.4);
ctx.clearRect(0,0,width,height);const cw=width/cols,ch=height/rows;
for(let i=0;i<values.length;i++){const val=values[i];if(!val)continue;const bucket=Math.min(5,Math.floor(val*6)),glyph=Math.max(1,Math.floor(val*(glyphs.length-1)));ctx.drawImage(glyphSheet,glyph*glyphPixels,bucket*glyphPixels,glyphPixels,glyphPixels,(i%cols+.5)*cw-glyphPitch/2,(Math.floor(i/cols)+.5)*ch-glyphPitch/2,glyphPitch,glyphPitch);}
if(scream>.1){ctx.font=`${Math.max(9,Math.min(13,width*.025))}px "SFMono-Regular",Consolas,monospace`;ctx.fillStyle=`rgba(205,119,77,${scream*.9})`;ctx.textAlign='left';ctx.fillText('AAARGH!',width*.69,height*.2);}
}
let frame=0;
function run(){if(!frame&&!paused&&visible&&!document.hidden){last=0;frame=requestAnimationFrame(tick);}}
function stop(){cancelAnimationFrame(frame);frame=0;last=0;}
function tick(now){frame=0;if(paused||!visible||document.hidden)return;const dt=last?Math.min((now-last)/1000,.05):0;last=now;time+=dt;draw();frame=requestAnimationFrame(tick);}
const toggle=canvas;function sync(){toggle.setAttribute('aria-label',`${paused?'Play':'Pause'} the animated ASCII office worker`);toggle.setAttribute('aria-pressed',String(paused));}sync();function toggleMotion(){paused=!paused;sync();if(paused)stop();else{draw();run();}}toggle.onclick=toggleMotion;toggle.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();toggleMotion();}});
new IntersectionObserver(([e])=>{visible=e.isIntersecting;if(visible)run();else stop();},{rootMargin:'100px'}).observe(canvas);
new ResizeObserver(resize).observe(canvas);
document.addEventListener('visibilitychange',()=>{if(document.hidden)stop();else run();});
addEventListener('pagehide',stop);addEventListener('pageshow',run);
media.addEventListener('change',event=>{reduced=event.matches;if(reduced){paused=true;stop();time=3.7;draw();}sync();});
run();
})();
