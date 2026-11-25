<?php
declare(strict_types=1);
if(PHP_SAPI!=='cli')exit(1);
foreach(['database','auth','owners','patients','attention','consultations','sanitary-events','portal']as$file)require __DIR__.'/../server/'.$file.'.php';
function portalAssert(bool $value,string $message='ASSERTION_FAILED'):void{if(!$value)throw new RuntimeException($message);}
function portalReject(callable $action,string $reason):void{try{$action();}catch(\VetCare\AccessError$error){portalAssert($error->reason===$reason,$error->reason);return;}throw new RuntimeException('EXPECTED_REJECTION');}
try{
 $db=\VetCare\centralDatabase();foreach(['001_auth','002_owners','003_patients','004_consultations','005_sanitary_events','007_owner_accounts','008_consultation_blood_pressure','010_owner_portal_sessions']as$migration){$sql=file_get_contents(__DIR__.'/../database/mariadb/'.$migration.'.sql');$sql=str_replace('CREATE TABLE IF NOT EXISTS','CREATE TEMPORARY TABLE',$sql);$sql=preg_replace('/^\s*FOREIGN KEY[^\r\n]*\r?\n/m','',$sql);$sql=preg_replace('/,\s*\)/',"\n)",$sql);foreach(explode(';',$sql)as$statement)if(trim($statement)!=='')$db->exec($statement);}
 $vet=\VetCare\createUser($db,['username'=>'portal-vet','name'=>'Veterinario temporal','role'=>'veterinario','password'=>'clave-temporal-de-prueba']);
 $db->beginTransaction();
 $ownerA=\VetCare\saveOwner($db,$vet,['operationId'=>\VetCare\uuid(),'name'=>'Dueña A','portalUsername'=>'duena-a','portalPassword'=>'clave-segura-de-prueba'],true);
 $ownerB=\VetCare\saveOwner($db,$vet,['operationId'=>\VetCare\uuid(),'name'=>'Dueña B','portalUsername'=>'duena-b','portalPassword'=>'clave-segura-de-prueba'],true);
 $patientA=\VetCare\savePatient($db,$vet,['operationId'=>\VetCare\uuid(),'ownerId'=>$ownerA['id'],'name'=>'Luna','species'=>'Perro','breed'=>'Mestiza','birthDate'=>'2021-02-03'],true);
 $patientB=\VetCare\savePatient($db,$vet,['operationId'=>\VetCare\uuid(),'ownerId'=>$ownerB['id'],'name'=>'Nube','species'=>'Gato'],true);
 $db->commit();
 $saveConsultation=function(array$data)use($db,$vet):array{$db->beginTransaction();try{$result=\VetCare\saveConsultation($db,$vet,$data,true);$db->commit();return$result['consultation'];}catch(Throwable$error){$db->rollBack();throw$error;}};
 $consultation=$saveConsultation(['kind'=>'consulta','operationId'=>\VetCare\uuid(),'patientId'=>$patientA['id'],'patientVersion'=>1,'date'=>'2026-01-01','reason'=>'Revisión','treatment'=>'Tratamiento indicado','notes'=>'Seguimiento clínico','weight'=>'2.500','temperature'=>'38.5','heartRate'=>'100','respiratoryRate'=>'24','bloodPressure'=>'120/80']);
 $saveEvent=function(array$data)use($db,$vet):array{$db->beginTransaction();try{$result=\VetCare\saveSanitaryEvent($db,$vet,$data,true);$db->commit();return$result['event'];}catch(Throwable$error){$db->rollBack();throw$error;}};
 $saveEvent(['kind'=>'vacuna','operationId'=>\VetCare\uuid(),'patientId'=>$patientA['id'],'patientVersion'=>1,'date'=>'2026-01-01','product'=>'Vacuna temporal','application'=>'Refuerzo','nextDate'=>'2026-06-01']);
 $login=\VetCare\portalLogin($db,['username'=>'duena-a','password'=>'clave-segura-de-prueba'],'127.0.0.1');portalAssert(!array_key_exists('password',$login)&&isset($login['token'],$login['csrf'])&&$login['owner']['id']===$ownerA['id']);
 $session=\VetCare\portalAuthenticated($db,$login['token']);portalAssert($session['id']===$ownerA['id']);
 $patients=\VetCare\portalPatients($db,$session,['page'=>'1']);portalAssert(count($patients['patients'])===1&&$patients['patients'][0]['id']===$patientA['id']&&!array_key_exists('ownerId',$patients['patients'][0]));
 portalReject(fn()=>\VetCare\portalHistory($db,$session,['patientId'=>$patientB['id']]),'PORTAL_PATIENT_NOT_FOUND');
 $history=\VetCare\portalHistory($db,$session,['patientId'=>$patientA['id']]);portalAssert(count($history['consultations'])===1&&$history['consultations'][0]['reason']==='Revisión'&&$history['consultations'][0]['bloodPressure']==='120/80'&&!array_key_exists('createdBy',$history['consultations'][0]));
 $events=\VetCare\portalSanitaryEvents($db,$session,['patientId'=>$patientA['id'],'kind'=>'vacuna','page'=>'1']);portalAssert(count($events['events'])===1&&$events['events'][0]['product']==='Vacuna temporal');
 $db->exec("UPDATE vc_owner_accounts SET active=0 WHERE owner_id='".$ownerA['id']."'");portalReject(fn()=>\VetCare\portalAuthenticated($db,$login['token']),'PORTAL_UNAUTHENTICATED');
 echo "MariaDB: portal de propietarios, sesiones separadas, aislamiento entre propietarios y lectura clínica comprobados en tablas temporales.\n";
}catch(Throwable$error){fwrite(STDERR,'No se completó la prueba real del portal ('.preg_replace('/[^A-Z0-9_:-]/','',strtoupper($error->getMessage())).").\n");exit(1);}
