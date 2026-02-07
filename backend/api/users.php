<?php
// Enable error reporting for development
error_reporting(E_ALL);
ini_set('display_errors', 1);

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

require_once '../config/db_connection.php';

// Create database connection
$database = new Database();
$conn = $database->getConnection();

// Handle different request methods
$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    // GET: Fetch all users
    try {
        // Prepare and execute query to get all users
        $stmt = $conn->prepare("SELECT id, full_name, email, contact_number, barangay, address, created_at, updated_at FROM users ORDER BY created_at DESC");
        $stmt->execute();
        
        $users = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        // Format the response
        echo json_encode([
            "status" => "success",
            "message" => "Users retrieved successfully",
            "data" => $users,
            "count" => count($users)
        ]);
        
    } catch(PDOException $e) {
        http_response_code(500);
        echo json_encode([
            "status" => "error", 
            "message" => "Database error: " . $e->getMessage()
        ]);
    }
} elseif ($method === 'DELETE') {
    // DELETE: Remove a user
    $userId = $_GET['id'] ?? null;
    
    if (!$userId) {
        http_response_code(400);
        echo json_encode(["status" => "error", "message" => "User ID is required"]);
        exit();
    }
    
    try {
        // First check if user exists
        $stmt = $conn->prepare("SELECT id, full_name FROM users WHERE id = ?");
        $stmt->execute([$userId]);
        
        if ($stmt->rowCount() === 0) {
            http_response_code(404);
            echo json_encode(["status" => "error", "message" => "User not found"]);
            exit();
        }
        
        // Delete the user
        $stmt = $conn->prepare("DELETE FROM users WHERE id = ?");
        $stmt->execute([$userId]);
        
        echo json_encode([
            "status" => "success", 
            "message" => "User deleted successfully"
        ]);
        
    } catch(PDOException $e) {
        http_response_code(500);
        echo json_encode([
            "status" => "error", 
            "message" => "Database error: " . $e->getMessage()
        ]);
    }
} else {
    // Method not allowed
    http_response_code(405);
    echo json_encode(["status" => "error", "message" => "Method not allowed"]);
}
?>
