'use strict';
const http=require('node:http'),fs=require('node:fs'),path=require('node:path');
const {createApp}=require('./app.cjs');
const dbPath=process.env.SAT_DB_PATH;
if(!dbPath||!path.isAbsolute(dbPath))throw Error('SAT_DB_PATH must point to a private persistent volume.');
fs.mkdirSync(path.dirname(dbPath),{recursive:true,mode:0o700});
const seed=process.env.SAT_KEYS_JSON?JSON.parse(process.env.SAT_KEYS_JSON):{};
const app=createApp({dbPath,passwordDigest:process.env.SAT_TEACHER_PASSWORD_HASH,origins:(process.env.SAT_ALLOWED_ORIGINS||'').split(',').map(s=>s.trim()).filter(Boolean),seed});
fs.chmodSync(dbPath,0o600);
http.createServer(async(req,res)=>{
 try {
 const chunks=[];let size=0;
 for await(const chunk of req){size+=chunk.length;if(size>32000){res.writeHead(413);res.end();return;}chunks.push(chunk);}
  const request=new Request('http://service'+req.url,{method:req.method,headers:req.headers,...(!['GET','HEAD'].includes(req.method)?{body:Buffer.concat(chunks)}:{})});
  // Trust only the socket address. Configure proxy-aware limiting at the hosting edge.
  const response=await app.handle(request,{ip:req.socket.remoteAddress});
  res.writeHead(response.status,Object.fromEntries(response.headers));res.end(await response.text());
 }catch{res.writeHead(400,{'Cache-Control':'no-store'});res.end();}
}).listen(Number(process.env.PORT||3000),'0.0.0.0',()=>console.log('SAT grading API ready'));
