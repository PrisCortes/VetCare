import {test} from 'node:test';
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {root,phpCommand} from '../scripts/environment.mjs';
import {consultationPreview} from '../web/attention-controller.js';
const php=phpCommand();
test('consulta exige identidad de operación, paciente y versión sin aceptar vacunas',()=>{
 const code=`require 'server/auth.php';require 'server/owners.php';require 'server/consultations.php';$base=['kind'=>'consulta','patientId'=>'11111111-1111-4111-8111-111111111111','patientVersion'=>1,'operationId'=>'22222222-2222-4222-8222-222222222222'];echo json_encode(\\VetCare\\consultationIdentity($base,true));foreach([['kind'=>'vacuna'],['patientVersion'=>'1'],['operationId'=>'bad']]as$case){try{\\VetCare\\consultationIdentity([...$base,...$case],true);echo 'X';}catch(\\VetCare\\AccessError $e){echo $e->status;}}`;
 const r=spawnSync(php.binary,[...php.args,'-r',code],{cwd:root,encoding:'utf8',windowsHide:true});assert.equal(r.status,0,r.stderr);assert.equal(r.stderr,'');assert.ok(r.stdout.endsWith('422422422'));
});
test('consulta recuperada se presenta con unidades y texto escapado',()=>{
 const html=consultationPreview({date:'2026-01-01',reason:'<script>bad()</script>',treatment:'A & B',notes:null,weight:1,temperature:3825,heartRate:80,respiratoryRate:null});assert.match(html,/0.001 kg/);assert.match(html,/38.25 °C/);assert.ok(!html.includes('<script>'));assert.match(html,/A &amp; B/);assert.match(html,/Sin observaciones/);
});
