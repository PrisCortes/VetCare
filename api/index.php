<?php
declare(strict_types=1);
require (getenv('VETCARE_SERVER_ROOT') ?: __DIR__ . '/../server') . '/bootstrap.php';

$path = parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH);
if (in_array($path, ['/api/v1/auth/login','/api/v1/auth/session','/api/v1/auth/logout','/api/v1/admin/users','/api/v1/access','/api/v1/owners','/api/v1/patients','/api/v1/attention/validate','/api/v1/consultations','/api/v1/sanitary-events','/api/v1/sync/push','/api/v1/history','/api/v1/carnet','/api/v1/consultation-versions','/api/v1/offline/bootstrap'], true)) {
    require (getenv('VETCARE_SERVER_ROOT') ?: __DIR__ . '/../server') . '/auth-routes.php';
    authRoute($path, $_SERVER['REQUEST_METHOD'] ?? 'GET');
}
if ($path !== '/api/v1/health') {
    respond(404, ['error' => ['code' => 'NOT_FOUND', 'message' => 'Ruta no encontrada.']]);
}
if (($_SERVER['REQUEST_METHOD'] ?? 'GET') !== 'GET') {
    header('Allow: GET');
    respond(405, ['error' => ['code' => 'METHOD_NOT_ALLOWED', 'message' => 'Método no permitido.']]);
}
respond(200, ['service' => 'vetcare-api', 'status' => 'ok', 'database' => 'not_checked']);
