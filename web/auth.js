import {escapeHtml as e} from './view-state.js';
import {initializeOfflineUi} from './offline-ui.js';
let csrf = '', currentUser = null,offlineExpiryTimer;
const directoryCache=new Map();
let directoryGeneration=0;
function clearDirectories(){directoryCache.clear();directoryGeneration++;}
function initialDirectory(){const hash=globalThis.location?.hash??'';return hash==='#propietarios'?'owners':hash===''||hash==='#pacientes'?'patients':null;}
export const authenticatedUser=()=>currentUser;
export const isOffline=()=>!!currentUser?.offline;
export const storageLabel=()=>isOffline()?'este equipo · pendiente de sincronización':'MariaDB';
export const invalidateDirectoryCache=()=>clearDirectories();
const actions = { login:['POST','/auth/login'], session:['GET','/auth/session'], logout:['POST','/auth/logout'], users:['GET','/admin/users'], createUser:['POST','/admin/users'], updateUser:['PATCH','/admin/users'], owners:['GET','/owners'],createOwner:['POST','/owners'],updateOwner:['PATCH','/owners'] };
Object.assign(actions,{patients:['GET','/patients'],createPatient:['POST','/patients'],updatePatient:['PATCH','/patients'],validateAttention:['POST','/attention/validate']});
Object.assign(actions,{consultations:['GET','/consultations'],createConsultation:['POST','/consultations'],updateConsultation:['PATCH','/consultations']});
Object.assign(actions,{sanitaryEvents:['GET','/sanitary-events'],createSanitaryEvent:['POST','/sanitary-events'],updateSanitaryEvent:['PATCH','/sanitary-events']});
Object.assign(actions,{history:['GET','/history'],carnet:['GET','/carnet'],consultationVersions:['GET','/consultation-versions']});
export async function request(action, data, {fresh=false}={}) {
  if (!Object.hasOwn(actions,action)) throw new Error('Acción no permitida.');
  const cacheable=['owners','patients'].includes(action)&&!!currentUser&&!currentUser.offline;
  const cacheKey=JSON.stringify([currentUser?.id,action,data??null]);
  const cached=directoryCache.get(cacheKey);
  if(cacheable&&!fresh&&cached&&Date.now()-cached.at<15000)return structuredClone(cached.data);
  if(!['owners','patients','session','users','validateAttention','consultations','sanitaryEvents','history','carnet','consultationVersions'].includes(action))clearDirectories();
  const generation=directoryGeneration,identityAtStart=currentUser?.id;
  let response;
  if (window.vetcare?.auth) response = await window.vetcare.auth(action, data);
  else {
    const [method,path] = actions[action];
    const suffix=method==='GET'&&data?'?'+new URLSearchParams(data):'';
    const result = await fetch('/api/v1' + path + suffix, {
      method, credentials:'same-origin', cache:'no-store', signal:AbortSignal.timeout(25000),
      headers:{ ...(method!=='GET'?{'Content-Type':'application/json','X-CSRF-Token':csrf}:{}) },
      ...(method!=='GET'?{body:JSON.stringify(data ?? {})}:{}),
    });
    response = {status:result.status,data:await result.json()};
    if (response.data.csrf) csrf = response.data.csrf;
  }
  if (response.status >= 400) {
    const error = new Error(response.data.error?.message || 'No se pudo completar la solicitud.');
    error.status = response.status;
    error.fields=response.data.fields??{};
    if(response.status===401)window.dispatchEvent(new Event('vetcare:unauthenticated'));
    throw error;
  }
  if(!['owners','patients','session','users','validateAttention','consultations','sanitaryEvents','history','carnet','consultationVersions'].includes(action))clearDirectories();
  if(cacheable&&generation===directoryGeneration&&identityAtStart===currentUser?.id){if(directoryCache.size>=50)directoryCache.delete(directoryCache.keys().next().value);directoryCache.set(cacheKey,{at:Date.now(),data:structuredClone(response.data)});}
  if(response.data.local)window.dispatchEvent(new CustomEvent('vetcare:local-result',{detail:{pending:response.data.pending,queue:response.data.queue}}));
  return response.data;
}
export async function initializeAuth(onIdentityChange) {
  const gate=document.getElementById('login-gate'), notice=document.getElementById('login-notice'), form=document.getElementById('login-form');
  const userLabel=document.getElementById('session-user'), logout=document.getElementById('logout'), manage=document.getElementById('manage-users'), modal=document.getElementById('users-dialog');
  function identity(user,directory=null) {
    const previous=currentUser;currentUser=user;csrf=user?csrf:'';
    clearTimeout(offlineExpiryTimer);if(user?.offline&&Number.isFinite(user.offlineRemainingMs))offlineExpiryTimer=setTimeout(()=>{window.vetcare?.offline?.('lock');identity(null);},Math.max(0,user.offlineRemainingMs));
    if(previous?.id!==user?.id||!!previous?.offline!==!!user?.offline)clearDirectories();
    if(user&&directory&&['owners','patients'].includes(directory.action))directoryCache.set(JSON.stringify([user.id,directory.action,directory.query]),{at:Date.now(),data:structuredClone(directory.data)});
    document.body.classList.toggle('auth-locked',!user);gate.hidden=!!user;
    document.body.classList.remove('auth-pending');
    document.getElementById('auth-loading').hidden=true;
    userLabel.textContent=user ? `${user.name} · ${user.role==='administrador'?'Administrador':'Veterinario'}` : '';
    manage.hidden=user?.role!=='administrador'||!!user?.offline;logout.hidden=!user;
    offlineUi.identity(user);
    if (!user && modal.open) modal.close();
    if (previous?.id!==user?.id||!!previous?.offline!==!!user?.offline)onIdentityChange(user);
  }
  const offlineUi=initializeOfflineUi({onUnlock:user=>identity(user)});
  window.addEventListener('vetcare:unauthenticated',()=>identity(null));
  form.addEventListener('submit',async event=>{
    event.preventDefault();const button=form.querySelector('button');button.disabled=true;notice.textContent='Verificando acceso…';
    try {
      const data=new FormData(form);
      const result=await request('login',{username:data.get('username'),password:data.get('password'),directory:initialDirectory()});
      const applied=Number(result.sync?.applied??0);if(applied>0)clearDirectories();form.reset();identity(result.user,applied>0?null:result.directory);notice.textContent=applied?`Se sincronizaron ${applied} operaciones pendientes.`:'';
    } catch(error) { notice.textContent=error.message;form.elements.password.value=''; }
    finally { button.disabled=false; }
  });
  logout.addEventListener('click',async()=>{
    if (!window.confirm('¿Cerrar sesión? Las capturas de demostración no se guardarán.')) return;
    logout.disabled=true;
    try { await request('logout');identity(null);notice.textContent='Sesión cerrada.'; }
    catch(error) { if(error.status===401) identity(null);else window.alert(error.message); }
    finally { logout.disabled=false; }
  });
  async function listUsers() {
    const result=await request('users');
    document.getElementById('users-list').innerHTML=result.users.map(user=>`<li class="account-row"><div><strong>${e(user.name)}</strong><small>${e(user.username)} · ${user.active?'Activo':'Inactivo'}</small></div><label>Rol<select data-role="${e(user.id)}"><option value="veterinario" ${user.role==='veterinario'?'selected':''}>Veterinario</option><option value="administrador" ${user.role==='administrador'?'selected':''}>Administrador</option></select></label><button type="button" class="button secondary" data-account="${e(user.id)}" data-active="${user.active}">Guardar rol</button><button type="button" class="button secondary" data-account="${e(user.id)}" data-active="${!user.active}">${user.active?'Desactivar':'Activar'}</button></li>`).join('');
  }
  manage.addEventListener('click',async()=>{
    modal.showModal();document.getElementById('users-notice').textContent='';
    try { await listUsers(); } catch(error) { document.getElementById('users-notice').textContent=error.message; }
  });
  document.getElementById('close-users').addEventListener('click',()=>{modal.close();document.getElementById('create-user-form').reset();});
  modal.addEventListener('cancel',()=>document.getElementById('create-user-form').reset());
  document.getElementById('create-user-form').addEventListener('submit',async event=>{
    event.preventDefault();const button=event.target.querySelector('button');button.disabled=true;
    try {
      await request('createUser',Object.fromEntries(new FormData(event.target)));event.target.reset();await listUsers();
      document.getElementById('users-notice').textContent='Cuenta creada.';
    } catch(error) { document.getElementById('users-notice').textContent=error.message; }
    finally { button.disabled=false;event.target.elements.password.value=''; }
  });
  document.getElementById('users-list').addEventListener('click',async event=>{
    const button=event.target.closest('[data-account]');if(!button)return;
    if(!window.confirm('¿Aplicar el cambio y revocar las sesiones de esta cuenta?'))return;
    button.disabled=true;
    try {
      await request('updateUser',{id:button.dataset.account,role:modal.querySelector(`[data-role="${button.dataset.account}"]`).value,active:button.dataset.active==='true'});
      if(button.dataset.account===currentUser.id){identity(null);notice.textContent='Tus permisos cambiaron. Inicia sesión de nuevo.';}
      else {await listUsers();document.getElementById('users-notice').textContent='Cuenta actualizada y sesiones revocadas.';}
    } catch(error) { document.getElementById('users-notice').textContent=error.message; }
    finally {button.disabled=false;}
  });
  async function refresh(initial=false) {
    try { const directory=initial?initialDirectory():null;const result=await request('session',directory?{directory}:undefined);identity(result.user,result.directory);notice.textContent=''; }
    catch(error) { identity(null);notice.textContent=error.status===401?'Ingresa con tu cuenta de VetCare.':error.message; }
  }
  await refresh(true);
  // Consultar vigencia no prolonga la sesión en el servidor.
  setInterval(()=>{if(currentUser)refresh();},60000);
}
