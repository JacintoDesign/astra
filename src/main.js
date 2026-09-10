import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import './style.css';
import { batchMeshes } from './geometry.js';

const $ = (s) => document.querySelector(s);
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
const mobile = () => innerWidth < 600;
let renderer;
try { renderer = new THREE.WebGLRenderer({ canvas: $('#scene'), antialias: true, powerPreference: 'high-performance' }); } catch (error) { $('#loading').innerHTML='<p>WEBGL2 IS UNAVAILABLE</p><p>Please open ASTRA in a browser with hardware acceleration enabled.</p>'; throw error; }
renderer.setPixelRatio(Math.min(devicePixelRatio, 1.75));
renderer.setSize(innerWidth, innerHeight);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.15;
const scene = new THREE.Scene();
scene.background = new THREE.Color('#070c13');
const camera = new THREE.PerspectiveCamera(42, innerWidth / innerHeight, .1, 1600);
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = .045;
controls.enablePan = false;
controls.minDistance = 7;
controls.maxDistance = 42;
controls.autoRotate = !reducedMotion;
controls.autoRotateSpeed = .16;
const composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, camera));
const bloom = new UnrealBloomPass(new THREE.Vector2(innerWidth, innerHeight), .45, .65, 1.05);
composer.addPass(bloom);
composer.addPass(new OutputPass());

