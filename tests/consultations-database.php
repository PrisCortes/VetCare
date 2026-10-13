<?php
declare(strict_types=1);
if(PHP_SAPI!=='cli')exit(1);
foreach(['database','auth','owners','patients','attention','consultations']as$file)require __DIR__.'/../server/'.$file.'.php';
function ensureConsult(bool $value):void{if(!$value)throw new RuntimeException('ASSERTION_FAILED');}
function rejectsConsult(callable $fn,string $reason):void{try{$fn();}catch(\VetCare\AccessError $e){ensureConsult($e->reason===$reason);return;}throw new RuntimeException('EXPECTED_REJECTION');}
try{
 $db=\VetCare\centralDatabase();foreach(['001_auth','002_owners','003_patients','004_consultations']as$migration){$sql=file_get_contents(__DIR__.'/../database/mariadb/'.$migration.'.sql');$sql=str_replace('CREATE TABLE IF NOT EXISTS','CREATE TEMPORARY TABLE',$sql);$sql=preg_replace('/^\s*FOREIGN KEY[^\r\n]*\r?\n/m','',$sql);$sql=preg_replace('/,\s*\)/',"\n)",$sql);foreach(explode(';',$sql)as$statement)if(trim($statement)!=='')$db->exec($statement);}
 $actor=\VetCare\createUser($db,['username'=>'test-vet','name'=>'Prueba temporal','role'=>'veterinario','password'=>'clave-temporal-de-prueba']);
 $db->beginTransaction();$owner=\VetCare\saveOwner($db,$actor,['name'=>'Temporal','operationId'=>\VetCare\uuid()],true);$patient=\VetCare\savePatient($db,$actor,['operationId'=>\VetCare\uuid(),'name'=>'Temporal','species'=>'Perro','ownerId'=>$owner['id'],'ageValue'=>3,'ageUnit'=>'meses','ageReference'=>'2026-01-01'],true);$db->commit();
 $save=function(array $input,bool $create)use($db,$actor):array{$db->beginTransaction();try{$result=\VetCare\saveConsultation($db,$actor,$input,$create);if($result['saved'])$db->commit();else$db->rollBack();return$result;}catch(Throwable $e){$db->rollBack();throw$e;}};
 $input=['kind'=>'consulta','patientId'=>$patient['id'],'patientVersion'=>1,'operationId'=>\VetCare\uuid(),'date'=>'2026-01-01','reason'=>'Revisión','treatment'=>'Tratamiento de prueba','weight'=>'0,001','temperature'=>'38.25'];
 $first=$save($input,true);ensureConsult($first['saved']&&$first['consultation']['weight']===1&&$first['consultation']['temperature']===3825);
 ensureConsult($save($input,true)===$first);ensureConsult((int)$db->query('SELECT COUNT(*) FROM vc_consultations')->fetchColumn()===1);
 rejectsConsult(fn()=>$save([...$input,'reason'=>'Otra carga'],true),'OPERATION_REUSED');
 $record=$first['consultation'];$correction=[...$input,'operationId'=>\VetCare\uuid(),'id'=>$record['id'],'version'=>1,'treatment'=>'Corrección'];$updated=$save($correction,false);ensureConsult($updated['consultation']['version']===2&&$updated['consultation']['createdBy']===$record['createdBy']);
 rejectsConsult(fn()=>$save([...$correction,'operationId'=>\VetCare\uuid()],false),'CONSULTATION_CONFLICT');
 $snapshot=json_decode($db->query('SELECT snapshot FROM vc_consultation_versions WHERE version=1')->fetchColumn(),true);ensureConsult($snapshot['treatment']==='Tratamiento de prueba');
 $invalid=$save([...$input,'operationId'=>\VetCare\uuid(),'date'=>'2999-01-01'],true);ensureConsult(!$invalid['saved']);ensureConsult((int)$db->query('SELECT COUNT(*) FROM vc_consultations')->fetchColumn()===1);
 $list=\VetCare\listConsultations($db,$actor,['patientId'=>$patient['id']]);ensureConsult($list['consultations'][0]['treatment']==='Corrección');
 $db->beginTransaction();$newPatient=\VetCare\savePatient($db,$actor,[...$patient,'operationId'=>\VetCare\uuid(),'birthDate'=>'2025-01-01','ageValue'=>null,'ageUnit'=>null,'ageReference'=>null],false);$db->commit();
 $later=$save([...$correction,'patientVersion'=>2,'operationId'=>\VetCare\uuid(),'version'=>2,'treatment'=>'Otra corrección'],false);ensureConsult($later['consultation']['ageSnapshot']['birthDate']===null&&$later['consultation']['ageSnapshot']['ageValue']===3);
 $db->beginTransaction();\VetCare\savePatient($db,$actor,[...$newPatient,'operationId'=>\VetCare\uuid(),'active'=>false],false);$db->commit();
 rejectsConsult(fn()=>$save([...$input,'operationId'=>\VetCare\uuid(),'patientVersion'=>3],true),'PATIENT_INACTIVE');
 ensureConsult($save([...$correction,'patientVersion'=>3,'operationId'=>\VetCare\uuid(),'version'=>3],false)['saved']);
 rejectsConsult(fn()=>\VetCare\listConsultations($db,['role'=>'otro'],['patientId'=>$patient['id']]),'FORBIDDEN');
 echo "MariaDB: consultas, tratamientos, reintentos, correcciones, autoría, edad histórica y paciente inactivo comprobados en tablas temporales.\n";
}catch(Throwable){fwrite(STDERR,"No se completó la prueba real de consultas. Revisa db:check y permisos de tablas temporales.\n");exit(1);}
