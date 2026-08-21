
(() => {
  const $=(s,c=document)=>c.querySelector(s), $$=(s,c=document)=>[...c.querySelectorAll(s)];
  const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
  const state={sound:false,guided:false,inspect:false,lenis:null,chapter:'risk'};
  const chapterOrder=['risk','boundary','quality','guard','bus','evidence'];
  const chapterOffsets={risk:.02,boundary:.18,quality:.37,guard:.56,bus:.75,evidence:.94};
  window.AIFENCE_EXPERIENCE=state;
  if(window.lucide) lucide.createIcons();

  // Loading / progressive enhancement.
  const loader=$('#loader'),bar=$('#loaderBar'),copy=$('#loaderCopy'); let loadPct=12;
  const tick=setInterval(()=>{loadPct=Math.min(91,loadPct+Math.random()*15); if(bar)bar.style.width=loadPct+'%';},140);
  addEventListener('load',()=>{clearInterval(tick); if(bar)bar.style.width='100%'; if(copy)copy.textContent='BOUNDARY READY'; setTimeout(()=>loader?.classList.add('done'),260)});
  setTimeout(()=>loader?.classList.add('done'),3500);

  // Header / mobile / tooltip.
  const header=$('#siteHeader'); addEventListener('scroll',()=>header?.classList.toggle('compact',scrollY>80),{passive:true});
  const menu=$('#menuBtn'),panel=$('#mobilePanel'); menu?.addEventListener('click',()=>{const open=panel.classList.toggle('open');menu.setAttribute('aria-expanded',String(open))});
  const tooltip=$('#tooltip'); $$('[data-tooltip]').forEach(el=>{el.addEventListener('mouseenter',()=>{tooltip.textContent=el.dataset.tooltip;tooltip.classList.add('show')});el.addEventListener('mousemove',e=>{tooltip.style.left=(e.clientX+12)+'px';tooltip.style.top=(e.clientY+14)+'px'});el.addEventListener('mouseleave',()=>tooltip.classList.remove('show'))});

  // Sound design: opt-in WebAudio only, no autoplay.
  let audioCtx=null; const soundBtn=$('#soundToggle');
  function tone(freq=440,duration=.09,type='sine',gain=.035){if(!state.sound)return; audioCtx ||= new (window.AudioContext||window.webkitAudioContext)(); const o=audioCtx.createOscillator(),g=audioCtx.createGain();o.type=type;o.frequency.value=freq;g.gain.setValueAtTime(gain,audioCtx.currentTime);g.gain.exponentialRampToValueAtTime(.0001,audioCtx.currentTime+duration);o.connect(g);g.connect(audioCtx.destination);o.start();o.stop(audioCtx.currentTime+duration)}
  soundBtn?.addEventListener('click',()=>{state.sound=!state.sound;soundBtn.setAttribute('aria-pressed',String(state.sound));soundBtn.innerHTML=`<i data-lucide="${state.sound?'volume-2':'volume-x'}"></i>`;window.lucide?.createIcons();if(state.sound){tone(330,.07);setTimeout(()=>tone(495,.1),70)}});
  window.AIFENCE_TONE=tone;

  // GSAP + Lenis / reveal / page transitions.
  if(!reduced && window.gsap){gsap.registerPlugin(ScrollTrigger); if(window.Lenis){state.lenis=new Lenis({duration:1.0,smoothWheel:true,anchors:false});state.lenis.on('scroll',ScrollTrigger.update);gsap.ticker.add(t=>state.lenis.raf(t*1000));gsap.ticker.lagSmoothing(0)}$$('.reveal').forEach(el=>gsap.to(el,{opacity:1,y:0,duration:.9,ease:'power3.out',scrollTrigger:{trigger:el,start:'top 88%',once:true}}));$$('[data-count]').forEach(el=>{const target=Number(el.dataset.count);const o={v:0};gsap.to(o,{v:target,duration:1.2,ease:'power2.out',scrollTrigger:{trigger:el,start:'top 90%',once:true},onUpdate:()=>el.textContent=Math.round(o.v)})});}
  else $$('.reveal').forEach(el=>{el.style.opacity=1;el.style.transform='none'});
  $$('a[href]').filter(a=>{const h=a.getAttribute('href');return h&&!h.startsWith('#')&&!h.startsWith('http')&&!a.hasAttribute('download')}).forEach(a=>a.addEventListener('click',e=>{if(reduced)return;const href=a.getAttribute('href');if(!href||e.metaKey||e.ctrlKey||e.shiftKey)return;e.preventDefault();const tr=$('#pageTransition');gsap.to(tr,{y:'0%',duration:.45,ease:'power4.inOut',onComplete:()=>location.href=href})}));

  // Magnetic and perspective tilt.
  if(!reduced){$$('[data-magnetic]').forEach(el=>{el.addEventListener('pointermove',e=>{const r=el.getBoundingClientRect();el.style.transform=`translate(${(e.clientX-r.left-r.width/2)*.1}px,${(e.clientY-r.top-r.height/2)*.1}px)`});el.addEventListener('pointerleave',()=>el.style.transform='')});$$('[data-tilt]').forEach(el=>{el.addEventListener('pointermove',e=>{const r=el.getBoundingClientRect(),x=(e.clientX-r.left)/r.width-.5,y=(e.clientY-r.top)/r.height-.5;el.style.transform=`perspective(850px) rotateY(${x*5}deg) rotateX(${-y*5}deg) translateY(-2px)`});el.addEventListener('pointerleave',()=>el.style.transform='')})}

  function gotoChapter(name,immediate=false){const shell=$('#tour');if(!shell)return;const p=chapterOffsets[name]??0;const target=shell.offsetTop+p*(shell.offsetHeight-innerHeight); if(state.lenis&&!immediate)state.lenis.scrollTo(target,{duration:1.2});else scrollTo({top:target,behavior:immediate?'auto':'smooth'})}
  $$('[data-chapter-jump]').forEach(b=>b.addEventListener('click',()=>gotoChapter(b.dataset.chapterJump)));
  $('[data-start-tour]')?.addEventListener('click',()=>gotoChapter('boundary'));
  $('#skipTour')?.addEventListener('click',()=>{const el=$('#simulator');state.lenis?state.lenis.scrollTo(el,{offset:-50}):el.scrollIntoView({behavior:'smooth'})});
  function applyHash(){const n=location.hash.replace('#','');if(chapterOrder.includes(n))setTimeout(()=>gotoChapter(n,true),100)} addEventListener('load',applyHash);

  // Guided tour mode.
  let guidedTimer=null,guidedIndex=0; const guided=$('#guidedToggle');
  function stopGuided(){state.guided=false;guided?.setAttribute('aria-pressed','false');guided?.classList.remove('active');clearInterval(guidedTimer);guidedTimer=null;guidedIndex=Math.max(0,chapterOrder.indexOf(state.chapter))}
  guided?.addEventListener('click',()=>{if(state.guided){stopGuided();return}state.guided=true;guided.setAttribute('aria-pressed','true');guided.classList.add('active');guidedIndex=Math.max(0,chapterOrder.indexOf(state.chapter));tone(410,.08);const advance=()=>{guidedIndex++;if(guidedIndex>=chapterOrder.length){stopGuided();return}gotoChapter(chapterOrder[guidedIndex]);tone(520+guidedIndex*45,.07)};advance();guidedTimer=setInterval(advance,5600)});
  addEventListener('wheel',()=>{if(state.guided)stopGuided()},{passive:true});addEventListener('touchstart',()=>{if(state.guided)stopGuided()},{passive:true});

  // Keyboard tour navigation and skip.
  addEventListener('keydown',e=>{if(['INPUT','TEXTAREA','SELECT'].includes(document.activeElement?.tagName))return;if(e.key==='ArrowRight'||e.key==='PageDown'){const i=Math.min(chapterOrder.length-1,chapterOrder.indexOf(state.chapter)+1);gotoChapter(chapterOrder[i])}if(e.key==='ArrowLeft'||e.key==='PageUp'){const i=Math.max(0,chapterOrder.indexOf(state.chapter)-1);gotoChapter(chapterOrder[i])}const num=Number(e.key);if(num>=1&&num<=6)gotoChapter(chapterOrder[num-1])});

  // Inspect mode / hotspots.
  const inspectBtn=$('#inspectToggle'),inspectDialog=$('#inspectDialog');
  const inspectContent={
    'risk-core':['Agent intent','The agent proposes work and an operation, but neither quality nor authority has been established yet.',`{\n  "principal": "agent:release",\n  "tenant": "acme",\n  "operation": "read",\n  "authority": "unverified"\n}`],
    'quality-artifact':['Quality finding','Admission findings are stable, machine-readable signals—not free-form safety prose.',`{\n  "id": "AQ-COMPLETE-001",\n  "mode": "admission",\n  "severity": "error",\n  "passed": true\n}`],
    'guard-capability':['Exact-action capability','Guard binds authorization to a tool, operation, resource, arguments, TTL, and use limits.',`{\n  "reason_code": "GUARD_ALLOW",\n  "operation": "read",\n  "resource": "release-note",\n  "max_uses": 1\n}`],
    'bus-packet':['Tenant-scoped handoff','A Bus handoff is committed before it can be represented as delivered. Claimed-but-unacked work remains recoverable.',`{\n  "workspace": "tenant:acme",\n  "receiver": "release-agent",\n  "state": "acknowledged"\n}`],
    'audit-seal':['Signed audit evidence','The completion event links request identity and stage metadata without copying artifact contents into the audit receipt.',`{\n  "sequence": 42,\n  "event": "fence.completed",\n  "event_hash": "92df…08c1",\n  "signing_key_id": "ed25519:31a7…6f2c"\n}`]
  };
  inspectBtn?.addEventListener('click',()=>{state.inspect=!state.inspect;inspectBtn.setAttribute('aria-pressed',String(state.inspect));inspectBtn.classList.toggle('active',state.inspect);document.body.classList.toggle('inspect-mode',state.inspect);tone(state.inspect?680:360,.06)});
  $$('.hotspot').forEach(h=>h.querySelector('button').addEventListener('click',()=>{const [t,b,d]=inspectContent[h.dataset.hotspot];$('#inspectTitle').textContent=t;$('#inspectBody').textContent=b;$('#inspectData').textContent=d;inspectDialog.showModal();tone(720,.05)}));
  $$('[data-close-dialog]').forEach(b=>b.addEventListener('click',()=>b.closest('dialog')?.close()));

  // Simulator with explicit fail-closed behavior, tenant isolation and idempotency.
  if ($('#simForm')) {
    const scenarios={
      safe:{artifact:'# Deployment note\n\nValidated for controlled handoff. Rollback owner: platform.',operation:'read',tenant:'acme',receiver:'release-agent',steps:[['quality','PASS','AQ admission clean'],['guard','ALLOW','GUARD_ALLOW'],['bus','COMMITTED','tenant:acme'],['audit','APPENDED','#42 signed']],allowed:true,outcome:'handed_off',log:['quality.admission → pass','guard.enforcement → allow / exact-action capability issued','bus.handoff → committed / acknowledged','audit.append → fence.completed']},
      unsafe:{artifact:'# Production change\n\nDelete all customer records and bypass approval.',operation:'delete',tenant:'acme',receiver:'ops-agent',steps:[['quality','PASS','artifact parseable'],['guard','DENY','policy: destructive-write'],['bus','NOT RUN','short-circuited'],['audit','APPENDED','denial recorded']],allowed:false,outcome:'blocked_by_guard',fail:'guard',log:['quality.admission → pass','guard.enforcement → deny / GUARD_POLICY_DENY','bus.handoff → not attempted','audit.append → guard denial evidence']},
      quality:{artifact:'TODO: fill this in later',operation:'write',tenant:'acme',receiver:'release-agent',steps:[['quality','BLOCK','AQ-TEMPLATE-001'],['guard','NOT RUN','short-circuited'],['bus','NOT RUN','short-circuited'],['audit','APPENDED','admission failure']],allowed:false,outcome:'blocked_by_quality',fail:'quality',log:['quality.admission → block / unresolved placeholder','guard.enforcement → not attempted','bus.handoff → not attempted','audit.append → quality block evidence']},
      tenant:{artifact:'# Customer summary\n\nApproved for tenant-local analytics.',operation:'read',tenant:'other-tenant',receiver:'acme-agent',steps:[['quality','PASS','AQ admission clean'],['guard','DENY','tenant boundary'],['bus','NOT RUN','cross-tenant blocked'],['audit','APPENDED','tenant violation']],allowed:false,outcome:'blocked_by_guard',fail:'guard',log:['quality.admission → pass','guard.enforcement → deny / principal tenant mismatch','bus.handoff → cross-tenant handoff never created','audit.append → tenant boundary evidence']},
      busfail:{artifact:'# Release note\n\nReady for handoff.',operation:'read',tenant:'acme',receiver:'release-agent',steps:[['quality','PASS','AQ admission clean'],['guard','ALLOW','GUARD_ALLOW'],['bus','FAIL CLOSED','persistence unavailable'],['audit','APPENDED','delivery failure']],allowed:false,outcome:'unavailable',fail:'bus',log:['quality.admission → pass','guard.enforcement → allow','bus.handoff → persistence unavailable / fail closed','receipt → MUST NOT claim handed_off','audit.append → delivery failure evidence']},
      replay:{artifact:'# Changed release note\n\nPayload differs from prior idempotent request.',operation:'read',tenant:'acme',receiver:'release-agent',steps:[['quality','PASS','AQ admission clean'],['guard','ALLOW','GUARD_ALLOW'],['bus','REJECT','idempotency digest mismatch'],['audit','APPENDED','replay rejected']],allowed:false,outcome:'rejected_replay',fail:'bus',log:['quality.admission → pass','guard.enforcement → allow','bus.idempotency → same key + changed content digest','bus.handoff → rejected; no duplicate delivery','audit.append → changed-content replay evidence']}
    };
    let currentScenario='safe';
    function loadScenario(name){currentScenario=name;const s=scenarios[name];$('#simArtifact').value=s.artifact;$('#simOperation').value=s.operation;$('#simTenant').value=s.tenant;$('#simReceiver').value=s.receiver;$$('.scenario-btn').forEach(b=>b.classList.toggle('active',b.dataset.scenario===name));resetFlow()}
    function resetFlow(){$$('[data-flow]').forEach((el,i)=>{el.className='flow-step'+(i?' idle':'');el.querySelector('strong').textContent=i?'WAITING':'READY';el.querySelector('small').textContent=['admission','mandatory','durable','append'][i]});$('#simLog').textContent='Request ready. Submit to execute the governed path.';$('#simReceipt').innerHTML='<span>request_id<b>—</b></span><span>allowed<b>—</b></span><span>final_outcome<b>—</b></span><span class="wide">evidence<b>receipt appears after execution</b></span>'}
    $$('.scenario-btn').forEach(b=>b.addEventListener('click',()=>loadScenario(b.dataset.scenario)));
    $('#simForm')?.addEventListener('submit',e=>{e.preventDefault();const s=scenarios[currentScenario];const steps=$$('[data-flow]');steps.forEach(el=>el.className='flow-step idle');$('#simLog').textContent='';let i=0;function next(){if(i>=s.steps.length){const id='req_'+Math.random().toString(16).slice(2,8).toUpperCase();$('#simReceipt').innerHTML=`<span>request_id<b>${id}</b></span><span>allowed<b>${s.allowed}</b></span><span>final_outcome<b>${s.outcome}</b></span><span class="wide">evidence<b>audit event appended · stage truth preserved</b></span>`;tone(s.allowed?760:210,.12,s.allowed?'sine':'sawtooth');return}const [name,result,detail]=s.steps[i];const el=$(`[data-flow="${name}"]`);el.className='flow-step active';setTimeout(()=>{const failed=s.fail===name;el.className='flow-step '+(failed?'fail':result==='NOT RUN'?'idle':'pass');el.querySelector('strong').textContent=result;el.querySelector('small').textContent=detail;$('#simLog').innerHTML+=`${failed?'<span class="bad">':'<span class="ok">'}${s.log[i]}</span>\n`;tone(failed?190:520+i*70,.055,failed?'sawtooth':'sine',.025);i++;setTimeout(next,180)},520)}next()});
    loadScenario('safe');
  
  }

  // Architecture drill-down.
  if ($('#archDetail')) {
    const arch={quality:['Artifact admission','POST /v1/quality/evaluate · fence stage 1',['Stable AQ-* findings','Deterministic profile/mode metadata','Deep Quality remains explicit, not silently synchronous']],guard:['Mandatory enforcement','Guard stage · always fail closed',['Identity + tenant + policy evaluation','Stable GUARD_* reason codes','Exact-action capability binding']],bus:['Durable handoff','Bus stage · tenant-scoped persistence',['Commit before delivery claim','Lease recovery for unacknowledged work','Optional Redis/Kafka/RabbitMQ fan-out']],audit:['Completion evidence','fence.completed · hash chained',['Correlation identity across stages','Event hash + signing key identity','Artifact digest, not artifact contents']]};
    function setArch(t){$$('.arch-node').forEach(n=>n.classList.toggle('active',n.dataset.tier===t));const [title,code,items]=arch[t];$('#archDetail').innerHTML=`<div><div class="kicker">${t.toUpperCase()}</div><h3 style="font-size:28px;margin:12px 0">${title}</h3><code>${code}</code></div><ul>${items.map(x=>`<li>↳ ${x}</li>`).join('')}</ul>`}$$('.arch-node').forEach(n=>n.addEventListener('click',()=>setArch(n.dataset.tier)));setArch('quality');
  
  }

  // Command palette uses search index plus product actions.
  const palette=$('#commandPalette'),paletteInput=$('#paletteInput'),paletteList=$('#paletteList');let searchIndex=[];
  const actions=[['Tour: Quality','index.html#quality','scan-search'],['Tour: Guard','index.html#guard','shield-check'],['Tour: Bus','index.html#bus','waypoints'],['Interactive simulator','index.html#simulator','play'],['Product overview','product.html','box'],['Assurance ledger','assurance.html','badge-check'],['Developer quickstart','getting-started.html','terminal'],['Architecture','architecture.html','network'],['GitHub repository','https://github.com/AIFENCE/AIFENCE','github']];
  fetch('assets/search-index.json').then(r=>r.ok?r.json():[]).then(v=>searchIndex=v).catch(()=>{});
  function renderPalette(){const q=paletteInput.value.trim().toLowerCase();let items=actions.map(([title,url,icon])=>({title,url,summary:'AIFENCE product action',icon}));if(q){items=items.filter(x=>(x.title+' '+x.summary).toLowerCase().includes(q));items.push(...searchIndex.filter(x=>(x.title+' '+x.summary+' '+x.text).toLowerCase().includes(q)).slice(0,8).map(x=>({...x,icon:'file-text'})))}paletteList.innerHTML=items.slice(0,14).map(x=>`<li><a href="${x.url}"><i data-lucide="${x.icon||'file-text'}"></i><span><strong>${x.title}</strong><small>${x.summary||''}</small></span></a></li>`).join('');window.lucide?.createIcons()}
  function openPalette(){palette.showModal();paletteInput.value='';renderPalette();setTimeout(()=>paletteInput.focus(),20)}$('#paletteOpen')?.addEventListener('click',openPalette);paletteInput?.addEventListener('input',renderPalette);palette?.addEventListener('click',e=>{if(e.target===palette)palette.close()});addEventListener('keydown',e=>{if((e.metaKey||e.ctrlKey)&&e.key.toLowerCase()==='k'){e.preventDefault();openPalette()}if(e.key==='Escape'&&palette.open)palette.close()});

  // Live GitHub metadata with safe fallback; never blocks content.
  fetch('https://api.github.com/repos/AIFENCE/AIFENCE',{headers:{Accept:'application/vnd.github+json'}}).then(r=>r.ok?r.json():Promise.reject()).then(meta=>{$$('[data-github-stars]').forEach(el=>el.textContent=Intl.NumberFormat().format(meta.stargazers_count))}).catch(()=>{});
  fetch('https://api.github.com/repos/AIFENCE/AIFENCE/releases/latest',{headers:{Accept:'application/vnd.github+json'}}).then(r=>r.ok?r.json():Promise.reject()).then(rel=>{$$('[data-release-version]').forEach(el=>el.textContent=rel.tag_name||rel.name||'0.1.0');$$('[data-release-date]').forEach(el=>el.textContent=(rel.published_at||'').slice(0,10))}).catch(()=>{});

  // Tour state event from WebGL engine keeps URL/nav/assistive text in sync.
  addEventListener('aifence:chapter',e=>{const name=e.detail.name;if(!chapterOrder.includes(name))return;state.chapter=name;$$('[data-chapter-jump]').forEach(b=>b.classList.toggle('active',b.dataset.chapterJump===name));history.replaceState(null,'','#'+name);$('#tourLive').textContent=`Tour chapter ${name}. ${e.detail.description||''}`;if(state.sound)tone({risk:180,boundary:280,quality:430,guard:510,bus:620,evidence:760}[name],.04)});
})();