const sun = new THREE.DirectionalLight('#ffdfb5', 4.2);
sun.position.set(-16, 20, 13);
scene.add(sun);
const fill = new THREE.DirectionalLight('#8cc4ff', 2.0);
fill.position.set(10, -3, -12);
scene.add(fill);
scene.add(new THREE.AmbientLight('#92b8dc', .48));
const station = new THREE.Group();
station.rotation.set(.25, -.25, -.32);
scene.add(station);
const materials = {
  hull: new THREE.MeshStandardMaterial({ color:'#c5c6be', metalness:.68, roughness:.37 }),
  white: new THREE.MeshStandardMaterial({ color:'#e2dfcc', metalness:.42, roughness:.42 }),
  dark: new THREE.MeshStandardMaterial({ color:'#28363e', metalness:.8, roughness:.35 }),
  black: new THREE.MeshStandardMaterial({ color:'#0d1922', metalness:.7, roughness:.4 }),
  gold: new THREE.MeshStandardMaterial({ color:'#ad8150', metalness:.8, roughness:.3 }),
  window: new THREE.MeshStandardMaterial({ color:'#a6d8de', emissive:'#a6e0ed', emissiveIntensity:2.0, metalness:.5, roughness:.18 }),
  amber: new THREE.MeshStandardMaterial({ color:'#f1b76f', emissive:'#ffc277', emissiveIntensity:2.2 }),
  cyan: new THREE.MeshStandardMaterial({ color:'#89f0e1', emissive:'#68f7df', emissiveIntensity:3.5 }),
};
function mesh(geometry, material, parent=station, position=[0,0,0], rotation=[0,0,0]) {
  const m = new THREE.Mesh(geometry, material);
  m.position.set(...position); m.rotation.set(...rotation); parent.add(m); return m;
}
const box = (w,h,d,mat,p,pos,rot) => mesh(new THREE.BoxGeometry(w,h,d),mat,p,pos,rot);
const cylinder = (r1,r2,h,mat,p,pos,rot,segments=32) => mesh(new THREE.CylinderGeometry(r1,r2,h,segments),mat,p,pos,rot);
const torus = (r,t,mat,p,pos,rot,segments=128) => mesh(new THREE.TorusGeometry(r,t,8,segments),mat,p,pos,rot);
function beam(a,b,width,mat,parent=station) {
  const av=new THREE.Vector3(...a), bv=new THREE.Vector3(...b);
  const m=cylinder(width,width,av.distanceTo(bv),mat,parent,av.clone().add(bv).multiplyScalar(.5).toArray(),[0,0,0],6);
  m.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),bv.sub(av).normalize());return m;
}
// An axial command and engineering spine; the long axis is Z.
cylinder(.64,.64,7.6,materials.hull,station,[0,0,0],[Math.PI/2,0,0]);
for(let z=-3.6;z<=3.6;z+=.45){torus(.665,.045,materials.dark,station,[0,0,z]);}
for(let z of [-3.7,3.7]) cylinder(.85,.7,.28,materials.white,station,[0,0,z],[Math.PI/2,0,0]);
cylinder(.48,.75,1.2,materials.white,station,[0,0,4.25],[Math.PI/2,0,0]);
cylinder(.49,.49,.2,materials.dark,station,[0,0,4.9],[Math.PI/2,0,0]);
torus(.4,.06,materials.cyan,station,[0,0,5.02]);
mesh(new THREE.SphereGeometry(.38,24,16),new THREE.MeshPhysicalMaterial({color:'#83afba',metalness:.8,roughness:.12}),station,[0,0,5]);
for(let i=0;i<8;i++){
 const a=i*Math.PI/4;box(.14,.07,1.5,materials.dark,station,[Math.cos(a)*.67,Math.sin(a)*.67,2.4],[0,0,a]);
 box(.075,.035,.55,materials.window,station,[Math.cos(a)*.72,Math.sin(a)*.72,3.2],[0,0,a]);
}
const ring = new THREE.Group();station.add(ring);
// Twin habitat rims and many individually segmented pressure modules.
for(let z of [-.58,.58]){
 torus(3.65,.15,materials.hull,ring,[0,0,z]);
 torus(3.86,.035,materials.gold,ring,[0,0,z]);
 torus(3.4,.075,materials.dark,ring,[0,0,z]);
}
for(let i=0;i<48;i++){
 const a=i*Math.PI*2/48;
 const module=new THREE.Group();module.position.set(Math.cos(a)*3.65,Math.sin(a)*3.65,0);module.rotation.z=a;ring.add(module);
 box(.55,.43,1.05,i%6===0?materials.gold:materials.white,module);
 box(.025,.36,.78,materials.dark,module,[.285,0,0]);
 for(let k=-1;k<=1;k++)box(.03,.24,.115,i%7===0?materials.amber:materials.window,module,[.302,0,k*.24]);
 box(.34,.022,.8,materials.dark,module,[0,.224,0]);
 if(i%4===0){box(.2,.26,.23,materials.dark,module,[0,0,.68]);box(.13,.14,.015,materials.window,module,[0,0,.81]);}
}
for(let i=0;i<8;i++){
 const a=i*Math.PI/4;
 const c=Math.cos(a),s=Math.sin(a);
 for(let z of [-.46,.46]){
 beam([c*.65,s*.65,z],[c*3.43,s*3.43,z],.085,materials.hull,ring);
 const tang=new THREE.Vector2(-s,c);
 for(let j=0;j<5;j++){
  const r=1+j*.47;
  beam([c*r+tang.x*.13,s*r+tang.y*.13,z],[c*(r+.47)-tang.x*.13,s*(r+.47)-tang.y*.13,z],.025,materials.gold,ring);
 }
 }
 beam([c*3.65,s*3.65,-.7],[c*3.65,s*3.65,.7],.045,materials.dark,ring);
}
// A secondary ring and rotating electromagnetic reactor.
const reactor = new THREE.Group();reactor.position.z=-2.65;station.add(reactor);
cylinder(.8,.8,1.3,materials.dark,reactor,[0,0,0],[Math.PI/2,0,0]);
for(let z of [-.55,-.3,0,.3,.55])torus(.86,.045,materials.cyan,reactor,[0,0,z],undefined,64);
for(let i=0;i<12;i++){
 let a=i*Math.PI/6;
 box(.2,.22,1.5,materials.hull,reactor,[Math.cos(a)*1.0,Math.sin(a)*1.0,0],[0,0,a]);
}
torus(1.4,.07,materials.gold,reactor,[0,0,0]);
// Layered aft engine cover with concentric fasteners and a recessed aperture.
cylinder(.58,.58,.11,materials.dark,station,[0,0,-3.87],[Math.PI/2,0,0]);
torus(.48,.025,materials.gold,station,[0,0,-3.94]);
cylinder(.35,.35,.06,materials.black,station,[0,0,-3.96],[Math.PI/2,0,0]);
torus(.28,.025,materials.cyan,station,[0,0,-4.01]);
for(let i=0;i<12;i++){const a=i*Math.PI/6;box(.07,.1,.04,materials.gold,station,[Math.cos(a)*.65,Math.sin(a)*.65,-3.86],[0,0,a]);}

