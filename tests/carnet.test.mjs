import {test} from 'node:test';
import assert from 'node:assert/strict';
import {carnetPage} from '../web/carnet.js';

test('carnet conectado muestra solo la ficha sanitaria del paciente',()=>{
 assert.match(carnetPage(null),/Selecciona un paciente/);
 const page=carnetPage({id:'11111111-1111-4111-8111-111111111111',name:'Luna',species:'Perro',ownerName:'Ana'});assert.match(page,/Carnet de Luna/);assert.match(page,/carnet-card/);assert.doesNotMatch(page,/Vacunación/);
});
