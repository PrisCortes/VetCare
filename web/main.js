import {createViewState,escapeHtml as e} from './view-state.js';
import {patientsView,patientRows,ownersView,detailView,carnetView,consultationView,formFields} from './views.js';
import {initializeDiagnostics} from './diagnostics.js';
import {initializeAuth,authenticatedUser} from './auth.js';
import {ownersPage,initializeOwners} from './owners.js';
import {patientsPage,initializePatients} from './patients.js';
import {attentionPage,initializeAttention} from './attention.js';
const state=createViewState(),main=document.getElementById('main'),dialog=document.getElementById('record-dialog');
let attentionPatient=null;
let query='',species='Todas',detailTab='historial',carnetTab='vacunas',currentRoute='',dirty=false,dialogDirty=false,dialogKind='',toastTimer;
const routes=new Set(['pacientes','propietarios','expediente','carnet','consulta','entorno']);
function route(){const value=location.hash.slice(1);return routes.has(value)?value:'pacientes';}
function notify(text){const box=document.getElementById('toast');box.textContent=text;box.hidden=false;clearTimeout(toastTimer);toastTimer=setTimeout(()=>{box.hidden=true;},6500);}
function leaveDraft(){return !dirty||window.confirm('Esta captura no está guardada. ¿Quieres descartarla?');}
function go(destination){if(!routes.has(destination)||destination===currentRoute)return;if(!leaveDraft())return;dirty=false;location.hash=destination;}
function render(){
 if(!authenticatedUser()){currentRoute='';main.replaceChildren();return;}
 currentRoute=route();dirty=false;
 document.querySelectorAll('[data-nav]').forEach(link=>{const active=link.dataset.nav===(currentRoute==='consulta'?'expediente':currentRoute);if(active)link.setAttribute('aria-current','page');else link.removeAttribute('aria-current');});
 document.querySelector('.nav-count').textContent=state.data.patients.length;
 document.querySelector('.nav-count').hidden=!state.demo;
 const names={pacientes:'Pacientes',propietarios:'Propietarios',expediente:'Expediente',carnet:'Carnet sanitario',consulta:'Nueva consulta',entorno:'Estado del entorno'};
 document.getElementById('breadcrumb').textContent=names[currentRoute];document.title='VetCare · '+names[currentRoute];
 document.getElementById('mode-note').textContent=state.demo?'Demostración activa · Datos ficticios, sin guardado clínico.':['propietarios','pacientes'].includes(currentRoute)?'Directorio central · Guardado con conexión.':'Consultas y carnet en preparación.';
 document.getElementById('clear-demo').hidden=!state.demo;
 if(currentRoute==='entorno'){main.innerHTML=document.getElementById('environment-template').innerHTML;initializeDiagnostics(document.getElementById('environment-panel')).catch(()=>notify('No se pudo completar el diagnóstico del entorno.'));}
 else if(currentRoute==='propietarios'&&!state.demo){main.innerHTML=ownersPage();initializeOwners(document.getElementById('owners-panel'),{onDirty:value=>{dirty=value;}});}
 else if(currentRoute==='pacientes'&&!state.demo){main.innerHTML=patientsPage();initializePatients(document.getElementById('patients-panel'),{onDirty:value=>{dirty=value;},onAttention:patient=>{attentionPatient=patient;go('consulta');}});}
 else if(currentRoute==='consulta'&&!state.demo){main.innerHTML=attentionPage(attentionPatient);if(attentionPatient)initializeAttention(document.getElementById('attention-panel'),attentionPatient,{onDirty:value=>{dirty=value;}});}
 else main.innerHTML=({pacientes:()=>patientsView(state,query,species),propietarios:()=>ownersView(state),expediente:()=>detailView(state,detailTab),carnet:()=>carnetView(state,carnetTab),consulta:()=>consultationView(state)})[currentRoute]();
 main.focus({preventScroll:true});
 window.scrollTo({top:0,left:0,behavior:"instant"});
}
function openForm(kind){
 if(kind==='paciente'&&!state.demo){if(currentRoute==='pacientes')document.querySelector('[data-patient-new]')?.click();else go('pacientes');return;}
 if(kind==='propietario'&&!state.demo){if(currentRoute==='propietarios')document.querySelector('[data-owner-new]')?.click();else go('propietarios');return;}
 if(!['propietario','paciente','vacuna','desparasitacion'].includes(kind))return;
 dialogKind=kind;dialogDirty=false;
 document.getElementById('record-title').textContent={propietario:'Nuevo propietario',paciente:'Nuevo paciente',vacuna:'Registro de vacuna',desparasitacion:'Registro de desparasitación'}[kind];
 document.getElementById('record-fields').innerHTML=formFields(kind,state);document.getElementById('record-result').hidden=true;
 document.getElementById('review-record').disabled=kind==='paciente'&&!state.data.owners.length;dialog.showModal();
}
function closeDialog(){if(dialogDirty&&!window.confirm('Esta captura no está guardada. ¿Quieres descartarla?'))return;dialogDirty=false;dialog.close();}
document.addEventListener('click',event=>{
 const anchor=event.target.closest('a[href^="#"]');if(anchor){event.preventDefault();go(anchor.getAttribute('href').slice(1));return;}
 const button=event.target.closest('button');if(!button)return;
 if(button.dataset.route)go(button.dataset.route);
 if(button.dataset.patient){if(!leaveDraft())return;if(state.select(button.dataset.patient)){dirty=false;detailTab='historial';if(currentRoute==='expediente')render();else go('expediente');}}
 if(button.hasAttribute('data-demo')){state.loadDemo();query='';species='Todas';render();notify('Muestra ficticia cargada solo para explorar pantallas. No se guarda en SQLite.');}
 if(button.id==='clear-demo'){if(!leaveDraft())return;dirty=false;state.clearDemo();query='';species='Todas';render();notify('Muestra retirada de la vista. No se alteró SQLite.');}
 if(button.dataset.species){species=button.dataset.species;render();}
 if(button.dataset.tab){detailTab=button.dataset.tab;render();}
 if(button.dataset.carnet){carnetTab=button.dataset.carnet;render();}
 if(button.dataset.form)openForm(button.dataset.form);
 if(button.hasAttribute('data-close-dialog'))closeDialog();
});
document.addEventListener('input',event=>{
 if(event.target.id==='patient-search'){query=event.target.value;document.getElementById('patient-rows').innerHTML=patientRows(state,query,species);}
 if(event.target.closest('#consult-form'))dirty=true;if(event.target.closest('#record-form'))dialogDirty=true;
});
document.addEventListener('change',event=>{if(event.target.closest('#consult-form'))dirty=true;if(event.target.closest('#record-form'))dialogDirty=true;});
document.addEventListener('submit',event=>{
 if(!['consult-form','record-form'].includes(event.target.id))return;
 event.preventDefault();const form=event.target,data=new FormData(form),result=document.getElementById(form.id==='consult-form'?'consult-result':'record-result');
 const minimum=form.id==='consult-form'?'diagnostico':dialogKind==='propietario'||dialogKind==='paciente'?'nombre':'producto';
 if(!String(data.get(minimum)||'').trim()){result.textContent='El campo principal no puede estar vacío ni contener solo espacios.';result.hidden=false;return;}
 if(data.get('proxima')&&data.get('fecha')&&data.get('proxima')<data.get('fecha')){result.textContent='La próxima fecha no puede ser anterior a la aplicación según la propuesta de captura.';result.hidden=false;return;}
 result.innerHTML=`<strong>Captura revisada en pantalla</strong><p>${e(data.get(minimum))}</p><p>El registro clínico aún no está habilitado. No se guardó información en SQLite ni en un servidor.</p>`;result.hidden=false;result.scrollIntoView({block:'nearest',behavior:'auto'});
});
dialog.addEventListener('cancel',event=>{event.preventDefault();closeDialog();});
window.addEventListener('hashchange',()=>{if(route()===currentRoute)return;if(!leaveDraft()){history.replaceState(null,'','#'+currentRoute);return;}render();});
window.addEventListener('beforeunload',event=>{if(dirty||dialogDirty){event.preventDefault();event.returnValue='';}});
await initializeAuth(()=>{attentionPatient=null;state.clearDemo();query='';species='Todas';dirty=false;dialogDirty=false;if(dialog.open)dialog.close();render();});