for(let i=0;i<6;i++){let a=i*Math.PI/3;beam([Math.cos(a),Math.sin(a),0],[Math.cos(a)*1.4,Math.sin(a)*1.4,0],.06,materials.white,reactor);}
const coreLight=new THREE.PointLight('#70f9e4',5,7);coreLight.position.z=-2.65;station.add(coreLight);
// Photovoltaic material with an actual cell grid, contacts, and a subtle iridescent response.
const panelCanvas=document.createElement('canvas');panelCanvas.width=256;panelCanvas.height=512;
const ctx=panelCanvas.getContext('2d');ctx.fillStyle='#172c40';ctx.fillRect(0,0,256,512);
for(let y=0;y<16;y++)for(let x=0;x<8;x++){
 ctx.fillStyle=`hsl(${208+(x+y)%5*3}, ${35+(x%3)*5}%, ${17+(x*3+y*7)%9}%)`;ctx.fillRect(x*32+2,y*32+2,28,28);
 ctx.strokeStyle='#799aaf55';ctx.lineWidth=.5;ctx.strokeRect(x*32+3,y*32+3,26,26);
 ctx.fillStyle='#97a7a855';ctx.fillRect(x*32+15,y*32+3,1,26);
}
const panelTexture=new THREE.CanvasTexture(panelCanvas);panelTexture.colorSpace=THREE.SRGBColorSpace;panelTexture.anisotropy=renderer.capabilities.getMaxAnisotropy();
const panelMaterial=new THREE.MeshStandardMaterial({map:panelTexture,color:'#8faad4',metalness:.7,roughness:.48,emissive:'#264265',emissiveMap:panelTexture,emissiveIntensity:.65,side:THREE.DoubleSide});
const arrays=new THREE.Group();arrays.position.z=-1.5;station.add(arrays);
for(let side of [-1,1]){
 beam([side*.6,0,0],[side*8.5,0,0],.085,materials.hull,arrays);
 for(let k=0;k<3;k++){
  const x=side*(4.5+k*1.45);
  for(let sy of [-1,1]){
   const wing=new THREE.Group();wing.position.set(x,sy*1.65,0);wing.rotation.x=-.16;arrays.add(wing);
   box(1.3,3.05,.055,materials.gold,wing);
   box(1.23,2.98,.015,panelMaterial,wing,[0,0,.038]);
   box(1.23,2.98,.015,panelMaterial,wing,[0,0,-.038]);
   for(let y of [-1.51,0,1.51])box(1.32,.035,.075,materials.hull,wing,[0,y,0]);
  }
 }
 cylinder(.17,.17,.7,materials.gold,arrays,[side*3.5,0,0],[0,0,Math.PI/2]);
}
// Docked modules, radiator fins, antennae and communications dishes.
for(let side of [-1,1]){
 cylinder(.42,.42,1.6,materials.white,station,[side*1.45,0,2.3],[0,0,Math.PI/2]);
 cylinder(.32,.42,.3,materials.gold,station,[side*2.35,0,2.3],[0,0,Math.PI/2]);
 for(let y of [-1,1]){
  box(.82,1.7,.09,materials.white,station,[side*1.25,y*1.2,2]);
  for(let j=0;j<9;j++)box(.76,.035,.02,materials.dark,station,[side*1.25,y*1.2-.72+j*.18,2.057]);
 }
}
beam([0,.6,2.8],[0,2.2,3.1],.04,materials.hull);
const dish=mesh(new THREE.SphereGeometry(.58,32,16,0,Math.PI*2,0,Math.PI*.38),new THREE.MeshStandardMaterial({color:'#d4c8ac',metalness:.7,roughness:.35,side:THREE.DoubleSide}),station,[0,2.25,3.1],[.5,0,.4]);
beam([0,2.25,3.1],[0,3,3.3],.022,materials.gold);
for(let x of [-.45,.45])beam([x,0,4.3],[x*1.5,.4,5.6],.018,materials.hull);
for(let i=0;i<6;i++){
 const a=i*Math.PI/3;mesh(new THREE.SphereGeometry(.038,8,8),materials.amber,ring,[Math.cos(a)*3.97,Math.sin(a)*3.97,.4]);
}

