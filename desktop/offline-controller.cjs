const {readFile}=require('node:fs/promises');
const {join}=require('node:path');
const {createOfflineVault}=require('./offline-vault.cjs');
const {offlineAction}=require('./offline-domain.cjs');
function createOfflineController({directory,origin,remote,safeStorage,trustedPublicKey=null}){
 let vaultPromise=null,vault=null,mode='online',onlineUser=null;
 const getVault=async()=>{
  if(!vaultPromise)vaultPromise=(async()=>{
   const publicKey=trustedPublicKey??await readFile(join(__dirname,'..','config','offline-public.pem'),'utf8');
   vault=await createOfflineVault({directory,issuer:origin,publicKey,protector:{available:()=>safeStorage.isAsyncEncryptionAvailable(),encrypt:text=>safeStorage.encryptStringAsync(text),decrypt:async data=>{const value=await safeStorage.decryptStringAsync(data);return typeof value==='string'?value:value.result;}}});return vault;
  })().catch(error=>{vaultPromise=null;const detail=error instanceof Error&&error.message?': '+error.message:'';throw new Error('No se pudo abrir el acceso local'+detail);});
  return vaultPromise;
 };
 const delay=attempts=>Math.min(300000,1000*(2**Math.min(8,attempts)));
 const synchronize=async user=>{
  let store;try{const local=await getVault();store=local.openForSync(user.id);}catch(error){return {attempted:0,applied:0,retry:0,blocked:0,skipped:true,message:error.message};}
  let attempted=0,applied=0,retry=0,blocked=0;
  try{for(let index=0;index<25;index++){
   const available=store.nextPending(Date.now());if(!available)break;const pending=store.beginPending(available.operationId,Date.now());attempted++;
   const response=await remote('syncPush',{operations:[pending.operation]});
   if(response.status!==200){store.retryPending(pending.operationId,'No se confirmó el envío al servidor.',Date.now()+delay(pending.attempts));retry++;break;}
   const outcome=response.data?.results?.find(item=>item?.operationId===pending.operationId);
   if(outcome?.status==='applied'){store.confirmPending(pending.operationId,outcome.entity);applied++;continue;}
   if(outcome?.status==='retry'){store.retryPending(pending.operationId,outcome.message||'El servidor pidió reintentar.',Date.now()+delay(pending.attempts));retry++;break;}
   store.blockPending(pending.operationId,outcome?.message||'El servidor rechazó la operación.');blocked++;break;
  }return {attempted,applied,retry,blocked,queue:store.pendingSummary()};}finally{store.close();}
 };
 const errorResponse=(error,status=422)=>({status:error.status??status,data:{error:{code:'OFFLINE_ERROR',message:error.message},fields:error.fields??{}}});
 return {
  async command(action,data={}){
   try{
    const local=await getVault();
    if(action==='profiles')return {ok:true,profiles:local.profiles()};
    if(action==='status'){if(mode!=='offline')return {ok:true,offline:false};const context=await local.access(false),queue=context.store.pendingSummary();return {ok:true,offline:true,pending:queue.total,queue};}
    if(action==='pending'){if(mode!=='offline')throw new Error('Desbloquea tu cuenta local para consultar pendientes.');const context=await local.access(false);return {ok:true,queue:context.store.pendingSummary(),entries:context.store.pendingEntries()};}
    if(action==='activity'){if(mode==='offline')await local.access(true);return {ok:true};}
    if(action==='prepare'){
     if(mode!=='online')throw new Error('Inicia sesión con conexión para preparar o renovar este equipo.');
     // Validar la clave antes de exportar datos centrales.
     require('./offline-crypto.cjs').passwordVerifier(data.password);
     const result=await remote('offlineBootstrap',{deviceId:local.deviceId});if(result.status!==200)throw new Error(result.data.error?.message||'No se pudo autorizar el equipo.');
     const prepared=await local.prepare(result.data,data.password);return {ok:true,...prepared};
    }
    if(action==='sync'){if(mode!=='online'||!onlineUser)throw new Error('Inicia sesión con conexión antes de sincronizar.');return {ok:true,...await synchronize(onlineUser)};}
    if(action==='unlock'){const user=await local.unlock(data.id,data.password);mode='offline';return {ok:true,user};}
    if(action==='lock'){local.lock();mode='online';remote.clearSession();return {ok:true};}
    throw new Error('Acción local no permitida.');
   }catch(error){return {ok:false,message:error.message};}
  },
  async route(action,data){
   if(action==='offlineBootstrap')return errorResponse(new Error('Utiliza la preparación de acceso local.'),403);
   if(action==='login'){const result=await remote(action,data);if(result.status===200){vault?.lock();mode='online';onlineUser=result.data.user;result.data.sync=await synchronize(onlineUser);}return result;}
   if(mode!=='offline'){const result=await remote(action,data);if(action==='logout'&&result.status===200)onlineUser=null;return result;}
   if(action==='logout'){vault?.lock();mode='online';onlineUser=null;remote.clearSession();return {status:200,data:{ok:true}};}
   let context;
   try{context=await vault.access(action!=='session');}catch(error){vault?.lock();return errorResponse(error,401);}
   try{
    if(action==='session'){const queue=context.store.pendingSummary();return {status:200,data:{user:context.user,local:true,pending:queue.total,queue}};}
    const result=await offlineAction(context.store,context.user,action,data??{} ,{nowMs:context.now}),queue=context.store.pendingSummary();return {status:200,data:{...result,pending:queue.total,queue}};
   }catch(error){return errorResponse(error);}
  },
  close(){vault?.close();}
 };
}
module.exports={createOfflineController};
