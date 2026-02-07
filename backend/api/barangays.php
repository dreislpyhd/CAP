<?php
// Disable error display for API
error_reporting(0);
ini_set('display_errors', 0);

// Set CORS headers
header("Access-Control-Allow-Origin: http://localhost:5173");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Accept, Cache, Pragma");
header("Access-Control-Allow-Credentials: true");
header('Content-Type: application/json');

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Check if config file exists
if (!file_exists('../config/db_connection.php')) {
    http_response_code(500);
    echo json_encode(["success" => false, "error" => "Database config not found"]);
    exit();
}

require_once '../config/db_connection.php';

// Only allow GET requests
if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    echo json_encode(["success" => false, "error" => "Method not allowed"]);
    exit();
}

try {
    // Create database connection
    $database = new Database();
    $conn = $database->getConnection();
    
    if (!$conn) {
        throw new Exception("Database connection failed");
    }
    
    // Get all unique barangays from users table (excluding admin users)
    $stmt = $conn->prepare("SELECT DISTINCT barangay FROM users WHERE barangay IS NOT NULL AND barangay != '' AND email != 'drrma36@gmail.com' ORDER BY barangay");
    
    if (!$stmt) {
        throw new Exception("Query preparation failed");
    }
    
    $stmt->execute();
    
    $barangays = $stmt->fetchAll(PDO::FETCH_COLUMN);
    
    echo json_encode([
        "success" => true, 
        "barangays" => $barangays ? $barangays : []
    ]);
    
} catch(Exception $e) {
    http_response_code(500);
    echo json_encode(["success" => false, "error" => "Server error"]);
}
?>
