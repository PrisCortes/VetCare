import {request} from './auth.js';
import {escapeHtml as e} from './view-state.js';

function age(patient){
 if(patient.birthDate)return 'Nacimiento registrado';
 if(patient.ageValue!==null&&patient.ageValue!==undefined)return `${patient.ageValue} ${{dias:'días',meses:'meses',anios:'años'}[patient.ageUnit]||''}`;
 return 'No registrada';
}
function value(text){return e(text||'No registrado');}
function details(patient){return `<article class="sanitary-card" aria-label="Carnet sanitario de ${e(patient.name)}"><div class="sanitary-card-title"><span>me llamo</span><strong>${e(patient.name)}</strong></div><dl><dt>Especie</dt><dd>${value(patient.species)}</dd><dt>Raza</dt><dd>${value(patient.breed)}</dd><dt>Edad</dt><dd>${age(patient)}</dd><dt>Fecha de nacimiento</dt><dd>${value(patient.birthDate)}</dd><dt>Propietario</dt><dd>${value(patient.ownerName)}</dd><dt>Domicilio</dt><dd>${value(patient.ownerAddress)}</dd><dt>Localidad</dt><dd>${value(patient.ownerLocality)}</dd></dl></article>`;}
export function carnetPage(patient){
 if(!patient)return '<section class="panel empty"><h1>Selecciona un paciente</h1><p>Desde Pacientes, abre Ver carnet en la ficha que corresponda.</p><button class="button" type="button" data-route="pacientes">Ir a pacientes</button></section>';
 return `<section id="carnet-panel"><div class="page-heading"><div><span class="eyebrow">CARNET SANITARIO</span><h1 id="carnet-title">Carnet de ${e(patient.name)}</h1><p id="carnet-patient">${e(patient.species)} · ${e(patient.ownerName)}</p></div><button class="button secondary" id="carnet-history" type="button">Volver al expediente</button></div><p id="carnet-notice" role="status" aria-live="polite">Cargando carnet…</p><div id="carnet-card"></div></section>`;
}
export function initializeCarnet(panel,initialPatient,{onHistory=()=>{}}={}){
 const find=id=>panel.querySelector('#'+id);let patient=initialPatient,sequence=0;
 async function load(){const run=++sequence;find('carnet-notice').textContent='Cargando carnet…';try{const result=await request('carnet',{patientId:initialPatient.id});if(!panel.isConnected||run!==sequence)return;patient=result.patient;find('carnet-title').textContent='Carnet de '+patient.name;find('carnet-patient').textContent=`${patient.species} · Propietario: ${patient.ownerName}`;find('carnet-card').innerHTML=details(patient);find('carnet-notice').textContent='Carnet actualizado.';}catch(error){if(panel.isConnected&&run===sequence)find('carnet-notice').textContent=error.message+' No se pudo actualizar el carnet.';}}
 panel.addEventListener('click',event=>{if(event.target.closest('#carnet-history'))onHistory(patient);});load();
}
