import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

test('recarga con sesión: mantiene oculto el login hasta autenticar; directorios se reutilizan solo en memoria',async()=>{
 const html=await readFile(new URL('../web/index.html',import.meta.url),'utf8');
 assert.match(html,/<section hidden id="login-gate"/);assert.match(html,/id="auth-loading"/);
 assert.match(html,/img-src 'self' data:/);
 assert.match(html,/class="consultation-qr-content"/);
 const previous={window:globalThis.window,document:globalThis.document,fetch:globalThis.fetch,interval:globalThis.setInterval};
 const nodes=new Map(),assignments=[],events=new Map(),calls=[];let resolveSession;
 function node(id){if(!nodes.has(id)){let hidden=id==='login-gate';nodes.set(id,{get hidden(){return hidden;},set hidden(value){hidden=value;if(id==='login-gate')assignments.push(value);},textContent:'',open:false,addEventListener(){}});}return nodes.get(id);}
 globalThis.document={getElementById:node,body:{classList:{toggle(){},remove(){}}}};
 globalThis.window={addEventListener:(name,fn)=>events.set(name,fn),dispatchEvent:event=>events.get(event.type)?.(event)};
 globalThis.setInterval=()=>0;
 globalThis.fetch=async(url,options)=>{
  calls.push([url,options]);
  if(url.includes('/auth/session'))await new Promise(resolve=>{resolveSession=resolve;});
  return {status:200,json:async()=>url.includes('/auth/session')?{user:{id:'test',role:'administrador',name:'Prueba'},csrf:'csrf',directory:{action:'patients',query:{q:'',species:'',status:'active',page:'1'},data:{patients:[]}}}:{owners:[],ok:true}};
 };
 try{
  const {initializeAuth,invalidateDirectoryCache,request}=await import('../web/auth.js?startup-test');let identityChanges=0;
  const ready=initializeAuth(()=>identityChanges++);
  assert.equal(node('login-gate').hidden,true);assert.deepEqual(assignments,[]);
  resolveSession();await ready;
  assert.deepEqual(assignments,[true]);assert.equal(node('auth-loading').hidden,true);assert.equal(identityChanges,1);
  await request('patients',{q:'',species:'',status:'active',page:'1'});assert.equal(calls.length,1);
  await request('owners',{page:'1'});await request('owners',{page:'1'});
  assert.equal(calls.filter(([url])=>url.includes('/owners')).length,1);
  await request('owners',{page:'1'},{fresh:true});assert.equal(calls.filter(([url])=>url.includes('/owners')).length,2);
  await request('createOwner',{name:'Prueba'});await request('owners',{page:'1'});
  assert.equal(calls.filter(([url,opts])=>url.includes('/owners')&&opts.method==='GET').length,3);
  invalidateDirectoryCache();await request('owners',{page:'1'});
  assert.equal(calls.filter(([url,opts])=>url.includes('/owners')&&opts.method==='GET').length,4);
  window.dispatchEvent(new Event('vetcare:unauthenticated'));assert.equal(node('login-gate').hidden,false);
 }finally{globalThis.window=previous.window;globalThis.document=previous.document;globalThis.fetch=previous.fetch;globalThis.setInterval=previous.interval;}
});
