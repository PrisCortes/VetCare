import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {generateKeyPairSync,sign,randomBytes,randomUUID} from 'node:crypto';
import {mkdtempSync,readdirSync,readFileSync,rmSync,mkdirSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join,resolve,sep} from 'node:path';
import {root,phpCommand} from '../scripts/environment.mjs';
import {spawnSync} from 'node:child_process';
import {writeFileSync} from 'node:fs';
const require=createRequire(import.meta.url),{encrypt,decrypt,verifyLease}=require('../desktop/offline-crypto.cjs'),{openOfflineStore}=require('../desktop/offline-store.cjs'),{offlineAction}=require('../desktop/offline-domain.cjs'),{createOfflineVault}=require('../desktop/offline-vault.cjs');
const pair=generateKeyPairSync('rsa',{modulusLength:2048}),issuer='http://127.0.0.1:5173',user={id:'a'.repeat(32),name:'Cuenta A',username:'test-a',role:'veterinario',active:true};
function fixture(t){const parent=join(root,'storage','test-offline');mkdirSync(parent,{recursive:true});const dir=mkdtempSync(join(parent,'case-'));t.after(()=>{assert.ok(resolve(dir).startsWith(resolve(parent)+sep));rmSync(dir,{recursive:true,force:true});});return dir;}
function lease(deviceId,at,identity=user){const payload=Buffer.from(JSON.stringify({schema:1,issuer,deviceId,user:identity,permissions:['clinical.read','clinical.write'],issuedAt:Math.floor(at/1000),expiresAt:Math.floor(at/1000)+72*3600})).toString('base64url');return {payload,signature:sign('RSA-SHA256',Buffer.from(payload),pair.privateKey).toString('base64url')};}
const publicKey=pair.publicKey.export({format:'pem',type:'spki'});
test('sin protección del sistema operativo no se habilita almacenamiento de claves en claro',async t=>{const dir=fixture(t);await assert.rejects(()=>createOfflineVault({directory:dir,publicKey,issuer,protector:{available:async()=>false}}));assert.equal(readdirSync(dir).length,0);});
test('firma PHP interoperable con la verificación de Electron/Node',t=>{
 const dir=fixture(t),path=join(dir,'test-private.pem');writeFileSync(path,pair.privateKey.export({format:'pem',type:'pkcs8'}));const deviceId=randomUUID(),php=phpCommand();
 const code=`require 'server/auth.php';require 'server/owners.php';require 'server/offline.php';$actor=json_decode(stream_get_contents(STDIN),true,8,JSON_THROW_ON_ERROR);$actor['authenticated_at']=time();echo json_encode(\\VetCare\\issueOfflineLease($actor,$argv[1]),JSON_THROW_ON_ERROR);`;
 const result=spawnSync(php.binary,[...php.args,'-r',code,deviceId],{cwd:root,encoding:'utf8',windowsHide:true,input:JSON.stringify(user),env:{...process.env,APP_ORIGIN:issuer,OFFLINE_PRIVATE_KEY:path}});assert.equal(result.status,0,result.stderr);assert.equal(result.stderr,'');assert.equal(verifyLease(JSON.parse(result.stdout),publicKey,{issuer,deviceId}).user.id,user.id);
});
test('cifrado local autentica contenido y cuenta; no acepta alteración ni otra clave',()=>{const key=randomBytes(32),data=encrypt(key,{name:'privado'},'account-a');assert.deepEqual(decrypt(key,data,'account-a'),{name:'privado'});assert.throws(()=>decrypt(key,data,'account-b'));assert.throws(()=>decrypt(randomBytes(32),data,'account-a'));const altered=JSON.parse(data);altered.tag=randomBytes(16).toString('base64');assert.throws(()=>decrypt(key,JSON.stringify(altered),'account-a'));});
test('permiso firmado rechaza equipo, emisor, firma y expiración incorrectos',()=>{const now=Date.now(),deviceId=randomUUID(),token=lease(deviceId,now);assert.equal(verifyLease(token,publicKey,{issuer,deviceId,now:now/1000}).user.id,user.id);assert.throws(()=>verifyLease(token,publicKey,{issuer,deviceId:randomUUID()}));assert.throws(()=>verifyLease(token,publicKey,{issuer:'https://other.example',deviceId}));assert.throws(()=>verifyLease({...token,payload:token.payload+'A'},publicKey,{issuer,deviceId}));assert.throws(()=>verifyLease(token,publicKey,{issuer,deviceId,now:now/1000+72*3600+1}));});
test('SQLite: propietarios, pacientes y consulta persisten con cola atómica e idempotencia',async t=>{
 const dir=fixture(t),originalKey=randomBytes(32);let store=openOfflineStore(dir,Buffer.from(originalKey),user.id);
 const input={operationId:randomUUID(),name:'PERSONA_PRIVADA_T25',phone:'00123'};const owner=(await offlineAction(store,user,'createOwner',input)).owner;
 assert.equal((await offlineAction(store,user,'createOwner',input)).owner.id,owner.id);assert.equal(store.pendingCount(),1);await assert.rejects(()=>offlineAction(store,user,'createOwner',{...input,name:'otra'}));
 const patient=(await offlineAction(store,user,'createPatient',{operationId:randomUUID(),name:'Paciente privado',species:'Cabra',ownerId:owner.id})).patient;
 const consultation=(await offlineAction(store,user,'createConsultation',{operationId:randomUUID(),kind:'consulta',patientId:patient.id,patientVersion:1,date:'2026-01-01',reason:'Revisión local',weight:'0,001'})).consultation;
 assert.equal(consultation.weight,1);assert.equal(store.pendingCount(),3);await assert.rejects(()=>offlineAction(store,user,'updateOwner',{...owner,operationId:randomUUID(),active:false}));assert.equal(store.pendingCount(),3);
 assert.throws(()=>store.mutate('createOwner',{operationId:randomUUID()},'owners',()=>({row:{id:randomUUID(),name:1n},result:{}})));assert.equal(store.pendingCount(),3);
 store.close();for(const file of readdirSync(dir))assert.ok(!readFileSync(join(dir,file)).includes(Buffer.from('PERSONA_PRIVADA_T25')));
 store=openOfflineStore(dir,Buffer.from(originalKey),user.id);assert.equal(store.get('owners',owner.id).phone,'00123');assert.equal(store.get('consultations',consultation.id).reason,'Revisión local');assert.equal(store.pendingCount(),3);assert.equal(store.seed({owners:[],patients:[],consultations:[]}),false);store.close();assert.throws(()=>openOfflineStore(dir,randomBytes(32),'b'.repeat(32)));
});
test('bóveda: desbloqueo tras reinicio, aislamiento, inactividad y vencimiento sin borrar pendientes',async t=>{
 const dir=fixture(t),osKey=randomBytes(32);let now=Date.now();
 // Protector simulado para prueba portable; no acredita DPAPI real.
 const protector={available:async()=>true,encrypt:async value=>Buffer.from(encrypt(osKey,value,'vault-test')),decrypt:async value=>decrypt(osKey,value.toString(),'vault-test')};
 let vault=await createOfflineVault({directory:dir,publicKey,issuer,protector,clock:()=>now});
 await vault.prepare({lease:lease(vault.deviceId,now),owners:[],patients:[],consultations:[],authors:[]},'clave-local-separada');await vault.unlock(user.id,'clave-local-separada');let context=await vault.access();await offlineAction(context.store,context.user,'createOwner',{operationId:randomUUID(),name:'Pendiente conservado'});vault.close();
 vault=await createOfflineVault({directory:dir,publicKey,issuer,protector,clock:()=>now});await assert.rejects(()=>vault.unlock(user.id,'incorrecta'));await vault.unlock(user.id,'clave-local-separada');assert.equal((await vault.access()).store.pendingCount(),1);
 now+=15*60000;await assert.rejects(()=>vault.access(false));await vault.unlock(user.id,'clave-local-separada');now+=72*3600*1000;await assert.rejects(()=>vault.access());
 const renewed=await vault.prepare({lease:lease(vault.deviceId,now),owners:[],patients:[],consultations:[],authors:[]},'clave-local-renovada');assert.equal(renewed.pendingPreserved,true);await vault.unlock(user.id,'clave-local-renovada');assert.equal((await vault.access()).store.pendingCount(),1);vault.lock();
 const other={...user,id:'b'.repeat(32),name:'Cuenta B'};await vault.prepare({lease:lease(vault.deviceId,now,other),owners:[],patients:[],consultations:[],authors:[]},'clave-local-cuenta-b');await vault.unlock(other.id,'clave-local-cuenta-b');assert.equal((await vault.access()).store.pendingCount(),0);vault.lock();await vault.unlock(user.id,'clave-local-renovada');assert.equal((await vault.access()).store.all('owners')[0].name,'Pendiente conservado');now-=300000;await assert.rejects(()=>vault.access());vault.close();
});
test('controlador: no usa red en modo local, bloquea administración y conserva pendientes al reiniciar',async t=>{
 const {createOfflineController}=require('../desktop/offline-controller.cjs'),dir=fixture(t),osKey=randomBytes(32),calls=[];
 const safeStorage={isAsyncEncryptionAvailable:async()=>true,encryptStringAsync:async value=>Buffer.from(encrypt(osKey,value,'os-test')),decryptStringAsync:async value=>decrypt(osKey,value.toString(),'os-test')};
 const remote=async(action,data)=>{calls.push(action);if(action==='offlineBootstrap')return {status:200,data:{lease:lease(data.deviceId,Date.now()),owners:[],patients:[],consultations:[],authors:[]}};return {status:200,data:{user}};};remote.clearSession=()=>{};
 let controller=createOfflineController({directory:dir,origin:issuer,remote,safeStorage,trustedPublicKey:publicKey});
 assert.equal((await controller.command('prepare',{password:'clave-local-separada'})).ok,true);assert.equal((await controller.command('unlock',{id:user.id,password:'clave-local-separada'})).ok,true);const networkCount=calls.length;
 assert.equal((await controller.route('createOwner',{operationId:randomUUID(),name:'Sin conexión'})).data.local,true);assert.equal((await controller.route('owners')).data.owners[0].name,'Sin conexión');assert.equal((await controller.route('users')).status,403);assert.equal(calls.length,networkCount);await controller.route('logout');controller.close();
 controller=createOfflineController({directory:dir,origin:issuer,remote,safeStorage,trustedPublicKey:publicKey});assert.equal((await controller.command('unlock',{id:user.id,password:'clave-local-separada'})).ok,true);assert.equal((await controller.command('status')).pending,1);controller.close();
});
