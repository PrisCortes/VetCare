import {request,isOffline,storageLabel} from './auth.js';
import {escapeHtml as e} from './view-state.js';

export function ageLabel(patient){
 if(patient.birthDate)return 'Nacimiento: '+patient.birthDate;
 if(patient.ageValue!==null)return `${patient.ageValue} ${ {dias:'días',meses:'meses',anios:'años'}[patient.ageUnit]||''} estimados al ${patient.ageReference}`;
 return 'Edad desconocida';
}
export function patientsPage(){return `<section id="patients-panel"><div class="page-heading"><div><span class="eyebrow">${isOffline()?'DIRECTORIO LOCAL':'DIRECTORIO CENTRAL'}</span><h1>Pacientes</h1><p>${isOffline()?'Identificación y propietario con guardado en este equipo.':'Identificación y propietario con guardado central.'}</p></div><button class="button" type="button" data-patient-new>Nuevo paciente</button></div><p id="patients-notice" role="status">Cargando pacientes…</p><section id="patient-card" class="panel" hidden></section><section id="patient-editor" class="panel" hidden><h2 id="patient-editor-title">Nuevo paciente</h2><form id="patient-form"><div class="field-grid"><label>Nombre o identificación *<input name="name" maxlength="200" required></label><label>Especie *<input name="species" maxlength="80" list="species-list" required><datalist id="species-list">${['Perro','Gato','Vaca','Caballo','Borrego','Otra'].map(value=>`<option value="${value}">`).join('')}</datalist></label><label>Raza<input name="breed" maxlength="200"></label><label>Propietario *<select name="ownerId" required><option value="">Busca y selecciona un propietario activo</option></select></label></div><div class="toolbar"><label>Buscar propietario<input id="patient-owner-query" maxlength="200" type="search"></label><button class="button secondary" type="button" id="patient-find-owner">Buscar propietarios</button><button class="button secondary" type="button" id="patient-more-owners" hidden>Más propietarios</button></div><p id="patient-owner-notice" role="status"></p><label>Datos de edad<select name="ageMode"><option value="unknown">Desconocida</option><option value="birth">Nacimiento conocido</option><option value="estimate">Edad estimada</option></select></label><div id="patient-birth" hidden><label>Fecha de nacimiento<input name="birthDate" type="date"></label></div><div id="patient-estimate" class="field-grid" hidden><label>Edad estimada<input name="ageValue" type="number" min="0" max="2147483647" step="1"></label><label>Unidad<select name="ageUnit"><option value="anios">Años</option><option value="meses">Meses</option><option value="dias">Días</option></select></label><label>Fecha de referencia<input name="ageReference" type="date"></label></div><div class="form-actions"><button class="button secondary" type="button" data-patient-cancel>Cancelar</button><button class="button" type="submit">Guardar paciente</button></div><p id="patient-form-notice" role="status"></p></form></section><section class="panel"><form id="patients-search" class="toolbar"><label>Paciente, raza o propietario<input name="q" type="search" maxlength="200"></label><label>Especie<input name="species" maxlength="80" list="species-list"></label><label>Estado<select name="status"><option value="active">Activos</option><option value="inactive">Inactivos</option><option value="all">Todos</option></select></label><button class="button secondary" type="submit">Buscar / actualizar</button></form><div class="table-wrap"><table><thead><tr><th>Paciente</th><th>Especie</th><th>Propietario</th><th>Estado</th><th>Acciones</th></tr></thead><tbody id="patients-rows"></tbody></table></div><div class="form-actions"><button class="button secondary" type="button" id="patients-prev" disabled>Anterior</button><span id="patients-page"></span><button class="button secondary" type="button" id="patients-next" disabled>Siguiente</button></div></section><p>Consultas y carnet se integrarán en las siguientes tareas. Estos registros no pertenecen a la muestra de demostración.</p></section>`;}

