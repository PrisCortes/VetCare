<?php
declare(strict_types=1);
ini_set('display_errors', '0');
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');
header('X-Content-Type-Options: nosniff');
set_exception_handler(static function (Throwable $error): void {
    error_log('VetCare: error interno en API.');
    respond(500, ['error' => ['code' => 'INTERNAL_ERROR', 'message' => 'No se pudo completar la solicitud.']]);
});
function respond(int $status, array $body): never {
    http_response_code($status);
    echo json_encode($body, JSON_UNESCAPED_UNICODE | JSON_THROW_ON_ERROR);
    exit;
}