// Batch by material: hundreds of modeled parts become a few dozen draw calls.
const batching = [
 batchMeshes(station,{exclude:[ring,reactor,arrays]}),
 batchMeshes(ring,{system:'habitat'}),
 batchMeshes(reactor,{system:'core'}),
 batchMeshes(arrays,{system:'arrays'}),
];
const pickable = [ring,reactor,arrays].flatMap(group=>group.children.filter(child=>child.isMesh));
const stationSurfaces=[...station.children.filter(child=>child.isMesh),...pickable];

// A tiny supply tender on a collision-free rendezvous circuit gives the habitat scale.
const shuttle = new THREE.Group();scene.add(shuttle);
cylinder(.16,.25,.9,materials.white,shuttle,[0,0,0],[Math.PI/2,0,0],12);
cylinder(.02,.16,.4,materials.white,shuttle,[0,0,.65],[Math.PI/2,0,0],12);
box(.22,.08,.24,materials.window,shuttle,[0,.15,.3]);
for(const side of [-1,1]){
 box(.55,.055,.4,materials.dark,shuttle,[side*.4,-.04,-.2],[0,side*.25,0]);
 cylinder(.10,.13,.3,materials.dark,shuttle,[side*.19,-.03,-.52],[Math.PI/2,0,0],12);
 torus(.075,.025,materials.cyan,shuttle,[side*.19,-.03,-.69],undefined,16);
}
const plumeMaterial=new THREE.MeshBasicMaterial({color:'#74dce7',transparent:true,opacity:.2,blending:THREE.AdditiveBlending,depthWrite:false});
const plumes=[];
for(const side of [-1,1])plumes.push(mesh(new THREE.ConeGeometry(.09,.7,12),plumeMaterial,shuttle,[side*.19,-.03,-1.03],[-Math.PI/2,0,0]));
batchMeshes(shuttle,{exclude:plumes});
function shuttlePoint(t,target){return target.set(Math.sin(t)*12,Math.sin(t*2)*2-1.2,Math.cos(t)*10);}
const pathPoints=[];
for(let i=0;i<=180;i++)pathPoints.push(shuttlePoint(i/180*Math.PI*2,new THREE.Vector3()));
const orbitPath=new THREE.Line(new THREE.BufferGeometry().setFromPoints(pathPoints),new THREE.LineDashedMaterial({color:'#75a4a8',transparent:true,opacity:.13,dashSize:.13,gapSize:.22}));
orbitPath.computeLineDistances();scene.add(orbitPath);
const shuttleNext=new THREE.Vector3();

