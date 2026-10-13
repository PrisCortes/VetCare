<?php
declare(strict_types=1);
if (PHP_SAPI!=='cli') { http_response_code(404);exit; }
ini_set('display_errors','0');
require __DIR__.'/database.php';require __DIR__.'/auth.php';
$db=null;
try {
    $db=\VetCare\centralDatabase();
    if ((int)$db->query("SELECT GET_LOCK('vetcare_auth_admin',10)")->fetchColumn()!==1) throw new RuntimeException('LOCK_FAILED');
    if (($argv[1] ?? '')==='migrate') {
        $db->exec('CREATE TABLE IF NOT EXISTS vc_schema_migrations (version VARCHAR(80) PRIMARY KEY, checksum CHAR(64) NOT NULL, applied_at BIGINT NOT NULL) ENGINE=InnoDB');
        foreach (['001_auth','002_owners','003_patients','004_consultations'] as $migration) {
        $sql=file_get_contents(__DIR__.'/../database/mariadb/'.$migration.'.sql');
        if ($sql===false) throw new RuntimeException('MIGRATION_MISSING');
        $sql=str_replace("\r\n","\n",$sql);
        $checksum=hash('sha256',$sql);
        $q=$db->prepare('SELECT checksum FROM vc_schema_migrations WHERE version=?');$q->execute([$migration]);$previous=$q->fetchColumn();
        if ($previous!==false && !hash_equals($previous,$checksum)) throw new RuntimeException('MIGRATION_CHANGED');
        if ($previous===false) {
            // MariaDB confirma DDL automáticamente. Sentencias idempotentes para reintentar una interrupción.
            foreach (explode(';',$sql) as $statement) if (trim($statement)!=='') $db->exec($statement);
            $db->prepare('INSERT INTO vc_schema_migrations VALUES(?,?,?)')->execute([$migration,$checksum,time()]);
        }
        echo "Migración preparada: ".$migration."\n";
        }
    } elseif (($argv[1] ?? '')==='create-admin') {
        $data=json_decode(stream_get_contents(STDIN),true,8,JSON_THROW_ON_ERROR);
        $db->beginTransaction();
        if ((int)$db->query('SELECT COUNT(*) FROM vc_auth_users')->fetchColumn()!==0) throw new RuntimeException('ALREADY_INITIALIZED');
        $data['role']='administrador';\VetCare\createUser($db,$data);$db->commit();
        echo "Primer administrador creado. Ya puedes iniciar sesión.\n";
    } else throw new RuntimeException('INVALID_COMMAND');
} catch (Throwable $error) {
    if ($db && $db->inTransaction()) $db->rollBack();
    $messages=['ALREADY_INITIALIZED'=>'Ya existen cuentas. Utiliza la administración de usuarios.', 'MIGRATION_CHANGED'=>'La migración aplicada cambió. No se ejecutaron modificaciones.', 'INVALID_PASSWORD'=>'La contraseña debe tener entre 12 y 72 bytes.', 'INVALID_USER'=>'Revisa el usuario y nombre.'];
    fwrite(STDERR,($messages[$error->getMessage()] ?? 'No se pudo preparar el acceso. Comprueba db:check y ejecuta db:migrate antes de crear el administrador.')."\n");
    exit(1);
} finally { if ($db) $db->query("SELECT RELEASE_LOCK('vetcare_auth_admin')"); }
