<?php
declare(strict_types=1);
namespace VetCare;
use PDO;
use RuntimeException;

final class AccessError extends RuntimeException {
    public function __construct(public readonly int $status, public readonly string $reason) { parent::__construct($reason); }
}
function failAccess(int $status, string $reason): never { throw new AccessError($status, $reason); }
function username(mixed $value): string {
    if (!is_string($value) || !preg_match('/\A[a-zA-Z0-9_.-]{3,80}\z/D', $value)) failAccess(422, 'INVALID_USER');
    return strtolower($value);
}
function passwordHash(mixed $password): string {
    // Límite en bytes compatible con bcrypt cuando Argon2id no está disponible.
    if (!is_string($password) || strlen($password) < 12 || strlen($password) > 72 || str_contains($password, "\0")) failAccess(422, 'INVALID_PASSWORD');
    return password_hash($password, defined('PASSWORD_ARGON2ID') ? PASSWORD_ARGON2ID : PASSWORD_DEFAULT);
}
function userFields(array $data): array {
    $login = username($data['username'] ?? null);
    $name = $data['name'] ?? null;
    $role = $data['role'] ?? null;
    if (!is_string($name) || trim($name) === '' || mb_strlen($name) > 160 || !in_array($role, ['administrador','veterinario'], true)) failAccess(422, 'INVALID_USER');
    return [$login, trim($name), $role, passwordHash($data['password'] ?? null)];
}
function audit(PDO $db, ?string $actor, string $event, ?string $subject = null): void {
    $db->prepare('INSERT INTO vc_auth_audit(actor_id,event,subject_id,created_at) VALUES(?,?,?,?)')->execute([$actor,$event,$subject,time()]);
}
function publicUser(array $user): array {
    return ['id'=>$user['id'], 'username'=>$user['username'], 'name'=>$user['name'], 'role'=>$user['role'], 'active'=>(bool)$user['active']];
}
function permitted(string $role, string $permission): bool {
    return match($permission) {
        'clinical.read', 'clinical.write' => in_array($role, ['administrador','veterinario'], true),
        'users.manage' => $role === 'administrador',
        default => false,
    };
}
function requirePermission(array $session, string $permission): void {
    if (!permitted($session['role'], $permission)) failAccess(403, 'FORBIDDEN');
}
function sessionValid(array $session, int $now): bool {
    return (bool)$session['active'] && $now < (int)$session['expires_at'] && $now - (int)$session['last_seen'] < 1800;
}
function authenticated(PDO $db, string $token, bool $touch = true): array {
    if (!preg_match('/\A[a-f0-9]{64}\z/D', $token)) failAccess(401,'UNAUTHENTICATED');
    $query = $db->prepare('SELECT u.id,u.username,u.name,u.role,u.active,s.token_hash,s.csrf,s.created_at AS authenticated_at,s.last_seen,s.expires_at FROM vc_auth_sessions s JOIN vc_auth_users u ON u.id=s.user_id WHERE s.token_hash=?');
    $query->execute([hash('sha256',$token)]);
    $session = $query->fetch();
    if (!$session || !sessionValid($session,time())) failAccess(401,'UNAUTHENTICATED');
    if ($touch && time()-(int)$session['last_seen']>=60) $db->prepare('UPDATE vc_auth_sessions SET last_seen=? WHERE token_hash=?')->execute([time(),$session['token_hash']]);
    return $session;
}
function requireCsrf(array $session, string $provided): void {
    if ($provided === '' || !hash_equals($session['csrf'],$provided)) failAccess(403,'CSRF_FAILED');
}
function recentAuthentication(array $session): void {
    if (time() - (int)$session['authenticated_at'] >= 300) failAccess(403,'REAUTHENTICATE');
}
function allowedOrigin(): string {
    $origin = getenv('APP_ORIGIN') ?: '';
    $parts = parse_url($origin);
    $local = is_array($parts) && ($parts['scheme'] ?? '') === 'http' && ($parts['host'] ?? '') === '127.0.0.1';
    if (!$parts || (!$local && ($parts['scheme'] ?? '') !== 'https') || isset($parts['user']) || isset($parts['query']) || isset($parts['fragment']) || (isset($parts['path']) && $parts['path'] !== '')) failAccess(503,'AUTH_CONFIGURATION_REQUIRED');
    return $origin;
}
function requireOrigin(string $provided): void {
    if (!hash_equals(allowedOrigin(),$provided)) failAccess(403,'ORIGIN_REJECTED');
}
function sessionCookie(string $token, bool $clear = false): void {
    $secure = str_starts_with(allowedOrigin(),'https://');
    setcookie('vc_session',$token,['expires'=>$clear ? time()-3600 : 0,'path'=>'/api/v1','secure'=>$secure,'httponly'=>true,'samesite'=>'Strict']);
}
function login(PDO $db, array $data, string $address): array {
    // Entradas inválidas reciben el mismo mensaje que una cuenta desconocida.
    try { $login = username($data['username'] ?? null); } catch (AccessError) { $login = '!invalid'; }
    $password = $data['password'] ?? '';
    if (!is_string($password) || strlen($password)>72 || str_contains($password,"\0")) $password = '';
    $now=time();
    $db->beginTransaction();
    try {
        // Bloqueos persistentes ordenados: cinco intentos por cuenta y 30 por origen/15 min.
        foreach ([['account:'.$login,5],['address:'.$address,30]] as [$key,$max]) {
            $bucket=hash('sha256',$key);
            $db->prepare('INSERT IGNORE INTO vc_auth_limits(bucket,attempts,window_start) VALUES(?,0,?)')->execute([$bucket,$now]);
            $q=$db->prepare('SELECT attempts,window_start FROM vc_auth_limits WHERE bucket=? FOR UPDATE');$q->execute([$bucket]);$limit=$q->fetch();
            if ($now-(int)$limit['window_start']>=900) {
                $db->prepare('UPDATE vc_auth_limits SET attempts=0,window_start=? WHERE bucket=?')->execute([$now,$bucket]);$limit['attempts']=0;
            }
            if ((int)$limit['attempts'] >= $max) { $db->commit(); failAccess(429,'TOO_MANY_ATTEMPTS'); }
            $db->prepare('UPDATE vc_auth_limits SET attempts=attempts+1 WHERE bucket=?')->execute([$bucket]);
        }
        $q=$db->prepare('SELECT * FROM vc_auth_users WHERE username=? FOR UPDATE');$q->execute([$login]);$user=$q->fetch();
        $dummy='$2y$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2uheWG/igi.';
        $valid=password_verify($password,$user['password_hash'] ?? $dummy);
        if (!$user || !$valid || !(bool)$user['active']) {
            audit($db,null,'login_failed');$db->commit();failAccess(401,'INVALID_CREDENTIALS');
        }
        $token=bin2hex(random_bytes(32));$csrf=bin2hex(random_bytes(32));
        // Rotar la sesión enviada al volver a iniciar acceso.
        $old=$_COOKIE['vc_session'] ?? '';
        if (is_string($old)) $db->prepare('DELETE FROM vc_auth_sessions WHERE token_hash=?')->execute([hash('sha256',$old)]);
        $db->prepare('DELETE FROM vc_auth_sessions WHERE expires_at<=?')->execute([$now]);
        $db->prepare('INSERT INTO vc_auth_sessions(token_hash,user_id,csrf,created_at,last_seen,expires_at) VALUES(?,?,?,?,?,?)')->execute([hash('sha256',$token),$user['id'],$csrf,$now,$now,$now+43200]);
        $db->prepare('DELETE FROM vc_auth_limits WHERE bucket=?')->execute([hash('sha256','account:'.$login)]);
        audit($db,$user['id'],'login_success');$db->commit();
        return ['token'=>$token,'csrf'=>$csrf,'user'=>publicUser($user)];
    } catch (\Throwable $e) { if ($db->inTransaction()) $db->rollBack(); throw $e; }
}

