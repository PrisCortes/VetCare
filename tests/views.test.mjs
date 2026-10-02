import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createViewState,escapeHtml} from '../web/view-state.js';
import {patientsView,detailView,carnetView,consultationView,formFields} from '../web/views.js';

test('arranque vacío y muestra explícita aislada de otras sesiones',()=>{
 const state=createViewState(),other=createViewState();
 assert.equal(state.demo,false);assert.equal(state.selected,null);
 assert.equal(state.data.patients.length,0);
 assert.match(patientsView(state,'','Todas'),/Cargar datos de demostración/);
 state.loadDemo();assert.equal(state.data.patients.length,5);
 assert.equal(other.data.patients.length,0);
 const copy=state.data;copy.patients[0].name='Cambio externo';
 assert.equal(state.selected.name,'Luna');
 state.clearDemo();assert.equal(state.demo,false);assert.equal(state.selected,null);
 for(const records of Object.values(state.data))assert.equal(records.length,0);
});
test('búsqueda por propietario sin acentos combinada con especie',()=>{
 const state=createViewState();state.loadDemo();
 assert.deepEqual(state.filterPatients(' ANA MARTINEZ ','Todas').map(p=>p.name),['Luna','Nala']);
 assert.deepEqual(state.filterPatients('ana martinez','Borrego').map(p=>p.name),['Nala']);
 assert.equal(state.filterPatients('Ana Martínez','Gato').length,0);
 assert.equal(state.filterPatients('sin coincidencia').length,0);
});
test('expedientes y carnet conservan el paciente seleccionado',()=>{
 const state=createViewState();assert.match(detailView(state,'historial'),/Selecciona un paciente/);
 assert.match(consultationView(state),/Selecciona un paciente/);
 state.loadDemo();assert.match(detailView(state,'historial'),/Consulta de revisión/);
 assert.match(detailView(state,'seguimiento'),/Anotación de seguimiento/);
 assert.match(carnetView(state,'vacunas'),/Próxima fecha indicada/);
 assert.match(carnetView(state,'desparasitaciones'),/Sin fecha programada/);
 assert.equal(state.select('p2'),true);
 assert.doesNotMatch(detailView(state,'historial'),/Consulta de revisión/);
 assert.doesNotMatch(carnetView(state,'vacunas'),/Vacuna de ejemplo/);
 assert.equal(state.select('no-existe'),false);assert.equal(state.selected.name,'Milo');
});
test('capturas sin guardado y próxima aplicación opcional sin fecha calculada',()=>{
 const state=createViewState();state.loadDemo();
 const form=consultationView(state);
 assert.match(form,/Revisar captura/);assert.match(form,/aún no se guarda/);
 assert.doesNotMatch(form,/name="pa"/i);
 for(const kind of ['vacuna','desparasitacion']){
  const html=formFields(kind,state);
  assert.match(html,/<input name="proxima" type="date">/);
  assert.doesNotMatch(html,/<input name="proxima"[^>]*(required|value=)/);
 }
});
test('texto no confiable se escapa antes de insertarlo como HTML',()=>{
 assert.equal(escapeHtml('<img src=x onerror="alert(1)">&\''),'&lt;img src=x onerror=&quot;alert(1)&quot;&gt;&amp;&#39;');
 assert.equal(escapeHtml(null),'');
});
