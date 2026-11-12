const fs=require('fs'),vm=require('vm'),assert=require('assert'),path=require('path');
const source=fs.readFileSync(path.join(__dirname,'../pages/SAT/shared/teacher-ink.js'),'utf8');
// A small DOM fixture exercises the actual pointer handlers and in-memory lifecycle.
class Element {
 constructor(tag){this.tag=tag;this.children=[];this.listeners={};this.attrs={};this.clientWidth=500;this.clientHeight=200;this.captures=new Set();this.top=100;this.left=40;this.classes=new Set();this.classList={add:n=>this.classes.add(n),toggle:(n,on)=>on?this.classes.add(n):this.classes.delete(n)};}
 get firstChild(){return this.children[0];}
 appendChild(el){if(el.parent)el.parent.children.splice(el.parent.children.indexOf(el),1);this.children.push(el);el.parent=this;return el;}
 replaceChildren(){this.children=[];}
 setAttribute(k,v){this.attrs[k]=String(v);}
 addEventListener(name,fn){(this.listeners[name]??=[]).push(fn);}
 emit(name,args={}){for(const fn of this.listeners[name]||[])fn({isPrimary:true,button:0,pointerId:1,clientX:90,clientY:150,preventDefault(){},stopPropagation(){},...args});}
 getBoundingClientRect(){return {left:this.left,top:this.top,width:this.clientWidth,height:this.clientHeight};}
 setPointerCapture(id){this.captures.add(id);}
 hasPointerCapture(id){return this.captures.has(id);}
 releasePointerCapture(id){this.captures.delete(id);this.emit('lostpointercapture',{pointerId:id});}
}
function fixture(){
 const hosts=Object.fromEntries(['passage','prompt','options','controls'].map(n=>[n,new Element('div')]));
 const events={};let observer;
 const c={window:{addEventListener:(n,fn)=>events[n]=fn},document:{querySelector:()=>hosts.controls,getElementById:n=>hosts[n],createElement:t=>new Element(t),createElementNS:(ns,t)=>new Element(t)},ResizeObserver:class{constructor(fn){this.fn=fn;observer=this;}observe(){}disconnect(){}},localStorage:{setItem(){throw Error('Ink must not persist');},getItem(){throw Error('Ink must not read storage');}},sessionStorage:{setItem(){throw Error('Ink must not persist');}},fetch(){throw Error('Ink must not contact a server');}};
 vm.runInNewContext(source,c);const ink=c.window.createSATTeacherInk();
 const buttons=hosts.controls.children;
 function render(key){for(const n of ['passage','prompt','options']){hosts[n].replaceChildren();hosts[n].appendChild(new Element('content'));}ink.render(key);}
 function svg(region='passage'){return hosts[region].firstChild.children.at(-1);}
 function stroke(type='mouse',region='passage'){const el=svg(region);el.emit('pointerdown',{pointerType:type});el.emit('pointermove',{pointerType:type,clientX:200,clientY:190});el.emit('pointerup',{pointerType:type});return el;}
 return {ink,hosts,events,buttons,render,svg,stroke,resize:()=>observer.fn()};
}
const f=fixture(),[mark,undo,clear]=f.buttons;
f.render('august2026:m1q1');assert(mark.hidden);assert(undo.hidden);assert(clear.hidden);
assert.equal(f.stroke().children.length,0,'Students cannot draw');
f.ink.unlock();assert.equal(mark.hidden,false);assert(undo.hidden);
mark.emit('click');assert.equal(mark.attrs['aria-pressed'],'true');assert.equal(undo.hidden,false);assert(undo.disabled);
for(const type of ['mouse','pen','touch']){const el=f.stroke(type);assert.equal(el.children.at(-1).attrs.stroke,'#dc2626');assert(!el.hasPointerCapture(1));}
assert.equal(f.svg().children.length,3);assert.equal(undo.disabled,false);
undo.emit('click');assert.equal(f.svg().children.length,2);
f.stroke('pen','options');assert.equal(f.svg('options').children.length,1);
undo.emit('click');assert.equal(f.svg('options').children.length,0,'Undo is ordered across question regions');
mark.emit('click');assert(undo.hidden);assert(clear.hidden);assert(!f.svg().classes.has('teacher-ink-on'));assert.equal(f.svg().children.length,2,'Turning pen off keeps visible marks');
f.stroke();assert.equal(f.svg().children.length,2,'Pen off does not draw');
f.render('august2026:m1q2');assert.equal(f.svg().children.length,0);
mark.emit('click');f.stroke('touch');assert.equal(f.svg().children.length,1);
f.render('august2026:m2q1');assert.equal(f.svg().children.length,0,'Modules have separate marks');
f.render('november2026-practice1:m1q1');assert.equal(f.svg().children.length,0,'Tests have separate marks');
f.render('august2026:m1q1');assert.equal(f.svg().children.length,2,'Returning to a question restores its strokes');
// Moving the content on scroll changes the pointer origin but never the stored local coordinates.
const before=f.svg().children[0].attrs.points;f.svg().top=-100;f.resize();assert.equal(f.svg().children[0].attrs.points,before);
f.stroke();assert(f.svg().children.at(-1).attrs.points.startsWith('50,200'),'Pointer coordinates use current content position after scrolling');
f.svg().emit('pointerdown',{pointerId:2});f.svg().emit('pointermove',{pointerId:3});f.events.blur();assert(!f.svg().hasPointerCapture(2),'Blur terminates an active stroke');
clear.emit('click');assert.equal(f.svg().children.length,0);assert(undo.disabled);
f.render('august2026:m1q2');assert.equal(f.svg().children.length,1,'Clear affects only the current question');
f.events.pagehide({persisted:true});assert.equal(f.svg().children.length,0);assert.equal(mark.attrs['aria-pressed'],'false');
f.render('august2026:m1q1');assert.equal(f.svg().children.length,0,'Leaving clears all questions, including back/forward cache');
f.stroke();f.ink.lock();assert(mark.hidden);assert.equal(f.svg().children.length,0,'Losing teacher access clears ink');
const fresh=fixture();fresh.render('august2026:m1q2');assert(fresh.buttons[0].hidden);assert.equal(fresh.svg().children.length,0,'Refresh starts without teacher authorization or marks');
console.log('Teacher gate, mouse/pen/touch, undo/clear, scrolling, per-question/module/test isolation, navigation, and temporary lifecycle passed.');
