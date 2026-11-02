// Exercise the real print event handlers against visible and spoiler-hidden lesson nodes.
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const path=require('node:path');
const script=fs.readFileSync(path.join(__dirname,'../pages/READINGS/the-giver/study.js'),'utf8');
const handlers={};
function element(extra={}){return Object.assign({value:'',checked:false,hidden:false,open:false,dataset:{},textContent:'',listeners:{},addEventListener(k,fn){this.listeners[k]=fn;},closest(){return null;}},extra);}
const classes=new Set();const body={classList:{toggle(k,v){v?classes.add(k):classes.delete(k);},remove(...ks){ks.forEach(k=>classes.delete(k));},add(k){classes.add(k);}}};
const ordinary=element(),teacher=element({open:true,closest(s){return s==='.teacher-content'?this:null;}}),future=element({closest(s){return s==='[hidden]'?this:null;}});
const nodes={'#spoilers':element(), '#mode-note':element(), '#save-status':element(), '#reset-all':element(), '#print':element(), '#print-teacher':element(), '.course-menu':element({open:true})};
let capture;
const window={addEventListener(k,fn){handlers[k]=fn;},confirm(){return false;},print(){handlers.beforeprint();capture={ordinary:ordinary.open,teacher:teacher.open,future:future.open,include:classes.has('print-teacher')};handlers.afterprint();}};
const doc={body,querySelector(s){return nodes[s]||null;},querySelectorAll(s){return s==='#lesson details'?[ordinary,teacher,future]:[];}};
vm.runInNewContext(script,{document:doc,window,localStorage:{getItem(){return null;}},matchMedia(){return {matches:false};}});
nodes['#print'].listeners.click();
assert.deepEqual(capture,{ordinary:true,teacher:false,future:false,include:false});
assert.equal(ordinary.open,false);assert.equal(teacher.open,true);assert.equal(classes.size,0);
nodes['#print-teacher'].checked=true;nodes['#print'].listeners.click();
assert.deepEqual(capture,{ordinary:true,teacher:true,future:false,include:true});
assert.equal(ordinary.open,false);assert.equal(teacher.open,true);assert.equal(future.open,false);
const css=fs.readFileSync(path.join(__dirname,'../pages/READINGS/the-giver/study.css'),'utf8');
assert.match(css,/\.teacher-content\{display:none!important\}/);
assert.match(css,/body\.print-teacher \.teacher-content\{display:block!important\}/);
assert.match(css,/\.print-log-only main>#lesson\{display:block!important\}/);
console.log('PASS: student print closes/excludes opened teacher answers; explicit opt-in includes answers; future chapters stay hidden; screen disclosure states restored; print-log wrapper supported.');

