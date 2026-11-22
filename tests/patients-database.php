<?php
declare(strict_types=1);
if(PHP_SAPI!=='cli')exit(1);
require __DIR__.'/../server/database.php';require __DIR__.'/../server/auth.php';require __DIR__.'/../server/owners.php';require __DIR__.'/../server/patients.php';
function verifyPatient(bool $value):void{if(!$value)throw new RuntimeException('ASSERTION_FAILED');}
function rejectPatient(callable $action,string $reason):void{try{$action();}catch(\VetCare\AccessError $error){verifyPatient($error->reason===$reason);return;}throw new RuntimeException('EXPECTED_REJECTION');}
try{
 $db=\VetCare\centralDatabase();
 foreach(['001_auth','002_owners','003_patients','007_owner_accounts'] as $migration){
  $sql=file_get_contents(__DIR__.'/../database/mariadb/'.$migration.'.sql');$sql=str_replace('CREATE TABLE IF NOT EXISTS','CREATE TEMPORARY TABLE',$sql);$sql=preg_replace('/^\s*FOREIGN KEY[^\r\n]*\r?\n/m','',$sql);$sql=preg_replace('/,\s*\)/',"\n)",$sql);
  foreach(explode(';',$sql) as $statement)if(trim($statement)!=='')$db->exec($statement);
 }
 $actor=\VetCare\createUser($db,['username'=>'test-vet','name'=>'Prueba temporal','role'=>'veterinario','password'=>'clave-temporal-de-prueba']);
 $save=function(string $type,array $data,bool $create)use($db,$actor):array{$db->beginTransaction();try{$r=$type==='owner'?\VetCare\saveOwner($db,$actor,$data,$create):\VetCare\savePatient($db,$actor,$data,$create);$db->commit();return $r;}catch(Throwable $error){$db->rollBack();throw $error;}};
 $owner=$save('owner',['operationId'=>\VetCare\uuid(),'name'=>'Dueño temporal','portalUsername'=>'dueno-temporal','portalPassword'=>'clave-segura-de-prueba'],true);
 $create=['operationId'=>\VetCare\uuid(),'ownerId'=>$owner['id'],'name'=>'Luna','species'=>'Cabra','ageValue'=>3,'ageUnit'=>'meses','ageReference'=>'2026-01-01'];
 $patient=$save('patient',$create,true);verifyPatient($patient['version']===1&&$patient['ownerId']===$owner['id']);
 verifyPatient($save('patient',$create,true)===$patient);verifyPatient((int)$db->query('SELECT COUNT(*) FROM vc_patients')->fetchColumn()===1);
 rejectPatient(fn()=>$save('patient',[...$create,'species'=>'Perro'],true),'OPERATION_REUSED');
 $duplicate=$save('patient',[...$create,'operationId'=>\VetCare\uuid()],true);verifyPatient($duplicate['id']!==$patient['id']);
 $updated=$save('patient',[...$patient,'operationId'=>\VetCare\uuid(),'birthDate'=>'2025-01-01','ageValue'=>null,'ageUnit'=>null,'ageReference'=>null],false);
 verifyPatient($updated['version']===2&&$updated['birthDate']==='2025-01-01');
 $snapshot=$db->query('SELECT snapshot FROM vc_patient_versions WHERE version=1 ORDER BY patient_id LIMIT 1')->fetchColumn();verifyPatient(json_decode($snapshot,true)['ageValue']===3);
 rejectPatient(fn()=>$save('patient',[...$patient,'operationId'=>\VetCare\uuid()],false),'PATIENT_CONFLICT');
 rejectPatient(fn()=>$save('patient',[...$create,'operationId'=>\VetCare\uuid(),'ownerId'=>\VetCare\uuid()],true),'PATIENT_OWNER_REQUIRED');
 rejectPatient(fn()=>$save('owner',[...$owner,'operationId'=>\VetCare\uuid(),'active'=>false],false),'OWNER_HAS_ACTIVE_PATIENTS');
 $inactive=$save('patient',[...$updated,'operationId'=>\VetCare\uuid(),'active'=>false],false);
 $save('patient',[...$duplicate,'operationId'=>\VetCare\uuid(),'active'=>false],false);
 $inactiveOwner=$save('owner',[...$owner,'operationId'=>\VetCare\uuid(),'active'=>false],false);
 rejectPatient(fn()=>$save('patient',[...$inactive,'operationId'=>\VetCare\uuid(),'active'=>true],false),'PATIENT_OWNER_INACTIVE');
 $save('owner',[...$inactiveOwner,'operationId'=>\VetCare\uuid(),'active'=>true],false);
 $active=$save('patient',[...$inactive,'operationId'=>\VetCare\uuid(),'active'=>true],false);verifyPatient($active['active']);
 verifyPatient(count(\VetCare\listPatients($db,$actor,['q'=>'Dueño temporal','species'=>'Cabra'])['patients'])===1);
 rejectPatient(fn()=>\VetCare\listPatients($db,['role'=>'otro'],[]),'FORBIDDEN');
 echo "MariaDB: pacientes, vínculo, homónimos, versiones, reintentos, conflictos y bajas coordinadas comprobados en tablas temporales.\n";
}catch(Throwable){fwrite(STDERR,"No se completó la prueba real de pacientes. Revisa db:check y permisos de tablas temporales.\n");exit(1);}
