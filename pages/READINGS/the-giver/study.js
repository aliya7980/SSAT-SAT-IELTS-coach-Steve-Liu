'use strict';
(() => {
 const prefix='huskydaddy.giver.v1.';
 const $=(s)=>document.querySelector(s), all=(s)=>Array.from(document.querySelectorAll(s));
 const status=(text)=>{const el=$('#save-status');if(el)el.textContent=text;};
 function read(key,fallback=''){try{return localStorage.getItem(prefix+key)??fallback;}catch{return fallback;}}
 function save(key,value){try{localStorage.setItem(prefix+key,value);status('Saved in this browser.');return true;}catch{status('Browser storage is unavailable. Your changes work for this visit but will not be saved.');return false;}}
 const spoiler=$('#spoilers');
 function updateMode(value,persist=false){
  spoiler.value=value==='full'?'full':'light';
  all('.full-content').forEach(el=>el.hidden=spoiler.value!=='full');
  all('.spoiler-gate').forEach(el=>el.hidden=spoiler.value==='full');
  $('#mode-note').textContent=spoiler.value==='full'?'Full novel: analysis can discuss Chapters 1–23. Chapter limits remain separate.':'Spoiler-light: full-novel analysis is hidden. Use the chapter guide for reading-stage notes.';
  if(persist)save('spoilers',spoiler.value);
 }
 updateMode(read('spoilers','light'));
 spoiler.addEventListener('change',()=>updateMode(spoiler.value,true));
 all('[data-save]').forEach(el=>{
  const key='response.'+el.dataset.save;
  if(el.type==='checkbox')el.checked=read(key)==='true';else el.value=read(key);
  el.addEventListener(el.tagName==='TEXTAREA'?'input':'change',()=>save(key,el.type==='checkbox'?String(el.checked):el.value));
 });
 all('[data-clear]').forEach(button=>button.addEventListener('click',()=>{
  const field=document.getElementById(button.dataset.clear);field.value='';save('response.'+field.dataset.save,'');field.focus();
 }));
 $('#reset-all').addEventListener('click',()=>{
  if(!window.confirm('Delete all locally saved Giver responses, reading progress, and spoiler preferences in this browser?'))return;
  try{Object.keys(localStorage).filter(k=>k.startsWith(prefix)).forEach(k=>localStorage.removeItem(k));}catch{}
  all('[data-save]').forEach(el=>{if(el.type==='checkbox')el.checked=false;else el.value='';});
  $('#print-teacher').checked=false;updateMode('light');if($('#chapter-limit')){updateLimit(0);}
  status('All Giver responses and progress have been reset.');
 });
 const limit=$('#chapter-limit');
 function updateLimit(value,persist=false){
  const n=Math.min(23,Math.max(0,Number(value)||0));limit.value=String(n);
  all('[data-retrospective]').forEach(el=>el.hidden=n<23);
  all('[data-chapter]').forEach(el=>{el.hidden=Number(el.dataset.chapter)>n;if(el.hidden)el.open=false;});
  all('[data-chapter-link]').forEach(el=>el.hidden=Number(el.dataset.chapterLink)>n);
  all('[data-next-locked]').forEach(el=>el.hidden=Number(el.dataset.nextLocked)<=n);
  $('#chapter-not-started').hidden=n>0;
  $('#reading-progress').textContent=n?`Showing Chapters 1–${n}. Later chapter titles, notes, and answers are hidden.`:'No chapters marked read yet.';
  if(persist)save('readThrough',String(n));
 }
 function openHash(){
  if(!limit)return;
  const m=location.hash.match(/^#chapter-(\d+)$/);if(!m)return;
  const chapter=$('#chapter-'+Number(m[1]));
  if(chapter&&!chapter.hidden){chapter.open=true;chapter.scrollIntoView();}
 }
 if(limit){updateLimit(read('readThrough','0'));limit.addEventListener('change',()=>{updateLimit(limit.value,true);openHash();});window.addEventListener('hashchange',openHash);openHash();
  all('[data-chapter-link]').forEach(a=>a.addEventListener('click',()=>{const el=$(a.getAttribute('href'));if(el&&!el.hidden)el.open=true;}));}
 all('.tab-set').forEach(set=>{
  const tabs=Array.from(set.querySelectorAll('[role=tab]'));
  function activate(tab){tabs.forEach(t=>{const selected=t===tab;t.setAttribute('aria-selected',String(selected));t.tabIndex=selected?0:-1;document.getElementById(t.getAttribute('aria-controls')).hidden=!selected;});}
  tabs.forEach((tab,i)=>{tab.addEventListener('click',()=>activate(tab));tab.addEventListener('keydown',event=>{let next=i;if(event.key==='ArrowRight')next=(i+1)%tabs.length;else if(event.key==='ArrowLeft')next=(i+tabs.length-1)%tabs.length;else if(event.key==='Home')next=0;else if(event.key==='End')next=tabs.length-1;else return;event.preventDefault();activate(tabs[next]);tabs[next].focus();});});
 });
 // Print a complete available lesson while keeping teacher answers an explicit opt-in.
 let printState=null;
 function preparePrint(){
  if(printState)return;
  const includeTeacher=$('#print-teacher').checked;
  document.body.classList.toggle('print-teacher',includeTeacher);
  printState=all('#lesson details').map(el=>({el,open:el.open}));
  printState.forEach(({el})=>{
   if(el.closest('[hidden]'))return;
   el.open=el.closest('.teacher-content')?includeTeacher:true;
  });
 }
 function restorePrint(){
  if(printState)printState.forEach(({el,open})=>{el.open=open;});
  printState=null;
  document.body.classList.remove('print-log-only','print-teacher');
 }
 window.addEventListener('beforeprint',preparePrint);
 window.addEventListener('afterprint',restorePrint);
 $('#print').addEventListener('click',()=>window.print());
 const log=$('#print-log');if(log)log.addEventListener('click',()=>{document.body.classList.add('print-log-only');window.print();});
 const menu=$('.course-menu');if(matchMedia('(max-width:850px)').matches)menu.open=false;
 window.addEventListener('storage',event=>{if(event.key===prefix+'spoilers')updateMode(event.newValue||'light');if(limit&&event.key===prefix+'readThrough')updateLimit(event.newValue||0);});
})();
