import {test} from 'node:test';
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {root,phpCommand} from '../scripts/environment.mjs';

const php=phpCommand();
test('documento público: genera un PDF de consulta con campos clínicos y vacunación del mismo día',()=>{
 const code=`require 'server/bootstrap.php';require 'server/public-documents.php';$row=['date'=>'2026-11-21','owner_name'=>'Propietario prueba','owner_phone'=>'555123','patient_name'=>'Mascota prueba','breed'=>'Mestizo','age_snapshot'=>'{"birthDate":"2020-01-01","ageValue":null,"ageUnit":null}','weight_g'=>12500,'respiratory_rate'=>20,'heart_rate'=>80,'blood_pressure'=>'120/80','temperature_cent'=>3850,'reason'=>'Revisión general','treatment'=>'Tratamiento indicado','notes'=>'Observación clínica'];echo \\VetCare\\pdfBuild($row,[['date'=>'2026-11-21','product'=>'Vacuna prueba','application'=>'Refuerzo']]);`;
 const result=spawnSync(php.binary,[...php.args,'-r',code],{cwd:root,encoding:null,windowsHide:true});assert.equal(result.status,0,result.stderr?.toString());assert.ok(result.stdout.subarray(0,8).toString().startsWith('%PDF-1.'));const text=result.stdout.toString('latin1');for(const phrase of ['Propietario prueba','Mascota prueba','120/80','Tratamiento indicado','Vacuna prueba','Refuerzo'])assert.ok(text.includes(phrase),phrase);
});
