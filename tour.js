import * as THREE from 'https://esm.sh/three@0.185.1';
import { EffectComposer } from 'https://esm.sh/three@0.185.1/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'https://esm.sh/three@0.185.1/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'https://esm.sh/three@0.185.1/examples/jsm/postprocessing/UnrealBloomPass.js';

const host = document.querySelector('#tourWebgl');
const shell = document.querySelector('.tour-shell');
const stage = document.querySelector('#tourStage');
const chapters = [...document.querySelectorAll('[data-tour-chapter]')];
const hotspots = [...document.querySelectorAll('[data-hotspot]')];
const hudProgress = document.querySelector('#hudProgress');
const hudState = document.querySelector('#hudState');
const hudStep = document.querySelector('#hudStep');
const gpuTierEl = document.querySelector('#gpuTier');
const mapState = document.querySelector('#mapState');
const mapDots = [...document.querySelectorAll('.map-line i')];
const depthLabel = document.querySelector('#depthLabel');
const colorwash = document.querySelector('#tourColorwash');
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const experience = window.AIFENCE_EXPERIENCE || {};

const CHAPTERS = [
  {name:'risk', label:'UNBOUNDED', description:'Agent intent exists, but artifact quality, authority, and delivery are not yet established.', color:'#ff667e'},
  {name:'boundary', label:'THE FENCE', description:'The request crosses from agent intent into externally governed execution.', color:'#79f7d2'},
  {name:'quality', label:'QUALITY', description:'Deterministic admission evaluates the artifact before sensitive authorization.', color:'#63b3ff'},
  {name:'guard', label:'GUARD', description:'Mandatory fail-closed policy decides exact action authority outside the agent.', color:'#b293ff'},
  {name:'bus', label:'BUS', description:'A tenant-scoped handoff is committed durably before delivery can be claimed.', color:'#78f3cf'},
  {name:'evidence', label:'EVIDENCE', description:'A hash-linked completion event produces one truthful receipt.', color:'#f0c775'},
];

function detectTier(){
  const mem = navigator.deviceMemory || 4;
  const cores = navigator.hardwareConcurrency || 4;
  const mobile = innerWidth < 760 || matchMedia('(pointer:coarse)').matches;
  if (mobile || mem <= 4 || cores <= 4) return 'LOW';
  if (mem >= 8 && cores >= 8 && innerWidth >= 1100) return 'HIGH';
  return 'MEDIUM';
}
const tier = detectTier();
const mobileView = innerWidth < 680;
if (gpuTierEl) gpuTierEl.textContent = tier;

function webglAvailable(){
  try { const c=document.createElement('canvas'); return !!(window.WebGL2RenderingContext && c.getContext('webgl2')) || !!c.getContext('webgl'); }
  catch { return false; }
}

