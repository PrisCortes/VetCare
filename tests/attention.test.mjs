import {test} from 'node:test';
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {root,phpCommand} from '../scripts/environment.mjs';
import {decimalInteger,integerMeasurement,validateAttention} from '../web/attention-validation.js';
import {attentionPage,attentionFormFields} from '../web/attention.js';
const php=phpCommand();
const base={kind:'consulta',patientId:'11111111-1111-4111-8111-111111111111',patientVersion:1,date:'2026-01-01',reason:'Revisión'};
test('mediciones exactas: gramos y centésimas sin redondeo silencioso',()=>{
 assert.equal(decimalInteger('0,001',3,{positive:true}),1);assert.equal(decimalInteger('24.500',3,{positive:true}),24500);assert.equal(decimalInteger('-0.01',2),-1);assert.equal(decimalInteger('',3),null);assert.equal(integerMeasurement('60'),60);
 for(const value of ['1e3','0.0001','1,234.56','NaN','Infinity','2147483.648'])assert.throws(()=>decimalInteger(value,3));
 for(const value of ['0','-2','1.2','1e2'])assert.throws(()=>integerMeasurement(value));
});
test('reglas equivalentes en PHP y JavaScript para los cuatro formularios',()=>{
 const cases=[base,{...base,weight:'0,001',temperature:'38,25',heartRate:'80',respiratoryRate:'20'}, {...base,reason:' '},{...base,weight:'0'}, {...base,temperature:'38.123'}, {...base,heartRate:'1.5'},{...base,date:'2025-02-29'}, {...base,date:'2999-01-01'}, {...base,date:'2019-01-01'}, {...base,reason:'😀'.repeat(10001)}, {kind:'vacuna',date:'2026-01-01',product:'Vacuna de prueba',nextDate:''},{kind:'vacuna',date:'2026-01-01',product:'Vacuna',nextDate:'2025-12-31'}, {kind:'vacuna',date:'2026-01-01',product:'Vacuna',application:'x'.repeat(201)}, {kind:'desparasitacion',date:'2026-01-01',product:'Producto',weight:'12.345',nextDate:'2026-12-01'}, {kind:'seguimiento',date:'2026-01-01',application:'Intervención'}];
 const code=`require 'server/auth.php';require 'server/owners.php';require 'server/patients.php';require 'server/attention.php';$cases=json_decode(stream_get_contents(STDIN),true,16,JSON_THROW_ON_ERROR);echo json_encode(array_map(fn($c)=>\\VetCare\\attentionFields($c,'2020-01-01','2026-11-18'),$cases),JSON_THROW_ON_ERROR);`;
 const r=spawnSync(php.binary,[...php.args,'-r',code],{cwd:root,encoding:'utf8',windowsHide:true,input:JSON.stringify(cases)});assert.equal(r.status,0,r.stderr);assert.equal(r.stderr,'');const server=JSON.parse(r.stdout);
 cases.forEach((input,index)=>{const client=validateAttention(input,{today:'2026-11-18',birthDate:'2020-01-01'});assert.equal(client.valid,server[index].valid,`caso ${index}`);assert.deepEqual(Object.keys(client.errors).sort(),Object.keys(server[index].errors).sort(),`campos caso ${index}`);if(client.valid)for(const [key,value]of Object.entries(server[index].data))assert.deepEqual(client.data[key],value,`caso ${index}: ${key}`);});
});
test('vacunas no generan próxima fecha ni diagnóstico y el contexto no se toma del texto de pantalla',()=>{
 const result=validateAttention({kind:'vacuna',date:'2026-01-01',product:'Prueba'},{today:'2026-11-18'});assert.equal(result.valid,true);assert.equal(result.data.nextDate,null);assert.equal(result.data.reason,undefined);
 assert.match(attentionPage(null),/Selecciona un paciente/);
 const html=attentionPage({id:base.patientId,name:'<script>bad()</script>',species:'Perro',ownerName:'A & B',version:1});assert.ok(!html.includes('<script>bad()'));assert.match(html,/&lt;script&gt;/);assert.match(html,/attention-capture-context/);assert.match(html,/data-mobile-capture/);assert.match(html,/aria-label="Acciones de la atención"/);assert.match(html,/Guardar consulta/);assert.match(attentionFormFields('consulta'),/latidos\/min/);
});
test('fecha realizada limitada a hoy y próxima aplicación futura permitida',()=>{
 const html=attentionFormFields('vacuna');const next=html.match(/<input id="attention-nextDate"[^>]*>/)[0];assert.ok(!next.includes('max='));assert.match(html,/<input id="attention-date"[^>]*max=/);
 assert.equal(validateAttention({kind:'vacuna',date:'2026-01-01',product:'Prueba',nextDate:'2027-01-01'},{today:'2026-11-18'}).valid,true);
 assert.equal(validateAttention({...base,date:'2027-01-01'},{today:'2026-11-18'}).valid,false);
});
