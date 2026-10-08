export const ATTENTION_KINDS=['consulta','vacuna','desparasitacion','seguimiento'];
export function decimalInteger(value,scale,{positive=false}={}){
 if(typeof value!=='string')throw new Error('Escribe un número válido.');
 const text=value.trim();if(text==='')return null;
 if(text.length>24||!new RegExp(`^[+-]?\\d+(?:[.,]\\d{1,${scale}})?$`).test(text))throw new Error(`Usa hasta ${scale} decimales, sin separadores de miles.`);
 const negative=text.startsWith('-'),[whole,fraction='']=text.replace(/^[+-]/,'').replace(',','.').split('.');
 const number=BigInt(whole)*10n**BigInt(scale)+BigInt(fraction.padEnd(scale,'0'));
 const signed=negative?-number:number;
 if(signed>2147483647n||signed< -2147483647n||(positive&&signed<=0n))throw new Error(positive?'Debe ser positivo y estar dentro del límite técnico.':'Número fuera del límite técnico.');
 return Number(signed);
}
export function integerMeasurement(value){
 if(typeof value!=='string')throw new Error('Escribe un entero positivo.');
 const text=value.trim();if(text==='')return null;
 if(!/^\d{1,10}$/.test(text)||Number(text)<1||Number(text)>2147483647)throw new Error('Escribe un entero positivo, sin decimales.');
 return Number(text);
}
export function validCalendarDate(value){
 if(typeof value!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(value)||value<'1000-01-01')return false;
 const date=new Date(value+'T12:00:00Z');return !Number.isNaN(date.valueOf())&&date.toISOString().slice(0,10)===value;
}
export function todayMexico(){return new Intl.DateTimeFormat('en-CA',{timeZone:'America/Mexico_City',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());}
export function validateAttention(input,{today=todayMexico(),birthDate=null}={}){
 const errors={},data={kind:input.kind,patientId:input.patientId,patientVersion:input.patientVersion};
 if(!ATTENTION_KINDS.includes(input.kind))errors.kind='Tipo de atención no válido.';
 if(!validCalendarDate(input.date)||input.date>today)errors.date='Indica una fecha válida que no sea futura.';
 else if(birthDate&&input.date<birthDate)errors.date='La atención no puede ser anterior al nacimiento registrado.';
 data.date=input.date;
 const text=(key,required=false)=>{const value=input[key]??'';if(typeof value!=='string'||[...value].length>10000||/[\x00-\x08\x0B\x0C\x0E-\x1F]/.test(value)||(required&&!value.trim()))errors[key]=required?'Completa este campo con un máximo de 10000 caracteres.':'Usa como máximo 10000 caracteres.';else data[key]=value.trim()||null;};
 const numeric=(key,parser)=>{try{data[key]=parser(input[key]??'');}catch(error){errors[key]=error.message;}};
 text('notes');
 if(input.kind==='consulta'){
  text('reason',true);text('treatment');numeric('weight',value=>decimalInteger(value,3,{positive:true}));numeric('temperature',value=>decimalInteger(value,2));numeric('heartRate',integerMeasurement);numeric('respiratoryRate',integerMeasurement);
 }else if(input.kind==='vacuna'||input.kind==='desparasitacion'){
  text('product',true);if(typeof input.product==='string'&&[...input.product].length>200)errors.product='Usa como máximo 200 caracteres.';
  if(input.kind==='vacuna'){text('application');if(typeof input.application==='string'&&[...input.application].length>200)errors.application='Usa como máximo 200 caracteres.';}
  else numeric('weight',value=>decimalInteger(value,3,{positive:true}));
  const next=input.nextDate??'';if(next!==''&&(!validCalendarDate(next)||(validCalendarDate(input.date)&&next<input.date)))errors.nextDate='La próxima fecha debe ser válida y no anterior a la aplicación.';data.nextDate=next||null;
 }else if(input.kind==='seguimiento'){
  text('application',true);errors.consultationId='El seguimiento requiere una consulta registrada; se integrará después del módulo de consultas.';data.consultationId=input.consultationId;
 }
 return {valid:Object.keys(errors).length===0,errors,data};
}
