import {test} from 'node:test';
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {root,phpCommand} from '../scripts/environment.mjs';
import {sanitaryPreview} from '../web/attention-controller.js';
const php=phpCommand();
test('evento sanitario exige tipo, operación, paciente y versión al corregir',()=>{
 const code=`require 'server/auth.php';require 'server/owners.php';require 'server/sanitary-events.php';$base=['kind'=>'vacuna','patientId'=>'11111111-1111-4111-8111-111111111111','patientVersion'=>1,'operationId'=>'22222222-2222-4222-8222-222222222222'];echo json_encode(\\VetCare\\sanitaryIdentity($base,true));foreach([['kind'=>'consulta'],['operationId'=>'bad'],['patientVersion'=>'1'],['id'=>'bad','version'=>1]]as$case){try{\\VetCare\\sanitaryIdentity([...$base,...$case],isset($case['id'])?false:true);echo'X';}catch(\\VetCare\\AccessError$e){echo$e->status;}}`;
 const r=spawnSync(php.binary,[...php.args,'-r',code],{cwd:root,encoding:'utf8',windowsHide:true});assert.equal(r.status,0,r.stderr);assert.equal(r.stderr,'');assert.ok(r.stdout.endsWith('422422422422'));
});
test('vista sanitaria muestra próxima fecha, peso y texto escapado',()=>{
 const vaccine=sanitaryPreview({kind:'vacuna',date:'2026-01-01',product:'<script>bad()</script>',application:'A & B',nextDate:null});assert.ok(!vaccine.includes('<script>'));assert.match(vaccine,/&lt;script&gt;/);assert.match(vaccine,/A &amp; B/);assert.match(vaccine,/Sin fecha programada/);
 const deworming=sanitaryPreview({kind:'desparasitacion',date:'2026-01-01',product:'Producto',weight:1250,nextDate:'2026-02-01'});assert.match(deworming,/1.25 kg/);assert.match(deworming,/2026-02-01/);
});
