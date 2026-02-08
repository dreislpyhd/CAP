<?php
// Test if PHPMailer can be loaded
error_reporting(E_ALL);
ini_set('display_errors', 1);

use PHPMailer\PHPMailer\PHPMailer;

echo "Testing PHPMailer autoload...\n\n";

// Check if vendor directory exists
$vendorPath = __DIR__ . '/../vendor';
echo "Vendor path: " . realpath($vendorPath) . "\n";
echo "Vendor exists: " . (file_exists($vendorPath) ? 'YES' : 'NO') . "\n\n";

// Check if autoload exists
$autoloadPath = $vendorPath . '/autoload.php';
echo "Autoload path: " . realpath($autoloadPath) . "\n";
echo "Autoload exists: " . (file_exists($autoloadPath) ? 'YES' : 'NO') . "\n\n";

// Try to require autoload
try {
    require_once $autoloadPath;
    echo "✓ Autoload loaded successfully\n\n";
} catch (Exception $e) {
    echo "✗ Autoload failed: " . $e->getMessage() . "\n\n";
    exit(1);
}

// Try to use PHPMailer
try {
    $mail = new PHPMailer(true);
    echo "✓ PHPMailer class loaded successfully!\n";
    echo "PHPMailer version: " . PHPMailer::VERSION . "\n";
} catch (Exception $e) {
    echo "✗ PHPMailer failed: " . $e->getMessage() . "\n";
    exit(1);
}
?>
