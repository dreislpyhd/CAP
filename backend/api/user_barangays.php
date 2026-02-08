<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

// Handle preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

// Database configuration
require_once __DIR__ . '/../config/db_connection.php';

try {
    $database = new Database();
    $conn = $database->getConnection();
    
    if (!$conn) {
        throw new Exception('Database connection failed');
    }
} catch(Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Database connection failed: ' . $e->getMessage()]);
    exit;
}

try {
    $method = $_SERVER['REQUEST_METHOD'];
    
    switch ($method) {
        case 'POST':
            // Assign user to barangay
            assignUserToBarangay();
            break;
        case 'GET':
            // Get user's barangays
            if (isset($_GET['user_id'])) {
                getUserBarangays();
            } else {
                http_response_code(400);
                echo json_encode(['error' => 'User ID is required']);
            }
            break;
        case 'DELETE':
            // Remove user from barangay
            removeUserFromBarangay();
            break;
        default:
            http_response_code(405);
            echo json_encode(['error' => 'Method not allowed']);
            break;
    }
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Server error: ' . $e->getMessage()]);
}

function assignUserToBarangay() {
    global $conn;
    
    $data = json_decode(file_get_contents('php://input'), true);
    
    if (!isset($data['user_id']) || !isset($data['barangay_name'])) {
        http_response_code(400);
        echo json_encode(['error' => 'Missing required fields: user_id, barangay_name']);
        return;
    }
    
    try {
        $stmt = $conn->prepare("
            INSERT IGNORE INTO user_barangays (user_id, barangay_name) 
            VALUES (?, ?)
        ");
        $stmt->execute([$data['user_id'], $data['barangay_name']]);
        
        if ($stmt->rowCount() > 0) {
            echo json_encode(['success' => true, 'message' => 'User assigned to barangay successfully']);
        } else {
            echo json_encode(['success' => true, 'message' => 'User already assigned to this barangay']);
        }
        
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(['error' => 'Database error: ' . $e->getMessage()]);
    }
}

function getUserBarangays() {
    global $conn;
    
    $userId = $_GET['user_id'];
    
    try {
        $stmt = $conn->prepare("
            SELECT barangay_name FROM user_barangays WHERE user_id = ?
        ");
        $stmt->execute([$userId]);
        $barangays = $stmt->fetchAll(PDO::FETCH_COLUMN);
        
        echo json_encode(['success' => true, 'barangays' => $barangays]);
        
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(['error' => 'Database error: ' . $e->getMessage()]);
    }
}

function removeUserFromBarangay() {
    global $conn;
    
    $userId = $_GET['user_id'];
    $barangayName = $_GET['barangay_name'];
    
    if (!isset($userId) || !isset($barangayName)) {
        http_response_code(400);
        echo json_encode(['error' => 'User ID and barangay name are required']);
        return;
    }
    
    try {
        $stmt = $conn->prepare("
            DELETE FROM user_barangays 
            WHERE user_id = ? AND barangay_name = ?
        ");
        $stmt->execute([$userId, $barangayName]);
        
        if ($stmt->rowCount() > 0) {
            echo json_encode(['success' => true, 'message' => 'User removed from barangay successfully']);
        } else {
            http_response_code(404);
            echo json_encode(['error' => 'Assignment not found']);
        }
        
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(['error' => 'Database error: ' . $e->getMessage()]);
    }
}
?>
