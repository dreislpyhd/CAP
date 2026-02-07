<?php
require_once __DIR__ . '/config/db_connection.php';
try {
    $db = new Database();
    $conn = $db->getConnection();
    if ($conn) {
        echo "Database connection successful!\n";
        echo "Host: " . $_ENV['DB_HOST'] . "\n";
        echo "Database: " . $_ENV['DB_NAME'] . "\n";
    } else {
        echo "Database connection failed.\n";
    }
} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
