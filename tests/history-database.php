<?php
declare(strict_types=1);
if(PHP_SAPI!=='cli')exit(1);foreach(['database','auth','owners','patients','attention','consultations','history']as$file)require __DIR__.'/../server/'.$file.'.php';
function assertHistory(bool $value):void{if(!$value)throw new RuntimeException('ASSERTION_FAILED');}
function rejectHistory(callable $fn,string $reason):void{try{$fn();}catch(\VetCare\AccessError$e){assertHistory($e->reason===$reason);return;}throw new RuntimeException('EXPECTED_REJECTION');}
try{
 $db=\VetCare\centralDatabase();foreach(['001_auth','002_owners','003_patients','004_consultations']as$migration){$sql=file_get_contents(__DIR__.'/../database/mariadb/'.$migration.'.sql');$sql=str_replace('CREATE TABLE IF NOT EXISTS','CREATE TEMPORARY TABLE',$sql);$sql=preg_replace('/^\s*FOREIGN KEY[^\r\n]*\r?\n/m','',$sql);$sql=preg_replace('/,\s*\)/',"\n)",$sql);foreach(explode(';',$sql)as$statement)if(trim($statement)!=='')$db->exec($statement);}
 $actor=\VetCare\createUser($db,['username'=>'test-vet','name'=>'Doctor temporal','role'=>'veterinario','password'=>'clave-temporal-de-prueba']);
 $db->beginTransaction();$owner=\VetCare\saveOwner($db,$actor,['operationId'=>\VetCare\uuid(),'name'=>'Temporal'],true);$a=\VetCare\savePatient($db,$actor,['operationId'=>\VetCare\uuid(),'name'=>'Luna','species'=>'Perro','ownerId'=>$owner['id']],true);$b=\VetCare\savePatient($db,$actor,['operationId'=>\VetCare\uuid(),'name'=>'Luna','species'=>'Gato','ownerId'=>$owner['id']],true);$db->commit();
 $save=function(array$data,bool$create=true)use($db,$actor):array{$db->beginTransaction();try{$r=\VetCare\saveConsultation($db,$actor,$data,$create);if($r['saved'])$db->commit();else$db->rollBack();return$r['consultation'];}catch(Throwable$e){$db->rollBack();throw$e;}};
 $base=['kind'=>'consulta','patientId'=>$a['id'],'patientVersion'=>1,'date'=>'2026-01-01','reason'=>'Revisión','treatment'=>'Primera indicación','weight'=>'1.250'];
 $first=$save([...$base,'operationId'=>\VetCare\uuid()]);$updated=$save([...$base,'operationId'=>\VetCare\uuid(),'id'=>$first['id'],'version'=>1,'treatment'=>'Corrección'],false);
 $save([...$base,'patientId'=>$b['id'],'operationId'=>\VetCare\uuid(),'reason'=>'Consulta ajena']);
 // Veintiuna consultas de misma fecha para comprobar límite y desempate de cursor.
 for($i=0;$i<20;$i++)$save([...$base,'operationId'=>\VetCare\uuid(),'reason'=>'Revisión '.$i,'weight'=>'']);
 $page=\VetCare\patientHistory($db,$actor,['patientId'=>$a['id']]);assertHistory($page['totalConsultations']===21&&count($page['consultations'])===20&&$page['nextCursor']!==null);assertHistory($page['latestConsultationWeight']['grams']===1250);
 $next=\VetCare\patientHistory($db,$actor,['patientId'=>$a['id'],'cursor'=>$page['nextCursor']]);assertHistory(count($next['consultations'])===1&&$next['nextCursor']===null);$ids=array_column([...$page['consultations'],...$next['consultations']],'id');assertHistory(count(array_unique($ids))===21);
 foreach([...$page['consultations'],...$next['consultations']]as$row)assertHistory($row['patientId']===$a['id']&&$row['reason']!=='Consulta ajena');
 $filtered=\VetCare\patientHistory($db,$actor,['patientId'=>$a['id'],'q'=>'Corrección']);assertHistory(count($filtered['consultations'])===1);
 $empty=\VetCare\patientHistory($db,$actor,['patientId'=>$a['id'],'from'=>'2026-02-01']);assertHistory(count($empty['consultations'])===0);
 $versions=\VetCare\consultationVersions($db,$actor,['patientId'=>$a['id'],'consultationId'=>$first['id']]);assertHistory(count($versions['versions'])===2&&$versions['versions'][0]['snapshot']['treatment']==='Corrección'&&$versions['versions'][1]['snapshot']['treatment']==='Primera indicación');
 rejectHistory(fn()=>\VetCare\consultationVersions($db,$actor,['patientId'=>$b['id'],'consultationId'=>$first['id']]),'CONSULTATION_NOT_FOUND');rejectHistory(fn()=>\VetCare\patientHistory($db,['role'=>'otro'],['patientId'=>$a['id']]),'FORBIDDEN');
 $db->beginTransaction();\VetCare\savePatient($db,$actor,[...$a,'operationId'=>\VetCare\uuid(),'active'=>false],false);$db->commit();assertHistory(\VetCare\patientHistory($db,$actor,['patientId'=>$a['id']])['totalConsultations']===21);
 echo "MariaDB: historial, homónimos, filtros, paginación, último peso, versiones y lectura de pacientes inactivos comprobados en tablas temporales.\n";
}catch(Throwable){fwrite(STDERR,"No se completó la prueba real de historial. Revisa db:check y permisos de tablas temporales.\n");exit(1);}
