const {randomUUID}=require('node:crypto');
const {pathToFileURL}=require('node:url');
const {join}=require('node:path');
const uuid=value=>typeof value==='string'&&/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/.test(value);
function fail(message,status=422){const error=new Error(message);error.status=status;throw error;}
function text(value,max,required=false){value??='';if(typeof value!=='string'||!value.isWellFormed()||[...value].length>max||/[\x00-\x08\x0B\x0C\x0E-\x1F]/.test(value)||(required&&!value.trim()))fail('Revisa los campos obligatorios y su longitud.');return value.trim();}
async function offlineAction(store,user,action,input={}, {nowMs=Date.now()}={}){
 if(!user||!/^[a-f0-9]{32}$/.test(user.id)||!['administrador','veterinario'].includes(user.role))fail('Acceso clínico local no autorizado.',403);
 const {validateAttention,validCalendarDate,todayMexico}=await import(pathToFileURL(join(__dirname,'..','web','attention-validation.js')).href);
 const all=kind=>store.all(kind),get=(kind,id)=>store.get(kind,id),now=Math.floor(nowMs/1000),today=new Intl.DateTimeFormat('en-CA',{timeZone:'America/Mexico_City',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date(nowMs));
 const namedPatient=p=>({...p,ownerName:get('owners',p.ownerId)?.name||''});
 const carnetPatient=p=>{const owner=get('owners',p.ownerId);return {...p,ownerName:owner?.name||'',ownerAddress:owner?.address||'',ownerLocality:owner?.locality||''};};
 const page=(rows,kind)=>{const number=Number(input.page??1);if(!Number.isInteger(number)||number<1||number>10000)fail('Página no válida.');const offset=(number-1)*50;return {[kind]:rows.slice(offset,offset+50),page:number,hasMore:rows.length>offset+50,local:true};};
 const checkPatient=()=>{if(!uuid(input.patientId))fail('Paciente no válido.');const patient=get('patients',input.patientId);if(!patient)fail('Paciente no encontrado.',404);if(patient.version!==input.patientVersion)fail('La ficha cambió. Selecciona de nuevo el paciente.',409);return patient;};
 if(action==='owners'||action==='patients'){
  let rows=all(action).map(row=>action==='patients'?namedPatient(row):row);const status=input.status??'active';if(!['active','inactive','all'].includes(status))fail('Filtro no válido.');if(status!=='all')rows=rows.filter(row=>row.active===(status==='active'));
  const term=text(input.q??'',200).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();const normalize=value=>String(value).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
  rows=rows.filter(row=>normalize(action==='owners'?`${row.name} ${row.phone} ${row.locality}`:`${row.name} ${row.breed} ${row.ownerName}`).includes(term));if(action==='patients'&&input.species)rows=rows.filter(row=>row.species===input.species);rows.sort((a,b)=>a.name.localeCompare(b.name)||a.id.localeCompare(b.id));return page(rows,action);
 }
 if(['createOwner','updateOwner','createPatient','updatePatient','createConsultation','updateConsultation'].includes(action)){
  const create=action.startsWith('create'),kind=action.endsWith('Owner')?'owners':action.endsWith('Patient')?'patients':'consultations';
  return store.mutate(action,input,kind,()=>{
   const old=create?null:get(kind,input.id);if(!create&&(!old||old.version!==input.version))fail('El registro cambió. Actualiza la vista antes de corregirlo.',409);
   let row,id=old?.id??randomUUID(),version=(old?.version??0)+1;const active=create?true:input.active;if(kind!=='consultations'&&typeof active!=='boolean')fail('Estado no válido.');
   if(kind==='owners'){
    if(!active&&all('patients').some(patient=>patient.ownerId===id&&patient.active))fail('No se puede dar de baja al propietario con pacientes activos.',409);
    row={id,name:text(input.name,200,true),phone:text(input.phone,50),address:text(input.address,500),locality:text(input.locality,200),active,version,updatedAt:now};
   }else if(kind==='patients'){
    if(!uuid(input.ownerId))fail('Selecciona un propietario.');const owner=get('owners',input.ownerId);if(!owner)fail('Propietario no encontrado.');if((create||active)&&!owner.active)fail('El propietario debe estar activo.',409);
    const birth=input.birthDate||null,age=input.ageValue??null,unit=input.ageUnit??null,reference=input.ageReference??null,hasAge=age!==null||unit!==null||reference!==null;
    if(['name','species','breed'].some(key=>typeof input[key]==='string'&&/[\x00-\x1F]/.test(input[key])))fail('La identificación no admite caracteres de control.');if(birth&&(!validCalendarDate(birth)||birth>today))fail('Nacimiento no válido.');if(birth&&hasAge||hasAge&&(!Number.isInteger(age)||age<0||age>2147483647||!['dias','meses','anios'].includes(unit)||!validCalendarDate(reference)||reference>today))fail('Revisa los datos de edad.');
    row={id,ownerId:input.ownerId,ownerName:owner.name,name:text(input.name,200,true),species:text(input.species,80,true),breed:text(input.breed,200),birthDate:birth,ageValue:age,ageUnit:unit,ageReference:reference,active,version,updatedAt:now};
   }else{
    const patient=checkPatient();if(input.kind!=='consulta')fail('Solo se guardan consultas.');if(create&&!patient.active)fail('Paciente inactivo.',409);if(old&&old.patientId!==input.patientId)fail('No se puede cambiar el paciente de una consulta.',409);
    const ageSnapshot=old?.ageSnapshot??{birthDate:patient.birthDate,ageValue:patient.ageValue,ageUnit:patient.ageUnit,ageReference:patient.ageReference,patientVersion:patient.version};
    const validation=validateAttention(input,{birthDate:ageSnapshot.birthDate,today});if(!validation.valid){const error=new Error('Revisa los campos indicados.');error.fields=validation.errors;error.status=422;throw error;}
    row={id,patientId:patient.id,...validation.data,ageSnapshot,version,createdBy:old?.createdBy??user.id,updatedBy:user.id,createdAt:old?.createdAt??now,updatedAt:now};
   }
   const result={local:true};result[kind==='owners'?'owner':kind==='patients'?'patient':'consultation']={...row,syncState:'pending'};if(kind==='consultations')result.saved=true;
   return {row,result,baseVersion:old?.syncState==='pending'?null:old?.version??null};
  });
 }
 if(action==='validateAttention'){
  const patient=checkPatient();let birth=patient.birthDate,correction=null;
  if(input.id){correction=get('consultations',input.id);if(!correction||correction.patientId!==patient.id||correction.version!==input.version)fail('Consulta desactualizada.',409);birth=correction.ageSnapshot.birthDate;}
  if(!patient.active&&!correction)fail('Paciente inactivo.',409);const validation=validateAttention(input,{birthDate:birth,today});if(!validation.valid){const error=new Error('Revisa los campos indicados.');error.status=422;error.fields=validation.errors;throw error;}return {validated:true,saved:false,local:true,patient:namedPatient(patient),data:validation.data};
 }
 if(action==='carnet'){
  if(!uuid(input.patientId))fail('Paciente no válido.');const patient=get('patients',input.patientId);if(!patient)fail('Paciente no encontrado.',404);return {patient:carnetPatient(patient),local:true};
 }
 if(['consultations','history','consultationVersions'].includes(action)){
  const patient=get('patients',input.patientId);if(!patient)fail('Paciente no encontrado.',404);const authors=new Map(all('authors').map(author=>[author.id,author.name]));authors.set(user.id,user.name);
  let rows=all('consultations').filter(row=>row.patientId===patient.id).sort((a,b)=>b.date.localeCompare(a.date)||b.id.localeCompare(a.id));
  if(action==='consultations'){const number=Number(input.page??1);if(!Number.isInteger(number)||number<1)fail('Página no válida.');const offset=(number-1)*20;return {consultations:rows.slice(offset,offset+20),page:number,hasMore:rows.length>offset+20,local:true};}
  if(action==='consultationVersions'){const record=get('consultations',input.consultationId);if(!record||record.patientId!==patient.id)fail('Consulta no encontrada.',404);const versions=store.versions('consultations',record.id).filter(row=>!input.before||row.version<Number(input.before));return {patientId:patient.id,consultationId:record.id,currentVersion:record.version,versions:versions.slice(0,20).map(row=>({version:row.version,actorName:authors.get(row.updatedBy)||'Autor registrado',createdAt:row.updatedAt,snapshot:row})),nextBefore:versions.length>20?String(versions[19].version):null,local:true};}
  const total=rows.length,weight=rows.find(row=>row.weight!==null);if(input.from&&!validCalendarDate(input.from)||input.to&&!validCalendarDate(input.to)||input.from&&input.to&&input.from>input.to)fail('Intervalo no válido.');
  const term=text(input.q??'',200).toLowerCase();rows=rows.filter(row=>(!input.from||row.date>=input.from)&&(!input.to||row.date<=input.to)&&`${row.reason} ${row.treatment??''} ${row.notes??''}`.toLowerCase().includes(term));
  if(input.cursor){let cursor;try{cursor=JSON.parse(Buffer.from(input.cursor,'base64url').toString('utf8'));}catch{fail('Cursor no válido.');}if(!validCalendarDate(cursor.date)||!uuid(cursor.id))fail('Cursor no válido.');rows=rows.filter(row=>row.date<cursor.date||row.date===cursor.date&&row.id<cursor.id);}
  const more=rows.length>20,items=rows.slice(0,20),last=items.at(-1);return {patient:namedPatient(patient),consultations:items.map(row=>({...row,createdByName:authors.get(row.createdBy)||'Autor registrado',updatedByName:authors.get(row.updatedBy)||'Autor registrado'})),nextCursor:more?Buffer.from(JSON.stringify({date:last.date,id:last.id})).toString('base64url'):null,totalConsultations:total,latestConsultationWeight:weight?{consultationId:weight.id,date:weight.date,grams:weight.weight}:null,local:true};
 }
 fail('Esta acción necesita conexión y permisos centrales.',403);
}
module.exports={offlineAction};
