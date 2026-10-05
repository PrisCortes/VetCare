import {escapeHtml as e} from './view-state.js';
let csrf = '', currentUser = null;
const actions = { login:['POST','/auth/login'], session:['GET','/auth/session'], logout:['POST','/auth/logout'], users:['GET','/admin/users'], createUser:['POST','/admin/users'], updateUser:['PATCH','/admin/users'] };
async function request(action, data) {
  let response;
  if (window.vetcare?.auth) response = await window.vetcare.auth(action, data);
  else {
    const [method,path] = actions[action];
    const result = await fetch('/api/v1' + path, {
      method, credentials:'same-origin', cache:'no-store', signal:AbortSignal.timeout(25000),
      headers:{ ...(method!=='GET'?{'Content-Type':'application/json','X-CSRF-Token':csrf}:{}) },
      ...(method!=='GET'?{body:JSON.stringify(data ?? {})}:{}),
    });
    response = {status:result.status,data:await result.json()};
    if (response.data.csrf) csrf = response.data.csrf;
  }
  if (response.status >= 400) {
    const error = new Error(response.data.error?.message || 'No se pudo completar la solicitud.');
    error.status = response.status; throw error;
  }
  return response.data;
}
export async function initializeAuth(onIdentityChange) {
  const gate=document.getElementById('login-gate'), notice=document.getElementById('login-notice'), form=document.getElementById('login-form');
  const userLabel=document.getElementById('session-user'), logout=document.getElementById('logout'), manage=document.getElementById('manage-users'), modal=document.getElementById('users-dialog');
  function identity(user) {
    const previous=currentUser;currentUser=user;csrf=user?csrf:'';
    document.body.classList.toggle('auth-locked',!user);gate.hidden=!!user;
    userLabel.textContent=user ? `${user.name} · ${user.role==='administrador'?'Administrador':'Veterinario'}` : '';
    manage.hidden=user?.role!=='administrador';logout.hidden=!user;
    if (!user && modal.open) modal.close();
    if (previous?.id!==user?.id) onIdentityChange();
  }
  form.addEventListener('submit',async event=>{
    event.preventDefault();const button=form.querySelector('button');button.disabled=true;notice.textContent='Verificando acceso…';
    try {
      const data=new FormData(form);
      const result=await request('login',{username:data.get('username'),password:data.get('password')});
      form.reset();identity(result.user);notice.textContent='';
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
  async function refresh() {
    try { const result=await request('session');identity(result.user);notice.textContent=''; }
    catch(error) { identity(null);notice.textContent=error.status===401?'Ingresa con tu cuenta de VetCare.':error.message; }
  }
  await refresh();
  // Consultar vigencia no prolonga la sesión en el servidor.
  setInterval(()=>{if(currentUser)refresh();},60000);
}
