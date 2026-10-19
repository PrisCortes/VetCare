import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:net';
import { startServices } from '../scripts/services.mjs';
import { loadEnvironment } from '../scripts/environment.mjs';
loadEnvironment();
async function unusedPort() { const server = createServer(); await new Promise(resolve => server.listen(0, '127.0.0.1', resolve)); const port = server.address().port; await new Promise(resolve => server.close(resolve)); return port; }
test('web y PHP locales: salud, errores y aislamiento de archivos', async () => {
  const webPort = await unusedPort(); let apiPort = await unusedPort(); while (apiPort === webPort) apiPort = await unusedPort();
  const services = await startServices({ webPort, apiPort });
  try {
    const page = await fetch(services.url); assert.equal(page.status, 200); assert.match(await page.text(), /VetCare/);
    for (const asset of ['history.js','attention-controller.js','attention.js','attention-validation.js','attention.css','patients.js','owners.js','offline-ui.js','auth.js','auth.css','main.js','view-state.js','views.js','diagnostics.js','styles.css','mobile.css','application.css']) assert.equal((await fetch(services.url + '/' + asset)).status, 200, asset);
    const health = await fetch(services.url + '/api/v1/health'); assert.equal(health.status, 200); assert.deepEqual(await health.json(), { service: 'vetcare-api', status: 'ok', database: 'not_checked' });
    const anonymous=await fetch(services.url+'/api/v1/auth/session');assert.equal(anonymous.status,401);
    const anonymousOwners=await fetch(services.url+'/api/v1/owners');assert.equal(anonymousOwners.status,401);
    const anonymousOffline=await fetch(services.url+'/api/v1/offline/bootstrap',{method:'POST',headers:{Origin:process.env.APP_ORIGIN||services.url,'Content-Type':'application/json'},body:'{}'});assert.equal(anonymousOffline.status,401);
    const anonymousConsultations=await fetch(services.url+'/api/v1/consultations?patientId=11111111-1111-4111-8111-111111111111');assert.equal(anonymousConsultations.status,401);
    const anonymousSanitary=await fetch(services.url+'/api/v1/sanitary-events?patientId=11111111-1111-4111-8111-111111111111&kind=vacuna');assert.equal(anonymousSanitary.status,401);
    for(const path of ['/api/v1/history','/api/v1/consultation-versions']){assert.equal((await fetch(services.url+path)).status,401);assert.equal((await fetch(services.url+path,{method:'DELETE'})).status,405);}
    const deleteConsultation=await fetch(services.url+'/api/v1/consultations',{method:'DELETE'});assert.equal(deleteConsultation.status,405);
    const deleteSanitary=await fetch(services.url+'/api/v1/sanitary-events',{method:'DELETE'});assert.equal(deleteSanitary.status,405);
    const anonymousAttention=await fetch(services.url+'/api/v1/attention/validate',{method:'POST',headers:{Origin:process.env.APP_ORIGIN||services.url,'Content-Type':'application/json'},body:'{}'});assert.equal(anonymousAttention.status,401);
    const wrongAttentionMethod=await fetch(services.url+'/api/v1/attention/validate');assert.equal(wrongAttentionMethod.status,405);
    const wrongAttentionOrigin=await fetch(services.url+'/api/v1/attention/validate',{method:'POST',headers:{Origin:'https://evil.example','Content-Type':'application/json'},body:'{}'});assert.equal(wrongAttentionOrigin.status,403);
    const deleteOwner=await fetch(services.url+'/api/v1/owners',{method:'DELETE'});assert.equal(deleteOwner.status,405);
    const crossOriginOwner=await fetch(services.url+'/api/v1/owners',{method:'POST',headers:{Origin:'https://evil.example','Content-Type':'application/json'},body:JSON.stringify({name:'test'})});assert.equal(crossOriginOwner.status,403);
    const wrongOrigin=await fetch(services.url+'/api/v1/auth/login',{method:'POST',headers:{Origin:'https://evil.example','Content-Type':'application/json'},body:JSON.stringify({username:'test',password:'not-a-real-password'})});
    assert.equal(wrongOrigin.status,403);assert.equal((await wrongOrigin.json()).error.code,'ORIGIN_REJECTED');
    const badType=await fetch(services.url+'/api/v1/auth/login',{method:'POST',headers:{Origin:process.env.APP_ORIGIN || services.url,'Content-Type':'text/plain'},body:'username=test'});assert.equal(badType.status,415);
    const method = await fetch(services.url + '/api/v1/health', { method: 'POST' }); assert.equal(method.status, 405); assert.equal(method.headers.get('allow'), 'GET');
    const missing = await fetch(services.url + '/api/v1/patients'); assert.equal(missing.status, 401); assert.equal((await missing.json()).error.code, 'UNAUTHENTICATED');
    for (const path of ['/.env', '/package.json', '/server/bootstrap.php', '/docs/gestion/T01_revision_documental.md', '/%2e%2e%2fREADME.md']) {
      assert.equal((await fetch(services.url + path)).status, 404, path);
    }
    assert.equal((await fetch(services.apiUrl + '/server/bootstrap.php')).status, 404);
    assert.equal((await fetch(services.url + '/styles.css')).headers.get('content-type'), 'text/css; charset=utf-8');
  } finally { await services.stop(); }
});
