'use strict';
(() => {
 const all=s=>Array.from(document.querySelectorAll(s));
 function syncToc(){all('[data-toc-target]').forEach(a=>{const target=document.getElementById(a.dataset.tocTarget);a.hidden=!target||!!target.closest('[hidden]');});}
 document.addEventListener('change',e=>{if(e.target.id==='spoilers'||e.target.id==='chapter-limit')syncToc();});
 all('.page-toc a,.chapter-scan a').forEach(a=>a.addEventListener('click',()=>{
  const id=a.getAttribute('href').slice(1),target=document.getElementById(id);
  if(!target||target.closest('[hidden]'))return;
  let p=target.parentElement;while(p){if(p.tagName==='DETAILS'&&!p.closest('.teacher-content'))p.open=true;p=p.parentElement;}
 }));
 const narrow=matchMedia('(max-width:640px)');
 all('.study-table').forEach((host,i)=>{
  const wrap=host.querySelector('.table-wrap'),cards=host.querySelector('.table-cards'),button=host.querySelector('.table-view-toggle');
  wrap.id=wrap.id||'comparison-table-'+i;cards.id='stacked-table-'+i;button.setAttribute('aria-controls',wrap.id+' '+cards.id);
  function layout(stacked){wrap.hidden=stacked;cards.hidden=!stacked;button.textContent='Stacked rows: '+(stacked?'on':'off');button.setAttribute('aria-pressed',String(stacked));}
  layout(narrow.matches);narrow.addEventListener('change',()=>layout(narrow.matches));button.addEventListener('click',()=>layout(!wrap.hidden));
 });
 syncToc();
})();
