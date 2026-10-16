import {generateKeyPairSync,createPublicKey} from 'node:crypto';
import {mkdir,readFile,writeFile} from 'node:fs/promises';
import {join} from 'node:path';
import {root} from './environment.mjs';
const directory=join(root,'storage','server-keys'),privatePath=join(directory,'offline-private.pem'),publicPath=join(root,'config','offline-public.pem');
await mkdir(directory,{recursive:true});
let privateKey;
try{privateKey=await readFile(privatePath,'utf8');}catch(error){if(error.code!=='ENOENT')throw error;let existingPublic=false;try{await readFile(publicPath);existingPublic=true;}catch(readError){if(readError.code!=='ENOENT')throw readError;}if(existingPublic)throw new Error('Existe una clave pública y falta su privada. Restaura la privada original; no se generará otra automáticamente.');const keys=generateKeyPairSync('rsa',{modulusLength:2048,privateKeyEncoding:{type:'pkcs8',format:'pem'},publicKeyEncoding:{type:'spki',format:'pem'}});privateKey=keys.privateKey;await writeFile(privatePath,privateKey,{flag:'wx',mode:0o600});}
const publicKey=createPublicKey(privateKey).export({format:'pem',type:'spki'});
try{const existing=await readFile(publicPath,'utf8');if(existing!==publicKey)throw new Error('La clave pública existente no coincide. No se rotarán claves automáticamente.');}catch(error){if(error.code!=='ENOENT')throw error;await writeFile(publicPath,publicKey,{flag:'wx'});}
console.log('Claves preparadas. Conserva la privada solo en el backend. Configura en .env:');
console.log('OFFLINE_PRIVATE_KEY='+privatePath.replaceAll('\\','/'));
const environmentPath=join(root,'.env');
let environment;
try{environment=await readFile(environmentPath,'utf8');}catch(error){if(error.code!=='ENOENT')throw error;environment='';}
const setting='OFFLINE_PRIVATE_KEY='+privatePath.replaceAll('\\','/');
environment=/^OFFLINE_PRIVATE_KEY=.*$/m.test(environment)?environment.replace(/^OFFLINE_PRIVATE_KEY=.*$/m,setting):environment.replace(/\s*$/,'')+'\n'+setting+'\n';
await writeFile(environmentPath,environment);
console.log('Ruta configurada en .env sin mostrar ni cambiar las credenciales de MariaDB.');
