<?php
declare(strict_types=1);
if(PHP_SAPI!=='cli')exit(1);
require __DIR__.'/../server/database.php';require __DIR__.'/../server/auth.php';require __DIR__.'/../server/owners.php';require __DIR__.'/../server/patients.php';require __DIR__.'/../server/attention.php';
function assertAttention(bool $value):void{if(!$value)throw new RuntimeException('ASSERTION_FAILED');}
function rejectAttention(callable $action,string $reason):void{try{$action();}catch(\VetCare\AccessError $e){assertAttention($e->reason===$reason);return;}throw new RuntimeException('EXPECTED_REJECTION');}
try{
 $db=\VetCare\centralDatabase();foreach(['001_auth','002_owners','003_patients']as$migration){$sql=file_get_contents(__DIR__.'/../database/mariadb/'.$migration.'.sql');$sql=str_replace('CREATE TABLE IF NOT EXISTS','CREATE TEMPORARY TABLE',$sql);$sql=preg_replace('/^\s*FOREIGN KEY[^\r\n]*\r?\n/m','',$sql);$sql=preg_replace('/,\s*\)/',"\n)",$sql);foreach(explode(';',$sql)as$statement)if(trim($statement)!=='')$db->exec($statement);}
 $actor=\VetCare\createUser($db,['username'=>'test-vet','name'=>'Prueba','role'=>'veterinario','password'=>'clave-temporal-de-prueba']);
 $db->beginTransaction();$owner=\VetCare\saveOwner($db,$actor,['operationId'=>\VetCare\uuid(),'name'=>'Temporal'],true);$patient=\VetCare\savePatient($db,$actor,['operationId'=>\VetCare\uuid(),'ownerId'=>$owner['id'],'name'=>'Temporal','species'=>'Perro','birthDate'=>'2020-01-01'],true);$db->commit();
 $input=['kind'=>'consulta','patientId'=>$patient['id'],'patientVersion'=>$patient['version'],'date'=>'2026-01-01','reason'=>'Revisión','weight'=>'0.001'];
 $before=(int)$db->query('SELECT COUNT(*) FROM vc_auth_audit')->fetchColumn();$result=\VetCare\validatePatientAttention($db,$actor,$input);assertAttention($result['valid']&&$result['data']['weight']===1);assertAttention((int)$db->query('SELECT COUNT(*) FROM vc_auth_audit')->fetchColumn()===$before);
 rejectAttention(fn()=>\VetCare\validatePatientAttention($db,$actor,[...$input,'patientVersion'=>100]),'PATIENT_CONTEXT_CHANGED');
 rejectAttention(fn()=>\VetCare\validatePatientAttention($db,$actor,[...$input,'patientId'=>\VetCare\uuid()]),'PATIENT_NOT_FOUND');
 rejectAttention(fn()=>\VetCare\validatePatientAttention($db,['role'=>'otro'],$input),'FORBIDDEN');
 $invalid=\VetCare\validatePatientAttention($db,$actor,[...$input,'date'=>'2019-01-01']);assertAttention(!$invalid['valid']&&isset($invalid['errors']['date']));
 $db->beginTransaction();\VetCare\savePatient($db,$actor,[...$patient,'operationId'=>\VetCare\uuid(),'active'=>false],false);$db->commit();
 rejectAttention(fn()=>\VetCare\validatePatientAttention($db,$actor,[...$input,'patientVersion'=>2]),'PATIENT_INACTIVE');
 echo "MariaDB: validación de atención, contexto, paciente inactivo y ausencia de guardado comprobados en tablas temporales.\n";
}catch(Throwable){fwrite(STDERR,"No se completó la prueba real de formularios. Revisa db:check y los permisos de tablas temporales.\n");exit(1);}
