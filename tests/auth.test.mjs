import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { root, phpCommand } from '../scripts/environment.mjs';
import { createRequire } from 'node:module';
const {createAuthClient}=createRequire(import.meta.url)('../desktop/auth.cjs');
const php=phpCommand();
function evaluate(code) {
  const result=spawnSync(php.binary,[...php.args,'-r',`require 'server/auth.php'; ${code}`],{cwd:root,encoding:'utf8',windowsHide:true});
  assert.equal(result.status,0,result.stderr);assert.equal(result.stderr,'');return result.stdout;
}
test('permisos: veterinario clínico, administrador de cuentas, denegación por defecto',()=>{
  const values=JSON.parse(evaluate(`echo json_encode([\\VetCare\\permitted('veterinario','clinical.read'),\\VetCare\\permitted('veterinario','users.manage'),\\VetCare\\permitted('administrador','users.manage'),\\VetCare\\permitted('otro','clinical.read'),\\VetCare\\permitted('administrador','unknown')]);`));
  assert.deepEqual(values,[true,false,true,false,false]);
});
test('sesiones: límites de inactividad, duración absoluta y cuenta inactiva',()=>{
  assert.equal(evaluate(`$s=['active'=>1,'expires_at'=>20000,'last_seen'=>10000]; echo (int)\\VetCare\\sessionValid($s,11799); echo (int)\\VetCare\\sessionValid($s,11800); $s['expires_at']=10000;echo (int)\\VetCare\\sessionValid($s,10000);$s['active']=0;echo (int)\\VetCare\\sessionValid($s,9999);`),'1000');
});
test('contraseñas: hash verificable y rechazo de longitud que bcrypt truncaría',()=>{
  assert.equal(evaluate(`$p='clave-de-prueba-larga';$h=\\VetCare\\passwordHash($p);echo (int)password_verify($p,$h);echo (int)password_verify('equivocada',$h);foreach (['short',str_repeat('a',73),"null\\0byte-long"] as $bad){try{\\VetCare\\passwordHash($bad);echo 'X';}catch(\\VetCare\\AccessError $e){echo $e->status;}}`),'10422422422');
});
test('CSRF y origen: rechaza token ausente o alterado y origen externo',()=>{
  assert.equal(evaluate(`putenv('APP_ORIGIN=http://127.0.0.1:5173'); foreach (['','wrong'] as $token){try{\\VetCare\\requireCsrf(['csrf'=>'correct'],$token);}catch(\\VetCare\\AccessError $e){echo $e->status;}} \\VetCare\\requireCsrf(['csrf'=>'correct'],'correct');try{\\VetCare\\requireOrigin('https://evil.example');}catch(\\VetCare\\AccessError $e){echo $e->status;} \\VetCare\\requireOrigin('http://127.0.0.1:5173');`),'403403403');
});
test('gestión requiere reautenticación reciente y el rol del servidor',()=>{
  assert.equal(evaluate(`try{\\VetCare\\recentAuthentication(['authenticated_at'=>time()-300]);}catch(\\VetCare\\AccessError $e){echo $e->reason;}try{\\VetCare\\requirePermission(['role'=>'veterinario'],'users.manage');}catch(\\VetCare\\AccessError $e){echo $e->status;}`),'REAUTHENTICATE403');
});
test('API bloquea sesión y administración anónimas sin necesitar MariaDB',()=>{
  for(const path of ['/api/v1/auth/session','/api/v1/admin/users','/api/v1/access']) {
    const result=spawnSync(php.binary,[...php.args,'-r',`register_shutdown_function(static function(){fwrite(STDERR,(string)http_response_code());});$_SERVER['REQUEST_URI']=$argv[1];require 'api/index.php';`,path],{cwd:root,encoding:'utf8',windowsHide:true});
    assert.equal(result.stderr,'401');assert.equal(JSON.parse(result.stdout).error.code,'UNAUTHENTICATED');
  }
});
test('Electron mantiene cookie y CSRF privados y rechaza rutas arbitrarias',async()=>{
  const original=globalThis.fetch,calls=[];
  globalThis.fetch=async(url,options)=>{
    calls.push({url,options});
    return {ok:true,status:200,headers:{getSetCookie:()=>['vc_session=secret-token; HttpOnly; Path=/api/v1']},json:async()=>({user:{id:'test'},csrf:'secret-csrf'})};
  };
  try {
    const client=createAuthClient('http://127.0.0.1:5173');
    const result=await client('login',{username:'test',password:'test-password'});
    assert.deepEqual(result,{status:200,data:{user:{id:'test'}}});
    await client('users');
    assert.equal(calls[1].options.headers.Cookie,'vc_session=secret-token');
    assert.equal(calls[1].options.headers['X-CSRF-Token'],'secret-csrf');
    await assert.rejects(()=>client('https://evil.example'));
    await client('logout');await client('session');
    assert.equal(calls.at(-1).options.headers.Cookie,undefined);
  } finally {globalThis.fetch=original;}
});
