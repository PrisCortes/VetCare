import {escapeHtml as e} from './view-state.js';
import {request} from './auth.js';
import {validateAttention,todayMexico} from './attention-validation.js';
const names={consulta:'Consulta',vacuna:'Vacunación',desparasitacion:'Desparasitación',seguimiento:'Seguimiento'};
const field=(name,label,control)=>`<label for="attention-${name}">${label}</label>${control.replace('<input',`<input id="attention-${name}" name="${name}" aria-describedby="attention-error-${name}"`).replace('<textarea',`<textarea id="attention-${name}" name="${name}" aria-describedby="attention-error-${name}"`)}<span id="attention-error-${name}" class="field-error"></span>`;
const text=(name,label,required=false,max=10000)=>`<div class="attention-field">${field(name,label+` (máximo ${max} caracteres)`,`<textarea ${required?'required':''} maxlength="${max*2}" rows="3"></textarea>`)}</div>`;
const number=(name,label,integer=false)=>`<div class="attention-field">${field(name,label,`<input type="text" inputmode="${integer?'numeric':'decimal'}" maxlength="24" autocomplete="off">`)}</div>`;
export function attentionFormFields(kind){
 const date=`<div class="attention-field">${field('date','Fecha de atención *',`<input type="date" required max="${todayMexico()}">`)}</div>`;
 if(kind==='consulta')return date+`<h2>Mediciones opcionales</h2><p>Peso en kg, temperatura en °C, frecuencias por minuto. Usa punto o coma decimal, sin separadores de miles.</p><div class="field-grid">${number('weight','Peso · kg')}${number('temperature','Temperatura · °C')}${number('heartRate','FC · latidos/min',true)}${number('respiratoryRate','FR · respiraciones/min',true)}</div><h2>Valoración</h2>${text('reason','Diagnóstico o motivo *',true)}${text('treatment','Tratamiento')}${text('notes','Observaciones')}`;
 if(kind==='vacuna'||kind==='desparasitacion')return date+`<div class="attention-field">${field('product',kind==='vacuna'?'Vacuna *':'Desparasitante *','<input required maxlength="200">')}</div>`+(kind==='vacuna'?`<div class="attention-field">${field('application','Aplicación (texto libre)','<input maxlength="200">')}</div>`:number('weight','Peso · kg (opcional)'))+`<div class="attention-field">${field('nextDate','Próxima fecha (opcional)','<input type="date">')}</div><p>Deja la próxima fecha vacía si no fue indicada. No se calcula automáticamente.</p>`;
 return date+text('application','Aplicación o intervención *',true)+text('notes','Observaciones')+'<p>Primero debe existir una consulta registrada para vincular el seguimiento.</p>';
}
export function attentionPage(patient){
 if(!patient)return '<section class="panel empty"><h1>Selecciona un paciente</h1><p>Abre Pacientes y pulsa Preparar atención en su ficha.</p><button type="button" class="button" data-route="pacientes">Ir a pacientes</button></section>';
 return `<section id="attention-panel"><div class="page-heading"><div><span class="eyebrow">FORMULARIOS DE ATENCIÓN</span><h1>Preparar atención</h1><p>${e(patient.name)} · ${e(patient.species)} · Propietario: ${e(patient.ownerName)}</p><small>Identificador: ${e(patient.id)} · Versión ${patient.version}</small></div><button type="button" class="button secondary" data-route="pacientes">Volver a pacientes</button></div><div class="tabs" role="group" aria-label="Tipo de atención">${['consulta','vacuna','desparasitacion'].map(kind=>`<button type="button" data-attention-kind="${kind}">${names[kind]}</button>`).join('')}<button type="button" disabled title="Requiere una consulta registrada">Seguimiento pendiente</button></div><section class="panel attention-panel"><h2 id="attention-title">Consulta</h2><div id="attention-errors" role="alert" tabindex="-1" hidden></div><form id="attention-form" novalidate><div id="attention-fields"></div><p>Esta versión revisa la captura. El guardado clínico todavía no está habilitado.</p><button class="button" type="submit">Revisar captura</button><p id="attention-notice" role="status" aria-live="polite"></p></form><div id="attention-preview" hidden></div></section></section>`;
}
export function initializeAttention(panel,patient,{onDirty=()=>{}}={}){
 let kind='consulta',dirty=false,busy=false,revision=0;const form=panel.querySelector('#attention-form'),notice=panel.querySelector('#attention-notice'),preview=panel.querySelector('#attention-preview'),summary=panel.querySelector('#attention-errors');
 function paint(){revision++;panel.querySelector('#attention-fields').innerHTML=attentionFormFields(kind);panel.querySelector('#attention-title').textContent=names[kind];panel.querySelectorAll('[data-attention-kind]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.attentionKind===kind)));summary.hidden=true;preview.hidden=true;notice.textContent='';dirty=false;onDirty(false);}
 function errors(fields){
  form.querySelectorAll('[aria-invalid]').forEach(input=>input.removeAttribute('aria-invalid'));form.querySelectorAll('.field-error').forEach(span=>span.textContent='');
  const entries=Object.entries(fields);summary.hidden=entries.length===0;
  summary.innerHTML=entries.length?'<strong>Revisa los siguientes campos:</strong><ul>'+entries.map(([key,message])=>`<li><button type="button" class="text-button" data-attention-error="${e(key)}">${e(message)}</button></li>`).join('')+'</ul>':'';
  for(const [key,message]of entries){form.elements[key]?.setAttribute('aria-invalid','true');const span=panel.querySelector('#attention-error-'+key);if(span)span.textContent=message;}
  if(entries.length)summary.focus();
 }
 form.addEventListener('input',()=>{revision++;dirty=true;onDirty(true);preview.hidden=true;notice.textContent='Captura modificada; vuelve a revisarla.';});
 form.addEventListener('change',()=>{revision++;dirty=true;onDirty(true);preview.hidden=true;});
 panel.addEventListener('click',event=>{
  const button=event.target.closest('button');if(!button)return;
  if(button.dataset.attentionError){form.elements[button.dataset.attentionError]?.focus();return;}
  const next=button.dataset.attentionKind;if(!next||next===kind||busy)return;
  if(dirty&&!window.confirm('¿Descartar la captura sin guardar y cambiar de formulario?'))return;
  kind=next;paint();
 });
 form.addEventListener('submit',async event=>{
  event.preventDefault();if(busy)return;preview.hidden=true;
  const input={...Object.fromEntries(new FormData(form)),kind,patientId:patient.id,patientVersion:patient.version};
  const validation=validateAttention(input,{birthDate:patient.birthDate});errors(validation.errors);if(!validation.valid){notice.textContent='Corrige los campos indicados. No se guardó información.';return;}
  const submittedRevision=revision;busy=true;form.querySelector('button[type="submit"]').disabled=true;notice.textContent='Validando con el servidor…';
  try{
   const result=await request('validateAttention',input);if(!panel.isConnected)return;
   if(revision!==submittedRevision){notice.textContent='La captura cambió durante la revisión. Vuelve a revisarla.';return;}
   if(result.validated!==true||result.saved!==false)throw new Error('El servidor no confirmó el resultado de la validación.');
   const data=result.data;
   preview.innerHTML=`<h3>Captura validada · No guardada</h3><dl><dt>Paciente</dt><dd>${e(result.patient.name)} · ${e(result.patient.ownerName)}</dd><dt>Atención</dt><dd>${e(names[kind])} · ${e(data.date)}</dd>${data.reason?`<dt>Diagnóstico o motivo</dt><dd>${e(data.reason)}</dd>`:''}${data.product?`<dt>Producto</dt><dd>${e(data.product)}</dd>`:''}${data.application?`<dt>Aplicación</dt><dd>${e(data.application)}</dd>`:''}${data.weight!==null&&data.weight!==undefined?`<dt>Peso</dt><dd>${e(data.weight/1000)} kg</dd>`:''}${data.temperature!==null&&data.temperature!==undefined?`<dt>Temperatura</dt><dd>${e(data.temperature/100)} °C</dd>`:''}${['heartRate','respiratoryRate'].filter(key=>data[key]!==null&&data[key]!==undefined).map(key=>`<dt>${key==='heartRate'?'FC':'FR'}</dt><dd>${e(data[key])} /min</dd>`).join('')}${data.treatment?`<dt>Tratamiento</dt><dd>${e(data.treatment)}</dd>`:''}${data.notes?`<dt>Observaciones</dt><dd>${e(data.notes)}</dd>`:''}${kind!=='consulta'?`<dt>Próxima fecha</dt><dd>${e(data.nextDate||'Sin fecha programada')}</dd>`:''}</dl><p>No se creó una consulta ni un evento sanitario.</p>`;
   preview.hidden=false;notice.textContent='Validación completada. La captura permanece en esta pantalla y no se guardó.';
  }catch(error){if(panel.isConnected){if(revision!==submittedRevision){notice.textContent='La captura cambió durante la revisión. Vuelve a revisarla.';return;}errors(error.fields??{});notice.textContent=error.message+' No se guardó información.';}}
  finally{busy=false;if(panel.isConnected)form.querySelector('button[type="submit"]').disabled=false;}
 });
 paint();
}
