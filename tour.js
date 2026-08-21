import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';

const host=document.getElementById('tourWebgl'), shell=document.getElementById('tour'), stage=document.getElementById('tourStage');
if(!host||!shell||!stage){}else{
  try{
    const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
    const coarse=matchMedia('(pointer:coarse)').matches;
    const cores=navigator.hardwareConcurrency||4, mem=navigator.deviceMemory||4;
    let tier=(coarse||cores<=4||mem<=4)?'LOW':(cores>=10&&mem>=8?'HIGH':'MED');
    const tierEl=document.getElementById('gpuTier');if(tierEl)tierEl.textContent=tier;
    const scene=new THREE.Scene();scene.background=new THREE.Color(0xf7f8fb);scene.fog=new THREE.FogExp2(0xf7f8fb,tier==='LOW'?.018:.012);
    const camera=new THREE.PerspectiveCamera(45,innerWidth/innerHeight,.1,260);camera.position.set(0,2.5,14);
    const renderer=new THREE.WebGLRenderer({antialias:tier!=='LOW',alpha:false,powerPreference:'high-performance'});renderer.setPixelRatio(Math.min(devicePixelRatio,tier==='HIGH'?1.8:1.35));renderer.setSize(innerWidth,innerHeight);renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.03;host.appendChild(renderer.domElement);
    let composer=null;if(tier==='HIGH'&&!reduced){composer=new EffectComposer(renderer);composer.addPass(new RenderPass(scene,camera));const bloom=new UnrealBloomPass(new THREE.Vector2(innerWidth,innerHeight),.36,.62,.72);composer.addPass(bloom)}
    const hemi=new THREE.HemisphereLight(0xffffff,0x1a2025,2.1);scene.add(hemi);const key=new THREE.DirectionalLight(0xffffff,2.8);key.position.set(8,12,10);scene.add(key);const signalLight=new THREE.PointLight(0x7789ff,6.5,34,2);signalLight.position.set(0,2,-17);scene.add(signalLight);

    const mat=(color,metal=.18,rough=.64)=>new THREE.MeshStandardMaterial({color,metalness:metal,roughness:rough});
    const signalMat=new THREE.MeshStandardMaterial({color:0x697bff,emissive:0x586aff,emissiveIntensity:1.05,metalness:.28,roughness:.3});
    const fieldMat=new THREE.MeshPhysicalMaterial({color:0x8192ff,emissive:0x596bff,emissiveIntensity:.72,metalness:.08,roughness:.18,transmission:.28,transparent:true,opacity:.58,side:THREE.DoubleSide});
    const darkMat=mat(0x111722,.76,.31), steelMat=mat(0x465266,.72,.3), whiteMat=mat(0xe9edf4,.12,.72), greenMat=new THREE.MeshStandardMaterial({color:0x18896b,emissive:0x18896b,emissiveIntensity:.78,metalness:.18,roughness:.42});
    const lineSignal=new THREE.LineBasicMaterial({color:0x7183ff,transparent:true,opacity:.62}), lineDark=new THREE.LineBasicMaterial({color:0x31363a,transparent:true,opacity:.42}), lineLight=new THREE.LineBasicMaterial({color:0x747c7f,transparent:true,opacity:.28});
    const groups={};['risk','boundary','quality','guard','bus','evidence'].forEach(n=>{groups[n]=new THREE.Group();scene.add(groups[n])});

    // 00 uncontrolled agent field
    groups.risk.position.z=0;
    const riskCount=tier==='HIGH'?150:tier==='MED'?95:52;const geom=new THREE.IcosahedronGeometry(.12,0);const inst=new THREE.InstancedMesh(geom,darkMat,riskCount);const dummy=new THREE.Object3D(), riskPositions=[];
    for(let i=0;i<riskCount;i++){const a=Math.random()*Math.PI*2,r=2.3+Math.random()*8.7,y=(Math.random()-.5)*8.5,z=(Math.random()-.5)*9;riskPositions.push(new THREE.Vector3(Math.cos(a)*r,y,z));dummy.position.copy(riskPositions[i]);dummy.scale.setScalar(.55+Math.random()*1.8);dummy.updateMatrix();inst.setMatrixAt(i,dummy.matrix)}groups.risk.add(inst);
    const linePoints=[];for(let i=0;i<Math.min(70,riskPositions.length-1);i++){linePoints.push(riskPositions[i],riskPositions[(i*7+13)%riskPositions.length])}const riskLines=new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints(linePoints),lineLight);groups.risk.add(riskLines);
    const intent=new THREE.Mesh(new THREE.OctahedronGeometry(.72,0),signalMat);intent.position.set(0,.4,-1.8);groups.risk.add(intent);

    // 01 monumental boundary
    groups.boundary.position.z=-20;const fenceFrame=new THREE.Group();groups.boundary.add(fenceFrame);const postGeo=new THREE.BoxGeometry(.38,14,.75);[-8,8].forEach(x=>{const p=new THREE.Mesh(postGeo,darkMat);p.position.x=x;fenceFrame.add(p)});const lintel=new THREE.Mesh(new THREE.BoxGeometry(16.4,.38,.75),darkMat);lintel.position.y=7;fenceFrame.add(lintel);const base=new THREE.Mesh(new THREE.BoxGeometry(16.4,.28,.75),darkMat);base.position.y=-7;fenceFrame.add(base);const membrane=new THREE.Mesh(new THREE.BoxGeometry(.045,13.5,13.5),fieldMat);membrane.rotation.y=Math.PI/2;membrane.position.z=.05;groups.boundary.add(membrane);const boundaryWord=makeWordBars('AIFENCE',groups.boundary,-.6);

    // 02 Quality chamber
    groups.quality.position.z=-40;const floor=new THREE.Mesh(new THREE.BoxGeometry(16,.18,16),whiteMat);floor.position.y=-4.7;groups.quality.add(floor);const ceil=floor.clone();ceil.position.y=4.7;groups.quality.add(ceil);for(const x of [-6.5,6.5])for(const z of [-5,0,5]){const pillar=new THREE.Mesh(new THREE.BoxGeometry(.28,9.2,.28),steelMat);pillar.position.set(x,0,z);groups.quality.add(pillar)}
    const artifact=new THREE.Mesh(new THREE.BoxGeometry(4.6,5.6,.2),new THREE.MeshStandardMaterial({color:0xffffff,metalness:.03,roughness:.9}));artifact.position.set(0,.1,0);groups.quality.add(artifact);const scan=new THREE.Mesh(new THREE.BoxGeometry(5.7,.035,1.1),signalMat);scan.position.set(0,2.7,.2);groups.quality.add(scan);for(let i=0;i<6;i++){const bar=new THREE.Mesh(new THREE.BoxGeometry(2.5+Math.random()*1.3,.08,.05),darkMat);bar.position.set(-.25,1.6-i*.62,.14);groups.quality.add(bar)}const qualitySeal=new THREE.Mesh(new THREE.TorusGeometry(.72,.07,10,48),greenMat);qualitySeal.position.set(3.6,-2.6,.8);groups.quality.add(qualitySeal);

    // 03 Guard vault and exact-action corridor
    groups.guard.position.z=-60;for(const x of [-5.4,5.4]){const wall=new THREE.Mesh(new THREE.BoxGeometry(5.1,10.6,1.2),darkMat);wall.position.set(x,0,0);groups.guard.add(wall)}const gateL=new THREE.Mesh(new THREE.BoxGeometry(4.2,8.2,.55),steelMat),gateR=gateL.clone();gateL.position.set(-2.12,0,.7);gateR.position.set(2.12,0,.7);groups.guard.add(gateL,gateR);groups.guard.userData.gateL=gateL;groups.guard.userData.gateR=gateR;
    const capPath=new THREE.Mesh(new THREE.BoxGeometry(1.25,.08,16),signalMat);capPath.position.set(0,-3.2,-7);groups.guard.add(capPath);for(let i=0;i<8;i++){const r=new THREE.Mesh(new THREE.TorusGeometry(2.2+i*.08,.025,6,64),i===7?signalMat:steelMat);r.rotation.x=Math.PI/2;r.position.z=-i*.8+2.4;groups.guard.add(r)}const capToken=new THREE.Mesh(new THREE.DodecahedronGeometry(.48,0),signalMat);capToken.position.set(0,-3.05,-1.8);groups.guard.add(capToken);

    // 04 Bus lanes: three tenant corridors and moving packets
    groups.bus.position.z=-80;const lanes=[];for(let i=-1;i<=1;i++){const y=i*2.45;const lane=new THREE.Group();for(const x of [-4.2,4.2]){const rail=new THREE.Mesh(new THREE.BoxGeometry(.08,.08,22),i===0?signalMat:steelMat);rail.position.set(x,y,-5);lane.add(rail)}const cross=new THREE.Mesh(new THREE.BoxGeometry(8.4,.035,22),new THREE.MeshStandardMaterial({color:i===0?0x191b1e:0x25292d,metalness:.7,roughness:.45,transparent:true,opacity:.55}));cross.position.set(0,y-.12,-5);lane.add(cross);groups.bus.add(lane);lanes.push(lane)}
    const packets=[];for(let i=0;i<(tier==='LOW'?5:10);i++){const p=new THREE.Mesh(new THREE.BoxGeometry(.35,.35,.35),i%3===0?signalMat:greenMat);p.position.set((i%2?2:-2),0,-i*1.7);groups.bus.add(p);packets.push(p)}const tenantWall=new THREE.Mesh(new THREE.BoxGeometry(.05,8,22),new THREE.MeshStandardMaterial({color:0x7183ff,emissive:0x5366ff,emissiveIntensity:.45,transparent:true,opacity:.18}));tenantWall.position.set(0,0,-5);tenantWall.rotation.z=Math.PI/2;groups.bus.add(tenantWall);

    // 05 Evidence room
    groups.evidence.position.z=-102;const roomFloor=new THREE.Mesh(new THREE.BoxGeometry(18,.15,18),whiteMat);roomFloor.position.y=-4.4;groups.evidence.add(roomFloor);const plinth=new THREE.Mesh(new THREE.BoxGeometry(6.5,.8,3.3),whiteMat);plinth.position.y=-3.7;groups.evidence.add(plinth);const receipt=new THREE.Mesh(new THREE.BoxGeometry(7.5,4.8,.18),new THREE.MeshStandardMaterial({color:0xfafbfd,metalness:.02,roughness:.84}));receipt.position.set(0,.15,-.2);groups.evidence.add(receipt);const seal=new THREE.Mesh(new THREE.TorusKnotGeometry(.8,.12,90,10),greenMat);seal.position.set(2.9,-1.45,.65);seal.scale.setScalar(.5);groups.evidence.add(seal);for(let i=0;i<4;i++){const line=new THREE.Mesh(new THREE.BoxGeometry(4.5-i*.25,.06,.04),darkMat);line.position.set(-.65,1.5-i*.62,.03);groups.evidence.add(line)}
    // hash-chain objects retreat behind receipt
    for(let i=0;i<8;i++){const node=new THREE.Mesh(new THREE.BoxGeometry(.35,.35,.35),i===7?greenMat:steelMat);node.position.set(-5.5+i*1.5,-2.55,-2.3-i*.15);groups.evidence.add(node);if(i){const pts=[new THREE.Vector3(-5.5+(i-1)*1.5,-2.55,-2.3-(i-1)*.15),new THREE.Vector3(-5.5+i*1.5,-2.55,-2.3-i*.15)];groups.evidence.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts),lineDark))}}

    function makeWordBars(word,parent,y){const g=new THREE.Group(), total=word.length;for(let i=0;i<total;i++){const b=new THREE.Mesh(new THREE.BoxGeometry(.15,1.4,.15),i===2?signalMat:darkMat);b.position.set((i-(total-1)/2)*.5,y,1);g.add(b)}parent.add(g);return g}

    const chapters=['risk','boundary','quality','guard','bus','evidence'];const desc={risk:'Uncontrolled agent intent.',boundary:'The governed boundary.',quality:'Quality admission inspection.',guard:'Fail-closed Guard authorization.',bus:'Tenant-scoped durable handoff.',evidence:'Signed completion evidence.'};let current='risk',progress=0,targetProgress=0;
    const camPos=[new THREE.Vector3(0,2.3,14),new THREE.Vector3(-1.5,1.2,-8),new THREE.Vector3(6.8,1.4,-29),new THREE.Vector3(-6.4,.8,-49),new THREE.Vector3(7.2,1,-69),new THREE.Vector3(0,.9,-92)];
    const camLook=[new THREE.Vector3(0,0,-1.5),new THREE.Vector3(0,0,-20),new THREE.Vector3(0,0,-40),new THREE.Vector3(0,0,-60),new THREE.Vector3(0,0,-82),new THREE.Vector3(0,0,-102)];
    const mouse=new THREE.Vector2();addEventListener('pointermove',e=>{mouse.x=(e.clientX/innerWidth-.5)*2;mouse.y=(e.clientY/innerHeight-.5)*2},{passive:true});
    function scrollProgress(){const max=shell.offsetHeight-innerHeight;targetProgress=THREE.MathUtils.clamp((scrollY-shell.offsetTop)/Math.max(1,max),0,1)}addEventListener('scroll',scrollProgress,{passive:true});scrollProgress();
    function chapterFrom(p){return chapters[Math.min(5,Math.floor(p*6))]}
    function updateChapter(name){if(name===current)return;current=name;document.querySelectorAll('[data-tour-chapter]').forEach(el=>el.classList.toggle('is-active',el.dataset.tourChapter===name));const i=chapters.indexOf(name);const stateEl=document.getElementById('hudState'),stepEl=document.getElementById('hudStep');if(stateEl)stateEl.textContent={risk:'UNCONTROLLED',boundary:'BOUNDARY',quality:'QUALITY',guard:'GUARD',bus:'BUS',evidence:'EVIDENCE'}[name];if(stepEl)stepEl.textContent=String(i).padStart(2,'0')+' / 05';const dark=name==='guard'||name==='bus';stage.dataset.tone=dark?'dark':'light';document.getElementById('siteHeader')?.classList.toggle('on-dark',dark);window.dispatchEvent(new CustomEvent('aifence:chapter',{detail:{name,description:desc[name]}}))}
    // hotspot anchor mapping
    const anchors={'risk-core':intent,'quality-artifact':artifact,'guard-capability':capToken,'bus-packet':packets[0],'audit-seal':seal};const hotspotEls={};document.querySelectorAll('.hotspot').forEach(h=>hotspotEls[h.dataset.hotspot]=h);
    function projectHotspots(){for(const [name,obj] of Object.entries(anchors)){const el=hotspotEls[name];if(!el)continue;const p=new THREE.Vector3();obj.getWorldPosition(p);p.project(camera);const visible=Math.abs(p.z)<1&&p.x>-1&&p.x<1&&p.y>-1&&p.y<1;el.style.display=visible?'block':'none';if(visible){el.style.left=(p.x*.5+.5)*innerWidth+'px';el.style.top=(-p.y*.5+.5)*innerHeight+'px'}}}
    let last=performance.now(),fpsWindow=[];
    function animate(now){requestAnimationFrame(animate);const dt=Math.min(.05,(now-last)/1000);last=now;progress+= (targetProgress-progress)*Math.min(1,dt*5.5);const scaled=progress*5,idx=Math.min(4,Math.floor(scaled)),t=scaled-idx,s=t*t*(3-2*t);camera.position.lerpVectors(camPos[idx],camPos[idx+1],s);const look=new THREE.Vector3().lerpVectors(camLook[idx],camLook[idx+1],s);if(!reduced){camera.position.x+=mouse.x*(coarse?.04:.18);camera.position.y+=-mouse.y*(coarse?.03:.12)}camera.lookAt(look);updateChapter(chapterFrom(progress));const prog=document.getElementById('hudProgress');if(prog)prog.style.width=(progress*100).toFixed(2)+'%';
      // environment transforms
      const time=now*.001;intent.rotation.x=time*.65;intent.rotation.y=time*.8;riskLines.rotation.y=time*.025;membrane.material.emissiveIntensity=2.0+Math.sin(time*3)*.6;scan.position.y=2.7-((time*.8)%1)*5.4;qualitySeal.rotation.z=time*.8;capToken.rotation.x=time;capToken.rotation.y=time*.7;const guardPhase=THREE.MathUtils.smoothstep(progress,.52,.69);gateL.position.x=-2.12-guardPhase*1.45;gateR.position.x=2.12+guardPhase*1.45;packets.forEach((p,i)=>{p.position.z=-((time*2.1+i*2.2)%20)+4;p.position.y=Math.sin(time*1.3+i)*.08});seal.rotation.x=time*.4;seal.rotation.y=time*.55;projectHotspots();
      // background/fog crossfade by current spatial zone
      const dark=(current==='guard'||current==='bus');const bg=new THREE.Color(dark?0x080b11:0xf7f8fb);scene.background.lerp(bg,.055);scene.fog.color.lerp(bg,.055);hemi.intensity=dark?1.15:2.1;key.intensity=dark?1.7:2.8;
      if(composer)composer.render();else renderer.render(scene,camera);
      // adaptive degradation
      fpsWindow.push(1/Math.max(dt,.001));if(fpsWindow.length>120){const avg=fpsWindow.reduce((a,b)=>a+b,0)/fpsWindow.length;fpsWindow=[];if(avg<38&&tier==='HIGH'){tier='MED';composer=null;renderer.setPixelRatio(Math.min(devicePixelRatio,1.35));if(tierEl)tierEl.textContent='MED AUTO'}}
    }
    requestAnimationFrame(animate);
    addEventListener('resize',()=>{camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight);composer?.setSize(innerWidth,innerHeight);renderer.setPixelRatio(Math.min(devicePixelRatio,tier==='HIGH'?1.8:1.35))});
  }catch(err){console.warn('AIFENCE WebGL fallback:',err);document.body.classList.add('webgl-failed');const tierEl=document.getElementById('gpuTier');if(tierEl)tierEl.textContent='FALLBACK'}
}
