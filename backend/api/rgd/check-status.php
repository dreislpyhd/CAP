<?php
// Enable error reporting for development
error_reporting(E_ALL);
ini_set('display_errors', 1);

// Set CORS headers
$allowed_origins = ['http://localhost:5173', 'https://disaster.goserveph.com'];
$origin = isset($_SERVER['HTTP_ORIGIN']) ? $_SERVER['HTTP_ORIGIN'] : '';
if (in_array($origin, $allowed_origins)) {
    header("Access-Control-Allow-Origin: " . $origin);
}
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Accept, Cache, Pragma");
header("Access-Control-Allow-Credentials: true");
header('Content-Type: application/json');

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Include database connection
require_once __DIR__ . '/../../config/db_connection.php';

// Create database connection
$database = new Database();
$conn = $database->getConnection();

try {
    if ($_SERVER['REQUEST_METHOD'] === 'GET') {
        // Get contact number from query parameter
        $contact = $_GET['contact'] ?? null;
        
        if (!$contact) {
            echo json_encode([
                'success' => false,
                'message' => 'Contact number is required'
            ]);
            exit();
        }
        
        // Query the database for the latest application status
        $stmt = $conn->prepare("
            SELECT status, updated_at 
            FROM evacuees 
            WHERE contact = :contact 
            ORDER BY created_at DESC 
            LIMIT 1
        ");
        
        $stmt->execute([':contact' => $contact]);
        $result = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if ($result) {
            echo json_encode([
                'success' => true,
                'status' => $result['status'],
                'updated_at' => $result['updated_at']
            ]);
        } else {
            echo json_encode([
                'success' => false,
                'message' => 'No application found for this contact number'
            ]);
        }
    }
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage()
    ]);
}
?>
