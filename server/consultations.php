<?php
declare(strict_types=1);
namespace VetCare;
use PDO;

function consultationIdentity(array $input,bool $create):array{
 if(($input['kind']??null)!=='consulta')failAccess(422,'CONSULTATION_ONLY');
 $identity=['patientId'=>requireUuid($input['patientId']??null),'operationId'=>requireUuid($input['operationId']??null)];
 if(!is_int($input['patientVersion']??null)||$input['patientVersion']<1)failAccess(422,'INVALID_PATIENT');
 if(!$create){$identity['id']=requireUuid($input['id']??null);if(!is_int($input['version']??null)||$input['version']<1)failAccess(422,'INVALID_CONSULTATION_VERSION');}
 return $identity;
}
function publicConsultation(array $row):array{
 return ['id'=>$row['id'],'patientId'=>$row['patient_id'],'date'=>$row['date'],'reason'=>$row['reason'],'treatment'=>$row['treatment'],'notes'=>$row['notes'],'weight'=>$row['weight_g']===null?null:(int)$row['weight_g'],'temperature'=>$row['temperature_cent']===null?null:(int)$row['temperature_cent'],'heartRate'=>$row['heart_rate']===null?null:(int)$row['heart_rate'],'respiratoryRate'=>$row['respiratory_rate']===null?null:(int)$row['respiratory_rate'],'bloodPressure'=>$row['blood_pressure'],'ageSnapshot'=>json_decode($row['age_snapshot'],true,8,JSON_THROW_ON_ERROR),'version'=>(int)$row['version'],'createdBy'=>$row['created_by'],'updatedBy'=>$row['updated_by'],'createdAt'=>(int)$row['created_at'],'updatedAt'=>(int)$row['updated_at']];
}
function listConsultations(PDO $db,array $actor,array $query):array{
 requirePermission($actor,'clinical.read');$patient=requireUuid($query['patientId']??null);$page=$query['page']??'1';
 if(!is_string($page)||!ctype_digit($page)||(int)$page<1||(int)$page>10000)failAccess(422,'INVALID_FILTER');
 $q=$db->prepare('SELECT * FROM vc_consultations WHERE patient_id=? ORDER BY date DESC,id DESC LIMIT 21 OFFSET '.(((int)$page-1)*20));$q->execute([$patient]);$rows=$q->fetchAll();
 return ['consultations'=>array_map('VetCare\\publicConsultation',array_slice($rows,0,20)),'page'=>(int)$page,'hasMore'=>count($rows)>20];
}
function consultationDocumentUrl(string $token):string{return rtrim(allowedOrigin(),'/').'/api/v1/public/consultations/'.$token.'.pdf';}
function createConsultationDocument(PDO $db,array $actor,array $input):array{
 requirePermission($actor,'clinical.write');$patient=requireUuid($input['patientId']??null);$consultation=requireUuid($input['consultationId']??null);$version=$input['version']??null;
 if(!is_int($version)||$version<1)failAccess(422,'INVALID_CONSULTATION_VERSION');
 $q=$db->prepare('SELECT id,version FROM vc_consultations WHERE id=? AND patient_id=? FOR UPDATE');$q->execute([$consultation,$patient]);$row=$q->fetch();if(!$row)failAccess(404,'CONSULTATION_NOT_FOUND');if((int)$row['version']!==$version)failAccess(409,'CONSULTATION_CONFLICT');
 $token=bin2hex(random_bytes(32));$now=time();
 $db->prepare('INSERT INTO vc_consultation_documents(consultation_id,consultation_version,token_hash,created_by,created_at,revoked_at) VALUES(?,?,?,?,?,NULL) ON DUPLICATE KEY UPDATE consultation_version=VALUES(consultation_version),token_hash=VALUES(token_hash),created_by=VALUES(created_by),created_at=VALUES(created_at),revoked_at=NULL')->execute([$consultation,$version,hash('sha256',$token),$actor['id'],$now]);
 audit($db,$actor['id'],'consultation_document_created',$consultation);return ['url'=>consultationDocumentUrl($token),'consultationId'=>$consultation,'version'=>$version];
}
/** Transacción y bloqueo de operationId pertenecen al llamador. */
function saveConsultation(PDO $db,array $actor,array $input,bool $create,?string $offlineId=null,bool $reconcile=false):array{
 requirePermission($actor,'clinical.write');$identity=consultationIdentity($input,$create);
 $operation=$identity['operationId'];$patientId=$identity['patientId'];
 $payload=['offlineId'=>$offlineId];foreach(['kind','patientId','patientVersion','id','version','date','reason','treatment','notes','weight','temperature','heartRate','respiratoryRate','bloodPressure']as$key)$payload[$key]=$input[$key]??null;
 $hash=hash('sha256',json_encode([$create,$payload],JSON_THROW_ON_ERROR));
 $q=$db->prepare('SELECT * FROM vc_consultation_operations WHERE operation_id=?');$q->execute([$operation]);$previous=$q->fetch();
 if($previous){if($previous['actor_id']!==$actor['id']||!hash_equals($previous['payload_hash'],$hash))failAccess(409,'OPERATION_REUSED');return json_decode($previous['result'],true,16,JSON_THROW_ON_ERROR);}
 $q=$db->prepare('SELECT * FROM vc_patients WHERE id=? FOR UPDATE');$q->execute([$patientId]);$patient=$q->fetch();if(!$patient)failAccess(404,'PATIENT_NOT_FOUND');
 if((int)$patient['version']!==$input['patientVersion'])failAccess(409,'PATIENT_CONTEXT_CHANGED');
 if($create&&!(bool)$patient['active'])failAccess(409,'PATIENT_INACTIVE');
 $old=null;$conflict=null;$displaced=null;
 if(!$create){
  $q=$db->prepare('SELECT * FROM vc_consultations WHERE id=? FOR UPDATE');$q->execute([$identity['id']]);$old=$q->fetch();
  if(!$old)failAccess(404,'CONSULTATION_NOT_FOUND');
  if($old['patient_id']!==$patientId)failAccess(409,'CONSULTATION_PATIENT_IMMUTABLE');
  if((int)$old['version']!==$input['version']){
   if(!$reconcile)failAccess(409,'CONSULTATION_CONFLICT');
   $displaced=publicConsultation($old);
   $conflict=['base'=>(int)$input['version'],'displaced'=>(int)$old['version']];
  }
 }
 $age=$old?json_decode($old['age_snapshot'],true,8,JSON_THROW_ON_ERROR):['birthDate'=>$patient['birth_date'],'ageValue'=>$patient['age_value']===null?null:(int)$patient['age_value'],'ageUnit'=>$patient['age_unit'],'ageReference'=>$patient['age_reference'],'patientVersion'=>(int)$patient['version']];
 $validation=attentionFields($input,$age['birthDate']);
 if(!$validation['valid'])return ['saved'=>false,'fields'=>$validation['errors']];
 $data=$validation['data'];$now=time();$id=$create?($offlineId===null?uuid():requireUuid($offlineId)):$identity['id'];$version=$create?1:(int)$old['version']+1;$ageJson=json_encode($age,JSON_THROW_ON_ERROR);
 $values=[$data['date'],$data['reason'],$data['treatment'],$data['notes'],$data['weight'],$data['temperature'],$data['heartRate'],$data['respiratoryRate'],$data['bloodPressure']];
 if($create)$db->prepare('INSERT INTO vc_consultations(id,patient_id,date,reason,treatment,notes,weight_g,temperature_cent,heart_rate,respiratory_rate,blood_pressure,age_snapshot,version,created_by,updated_by,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)')->execute([$id,$patientId,...$values,$ageJson,$version,$actor['id'],$actor['id'],$now,$now]);
 else {$db->prepare('UPDATE vc_consultations SET date=?,reason=?,treatment=?,notes=?,weight_g=?,temperature_cent=?,heart_rate=?,respiratory_rate=?,blood_pressure=?,version=?,updated_by=?,updated_at=? WHERE id=?')->execute([...$values,$version,$actor['id'],$now,$id]);$db->prepare('UPDATE vc_consultation_documents SET revoked_at=? WHERE consultation_id=? AND revoked_at IS NULL AND consultation_version<?')->execute([$now,$id,$version]);}
 $result=['id'=>$id,'patientId'=>$patientId,...$data,'ageSnapshot'=>$age,'version'=>$version,'createdBy'=>$old['created_by']??$actor['id'],'updatedBy'=>$actor['id'],'createdAt'=>$old?(int)$old['created_at']:$now,'updatedAt'=>$now];
 $json=json_encode($result,JSON_UNESCAPED_UNICODE|JSON_THROW_ON_ERROR);
 $db->prepare('INSERT INTO vc_consultation_versions(consultation_id,version,actor_id,snapshot,created_at) VALUES(?,?,?,?,?)')->execute([$id,$version,$actor['id'],$json,$now]);
 if($conflict)$result['conflict']=recordSyncConflict($db,'consultation',$id,$operation,$actor,$conflict['base'],$conflict['displaced'],$version,$displaced,$result);
 $response=['saved'=>true,'consultation'=>$result];
 $db->prepare('INSERT INTO vc_consultation_operations(operation_id,actor_id,payload_hash,result,created_at) VALUES(?,?,?,?,?)')->execute([$operation,$actor['id'],$hash,json_encode($response,JSON_THROW_ON_ERROR),$now]);
 audit($db,$actor['id'],$create?'consultation_created':'consultation_corrected');return $response;
}
