<?php
declare(strict_types=1);
namespace VetCare;
use PDO;
require_once __DIR__.'/database.php';
require_once __DIR__.'/auth.php';
require_once __DIR__.'/owners.php';

function portalOrigin(): string {
 $origin=getenv('PORTAL_ORIGIN')?:'';$parts=parse_url($origin);
 $local=is_array($parts)&&($parts['scheme']??'')==='http'&&($parts['host']??'')==='127.0.0.1';
 if(!$parts||(!$local&&($parts['scheme']??'')!=='https')||isset($parts['user'])||isset($parts['query'])||isset($parts['fragment'])||(isset($parts['path'])&&$parts['path']!==''))failAccess(503,'PORTAL_CONFIGURATION_REQUIRED');
 return $origin;
}
function requirePortalOrigin(string $provided): void {if(!hash_equals(portalOrigin(),$provided))failAccess(403,'PORTAL_ORIGIN_REJECTED');}
function portalSessionCookie(string $token,bool $clear=false): void {
 setcookie('vc_portal_session',$token,['expires'=>$clear?time()-3600:0,'path'=>'/api/v1/portal','secure'=>str_starts_with(portalOrigin(),'https://'),'httponly'=>true,'samesite'=>'Strict']);
}
function portalAudit(PDO $db,?string $owner,string $event,string $address=''): void {
 $db->prepare('INSERT INTO vc_owner_portal_audit(owner_id,event,address_hash,created_at) VALUES(?,?,?,?)')->execute([$owner,$event,$address===''?null:hash('sha256',$address),time()]);
}
function portalPublicOwner(array $row): array {return ['id'=>$row['id'],'name'=>$row['name']];}
function portalSessionValid(array $session,int $now): bool {return(bool)$session['owner_active']&&(bool)$session['account_active']&&$now<(int)$session['expires_at']&&$now-(int)$session['last_seen']<1800;}
function portalAuthenticated(PDO $db,string $token,bool $touch=true): array {
 if(!preg_match('/\A[a-f0-9]{64}\z/D',$token))failAccess(401,'PORTAL_UNAUTHENTICATED');
 $q=$db->prepare('SELECT o.id,o.name,o.active AS owner_active,a.active AS account_active,s.token_hash,s.csrf,s.created_at,s.last_seen,s.expires_at FROM vc_owner_portal_sessions s JOIN vc_owner_accounts a ON a.owner_id=s.owner_id JOIN vc_owners o ON o.id=s.owner_id WHERE s.token_hash=?');$q->execute([hash('sha256',$token)]);$session=$q->fetch();
 if(!$session||!portalSessionValid($session,time()))failAccess(401,'PORTAL_UNAUTHENTICATED');
 if($touch&&time()-(int)$session['last_seen']>=60)$db->prepare('UPDATE vc_owner_portal_sessions SET last_seen=? WHERE token_hash=?')->execute([time(),$session['token_hash']]);
 return $session;
}
function portalRequireCsrf(array $session,string $provided): void {if($provided===''||!hash_equals($session['csrf'],$provided))failAccess(403,'PORTAL_CSRF_FAILED');}
function portalLogin(PDO $db,array $data,string $address): array {
 try{$login=username($data['username']??null);}catch(AccessError){$login='!invalid';}
 $password=$data['password']??'';if(!is_string($password)||strlen($password)>72||str_contains($password,"\0"))$password='';$now=time();
 $db->beginTransaction();try{
  foreach([['portal:account:'.$login,5],['portal:address:'.$address,30]]as[$key,$max]){
   $bucket=hash('sha256',$key);$db->prepare('INSERT IGNORE INTO vc_auth_limits(bucket,attempts,window_start) VALUES(?,0,?)')->execute([$bucket,$now]);
   $q=$db->prepare('SELECT attempts,window_start FROM vc_auth_limits WHERE bucket=? FOR UPDATE');$q->execute([$bucket]);$limit=$q->fetch();
   if($now-(int)$limit['window_start']>=900){$db->prepare('UPDATE vc_auth_limits SET attempts=0,window_start=? WHERE bucket=?')->execute([$now,$bucket]);$limit['attempts']=0;}
   if((int)$limit['attempts']>=$max){$db->commit();failAccess(429,'PORTAL_TOO_MANY_ATTEMPTS');}
   $db->prepare('UPDATE vc_auth_limits SET attempts=attempts+1 WHERE bucket=?')->execute([$bucket]);
  }
  $q=$db->prepare('SELECT a.owner_id,a.password_hash,a.active AS account_active,o.name,o.active AS owner_active FROM vc_owner_accounts a JOIN vc_owners o ON o.id=a.owner_id WHERE a.username=? FOR UPDATE');$q->execute([$login]);$owner=$q->fetch();$dummy='$2y$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2uheWG/igi.';
  if(!$owner||!password_verify($password,$owner['password_hash']??$dummy)||!(bool)$owner['account_active']||!(bool)$owner['owner_active']){portalAudit($db,null,'portal_login_failed',$address);$db->commit();failAccess(401,'PORTAL_INVALID_CREDENTIALS');}
  $token=bin2hex(random_bytes(32));$csrf=bin2hex(random_bytes(32));$old=$_COOKIE['vc_portal_session']??'';if(is_string($old))$db->prepare('DELETE FROM vc_owner_portal_sessions WHERE token_hash=?')->execute([hash('sha256',$old)]);
  $db->prepare('DELETE FROM vc_owner_portal_sessions WHERE expires_at<=?')->execute([$now]);$db->prepare('INSERT INTO vc_owner_portal_sessions(token_hash,owner_id,csrf,created_at,last_seen,expires_at) VALUES(?,?,?,?,?,?)')->execute([hash('sha256',$token),$owner['owner_id'],$csrf,$now,$now,$now+43200]);$db->prepare('DELETE FROM vc_auth_limits WHERE bucket=?')->execute([hash('sha256','portal:account:'.$login)]);portalAudit($db,$owner['owner_id'],'portal_login_success',$address);$db->commit();return['token'=>$token,'csrf'=>$csrf,'owner'=>portalPublicOwner(['id'=>$owner['owner_id'],'name'=>$owner['name']])];
 }catch(\Throwable$error){if($db->inTransaction())$db->rollBack();throw$error;}
}
function portalPatientRow(PDO $db,array $session,mixed $value): array {
 $id=requireUuid($value);$q=$db->prepare('SELECT id,name,species,breed,birth_date,age_value,age_unit,age_reference,active FROM vc_patients WHERE id=? AND owner_id=?');$q->execute([$id,$session['id']]);$patient=$q->fetch();if(!$patient)failAccess(404,'PORTAL_PATIENT_NOT_FOUND');return$patient;
}
function portalPublicPatient(array $row): array {return['id'=>$row['id'],'name'=>$row['name'],'species'=>$row['species'],'breed'=>$row['breed'],'birthDate'=>$row['birth_date'],'ageValue'=>$row['age_value']===null?null:(int)$row['age_value'],'ageUnit'=>$row['age_unit'],'ageReference'=>$row['age_reference'],'active'=>(bool)$row['active']];}
function portalPage(mixed $value): int {if(!is_string($value)||!ctype_digit($value)||(int)$value<1||(int)$value>10000)failAccess(422,'PORTAL_INVALID_FILTER');return(int)$value;}
function portalPatients(PDO $db,array $session,array $query): array {
 $page=portalPage($query['page']??'1');$q=$db->prepare('SELECT id,name,species,breed,birth_date,age_value,age_unit,age_reference,active FROM vc_patients WHERE owner_id=? ORDER BY active DESC,name,id LIMIT 21 OFFSET '.(($page-1)*20));$q->execute([$session['id']]);$rows=$q->fetchAll();return['patients'=>array_map('VetCare\\portalPublicPatient',array_slice($rows,0,20)),'page'=>$page,'hasMore'=>count($rows)>20];
}
function portalCursor(mixed $value): ?array {
 if($value===null||$value==='')return null;if(!is_string($value)||strlen($value)>256)failAccess(422,'PORTAL_INVALID_FILTER');$raw=base64_decode(strtr($value,'-_','+/'),true);if($raw===false)failAccess(422,'PORTAL_INVALID_FILTER');try{$cursor=json_decode($raw,true,4,JSON_THROW_ON_ERROR);}catch(\JsonException){failAccess(422,'PORTAL_INVALID_FILTER');}
 if(!is_array($cursor)||count($cursor)!==2||!isset($cursor['date'],$cursor['id'])||!is_string($cursor['date'])||!preg_match('/\A\d{4}-\d{2}-\d{2}\z/D',$cursor['date']))failAccess(422,'PORTAL_INVALID_FILTER');requireUuid($cursor['id']);return$cursor;
}
function portalHistory(PDO $db,array $session,array $query): array {
 $patient=portalPatientRow($db,$session,$query['patientId']??null);$cursor=portalCursor($query['cursor']??null);$where=['patient_id=?'];$args=[$patient['id']];if($cursor){$where[]='(date<? OR (date=? AND id<?))';array_push($args,$cursor['date'],$cursor['date'],$cursor['id']);}
 $q=$db->prepare('SELECT id,date,reason,treatment,notes,weight_g,temperature_cent,heart_rate,respiratory_rate,blood_pressure FROM vc_consultations WHERE '.implode(' AND ',$where).' ORDER BY date DESC,id DESC LIMIT 21');$q->execute($args);$rows=$q->fetchAll();$more=count($rows)>20;$rows=array_slice($rows,0,20);$last=$rows?end($rows):null;$next=$more&&$last?rtrim(strtr(base64_encode(json_encode(['date'=>$last['date'],'id'=>$last['id']],JSON_THROW_ON_ERROR)),'+/','-_'),'='):null;
 $consultations=array_map(static fn($row)=>['date'=>$row['date'],'reason'=>$row['reason'],'treatment'=>$row['treatment'],'notes'=>$row['notes'],'weight'=>$row['weight_g']===null?null:(int)$row['weight_g'],'temperature'=>$row['temperature_cent']===null?null:(int)$row['temperature_cent'],'heartRate'=>$row['heart_rate']===null?null:(int)$row['heart_rate'],'respiratoryRate'=>$row['respiratory_rate']===null?null:(int)$row['respiratory_rate'],'bloodPressure'=>$row['blood_pressure']],$rows);
 return['patient'=>portalPublicPatient($patient),'consultations'=>$consultations,'nextCursor'=>$next];
}
function portalSanitaryEvents(PDO $db,array $session,array $query): array {
 $patient=portalPatientRow($db,$session,$query['patientId']??null);$kind=$query['kind']??null;if(!in_array($kind,['vacuna','desparasitacion'],true))failAccess(422,'PORTAL_INVALID_FILTER');$page=portalPage($query['page']??'1');
 if($kind==='vacuna'){$q=$db->prepare('SELECT date,product,application,next_date FROM vc_vaccinations WHERE patient_id=? ORDER BY date DESC,id DESC LIMIT 21 OFFSET '.(($page-1)*20));$q->execute([$patient['id']]);$rows=$q->fetchAll();$events=array_map(static fn($row)=>['date'=>$row['date'],'product'=>$row['product'],'application'=>$row['application'],'nextDate'=>$row['next_date']],array_slice($rows,0,20));}
 else{$q=$db->prepare('SELECT date,product,weight_g,next_date FROM vc_dewormings WHERE patient_id=? ORDER BY date DESC,id DESC LIMIT 21 OFFSET '.(($page-1)*20));$q->execute([$patient['id']]);$rows=$q->fetchAll();$events=array_map(static fn($row)=>['date'=>$row['date'],'product'=>$row['product'],'weight'=>$row['weight_g']===null?null:(int)$row['weight_g'],'nextDate'=>$row['next_date']],array_slice($rows,0,20));}
 return['events'=>$events,'page'=>$page,'hasMore'=>count($rows)>20];
}
function portalBody(): array {
 if(strtolower(trim(explode(';',$_SERVER['CONTENT_TYPE']??'')[0]))!=='application/json')failAccess(415,'PORTAL_JSON_REQUIRED');$raw=file_get_contents('php://input',false,null,0,16385);if($raw===false||strlen($raw)>16384)failAccess(413,'PORTAL_BODY_TOO_LARGE');try{$data=json_decode($raw,true,16,JSON_THROW_ON_ERROR);}catch(\JsonException){failAccess(400,'PORTAL_INVALID_JSON');}if(!is_array($data)||array_is_list($data))failAccess(400,'PORTAL_INVALID_JSON');return$data;
}
function portalRoute(string $path,string $method): never {
 $routes=['/api/v1/portal/login'=>['POST'],'/api/v1/portal/session'=>['GET'],'/api/v1/portal/logout'=>['POST'],'/api/v1/portal/patients'=>['GET'],'/api/v1/portal/history'=>['GET'],'/api/v1/portal/sanitary-events'=>['GET']];
 if(!in_array($method,$routes[$path],true)){header('Allow: '.implode(', ',$routes[$path]));respond(405,['error'=>['code'=>'METHOD_NOT_ALLOWED','message'=>'Método no permitido.']]);}
 try{
  $write=$method==='POST';if($write)requirePortalOrigin($_SERVER['HTTP_ORIGIN']??'');
  if($path==='/api/v1/portal/login'){$db=centralDatabase();$result=portalLogin($db,portalBody(),$_SERVER['REMOTE_ADDR']??'unknown');portalSessionCookie($result['token']);unset($result['token']);respond(200,$result);}
  $token=$_COOKIE['vc_portal_session']??'';if(!is_string($token)||!preg_match('/\A[a-f0-9]{64}\z/D',$token))failAccess(401,'PORTAL_UNAUTHENTICATED');$db=centralDatabase();$session=portalAuthenticated($db,$token,$path!=='/api/v1/portal/session');if($write)portalRequireCsrf($session,$_SERVER['HTTP_X_CSRF_TOKEN']??'');
  if($path==='/api/v1/portal/session')respond(200,['owner'=>portalPublicOwner($session),'csrf'=>$session['csrf']]);
  if($path==='/api/v1/portal/logout'){$db->beginTransaction();$db->prepare('DELETE FROM vc_owner_portal_sessions WHERE token_hash=?')->execute([$session['token_hash']]);portalAudit($db,$session['id'],'portal_logout',$_SERVER['REMOTE_ADDR']??'unknown');$db->commit();portalSessionCookie('',true);respond(200,['ok'=>true]);}
  if($path==='/api/v1/portal/patients')respond(200,portalPatients($db,$session,$_GET));if($path==='/api/v1/portal/history')respond(200,portalHistory($db,$session,$_GET));respond(200,portalSanitaryEvents($db,$session,$_GET));
 }catch(AccessError$error){if(isset($db)&&$db->inTransaction())$db->rollBack();$messages=['PORTAL_INVALID_CREDENTIALS'=>'Usuario o contraseña incorrectos.','PORTAL_UNAUTHENTICATED'=>'Inicia sesión para continuar.','PORTAL_TOO_MANY_ATTEMPTS'=>'Demasiados intentos. Espera hasta 15 minutos antes de intentar de nuevo.','PORTAL_PATIENT_NOT_FOUND'=>'No se encontró la mascota solicitada.','PORTAL_INVALID_FILTER'=>'La consulta solicitada no es válida.','PORTAL_CSRF_FAILED'=>'La solicitud no pudo validarse. Vuelve a iniciar sesión.','PORTAL_ORIGIN_REJECTED'=>'Origen de solicitud no permitido.','PORTAL_CONFIGURATION_REQUIRED'=>'Falta configurar el origen autorizado del portal.','PORTAL_JSON_REQUIRED'=>'La solicitud no es válida.','PORTAL_INVALID_JSON'=>'La solicitud no es válida.','PORTAL_BODY_TOO_LARGE'=>'La solicitud es demasiado grande.'];if($error->status===429)header('Retry-After: 900');respond($error->status,['error'=>['code'=>$error->reason,'message'=>$messages[$error->reason]??'No se pudo completar la solicitud.']]);
 }catch(\Throwable$error){if(isset($db)&&$db->inTransaction())$db->rollBack();error_log('VetCare: portal no disponible ['.databaseDiagnosticCode($error).'].');respond(503,['error'=>['code'=>'SERVICE_UNAVAILABLE','message'=>'El portal no está disponible en este momento. Inténtalo de nuevo.']]);}
}
