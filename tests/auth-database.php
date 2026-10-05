<?php
declare(strict_types=1);
// Prueba real en MariaDB con tablas TEMPORARY de la conexión; no modifica cuentas reales.
if (PHP_SAPI!=='cli') exit(1);
require __DIR__.'/../server/database.php';require __DIR__.'/../server/auth.php';
function verify(bool $value, string $message): void { if (!$value) throw new RuntimeException($message); }
function denied(callable $action, string $code): void {
    try { $action(); } catch (\VetCare\AccessError $error) { verify($error->reason===$code,'Código de rechazo inesperado');return; }
    throw new RuntimeException('Se permitió una operación que debía rechazarse');
}
try {
    $db=\VetCare\centralDatabase();
    $sql=file_get_contents(__DIR__.'/../database/mariadb/001_auth.sql');
    $sql=str_replace(['CREATE TABLE IF NOT EXISTS',' FOREIGN KEY (user_id) REFERENCES vc_auth_users(id),'],['CREATE TEMPORARY TABLE',''],$sql);
    foreach(explode(';',$sql) as $statement) if(trim($statement)!=='') $db->exec($statement);
    $admin=\VetCare\createUser($db,['username'=>'test-admin','name'=>'Prueba temporal','role'=>'administrador','password'=>'clave-temporal-de-prueba']);
    denied(fn()=>\VetCare\login($db,['username'=>'test-admin','password'=>'equivocada'],'127.0.0.1'),'INVALID_CREDENTIALS');
    $login=\VetCare\login($db,['username'=>'test-admin','password'=>'clave-temporal-de-prueba'],'127.0.0.1');
    $actor=\VetCare\authenticated($db,$login['token']);
    verify($actor['id']===$admin['id'],'Identidad incorrecta');
    verify($db->query('SELECT token_hash FROM vc_auth_sessions')->fetchColumn()!==$login['token'],'Token sin hash');
    denied(fn()=>\VetCare\updateUser($db,$actor,['id'=>$admin['id'],'role'=>'veterinario','active'=>true]),'LAST_ADMINISTRATOR');
    denied(fn()=>\VetCare\updateUser($db,$actor,['id'=>$admin['id'],'role'=>'administrador','active'=>false]),'LAST_ADMINISTRATOR');
    $vet=\VetCare\createUser($db,['username'=>'test-vet','name'=>'Veterinario temporal','role'=>'veterinario','password'=>'clave-temporal-de-prueba'],$actor);
    $vetLogin=\VetCare\login($db,['username'=>'test-vet','password'=>'clave-temporal-de-prueba'],'127.0.0.1');
    $vetSession=\VetCare\authenticated($db,$vetLogin['token']);
    denied(fn()=>\VetCare\createUser($db,['username'=>'injected','name'=>'Prueba','role'=>'administrador','password'=>'clave-temporal-de-prueba'],$vetSession),'FORBIDDEN');
    \VetCare\updateUser($db,$actor,['id'=>$vet['id'],'role'=>'veterinario','active'=>false]);
    denied(fn()=>\VetCare\authenticated($db,$vetLogin['token']),'UNAUTHENTICATED');
    denied(fn()=>\VetCare\login($db,['username'=>'test-vet','password'=>'clave-temporal-de-prueba'],'127.0.0.1'),'INVALID_CREDENTIALS');
    $db->prepare('DELETE FROM vc_auth_sessions WHERE user_id=?')->execute([$admin['id']]);
    denied(fn()=>\VetCare\authenticated($db,$login['token']),'UNAUTHENTICATED');
    for($i=0;$i<5;$i++) denied(fn()=>\VetCare\login($db,['username'=>'unknown','password'=>'wrong'],'127.0.0.2'),'INVALID_CREDENTIALS');
    denied(fn()=>\VetCare\login($db,['username'=>'unknown','password'=>'wrong'],'127.0.0.2'),'TOO_MANY_ATTEMPTS');
    echo "MariaDB: acceso, roles, último administrador, revocación y límite de intentos comprobados en tablas temporales.\n";
} catch (Throwable) {
    fwrite(STDERR,"No se completó la prueba real de autenticación en tablas temporales. Revisa db:check y los permisos de tablas temporales.\n");exit(1);
}
