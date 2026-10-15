<?php
declare(strict_types=1);
namespace VetCare;
use PDO;

function historyDate(mixed $value):?string{
 if($value===null||$value==='')return null;
 if(!is_string($value)||!preg_match('/\A\d{4}-\d{2}-\d{2}\z/D',$value)||$value<'1000-01-01')failAccess(422,'INVALID_FILTER');
 $date=\DateTimeImmutable::createFromFormat('!Y-m-d',$value);if(!$date||$date->format('Y-m-d')!==$value)failAccess(422,'INVALID_FILTER');return$value;
}
function historyFilters(array $query):array{
 $search=$query['q']??'';if(!is_string($search)||!mb_check_encoding($search,'UTF-8')||mb_strlen($search)>200)failAccess(422,'INVALID_FILTER');
 $from=historyDate($query['from']??null);$to=historyDate($query['to']??null);if($from&&$to&&$from>$to)failAccess(422,'INVALID_FILTER');
 $cursor=$query['cursor']??'';$before=null;
 if(!is_string($cursor)||strlen($cursor)>256)failAccess(422,'INVALID_FILTER');
 if($cursor!==''){
  $raw=base64_decode(strtr($cursor,'-_','+/'),true);if($raw===false)failAccess(422,'INVALID_FILTER');
  try{$before=json_decode($raw,true,4,JSON_THROW_ON_ERROR);}catch(\JsonException){failAccess(422,'INVALID_FILTER');}
  if(!is_array($before)||count($before)!==2||!isset($before['date'],$before['id'])||!historyDate($before['date']))failAccess(422,'INVALID_FILTER');requireUuid($before['id']);
 }
 return ['q'=>trim($search),'from'=>$from,'to'=>$to,'before'=>$before];
}
function patientHistory(PDO $db,array $actor,array $query):array{
 requirePermission($actor,'clinical.read');$id=requireUuid($query['patientId']??null);$filter=historyFilters($query);
 $q=$db->prepare('SELECT p.*,o.name AS owner_name FROM vc_patients p JOIN vc_owners o ON o.id=p.owner_id WHERE p.id=?');$q->execute([$id]);$patient=$q->fetch();if(!$patient)failAccess(404,'PATIENT_NOT_FOUND');
 $where=['c.patient_id=?'];$args=[$id];
 if($filter['from']){$where[]='c.date>=?';$args[]=$filter['from'];}if($filter['to']){$where[]='c.date<=?';$args[]=$filter['to'];}
 if($filter['q']!==''){$where[]="(c.reason LIKE ? ESCAPE '!' OR c.treatment LIKE ? ESCAPE '!' OR c.notes LIKE ? ESCAPE '!')";$term='%'.str_replace(['!','%','_'],['!!','!%','!_'],$filter['q']).'%';array_push($args,$term,$term,$term);}
 if($filter['before']){$where[]='(c.date<? OR (c.date=? AND c.id<?))';array_push($args,$filter['before']['date'],$filter['before']['date'],$filter['before']['id']);}
 $q=$db->prepare('SELECT c.*,a.name AS created_name,u.name AS updated_name FROM vc_consultations c JOIN vc_auth_users a ON a.id=c.created_by JOIN vc_auth_users u ON u.id=c.updated_by WHERE '.implode(' AND ',$where).' ORDER BY c.date DESC,c.id DESC LIMIT 21');$q->execute($args);$rows=$q->fetchAll();$more=count($rows)>20;$rows=array_slice($rows,0,20);$last=$rows?end($rows):null;
 $cursor=$more&&$last?rtrim(strtr(base64_encode(json_encode(['date'=>$last['date'],'id'=>$last['id']],JSON_THROW_ON_ERROR)),'+/','-_'),'='):null;
 $q=$db->prepare('SELECT COUNT(*) FROM vc_consultations WHERE patient_id=?');$q->execute([$id]);$total=(int)$q->fetchColumn();
 $q=$db->prepare('SELECT id,date,weight_g FROM vc_consultations WHERE patient_id=? AND weight_g IS NOT NULL ORDER BY date DESC,id DESC LIMIT 1');$q->execute([$id]);$weight=$q->fetch();
 return ['patient'=>publicPatient($patient),'consultations'=>array_map(static fn($row)=>[...publicConsultation($row),'createdByName'=>$row['created_name'],'updatedByName'=>$row['updated_name']],$rows),'nextCursor'=>$cursor,'totalConsultations'=>$total,'latestConsultationWeight'=>$weight?['consultationId'=>$weight['id'],'date'=>$weight['date'],'grams'=>(int)$weight['weight_g']]:null];
}
function consultationVersions(PDO $db,array $actor,array $query):array{
 requirePermission($actor,'clinical.read');$patient=requireUuid($query['patientId']??null);$id=requireUuid($query['consultationId']??null);$before=$query['before']??'';
 if(!is_string($before)||($before!==''&&(!ctype_digit($before)||(int)$before<1||(int)$before>2147483647)))failAccess(422,'INVALID_FILTER');
 $q=$db->prepare('SELECT version FROM vc_consultations WHERE id=? AND patient_id=?');$q->execute([$id,$patient]);$current=$q->fetchColumn();if($current===false)failAccess(404,'CONSULTATION_NOT_FOUND');
 $args=[$id,(int)$current];$where='v.consultation_id=? AND v.version<=?';if($before!==''){$where.=' AND v.version<?';$args[]=(int)$before;}
 $q=$db->prepare('SELECT v.*,a.name AS actor_name FROM vc_consultation_versions v JOIN vc_auth_users a ON a.id=v.actor_id WHERE '.$where.' ORDER BY v.version DESC LIMIT 21');$q->execute($args);$rows=$q->fetchAll();$more=count($rows)>20;$rows=array_slice($rows,0,20);$last=$rows?end($rows):null;
 return ['patientId'=>$patient,'consultationId'=>$id,'currentVersion'=>(int)$current,'versions'=>array_map(static fn($row)=>['version'=>(int)$row['version'],'actorName'=>$row['actor_name'],'createdAt'=>(int)$row['created_at'],'snapshot'=>json_decode($row['snapshot'],true,16,JSON_THROW_ON_ERROR)],$rows),'nextBefore'=>$more?(string)$last['version']:null];
}
