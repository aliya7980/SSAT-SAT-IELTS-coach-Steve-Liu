'use strict';
const {DatabaseSync}=require('node:sqlite');
const {randomBytes,createHash,scrypt:derive,timingSafeEqual}=require('node:crypto');
const {promisify}=require('node:util');
const fs=require('node:fs'),path=require('node:path');
const scrypt=promisify(derive), hash=s=>createHash('sha256').update(s).digest('hex');
const fresh=()=>randomBytes(32).toString('base64url');
const SCRYPT={N:131072,r:8,p:1,maxmem:256*1024*1024};
async function passwordHash(password){const salt=randomBytes(16).toString('hex');return `scrypt:${salt}:${(await scrypt(password,salt,32,SCRYPT)).toString('hex')}`;}
async function verify(password,encoded){
 const [kind,salt,key]=String(encoded).split(':');if(kind!=='scrypt'||!/^[a-f0-9]{32}$/.test(salt)||!/^[a-f0-9]{64}$/.test(key))return false;
 return timingSafeEqual(Buffer.from(key,'hex'),await scrypt(password,salt,32,SCRYPT));
}
function createApp({dbPath,passwordDigest,origins,seed={},now=Date.now}){
 if(!/^scrypt:[a-f0-9]{32}:[a-f0-9]{64}$/.test(passwordDigest||''))throw Error('Set SAT_TEACHER_PASSWORD_HASH using hash-password.cjs. No default password is supported.');
 if(!origins?.length||origins.some(o=>new URL(o).origin!==o||(!o.startsWith('https://')&&!/^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(o))))throw Error('Set exact HTTPS SAT_ALLOWED_ORIGINS.');
 const tests=Object.create(null);
 for(const id of fs.readdirSync(path.join(__dirname,'../pages/SAT/data'))){
  const p=path.join(__dirname,'../pages/SAT/data',id,'metadata.json');if(!fs.existsSync(p))continue;
  tests[id]={...JSON.parse(fs.readFileSync(p)),questions:JSON.parse(fs.readFileSync(path.join(path.dirname(p),'questions.json')))};
 }
 const db=new DatabaseSync(dbPath);db.exec(`PRAGMA journal_mode=WAL; PRAGMA foreign_keys=ON;
 CREATE TABLE IF NOT EXISTS keys(test TEXT PRIMARY KEY, value TEXT NOT NULL);
 CREATE TABLE IF NOT EXISTS sessions(digest TEXT PRIMARY KEY, expires INTEGER NOT NULL);
 CREATE TABLE IF NOT EXISTS invitations(digest TEXT PRIMARY KEY, id TEXT UNIQUE NOT NULL, test TEXT NOT NULL, name TEXT NOT NULL, expires INTEGER NOT NULL, result TEXT, answers TEXT);
 CREATE TABLE IF NOT EXISTS imports(ref TEXT PRIMARY KEY, attempt TEXT NOT NULL);
 CREATE TABLE IF NOT EXISTS limits(bucket TEXT PRIMARY KEY, count INTEGER NOT NULL, expires INTEGER NOT NULL);`);
 function fail(status,message){throw Object.assign(Error(message),{status});}
 function validKey(id,key){
  const required=[1,2].flatMap(m=>tests[id].questions[m].map(q=>`m${m}q${q.n}`));
  if(!key||Object.keys(key).length!==required.length||required.some(k=>!/^[ABCD]$/.test(key[k])))fail(400,'A complete 54-answer key is required.');
 }
 for(const [id,key] of Object.entries(seed)){if(!tests[id])continue;validKey(id,key);db.prepare('INSERT OR IGNORE INTO keys VALUES (?,?)').run(id,JSON.stringify(key));}
 function limit(bucket,max,period){
  const time=now();db.prepare('DELETE FROM limits WHERE expires < ?').run(time);
  const row=db.prepare('SELECT * FROM limits WHERE bucket=?').get(bucket);
  if(row&&row.count>=max)fail(429,'Too many requests. Try again later.');
  if(row)db.prepare('UPDATE limits SET count=count+1 WHERE bucket=?').run(bucket);
  else db.prepare('INSERT INTO limits VALUES (?,?,?)').run(bucket,1,time+period);
 }
 function keyFor(id){const row=db.prepare('SELECT value FROM keys WHERE test=?').get(id);if(!row)fail(503,'Grading is not configured for this test. Your responses are still saved on your device.');return JSON.parse(row.value);}
 function grade(row,answers){
  const test=tests[row.test],key=keyFor(row.test);
  const modules=[1,2].map(number=>{
   const questions=test.questions[number].map(q=>({number:q.n,status:!answers[number]?.[q.n]?'Unanswered':answers[number][q.n]===key[`m${number}q${q.n}`]?'Correct':'Incorrect'}));
   return {number,correct:questions.filter(q=>q.status==='Correct').length,total:questions.length,questions};
  });
  return {id:row.id,testId:row.test,name:row.name,date:new Date(now()).toISOString(),correct:modules.reduce((s,m)=>s+m.correct,0),total:modules.reduce((s,m)=>s+m.total,0),modules};
 }
 function invitation(code,test){
  if(typeof code!=='string'||code.length>100)fail(401,'Invalid test access code.');
  const row=db.prepare('SELECT * FROM invitations WHERE digest=?').get(hash(code));
  if(!row||row.test!==test||row.expires<now())fail(401,'Invalid or expired test access code.');return row;
 }
 function teacher(req){
  const token=req.headers.get('authorization')?.match(/^Bearer ([A-Za-z0-9_-]{43})$/)?.[1];
  const row=token&&db.prepare('SELECT expires FROM sessions WHERE digest=?').get(hash(token));
  if(!row||row.expires<=now())fail(401,'Teacher sign-in required.');return hash(token);
 }
 async function body(req){
  if(!req.headers.get('content-type')?.startsWith('application/json'))fail(415,'Send application/json.');
  const text=await req.text();if(text.length>32000)fail(413,'Request too large.');
  try{return JSON.parse(text);}catch{fail(400,'Invalid JSON.');}
 }
 async function handle(req,{ip='local'}={}){
  const origin=req.headers.get('origin');
  const headers={'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store, private','X-Content-Type-Options':'nosniff','Vary':'Origin','Content-Security-Policy':"default-src 'none'; frame-ancestors 'none'"};
  if(origin&&origins.includes(origin))headers['Access-Control-Allow-Origin']=origin;
  const send=(data,status=200)=>new Response(JSON.stringify(data),{status,headers});
  try{
   if(origin&&!origins.includes(origin))fail(403,'Origin not allowed.');
   if(req.method==='OPTIONS'){
    headers['Access-Control-Allow-Methods']='GET, POST, PUT, OPTIONS';headers['Access-Control-Allow-Headers']='Content-Type, Authorization';
    return new Response(null,{status:204,headers});
   }
   const url=new URL(req.url),route=url.pathname;
   if(route==='/health'&&req.method==='GET')return send({ok:true});
   if(route==='/api/teacher/login'&&req.method==='POST'){
    // Both per-IP and global ceilings; provider must also apply edge rate limiting.
    limit('login:'+ip,8,15*60e3);limit('login:global',60,15*60e3);
    const data=await body(req);
    if(typeof data.password!=='string'||data.password.length>1024||!await verify(data.password,passwordDigest))fail(401,'Invalid credentials.');
    db.prepare('DELETE FROM sessions WHERE expires<=?').run(now());
    const token=fresh(),expires=now()+60*60e3;db.prepare('INSERT INTO sessions VALUES (?,?)').run(hash(token),expires);
    return send({token,expires});
   }
   if(route.startsWith('/api/teacher/')){
    const session=teacher(req);
    if(route==='/api/teacher/logout'&&req.method==='POST'){db.prepare('DELETE FROM sessions WHERE digest=?').run(session);return send({ok:true});}
    const match=route.match(/^\/api\/teacher\/tests\/([a-z0-9-]+)\/(key|attempts|invitations|import)$/);
    if(!match||!tests[match[1]])fail(404,'Not found.');const [,id,action]=match;
    if(action==='key'&&req.method==='GET'){const stored=db.prepare('SELECT value FROM keys WHERE test=?').get(id);return send({answers:stored?JSON.parse(stored.value):{}});}
    if(action==='key'&&req.method==='PUT'){
     const {answers}=await body(req);validKey(id,answers);
     db.exec('BEGIN IMMEDIATE');
     try{
      db.prepare('INSERT INTO keys VALUES (?,?) ON CONFLICT(test) DO UPDATE SET value=excluded.value').run(id,JSON.stringify(answers));
      for(const row of db.prepare('SELECT * FROM invitations WHERE test=? AND result IS NOT NULL').all(id)){
       const updated={...grade(row,JSON.parse(row.answers)),date:JSON.parse(row.result).date};
       db.prepare('UPDATE invitations SET result=? WHERE id=?').run(JSON.stringify(updated),row.id);
      }
      db.exec('COMMIT');
     }catch(e){db.exec('ROLLBACK');throw e;}
     return send({ok:true});
    }
    if(action==='invitations'&&req.method==='POST'){
     keyFor(id);const {name}=await body(req);
     if(typeof name!=='string'||!name.trim()||name.length>100)fail(400,'Enter a student name (up to 100 characters).');
     const code=fresh(),expires=now()+30*24*60*60e3;
     db.prepare('INSERT INTO invitations(digest,id,test,name,expires) VALUES (?,?,?,?,?)').run(hash(code),fresh(),id,name.trim(),expires);
     return send({code,testId:id,name:name.trim(),expires},201);
    }
    if(action==='import'&&req.method==='POST'){
     const data=await body(req),answers=normalize(data.answers);
     if(typeof data.name!=='string'||!data.name.trim()||data.name.length>100)fail(400,'A valid student name is required.');
     const ref=hash(JSON.stringify([id,String(data.id||''),data.name,data.date||'',answers]));
     const existing=db.prepare('SELECT attempt FROM imports WHERE ref=?').get(ref);
     if(existing)return send({id:existing.attempt,imported:false});
     const row={id:fresh(),test:id,name:data.name.trim()},result=grade(row,answers);
     if(Number.isFinite(Date.parse(data.date)))result.date=new Date(data.date).toISOString();
     db.exec('BEGIN IMMEDIATE');
     try{
      db.prepare('INSERT INTO invitations(digest,id,test,name,expires,result,answers) VALUES (?,?,?,?,?,?,?)').run(hash(fresh()),row.id,id,row.name,now()+30*24*60*60e3,JSON.stringify(result),JSON.stringify(answers));
      db.prepare('INSERT INTO imports VALUES (?,?)').run(ref,row.id);db.exec('COMMIT');
     }catch(e){db.exec('ROLLBACK');throw e;}
     return send({id:row.id,imported:true},201);
    }
    if(action==='attempts'&&req.method==='GET')return send({attempts:db.prepare('SELECT * FROM invitations WHERE test=? AND result IS NOT NULL ORDER BY rowid DESC').all(id).map(row=>({...JSON.parse(row.result),answers:JSON.parse(row.answers)}))});
    fail(405,'Method not allowed.');
   }
   if(route.startsWith('/api/student/')&&req.method==='POST'){
    limit('student:'+ip,120,60e3);
    const data=await body(req);if(!tests[data.testId])fail(404,'Unknown test.');
    const row=invitation(data.code,data.testId);
    if(route==='/api/student/start')return send({id:row.id,testId:row.test,name:row.name,submitted:Boolean(row.result)});
    if(route==='/api/student/result'){if(!row.result)fail(404,'No submitted result.');return send(JSON.parse(row.result));}
    if(route==='/api/student/submit'){
     // An issued code allows exactly one immutable final submission; retries cannot probe the key.
     if(row.result){
      if(JSON.stringify(normalize(data.answers))!==row.answers)fail(409,'This access code has already been submitted. Ask your teacher for a new attempt.');
      return send(JSON.parse(row.result));
     }
     if(JSON.stringify(data.completedModules)!=='[1,2]')fail(400,'Complete both modules before submitting.');
     const answers=normalize(data.answers),result=grade(row,answers);
     const changed=db.prepare('UPDATE invitations SET answers=?,result=? WHERE digest=? AND result IS NULL').run(JSON.stringify(answers),JSON.stringify(result),row.digest);
     if(!changed.changes)fail(409,'This attempt has already been submitted.');
     return send(result,201);
    }
   }
   fail(404,'Not found.');
  }catch(e){return send({error:e.status?e.message:'Service unavailable. Please try again.'},e.status||500);}
 }
 function normalize(input){
  if(!input||typeof input!=='object'||Array.isArray(input)||Object.keys(input).some(k=>!['1','2'].includes(k)))fail(400,'Invalid responses.');
  const answers={1:{},2:{}};
  for(const m of [1,2]){
   const module=input[m]||{};if(typeof module!=='object'||Array.isArray(module))fail(400,'Invalid responses.');
   for(const n of Object.keys(module).sort((a,b)=>Number(a)-Number(b))){
    if(!/^(?:[1-9]|1\d|2[0-7])$/.test(n)||!/^[ABCD]$/.test(module[n]))fail(400,'Invalid responses.');
    answers[m][n]=module[n];
   }
  }return answers;
 }
 return {handle,close:()=>db.close()};
}
module.exports={createApp,passwordHash};
