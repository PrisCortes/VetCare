import {test} from 'node:test';
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {root,phpCommand} from '../scripts/environment.mjs';

const php=phpCommand();
function evaluate(code,{env={}}={}){
 const result=spawnSync(php.binary,[...php.args,'-r',`require 'server/auth.php';require 'server/owners.php';require 'server/portal.php';${code}`],{cwd:root,encoding:'utf8',windowsHide:true,env:{...process.env,...env}});
 assert.equal(result.status,0,result.stderr);assert.equal(result.stderr,'');return result.stdout;
}
test('portal: exige origen propio y mantiene la cookie aislada de la sesión clínica',()=>{
 const result=JSON.parse(evaluate(`echo json_encode([\\VetCare\\portalOrigin(),\\VetCare\\portalPublicOwner(['id'=>'owner','name'=>'Ana']),\\VetCare\\portalSessionValid(['owner_active'=>1,'account_active'=>1,'expires_at'=>20000,'last_seen'=>10000],11799)]);`,{env:{PORTAL_ORIGIN:'https://portal.example'}}));
 assert.deepEqual(result,['https://portal.example',{id:'owner',name:'Ana'},true]);
 assert.equal(evaluate(`try{\\VetCare\\requirePortalOrigin('https://other.example');}catch(\\VetCare\\AccessError $error){echo $error->reason;}`,{env:{PORTAL_ORIGIN:'https://portal.example'}}),'PORTAL_ORIGIN_REJECTED');
});
test('portal: la API no intenta abrir MariaDB cuando no existe una cookie válida',()=>{
 const code=`register_shutdown_function(static function(){fwrite(STDERR,(string)http_response_code());});$_SERVER['REQUEST_METHOD']='GET';$_SERVER['REQUEST_URI']='/api/v1/portal/session';require 'api/index.php';`;
 const result=spawnSync(php.binary,[...php.args,'-r',code],{cwd:root,encoding:'utf8',windowsHide:true});
 assert.equal(result.status,0,result.stderr);assert.equal(result.stderr,'401');assert.equal(JSON.parse(result.stdout).error.code,'PORTAL_UNAUTHENTICATED');
});
test('portal: no acepta filtros ni cursores manipulados',()=>{
 for(const value of ['0','abc','10001',null])assert.throws(()=>evaluate(`\\VetCare\\portalPage(${value===null?'null':JSON.stringify(value)});`));
 assert.equal(evaluate(`try{\\VetCare\\portalCursor('alterado');}catch(\\VetCare\\AccessError $error){echo $error->reason;}`),'PORTAL_INVALID_FILTER');
});
