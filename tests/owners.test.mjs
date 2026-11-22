import {test} from 'node:test';
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {root,phpCommand} from '../scripts/environment.mjs';
import {ownersPage} from '../web/owners.js';
const php=phpCommand();
function evaluate(code){const r=spawnSync(php.binary,[...php.args,'-r',`require 'server/auth.php';require 'server/owners.php';${code}`],{cwd:root,encoding:'utf8',windowsHide:true});assert.equal(r.status,0,r.stderr);assert.equal(r.stderr,'');return r.stdout;}
test('propietario: nombre obligatorio y campos opcionales, conserva teléfonos como texto',()=>{
 assert.deepEqual(JSON.parse(evaluate(`echo json_encode(\\VetCare\\ownerFields(['name'=>' Ana ','phone'=>'+52 00123']));`)),{name:'Ana',phone:'+52 00123',address:'',locality:''});
});
test('propietario: rechaza vacíos, tipos, controles y longitudes excesivas',()=>{
 assert.equal(evaluate(`foreach([['name'=>'  '],['name'=>[]],['name'=>'Ana','phone'=>str_repeat('x',51)],['name'=>'Ana','address'=>str_repeat('x',501)],['name'=>'Ana','locality'=>str_repeat('x',201)],['name'=>"test\\0name"]] as $data){try{\\VetCare\\ownerFields($data);echo 'X';}catch(\\VetCare\\AccessError $e){echo $e->status;}}`),'422422422422422422');
});
test('propietario: UUID generado y rechazo de identificadores manipulados',()=>{
 assert.equal(evaluate(`echo (int)(\\VetCare\\requireUuid(\\VetCare\\uuid())!=='');try{\\VetCare\\requireUuid("' OR 1=1");}catch(\\VetCare\\AccessError $e){echo $e->status;}`),'1422');
});
test('propietario: las credenciales de su portal son válidas, únicas en formato y nunca regresan la contraseña',()=>{
 const result=JSON.parse(evaluate(`$value=\\VetCare\\ownerPortalCredentials(['portalUsername'=>'Cliente.01','portalPassword'=>'clave-segura-de-prueba'],true);echo json_encode(['username'=>$value['username'],'verified'=>password_verify('clave-segura-de-prueba',$value['passwordHash']),'hasPassword'=>array_key_exists('password',$value)]);`));
 assert.deepEqual(result,{username:'cliente.01',verified:true,hasPassword:false});
 assert.equal(evaluate(`foreach([[],['portalUsername'=>'ab','portalPassword'=>'clave-segura-de-prueba'],['portalUsername'=>'cliente','portalPassword'=>'corta']] as $data){try{\\VetCare\\ownerPortalCredentials($data,true);echo 'X';}catch(\\VetCare\\AccessError $e){echo $e->reason.'|';}}`),'OWNER_PORTAL_CREDENTIALS_REQUIRED|INVALID_OWNER_PORTAL_CREDENTIALS|INVALID_OWNER_PORTAL_CREDENTIALS|');
});
test('vista de propietarios ofrece alta sin exponer detalles técnicos del almacenamiento',()=>{
 const html=ownersPage();assert.match(html,/Datos de contacto y registro de propietarios/);assert.doesNotMatch(html,/MariaDB/);assert.match(html,/name="portalUsername"/);assert.match(html,/name="portalPassword"/);assert.match(html,/minlength="12"/);assert.ok(!html.includes('Ana Martínez'));
});
