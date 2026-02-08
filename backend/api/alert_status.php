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
            // Mark alert as read
            markAlertAsRead();
            break;
        case 'GET':
            // Get user's unread alert count
            if (isset($_GET['action']) && $_GET['action'] === 'count') {
                getUnreadCount();
            } else {
                http_response_code(400);
                echo json_encode(['error' => 'Invalid action']);
            }
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

function markAlertAsRead() {
    global $conn;
    
    $data = json_decode(file_get_contents('php://input'), true);
    
    if (!isset($data['user_id']) || !isset($data['alert_id'])) {
        http_response_code(400);
        echo json_encode(['error' => 'Missing required fields: user_id, alert_id']);
        return;
    }
    
    try {
        // Check if record exists
        $stmt = $conn->prepare("
            SELECT id FROM alert_read_status 
            WHERE user_id = ? AND alert_id = ?
        ");
        $stmt->execute([$data['user_id'], $data['alert_id']]);
        $existing = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if ($existing) {
            // Update existing record
            $stmt = $conn->prepare("
                UPDATE alert_read_status 
                SET is_read = TRUE, read_at = CURRENT_TIMESTAMP 
                WHERE user_id = ? AND alert_id = ?
            ");
            $stmt->execute([$data['user_id'], $data['alert_id']]);
        } else {
            // Insert new record
            $stmt = $conn->prepare("
                INSERT INTO alert_read_status (user_id, alert_id, is_read, read_at) 
                VALUES (?, ?, TRUE, CURRENT_TIMESTAMP)
            ");
            $stmt->execute([$data['user_id'], $data['alert_id']]);
        }
        
        echo json_encode(['success' => true, 'message' => 'Alert marked as read']);
        
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(['error' => 'Database error: ' . $e->getMessage()]);
    }
}

function getUnreadCount() {
    global $conn;
    
    $userId = $_GET['user_id'];
    
    if (!isset($userId)) {
        http_response_code(400);
        echo json_encode(['error' => 'User ID is required']);
        return;
    }
    
    try {
        // Get user's barangays
        $stmt = $conn->prepare("
            SELECT barangay_name FROM user_barangays WHERE user_id = ?
        ");
        $stmt->execute([$userId]);
        $userBarangays = $stmt->fetchAll(PDO::FETCH_COLUMN);
        
        if (empty($userBarangays)) {
            echo json_encode(['success' => true, 'unread_count' => 0]);
            return;
        }
        
        // Get unread alerts count for user's barangays
        $placeholders = str_repeat('?,', count($userBarangays) - 1) . '?';
        $stmt = $conn->prepare("
            SELECT COUNT(DISTINCT a.id) as unread_count
            FROM alerts a
            INNER JOIN alert_barangays ab ON a.id = ab.alert_id
            LEFT JOIN alert_read_status ars ON a.id = ars.alert_id AND ars.user_id = ?
            WHERE ab.barangay_name IN ($placeholders)
            AND (ars.is_read IS NULL OR ars.is_read = FALSE)
        ");
        
        $params = array_merge([$userId], $userBarangays);
        $stmt->execute($params);
        $result = $stmt->fetch(PDO::FETCH_ASSOC);
        
        echo json_encode(['success' => true, 'unread_count' => (int)$result['unread_count']]);
        
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(['error' => 'Database error: ' . $e->getMessage()]);
    }
}
?>
