<?php
declare(strict_types=1);
require_once __DIR__.'/database.php';
require_once __DIR__.'/auth.php';
require_once __DIR__.'/owners.php';
require_once __DIR__.'/patients.php';
require_once __DIR__.'/attention.php';
require_once __DIR__.'/consultations.php';
require_once __DIR__.'/sanitary-events.php';
require_once __DIR__.'/history.php';
require_once __DIR__.'/offline.php';

function authBody(int $maxBytes=16384): array {
    if (strtolower(trim(explode(';',$_SERVER['CONTENT_TYPE'] ?? '')[0])) !== 'application/json') \VetCare\failAccess(415,'JSON_REQUIRED');
    $raw=file_get_contents('php://input',false,null,0,$maxBytes+1);
    if ($raw === false || strlen($raw)>$maxBytes) \VetCare\failAccess(413,'BODY_TOO_LARGE');
    try { $data=json_decode($raw,true,16,JSON_THROW_ON_ERROR); } catch (JsonException) { \VetCare\failAccess(400,'INVALID_JSON'); }
    if (!is_array($data) || array_is_list($data)) \VetCare\failAccess(400,'INVALID_JSON');
    return $data;
}
function initialDirectory(PDO $db,array $user,mixed $directory):?array {
    if(!is_string($directory)||!in_array($directory,['owners','patients'],true))return null;
    $query=$directory==='owners'?['q'=>'','status'=>'active','page'=>'1']:['q'=>'','species'=>'','status'=>'active','page'=>'1'];
    try{return ['action'=>$directory,'query'=>$query,'data'=>$directory==='owners'?\VetCare\listOwners($db,$user,$query):\VetCare\listPatients($db,$user,$query)];}
    catch(PDOException){return null;} // La UI informa tablas pendientes sin impedir autenticar.
}
function authRoute(string $path, string $method): never {
    $routes=[
        '/api/v1/auth/login'=>['POST'], '/api/v1/auth/session'=>['GET'],
        '/api/v1/auth/logout'=>['POST'], '/api/v1/admin/users'=>['GET','POST','PATCH'],
        '/api/v1/access'=>['GET'],
        '/api/v1/owners'=>['GET','POST','PATCH'],
        '/api/v1/patients'=>['GET','POST','PATCH'],
        '/api/v1/attention/validate'=>['POST'],
        '/api/v1/consultations'=>['GET','POST','PATCH'],
        '/api/v1/sanitary-events'=>['GET','POST','PATCH'],
        '/api/v1/history'=>['GET'],
        '/api/v1/consultation-versions'=>['GET'],
        '/api/v1/offline/bootstrap'=>['POST'],
    ];
    if (!in_array($method,$routes[$path],true)) { header('Allow: '.implode(', ',$routes[$path])); respond(405,['error'=>['code'=>'METHOD_NOT_ALLOWED','message'=>'Método no permitido.']]); }
    try {
        $write=in_array($method,['POST','PATCH'],true);
        if ($write) \VetCare\requireOrigin($_SERVER['HTTP_ORIGIN'] ?? '');
        if ($path==='/api/v1/auth/login') {
            $data=authBody();$db=\VetCare\centralDatabase();
            $result=\VetCare\login($db,$data,$_SERVER['REMOTE_ADDR'] ?? 'unknown');
            \VetCare\sessionCookie($result['token']);unset($result['token']);
            $result['directory']=initialDirectory($db,$result['user'],$data['directory']??null);respond(200,$result);
        }
        $token=$_COOKIE['vc_session'] ?? '';
        if (!is_string($token) || !preg_match('/\A[a-f0-9]{64}\z/D',$token)) \VetCare\failAccess(401,'UNAUTHENTICATED');
        $db=\VetCare\centralDatabase();
        $session=\VetCare\authenticated($db,$token,$path!=='/api/v1/auth/session');
        if ($write) \VetCare\requireCsrf($session,$_SERVER['HTTP_X_CSRF_TOKEN'] ?? '');
        if($path==='/api/v1/offline/bootstrap')respond(200,\VetCare\offlineBootstrap($db,$session,authBody()));
        if($path==='/api/v1/history')respond(200,\VetCare\patientHistory($db,$session,$_GET));
        if($path==='/api/v1/consultation-versions')respond(200,\VetCare\consultationVersions($db,$session,$_GET));
        if($path==='/api/v1/consultations'){
            if($method==='GET')respond(200,\VetCare\listConsultations($db,$session,$_GET));
            $input=authBody(524288);$operation=\VetCare\requireUuid($input['operationId']??null);$lockName='vc_consult_'.$operation;
            $q=$db->prepare('SELECT GET_LOCK(?,5)');$q->execute([$lockName]);if((int)$q->fetchColumn()!==1)\VetCare\failAccess(503,'TRY_AGAIN');
            try{$db->beginTransaction();$session=\VetCare\authenticated($db,$token,false);$result=\VetCare\saveConsultation($db,$session,$input,$method==='POST');if($result['saved'])$db->commit();else $db->rollBack();}
            catch(Throwable $error){if($db->inTransaction())$db->rollBack();throw $error;}
            finally{$q=$db->prepare('SELECT RELEASE_LOCK(?)');$q->execute([$lockName]);}
            if(!$result['saved'])respond(422,['error'=>['code'=>'INVALID_ATTENTION','message'=>'Revisa los campos indicados.'],'fields'=>$result['fields']]);
            respond($method==='POST'?201:200,$result);
        }
        if($path==='/api/v1/sanitary-events'){
            if($method==='GET')respond(200,\VetCare\listSanitaryEvents($db,$session,$_GET));
            $input=authBody(524288);$operation=\VetCare\requireUuid($input['operationId']??null);$lockName='vc_sanitary_'.$operation;
            $q=$db->prepare('SELECT GET_LOCK(?,5)');$q->execute([$lockName]);if((int)$q->fetchColumn()!==1)\VetCare\failAccess(503,'TRY_AGAIN');
            try{$db->beginTransaction();$session=\VetCare\authenticated($db,$token,false);$result=\VetCare\saveSanitaryEvent($db,$session,$input,$method==='POST');if($result['saved'])$db->commit();else $db->rollBack();}
            catch(Throwable $error){if($db->inTransaction())$db->rollBack();throw $error;}
            finally{$q=$db->prepare('SELECT RELEASE_LOCK(?)');$q->execute([$lockName]);}
            if(!$result['saved'])respond(422,['error'=>['code'=>'INVALID_ATTENTION','message'=>'Revisa los campos indicados.'],'fields'=>$result['fields']]);
            respond($method==='POST'?201:200,$result);
        }
        if($path==='/api/v1/attention/validate'){
            $result=\VetCare\validatePatientAttention($db,$session,authBody(524288));
            if(!$result['valid'])respond(422,['error'=>['code'=>'INVALID_ATTENTION','message'=>'Revisa los campos indicados.'],'fields'=>$result['errors']]);
            respond(200,['validated'=>true,'saved'=>false,'patient'=>$result['patient'],'data'=>$result['data']]);
        }
        if ($path==='/api/v1/auth/session') respond(200,['user'=>\VetCare\publicUser($session),'csrf'=>$session['csrf'],'directory'=>initialDirectory($db,$session,$_GET['directory']??null)]);
        if ($path==='/api/v1/auth/logout') {
            $db->beginTransaction();
            $db->prepare('DELETE FROM vc_auth_sessions WHERE token_hash=?')->execute([$session['token_hash']]);
            \VetCare\audit($db,$session['id'],'logout');$db->commit();
            \VetCare\sessionCookie('',true);respond(200,['ok'=>true]);
        }
        if ($path==='/api/v1/access') {
            \VetCare\requirePermission($session,'clinical.read');
            respond(200,['user'=>\VetCare\publicUser($session),'permissions'=>['clinical.read','clinical.write',...(\VetCare\permitted($session['role'],'users.manage')?['users.manage']:[])]]);
        }
        if (in_array($path,['/api/v1/owners','/api/v1/patients'],true)) {
            $patients=$path==='/api/v1/patients';
            if ($method==='GET') respond(200,$patients?\VetCare\listPatients($db,$session,$_GET):\VetCare\listOwners($db,$session,$_GET));
            $data=authBody();$operation=\VetCare\requireUuid($data['operationId']??null);
            $lockName=($patients?'vc_patient_':'vc_owner_').$operation;
            $lock=$db->prepare('SELECT GET_LOCK(?,5)');$lock->execute([$lockName]);
            if((int)$lock->fetchColumn()!==1)\VetCare\failAccess(503,'TRY_AGAIN');
            try{
                $db->beginTransaction();$session=\VetCare\authenticated($db,$token,false);
                $owner=$patients?\VetCare\savePatient($db,$session,$data,$method==='POST'):\VetCare\saveOwner($db,$session,$data,$method==='POST');$db->commit();
            }catch(Throwable $error){if($db->inTransaction())$db->rollBack();throw $error;}
            finally{$release=$db->prepare('SELECT RELEASE_LOCK(?)');$release->execute([$lockName]);}
            respond($method==='POST'?201:200,[$patients?'patient':'owner'=>$owner]);
        }
        \VetCare\requirePermission($session,'users.manage');
        if ($method==='GET') respond(200,['users'=>array_map('VetCare\\publicUser',$db->query('SELECT id,username,name,role,active FROM vc_auth_users ORDER BY username')->fetchAll())]);
        $data=authBody();
        $lock=$db->query("SELECT GET_LOCK('vetcare_auth_admin',5)")->fetchColumn();
        if ((int)$lock!==1) \VetCare\failAccess(503,'TRY_AGAIN');
        try {
            $db->beginTransaction();
            // Revalidar rol y vigencia después del bloqueo para cambios concurrentes.
            $session=\VetCare\authenticated($db,$token);
            if ($method==='POST') $user=\VetCare\createUser($db,$data,$session);
            else \VetCare\updateUser($db,$session,$data);
            $db->commit();
        } catch (Throwable $error) { if ($db->inTransaction()) $db->rollBack();throw $error; }
        finally { $db->query("SELECT RELEASE_LOCK('vetcare_auth_admin')"); }
        respond($method==='POST'?201:200,$method==='POST'?['user'=>$user]:['ok'=>true]);
    } catch (\VetCare\AccessError $error) {
        if (isset($db) && $db->inTransaction()) $db->rollBack();
        $messages=[
            'OFFLINE_KEY_REQUIRED'=>'Falta preparar la firma de acceso local en el backend.',
            'OFFLINE_EXPORT_TOO_LARGE'=>'La preparación supera 2000 registros por entidad. No se descargará una copia incompleta.',
            'CONSULTATION_ONLY'=>'Solo está habilitado el guardado de consultas y tratamientos.',
            'INVALID_CONSULTATION_VERSION'=>'Versión de consulta no válida.',
            'CONSULTATION_NOT_FOUND'=>'No se encontró la consulta.',
            'CONSULTATION_PATIENT_IMMUTABLE'=>'Una corrección no puede cambiar el paciente de la consulta.',
            'CONSULTATION_CONFLICT'=>'Otra sesión corrigió esta consulta. Recarga sus registros antes de continuar.',
            'SANITARY_EVENT_ONLY'=>'Solo se pueden guardar vacunas o desparasitaciones en esta ruta.',
            'INVALID_SANITARY_EVENT_VERSION'=>'Versión de evento sanitario no válida.',
            'SANITARY_EVENT_NOT_FOUND'=>'No se encontró el evento sanitario.',
            'SANITARY_EVENT_PATIENT_IMMUTABLE'=>'Una corrección no puede cambiar el paciente del evento sanitario.',
            'SANITARY_EVENT_CONFLICT'=>'Otra sesión corrigió este evento. Recarga sus registros antes de continuar.',
            'PATIENT_INACTIVE'=>'Reactiva al paciente antes de preparar una nueva atención.',
            'PATIENT_CONTEXT_CHANGED'=>'La ficha del paciente cambió. Vuelve al directorio y selecciona su versión reciente; no se guardó la captura.',
            'INVALID_PATIENT'=>'Revisa la identificación, especie y campos del paciente.',
            'INVALID_PATIENT_DATE'=>'La fecha debe ser válida y no estar en el futuro.',
            'INVALID_PATIENT_AGE'=>'Indica nacimiento o una estimación completa con valor, unidad y fecha de referencia.',
            'PATIENT_NOT_FOUND'=>'No se encontró el paciente.',
            'PATIENT_OWNER_REQUIRED'=>'Selecciona un propietario existente.',
            'PATIENT_OWNER_INACTIVE'=>'El propietario debe estar activo para registrar o reactivar al paciente.',
            'PATIENT_CONFLICT'=>'El paciente cambió en otra sesión. Revisa su versión reciente antes de guardar.',
            'INVALID_OWNER'=>'Revisa el nombre y la longitud de los campos del propietario.',
            'INVALID_IDENTIFIER'=>'Identificador de operación no válido.', 'INVALID_FILTER'=>'Filtro o página no válidos.',
            'OWNER_NOT_FOUND'=>'No se encontró el propietario.',
            'OWNER_CONFLICT'=>'El propietario cambió en otra sesión. Recarga el directorio antes de editar; tu captura no se guardó.',
            'OPERATION_REUSED'=>'La operación ya se utilizó con otros datos. Recarga y revisa el registro antes de continuar.',
            'OWNER_HAS_ACTIVE_PATIENTS'=>'No se puede dar de baja un propietario con pacientes activos.',
            'UNAUTHENTICATED'=>'Inicia sesión para continuar.', 'INVALID_CREDENTIALS'=>'Usuario o contraseña incorrectos.',
            'FORBIDDEN'=>'Tu cuenta no tiene permiso para realizar esta acción.', 'CSRF_FAILED'=>'La solicitud no pudo validarse. Vuelve a iniciar sesión.',
            'ORIGIN_REJECTED'=>'Origen de solicitud no permitido.', 'REAUTHENTICATE'=>'Cierra sesión y vuelve a ingresar antes de administrar cuentas.',
            'LAST_ADMINISTRATOR'=>'Debe conservarse al menos un administrador activo.', 'USERNAME_UNAVAILABLE'=>'El nombre de usuario no está disponible.',
            'INVALID_USER'=>'Revisa el usuario, nombre y rol.', 'INVALID_PASSWORD'=>'La contraseña debe tener entre 12 y 72 bytes.',
            'TOO_MANY_ATTEMPTS'=>'Demasiados intentos. Espera hasta 15 minutos antes de intentar de nuevo.',
            'AUTH_CONFIGURATION_REQUIRED'=>'Falta configurar el origen autorizado de la aplicación.',
        ];
        if ($error->status===429) header('Retry-After: 900');
        respond($error->status,['error'=>['code'=>$error->reason,'message'=>$messages[$error->reason] ?? 'No se pudo completar la solicitud.']]);
    } catch (Throwable) {
        if (isset($db) && $db->inTransaction()) $db->rollBack();
        respond(503,['error'=>['code'=>'SERVICE_UNAVAILABLE','message'=>'El servicio central no está disponible. Revisa la conexión y ejecuta db:migrate si hay tablas pendientes.']]);
    }
}
