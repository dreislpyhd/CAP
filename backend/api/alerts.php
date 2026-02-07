<?php
header('Content-Type: application/json');
$allowed_origins = ['http://localhost:5173', 'https://disaster.goserveph.com'];
$origin = isset($_SERVER['HTTP_ORIGIN']) ? $_SERVER['HTTP_ORIGIN'] : '';
if (in_array($origin, $allowed_origins)) {
    header("Access-Control-Allow-Origin: " . $origin);
}
header('Access-Control-Allow-Methods: POST, GET, OPTIONS, PUT, DELETE');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Access-Control-Allow-Credentials: true');

// Handle preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

// Session guard: start and enforce inactivity timeout
require_once __DIR__ . '/../utils/session_guard.php';

// Database configuration
$servername = "localhost";
$username = "root";
$password = "";
$dbname = "gsm_db";

try {
    $conn = new PDO("mysql:host=$servername;dbname=$dbname", $username, $password);
    $conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
} catch(PDOException $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Database connection failed: ' . $e->getMessage()]);
    exit;
}

try {
    $method = $_SERVER['REQUEST_METHOD'];
    
    switch ($method) {
        case 'POST':
            // Create new alert
            createAlert();
            break;
        case 'GET':
            // Get alerts (for admin) or user-specific alerts
            if (isset($_GET['user_id'])) {
                getUserAlerts();
            } else {
                getAllAlerts();
            }
            break;
        case 'PUT':
            // Update alert
            updateAlert();
            break;
        case 'DELETE':
            // Delete alert
            deleteAlert();
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

function createAlert() {
    global $conn;
    
    $data = json_decode(file_get_contents('php://input'), true);
    
    if (!isset($data['name']) || !isset($data['type']) || !isset($data['level'])) {
        http_response_code(400);
        echo json_encode(['error' => 'Missing required fields: name, type, level']);
        return;
    }
    
    try {
        $conn->beginTransaction();
        
        // Insert alert
        $stmt = $conn->prepare("
            INSERT INTO alerts (name, description, type, level) 
            VALUES (?, ?, ?, ?)
        ");
        $stmt->execute([$data['name'], $data['description'] ?? '', $data['type'], $data['level']]);
        $alertId = $conn->lastInsertId();
        
        // Insert barangay assignments if provided
        if (isset($data['barangays']) && is_array($data['barangays'])) {
            $stmt = $conn->prepare("
                INSERT INTO alert_barangays (alert_id, barangay_name) 
                VALUES (?, ?)
            ");
            foreach ($data['barangays'] as $barangay) {
                $stmt->execute([$alertId, $barangay]);
            }
        }
        
        $conn->commit();
        
        echo json_encode([
            'success' => true,
            'message' => 'Alert created successfully',
            'alert_id' => $alertId
        ]);
        
    } catch (PDOException $e) {
        $conn->rollback();
        http_response_code(500);
        echo json_encode(['error' => 'Database error: ' . $e->getMessage()]);
    }
}

function getAllAlerts() {
    global $conn;
    
    try {
        $stmt = $conn->prepare("
            SELECT a.*, 
                   GROUP_CONCAT(ab.barangay_name) as barangays
            FROM alerts a
            LEFT JOIN alert_barangays ab ON a.id = ab.alert_id
            GROUP BY a.id
            ORDER BY a.created_at DESC
        ");
        $stmt->execute();
        $alerts = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        // Format barangays as array
        foreach ($alerts as &$alert) {
            $alert['barangays'] = $alert['barangays'] ? explode(',', $alert['barangays']) : [];
        }
        
        echo json_encode(['success' => true, 'alerts' => $alerts]);
        
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(['error' => 'Database error: ' . $e->getMessage()]);
    }
}

function getUserAlerts() {
    global $conn;
    
    $userId = $_GET['user_id'];
    
    if (!isset($userId)) {
        http_response_code(400);
        echo json_encode(['error' => 'User ID is required']);
        return;
    }
    
    try {
        // Get user's barangay from users table
        $stmt = $conn->prepare("
            SELECT id, barangay FROM users WHERE id = ?
        ");
        $stmt->execute([$userId]);
        $user = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$user || !$user['barangay']) {
            echo json_encode(['success' => true, 'alerts' => [], 'debug' => 'No user or no barangay found']);
            return;
        }
        
        $userBarangay = $user['barangay'];
        
        // Get alerts specifically sent to user's barangay using alert_barangays table
        $stmt = $conn->prepare("
            SELECT a.*, 
                   ab.barangay_name,
                   ars.is_read,
                   ars.read_at
            FROM alerts a
            INNER JOIN alert_barangays ab ON a.id = ab.alert_id
            LEFT JOIN alert_read_status ars ON a.id = ars.alert_id AND ars.user_id = ?
            WHERE ab.barangay_name LIKE ? OR ab.barangay_name = ?
            ORDER BY a.created_at DESC
        ");
        
        $barangayPattern = '%' . $userBarangay . '%';
        $stmt->execute([$userId, $barangayPattern, $userBarangay]);
        $alerts = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        // Format data - group barangays for each alert
        $formattedAlerts = [];
        foreach ($alerts as $row) {
            $alertId = $row['id'];
            
            if (!isset($formattedAlerts[$alertId])) {
                $formattedAlerts[$alertId] = [
                    'id' => $row['id'],
                    'name' => $row['name'],
                    'description' => $row['description'],
                    'type' => $row['type'],
                    'level' => $row['level'],
                    'status' => $row['status'],
                    'created_at' => $row['created_at'],
                    'updated_at' => $row['updated_at'],
                    'barangays' => [],
                    'is_read' => (bool) $row['is_read'],
                    'read_at' => $row['read_at']
                ];
            }
            
            // Add barangay if not already in the list
            if (!in_array($row['barangay_name'], $formattedAlerts[$alertId]['barangays'])) {
                $formattedAlerts[$alertId]['barangays'][] = $row['barangay_name'];
            }
        }
        
        // Convert to indexed array
        $alerts = array_values($formattedAlerts);
        
        echo json_encode([
            'success' => true, 
            'alerts' => $alerts,
            'debug' => [
                'user_id' => $userId,
                'user_barangay' => $userBarangay,
                'total_alerts_found' => count($alerts)
            ]
        ]);
        
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(['error' => 'Database error: ' . $e->getMessage()]);
    }
}

function updateAlert() {
    global $conn;
    
    $data = json_decode(file_get_contents('php://input'), true);
    
    // Debug logging
    error_log("Update Alert Data: " . print_r($data, true));
    
    if (!isset($data['id'])) {
        http_response_code(400);
        echo json_encode(['error' => 'Alert ID is required']);
        return;
    }
    
    try {
        $conn->beginTransaction();
        
        // Update alert (keep status as draft unless explicitly sending)
        $status = isset($data['status']) ? $data['status'] : 'draft';
        $stmt = $conn->prepare("
            UPDATE alerts 
            SET name = ?, description = ?, type = ?, level = ?, status = ?
            WHERE id = ?
        ");
        $stmt->execute([$data['name'], $data['description'] ?? '', $data['type'], $data['level'], $status, $data['id']]);
        
        // Update barangay assignments if provided
        if (isset($data['barangays']) && is_array($data['barangays'])) {
            error_log("Updating barangays: " . print_r($data['barangays'], true));
            
            // Delete existing barangay assignments
            $stmt = $conn->prepare("DELETE FROM alert_barangays WHERE alert_id = ?");
            $stmt->execute([$data['id']]);
            
            // Insert new barangay assignments
            $stmt = $conn->prepare("
                INSERT INTO alert_barangays (alert_id, barangay_name) 
                VALUES (?, ?)
            ");
            foreach ($data['barangays'] as $barangay) {
                $stmt->execute([$data['id'], $barangay]);
                error_log("Inserted barangay: " . $barangay . " for alert: " . $data['id']);
            }
        } else {
            error_log("No barangays provided in update");
        }
        
        $conn->commit();
        
        echo json_encode(['success' => true, 'message' => 'Alert updated successfully']);
        
    } catch (PDOException $e) {
        $conn->rollback();
        error_log("Update Alert Error: " . $e->getMessage());
        http_response_code(500);
        echo json_encode(['error' => 'Database error: ' . $e->getMessage()]);
    }
}

function deleteAlert() {
    global $conn;
    
    $alertId = $_GET['id'];
    
    if (!isset($alertId)) {
        http_response_code(400);
        echo json_encode(['error' => 'Alert ID is required']);
        return;
    }
    
    try {
        $stmt = $conn->prepare("DELETE FROM alerts WHERE id = ?");
        $stmt->execute([$alertId]);
        
        if ($stmt->rowCount() > 0) {
            echo json_encode(['success' => true, 'message' => 'Alert deleted successfully']);
        } else {
            http_response_code(404);
            echo json_encode(['error' => 'Alert not found']);
        }
        
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(['error' => 'Database error: ' . $e->getMessage()]);
    }
}
?>
