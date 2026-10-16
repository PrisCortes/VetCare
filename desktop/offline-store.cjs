const {DatabaseSync}=require('node:sqlite');
const {mkdirSync}=require('node:fs');
const {join}=require('node:path');
const {createHash,randomUUID}=require('node:crypto');
const {encrypt,decrypt}=require('./offline-crypto.cjs');
function openOfflineStore(directory,key,accountId){
 if(!Buffer.isBuffer(key)||key.length!==32||!/^[a-f0-9]{32}$/.test(accountId))throw new Error('Almacén local no autorizado.');
 mkdirSync(directory,{recursive:true});const db=new DatabaseSync(join(directory,'clinical.sqlite'),{enableForeignKeyConstraints:true,timeout:5000});
 try{
 db.exec('PRAGMA journal_mode=WAL; PRAGMA synchronous=FULL; CREATE TABLE IF NOT EXISTS local_meta(key TEXT PRIMARY KEY,value TEXT NOT NULL) STRICT; CREATE TABLE IF NOT EXISTS entities(kind TEXT NOT NULL,id TEXT NOT NULL,payload TEXT NOT NULL,PRIMARY KEY(kind,id)) STRICT; CREATE TABLE IF NOT EXISTS versions(kind TEXT NOT NULL,id TEXT NOT NULL,revision TEXT NOT NULL,payload TEXT NOT NULL,PRIMARY KEY(kind,id,revision)) STRICT; CREATE TABLE IF NOT EXISTS pending(seq INTEGER PRIMARY KEY AUTOINCREMENT,operation_id TEXT UNIQUE NOT NULL,hash TEXT NOT NULL,payload TEXT NOT NULL,result TEXT NOT NULL) STRICT;');
 const schema=db.prepare('SELECT value FROM local_meta WHERE key=?').get('schema');if(schema&&schema.value!=='1'){db.close();throw new Error('Esquema local desconocido.');}
 db.prepare('INSERT OR IGNORE INTO local_meta VALUES(?,?)').run('schema','1');
 const bind=encrypt(key,{accountId},'binding');const existing=db.prepare('SELECT value FROM local_meta WHERE key=?').get('account');if(existing){if(decrypt(key,existing.value,'binding').accountId!==accountId){db.close();throw new Error('Cuenta local no válida.');}}else db.prepare('INSERT INTO local_meta VALUES(?,?)').run('account',bind);
 let closed=false;const check=()=>{if(closed)throw new Error('Almacén cerrado.');};
 const context=(kind,id)=>accountId+':'+kind+':'+id;
 const write=(kind,row)=>db.prepare('INSERT INTO entities VALUES(?,?,?) ON CONFLICT(kind,id) DO UPDATE SET payload=excluded.payload').run(kind,row.id,encrypt(key,row,context(kind,row.id)));
 const store={
  all(kind){check();return db.prepare('SELECT * FROM entities WHERE kind=?').all(kind).map(row=>decrypt(key,row.payload,context(kind,row.id)));},
  get(kind,id){check();const row=db.prepare('SELECT payload FROM entities WHERE kind=? AND id=?').get(kind,id);return row?decrypt(key,row.payload,context(kind,id)):null;},
  pendingCount(){check();return Number(db.prepare('SELECT COUNT(*) AS count FROM pending').get().count);},
  seed(data){check();if(store.pendingCount())return false;db.exec('BEGIN IMMEDIATE');try{db.exec('DELETE FROM entities; DELETE FROM versions;');for(const kind of ['owners','patients','consultations','authors'])for(const row of data[kind]||[])write(kind,{...row,syncState:'confirmed'});for(const row of data.consultations||[])db.prepare('INSERT INTO versions VALUES(?,?,?,?)').run('consultations',row.id,'central-'+row.version,encrypt(key,row,context('versions',row.id)));db.exec('COMMIT');return true;}catch(error){db.exec('ROLLBACK');throw error;}},
  mutate(action,input,kind,build){check();if(typeof input?.operationId!=='string'||!/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/.test(input.operationId))throw new Error('Operación local no válida.');const hash=createHash('sha256').update(JSON.stringify([action,input])).digest('hex');db.exec('BEGIN IMMEDIATE');try{const previous=db.prepare('SELECT * FROM pending WHERE operation_id=?').get(input.operationId);if(previous){if(previous.hash!==hash)throw new Error('La operación ya se utilizó con otros datos.');const result=decrypt(key,previous.result,context('results',input.operationId));db.exec('COMMIT');return result;}
   const built=build(),previousRow=store.get(kind,built.row.id),revision=randomUUID(),baseVersion=previousRow?.baseCentralVersion??(previousRow?.syncState==='confirmed'?previousRow.version:null),row={...built.row,syncState:'pending',localRevisionId:revision,baseCentralVersion:baseVersion};write(kind,row);db.prepare('INSERT INTO versions VALUES(?,?,?,?)').run(kind,row.id,revision,encrypt(key,row,context('versions',row.id)));const result={...built.result,local:true};for(const name of['owner','patient','consultation'])if(result[name]?.id===row.id)result[name]=row;
   const operation={action,input,entityId:row.id,accountId,revisionId:revision,previousRevisionId:previousRow?.localRevisionId??null,baseVersion,createdAt:new Date().toISOString()};db.prepare('INSERT INTO pending(operation_id,hash,payload,result) VALUES(?,?,?,?)').run(input.operationId,hash,encrypt(key,operation,context('operations',input.operationId)),encrypt(key,result,context('results',input.operationId)));db.exec('COMMIT');return result;
  }catch(error){db.exec('ROLLBACK');throw error;}},
  versions(kind,id){check();return db.prepare('SELECT payload FROM versions WHERE kind=? AND id=? ORDER BY rowid DESC').all(kind,id).map(row=>decrypt(key,row.payload,context('versions',id)));},
  close(){if(!closed){db.close();key.fill(0);closed=true;}}
 };return store;
 }catch(error){try{db.close();}catch{}throw error;}
}
module.exports={openOfflineStore};
