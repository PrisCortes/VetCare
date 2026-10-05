<?php
declare(strict_types=1);
require_once __DIR__.'/database.php';
require_once __DIR__.'/auth.php';

function authBody(): array {
    if (strtolower(trim(explode(';',$_SERVER['CONTENT_TYPE'] ?? '')[0])) !== 'application/json') \VetCare\failAccess(415,'JSON_REQUIRED');
    $raw=file_get_contents('php://input',false,null,0,16385);
    if ($raw === false || strlen($raw)>16384) \VetCare\failAccess(413,'BODY_TOO_LARGE');
    try { $data=json_decode($raw,true,16,JSON_THROW_ON_ERROR); } catch (JsonException) { \VetCare\failAccess(400,'INVALID_JSON'); }
    if (!is_array($data) || array_is_list($data)) \VetCare\failAccess(400,'INVALID_JSON');
    return $data;
}
function authRoute(string $path, string $method): never {
    $routes=[
        '/api/v1/auth/login'=>['POST'], '/api/v1/auth/session'=>['GET'],
        '/api/v1/auth/logout'=>['POST'], '/api/v1/admin/users'=>['GET','POST','PATCH'],
        '/api/v1/access'=>['GET'],
    ];
    if (!in_array($method,$routes[$path],true)) { header('Allow: '.implode(', ',$routes[$path])); respond(405,['error'=>['code'=>'METHOD_NOT_ALLOWED','message'=>'Método no permitido.']]); }
    try {
        $write=in_array($method,['POST','PATCH'],true);
        if ($write) \VetCare\requireOrigin($_SERVER['HTTP_ORIGIN'] ?? '');
        if ($path==='/api/v1/auth/login') {
            $data=authBody();$db=\VetCare\centralDatabase();
            $result=\VetCare\login($db,$data,$_SERVER['REMOTE_ADDR'] ?? 'unknown');
            \VetCare\sessionCookie($result['token']);unset($result['token']);respond(200,$result);
        }
        $token=$_COOKIE['vc_session'] ?? '';
        if (!is_string($token) || !preg_match('/\A[a-f0-9]{64}\z/D',$token)) \VetCare\failAccess(401,'UNAUTHENTICATED');
        $db=\VetCare\centralDatabase();
        $session=\VetCare\authenticated($db,$token,$path!=='/api/v1/auth/session');
        if ($write) \VetCare\requireCsrf($session,$_SERVER['HTTP_X_CSRF_TOKEN'] ?? '');
        if ($path==='/api/v1/auth/session') respond(200,['user'=>\VetCare\publicUser($session),'csrf'=>$session['csrf']]);
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
        respond(503,['error'=>['code'=>'AUTH_UNAVAILABLE','message'=>'El servicio de acceso no está disponible. Revisa la conexión y la preparación de la base central.']]);
    }
}
