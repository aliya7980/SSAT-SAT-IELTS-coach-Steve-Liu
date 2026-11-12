'use strict';
const fs=require('fs'),path=require('path'),assert=require('assert');
const root=path.resolve(__dirname,'../.site-public');
assert(fs.existsSync(root),'Build the static-only artifact first');
for(const name of ['sat-backend','.sat-private','tools','.git'])assert(!fs.existsSync(path.join(root,name)),'Private directory published: '+name);
function walk(dir){for(const entry of fs.readdirSync(dir,{withFileTypes:true})){
 const p=path.join(dir,entry.name);if(entry.isDirectory()){walk(p);continue;}
 assert(entry.name!=='answer-key.json'&&!/\.sqlite(?:-|$)/.test(entry.name),'Private file published: '+p);
 if(!/\.(js|html|json)$/.test(entry.name))continue;
 const text=fs.readFileSync(p,'utf8');
 assert(!/["']m[12]q\d+["']\s*:\s*["'][ABCD]["']/.test(text),'Answer mapping published: '+p);
 assert(!/["'](?:answerKey|correctAnswer|defaultKey)["']\s*:/.test(text),'Private field published: '+p);
}}
walk(path.join(root,'pages/SAT'));
console.log('Static release contains no SAT key files/mappings, private key fields, backend, runtime database, seed, tools, or Git directory.');
