
(function(){
 const root=document.documentElement;
 const saved=localStorage.getItem('aifence-theme');
 if(saved) root.dataset.theme=saved; else if(matchMedia('(prefers-color-scheme: light)').matches) root.dataset.theme='light';
 const theme=document.getElementById('themeBtn');
 function sync(){ if(!theme)return; theme.innerHTML=root.dataset.theme==='light'?'<i class="fa-solid fa-moon"></i>':'<i class="fa-solid fa-sun"></i>'; }
 sync(); theme?.addEventListener('click',()=>{root.dataset.theme=root.dataset.theme==='light'?'dark':'light';localStorage.setItem('aifence-theme',root.dataset.theme);sync();});
 const btn=document.getElementById('menuBtn'), nav=document.getElementById('mobileNav');
 btn?.addEventListener('click',()=>{const open=nav.classList.toggle('open');btn.setAttribute('aria-expanded',String(open));btn.innerHTML=open?'<i class="fa-solid fa-xmark"></i>':'<i class="fa-solid fa-bars"></i>';});
 document.querySelectorAll('.copy').forEach(b=>b.addEventListener('click',async()=>{const t=b.closest('.codeblock').querySelector('code').innerText;try{await navigator.clipboard.writeText(t);b.innerHTML='<i class="fa-solid fa-check"></i> Copied';setTimeout(()=>b.innerHTML='<i class="fa-regular fa-copy"></i> Copy',1200)}catch(e){}}));
})();
