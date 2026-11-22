import {request,isOffline,storageLabel} from './auth.js';
import {escapeHtml as e} from './view-state.js';

export function ownersPage(){return `<section id="owners-panel"><div class="page-heading"><div><span class="eyebrow">${isOffline()?'DIRECTORIO LOCAL':'DIRECTORIO CENTRAL'}</span><h1>Propietarios</h1><p>${isOffline()?'Registros locales. Los cambios quedan pendientes de sincronización.':'Datos de contacto y registro de propietarios.'}</p></div><button class="button" type="button" data-owner-new>Nuevo propietario</button></div><p id="owners-notice" role="status" aria-live="polite">Cargando propietarios…</p><section class="panel" id="owner-editor" hidden><h2 id="owner-editor-title">Nuevo propietario</h2><form id="owner-form"><div class="field-grid"><label>Nombre *<input name="name" maxlength="200" required></label><label>Teléfono<input name="phone" maxlength="50" type="tel"></label><label>Domicilio<input name="address" maxlength="500"></label><label>Localidad<input name="locality" maxlength="200"></label></div><p>Solo el nombre es obligatorio. Puede haber propietarios con nombres iguales.</p><div class="form-actions"><button class="button secondary" type="button" data-owner-cancel>Cancelar</button><button class="button" type="submit">Guardar propietario</button></div><p id="owner-form-notice" role="status" aria-live="polite"></p></form></section><section class="panel"><form id="owners-search" class="toolbar"><label>Buscar por nombre, teléfono o localidad<input name="q" maxlength="200" type="search"></label><label>Estado<select name="status"><option value="active">Activos</option><option value="inactive">Inactivos</option><option value="all">Todos</option></select></label><button class="button secondary" type="submit">Buscar / actualizar</button></form><div class="table-wrap"><table><thead><tr><th>Nombre</th><th>Teléfono</th><th>Localidad</th><th>Estado</th><th>Acciones</th></tr></thead><tbody id="owners-rows"></tbody></table></div><div class="form-actions"><button class="button secondary" type="button" id="owners-prev" disabled>Anterior</button><span id="owners-page"></span><button class="button secondary" type="button" id="owners-next" disabled>Siguiente</button></div></section></section>`;}