function createUser(PDO $db, array $data, ?array $actor = null): array {
    [$login,$name,$role,$hash]=userFields($data);
    if ($actor) { requirePermission($actor,'users.manage'); recentAuthentication($actor); }
    $id=bin2hex(random_bytes(16));
    $q=$db->prepare('SELECT id FROM vc_auth_users WHERE username=?');$q->execute([$login]);
    if ($q->fetch()) failAccess(409,'USERNAME_UNAVAILABLE');
    $db->prepare('INSERT INTO vc_auth_users(id,username,name,password_hash,role,created_at) VALUES(?,?,?,?,?,?)')->execute([$id,$login,$name,$hash,$role,time()]);
    audit($db,$actor['id'] ?? null,'user_created',$id);
    return ['id'=>$id,'username'=>$login,'name'=>$name,'role'=>$role,'active'=>true];
}

function updateUser(PDO $db, array $actor, array $data): void {
    requirePermission($actor,'users.manage');recentAuthentication($actor);
    if (!is_string($data['id'] ?? null) || !in_array($data['role'] ?? '',['administrador','veterinario'],true) || !is_bool($data['active'] ?? null)) failAccess(422,'INVALID_USER');
    // El llamador serializa los cambios administrativos mediante GET_LOCK.
    $q=$db->prepare('SELECT * FROM vc_auth_users WHERE id=? FOR UPDATE');$q->execute([$data['id']]);$target=$q->fetch();
    if (!$target) failAccess(404,'USER_NOT_FOUND');
    if ($target['role']==='administrador' && (bool)$target['active'] && (!$data['active'] || $data['role']!=='administrador')) {
        $count=(int)$db->query("SELECT COUNT(*) FROM vc_auth_users WHERE active=1 AND role='administrador'")->fetchColumn();
        if ($count<=1) failAccess(409,'LAST_ADMINISTRATOR');
    }
    $db->prepare('UPDATE vc_auth_users SET role=?,active=? WHERE id=?')->execute([$data['role'],(int)$data['active'],$data['id']]);
    $db->prepare('DELETE FROM vc_auth_sessions WHERE user_id=?')->execute([$data['id']]);
    audit($db,$actor['id'],'user_updated',$data['id']);
}
