<?php
declare(strict_types=1);
require (getenv('VETCARE_SERVER_ROOT') ?: __DIR__ . '/../server') . '/bootstrap.php';

$path = parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH);
if ($path !== '/api/v1/health') {
    respond(404, ['error' => ['code' => 'NOT_FOUND', 'message' => 'Ruta no encontrada.']]);
}
if (($_SERVER['REQUEST_METHOD'] ?? 'GET') !== 'GET') {
    header('Allow: GET');
    respond(405, ['error' => ['code' => 'METHOD_NOT_ALLOWED', 'message' => 'Método no permitido.']]);
}
respond(200, ['service' => 'vetcare-api', 'status' => 'ok', 'database' => 'not_configured']);
