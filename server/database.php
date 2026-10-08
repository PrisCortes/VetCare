<?php
declare(strict_types=1);

namespace VetCare;

use PDO;
use Pdo\Mysql;
use RuntimeException;

/** No abre conexiones ni acepta fragmentos de DSN del cliente. */
function databaseConfiguration(): array {
    $host = getenv('DB_HOST') ?: '';
    $name = getenv('DB_NAME') ?: '';
    $user = getenv('DB_USER') ?: '';
    $password = getenv('DB_PASSWORD');
    if ($host === '' && $name === '' && $user === '' && ($password === false || $password === '')) {
        throw new RuntimeException('DB_NOT_CONFIGURED');
    }
    if (!preg_match('/\A[a-zA-Z0-9.-]+\z/D', $host)
        || !preg_match('/\A[a-zA-Z0-9_]+\z/D', $name)
        || $user === '' || $password === false || $password === '') {
        throw new RuntimeException('DB_INVALID_CONFIGURATION');
    }
    $port = getenv('DB_PORT');
    $port = $port === false || $port === '' ? '3306' : $port;
    if (!ctype_digit($port) || (int)$port < 1 || (int)$port > 65535) {
        throw new RuntimeException('DB_INVALID_CONFIGURATION');
    }
    $ca = getenv('DB_SSL_CA') ?: '';
    $handle = $ca !== '' && is_file($ca) ? @fopen($ca, 'rb') : false;
    if ($handle === false) {
        throw new RuntimeException('DB_CA_REQUIRED');
    }
    fclose($handle);
    return [
        'dsn' => "mysql:host={$host};port={$port};dbname={$name};charset=utf8mb4",
        'user' => $user, 'password' => $password, 'ca' => $ca,
    ];
}

function centralDatabase(): PDO {
    $started=hrtime(true);
    $config = databaseConfiguration();
    $connection = new PDO($config['dsn'], $config['user'], $config['password'], [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES => false,
        PDO::ATTR_PERSISTENT => false,
        PDO::ATTR_TIMEOUT => 5,
        Mysql::ATTR_LOCAL_INFILE => false,
        Mysql::ATTR_MULTI_STATEMENTS => false,
        Mysql::ATTR_SSL_CA => $config['ca'],
        Mysql::ATTR_SSL_VERIFY_SERVER_CERT => true,
    ]);
    $tls = $connection->query("SHOW SESSION STATUS LIKE 'Ssl_cipher'")->fetch();
    if (!is_array($tls) || empty($tls['Value'])) {
        throw new RuntimeException('DB_TLS_REQUIRED');
    }
    $connection->exec("SET time_zone = '+00:00'");
    if(PHP_SAPI!=='cli'&&!headers_sent())header('Server-Timing: database;dur='.round((hrtime(true)-$started)/1e6,1),false);
    return $connection;
}

/** Diagnóstico administrativo: no publica host, usuario, contraseña o error PDO. */
function checkCentralDatabase(): array {
    try {
        $connection = centralDatabase();
        if ((int)$connection->query('SELECT 1')->fetchColumn() !== 1) {
            throw new RuntimeException('DB_QUERY_FAILED');
        }
        return ['status' => 'available', 'code' => 'DB_OK', 'tls' => true];
    } catch (\Throwable $error) {
        $allowed = ['DB_NOT_CONFIGURED', 'DB_INVALID_CONFIGURATION', 'DB_CA_REQUIRED', 'DB_TLS_REQUIRED'];
        return ['status' => 'unavailable', 'code' => in_array($error->getMessage(), $allowed, true)
            ? $error->getMessage() : 'DB_CONNECTION_FAILED'];
    }
}
