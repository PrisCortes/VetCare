<?php
declare(strict_types=1);
if(PHP_SAPI!=='cli')exit(1);
require __DIR__.'/../server/database.php';require __DIR__.'/../server/auth.php';require __DIR__.'/../server/owners.php';
function ensure(bool $value):void{if(!$value)throw new RuntimeException('ASSERTION_FAILED');}
function rejects(callable $action,string $reason):void{try{$action();}catch(\VetCare\AccessError $error){ensure($error->reason===$reason);return;}throw new RuntimeException('EXPECTED_REJECTION');}
try{
 $db=\VetCare\centralDatabase();
 foreach(['001_auth','002_owners'] as $migration){
  $sql=file_get_contents(__DIR__.'/../database/mariadb/'.$migration.'.sql');
  $sql=str_replace('CREATE TABLE IF NOT EXISTS','CREATE TEMPORARY TABLE',$sql);
  $sql=preg_replace('/^\s*FOREIGN KEY[^\r\n]*\r?\n/m','',$sql);
  $sql=preg_replace('/,\s*\)/',"\n)",$sql);
  foreach(explode(';',$sql) as $statement)if(trim($statement)!=='')$db->exec($statement);
 }
 $actor=\VetCare\createUser($db,['username'=>'test-vet','name'=>'Prueba temporal','password'=>'clave-temporal-de-prueba','role'=>'veterinario']);
 $create=['operationId'=>\VetCare\uuid(),'name'=>"Ana '_%",'phone'=>'+52 00123','address'=>'Apan','locality'=>'Centro'];
 $save=function(array $data,bool $new)use($db,$actor):array{$db->beginTransaction();try{$result=\VetCare\saveOwner($db,$actor,$data,$new);$db->commit();return $result;}catch(Throwable $error){$db->rollBack();throw $error;}};
 $first=$save($create,true);ensure($first['version']===1);
 ensure($save($create,true)===$first);ensure((int)$db->query('SELECT COUNT(*) FROM vc_owners')->fetchColumn()===1);
 rejects(fn()=>$save([...$create,'name'=>'Otra carga'],true),'OPERATION_REUSED');
 $edit=[...$first,'operationId'=>\VetCare\uuid(),'phone'=>'555123','active'=>true];
 $updated=$save($edit,false);ensure($updated['version']===2);
 rejects(fn()=>$save([...$edit,'operationId'=>\VetCare\uuid()],false),'OWNER_CONFLICT');
 ensure((int)$db->query('SELECT COUNT(*) FROM vc_owner_versions')->fetchColumn()===2);
 $inactive=$save([...$updated,'operationId'=>\VetCare\uuid(),'active'=>false],false);ensure(!$inactive['active']);
 ensure(count(\VetCare\listOwners($db,$actor,[])['owners'])===0);
 ensure(count(\VetCare\listOwners($db,$actor,['status'=>'inactive'])['owners'])===1);
 $active=$save([...$inactive,'operationId'=>\VetCare\uuid(),'active'=>true],false);ensure($active['active']&&$active['version']===4);
 ensure(count(\VetCare\listOwners($db,$actor,['q'=>"'_%"])['owners'])===1);
 ensure(count(\VetCare\listOwners($db,$actor,['q'=>"' OR 1=1 --"])['owners'])===0);
 $save([...$create,'operationId'=>\VetCare\uuid()],true);ensure(count(\VetCare\listOwners($db,$actor,[])['owners'])===2);
 rejects(fn()=>\VetCare\listOwners($db,['role'=>'otro'],[]),'FORBIDDEN');
 echo "MariaDB: propietarios, persistencia, versiones, reintentos, conflicto, baja y reactivación comprobados en tablas temporales.\n";
}catch(Throwable){fwrite(STDERR,"No se completó la prueba de propietarios. Revisa db:check y permisos de tablas temporales.\n");exit(1);}
