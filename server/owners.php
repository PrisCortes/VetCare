<?php
declare(strict_types=1);
namespace VetCare;
use PDO;

function uuid(): string {
    $bytes=random_bytes(16);$bytes[6]=chr((ord($bytes[6])&15)|64);$bytes[8]=chr((ord($bytes[8])&63)|128);$hex=bin2hex($bytes);
    return substr($hex,0,8).'-'.substr($hex,8,4).'-'.substr($hex,12,4).'-'.substr($hex,16,4).'-'.substr($hex,20);
}
function requireUuid(mixed $value): string {
    if(!is_string($value)||!preg_match('/\A[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\z/D',$value)) failAccess(422,'INVALID_IDENTIFIER');
    return $value;
}
function ownerFields(array $data): array {
    $result=[];
    foreach(['name'=>200,'phone'=>50,'address'=>500,'locality'=>200] as $key=>$limit) {
        $value=$data[$key]??'';
        if(!is_string($value)||!mb_check_encoding($value,'UTF-8')||mb_strlen($value)>$limit||preg_match('/[\x00-\x08\x0B\x0C\x0E-\x1F]/',$value)) failAccess(422,'INVALID_OWNER');
        $result[$key]=trim($value);
    }
    if($result['name']==='')failAccess(422,'INVALID_OWNER');
    return $result;
}
function publicOwner(array $row): array {
    return ['id'=>$row['id'],'name'=>$row['name'],'phone'=>$row['phone'],'address'=>$row['address'],'locality'=>$row['locality'],'active'=>(bool)$row['active'],'version'=>(int)$row['version'],'updatedAt'=>(int)$row['updated_at']];
}
function listOwners(PDO $db,array $actor,array $query): array {
    requirePermission($actor,'clinical.read');
    $search=$query['q']??'';$status=$query['status']??'active';$page=$query['page']??'1';
    if(!is_string($search)||mb_strlen($search)>200||!is_string($status)||!in_array($status,['active','inactive','all'],true)||!is_string($page)||!ctype_digit($page)||(int)$page<1||(int)$page>10000)failAccess(422,'INVALID_FILTER');
    $where=[];$args=[];
    if($status!=='all'){$where[]='active=?';$args[]=$status==='active'?1:0;}
    if(trim($search)!==''){
        $where[]="(name LIKE ? ESCAPE '!' OR phone LIKE ? ESCAPE '!' OR locality LIKE ? ESCAPE '!')";
        $pattern='%'.str_replace(['!','%','_'],['!!','!%','!_'],trim($search)).'%';array_push($args,$pattern,$pattern,$pattern);
    }
    $filter=$where?' WHERE '.implode(' AND ',$where):'';$offset=((int)$page-1)*50;
    $q=$db->prepare('SELECT * FROM vc_owners'.$filter.' ORDER BY name,id LIMIT 51 OFFSET '.$offset);$q->execute($args);$rows=$q->fetchAll();
    $more=count($rows)>50;
    return ['owners'=>array_map('VetCare\\publicOwner',array_slice($rows,0,50)),'page'=>(int)$page,'hasMore'=>$more];
}
/** El llamador abre transacción y revalida la sesión antes de mutar. */
function saveOwner(PDO $db,array $actor,array $data,bool $create,?string $offlineId=null): array {
    requirePermission($actor,'clinical.write');
    $operation=requireUuid($data['operationId']??null);
    $fields=ownerFields($data);
    $id=$create?($offlineId===null?null:requireUuid($offlineId)):requireUuid($data['id']??null);
    $active=$data['active']??true;$version=$data['version']??null;
    if(!is_bool($active)||(!$create&&(!is_int($version)||$version<1)))failAccess(422,'INVALID_OWNER');
    $fingerprint=hash('sha256',json_encode([$create,$id,$fields,$active,$version],JSON_THROW_ON_ERROR));
    $q=$db->prepare('SELECT actor_id,payload_hash,result FROM vc_owner_operations WHERE operation_id=?');$q->execute([$operation]);$previous=$q->fetch();
    if($previous){
        if($previous['actor_id']!==$actor['id']||!hash_equals($previous['payload_hash'],$fingerprint))failAccess(409,'OPERATION_REUSED');
        return json_decode($previous['result'],true,16,JSON_THROW_ON_ERROR);
    }
    $now=time();
    if($create){
        $id??=uuid();$version=1;$active=true;
        $db->prepare('INSERT INTO vc_owners(id,name,phone,address,locality,active,version,created_by,updated_by,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?,?,?,?)')->execute([$id,...array_values($fields),1,$version,$actor['id'],$actor['id'],$now,$now]);
    }else{
        $q=$db->prepare('SELECT * FROM vc_owners WHERE id=? FOR UPDATE');$q->execute([$id]);$previous=$q->fetch();
        if(!$previous)failAccess(404,'OWNER_NOT_FOUND');
        if((int)$previous['version']!==$version)failAccess(409,'OWNER_CONFLICT');
        if(!$active){
            $q=$db->prepare('SELECT id FROM vc_patients WHERE owner_id=? AND active=1 LIMIT 1 FOR UPDATE');$q->execute([$id]);if($q->fetch())failAccess(409,'OWNER_HAS_ACTIVE_PATIENTS');
        }
        $version++;
        $db->prepare('UPDATE vc_owners SET name=?,phone=?,address=?,locality=?,active=?,version=?,updated_by=?,updated_at=? WHERE id=?')->execute([...array_values($fields),(int)$active,$version,$actor['id'],$now,$id]);
    }
    $result=['id'=>$id,...$fields,'active'=>$active,'version'=>$version,'updatedAt'=>$now];$encoded=json_encode($result,JSON_UNESCAPED_UNICODE|JSON_THROW_ON_ERROR);
    $db->prepare('INSERT INTO vc_owner_versions(owner_id,version,actor_id,snapshot,created_at) VALUES(?,?,?,?,?)')->execute([$id,$version,$actor['id'],$encoded,$now]);
    $db->prepare('INSERT INTO vc_owner_operations(operation_id,actor_id,payload_hash,result,created_at) VALUES(?,?,?,?,?)')->execute([$operation,$actor['id'],$fingerprint,$encoded,$now]);
    audit($db,$actor['id'],$create?'owner_created':'owner_updated');
    return $result;
}
