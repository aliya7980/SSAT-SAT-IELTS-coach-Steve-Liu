
(() => {
'use strict';
const ID='details-2025', KEY='hd_sat_special_details_2025_v1';
const validAnswers=a=>Array.isArray(a)&&a.length===34&&a.every(x=>x===null||['A','B','C','D'].includes(x));
const validAttempt=x=>x&&x.testId===ID&&typeof x.attemptId==='string'&&typeof x.studentName==='string'&&validAnswers(x.answers)&&Number.isFinite(Date.parse(x.startedAt));
const fresh=()=>({testId:ID,attemptId:crypto.randomUUID?crypto.randomUUID():Date.now()+'-'+Math.random().toString(36).slice(2),studentName:'',startedAt:new Date().toISOString(),answers:Array(34).fill(null),marked:[],lastQuestion:1});
let state;try{state=JSON.parse(localStorage.getItem(KEY))}catch{}
if(!validAttempt(state))state=fresh();
if(!Array.isArray(state.marked))state.marked=[];
function save(){try{localStorage.setItem(KEY,JSON.stringify(state))}catch{document.getElementById('storageWarning')?.removeAttribute('hidden')}}
function download(value,name){const url=URL.createObjectURL(new Blob([JSON.stringify(value,null,2)],{type:'application/json'}));const a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000)}
function meta(container,entries){container.replaceChildren();for(const [label,value] of entries){const box=document.createElement('div'),strong=document.createElement('strong'),span=document.createElement('span');strong.textContent=value;span.textContent=label;box.append(strong,span);container.append(box)}}
function readFile(input,callback){input.addEventListener('change',async()=>{const message=document.getElementById('message');try{if(!input.files[0])return;if(input.files[0].size>1000000)throw Error('File is too large.');await callback(JSON.parse(await input.files[0].text()));if(message)message.textContent='File loaded.'}catch(e){if(message)message.textContent='Unable to open this file: '+e.message}input.value=''})}
window.DetailsPractice={ID,get state(){return state},setState(x){if(!validAttempt(x))throw Error('Invalid response file.');state=x;if(!Array.isArray(state.marked))state.marked=[];save()},save,download,meta,readFile,validAttempt,validAnswers};
})();
