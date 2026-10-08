import {test} from 'node:test';
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {root,phpCommand} from '../scripts/environment.mjs';
import {ageLabel,patientsPage} from '../web/patients.js';
const php=phpCommand(),id='11111111-1111-4111-8111-111111111111';
function evaluate(code){const r=spawnSync(php.binary,[...php.args,'-r',`require 'server/auth.php';require 'server/owners.php';require 'server/patients.php';${code}`],{cwd:root,encoding:'utf8',windowsHide:true});assert.equal(r.status,0,r.stderr);assert.equal(r.stderr,'');return r.stdout;}
test('paciente multiespecie permite edad desconocida sin inventar nacimiento',()=>{
 const result=JSON.parse(evaluate(`echo json_encode(\\VetCare\\patientFields(['ownerId'=>'${id}','name'=>' Arete 12 ','species'=>'Cabra']));`));
 assert.equal(result.name,'Arete 12');assert.equal(result.species,'Cabra');assert.equal(result.birthDate,null);assert.equal(result.ageValue,null);
});
test('paciente rechaza fecha imposible, fecha futura y estimación incompleta o contradictoria',()=>{
 const code=`$base=['ownerId'=>'${id}','name'=>'Luna','species'=>'Perro'];foreach([['birthDate'=>'2025-02-29'],['birthDate'=>'2999-01-01'],['ageValue'=>3],['ageValue'=>-1,'ageUnit'=>'anios','ageReference'=>'2026-01-01'],['ageValue'=>1.5,'ageUnit'=>'anios','ageReference'=>'2026-01-01'],['birthDate'=>'2020-01-01','ageValue'=>2,'ageUnit'=>'anios','ageReference'=>'2026-01-01'],['name'=>' '],['ownerId'=>'invalid']] as $case){try{\\VetCare\\patientFields([...$base,...$case]);echo 'X';}catch(\\VetCare\\AccessError $e){echo $e->status;}}`;
 assert.equal(evaluate(code),'422422422422422422422422');
});
test('paciente conserva cero como estimación válida y fecha bisiesta válida',()=>{
 assert.equal(evaluate(`$p=\\VetCare\\patientFields(['ownerId'=>'${id}','name'=>'Cría','species'=>'Vaca','ageValue'=>0,'ageUnit'=>'dias','ageReference'=>'2024-02-29']);echo json_encode([$p['ageValue'],$p['ageReference']]);`),'[0,"2024-02-29"]');
});
test('ficha distingue edad desconocida y estimada y ofrece vínculo con propietario',()=>{
 assert.match(ageLabel({birthDate:null,ageValue:2,ageUnit:'meses',ageReference:'2026-01-01'}),/2 meses estimados al 2026-01-01/);
 assert.equal(ageLabel({birthDate:null,ageValue:null}),'Edad desconocida');assert.match(patientsPage(),/ownerId/);assert.match(patientsPage(),/Edad estimada/);
});
