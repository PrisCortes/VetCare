import {request,isOffline,storageLabel} from './auth.js';
import {escapeHtml as e} from './view-state.js';
import {consultationPreview} from './attention-controller.js';
export function historicalAge(snapshot){
 if(snapshot?.birthDate)return 'Nacimiento registrado en esta atención: '+snapshot.birthDate;
 if(snapshot?.ageValue!==null&&snapshot?.ageValue!==undefined)return `Edad estimada registrada: ${snapshot.ageValue} ${{dias:'días',meses:'meses',anios:'años'}[snapshot.ageUnit]||''} · Referencia ${snapshot.ageReference}`;
 return 'Edad desconocida al registrar esta atención';
}
export function historyCard(record){return `<article class="panel history-card"><div class="panel-heading"><h2>${e(record.date)} · ${e(record.reason)}</h2><span class="badge neutral">Versión ${record.version}</span></div>${consultationPreview(record)}<p>${e(historicalAge(record.ageSnapshot))}</p><p>Registró: ${e(record.createdByName)} · Última corrección: ${e(record.updatedByName)}</p><div class="form-actions"><button class="button secondary" type="button" data-history-versions="${e(record.id)}">Ver versiones</button><button class="button secondary" type="button" data-history-correct="${e(record.id)}">Corregir consulta</button></div></article>`;}
export function historyPage(patient){
 if(!patient)return '<section class="panel empty"><h1>Selecciona un paciente</h1><p>Desde Pacientes, abre Ver expediente en la ficha que corresponda.</p><button class="button" type="button" data-route="pacientes">Ir a pacientes</button></section>';
 return `<section id="history-panel"><div class="page-heading"><div><span class="eyebrow">${isOffline()?'EXPEDIENTE LOCAL':'EXPEDIENTE CENTRAL'}</span><h1 id="history-title">Historial de ${e(patient.name)}</h1><p id="history-patient">${e(patient.species)} · ${e(patient.ownerName)}</p><small>Paciente: ${e(patient.id)}</small></div><button class="button" id="history-new" type="button" disabled>Nueva consulta</button></div><p id="history-notice" role="status" aria-live="polite">Cargando expediente…</p><section class="panel history-card"><p id="history-summary"></p><p id="history-weight"></p><p>${isOffline()?'Copia local: solo contiene las versiones disponibles en este equipo. Los registros nuevos o modificados siguen pendientes de envío.':'Consultas y tratamientos registrados. Vacunas, desparasitaciones y seguimientos todavía no están integrados en este historial.'}</p></section><section class="panel history-card"><form id="history-filters" class="toolbar"><label>Buscar en motivo, tratamiento u observaciones<input name="q" type="search" maxlength="200"></label><label>Desde<input name="from" type="date"></label><label>Hasta<input name="to" type="date"></label><button class="button secondary" type="submit">Buscar / actualizar</button></form></section><div id="history-records"></div><div class="form-actions"><button id="history-prev" class="button secondary" type="button" disabled>Anterior</button><span id="history-page"></span><button id="history-next" class="button secondary" type="button" disabled>Siguiente</button></div><section id="history-versions" class="panel history-card" hidden aria-labelledby="history-versions-title"><h2 id="history-versions-title">Versiones de la consulta</h2><p id="history-versions-notice" role="status"></p><div id="history-version-rows"></div><button id="history-more-versions" class="button secondary" type="button" hidden>Más versiones</button></section></section>`;
}
export function initializeHistory(panel,initialPatient,{onNew=()=>{},onCorrect=()=>{}}={}){
 const find=id=>panel.querySelector('#'+id);let patient=initialPatient,rows=[],stack=[null],nextCursor=null,sequence=0,versionSequence=0,versionId=null,before=null;
 async function load(){
  const run=++sequence;versionSequence++;versionId=null;find('history-versions').hidden=true;find('history-records').replaceChildren();find('history-notice').textContent='Cargando expediente…';find('history-prev').disabled=true;find('history-next').disabled=true;find('history-new').disabled=true;
  try{
   const filters=Object.fromEntries(new FormData(find('history-filters')));const result=await request('history',{patientId:initialPatient.id,...filters,cursor:stack.at(-1)||''});
   if(!panel.isConnected||run!==sequence)return;patient=result.patient;rows=result.consultations;nextCursor=result.nextCursor;
   find('history-title').textContent='Historial de '+patient.name;find('history-patient').textContent=`${patient.species} · Propietario: ${patient.ownerName} · ${patient.active?'Activo':'Inactivo'}`;
   find('history-summary').textContent=`Total de consultas del paciente: ${result.totalConsultations}. Esta página: ${rows.length}.`;
   const weight=result.latestConsultationWeight;find('history-weight').textContent=weight?`Último peso registrado en consulta: ${weight.grams/1000} kg · Fecha ${weight.date} · Consulta ${weight.consultationId}`:'Sin peso registrado en consultas.';
   find('history-records').innerHTML=rows.length?rows.map(historyCard).join(''):'<section class="panel empty"><h2>Sin consultas para estos filtros</h2><p>Prueba otro intervalo o término de búsqueda.</p></section>';
   find('history-page').textContent='Página '+stack.length;find('history-prev').disabled=stack.length<=1;find('history-next').disabled=!nextCursor;find('history-new').disabled=!patient.active;find('history-notice').textContent='Expediente recuperado de '+storageLabel()+'.';
  }catch(error){if(panel.isConnected&&run===sequence){find('history-notice').textContent=error.message+' No se pudo actualizar el expediente.';find('history-summary').textContent='';find('history-weight').textContent='';}}
 }
 async function versions(id,append=false){
  const run=++versionSequence;versionId=id;const box=find('history-versions');box.hidden=false;if(!append){before=null;find('history-version-rows').replaceChildren();}find('history-versions-notice').textContent='Cargando versiones…';find('history-more-versions').hidden=true;
  try{
   const result=await request('consultationVersions',{patientId:initialPatient.id,consultationId:id,before:append?before||'':''});
   if(!panel.isConnected||run!==versionSequence||versionId!==id)return;
   const html=result.versions.map(version=>`<article class="history-version"><h3>Versión ${version.version}${version.version===result.currentVersion?' · Vigente':''}</h3><p>${e(version.actorName)} · ${e(new Date(version.createdAt*1000).toLocaleString('es-MX',{timeZone:'America/Mexico_City'}))}</p>${consultationPreview(version.snapshot)}<p>${e(historicalAge(version.snapshot.ageSnapshot))}</p></article>`).join('');
   find('history-version-rows').insertAdjacentHTML('beforeend',html);before=result.nextBefore;find('history-more-versions').hidden=!before;find('history-versions-notice').textContent=result.versions.length?'Versiones conservadas; consulta de solo lectura.':'No hay versiones disponibles.';box.scrollIntoView({block:'nearest'});
  }catch(error){if(panel.isConnected&&run===versionSequence){find('history-versions-notice').textContent=error.message;find('history-more-versions').hidden=!before;}}
 }
 find('history-filters').addEventListener('submit',event=>{event.preventDefault();stack=[null];load();});
 panel.addEventListener('click',event=>{
  const button=event.target.closest('button');if(!button)return;
  if(button.id==='history-next'&&nextCursor){stack.push(nextCursor);load();}
  if(button.id==='history-prev'&&stack.length>1){stack.pop();load();}
  if(button.id==='history-new'&&patient.active)onNew(patient);
  if(button.dataset.historyCorrect){const record=rows.find(item=>item.id===button.dataset.historyCorrect);if(record)onCorrect(patient,record);}
  if(button.dataset.historyVersions)versions(button.dataset.historyVersions);
  if(button.id==='history-more-versions'&&versionId&&before)versions(versionId,true);
 });
 load();
}