// Seeded stars make the scene reproducible.
let seed=1839;function random(){seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;}
const starCount=2400,starPositions=new Float32Array(starCount*3),starColors=new Float32Array(starCount*3);
for(let i=0;i<starCount;i++){
 const theta=random()*Math.PI*2,u=random()*2-1,r=250+random()*400;
 starPositions.set([r*Math.sqrt(1-u*u)*Math.cos(theta),r*u,r*Math.sqrt(1-u*u)*Math.sin(theta)],i*3);
 const c=new THREE.Color().setHSL(.52+random()*.15,.1+random()*.3,.35+random()*.5);starColors.set([c.r,c.g,c.b],i*3);
}
const starGeometry=new THREE.BufferGeometry();starGeometry.setAttribute('position',new THREE.BufferAttribute(starPositions,3));starGeometry.setAttribute('color',new THREE.BufferAttribute(starColors,3));
scene.add(new THREE.Points(starGeometry,new THREE.PointsMaterial({size:.55,vertexColors:true,transparent:true,opacity:.8,sizeAttenuation:true})));
// Procedural ocean, continents, cloud belts and day/night terminator.
const noiseGLSL=`
float hash(vec3 p){p=fract(p*.3183099+vec3(.1,.2,.3));p*=17.;return fract(p.x*p.y*p.z*(p.x+p.y+p.z));}
float noise(vec3 p){vec3 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(mix(hash(i),hash(i+vec3(1,0,0)),f.x),mix(hash(i+vec3(0,1,0)),hash(i+vec3(1,1,0)),f.x),f.y),mix(mix(hash(i+vec3(0,0,1)),hash(i+vec3(1,0,1)),f.x),mix(hash(i+vec3(0,1,1)),hash(i+vec3(1,1,1)),f.x),f.y),f.z);}
float fbm(vec3 p){float v=0.;float a=.5;for(int i=0;i<5;i++){v+=a*noise(p);p=p*2.03+3.1;a*=.5;}return v;}
`;
const planetUniforms={uTime:{value:0},uSun:{value:new THREE.Vector3(-.8,.5,.65).normalize()}};
const planetMaterial=new THREE.ShaderMaterial({uniforms:planetUniforms,vertexShader:`varying vec3 vP;varying vec3 vN;varying vec3 vW;void main(){vP=position;vN=normalize(mat3(modelMatrix)*normal);vW=(modelMatrix*vec4(position,1.)).xyz;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,fragmentShader:`
 varying vec3 vP;varying vec3 vN;varying vec3 vW;uniform float uTime;uniform vec3 uSun;${noiseGLSL}
 void main(){vec3 p=normalize(vP);float continent=fbm(p*4.+vec3(1.2,3.2,2.));float detail=fbm(p*32.);float land=smoothstep(.49,.54,continent);vec3 ocean=mix(vec3(.015,.055,.085),vec3(.035,.17,.22),detail);vec3 ground=mix(vec3(.09,.17,.15),vec3(.35,.36,.24),fbm(p*14.));vec3 col=mix(ocean,ground,land);float ice=smoothstep(.78,.96,abs(p.y)+detail*.1);col=mix(col,vec3(.67,.76,.77),ice);vec3 cp=p*7.;cp.x+=uTime*.008;float cloud=fbm(cp+vec3(fbm(p*12.)*.7));float clouds=smoothstep(.48,.68,cloud);col=mix(col,vec3(.75,.83,.85),clouds*.85);float sunlight=dot(normalize(vN),uSun);float day=smoothstep(-.2,.55,sunlight);col*=mix(.035,.85,day);float rim=pow(1.-max(0.,dot(normalize(cameraPosition-vW),normalize(vN))),3.);col+=vec3(.07,.25,.39)*rim*day;gl_FragColor=vec4(col,1.);}
`});
const planet=mesh(new THREE.SphereGeometry(65,128,96),planetMaterial,scene,[6,-67,-85]);
const atmosphere=mesh(new THREE.SphereGeometry(66.1,96,64),new THREE.ShaderMaterial({transparent:true,side:THREE.BackSide,blending:THREE.AdditiveBlending,depthWrite:false,uniforms:{uSun:planetUniforms.uSun},vertexShader:`varying vec3 vNormal;varying vec3 vWorld;void main(){vNormal=normalize(mat3(modelMatrix)*normal);vWorld=(modelMatrix*vec4(position,1.)).xyz;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,fragmentShader:`varying vec3 vNormal;varying vec3 vWorld;uniform vec3 uSun;void main(){float rim=pow(clamp(1.-abs(dot(normalize(cameraPosition-vWorld),vNormal)),0.,1.),5.);float day=smoothstep(-.3,.8,dot(vNormal,uSun));gl_FragColor=vec4(vec3(.15,.48,.72)*day,rim*.55);}`}),scene,planet.position.toArray());

