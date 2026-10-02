// Muestra optativa para revisar pantallas; no es una base clínica.
const demo={
 owners:[{id:'o1',name:'Ana Martínez',phone:'Sin teléfono registrado',town:'Apan'},{id:'o2',name:'Luis Hernández',phone:'Sin teléfono registrado',town:'Almoloya'},{id:'o3',name:'Sofía Ramírez',phone:'Sin teléfono registrado',town:'Apan'}],
 patients:[{id:'p1',name:'Luna',species:'Perro',breed:'Labrador',ownerId:'o1',age:'3 años · estimada',weight:'24.5 kg',weightDate:'2026-09-28'},{id:'p2',name:'Milo',species:'Gato',breed:'Doméstico',ownerId:'o2',age:'2 años · estimada',weight:'4.2 kg',weightDate:'2026-09-27'},{id:'p3',name:'Estrella',species:'Vaca',breed:'Holstein',ownerId:'o3',age:'5 años · estimada',weight:null},{id:'p4',name:'Rayo',species:'Caballo',breed:'Sin especificar',ownerId:'o3',age:'Edad no registrada',weight:null},{id:'p5',name:'Nala',species:'Borrego',breed:'Sin especificar',ownerId:'o1',age:'1 año · estimada',weight:null}],
 consultations:[{id:'c1',patientId:'p1',date:'2026-09-28',reason:'Consulta de revisión · ejemplo',treatment:'Sin tratamiento registrado en esta muestra.',notes:'Dato ficticio para revisar el expediente.',weight:'24.5',temperature:null,heartRate:null,respiratoryRate:null}],
 followups:[{id:'s1',consultationId:'c1',date:'2026-09-28',application:'Anotación de seguimiento · ejemplo',notes:'Sin indicaciones clínicas reales.'}],
 vaccines:[{id:'v1',patientId:'p1',date:'2026-09-10',product:'Vacuna de ejemplo',application:'Anotación ficticia',nextDate:'2026-10-10'}],
 dewormings:[{id:'d1',patientId:'p1',date:'2026-09-10',product:'Desparasitante de ejemplo',weight:'24.5',nextDate:null}]
};
const empty=()=>({owners:[],patients:[],consultations:[],followups:[],vaccines:[],dewormings:[]});
export const normalizeSearch=value=>String(value).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLocaleLowerCase('es').trim();
export const escapeHtml=value=>String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
export function createViewState(){
 let data=empty(),selected=null,isDemo=false;
 return {
  get data(){return structuredClone(data);},get demo(){return isDemo;},
  loadDemo(){data=structuredClone(demo);selected=data.patients[0].id;isDemo=true;},
  clearDemo(){data=empty();selected=null;isDemo=false;},
  select(id){if(!data.patients.some(p=>p.id===id))return false;selected=id;return true;},
  get selected(){return structuredClone(data.patients.find(p=>p.id===selected)||null);},
  filterPatients(query='',species='Todas'){const term=normalizeSearch(query);return structuredClone(data.patients.filter(p=>{const owner=data.owners.find(o=>o.id===p.ownerId);return(species==='Todas'||p.species===species)&&normalizeSearch(`${p.name} ${p.breed} ${owner?.name||''}`).includes(term);}));}
 };
}
