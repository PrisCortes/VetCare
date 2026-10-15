import {test} from 'node:test';
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {root,phpCommand} from '../scripts/environment.mjs';
import {historyPage,historyCard,historicalAge} from '../web/history.js';
const php=phpCommand();
test('historial: valida intervalo, calendario, búsqueda y cursor antes de consultar SQL',()=>{
 const code=`require 'server/auth.php';require 'server/owners.php';require 'server/history.php';echo json_encode(\\VetCare\\historyFilters(['q'=>' Tratamiento ','from'=>'2024-02-29','to'=>'2026-12-01']));foreach([['from'=>'2025-02-29'],['from'=>'2026-01-02','to'=>'2026-01-01'],['cursor'=>'bad'],['q'=>[]],['cursor'=>str_repeat('a',257)]]as$case){try{\\VetCare\\historyFilters($case);echo 'X';}catch(\\VetCare\\AccessError$e){echo$e->status;}}`;
 const r=spawnSync(php.binary,[...php.args,'-r',code],{cwd:root,encoding:'utf8',windowsHide:true});assert.equal(r.status,0,r.stderr);assert.equal(r.stderr,'');assert.ok(r.stdout.endsWith('422422422422422'));assert.ok(r.stdout.includes('Tratamiento'));
});
test('historial conserva la edad registrada sin sustituirla por la edad actual',()=>{
 assert.equal(historicalAge({ageValue:0,ageUnit:'dias',ageReference:'2026-01-01'}),'Edad estimada registrada: 0 días · Referencia 2026-01-01');assert.match(historicalAge({birthDate:'2020-02-29'}),/2020-02-29/);assert.match(historicalAge(null),/desconocida/);
});
test('cursor del historial conserva fecha e identificador sin depender de la zona horaria',()=>{
 const code=`require 'server/auth.php';require 'server/owners.php';require 'server/history.php';$cursor=rtrim(strtr(base64_encode(json_encode(['date'=>'2026-01-01','id'=>'11111111-1111-4111-8111-111111111111'])),'+/','-_'),'=');echo json_encode(\\VetCare\\historyFilters(['cursor'=>$cursor])['before']);`;
 const r=spawnSync(php.binary,[...php.args,'-r',code],{cwd:root,encoding:'utf8',windowsHide:true});assert.equal(r.status,0,r.stderr);assert.deepEqual(JSON.parse(r.stdout),{date:'2026-01-01',id:'11111111-1111-4111-8111-111111111111'});
});
test('historial escapa texto clínico, autores y contexto y evita abrir sin paciente',()=>{
 const html=historyCard({id:'test',version:2,date:'2026-01-01',reason:'<script>bad()</script>',treatment:'A & B',notes:null,weight:null,temperature:null,heartRate:null,respiratoryRate:null,createdByName:'<img src=x>',updatedByName:'Doctor',ageSnapshot:{ageValue:null}});assert.ok(!html.includes('<script>'));assert.match(html,/&lt;img/);assert.match(html,/Ver versiones/);assert.match(html,/Corregir consulta/);assert.match(historyPage(null),/Selecciona un paciente/);
});
