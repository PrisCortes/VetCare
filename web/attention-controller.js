import {escapeHtml as e} from './view-state.js';
import {request,isOffline,storageLabel} from './auth.js';
import {validateAttention} from './attention-validation.js';
const names={consulta:'Consulta',vacuna:'Vacunación',desparasitacion:'Desparasitación'};
export function consultationPreview(record){return `<dl><dt>Fecha</dt><dd>${e(record.date)}</dd><dt>Diagnóstico o motivo</dt><dd>${e(record.reason)}</dd><dt>Tratamiento</dt><dd>${e(record.treatment||'Sin tratamiento registrado')}</dd><dt>Observaciones</dt><dd>${e(record.notes||'Sin observaciones')}</dd>${[['weight','Peso',1000,'kg'],['temperature','Temperatura',100,'°C'],['heartRate','FC',1,'latidos/min'],['respiratoryRate','FR',1,'respiraciones/min']].filter(([key])=>record[key]!==null&&record[key]!==undefined).map(([key,label,scale,unit])=>`<dt>${label}</dt><dd>${e(record[key]/scale)} ${unit}</dd>`).join('')}</dl>`;}
export function mountAttention(panel,patient,{onDirty=()=>{},renderFields,initialConsultation=null}={}){
 let kind='consulta',dirty=false,busy=false,revision=0,editing=null,pending=null,savedRevision=-1,rows=[],page=1,more=false,loadSequence=0;
 const find=id=>panel.querySelector('#'+id),form=find('attention-form'),notice=find('attention-notice'),preview=find('attention-preview'),summary=find('attention-errors');
 const setDirty=value=>{dirty=value;onDirty(value);};
 const discard=()=>!dirty||window.confirm('¿Descartar la captura sin guardar? Si hubo un envío sin confirmar, revisa los registros antes de volver a crear la consulta.');
 function buttons(){find('attention-save').hidden=kind!=='consulta';find('attention-save').disabled=busy||revision===savedRevision||(!patient.active&&!editing);find('attention-save').textContent=editing?'Guardar corrección':'Guardar consulta';}
 function errors(fields){
  form.querySelectorAll('[aria-invalid]').forEach(input=>input.removeAttribute('aria-invalid'));form.querySelectorAll('.field-error').forEach(span=>span.textContent='');
  const entries=Object.entries(fields);summary.hidden=!entries.length;summary.innerHTML=entries.length?'<strong>Revisa los campos:</strong><ul>'+entries.map(([key,message])=>`<li><button class="text-button" type="button" data-attention-error="${e(key)}">${e(message)}</button></li>`).join('')+'</ul>':'';
  for(const[key,message]of entries){form.elements[key]?.setAttribute('aria-invalid','true');const span=find('attention-error-'+key);if(span)span.textContent=message;}if(entries.length)summary.focus();
 }
 function paint(record=null){
  editing=record;pending=null;savedRevision=-1;revision++;find('attention-fields').innerHTML=renderFields(kind);find('attention-title').textContent=record?'Corregir consulta':names[kind];
  panel.querySelectorAll('[data-attention-kind]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.attentionKind===kind)));
  if(record){for(const key of['date','reason','treatment','notes'])form.elements[key].value=record[key]??'';for(const[key,scale]of[['weight',1000],['temperature',100],['heartRate',1],['respiratoryRate',1]])form.elements[key].value=record[key]===null?'':String(record[key]/scale);}
  find('attention-mode').textContent=record?'Corrección del registro existente. Se conserva la versión anterior y la edad capturada originalmente.':kind==='consulta'?'Guardar consulta confirma una atención realizada; Revisar captura solo valida.':'Este formulario solo valida. El guardado de vacunas y desparasitaciones aún no está habilitado.';
  summary.hidden=true;preview.hidden=true;notice.textContent=patient.active?'':'Paciente inactivo: solo se permiten correcciones de consultas existentes.';setDirty(false);buttons();
 }
 async function load(){
  const sequence=++loadSequence;find('consultations-notice').textContent='Cargando consultas…';
  try{const result=await request('consultations',{patientId:patient.id,page:String(page)});if(!panel.isConnected||sequence!==loadSequence)return;rows=result.consultations;more=result.hasMore;find('consultations-rows').innerHTML=rows.length?rows.map(record=>`<article class="panel"><h3>${e(record.date)} · ${e(record.reason)}</h3><p>${e(record.treatment||'Sin tratamiento registrado')}</p><small>Versión ${record.version} · Registro ${e(record.id)}</small><button class="text-button" type="button" data-consultation-edit="${e(record.id)}">Abrir / corregir</button></article>`).join(''):'<p>No hay consultas registradas en esta página.</p>';find('consultations-page').textContent='Página '+page;find('consultations-prev').disabled=page<=1;find('consultations-next').disabled=!more;find('consultations-notice').textContent='Registros recuperados de '+storageLabel()+'.';}
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
  if(button.dataset.consultationEdit){const record=rows.find(item=>item.id===button.dataset.consultationEdit);if(record&&discard()){kind='consulta';paint(record);preview.innerHTML='<h3>Consulta registrada</h3>'+consultationPreview(record);preview.hidden=false;}return;}
  if(button.id==='attention-new'){if(discard()){kind='consulta';paint();}return;}
  const next=button.dataset.attentionKind;if(next&&next!==kind&&discard()){kind=next;paint();}
 });
 form.addEventListener('submit',async event=>{
  event.preventDefault();if(busy)return;const save=event.submitter?.id==='attention-save';if(save&&revision===savedRevision){notice.textContent='Esta versión ya está guardada.';return;}
  const input={...Object.fromEntries(new FormData(form)),kind,patientId:patient.id,patientVersion:patient.version,...(editing?{id:editing.id,version:editing.version}:{})};
  const validation=validateAttention(input,{birthDate:editing?editing.ageSnapshot.birthDate:patient.birthDate});errors(validation.errors);if(!validation.valid){notice.textContent='Corrige los campos indicados.';return;}
  const serialized=JSON.stringify(input);if(pending&&pending.serialized!==serialized){notice.textContent='Reintenta los mismos datos del envío sin confirmar, o revisa los registros antes de crear otra consulta.';return;}
  if(save){if(kind!=='consulta')return;pending??={serialized,operationId:crypto.randomUUID()};}
  const submittedRevision=revision;busy=true;form.querySelectorAll('input,textarea,button').forEach(control=>control.disabled=true);notice.textContent=save?'Guardando consulta…':'Validando…';
  try{
   const result=await request(save?(editing?'updateConsultation':'createConsultation'):'validateAttention',save?{...input,operationId:pending.operationId}:input);if(!panel.isConnected)return;
   if(revision!==submittedRevision){notice.textContent='La captura cambió. Revisa los registros antes de continuar.';return;}
   if(save){if(result.saved!==true||!result.consultation?.id)throw new Error('No se confirmó el guardado.');editing=result.consultation;pending=null;savedRevision=revision;setDirty(false);preview.innerHTML='<h3>Consulta guardada en '+e(storageLabel())+'</h3>'+consultationPreview(result.consultation);preview.hidden=false;notice.textContent=`Consulta guardada · Versión ${editing.version}. Para otra visita pulsa Nueva consulta.`;page=1;await load();}
   else{if(result.validated!==true||result.saved!==false)throw new Error('No se confirmó la validación.');preview.innerHTML='<h3>Captura validada · No guardada</h3>'+(kind==='consulta'?consultationPreview(result.data):`<p>${e(result.data.product)} · ${e(result.data.date)}</p><p>Próxima fecha: ${e(result.data.nextDate||'Sin fecha programada')}</p>`);preview.hidden=false;notice.textContent='Validación completada. No se guardó información.';}
  }catch(error){if(error.status&&error.status<500)pending=null;if(panel.isConnected){errors(error.fields??{});notice.textContent=error.message+(save?' No se confirmó el guardado; puedes reintentar los mismos datos.':' No se guardó información.');}}
  finally{busy=false;if(panel.isConnected){form.querySelectorAll('input,textarea,button').forEach(control=>control.disabled=false);buttons();}}
 });
 paint(initialConsultation);
}
