<?php
declare(strict_types=1);
namespace VetCare;
use PDO;

function syncOperation(PDO $db,array $actor,array $operation):array{
 $action=$operation['action']??null;$input=$operation['input']??null;$entityId=$operation['entityId']??null;
 if(!is_string($action)||!is_array($input)||array_is_list($input)||!is_string($entityId))failAccess(422,'INVALID_SYNC_OPERATION');
 requireUuid($entityId);$create=str_starts_with($action,'create');$update=str_starts_with($action,'update');$restore=$action==='restoreConsultation';
 $map=['createOwner'=>['owner',true],'updateOwner'=>['owner',false],'createPatient'=>['patient',true],'updatePatient'=>['patient',false],'createConsultation'=>['consultation',true],'updateConsultation'=>['consultation',false],'restoreConsultation'=>['consultation',false]];
 if(!isset($map[$action])||(!$create&&!$update&&!$restore))failAccess(422,'INVALID_SYNC_OPERATION');[$type,$create]=$map[$action];
 if(!$create&&($input['id']??null)!==$entityId)failAccess(422,'INVALID_SYNC_OPERATION');
 $result=match($type){
  'owner'=>saveOwner($db,$actor,$input,$create,$create?$entityId:null,!$create),
  'patient'=>savePatient($db,$actor,$input,$create,$create?$entityId:null,!$create),
  'consultation'=>saveConsultation($db,$actor,$input,$create,$create?$entityId:null,!$create),
 };
 if($type==='consultation'){
  if($result['saved']!==true)failAccess(422,'INVALID_ATTENTION');$entity=$result['consultation'];
 }else $entity=$result;
 return ['operationId'=>$input['operationId'],'status'=>'applied','entityType'=>$type,'entity'=>$entity];
}
function syncPush(PDO $db,array $actor,array $body):array{
 requirePermission($actor,'clinical.write');$operations=$body['operations']??null;
 if(!is_array($operations)||!array_is_list($operations)||count($operations)<1||count($operations)>25)failAccess(422,'INVALID_SYNC_BATCH');
 $results=[];
 foreach($operations as $operation){
  if(!is_array($operation)||array_is_list($operation))failAccess(422,'INVALID_SYNC_OPERATION');$operationId=$operation['input']['operationId']??null;if(!is_string($operationId))failAccess(422,'INVALID_SYNC_OPERATION');requireUuid($operationId);
  $lockName='vc_sync_'.$operationId;$q=$db->prepare('SELECT GET_LOCK(?,5)');$q->execute([$lockName]);if((int)$q->fetchColumn()!==1){$results[]=['operationId'=>$operationId,'status'=>'retry','code'=>'TRY_AGAIN','message'=>'El servidor está ocupado; se reintentará.'];continue;}
  try{$db->beginTransaction();$result=syncOperation($db,$actor,$operation);$db->commit();$results[]=$result;}
  catch(AccessError $error){if($db->inTransaction())$db->rollBack();$results[]=['operationId'=>$operationId,'status'=>'blocked','code'=>$error->reason,'message'=>'La operación requiere revisión antes de reenviarse.'];}
  catch(\Throwable $error){if($db->inTransaction())$db->rollBack();throw $error;}
  finally{$q=$db->prepare('SELECT RELEASE_LOCK(?)');$q->execute([$lockName]);}
 }
 return ['results'=>$results];
}