// Camera choreography. Each system remains freely orbitable after arrival.
const views={
 overview:{position:[14,9,19],target:[-2.2,0,0]},
 habitat:{position:[8,4,10],target:[.4,0,0],number:'01 / LIFE SUPPORT',title:'A place to<br>call home.',description:'A rotating habitat creates a quiet pocket of gravity. Forty-eight pressurized modules house the crew, their gardens, and the beginnings of a new world.',label:'HABITAT CAPACITY',value:'128 crew'},
 arrays:{position:[11,5,9],target:[4.8,0,-1.5],number:'02 / ENERGY HARVEST',title:'Powered by<br>a distant sun.',description:'Twelve articulated photovoltaic wings follow the light. Thousands of individual cells collect the energy that keeps Odyssey alive.',label:'PEAK GENERATION',value:'2.4 MW'},
 core:{position:[5,2,-8],target:[0,0,-2.6],number:'03 / ENGINEERING',title:'The heart<br>of the mission.',description:'A magnetically contained reactor supplies uninterrupted power through the long eclipse. Its luminous field is the heartbeat of the observatory.',label:'CORE STABILITY',value:'99.98%'}
};
let currentView='overview',transition=null,paused=reducedMotion,eclipse=false,cinematic=false;
function viewPosition(view){if(!mobile())return view.position;if(view===views.overview)return [19,12,29];return view.position.map((v,i)=>view.target[i]+(v-view.target[i])*1.65+(i===1?2:0));}
function viewTarget(view){if(!mobile())return view.target;return view===views.overview?[0,3,0]:view.target.map((v,i)=>v+(i===1?2:0));}
document.querySelectorAll('[data-view]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.view==='overview')));
camera.position.fromArray(viewPosition(views.overview));controls.target.fromArray(viewTarget(views.overview));controls.update();
function selectView(name){
 currentView=name;renderer.domElement.dataset.view=name;const view=views[name];
 transition={start:performance.now(),from:camera.position.clone(),targetFrom:controls.target.clone(),to:new THREE.Vector3(...viewPosition(view)),targetTo:new THREE.Vector3(...viewTarget(view))};
 controls.autoRotate=false;
 document.querySelectorAll('[data-view]').forEach(b=>{b.classList.toggle('active',b.dataset.view===name);b.setAttribute('aria-pressed',String(b.dataset.view===name));});
 $('.intro').classList.toggle('hidden',name!=='overview');$('#detail').classList.toggle('hidden',name==='overview');
 if(name!=='overview'){$('#detail-number').textContent=view.number;$('#detail-title').innerHTML=view.title;$('#detail-description').textContent=view.description;$('#detail-stat-label').textContent=view.label;$('#detail-stat-value').textContent=view.value;}
}
document.querySelectorAll('[data-view]').forEach(b=>b.onclick=()=>selectView(b.dataset.view));
const raycaster=new THREE.Raycaster(),pointer=new THREE.Vector2();
let pointerDown=null;
renderer.domElement.addEventListener('pointerdown',e=>{pointerDown=e.isPrimary?{x:e.clientX,y:e.clientY}:null;});
renderer.domElement.addEventListener('pointerup',e=>{
 if(!pointerDown||Math.hypot(e.clientX-pointerDown.x,e.clientY-pointerDown.y)>6)return;
 pointerDown=null;
 if(cinematic)return;
 pointer.set(e.clientX/innerWidth*2-1,-e.clientY/innerHeight*2+1);raycaster.setFromCamera(pointer,camera);
 const hit=raycaster.intersectObjects(stationSurfaces,false)[0];if(hit?.object.userData.system)selectView(hit.object.userData.system);
});
renderer.domElement.addEventListener('pointercancel',()=>{pointerDown=null;});
const hotspotData=[
 {name:'habitat',label:'HABITAT RING',point:new THREE.Vector3(2.6,2.9,.7)},
 {name:'arrays',label:'SOLAR ARRAYS',point:new THREE.Vector3(6,-2.5,-1.5)},
 {name:'core',label:'REACTOR',point:new THREE.Vector3(0,-1,-2.7)},
];
const hotspotLayer=document.createElement('div');hotspotLayer.className='hotspots';$('#interface').appendChild(hotspotLayer);
const projected=new THREE.Vector3();
for(const item of hotspotData){
 item.element=document.createElement('button');item.element.className='hotspot';item.element.setAttribute('aria-label',`Explore ${item.label.toLowerCase()}`);item.element.innerHTML=`<span class="hotspot-dot">+</span><span class="hotspot-name">${item.label}</span>`;
 item.element.onclick=()=>selectView(item.name);hotspotLayer.appendChild(item.element);
}
function updateHotspots(){
 const show=currentView==='overview'&&!cinematic&&!mobile()&&!transition;
 hotspotLayer.classList.toggle('hidden',!show);if(!show)return;
 const occupied=[];
 for(const item of hotspotData){
  projected.copy(item.point).applyMatrix4(station.matrixWorld).project(camera);
  const x=(projected.x*.5+.5)*innerWidth,y=(-projected.y*.5+.5)*innerHeight;
  const collision=occupied.some(p=>Math.abs(p.x-x)<155&&Math.abs(p.y-y)<38);
  const visible=!collision&&projected.z<1&&projected.z>-1&&x>innerWidth*.37&&x<innerWidth-200&&y>115&&y<innerHeight-195;
  if(visible)occupied.push({x,y});
  item.element.classList.toggle('hidden',!visible);item.element.style.transform=`translate(${x}px,${y}px)`;
 }
}

$('#tour').onclick=()=>selectView('habitat');$('#close-detail').onclick=()=>selectView('overview');
controls.addEventListener('start',()=>{transition=null;controls.autoRotate=false;});
controls.addEventListener('end',()=>{controls.autoRotate=!paused&&currentView==='overview';});
function updateMotion(){controls.autoRotate=!paused&&currentView==='overview';$('#motion').textContent=paused?'▷':'Ⅱ';$('#motion').setAttribute('aria-label',paused?'Resume orbital motion':'Pause orbital motion');$('#motion').setAttribute('aria-pressed',String(paused));$('#motion').title=paused?'Resume orbital motion':'Pause orbital motion';}
$('#motion').onclick=()=>{paused=!paused;updateMotion();};updateMotion();
$('#light').onclick=()=>{eclipse=!eclipse;$('#light').classList.toggle('selected',eclipse);$('#light').setAttribute('aria-pressed',String(eclipse));$('#light').setAttribute('aria-label',eclipse?'Switch to daylight':'Switch to eclipse lighting');};
function toggleCinema(){cinematic=!cinematic;$('#interface').classList.toggle('cinematic',cinematic);$('#interface').inert=cinematic;$('#exit-cinema').classList.toggle('hidden',!cinematic);if(cinematic)$('#exit-cinema').focus();else $('#cinema').focus();}
$('#cinema').onclick=toggleCinema;$('#exit-cinema').onclick=toggleCinema;
$('#about').onclick=()=>$('#about-dialog').showModal();$('#close-about').onclick=()=>$('#about-dialog').close();
$('#about-dialog').addEventListener('click',e=>{if(e.target===$('#about-dialog')){const r=e.target.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)e.target.close();}});
addEventListener('keydown',e=>{if(e.repeat||e.metaKey||e.ctrlKey||e.altKey||$('#about-dialog').open)return;if(e.key.toLowerCase()==='h')toggleCinema();if(e.key==='Escape'&&cinematic)toggleCinema();if(['1','2','3','4'].includes(e.key))selectView(Object.keys(views)[Number(e.key)-1]);});
// Sound is opt-in and generated with Web Audio; no network or audio files.
let audioContext,master,soundOn=false;
$('#sound').onclick=async()=>{
 try{
  if(!audioContext){audioContext=new AudioContext();master=audioContext.createGain();master.gain.value=0;master.connect(audioContext.destination);for(const f of [55,82.41,110,164.81]){const osc=audioContext.createOscillator();osc.type='sine';osc.frequency.value=f;const gain=audioContext.createGain();gain.gain.value=.06;osc.connect(gain);gain.connect(master);osc.start();}}
  await audioContext.resume();soundOn=!soundOn;master.gain.setTargetAtTime(soundOn?.35:0,audioContext.currentTime,.8);$('#sound').classList.toggle('selected',soundOn);$('#sound').setAttribute('aria-pressed',String(soundOn));$('#sound').setAttribute('aria-label',soundOn?'Mute ambient sound':'Enable ambient sound');
 }catch{ $('#sound').title='Audio unavailable in this browser'; }
};
addEventListener('resize',()=>{camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight);composer.setSize(innerWidth,innerHeight);selectView(currentView);});
let last=performance.now(),elapsed=0;
function animate(now){
 const dt=Math.min((now-last)/1000,.05);last=now;
 if(!paused){elapsed+=dt;ring.rotation.z=elapsed*.025;reactor.rotation.z=-elapsed*.09;planet.rotation.y=elapsed*.005;planetUniforms.uTime.value=elapsed;}
 const shuttlePhase=elapsed*.045+2.6;
 shuttlePoint(shuttlePhase,shuttle.position);shuttle.lookAt(shuttlePoint(shuttlePhase+.01,shuttleNext));
 plumes.forEach(p=>p.scale.y=.85+Math.sin(elapsed*7)*.15);

 sun.intensity=THREE.MathUtils.damp(sun.intensity,eclipse?.12:4.2,2,dt);
 fill.intensity=THREE.MathUtils.damp(fill.intensity,eclipse?.65:2,2,dt);
 coreLight.intensity=5+Math.sin(elapsed*1.4)*.6;
 if(transition){let t=Math.min(1,(now-transition.start)/(reducedMotion?1:1800));t=t*t*(3-2*t);camera.position.lerpVectors(transition.from,transition.to,t);controls.target.lerpVectors(transition.targetFrom,transition.targetTo,t);if(t>=1){transition=null;controls.autoRotate=!paused&&currentView==='overview';}}
 controls.update(dt);updateHotspots();composer.render();
}
renderer.domElement.dataset.modeledParts=String(batching.reduce((sum,x)=>sum+x.before,0));
renderer.domElement.dataset.batchedMeshes=String(batching.reduce((sum,x)=>sum+x.after,0));
renderer.setAnimationLoop(animate);
document.addEventListener('visibilitychange',()=>{
 last=performance.now();
 renderer.setAnimationLoop(document.hidden?null:animate);
 if(master)master.gain.setTargetAtTime(!document.hidden&&soundOn?.35:0,audioContext.currentTime,.2);
});
renderer.domElement.addEventListener('webglcontextlost',e=>{e.preventDefault();renderer.setAnimationLoop(null);const notice=document.createElement('div');notice.id='loading';notice.innerHTML='<p>GRAPHICS INTERRUPTED</p><button onclick="location.reload()">Reload to reconnect</button>';document.body.appendChild(notice);});
requestAnimationFrame(()=>requestAnimationFrame(()=>{$('#loading').style.opacity='0';setTimeout(()=>$('#loading').remove(),1100);}));
