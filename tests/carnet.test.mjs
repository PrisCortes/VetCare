import {test} from 'node:test';
import assert from 'node:assert/strict';
import {carnetCard,carnetPage} from '../web/carnet.js';

test('carnet conectado conserva el paciente y escapa eventos sanitarios',()=>{
 assert.match(carnetPage(null),/Selecciona un paciente/);
 const page=carnetPage({id:'11111111-1111-4111-8111-111111111111',name:'Luna',species:'Perro',ownerName:'Ana'});assert.match(page,/Carnet de Luna/);assert.match(page,/data-carnet-kind="vacuna"/);
 const card=carnetCard({kind:'desparasitacion',date:'2026-01-01',product:'<script>bad()</script>',weight:1200,nextDate:'2026-02-01',version:2,createdByName:'Ana & B',updatedByName:'Doctor'});assert.ok(!card.includes('<script>'));assert.match(card,/Desparasitación/);assert.match(card,/1.2 kg/);assert.match(card,/Ana &amp; B/);
});