if (!host || !shell || !stage || reduced || !webglAvailable()) {
  document.body.classList.add(reduced ? 'reduce-3d' : 'webgl-failed');
  chapters.forEach((el,i)=>el.classList.toggle('is-active',i===0));
} else {
  const COLORS={risk:0xff667e,mint:0x79f7d2,quality:0x63b3ff,guard:0xb293ff,bus:0x78f3cf,audit:0xf0c775,white:0xd7e3e7,dark:0x071017};
  const scene=new THREE.Scene();
  scene.background=new THREE.Color(0x020405);
  scene.fog=new THREE.FogExp2(0x020405,tier==='LOW'?0.026:0.021);
  const camera=new THREE.PerspectiveCamera(innerWidth<680?55:48,innerWidth/innerHeight,.1,180);
  camera.position.set(-7,2.4,10);
  const renderer=new THREE.WebGLRenderer({alpha:false,antialias:tier!=='LOW',powerPreference:'high-performance'});
  const dprCap=tier==='HIGH'?1.85:tier==='MEDIUM'?1.5:1.15;
  renderer.setPixelRatio(Math.min(devicePixelRatio,dprCap));
  renderer.setSize(innerWidth,innerHeight);
  renderer.outputColorSpace=THREE.SRGBColorSpace;
  renderer.toneMapping=THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure=1.08;
  host.appendChild(renderer.domElement);

  const composer=new EffectComposer(renderer);
  composer.addPass(new RenderPass(scene,camera));
  const bloom=new UnrealBloomPass(new THREE.Vector2(innerWidth,innerHeight),tier==='HIGH'?.82:tier==='MEDIUM'?.58:.34,.78,.22);
  composer.addPass(bloom);

  scene.add(new THREE.HemisphereLight(0x8bb4c1,0x020405,.24));
  const key=new THREE.PointLight(COLORS.mint,18,28,2);key.position.set(9,5,5);scene.add(key);
  const blue=new THREE.PointLight(COLORS.quality,15,28,2);blue.position.set(25,3,4);scene.add(blue);
  const violet=new THREE.PointLight(COLORS.guard,16,28,2);violet.position.set(38,2,4);scene.add(violet);
  const gold=new THREE.PointLight(COLORS.audit,12,24,2);gold.position.set(61,1,3);scene.add(gold);

  const world=new THREE.Group();scene.add(world);
  const animated=[];
  const hotspotAnchors={};
  const sceneGroups={};
  let scrollProgress=0,smoothProgress=0,pointerX=0,pointerY=0,touchX=0,touchY=0,lastChapter=-1;
  let lowPerfFrames=0, degraded=false;
  const frameSamples=[];
  const clock=new THREE.Clock();

  const basic=(color,opacity=1)=>new THREE.MeshBasicMaterial({color,transparent:opacity<1,opacity,depthWrite:opacity>.65,blending:opacity<.45?THREE.AdditiveBlending:THREE.NormalBlending});
  const physical=(color,emissive=color,intensity=.25,opacity=1)=>new THREE.MeshPhysicalMaterial({color,emissive,emissiveIntensity:intensity,roughness:.28,metalness:.58,transparent:opacity<1,opacity,depthWrite:opacity>.7,clearcoat:.4,clearcoatRoughness:.32});
  const line=(color,opacity=.35)=>new THREE.LineBasicMaterial({color,transparent:true,opacity,blending:THREE.AdditiveBlending,depthWrite:false});

  function node(color,scale=1){const g=new THREE.Group();const core=new THREE.Mesh(new THREE.IcosahedronGeometry(.12*scale,1),basic(color,.95));const halo=new THREE.Mesh(new THREE.SphereGeometry(.27*scale,16,16),basic(color,.045));g.add(core,halo);return g;}
  function ring(radius,tube,color,opacity=.3){return new THREE.Mesh(new THREE.TorusGeometry(radius,tube,12,96),basic(color,opacity));}
  function addEdges(group,mesh,color,opacity=.35){const e=new THREE.LineSegments(new THREE.EdgesGeometry(mesh.geometry),line(color,opacity));e.position.copy(mesh.position);e.rotation.copy(mesh.rotation);e.scale.copy(mesh.scale);group.add(e);return e;}
  function gridPlane(group,color,w=7,h=7,space=.7){const v=[];for(let y=-h/2;y<=h/2;y+=space)v.push(0,y,-w/2,0,y,w/2);for(let z=-w/2;z<=w/2;z+=space)v.push(0,-h/2,z,0,h/2,z);const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(v,3));const l=new THREE.LineSegments(geo,line(color,.1));group.add(l);return l;}

  // Instanced semantic field: request/evidence particles, not decorative confetti.
  const particleCount=tier==='HIGH'?900:tier==='MEDIUM'?520:240;
  const particleGeo=new THREE.TetrahedronGeometry(.027,0);
  const particleMat=basic(COLORS.white,.36);
  const particleField=new THREE.InstancedMesh(particleGeo,particleMat,particleCount);
  particleField.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  const dummy=new THREE.Object3D();
  const particleSeeds=Array.from({length:particleCount},(_,i)=>({x:THREE.MathUtils.randFloat(-10,70),y:THREE.MathUtils.randFloat(-7,7),z:THREE.MathUtils.randFloat(-8,8),s:.55+Math.random()*1.4,p:Math.random()*6.28}));
  particleSeeds.forEach((s,i)=>{dummy.position.set(s.x,s.y,s.z);dummy.scale.setScalar(s.s);dummy.updateMatrix();particleField.setMatrixAt(i,dummy.matrix)});world.add(particleField);

  // Far field star points make spatial motion legible.
  const starCount=tier==='HIGH'?1600:tier==='MEDIUM'?950:450;
  const starPos=[];for(let i=0;i<starCount;i++)starPos.push(THREE.MathUtils.randFloat(-12,80),THREE.MathUtils.randFloat(-13,13),THREE.MathUtils.randFloat(-18,10));
  const starGeo=new THREE.BufferGeometry();starGeo.setAttribute('position',new THREE.Float32BufferAttribute(starPos,3));
  const stars=new THREE.Points(starGeo,new THREE.PointsMaterial({size:tier==='LOW'?.025:.035,color:0x6d7e88,transparent:true,opacity:.38,depthWrite:false,blending:THREE.AdditiveBlending}));world.add(stars);

  // 00 Risk: dense, unstable agent core + risk fragments.
  const risk=new THREE.Group();risk.position.set(0,0,0);world.add(risk);sceneGroups.risk=risk;
  const agentCore=new THREE.Mesh(new THREE.IcosahedronGeometry(1.15,5),physical(0x14242b,COLORS.mint,.4));risk.add(agentCore);hotspotAnchors['risk-core']=agentCore;
  const agentWire=new THREE.LineSegments(new THREE.WireframeGeometry(new THREE.IcosahedronGeometry(1.75,2)),line(COLORS.mint,.18));risk.add(agentWire);
  const r1=ring(2.4,.008,COLORS.quality,.25);r1.rotation.x=1.1;const r2=ring(2.9,.008,COLORS.mint,.14);r2.rotation.set(.42,.7,.5);risk.add(r1,r2);
  const riskShards=[];for(let i=0;i<22;i++){const s=new THREE.Mesh(new THREE.TetrahedronGeometry(.12+(i%4)*.035,0),physical(COLORS.risk,COLORS.risk,1.1,.9));const a=i/22*Math.PI*2,rr=2.1+(i%5)*.24;s.position.set(Math.cos(a)*rr,Math.sin(a*1.8)*1.7,Math.sin(a)*rr*.56);s.rotation.set(a,a*.6,a*1.4);risk.add(s);riskShards.push(s)}
  animated.push(t=>{agentCore.rotation.y=t*.18;agentCore.rotation.x=Math.sin(t*.42)*.08;agentWire.rotation.y=-t*.08;r1.rotation.z=t*.08;r2.rotation.y=t*.05;riskShards.forEach((s,i)=>{s.rotation.x+=.004;s.rotation.y+=.003;s.position.y+=Math.sin(t*.9+i)*.0012})});

  // 01 Boundary: shader-driven energy membrane and tunnel rings.
  const boundary=new THREE.Group();boundary.position.set(11,0,0);world.add(boundary);sceneGroups.boundary=boundary;
  const gateUniforms={uTime:{value:0},uProgress:{value:0},uColor:{value:new THREE.Color(COLORS.mint)}};
  const gateMat=new THREE.ShaderMaterial({transparent:true,side:THREE.DoubleSide,depthWrite:false,blending:THREE.AdditiveBlending,uniforms:gateUniforms,vertexShader:`uniform float uTime;varying vec2 vUv;varying vec3 vPos;void main(){vUv=uv;vPos=position;vec3 p=position;p.x+=sin((uv.y+uTime*.13)*26.)*.018;gl_Position=projectionMatrix*modelViewMatrix*vec4(p,1.);}`,fragmentShader:`uniform float uTime;uniform float uProgress;uniform vec3 uColor;varying vec2 vUv;varying vec3 vPos;void main(){float scan=.5+.5*sin(vUv.y*58.-uTime*5.);float edge=pow(1.-abs(vUv.x-.5)*2.,4.);float bands=smoothstep(.72,1.,scan)*.25;float alpha=.045+edge*.22+bands*.13+uProgress*.08;gl_FragColor=vec4(uColor,alpha);}`});
  const gate=new THREE.Mesh(new THREE.PlaneGeometry(7.4,7.4,24,24),gateMat);gate.rotation.y=Math.PI/2;boundary.add(gate);
  for(let i=0;i<16;i++){const rr=ring(3.35-i*.025,.014,i%4===0?COLORS.mint:COLORS.quality,.1+(i%4===0?.15:0));rr.rotation.y=Math.PI/2;rr.position.x=-4.3+i*.55;boundary.add(rr)}
  const fenceBars=new THREE.Group();for(let i=-4;i<=4;i++){const bar=new THREE.Mesh(new THREE.BoxGeometry(.02,6.9,.018),basic(COLORS.mint,.12));bar.position.z=i*.72;fenceBars.add(bar)}boundary.add(fenceBars);

  // 02 Quality: recognizable prism, scan planes, findings orbit.
  const quality=new THREE.Group();quality.position.set(24,0,0);world.add(quality);sceneGroups.quality=quality;gridPlane(quality,COLORS.quality,7.5,7,0.65);
  const artifact=new THREE.Mesh(new THREE.OctahedronGeometry(1.0,2),physical(0x163d5d,COLORS.quality,.85));artifact.rotation.z=Math.PI/4;quality.add(artifact);hotspotAnchors['quality-artifact']=artifact;
  const artifactWire=new THREE.LineSegments(new THREE.WireframeGeometry(new THREE.OctahedronGeometry(1.2,1)),line(COLORS.quality,.55));quality.add(artifactWire);
  const scanPlanes=[];for(let i=0;i<4;i++){const pl=new THREE.Mesh(new THREE.PlaneGeometry(5.8,.035),basic(i%2?COLORS.quality:COLORS.mint,.45));pl.rotation.y=Math.PI/2;pl.position.x=(i-1.5)*.18;quality.add(pl);scanPlanes.push(pl)}
  const findings=[];for(let i=0;i<7;i++){const n=node(i===6?COLORS.mint:COLORS.quality,.68);const a=i/7*Math.PI*2;n.position.set(.35,Math.cos(a)*2.5,Math.sin(a)*2.5);quality.add(n);findings.push(n)}
  animated.push(t=>{artifact.rotation.y=t*.25;artifactWire.rotation.y=-t*.16;scanPlanes.forEach((p,i)=>p.position.y=Math.sin(t*1.25+i*1.5)*2.6);findings.forEach((n,i)=>n.scale.setScalar(.9+Math.sin(t*1.7+i)*.07))});

  // 03 Guard: shield layers + exact-action capability token.
  const guard=new THREE.Group();guard.position.set(37,0,0);world.add(guard);sceneGroups.guard=guard;
  const shield=new THREE.Mesh(new THREE.CylinderGeometry(2.1,2.35,.08,7,1,false),basic(COLORS.guard,.18));shield.rotation.z=Math.PI/2;shield.rotation.y=Math.PI/2;guard.add(shield);
  const shieldEdge=new THREE.LineSegments(new THREE.EdgesGeometry(shield.geometry),line(COLORS.guard,.6));shieldEdge.rotation.copy(shield.rotation);guard.add(shieldEdge);
  const guardR1=ring(2.6,.018,COLORS.guard,.34);guardR1.rotation.y=Math.PI/2;guard.add(guardR1);const guardR2=ring(3.15,.009,COLORS.mint,.16);guardR2.rotation.y=Math.PI/2;guard.add(guardR2);
  const capability=new THREE.Mesh(new THREE.DodecahedronGeometry(.62,0),physical(0x3a2e67,COLORS.guard,.9));capability.position.set(.6,0,0);guard.add(capability);hotspotAnchors['guard-capability']=capability;
  const policyNodes=[];for(let i=0;i<8;i++){const n=node(i<6?COLORS.guard:COLORS.mint,.55);const a=i/8*Math.PI*2;n.position.set(-.2,Math.cos(a)*2.05,Math.sin(a)*2.05);guard.add(n);policyNodes.push(n)}
  animated.push(t=>{capability.rotation.x=t*.31;capability.rotation.y=t*.23;guardR1.rotation.z=t*.08;guardR2.rotation.x=-t*.04;policyNodes.forEach((n,i)=>n.rotation.y=t*.2+i)});

  // 04 Bus: tenant lanes and moving durable packets.
  const bus=new THREE.Group();bus.position.set(50,0,0);world.add(bus);sceneGroups.bus=bus;
  const laneColors=[COLORS.bus,0x394650,0x394650];const laneY=[0,2.8,-2.8];
  laneY.forEach((y,idx)=>{const lane=ring(3.1,.008,laneColors[idx],idx===0?.22:.08);lane.rotation.y=Math.PI/2;lane.position.y=y;lane.scale.z=.8;bus.add(lane)});
  const busPositions=[new THREE.Vector3(0,0,0),new THREE.Vector3(0,2,2.5),new THREE.Vector3(0,-1.9,2.8),new THREE.Vector3(0,1.65,-2.8),new THREE.Vector3(0,-2.2,-2.4),new THREE.Vector3(0,.15,3.8)];
  busPositions.forEach((p,i)=>{const n=node(i===0?COLORS.bus:COLORS.quality,i===0?1.3:.85);n.position.copy(p);bus.add(n)});
  const curves=[],packets=[];for(let i=1;i<busPositions.length;i++){const a=busPositions[0].clone(),b=busPositions[i].clone(),mid=a.clone().lerp(b,.5);mid.x+=.9+i*.08;const c=new THREE.QuadraticBezierCurve3(a,mid,b);curves.push(c);bus.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(c.getPoints(36)),line(i%2?COLORS.bus:COLORS.quality,.3)));const p=new THREE.Mesh(new THREE.SphereGeometry(.08,12,12),basic(COLORS.bus,.98));bus.add(p);packets.push(p)}hotspotAnchors['bus-packet']=packets[0];
  const tenantBoundary=new THREE.Mesh(new THREE.PlaneGeometry(6.6,1.4),basic(COLORS.risk,.035));tenantBoundary.rotation.y=Math.PI/2;tenantBoundary.position.y=2.8;bus.add(tenantBoundary);
  animated.push(t=>{packets.forEach((p,i)=>p.position.copy(curves[i].getPoint((t*(.1+i*.008)+i*.17)%1)));tenantBoundary.material.opacity=.025+Math.sin(t*1.8)*.012});

  // 05 Evidence: signed receipt slab, hash chain, compatibility halo.
  const evidence=new THREE.Group();evidence.position.set(64,0,0);world.add(evidence);sceneGroups.evidence=evidence;
  const plate=new THREE.Mesh(new THREE.BoxGeometry(.14,4.4,6.4),physical(0x0b1c17,COLORS.mint,.34,.9));evidence.add(plate);addEdges(evidence,plate,COLORS.mint,.55);
  for(let y=-1.5;y<=1.5;y+=.75){const l=new THREE.Mesh(new THREE.BoxGeometry(.03,.02,4.8-Math.abs(y)*.4),basic(y>1?COLORS.audit:COLORS.mint,y>1?.62:.24));l.position.set(-.1,y,.25);evidence.add(l)}
  const chain=[];for(let i=0;i<9;i++){const n=node(i===8?COLORS.audit:COLORS.mint,.52);n.position.set(.55+i*.36,-2.6+i*.52,-3.9+i*.13);evidence.add(n);chain.push(n);if(i){evidence.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints([chain[i-1].position,n.position]),line(COLORS.mint,.3)))}}
  const seal=ring(.72,.055,COLORS.audit,.76);seal.rotation.y=Math.PI/2;seal.position.set(-.22,-1.2,-1.9);evidence.add(seal);hotspotAnchors['audit-seal']=seal;
  const compat=ring(3.65,.009,COLORS.audit,.12);compat.rotation.y=Math.PI/2;evidence.add(compat);
  animated.push(t=>{plate.rotation.x=Math.sin(t*.28)*.018;seal.rotation.x=t*.35;compat.rotation.z=-t*.025;chain.forEach((n,i)=>n.scale.setScalar(.94+Math.sin(t*1.8+i)*.045))});

  // One continuous path ribbon visually ties all stages together.
  const pathPts=[];for(let x=-8;x<72;x+=.55)pathPts.push(new THREE.Vector3(x,-3.75+Math.sin(x*.18)*.16,-.4));
  const ribbonCurve=new THREE.CatmullRomCurve3(pathPts);const ribbon=new THREE.Mesh(new THREE.TubeGeometry(ribbonCurve,210,.011,5,false),basic(COLORS.mint,.17));world.add(ribbon);

  // Camera choreography. Curve is intentionally asymmetric with stage-specific framing.
  const camPoints=mobileView ? [
    new THREE.Vector3(-6,3.8,12.8),new THREE.Vector3(3.5,2.8,10.5),new THREE.Vector3(10.6,1.7,7.5),new THREE.Vector3(21.2,3.1,10.8),new THREE.Vector3(34.2,2.9,10.6),new THREE.Vector3(47.1,2.7,10.5),new THREE.Vector3(60.2,3.1,11.6),new THREE.Vector3(65.5,3.7,13.2)
  ] : [
    new THREE.Vector3(-7,2.4,10),new THREE.Vector3(3,1.2,7.3),new THREE.Vector3(10.4,.3,4.3),new THREE.Vector3(20.5,1.1,7.4),new THREE.Vector3(33.7,.9,7.1),new THREE.Vector3(46.8,.7,7.2),new THREE.Vector3(60,1.1,8.4),new THREE.Vector3(66,1.5,9.8)
  ];
  const camCurve=new THREE.CatmullRomCurve3(camPoints,false,'catmullrom',.42);
  const targetCurve=new THREE.CatmullRomCurve3([
    new THREE.Vector3(0,0,0),new THREE.Vector3(11,0,0),new THREE.Vector3(24,0,0),new THREE.Vector3(37,0,0),new THREE.Vector3(50,0,0),new THREE.Vector3(64,0,0)
  ],false,'catmullrom',.32);

  function stageWeight(index,p){const centers=[.05,.22,.4,.58,.76,.95],width=.18;return Math.max(0,1-Math.abs(p-centers[index])/width)}
  function updateMorphs(p){
    // Instead of hard cuts, adjacent environments breathe in/out and geometry migrates toward the path.
    const groups=[risk,boundary,quality,guard,bus,evidence];
    groups.forEach((g,i)=>{const w=Math.min(1,.3+stageWeight(i,p)*.7);g.scale.setScalar(.84+w*.16);g.rotation.x=Math.sin((p-i*.16)*Math.PI)*.018*(1-w);g.position.y=(1-w)*.22*Math.sin(p*12+i)});
    gateUniforms.uProgress.value=stageWeight(1,p);
    const riskFade=Math.max(.25,1-p*1.3);riskShards.forEach(s=>s.material.opacity=.18+riskFade*.72);
    tenantBoundary.material.opacity=.02+stageWeight(4,p)*.065;
  }

  function activeIndexFromProgress(p){const bounds=[.14,.30,.48,.66,.84];let i=0;while(i<bounds.length&&p>bounds[i])i++;return i}
  function setChapter(i){if(i===lastChapter)return;lastChapter=i;const c=CHAPTERS[i];chapters.forEach(el=>el.classList.toggle('is-active',el.dataset.tourChapter===c.name));if(hudState)hudState.textContent=c.label;if(hudStep)hudStep.textContent=String(i).padStart(2,'0')+' / 05';if(mapState)mapState.textContent=c.label;mapDots.forEach((d,j)=>d.classList.toggle('active',j<=i));if(depthLabel)depthLabel.textContent=c.label;if(colorwash)colorwash.style.background=`radial-gradient(circle at 50% 48%,${c.color}10,transparent 34%)`;hotspots.forEach(h=>h.classList.remove('visible'));if(experience.inspect){const mapping=[['risk-core'],[],['quality-artifact'],['guard-capability'],['bus-packet'],['audit-seal']][i];mapping.forEach(k=>document.querySelector(`[data-hotspot="${k}"]`)?.classList.add('visible'))}dispatchEvent(new CustomEvent('aifence:chapter',{detail:c}));}

  function projectHotspots(){
    const visible = experience.inspect;
    hotspots.forEach(el=>{const anchor=hotspotAnchors[el.dataset.hotspot];if(!anchor||!visible){el.classList.remove('visible');return}let parent=anchor;const p=new THREE.Vector3();anchor.getWorldPosition(p);p.project(camera);if(p.z>1){el.classList.remove('visible');return}const x=(p.x*.5+.5)*innerWidth,y=(-p.y*.5+.5)*innerHeight;el.style.left=x+'px';el.style.top=y+'px';if(Math.abs(p.x)<1.05&&Math.abs(p.y)<1.05)el.classList.add('visible');else el.classList.remove('visible')});
  }

  function updateScroll(){const r=shell.getBoundingClientRect();const max=shell.offsetHeight-innerHeight;scrollProgress=THREE.MathUtils.clamp(-r.top/max,0,1);if(hudProgress)hudProgress.style.width=(scrollProgress*100).toFixed(1)+'%'}
  addEventListener('scroll',updateScroll,{passive:true});updateScroll();
  addEventListener('pointermove',e=>{pointerX=e.clientX/innerWidth-.5;pointerY=e.clientY/innerHeight-.5},{passive:true});
  addEventListener('touchmove',e=>{if(!e.touches[0])return;touchX=e.touches[0].clientX/innerWidth-.5;touchY=e.touches[0].clientY/innerHeight-.5},{passive:true});

  function render(){
    const dt=Math.min(.05,clock.getDelta()),t=clock.elapsedTime;smoothProgress=THREE.MathUtils.damp(smoothProgress,scrollProgress,5.2,dt);
    // Ease progress near scene centers to make reveals feel authored, not linearly scrubbed.
    const eased=smoothProgress<.5?2*smoothProgress*smoothProgress:1-Math.pow(-2*smoothProgress+2,2)/2;
    const cp=camCurve.getPoint(eased),tp=targetCurve.getPoint(Math.min(.999,THREE.MathUtils.smoothstep(smoothProgress,0,1)));
    const px=(pointerX+touchX*.45),py=(pointerY+touchY*.45);
    camera.position.lerp(new THREE.Vector3(cp.x,cp.y-py*.36,cp.z+px*.4),.085);
    camera.lookAt(tp.x,tp.y+py*.2,tp.z);
    camera.rotation.z += (Math.sin(smoothProgress*Math.PI*5)*.018 + px*.008 - camera.rotation.z)*.03;
    stars.position.x=-smoothProgress*2.2;stars.rotation.x=t*.003;
    animated.forEach(fn=>fn(t,smoothProgress));gateUniforms.uTime.value=t;updateMorphs(smoothProgress);
    // semantic field flows along X as the governed request progresses.
    if(!degraded){particleSeeds.forEach((s,i)=>{const x=s.x+Math.sin(t*.08+s.p)*.05;dummy.position.set(x,s.y+Math.sin(t*.3+s.p)*.025,s.z);dummy.rotation.set(t*.05+s.p,t*.06,0);dummy.scale.setScalar(s.s*(.7+.3*Math.sin(t*.4+s.p)));dummy.updateMatrix();particleField.setMatrixAt(i,dummy.matrix)});particleField.instanceMatrix.needsUpdate=true}
    setChapter(activeIndexFromProgress(smoothProgress));projectHotspots();
    composer.render();
    // Frame-time adaptation: degrade postprocessing and semantic particle updates if sustained <~42fps.
    frameSamples.push(dt);if(frameSamples.length>120)frameSamples.shift();if(frameSamples.length===120){const avg=frameSamples.reduce((a,b)=>a+b,0)/frameSamples.length;if(avg>.024)lowPerfFrames++;else lowPerfFrames=Math.max(0,lowPerfFrames-1);if(lowPerfFrames>40&&!degraded){degraded=true;bloom.strength=Math.min(bloom.strength,.25);particleField.count=Math.min(particleField.count,160);renderer.setPixelRatio(Math.min(renderer.getPixelRatio(),1.0));renderer.setSize(innerWidth,innerHeight,false);if(gpuTierEl)gpuTierEl.textContent=tier+'→ECO'}}
    requestAnimationFrame(render);
  }
  render();
  addEventListener('resize',()=>{camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setPixelRatio(Math.min(devicePixelRatio,dprCap));renderer.setSize(innerWidth,innerHeight);composer.setSize(innerWidth,innerHeight);bloom.setSize(innerWidth,innerHeight)},{passive:true});
}
