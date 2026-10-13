<?php
declare(strict_types=1);
namespace VetCare;
use PDO;

function scaledMeasurement(mixed $value,int $scale,bool $positive=false):?int{
 if(!is_string($value))throw new \InvalidArgumentException('Escribe un número válido.');$value=trim($value);if($value==='')return null;
 if(strlen($value)>24||!preg_match('/\A([+-]?)(\d+)(?:[.,](\d{1,'.$scale.'}))?\z/D',$value,$parts))throw new \InvalidArgumentException('Revisa los decimales y no uses separadores de miles.');
 $whole=ltrim($parts[2],'0');if(strlen($whole)>10)throw new \InvalidArgumentException('Número fuera del límite técnico.');
 $number=(int)$whole*(10**$scale)+(int)str_pad($parts[3]??'',$scale,'0');if($parts[1]==='-')$number=-$number;
 if(abs($number)>2147483647||($positive&&$number<=0))throw new \InvalidArgumentException($positive?'Escribe un número positivo.':'Número fuera del límite técnico.');return $number;
}
function frequencyMeasurement(mixed $value):?int{
 if(!is_string($value))throw new \InvalidArgumentException('Escribe un entero positivo.');$value=trim($value);if($value==='')return null;
 if(!preg_match('/\A\d{1,10}\z/D',$value)||(int)$value<1||(int)$value>2147483647)throw new \InvalidArgumentException('Escribe un entero positivo, sin decimales.');return (int)$value;
}
function attentionFields(array $input,?string $birthDate=null,?string $today=null):array{
 $today??=(new \DateTimeImmutable('today',new \DateTimeZone('America/Mexico_City')))->format('Y-m-d');
 $errors=[];$data=['kind'=>$input['kind']??null];
 if(!in_array($data['kind'],['consulta','vacuna','desparasitacion','seguimiento'],true))$errors['kind']='Tipo de atención no válido.';
 $calendar=static function(mixed $value):bool{if(!is_string($value)||!preg_match('/\A\d{4}-\d{2}-\d{2}\z/D',$value)||$value<'1000-01-01')return false;$date=\DateTimeImmutable::createFromFormat('!Y-m-d',$value);return $date&&$date->format('Y-m-d')===$value;};
 $date=$input['date']??null;
 if(!$calendar($date)||$date>$today)$errors['date']='Indica una fecha válida que no sea futura.';
 elseif($birthDate&&$date<$birthDate)$errors['date']='La atención no puede ser anterior al nacimiento registrado.';
 $data['date']=$date;
 $text=static function(string $key,bool $required=false,int $limit=10000)use($input,&$errors,&$data):void{$value=$input[$key]??'';if(!is_string($value)||!mb_check_encoding($value,'UTF-8')||mb_strlen($value)>$limit||preg_match('/[\x00-\x08\x0B\x0C\x0E-\x1F]/',$value)||($required&&trim($value)===''))$errors[$key]='Revisa este campo (máximo '.$limit.' caracteres).';else $data[$key]=trim($value)===''?null:trim($value);};
 $numeric=static function(string $key,callable $parse)use($input,&$data,&$errors):void{try{$data[$key]=$parse($input[$key]??'');}catch(\InvalidArgumentException $error){$errors[$key]=$error->getMessage();}};
 $text('notes');
 if($data['kind']==='consulta'){
  $text('reason',true);$text('treatment');$numeric('weight',fn($value)=>scaledMeasurement($value,3,true));$numeric('temperature',fn($value)=>scaledMeasurement($value,2));$numeric('heartRate','VetCare\\frequencyMeasurement');$numeric('respiratoryRate','VetCare\\frequencyMeasurement');
 }elseif(in_array($data['kind'],['vacuna','desparasitacion'],true)){
  $text('product',true,200);if($data['kind']==='vacuna')$text('application',false,200);else $numeric('weight',fn($value)=>scaledMeasurement($value,3,true));
  $next=$input['nextDate']??'';if($next!==''&&(!$calendar($next)||($calendar($date)&&$next<$date)))$errors['nextDate']='La próxima fecha debe ser válida y no anterior a la aplicación.';$data['nextDate']=$next===''?null:$next;
 }elseif($data['kind']==='seguimiento'){$text('application',true);$errors['consultationId']='El seguimiento requiere una consulta registrada; se integrará después del módulo de consultas.';}
 return ['valid'=>count($errors)===0,'errors'=>$errors,'data'=>$data];
}
function validatePatientAttention(PDO $db,array $actor,array $input):array{
 requirePermission($actor,'clinical.write');$id=requireUuid($input['patientId']??null);
 $q=$db->prepare('SELECT p.*,o.name AS owner_name FROM vc_patients p JOIN vc_owners o ON o.id=p.owner_id WHERE p.id=?');$q->execute([$id]);$patient=$q->fetch();
 if(!$patient)failAccess(404,'PATIENT_NOT_FOUND');
 $birth=$patient['birth_date'];$correction=false;
 if(isset($input['id'])){
  if(($input['kind']??null)!=='consulta')failAccess(422,'CONSULTATION_ONLY');
  $consultationId=requireUuid($input['id']);$q=$db->prepare('SELECT * FROM vc_consultations WHERE id=?');$q->execute([$consultationId]);$consultation=$q->fetch();
  if(!$consultation)failAccess(404,'CONSULTATION_NOT_FOUND');if($consultation['patient_id']!==$id)failAccess(409,'CONSULTATION_PATIENT_IMMUTABLE');
  if(!is_int($input['version']??null)||(int)$consultation['version']!==$input['version'])failAccess(409,'CONSULTATION_CONFLICT');
  $birth=json_decode($consultation['age_snapshot'],true,8,JSON_THROW_ON_ERROR)['birthDate'];$correction=true;
 }
 if(!(bool)$patient['active']&&!$correction)failAccess(409,'PATIENT_INACTIVE');
 if(!is_int($input['patientVersion']??null)||(int)$patient['version']!==$input['patientVersion'])failAccess(409,'PATIENT_CONTEXT_CHANGED');
 $result=attentionFields($input,$birth);
 if($result['valid'])$result['patient']=publicPatient($patient);
 return $result;
}
