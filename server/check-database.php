<?php
declare(strict_types=1);
if (PHP_SAPI !== 'cli') {
    http_response_code(404);
    exit;
}
ini_set('display_errors', '0');
require __DIR__ . '/database.php';
$result = \VetCare\checkCentralDatabase();
echo json_encode($result, JSON_UNESCAPED_UNICODE | JSON_THROW_ON_ERROR) . PHP_EOL;
exit($result['status'] === 'available' ? 0 : 1);
