<?php
// Diagnostic script to check what's wrong with alerts.php
error_reporting(E_ALL);
ini_set('display_errors', 1);

echo "<h2>Diagnostic Check</h2>";

// 1. Check if vendor/autoload.php exists
echo "<h3>1. Vendor Autoload Check</h3>";
$autoloadPath = __DIR__ . '/../vendor/autoload.php';
echo "Path: " . $autoloadPath . "<br>";
echo "Exists: " . (file_exists($autoloadPath) ? "YES" : "NO") . "<br>";
echo "Readable: " . (is_readable($autoloadPath) ? "YES" : "NO") . "<br><br>";

// 2. Check if session_guard.php exists
echo "<h3>2. Session Guard Check</h3>";
$sessionGuardPath = __DIR__ . '/../utils/session_guard.php';
echo "Path: " . $sessionGuardPath . "<br>";
echo "Exists: " . (file_exists($sessionGuardPath) ? "YES" : "NO") . "<br>";
echo "Readable: " . (is_readable($sessionGuardPath) ? "YES" : "NO") . "<br><br>";

// 3. Try to include session_guard.php
echo "<h3>3. Include Session Guard</h3>";
try {
    require_once __DIR__ . '/../utils/session_guard.php';
    echo "✓ Session guard loaded successfully<br><br>";
} catch (Exception $e) {
    echo "✗ Error: " . $e->getMessage() . "<br><br>";
}

// 4. Try database connection
echo "<h3>4. Database Connection Check</h3>";
$servername = "localhost";
$username = "root";
$password = "";
$dbname = "gsm_db";

try {
    $conn = new PDO("mysql:host=$servername;dbname=$dbname", $username, $password);
    $conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    echo "✓ Database connection successful<br>";
    echo "Database: $dbname<br><br>";
} catch(PDOException $e) {
    echo "✗ Database connection failed: " . $e->getMessage() . "<br><br>";
}

// 5. Check PHP version
echo "<h3>5. PHP Environment</h3>";
echo "PHP Version: " . phpversion() . "<br>";
echo "Session Status: " . (session_status() === PHP_SESSION_ACTIVE ? "Active" : "Inactive") . "<br>";

echo "<h3>Done!</h3>";
?>
