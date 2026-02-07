<?php
header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE");
header("Access-Control-Allow-Headers: Content-Type");

include_once __DIR__ . '/../../config/db_connection.php';

$database = new Database();
$conn = $database->getConnection();

$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {
    case 'GET':
        getHazards();
        break;
    case 'POST':
        createHazard();
        break;
    case 'PUT':
        updateHazard();
        break;
    case 'DELETE':
        deleteHazard();
        break;
    default:
        echo json_encode(['success' => false, 'message' => 'Invalid request method']);
        break;
}

function getHazards() {
    global $conn;
    
    try {
        $sql = "SELECT id, lat, lng, category, severity, notes, created_at FROM hazards ORDER BY created_at DESC";
        $stmt = $conn->query($sql);
        
        $hazards = [];
        if ($stmt->rowCount() > 0) {
            while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
                $hazards[] = $row;
            }
        }
        
        echo json_encode($hazards);
    } catch (Exception $e) {
        echo json_encode(['success' => false, 'message' => $e->getMessage()]);
    }
}

function createHazard() {
    global $conn;
    
    try {
        $data = json_decode(file_get_contents('php://input'), true);
        
        $lat = $data['lat'];
        $lng = $data['lng'];
        $category = $data['category'];
        $severity = $data['severity'];
        $notes = isset($data['notes']) ? $data['notes'] : '';
        
        $sql = "INSERT INTO hazards (lat, lng, category, severity, notes, created_at) VALUES (?, ?, ?, ?, ?, NOW())";
        $stmt = $conn->prepare($sql);
        $stmt->bindValue(1, $lat);
        $stmt->bindValue(2, $lng);
        $stmt->bindValue(3, $category);
        $stmt->bindValue(4, $severity);
        $stmt->bindValue(5, $notes);
        
        if ($stmt->execute()) {
            echo json_encode(['success' => true, 'message' => 'Hazard created successfully', 'id' => $conn->lastInsertId()]);
        } else {
            echo json_encode(['success' => false, 'message' => 'Failed to create hazard']);
        }
    } catch (Exception $e) {
        echo json_encode(['success' => false, 'message' => $e->getMessage()]);
    }
}

function updateHazard() {
    global $conn;
    
    try {
        $id = $_GET['id'];
        $data = json_decode(file_get_contents('php://input'), true);
        
        $fields = [];
        $values = [];
        
        if (isset($data['category'])) {
            $fields[] = "category = ?";
            $values[] = $data['category'];
        }
        
        if (isset($data['severity'])) {
            $fields[] = "severity = ?";
            $values[] = $data['severity'];
        }
        
        if (isset($data['notes'])) {
            $fields[] = "notes = ?";
            $values[] = $data['notes'];
        }
        
        if (empty($fields)) {
            echo json_encode(['success' => false, 'message' => 'No fields to update']);
            return;
        }
        
        $sql = "UPDATE hazards SET " . implode(", ", $fields) . " WHERE id = ?";
        $values[] = $id;
        
        $stmt = $conn->prepare($sql);
        
        // Bind values dynamically
        foreach ($values as $i => $value) {
            $stmt->bindValue($i + 1, $value);
        }
        
        if ($stmt->execute()) {
            echo json_encode(['success' => true, 'message' => 'Hazard updated successfully']);
        } else {
            echo json_encode(['success' => false, 'message' => 'Failed to update hazard']);
        }
    } catch (Exception $e) {
        echo json_encode(['success' => false, 'message' => $e->getMessage()]);
    }
}

function deleteHazard() {
    global $conn;
    
    try {
        $id = $_GET['id'];
        
        $sql = "DELETE FROM hazards WHERE id = ?";
        $stmt = $conn->prepare($sql);
        $stmt->bindValue(1, $id);
        
        if ($stmt->execute()) {
            echo json_encode(['success' => true, 'message' => 'Hazard deleted successfully']);
        } else {
            echo json_encode(['success' => false, 'message' => 'Failed to delete hazard']);
        }
    } catch (Exception $e) {
        echo json_encode(['success' => false, 'message' => $e->getMessage()]);
    }
}

$conn = null;
?>
