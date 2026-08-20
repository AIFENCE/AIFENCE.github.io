(function($){
'use strict';
if(!$){return;}
const AIFenceSite={
  searchIndex:null, benchData:null,
  init(){this.bindMenu();this.bindCodeTabs();this.bindCopy();this.bindSearch();this.bindAjaxDocs();this.bindBenchmarks();this.loadGitHubMeta();this.bindResize();},
  bindMenu(){const $menu=$('#mobileMenu'),$nav=$('#mobileNav');$menu.on('click',()=>{const open=!$nav.hasClass('open');$nav.toggleClass('open',open);$menu.attr('aria-expanded',String(open));$('body').toggleClass('nav-open',open);});$nav.on('click','a',()=>{$nav.removeClass('open');$menu.attr('aria-expanded','false');$('body').removeClass('nav-open');});},
  snippets:{cli:`python -m venv .venv
. .venv/bin/activate
python -m pip install -e ".[dev]"

aifence demo`,curl:`curl -sS -X POST http://127.0.0.1:8080/v1/fence/submit \
  -H "Authorization: Bearer $AIFENCE_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"artifact":"# Deployment note\n\nValidated for controlled handoff.","receiver":"release-agent","action":{"operation":"read"},"risk_score":10}'`,python:`from aifence_client import AifenceClient

client = AifenceClient(
    "https://aifence.example.com/guard",
    api_key="replace-with-secret-manager-value",
)
receipt = client.submit_fence({
    "artifact": "Validated artifact",
    "receiver": "release-agent",
    "action": {"operation": "read"},
})
print(receipt["final_outcome"])`,typescript:`import {AifenceClient} from "@aifence/client";

const client = new AifenceClient(
  "https://aifence.example.com/guard",
  process.env.AIFENCE_API_KEY!,
);
const receipt = await client.submitFence({
  artifact: "Validated artifact",
  receiver: "release-agent",
  action: {operation: "read"},
});
console.log(receipt.final_outcome);`},
  bindCodeTabs(){ $(document).on('click','.code-tabs button',function(){const $b=$(this);$('.code-tabs button').removeClass('active');$b.addClass('active');const lang=$b.data('lang'),$block=$('#codeBlock');if($block.length){$block.text(AIFenceSite.snippets[lang]||AIFenceSite.snippets.cli);}});},
  bindCopy(){$(document).on('click','#copyCode,.copy-doc-code',function(){const $btn=$(this);let text='';if($btn.is('#copyCode')) text=$('#codeBlock').text(); else text=$btn.closest('.doc-code').find('code').text();navigator.clipboard?.writeText(text).then(()=>{$btn.text('Copied');setTimeout(()=>{$btn.text('Copy');},1200);});});},
  bindSearch(){const self=this;$(document).on('click','.search-open,.deep-sidebar .docs-search',function(e){e.preventDefault();self.openSearch();});$('#docsSearch').on('focus',function(){self.openSearch();this.blur();});$(document).on('keydown',function(e){if((e.metaKey||e.ctrlKey)&&e.key.toLowerCase()==='k'){e.preventDefault();self.openSearch();} if(e.key==='Escape'&&$('#globalSearch')[0]?.open){$('#globalSearch')[0].close();}});$(document).on('input','#globalSearchInput',function(){self.renderSearch($(this).val());});$('#globalSearch').on('click',function(e){if(e.target===this)this.close();});},
  openSearch(){const dlg=$('#globalSearch')[0];if(!dlg)return;const done=()=>{if(!dlg.open)dlg.showModal();$('#globalSearchInput').val('').trigger('input').focus();};if(this.searchIndex){done();return;}$.getJSON('assets/search-index.json').done(data=>{this.searchIndex=data;done();}).fail(()=>{this.searchIndex=[];done();});},
  renderSearch(q){const $out=$('#globalSearchResults').empty(),term=$.trim(q).toLowerCase();if(!term){$out.append('<li class="search-empty">Type to search the complete docs.</li>');return;}const terms=term.split(/\s+/);const hits=(this.searchIndex||[]).map(x=>{const hay=(x.title+' '+x.summary+' '+x.text).toLowerCase();let score=terms.every(t=>hay.includes(t))?0:-999;if(score>-1){terms.forEach(t=>{if(x.title.toLowerCase().includes(t))score+=10;if(x.summary.toLowerCase().includes(t))score+=4;});}return {x,score};}).filter(h=>h.score>=0).sort((a,b)=>b.score-a.score).slice(0,12);if(!hits.length){$out.append('<li class="search-empty">No matches.</li>');return;}hits.forEach(h=>{const $a=$('<a class="ajax-doc-link"></a>').attr('href',h.x.url);$a.append($('<strong></strong>').text(h.x.title),$('<span></span>').text(h.x.summary));$out.append($('<li></li>').append($a));});},
  bindAjaxDocs(){const self=this;$(document).on('click','a.ajax-doc-link',function(e){if(e.metaKey||e.ctrlKey||e.shiftKey||e.altKey||this.target==='_blank')return;const href=$(this).attr('href');if(!href||href.startsWith('http')||!href.endsWith('.html'))return;e.preventDefault();self.loadDoc(href,true);});$(window).on('popstate',function(){if($('body').hasClass('doc-body'))self.loadDoc(location.pathname.split('/').pop()||'getting-started.html',false);});},
  loadDoc(url,push){const self=this,$article=$('[data-doc-article]');if(!$article.length){location.href=url;return;}$('body').addClass('ajax-loading');$.ajax({url,dataType:'html',cache:true}).done(raw=>{const parsed=$.parseHTML(raw,document,true),$tmp=$('<div></div>').append(parsed),$new=$tmp.find('[data-doc-article]').first();if(!$new.length){location.href=url;return;}$article.replaceWith($new);document.title=$tmp.find('title').text()||document.title;$('.deep-sidebar a').removeClass('selected').filter(`[href="${url}"]`).addClass('selected');const $newToc=$tmp.find('.page-toc').first();$('.page-toc').replaceWith($newToc);if(push)history.pushState({},'',url);$('#globalSearch')[0]?.close();window.scrollTo({top:0,behavior:'instant'});self.bindBenchmarks();}).fail(()=>{location.href=url;}).always(()=>$('body').removeClass('ajax-loading'));},
  bindBenchmarks(){const self=this;if(!$('[data-benchmark-viz]').length)return;const render=(view)=>{const rows=self.benchData?.[view]||[],$bars=$('#benchBars').empty();const keys=view==='detector'?['baseline','enhanced']:['strict','balanced'];const labels=view==='detector'?['Baseline','Behavioral analysis']:['Strict','Balanced'];rows.forEach(row=>{const $r=$('<div class="bench-row"></div>').append($('<h4></h4>').text(row.label));keys.forEach((k,i)=>{const val=row[k];const $line=$('<div class="bench-line"></div>');$line.append($('<span class="bench-label"></span>').text(labels[i]));$line.append($('<div class="bench-track"><i></i></div>').find('i').css('width',Math.max(1,val)+'%').end());$line.append($('<b></b>').text(val.toFixed(1)+'%'));$r.append($line);});$bars.append($r);});$('.bench-data-status').text(self.benchData?.corpus ? `${self.benchData.corpus.total} traces · ${self.benchData.corpus.attack} attack · ${self.benchData.corpus.benign} benign` : 'Benchmark data unavailable');};const load=()=>{if(self.benchData){render($('.bench-tab.active').data('bench-view')||'detector');return;}$.getJSON('assets/benchmarks.json').done(d=>{self.benchData=d;render('detector');}).fail(()=>$('.bench-data-status').text('Benchmark data unavailable'));};load();$(document).off('click.bench').on('click.bench','.bench-tab',function(){ $('.bench-tab').removeClass('active');$(this).addClass('active');render($(this).data('bench-view'));});},
  loadGitHubMeta(){const $count=$('[data-star-count]');if(!$count.length)return;$.ajax({url:'https://api.github.com/repos/AIFENCE/AIFENCE',dataType:'json',timeout:3500}).done(r=>{if(typeof r.stargazers_count==='number')$count.text(r.stargazers_count.toLocaleString());}).fail(()=>{$count.text('Repo');});},
  bindResize(){let t;$(window).on('resize',()=>{clearTimeout(t);t=setTimeout(()=>{if(innerWidth>820){$('#mobileNav').removeClass('open');$('#mobileMenu').attr('aria-expanded','false');$('body').removeClass('nav-open');}},120);});}
};
$(function(){AIFenceSite.init();});
})(window.jQuery);