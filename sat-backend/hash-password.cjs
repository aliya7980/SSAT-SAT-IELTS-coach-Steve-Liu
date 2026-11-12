// Password comes from stdin, never shell arguments, source code, or a default value.
const {passwordHash}=require('./app.cjs');
(async()=>{let password='';for await(const chunk of process.stdin)password+=chunk;password=password.replace(/\r?\n$/,'');if(password.length<16)throw Error('Use a unique password of at least 16 characters.');console.log(await passwordHash(password));})().catch(()=>{console.error('Password hash generation failed. Use at least 16 characters on stdin.');process.exitCode=1;});
