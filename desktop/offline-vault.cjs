const {randomUUID,randomBytes,createHash}=require('node:crypto');
const {mkdir}=require('node:fs/promises');
const {DatabaseSync}=require('node:sqlite');
const {join}=require('node:path');
const {passwordVerifier,verifyPassword,verifyLease}=require('./offline-crypto.cjs');
const {openOfflineStore}=require('./offline-store.cjs');
async function createOfflineVault({directory,publicKey,issuer,protector,clock=Date.now}){
 if(!await protector.available())throw new Error('La protección de claves de Windows no está disponible.');
 await mkdir(directory,{recursive:true});const vaultDb=new DatabaseSync(join(directory,'vault.sqlite'),{timeout:5000});vaultDb.exec('PRAGMA journal_mode=WAL; PRAGMA synchronous=FULL; CREATE TABLE IF NOT EXISTS protected_vault(id INTEGER PRIMARY KEY CHECK(id=1),payload BLOB NOT NULL) STRICT;');let state;
 const stored=vaultDb.prepare('SELECT payload FROM protected_vault WHERE id=1').get();
 try{state=stored?JSON.parse(await protector.decrypt(Buffer.from(stored.payload))):{schema:1,deviceId:randomUUID(),profiles:{},lastClock:clock()};}catch{vaultDb.close();throw new Error('No se pudo abrir la autorización local protegida.');}
 if(state.schema!==1){vaultDb.close();throw new Error('Autorización local de versión desconocida.');}
 async function persist(){const protectedData=await protector.encrypt(JSON.stringify(state));vaultDb.exec('BEGIN IMMEDIATE');try{vaultDb.prepare('INSERT INTO protected_vault(id,payload) VALUES(1,?) ON CONFLICT(id) DO UPDATE SET payload=excluded.payload').run(protectedData);vaultDb.exec('COMMIT');}catch(error){vaultDb.exec('ROLLBACK');throw error;}}
 try{await persist();}catch(error){vaultDb.close();throw error;}let current=null,store=null,lastActivity=0;
 function lock(){if(store)store.close();store=null;current=null;lastActivity=0;}
 function lease(profile){if(clock()<(profile.lastClock??state.lastClock)-120000)throw new Error('El reloj retrocedió. Renueva esta cuenta con conexión.');const claim=verifyLease(profile.lease,publicKey,{issuer,deviceId:state.deviceId,now:(clock()+profile.offset)/1000});profile.lastClock=Math.max(clock(),profile.lastClock??0);return claim;}
 async function observe(){const now=clock();if(now<state.lastClock-120000){lock();throw new Error('El reloj retrocedió. Renueva el acceso local con conexión.');}state.lastClock=Math.max(now,state.lastClock);await persist();}
 return {
  deviceId:state.deviceId,
  profiles(){return Object.entries(state.profiles).map(([id,profile])=>({id,name:profile.user.name,username:profile.user.username,expiresAt:JSON.parse(Buffer.from(profile.lease.payload,'base64url').toString('utf8')).expiresAt}));},
  async prepare(data,password){
   lock();const signed=JSON.parse(Buffer.from(data.lease.payload,'base64url').toString('utf8'));const claim=verifyLease(data.lease,publicKey,{issuer,deviceId:state.deviceId,now:signed.issuedAt});const id=claim.user.id,old=state.profiles[id];
   const profile={user:claim.user,lease:data.lease,offset:claim.issuedAt*1000-clock(),lastClock:clock(),verifier:passwordVerifier(password),key:old?.key??randomBytes(32).toString('base64'),failures:0,lockedUntil:0};state.lastClock=clock();
   const accountPath=join(directory,createHash('sha256').update(issuer+':'+id).digest('hex'));const local=openOfflineStore(accountPath,Buffer.from(profile.key,'base64'),id);
   let copied;try{copied=local.seed(data);}finally{local.close();}
   state.profiles[id]=profile;await persist();return {expiresAt:claim.expiresAt,copied,pendingPreserved:!copied};
  },
  async unlock(id,password){
   lock();await observe();const profile=state.profiles[id];if(!profile)throw new Error('No existe una cuenta preparada en este equipo.');
   const claim=lease(profile);if(clock()<profile.lockedUntil)throw new Error('Demasiados intentos locales. Espera cinco minutos.');
   if(!verifyPassword(password,profile.verifier)){profile.failures++;if(profile.failures>=5){profile.lockedUntil=clock()+300000;profile.failures=0;}await persist();throw new Error('Clave local incorrecta.');}
   profile.failures=0;profile.lockedUntil=0;await persist();
   const accountPath=join(directory,createHash('sha256').update(issuer+':'+id).digest('hex'));store=openOfflineStore(accountPath,Buffer.from(profile.key,'base64'),id);current=claim.user;lastActivity=clock();return {...current,offline:true,offlineRemainingMs:claim.expiresAt*1000-(clock()+profile.offset)};
  },
  async access(touch=true){if(!current||!store)throw new Error('Desbloquea tu cuenta local.');await observe();let claim;try{claim=lease(state.profiles[current.id]);if(clock()-lastActivity>=15*60000)throw new Error('La sesión local se bloqueó por inactividad.');}catch(error){lock();throw error;}if(touch)lastActivity=clock();return {user:{...current,offline:true,offlineRemainingMs:claim.expiresAt*1000-(clock()+state.profiles[current.id].offset)},store,now:clock()+state.profiles[current.id].offset};},
  lock,
  close(){lock();vaultDb.close();},
 };
}
module.exports={createOfflineVault};
