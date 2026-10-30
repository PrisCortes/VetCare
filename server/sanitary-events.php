<?php
declare(strict_types=1);
namespace VetCare;
use PDO;

function sanitaryIdentity(array $input,bool $create):array{
 $kind=$input['kind']??null;if(!in_array($kind,['vacuna','desparasitacion'],true))failAccess(422,'SANITARY_EVENT_ONLY');
 $identity=['kind'=>$kind,'patientId'=>requireUuid($input['patientId']??null),'operationId'=>requireUuid($input['operationId']??null)];
 if(!is_int($input['patientVersion']??null)||$input['patientVersion']<1)failAccess(422,'INVALID_PATIENT');
 if(!$create){$identity['id']=requireUuid($input['id']??null);if(!is_int($input['version']??null)||$input['version']<1)failAccess(422,'INVALID_SANITARY_EVENT_VERSION');}
 return $identity;
}
function sanitaryTables(string $kind):array{return $kind==='vacuna'?['vc_vaccinations','vc_vaccination_versions','vaccination_id']:['vc_dewormings','vc_deworming_versions','deworming_id'];}
function publicSanitaryEvent(array $row,string $kind):array{
 $result=['id'=>$row['id'],'kind'=>$kind,'patientId'=>$row['patient_id'],'date'=>$row['date'],'product'=>$row['product'],'nextDate'=>$row['next_date'],'version'=>(int)$row['version'],'createdBy'=>$row['created_by'],'updatedBy'=>$row['updated_by'],'createdAt'=>(int)$row['created_at'],'updatedAt'=>(int)$row['updated_at']];
 if($kind==='vacuna')$result['application']=$row['application'];else $result['weight']=$row['weight_g']===null?null:(int)$row['weight_g'];return $result;
}
function listSanitaryEvents(PDO $db,array $actor,array $query):array{
 requirePermission($actor,'clinical.read');$patient=requireUuid($query['patientId']??null);$kind=$query['kind']??null;if(!in_array($kind,['vacuna','desparasitacion'],true))failAccess(422,'INVALID_FILTER');$page=$query['page']??'1';
 if(!is_string($page)||!ctype_digit($page)||(int)$page<1||(int)$page>10000)failAccess(422,'INVALID_FILTER');[$table]=$tables=sanitaryTables($kind);$q=$db->prepare('SELECT * FROM '.$table.' WHERE patient_id=? ORDER BY date DESC,id DESC LIMIT 21 OFFSET '.(((int)$page-1)*20));$q->execute([$patient]);$rows=$q->fetchAll();return ['events'=>array_map(fn($row)=>publicSanitaryEvent($row,$kind),array_slice($rows,0,20)),'page'=>(int)$page,'hasMore'=>count($rows)>20];
}
/** Transacción y bloqueo de operationId pertenecen al llamador. */
function saveSanitaryEvent(PDO $db,array $actor,array $input,bool $create,?string $offlineId=null):array{
 requirePermission($actor,'clinical.write');$identity=sanitaryIdentity($input,$create);$kind=$identity['kind'];[$table,$versions,$versionKey]=sanitaryTables($kind);$payload=['offlineId'=>$offlineId];foreach(['kind','patientId','patientVersion','id','version','date','product','application','weight','nextDate']as$key)$payload[$key]=$input[$key]??null;$hash=hash('sha256',json_encode([$create,$payload],JSON_THROW_ON_ERROR));
 $q=$db->prepare('SELECT * FROM vc_sanitary_operations WHERE operation_id=?');$q->execute([$identity['operationId']]);$previous=$q->fetch();if($previous){if($previous['actor_id']!==$actor['id']||!hash_equals($previous['payload_hash'],$hash))failAccess(409,'OPERATION_REUSED');return json_decode($previous['result'],true,16,JSON_THROW_ON_ERROR);}
 $q=$db->prepare('SELECT * FROM vc_patients WHERE id=? FOR UPDATE');$q->execute([$identity['patientId']]);$patient=$q->fetch();if(!$patient)failAccess(404,'PATIENT_NOT_FOUND');if((int)$patient['version']!==$input['patientVersion'])failAccess(409,'PATIENT_CONTEXT_CHANGED');if($create&&!(bool)$patient['active'])failAccess(409,'PATIENT_INACTIVE');
 $old=null;if(!$create){$q=$db->prepare('SELECT * FROM '.$table.' WHERE id=? FOR UPDATE');$q->execute([$identity['id']]);$old=$q->fetch();if(!$old)failAccess(404,'SANITARY_EVENT_NOT_FOUND');if($old['patient_id']!==$identity['patientId'])failAccess(409,'SANITARY_EVENT_PATIENT_IMMUTABLE');if((int)$old['version']!==$input['version'])failAccess(409,'SANITARY_EVENT_CONFLICT');}
 $validation=attentionFields($input,$patient['birth_date']);if(!$validation['valid'])return ['saved'=>false,'fields'=>$validation['errors']];$data=$validation['data'];$now=time();$id=$create?($offlineId===null?uuid():requireUuid($offlineId)):$identity['id'];$version=$create?1:(int)$old['version']+1;
 if($kind==='vacuna'){$values=[$data['date'],$data['product'],$data['application'],$data['nextDate']];if($create)$db->prepare('INSERT INTO '.$table.'(id,patient_id,date,product,application,next_date,version,created_by,updated_by,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?,?,?,?)')->execute([$id,$identity['patientId'],...$values,$version,$actor['id'],$actor['id'],$now,$now]);else $db->prepare('UPDATE '.$table.' SET date=?,product=?,application=?,next_date=?,version=?,updated_by=?,updated_at=? WHERE id=?')->execute([...$values,$version,$actor['id'],$now,$id]);}
 else{$values=[$data['date'],$data['product'],$data['weight'],$data['nextDate']];if($create)$db->prepare('INSERT INTO '.$table.'(id,patient_id,date,product,weight_g,next_date,version,created_by,updated_by,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?,?,?,?)')->execute([$id,$identity['patientId'],...$values,$version,$actor['id'],$actor['id'],$now,$now]);else $db->prepare('UPDATE '.$table.' SET date=?,product=?,weight_g=?,next_date=?,version=?,updated_by=?,updated_at=? WHERE id=?')->execute([...$values,$version,$actor['id'],$now,$id]);}
 $result=['id'=>$id,'kind'=>$kind,'patientId'=>$identity['patientId'],...$data,'version'=>$version,'createdBy'=>$old['created_by']??$actor['id'],'updatedBy'=>$actor['id'],'createdAt'=>$old?(int)$old['created_at']:$now,'updatedAt'=>$now];$json=json_encode($result,JSON_UNESCAPED_UNICODE|JSON_THROW_ON_ERROR);
 $db->prepare('INSERT INTO '.$versions.'('.$versionKey.',version,actor_id,snapshot,created_at) VALUES(?,?,?,?,?)')->execute([$id,$version,$actor['id'],$json,$now]);$response=['saved'=>true,'event'=>$result];$db->prepare('INSERT INTO vc_sanitary_operations(operation_id,actor_id,payload_hash,result,created_at) VALUES(?,?,?,?,?)')->execute([$identity['operationId'],$actor['id'],$hash,json_encode($response,JSON_THROW_ON_ERROR),$now]);audit($db,$actor['id'],$create?'sanitary_event_created':'sanitary_event_corrected');return $response;
}
