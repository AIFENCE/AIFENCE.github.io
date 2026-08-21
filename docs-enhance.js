
(()=>{
  const body=document.querySelector('.doc-body'); if(!body)return;
  const article=document.querySelector('.docarticle'); const prose=document.querySelector('.markdown-body');
  const progress=document.createElement('div');progress.className='doc-reading-progress';progress.innerHTML='<i></i>';document.body.appendChild(progress);const bar=progress.firstElementChild;
  const updateProgress=()=>{if(!article)return;const r=article.getBoundingClientRect();const total=Math.max(1,article.offsetHeight-innerHeight);const done=Math.min(total,Math.max(0,-r.top+90));bar.style.width=(done/total*100).toFixed(2)+'%'};addEventListener('scroll',updateProgress,{passive:true});updateProgress();
  if(prose){
    let section=0;prose.querySelectorAll('h2').forEach(h=>{section++;h.dataset.section=String(section).padStart(2,'0');});
    prose.querySelectorAll('h2 .anchor,h3 .anchor,h4 .anchor').forEach(a=>{a.innerHTML='<i class="fa-solid fa-link" aria-hidden="true"></i>';});
    prose.querySelectorAll('blockquote').forEach(q=>{const t=q.textContent.trim().toLowerCase();if(/warning|caution|important limitation/.test(t))q.classList.add('callout-warning');else if(/pass|success|verified/.test(t))q.classList.add('callout-success');});
    prose.querySelectorAll('strong').forEach(s=>{if(s.textContent.trim()==='PASS')s.classList.add('status-token');});
    prose.querySelectorAll('a[href^="http"]').forEach(a=>{if(a.hostname&&a.hostname!==location.hostname){a.target='_blank';a.rel='noopener';a.setAttribute('aria-label',(a.textContent.trim()||'External link')+' (opens in new tab)');}});
  }
  document.querySelectorAll('.doc-codebar').forEach(bar=>{const label=bar.querySelector('span');if(label){const lang=label.textContent.trim().toLowerCase();const icon=lang.includes('bash')||lang.includes('shell')?'fa-terminal':lang.includes('json')?'fa-code':lang.includes('python')?'fa-python':'fa-code';label.innerHTML=`<i class="fa-solid ${icon==='fa-python'?'fa-code':icon}"></i>${label.textContent}`;}const btn=bar.querySelector('.copy-doc-code');if(btn)btn.innerHTML='<i class="fa-regular fa-copy"></i><span class="sr-only">Copy</span>';});
  if(window.hljs){document.querySelectorAll('.doc-code pre code').forEach(el=>{try{hljs.highlightElement(el)}catch{}})}
  const toc=[...document.querySelectorAll('.page-toc a[href^="#"]')];const targets=toc.map(a=>document.querySelector(a.getAttribute('href'))).filter(Boolean);if(targets.length){const io=new IntersectionObserver(entries=>{entries.filter(e=>e.isIntersecting).sort((a,b)=>a.boundingClientRect.top-b.boundingClientRect.top).slice(0,1).forEach(e=>{toc.forEach(a=>a.classList.toggle('active',a.getAttribute('href')==='#'+e.target.id));});},{rootMargin:'-18% 0px -70% 0px',threshold:[0,.1,1]});targets.forEach(t=>io.observe(t));}
})();
