<?php
declare(strict_types=1);
namespace VetCare;
use PDO;
function issueOfflineLease(array $actor,string $device):array{
 requirePermission($actor,'clinical.write');recentAuthentication($actor);requireUuid($device);
 $path=getenv('OFFLINE_PRIVATE_KEY')?:'';$pem=$path!==''?@file_get_contents($path):false;
 if($pem===false)failAccess(503,'OFFLINE_KEY_REQUIRED');$key=openssl_pkey_get_private($pem);if($key===false)failAccess(503,'OFFLINE_KEY_REQUIRED');
 $details=openssl_pkey_get_details($key);if(!$details||$details['type']!==OPENSSL_KEYTYPE_RSA||$details['bits']<2048)failAccess(503,'OFFLINE_KEY_REQUIRED');
 $now=time();$payload=['schema'=>1,'issuer'=>allowedOrigin(),'deviceId'=>$device,'user'=>publicUser($actor),'permissions'=>['clinical.read','clinical.write'],'issuedAt'=>$now,'expiresAt'=>$now+72*3600];
 $encoded=rtrim(strtr(base64_encode(json_encode($payload,JSON_UNESCAPED_UNICODE|JSON_THROW_ON_ERROR)),'+/','-_'),'=');
 if(!openssl_sign($encoded,$signature,$key,OPENSSL_ALGO_SHA256))failAccess(503,'OFFLINE_KEY_REQUIRED');
 return ['payload'=>$encoded,'signature'=>rtrim(strtr(base64_encode($signature),'+/','-_'),'=')];
}
function offlineBootstrap(PDO $db,array $actor,array $input):array{
 $device=requireUuid($input['deviceId']??null);$lease=issueOfflineLease($actor,$device);
 $db->beginTransaction();try{
  $size=(int)$db->query("SELECT COALESCE(SUM(OCTET_LENGTH(reason)+OCTET_LENGTH(COALESCE(treatment,''))+OCTET_LENGTH(COALESCE(notes,''))),0) FROM vc_consultations")->fetchColumn();if($size>8*1024*1024)failAccess(409,'OFFLINE_EXPORT_TOO_LARGE');
  $owners=$db->query('SELECT * FROM vc_owners ORDER BY id LIMIT 2001')->fetchAll();
  $patients=$db->query('SELECT p.*,o.name AS owner_name FROM vc_patients p JOIN vc_owners o ON o.id=p.owner_id ORDER BY p.id LIMIT 2001')->fetchAll();
  $consultations=$db->query('SELECT * FROM vc_consultations ORDER BY id LIMIT 2001')->fetchAll();
  if(count($owners)>2000||count($patients)>2000||count($consultations)>2000)failAccess(409,'OFFLINE_EXPORT_TOO_LARGE');
  $authors=$db->query('SELECT id,name FROM vc_auth_users')->fetchAll();
  audit($db,$actor['id'],'offline_authorized');$db->commit();
 }catch(\Throwable$error){if($db->inTransaction())$db->rollBack();throw$error;}
 return ['lease'=>$lease,'owners'=>array_map('VetCare\\publicOwner',$owners),'patients'=>array_map('VetCare\\publicPatient',$patients),'consultations'=>array_map('VetCare\\publicConsultation',$consultations),'authors'=>$authors];
}
