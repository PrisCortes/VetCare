import {escapeHtml as e} from './view-state.js';
import {request,isOffline,storageLabel} from './auth.js';
import {validateAttention} from './attention-validation.js';
const names={consulta:'Consulta',vacuna:'Vacunación',desparasitacion:'Desparasitación'};
export function consultationPreview(record){return `<dl><dt>Fecha</dt><dd>${e(record.date)}</dd><dt>Diagnóstico o motivo</dt><dd>${e(record.reason)}</dd><dt>Tratamiento</dt><dd>${e(record.treatment||'Sin tratamiento registrado')}</dd><dt>Observaciones</dt><dd>${e(record.notes||'Sin observaciones')}</dd>${[['weight','Peso',1000,'kg'],['temperature','Temperatura',100,'°C'],['heartRate','FC',1,'latidos/min'],['respiratoryRate','FR',1,'respiraciones/min']].filter(([key])=>record[key]!==null&&record[key]!==undefined).map(([key,label,scale,unit])=>`<dt>${label}</dt><dd>${e(record[key]/scale)} ${unit}</dd>`).join('')}${record.bloodPressure?`<dt>PA</dt><dd>${e(record.bloodPressure)} mmHg</dd>`:''}</dl>`;}
export function sanitaryPreview(record){return `<dl><dt>Fecha de aplicación</dt><dd>${e(record.date)}</dd><dt>${record.kind==='vacuna'?'Vacuna':'Desparasitante'}</dt><dd>${e(record.product)}</dd>${record.kind==='vacuna'?`<dt>Aplicación</dt><dd>${e(record.application||'Sin anotación adicional')}</dd>`:`${record.weight===null||record.weight===undefined?'':'<dt>Peso</dt><dd>'+e(record.weight/1000)+' kg</dd>'}`}<dt>Próxima fecha</dt><dd>${e(record.nextDate||'Sin fecha programada')}</dd></dl>`;}
export function mountAttention(panel,patient,{onDirty=()=>{},renderFields,initialConsultation=null}={}){
 let kind='consulta',dirty=false,busy=false,revision=0,editing=null,pending=null,savedRevision=-1,rows=[],page=1,more=false,loadSequence=0;
 const find=id=>panel.querySelector('#'+id),form=find('attention-form'),notice=find('attention-notice'),preview=find('attention-preview'),summary=find('attention-errors');
 const setDirty=value=>{dirty=value;onDirty(value);};
 const discard=()=>!dirty||window.confirm('¿Descartar la captura sin guardar? Si hubo un envío sin confirmar, revisa los registros antes de volver a crear la consulta.');
 function buttons(){const offlineSanitary=isOffline()&&kind!=='consulta';find('attention-save').hidden=kind==='seguimiento';find('attention-save').disabled=busy||revision===savedRevision||(!patient.active&&!editing)||offlineSanitary;find('attention-save').textContent=editing?'Guardar corrección':kind==='consulta'?'Guardar consulta':kind==='vacuna'?'Guardar vacunación':'Guardar desparasitación';}
 function errors(fields){
  form.querySelectorAll('[aria-invalid]').forEach(input=>input.removeAttribute('aria-invalid'));form.querySelectorAll('.field-error').forEach(span=>span.textContent='');
  const entries=Object.entries(fields);summary.hidden=!entries.length;summary.innerHTML=entries.length?'<strong>Revisa los campos:</strong><ul>'+entries.map(([key,message])=>`<li><button class="text-button" type="button" data-attention-error="${e(key)}">${e(message)}</button></li>`).join('')+'</ul>':'';
  for(const[key,message]of entries){form.elements[key]?.setAttribute('aria-invalid','true');const span=find('attention-error-'+key);if(span)span.textContent=message;}if(entries.length)summary.focus();
 }
 function paint(record=null){
  editing=record;pending=null;savedRevision=-1;revision++;find('attention-fields').innerHTML=renderFields(kind);find('attention-title').textContent=record?'Corregir '+names[kind].toLowerCase():names[kind];
  panel.querySelectorAll('[data-attention-kind]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.attentionKind===kind)));
  if(record){for(const key of['date','reason','treatment','notes','product','application','nextDate','bloodPressure'])if(form.elements[key])form.elements[key].value=record[key]??'';for(const[key,scale]of[['weight',1000],['temperature',100],['heartRate',1],['respiratoryRate',1]])if(form.elements[key])form.elements[key].value=record[key]===null||record[key]===undefined?'':String(record[key]/scale);}
  find('attention-mode').textContent=record?'Corrección del registro existente. Se conserva la versión anterior.':kind==='consulta'?'Guardar consulta confirma una atención realizada; Revisar captura solo valida.':isOffline()?'La captura sanitaria offline se habilitará junto con la sincronización. Con conexión, Guardar confirma el evento en MariaDB.':'Guardar confirma el evento sanitario en MariaDB; Revisar captura solo valida.';
  summary.hidden=true;preview.hidden=true;notice.textContent=patient.active?'':'Paciente inactivo: solo se permiten correcciones de registros existentes.';setDirty(false);buttons();
 }
 async function load(){
  const sequence=++loadSequence,label=kind==='consulta'?'consultas':kind==='vacuna'?'vacunaciones':'desparasitaciones';find('consultations-notice').textContent='Cargando '+label+'…';
  try{const source=kind==='consulta'?'consultations':'sanitaryEvents',result=await request(source,{patientId:patient.id,...(kind==='consulta'?{}:{kind}),page:String(page)});if(!panel.isConnected||sequence!==loadSequence)return;rows=kind==='consulta'?result.consultations:result.events;more=result.hasMore;find('consultations-title').textContent=kind==='consulta'?'Consultas registradas':'Eventos sanitarios registrados';find('consultations-rows').innerHTML=rows.length?rows.map(record=>`<article class="panel"><h3>${e(record.date)} · ${e(kind==='consulta'?record.reason:record.product)}</h3><p>${e(kind==='consulta'?(record.treatment||'Sin tratamiento registrado'):(record.nextDate?'Próxima fecha: '+record.nextDate:'Sin fecha programada'))}</p><small>Versión ${record.version} · Registro ${e(record.id)}</small><button class="text-button" type="button" data-attention-edit="${e(record.id)}">Abrir / corregir</button></article>`).join(''):`<p>No hay ${label} en esta página.</p>`;find('consultations-page').textContent='Página '+page;find('consultations-prev').disabled=page<=1;find('consultations-next').disabled=!more;find('consultations-notice').textContent='Registros recuperados de '+storageLabel()+'.';}
  catch(error){if(panel.isConnected)find('consultations-notice').textContent=error.message;}
 }
 function changed(){revision++;setDirty(true);preview.hidden=true;notice.textContent='Captura modificada.';buttons();}
 form.addEventListener('input',changed);form.addEventListener('change',changed);
 panel.addEventListener('click',event=>{
  const button=event.target.closest('button');if(!button)return;
  if(button.dataset.attentionError){form.elements[button.dataset.attentionError]?.focus();return;}
  if(busy)return;
  if(button.id==='consultations-load'){load();return;}
  if(button.id==='consultations-prev'&&page>1){page--;load();return;}
  if(button.id==='consultations-next'&&more){page++;load();return;}
  if(button.dataset.attentionEdit){const record=rows.find(item=>item.id===button.dataset.attentionEdit);if(record&&discard()){kind=record.kind||'consulta';paint(record);preview.innerHTML='<h3>'+e(kind==='consulta'?'Consulta registrada':'Evento sanitario registrado')+'</h3>'+(kind==='consulta'?consultationPreview(record):sanitaryPreview(record));preview.hidden=false;}return;}
  if(button.id==='attention-new'){if(discard())paint();return;}
  const next=button.dataset.attentionKind;if(next&&next!==kind&&discard()){kind=next;paint();}
 });
 form.addEventListener('submit',async event=>{
  event.preventDefault();if(busy)return;const save=event.submitter?.id==='attention-save';if(save&&revision===savedRevision){notice.textContent='Esta versión ya está guardada.';return;}
  const input={...Object.fromEntries(new FormData(form)),kind,patientId:patient.id,patientVersion:patient.version,...(editing?{id:editing.id,version:editing.version}:{})};
  const validation=validateAttention(input,{birthDate:editing?.ageSnapshot?.birthDate??patient.birthDate});errors(validation.errors);if(!validation.valid){notice.textContent='Corrige los campos indicados.';return;}
  const serialized=JSON.stringify(input);if(pending&&pending.serialized!==serialized){notice.textContent='Reintenta los mismos datos del envío sin confirmar, o revisa los registros antes de crear otra consulta.';return;}
  if(save){if(kind==='seguimiento'||(isOffline()&&kind!=='consulta'))return;pending??={serialized,operationId:crypto.randomUUID()};}
  const submittedRevision=revision;busy=true;form.querySelectorAll('input,textarea,button').forEach(control=>control.disabled=true);notice.textContent=save?'Guardando consulta…':'Validando…';
  try{
   const action=save?(kind==='consulta'?(editing?'updateConsultation':'createConsultation'):(editing?'updateSanitaryEvent':'createSanitaryEvent')):'validateAttention';const result=await request(action,save?{...input,operationId:pending.operationId}:input);if(!panel.isConnected)return;
   if(revision!==submittedRevision){notice.textContent='La captura cambió. Revisa los registros antes de continuar.';return;}
   if(save){const stored=kind==='consulta'?result.consultation:result.event;if(result.saved!==true||!stored?.id)throw new Error('No se confirmó el guardado.');editing=stored;pending=null;savedRevision=revision;setDirty(false);preview.innerHTML='<h3>'+e(kind==='consulta'?'Consulta':'Evento sanitario')+' guardado en '+e(storageLabel())+'</h3>'+(kind==='consulta'?consultationPreview(stored):sanitaryPreview(stored));preview.hidden=false;notice.textContent=`${kind==='consulta'?'Consulta':'Evento sanitario'} guardado · Versión ${editing.version}. Para otro registro pulsa Nuevo registro.`;page=1;await load();}
   else{if(result.validated!==true||result.saved!==false)throw new Error('No se confirmó la validación.');preview.innerHTML='<h3>Captura validada · No guardada</h3>'+(kind==='consulta'?consultationPreview(result.data):sanitaryPreview(result.data));preview.hidden=false;notice.textContent='Validación completada. No se guardó información.';}
  }catch(error){if(error.status&&error.status<500)pending=null;if(panel.isConnected){errors(error.fields??{});notice.textContent=error.message+(save?' No se confirmó el guardado; puedes reintentar los mismos datos.':' No se guardó información.');}}
  finally{busy=false;if(panel.isConnected){form.querySelectorAll('input,textarea,button').forEach(control=>control.disabled=false);buttons();}}
 });
 paint(initialConsultation);
}