export function initializePatients(panel,{onDirty=()=>{},onAttention=()=>{},onHistory=()=>{},onCarnet=()=>{}}={}){
 const find=id=>panel.querySelector('#'+id),form=find('patient-form'),notice=find('patients-notice'),editor=find('patient-editor');
 let rows=[],page=1,more=false,editing=null,dirty=false,busy=false,pending=null,sequence=0,ownerPage=0,ownerSequence=0;
 const operations=new Map();
 const setDirty=value=>{dirty=value;onDirty(value);};
 const discard=()=>!dirty||window.confirm('¿Descartar los cambios del paciente sin guardar?');
 function ageMode(){const mode=form.elements.ageMode.value;find('patient-birth').hidden=mode!=='birth';find('patient-estimate').hidden=mode!=='estimate';form.elements.birthDate.required=mode==='birth';form.elements.ageValue.required=mode==='estimate';form.elements.ageReference.required=mode==='estimate';}
 async function owners(append=false){
  const run=++ownerSequence;find('patient-owner-notice').textContent='Buscando propietarios…';
  const requestedPage=append?ownerPage+1:1;
  try{
   const result=await request('owners',{q:find('patient-owner-query').value,status:'active',page:String(requestedPage)},{fresh:true});
   if(!panel.isConnected||run!==ownerSequence)return;
   ownerPage=requestedPage;const select=form.elements.ownerId,selectedValue=select.value;
   if(!append){const selected=select.selectedOptions[0];const keep=selected?.value?selected.outerHTML:'';select.innerHTML='<option value="">Seleccionar propietario</option>'+keep;}
   for(const owner of result.owners){if([...select.options].some(option=>option.value===owner.id))continue;const option=document.createElement('option');option.value=owner.id;option.textContent=`${owner.name} · ${owner.locality||'Sin localidad'} · ${owner.phone||'Sin teléfono'}`;select.append(option);}
   select.value=selectedValue;
   find('patient-more-owners').hidden=!result.hasMore;find('patient-owner-notice').textContent=result.owners.length?'Selecciona al propietario; verifica homónimos por teléfono y localidad.':'Sin coincidencias. Registra un propietario en su directorio si es necesario.';
  }catch(error){if(panel.isConnected)find('patient-owner-notice').textContent=error.message;}
 }
 function edit(patient=null){
  if(busy||!discard())return;form.reset();editing=patient;pending=null;setDirty(false);ownerSequence++;
  for(const key of ['name','species','breed','birthDate','ageValue','ageReference'])form.elements[key].value=patient?.[key]??'';
  form.elements.ageUnit.value=patient?.ageUnit??'anios';form.elements.ageMode.value=patient?.birthDate?'birth':patient?.ageValue!==null&&patient?.ageValue!==undefined?'estimate':'unknown';ageMode();
  form.elements.ownerId.innerHTML='<option value="">Busca y selecciona un propietario activo</option>'+(patient?`<option selected value="${e(patient.ownerId)}">${e(patient.ownerName)}</option>`:'');
  find('patient-editor-title').textContent=patient?'Editar paciente':'Nuevo paciente';find('patient-form-notice').textContent='';find('patient-owner-notice').textContent='';find('patient-more-owners').hidden=true;editor.hidden=false;form.elements.name.focus();
 }
 function payload(patient){return {id:patient.id,ownerId:patient.ownerId,name:patient.name,species:patient.species,breed:patient.breed,birthDate:patient.birthDate,ageValue:patient.ageValue,ageUnit:patient.ageUnit,ageReference:patient.ageReference,active:patient.active,version:patient.version};}
 async function load(fresh=false){
  const run=++sequence;notice.textContent='Cargando pacientes…';find('patients-prev').disabled=true;find('patients-next').disabled=true;
  try{
   const result=await request('patients',{...Object.fromEntries(new FormData(find('patients-search'))),page:String(page)},{fresh});
   if(!panel.isConnected||run!==sequence)return;rows=result.patients;more=result.hasMore;
   find('patients-rows').innerHTML=rows.length?rows.map(patient=>`<tr><td data-label="Paciente"><strong>${e(patient.name)}</strong><small>${e(patient.breed||'Sin raza registrada')}</small></td><td data-label="Especie">${e(patient.species)}</td><td data-label="Propietario">${e(patient.ownerName)}</td><td data-label="Estado">${patient.active?'Activo':'Inactivo'}</td><td data-label="Acciones"><button type="button" class="text-button" data-patient-history="${e(patient.id)}">Ver expediente</button><button type="button" class="text-button" data-patient-carnet="${e(patient.id)}">Ver carnet</button><button type="button" class="text-button" data-patient-attention="${e(patient.id)}" ${patient.active?'':'disabled'}>Preparar atenci&#243;n</button><button type="button" class="text-button" data-patient-records="${e(patient.id)}">Consultas</button><button type="button" class="text-button" data-patient-edit="${e(patient.id)}">Editar</button><button type="button" class="text-button" data-patient-toggle="${e(patient.id)}">${patient.active?'Dar de baja':'Reactivar'}</button></td></tr>`).join(''):'<tr><td colspan="5">Sin pacientes para este filtro.</td></tr>';
   const actionIcons=[['[data-patient-history]','Ver expediente','folder'],['[data-patient-carnet]','Ver carnet','card'],['[data-patient-attention]','Preparar atención','clipboard'],['[data-patient-edit]','Editar paciente','pencil'],['[data-patient-toggle]','Dar de baja o reactivar','archive']];for(const [selector,label,icon] of actionIcons)for(const button of find('patients-rows').querySelectorAll(selector)){button.classList.add('action-icon');button.setAttribute('aria-label',label);button.setAttribute('title',label);button.innerHTML=`<svg aria-hidden="true"><use href="#${icon}"/></svg>`;}
   find('patients-page').textContent='Página '+page;find('patients-prev').disabled=page<=1;find('patients-next').disabled=!more;notice.textContent=`${rows.length} pacientes en esta página.`;
  }catch(error){if(panel.isConnected&&run===sequence)notice.textContent=error.message;}
 }
 form.addEventListener('input',event=>{if(event.target.id!=='patient-owner-query')setDirty(true);});
 form.addEventListener('change',()=>{ageMode();setDirty(true);});
 form.addEventListener('submit',async event=>{
  event.preventDefault();if(busy)return;const data=Object.fromEntries(new FormData(form)),mode=data.ageMode;
  const fields={name:data.name.trim(),species:data.species.trim(),breed:data.breed.trim(),ownerId:data.ownerId,birthDate:mode==='birth'?data.birthDate:null,ageValue:mode==='estimate'&&data.ageValue!==''?Number(data.ageValue):null,ageUnit:mode==='estimate'?data.ageUnit:null,ageReference:mode==='estimate'?data.ageReference:null,...(editing?{id:editing.id,version:editing.version,active:editing.active}:{})};
  const serialized=JSON.stringify(fields);
  if(pending&&pending.serialized!==serialized){find('patient-form-notice').textContent='Reintenta los mismos datos del envío no confirmado o cancela y revisa el directorio antes de crear otro registro.';return;}
  pending??={serialized,operationId:crypto.randomUUID()};busy=true;form.querySelector('button[type="submit"]').disabled=true;find('patient-form-notice').textContent='Guardando…';
  try{await request(editing?'updatePatient':'createPatient',{...fields,operationId:pending.operationId});if(!panel.isConnected)return;pending=null;editor.hidden=true;setDirty(false);find('patient-card').hidden=true;await load();notice.textContent='Paciente guardado en '+storageLabel()+'.';}
  catch(error){if(error.status&&error.status<500)pending=null;if(panel.isConnected)find('patient-form-notice').textContent=error.message+' No se confirmó el guardado.';}
  finally{busy=false;if(panel.isConnected)form.querySelector('button[type="submit"]').disabled=false;}
 });
 panel.addEventListener('click',async event=>{
  const button=event.target.closest('button');if(!button||busy)return;
  if(button.dataset.patientHistory){const patient=rows.find(item=>item.id===button.dataset.patientHistory);if(patient&&discard()){setDirty(false);onHistory(patient);}return;}
  if(button.dataset.patientCarnet){const patient=rows.find(item=>item.id===button.dataset.patientCarnet);if(patient&&discard()){setDirty(false);onCarnet(patient);}return;}
  if(button.dataset.patientAttention){const patient=rows.find(item=>item.id===button.dataset.patientAttention);if(patient&&patient.active&&discard()){setDirty(false);onAttention(patient);}return;}
  if(button.dataset.patientRecords){const patient=rows.find(item=>item.id===button.dataset.patientRecords);if(patient&&discard()){setDirty(false);onAttention(patient);}return;}
  if(button.hasAttribute('data-patient-new'))edit();
  if(button.hasAttribute('data-patient-cancel')&&discard()){editor.hidden=true;pending=null;setDirty(false);ownerSequence++;}
  if(button.dataset.patientEdit)edit(rows.find(patient=>patient.id===button.dataset.patientEdit));
  if(button.dataset.patientCard){const patient=rows.find(item=>item.id===button.dataset.patientCard);if(patient){const card=find('patient-card');card.innerHTML=`<h2>${e(patient.name)}</h2><p>${e(patient.species)} · ${e(patient.breed||'Sin raza registrada')}</p><p>Propietario: ${e(patient.ownerName)}</p><p>${e(ageLabel(patient))}</p><p>Estado: ${patient.active?'Activo':'Inactivo'} · Versión ${patient.version}</p><small>Identificador: ${e(patient.id)}</small><p>Las consultas y el carnet de este paciente aún no están integrados.</p>`;card.hidden=false;card.scrollIntoView({block:'nearest'});}}
  if(button.dataset.patientToggle){
   if(!discard())return;const patient=rows.find(item=>item.id===button.dataset.patientToggle);if(!patient||!window.confirm(`¿${patient.active?'Dar de baja':'Reactivar'} a ${patient.name}?`))return;
   const data={...payload(patient),active:!patient.active},key=JSON.stringify(data);if(!operations.has(key))operations.set(key,crypto.randomUUID());busy=true;button.disabled=true;
   try{await request('updatePatient',{...data,operationId:operations.get(key)});operations.delete(key);editor.hidden=true;find('patient-card').hidden=true;setDirty(false);await load();notice.textContent='Estado del paciente actualizado.';}
   catch(error){notice.textContent=error.message;if(error.status&&error.status<500)operations.delete(key);}finally{busy=false;button.disabled=false;}
  }
 });
 let filterTimer,ownerTimer;const queueFilter=()=>{clearTimeout(filterTimer);filterTimer=setTimeout(()=>{page=1;load(true);},180);};
 find('patient-owner-query').addEventListener('input',()=>{clearTimeout(ownerTimer);ownerTimer=setTimeout(()=>owners(),180);});
 find('patient-find-owner').addEventListener('click',()=>owners());find('patient-more-owners').addEventListener('click',()=>owners(true));
 find('patients-search').addEventListener('input',queueFilter);find('patients-search').addEventListener('change',queueFilter);find('patients-search').addEventListener('submit',event=>{event.preventDefault();page=1;load(true);});
 find('patients-prev').addEventListener('click',()=>{if(page>1){page--;load();}});find('patients-next').addEventListener('click',()=>{if(more){page++;load();}});
 load();
}
