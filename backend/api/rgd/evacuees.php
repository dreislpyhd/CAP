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

// Session guard: start and enforce inactivity timeout
require_once __DIR__ . '/../../utils/session_guard.php';

// Include database connection
require_once __DIR__ . '/../../config/db_connection.php';

// Create database connection
$database = new Database();
$conn = $database->getConnection();

try {
    $method = $_SERVER['REQUEST_METHOD'];
    
    switch ($method) {
        case 'GET':
            // Fetch all evacuees
            $stmt = $conn->prepare("SELECT * FROM evacuees ORDER BY created_at DESC");
            $stmt->execute();
            $evacuees = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            echo json_encode([
                'success' => true,
                'data' => $evacuees
            ]);
            break;
            
        case 'POST':
            // Add new evacuee
            $json = file_get_contents('php://input');
            $data = json_decode($json, true);
            
            // Validate required fields
            $required_fields = ['name', 'contact', 'address', 'barangay'];
            foreach ($required_fields as $field) {
                if (empty($data[$field])) {
                    throw new Exception("Field '$field' is required");
                }
            }
            
            // Insert new evacuee
            $stmt = $conn->prepare("
                INSERT INTO evacuees (
                    name, age, gender, contact, address, barangay, 
                    family_members, zone, status, evacuation_id, user_id
                ) VALUES (
                    :name, :age, :gender, :contact, :address, :barangay,
                    :family_members, :zone, :status, :evacuation_id, :user_id
                )
            ");
            
            $stmt->execute([
                ':name' => $data['name'],
                ':age' => $data['age'] ?? null,
                ':gender' => $data['gender'] ?? 'Other',
                ':contact' => $data['contact'],
                ':address' => $data['address'],
                ':barangay' => $data['barangay'],
                ':family_members' => $data['family_members'] ?? 1,
                ':zone' => $data['zone'] ?? 'South Caloocan',
                ':status' => $data['status'] ?? 'Pending',
                ':evacuation_id' => $data['evacuation_id'] ?? 1,
                ':user_id' => $data['user_id'] ?? null
            ]);
            
            $new_id = $conn->lastInsertId();
            
            echo json_encode([
                'success' => true,
                'message' => 'Evacuee added successfully',
                'id' => $new_id
            ]);
            break;
            
        case 'PUT':
            // Update evacuee status or details
            $id = $_GET['id'] ?? null;
            if (!$id) {
                throw new Exception('ID is required for updates');
            }
            
            $json = file_get_contents('php://input');
            $data = json_decode($json, true);
            
            // Build dynamic update query
            $update_fields = [];
            $update_values = [];
            
            $allowed_fields = ['name', 'age', 'gender', 'contact', 'address', 'barangay', 
                              'family_members', 'zone', 'status'];
            
            foreach ($allowed_fields as $field) {
                if (isset($data[$field])) {
                    $update_fields[] = "$field = :$field";
                    $update_values[":$field"] = $data[$field];
                }
            }
            
            if (empty($update_fields)) {
                throw new Exception('No valid fields to update');
            }
            
            $update_values[':id'] = $id;
            
            $sql = "UPDATE evacuees SET " . implode(', ', $update_fields) . " WHERE id = :id";
            $stmt = $conn->prepare($sql);
            $stmt->execute($update_values);
            
            echo json_encode([
                'success' => true,
                'message' => 'Evacuee updated successfully'
            ]);
            break;
            
        case 'DELETE':
            // Delete evacuee
            $id = $_GET['id'] ?? null;
            if (!$id) {
                throw new Exception('ID is required for deletion');
            }
            
            $stmt = $conn->prepare("DELETE FROM evacuees WHERE id = :id");
            $stmt->execute([':id' => $id]);
            
            echo json_encode([
                'success' => true,
                'message' => 'Evacuee deleted successfully'
            ]);
            break;
            
        default:
            throw new Exception('Method not allowed');
    }
    
} catch (Exception $e) {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'message' => $e->getMessage()
    ]);
}
?>
