<?php
declare(strict_types=1);
namespace VetCare;
use PDO;

function patientDate(mixed $value): ?string {
    if($value===null||$value==='')return null;
    if(!is_string($value)||!preg_match('/\A[0-9]{4}-[0-9]{2}-[0-9]{2}\z/D',$value))failAccess(422,'INVALID_PATIENT_DATE');
    $date=\DateTimeImmutable::createFromFormat('!Y-m-d',$value,new \DateTimeZone('America/Mexico_City'));
    if(!$date||$date->format('Y-m-d')!==$value||$value<'1000-01-01'||$value>(new \DateTimeImmutable('today',new \DateTimeZone('America/Mexico_City')))->format('Y-m-d'))failAccess(422,'INVALID_PATIENT_DATE');
    return $value;
}
function patientFields(array $data): array {
    $fields=['ownerId'=>requireUuid($data['ownerId']??null)];
    foreach(['name'=>200,'species'=>80,'breed'=>200] as $key=>$limit){
        $value=$data[$key]??'';
        if(!is_string($value)||!mb_check_encoding($value,'UTF-8')||mb_strlen($value)>$limit||preg_match('/[\x00-\x1F]/',$value))failAccess(422,'INVALID_PATIENT');
        $fields[$key]=trim($value);
    }
    if($fields['name']===''||$fields['species']==='')failAccess(422,'INVALID_PATIENT');
    $birth=patientDate($data['birthDate']??null);$age=$data['ageValue']??null;$unit=$data['ageUnit']??null;$reference=patientDate($data['ageReference']??null);
    $hasAge=$age!==null||$unit!==null||$reference!==null;
    if(($birth&&$hasAge)||($hasAge&&(!is_int($age)||$age<0||$age>2147483647||!in_array($unit,['dias','meses','anios'],true)||!$reference)))failAccess(422,'INVALID_PATIENT_AGE');
    return [...$fields,'birthDate'=>$birth,'ageValue'=>$age,'ageUnit'=>$unit,'ageReference'=>$reference];
}
function publicPatient(array $row):array {
    return ['id'=>$row['id'],'ownerId'=>$row['owner_id'],'ownerName'=>$row['owner_name']??'', 'name'=>$row['name'],'species'=>$row['species'],'breed'=>$row['breed'],'birthDate'=>$row['birth_date'],'ageValue'=>$row['age_value']===null?null:(int)$row['age_value'],'ageUnit'=>$row['age_unit'],'ageReference'=>$row['age_reference'],'active'=>(bool)$row['active'],'version'=>(int)$row['version'],'updatedAt'=>(int)$row['updated_at']];
}
function listPatients(PDO $db,array $actor,array $query):array {
    requirePermission($actor,'clinical.read');
    $search=$query['q']??'';$species=$query['species']??'';$status=$query['status']??'active';$page=$query['page']??'1';
    if(!is_string($search)||mb_strlen($search)>200||!is_string($species)||mb_strlen($species)>80||!is_string($status)||!in_array($status,['active','inactive','all'],true)||!is_string($page)||!ctype_digit($page)||(int)$page<1||(int)$page>10000)failAccess(422,'INVALID_FILTER');
    $where=[];$args=[];
    if($status!=='all'){$where[]='p.active=?';$args[]=$status==='active'?1:0;}
    if($species!==''){$where[]='p.species=?';$args[]=$species;}
    if(trim($search)!==''){
        $where[]="(p.name LIKE ? ESCAPE '!' OR p.breed LIKE ? ESCAPE '!' OR o.name LIKE ? ESCAPE '!')";
        $pattern='%'.str_replace(['!','%','_'],['!!','!%','!_'],trim($search)).'%';array_push($args,$pattern,$pattern,$pattern);
    }
    $filter=$where?' WHERE '.implode(' AND ',$where):'';$offset=((int)$page-1)*50;
    $q=$db->prepare('SELECT p.*,o.name AS owner_name FROM vc_patients p JOIN vc_owners o ON o.id=p.owner_id'.$filter.' ORDER BY p.name,p.id LIMIT 51 OFFSET '.$offset);$q->execute($args);$rows=$q->fetchAll();
    return ['patients'=>array_map('VetCare\\publicPatient',array_slice($rows,0,50)),'page'=>(int)$page,'hasMore'=>count($rows)>50];
}
function savePatient(PDO $db,array $actor,array $data,bool $create,?string $offlineId=null):array {
    requirePermission($actor,'clinical.write');$operation=requireUuid($data['operationId']??null);$fields=patientFields($data);
    $id=$create?($offlineId===null?null:requireUuid($offlineId)):requireUuid($data['id']??null);$active=$data['active']??true;$version=$data['version']??null;
    if(!is_bool($active)||(!$create&&(!is_int($version)||$version<1)))failAccess(422,'INVALID_PATIENT');
    $fingerprint=hash('sha256',json_encode([$create,$id,$fields,$active,$version],JSON_THROW_ON_ERROR));
    $q=$db->prepare('SELECT actor_id,payload_hash,result FROM vc_patient_operations WHERE operation_id=?');$q->execute([$operation]);$prior=$q->fetch();
    if($prior){if($prior['actor_id']!==$actor['id']||!hash_equals($prior['payload_hash'],$fingerprint))failAccess(409,'OPERATION_REUSED');return json_decode($prior['result'],true,16,JSON_THROW_ON_ERROR);}
    $previous=null;$owners=[$fields['ownerId']];
    if(!$create){$q=$db->prepare('SELECT * FROM vc_patients WHERE id=?');$q->execute([$id]);$previous=$q->fetch();if(!$previous)failAccess(404,'PATIENT_NOT_FOUND');$owners[]=$previous['owner_id'];}
    // Siempre bloquear propietario(s) antes del paciente; coordina la baja T20.
    $owners=array_values(array_unique($owners));sort($owners);$owner=null;
    foreach($owners as $ownerId){$q=$db->prepare('SELECT id,name,active FROM vc_owners WHERE id=? FOR UPDATE');$q->execute([$ownerId]);$row=$q->fetch();if(!$row)failAccess(422,'PATIENT_OWNER_REQUIRED');if($ownerId===$fields['ownerId'])$owner=$row;}
    if(!$create){$q=$db->prepare('SELECT * FROM vc_patients WHERE id=? FOR UPDATE');$q->execute([$id]);$current=$q->fetch();if(!$current||(int)$current['version']!==$version)failAccess(409,'PATIENT_CONFLICT');}
    if(($create||$active)&&!(bool)$owner['active'])failAccess(409,'PATIENT_OWNER_INACTIVE');
    $now=time();
    if($create){$id??=uuid();$version=1;$active=true;$db->prepare('INSERT INTO vc_patients(id,owner_id,name,species,breed,birth_date,age_value,age_unit,age_reference,active,version,created_by,updated_by,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)')->execute([$id,...array_values($fields),1,1,$actor['id'],$actor['id'],$now,$now]);}
    else{$version++;$db->prepare('UPDATE vc_patients SET owner_id=?,name=?,species=?,breed=?,birth_date=?,age_value=?,age_unit=?,age_reference=?,active=?,version=?,updated_by=?,updated_at=? WHERE id=?')->execute([...array_values($fields),(int)$active,$version,$actor['id'],$now,$id]);}
    $result=['id'=>$id,...$fields,'ownerName'=>$owner['name'],'active'=>$active,'version'=>$version,'updatedAt'=>$now];$json=json_encode($result,JSON_UNESCAPED_UNICODE|JSON_THROW_ON_ERROR);
    $db->prepare('INSERT INTO vc_patient_versions(patient_id,version,actor_id,snapshot,created_at) VALUES(?,?,?,?,?)')->execute([$id,$version,$actor['id'],$json,$now]);
    $db->prepare('INSERT INTO vc_patient_operations(operation_id,actor_id,payload_hash,result,created_at) VALUES(?,?,?,?,?)')->execute([$operation,$actor['id'],$fingerprint,$json,$now]);
    audit($db,$actor['id'],$create?'patient_created':'patient_updated');return $result;
}