export function initializeOwners(panel,{onDirty=()=>{},openNew=false}={}){
 const find=id=>panel.querySelector('#'+id),form=find('owner-form'),editor=find('owner-editor'),notice=find('owners-notice');
 let rows=[],page=1,hasMore=false,editing=null,changed=false,busy=false,sequence=0,pending=null;
 const operations=new Map();
 const setDirty=value=>{changed=value;onDirty(value);};
 const discard=()=>!changed||window.confirm('¿Descartar los cambios del propietario sin guardar?');
 function edit(owner=null){
  if(busy||!discard())return;form.reset();editing=owner;pending=null;setDirty(false);
  for(const name of ['name','phone','address','locality'])form.elements[name].value=owner?.[name]||'';
  find('owner-editor-title').textContent=owner?'Editar propietario':'Nuevo propietario';find('owner-form-notice').textContent='';editor.hidden=false;form.elements.name.focus();
 }
 async function load(fresh=false){
  const requestNumber=++sequence;notice.textContent='Cargando propietarios…';find('owners-next').disabled=true;find('owners-prev').disabled=true;
  try{
   const filters=new FormData(find('owners-search'));
   const result=await request('owners',{q:filters.get('q'),status:filters.get('status'),page:String(page)},{fresh});
   if(!panel.isConnected||requestNumber!==sequence)return;
   rows=result.owners;hasMore=result.hasMore;
   find('owners-rows').innerHTML=rows.length?rows.map(owner=>`<tr><td data-label="Nombre"><strong>${e(owner.name)}</strong><small>${e(owner.address||'Sin domicilio')}</small></td><td data-label="Teléfono">${e(owner.phone||'Sin teléfono')}</td><td data-label="Localidad">${e(owner.locality||'Sin localidad')}</td><td data-label="Estado">${owner.active?'Activo':'Inactivo'}</td><td data-label="Acciones"><button class="text-button" type="button" data-owner-edit="${e(owner.id)}">Editar</button><button class="text-button" type="button" data-owner-toggle="${e(owner.id)}">${owner.active?'Dar de baja':'Reactivar'}</button></td></tr>`).join(''):'<tr><td colspan="5">No hay propietarios para este filtro.</td></tr>';
   const actionIcons=[['[data-owner-edit]','Editar propietario','pencil'],['[data-owner-toggle]','Dar de baja o reactivar','archive']];for(const [selector,label,icon] of actionIcons)for(const button of find('owners-rows').querySelectorAll(selector)){button.classList.add('action-icon');button.setAttribute('aria-label',label);button.setAttribute('title',label);button.innerHTML=`<svg aria-hidden="true"><use href="#${icon}"/></svg>`;}
   find('owners-page').textContent='Página '+page;notice.textContent=`${rows.length} propietarios en esta página.`;
   find('owners-prev').disabled=page<=1;find('owners-next').disabled=!hasMore;
  }catch(error){if(panel.isConnected&&requestNumber===sequence)notice.textContent=error.message;}
 }
 form.addEventListener('input',()=>setDirty(true));
 form.addEventListener('submit',async event=>{
  event.preventDefault();if(busy)return;
  const fields=Object.fromEntries(new FormData(form));for(const key of Object.keys(fields))fields[key]=fields[key].trim();
  if(!fields.name){find('owner-form-notice').textContent='Escribe el nombre del propietario.';return;}
  const payload={...fields,...(editing?{id:editing.id,version:editing.version,active:editing.active}:{})};
  const serialized=JSON.stringify(payload);
  if(pending&&pending.serialized!==serialized){find('owner-form-notice').textContent='El intento anterior no se confirmó. Reintenta los mismos datos o cancela y comprueba el directorio antes de crear otro registro.';return;}
  pending??={serialized,operationId:crypto.randomUUID()};busy=true;form.querySelector('button[type="submit"]').disabled=true;
  find('owner-form-notice').textContent='Guardando en el servidor…';
  try{
   await request(editing?'updateOwner':'createOwner',{...payload,operationId:pending.operationId});
   if(!panel.isConnected)return;pending=null;setDirty(false);editor.hidden=true;form.reset();await load(true);notice.textContent='Propietario guardado en '+storageLabel()+'.';
  }catch(error){
   if(error.status&&error.status<500)pending=null;
   if(panel.isConnected)find('owner-form-notice').textContent=error.message+' No se confirmó el guardado. Puedes reintentar los mismos datos.';
  }finally{busy=false;if(panel.isConnected)form.querySelector('button[type="submit"]').disabled=false;}
 });
 panel.addEventListener('click',async event=>{
  const button=event.target.closest('button');if(!button||busy)return;
  if(button.hasAttribute('data-owner-new'))edit();
  if(button.hasAttribute('data-owner-cancel')&&discard()){editor.hidden=true;pending=null;form.reset();setDirty(false);}
  if(button.dataset.ownerEdit)edit(rows.find(owner=>owner.id===button.dataset.ownerEdit));
  if(button.dataset.ownerToggle){
   if(!discard())return;
   const owner=rows.find(item=>item.id===button.dataset.ownerToggle);
   if(!owner||!window.confirm(`¿${owner.active?'Dar de baja':'Reactivar'} a ${owner.name}? El historial se conservará.`))return;
   busy=true;button.disabled=true;
   const payload={id:owner.id,name:owner.name,phone:owner.phone,address:owner.address,locality:owner.locality,version:owner.version,active:!owner.active};
   const key=JSON.stringify(payload);if(!operations.has(key))operations.set(key,crypto.randomUUID());
   try{await request('updateOwner',{...payload,operationId:operations.get(key)});operations.delete(key);editor.hidden=true;setDirty(false);await load();notice.textContent='Estado del propietario actualizado.';}
   catch(error){notice.textContent=error.message+' No se confirmó el cambio.';if(error.status&&error.status<500)operations.delete(key);}
   finally{busy=false;button.disabled=false;}
  }
 });
 let filterTimer;const queueFilter=()=>{clearTimeout(filterTimer);filterTimer=setTimeout(()=>{page=1;load(true);},180);};
 find('owners-search').addEventListener('input',queueFilter);find('owners-search').addEventListener('change',queueFilter);find('owners-search').addEventListener('submit',event=>{event.preventDefault();page=1;load(true);});
 find('owners-prev').addEventListener('click',()=>{if(page>1){page--;load();}});
 find('owners-next').addEventListener('click',()=>{if(hasMore){page++;load();}});
 load();if(openNew)edit();
}
