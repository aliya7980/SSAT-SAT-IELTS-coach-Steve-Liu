(() => {
 const base=String(window.SAT_API_BASE||'').replace(/\/$/,'');
 let token=null,expiryTimer=null,onExpire=()=>{},authGeneration=0;
 const id=window.SAT_ACTIVE_TEST.id;
 const codeKey=`hd_sat_${id}_access`;
 const safeFields=['id','testId','testName','name','date','answers','secondsUsed','serverId'];
 // Retire old embedded keys and question snapshots without deleting student responses.
 for(const key of Object.keys(localStorage)){
  if(!key.startsWith('hd_sat_'))continue;
  if(key==='hd_sat_key'||key.endsWith('_key')){localStorage.removeItem(key);continue;}
  if(key==='hd_sat_attempts'||key.endsWith('_attempts')){
   try{
    const items=JSON.parse(localStorage.getItem(key));
    if(Array.isArray(items))localStorage.setItem(key,JSON.stringify(items.map(item=>Object.fromEntries(safeFields.filter(k=>item[k]!==undefined).map(k=>[k,item[k]])))));
   }catch{localStorage.removeItem(key);}
  }
 }
 function logoutLocal(){authGeneration++;token=null;clearTimeout(expiryTimer);onExpire();}
 async function request(route,{method='GET',data,teacher=false}={}){
  if(!base)throw Error('Secure grading has not been configured yet. Your responses remain saved on this device.');
  const origin=new URL(base,location.href);
  if(origin.protocol!=='https:'&&!['localhost','127.0.0.1'].includes(origin.hostname))throw Error('The grading service must use HTTPS.');
  const headers={};if(data!==undefined)headers['Content-Type']='application/json';
  if(teacher){if(!token)throw Error('Teacher sign-in required.');headers.Authorization=`Bearer ${token}`;}
  const requestToken=token;
  let response;
  try{response=await fetch(base+route,{method,headers,body:data===undefined?undefined:JSON.stringify(data),cache:'no-store',credentials:'omit'});}
  catch{throw Error('Cannot reach secure grading. Your responses remain saved. Try again later.');}
  const json=await response.json();
  if(teacher&&requestToken!==token)throw Error('Teacher session ended. Sign in again.');
  if(!response.ok){if(teacher&&response.status===401)logoutLocal();throw Error(json.error||'Request failed.');}
  return json;
 }
 const student=(action,data={})=>request('/api/student/'+action,{method:'POST',data:{...data,testId:id,code:sessionStorage.getItem(codeKey)||''}});
 window.SAT_API={
  configured:Boolean(base),
  setAccessCode(code){sessionStorage.setItem(codeKey,code.trim());},
  hasAccessCode(){return Boolean(sessionStorage.getItem(codeKey));},
  student,
  async signIn(password){const generation=authGeneration;const session=await request('/api/teacher/login',{method:'POST',data:{password}});if(generation!==authGeneration)throw Error('Teacher session ended. Sign in again.');token=session.token;clearTimeout(expiryTimer);expiryTimer=setTimeout(logoutLocal,Math.max(0,session.expires-Date.now()));},
  async signOut(){try{if(token)await request('/api/teacher/logout',{method:'POST',teacher:true});}finally{logoutLocal();}},
  onExpire(fn){onExpire=fn;},
  teacher(action,method='GET',data){return request(`/api/teacher/tests/${id}/${action}`,{teacher:true,method,data});}
 };
 window.addEventListener('pagehide',logoutLocal);
})();
