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
        getEvacuations();
        break;
    case 'POST':
        createEvacuation();
        break;
    case 'PUT':
        updateEvacuation();
        break;
    case 'DELETE':
        deleteEvacuation();
        break;
    default:
        echo json_encode(['success' => false, 'message' => 'Invalid request method']);
        break;
}

function getEvacuations() {
    global $conn;
    
    try {
        $sql = "SELECT id, lat, lng, name, capacity, status, created_at FROM evacuations ORDER BY created_at DESC";
        $stmt = $conn->query($sql);
        
        $evacuations = [];
        if ($stmt->rowCount() > 0) {
            while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
                $evacuations[] = $row;
            }
        }
        
        echo json_encode($evacuations);
    } catch (Exception $e) {
        echo json_encode(['success' => false, 'message' => $e->getMessage()]);
    }
}

function createEvacuation() {
    global $conn;
    
    try {
        $data = json_decode(file_get_contents('php://input'), true);
        
        $lat = $data['lat'];
        $lng = $data['lng'];
        $name = $data['name'];
        $capacity = $data['capacity'];
        $status = $data['status'];
        
        $sql = "INSERT INTO evacuations (lat, lng, name, capacity, status, created_at) VALUES (?, ?, ?, ?, ?, NOW())";
        $stmt = $conn->prepare($sql);
        $stmt->bindValue(1, $lat);
        $stmt->bindValue(2, $lng);
        $stmt->bindValue(3, $name);
        $stmt->bindValue(4, $capacity);
        $stmt->bindValue(5, $status);
        
        if ($stmt->execute()) {
            echo json_encode(['success' => true, 'message' => 'Evacuation center created successfully', 'id' => $conn->lastInsertId()]);
        } else {
            echo json_encode(['success' => false, 'message' => 'Failed to create evacuation center']);
        }
    } catch (Exception $e) {
        echo json_encode(['success' => false, 'message' => $e->getMessage()]);
    }
}

function updateEvacuation() {
    global $conn;
    
    try {
        $id = $_GET['id'];
        $data = json_decode(file_get_contents('php://input'), true);
        
        $fields = [];
        $values = [];
        
        if (isset($data['name'])) {
            $fields[] = "name = ?";
            $values[] = $data['name'];
        }
        
        if (isset($data['capacity'])) {
            $fields[] = "capacity = ?";
            $values[] = $data['capacity'];
        }
        
        if (isset($data['status'])) {
            $fields[] = "status = ?";
            $values[] = $data['status'];
        }
        
        if (empty($fields)) {
            echo json_encode(['success' => false, 'message' => 'No fields to update']);
            return;
        }
        
        $sql = "UPDATE evacuations SET " . implode(", ", $fields) . " WHERE id = ?";
        $values[] = $id;
        
        $stmt = $conn->prepare($sql);
        
        // Bind values dynamically
        foreach ($values as $i => $value) {
            $stmt->bindValue($i + 1, $value);
        }
        
        if ($stmt->execute()) {
            echo json_encode(['success' => true, 'message' => 'Evacuation center updated successfully']);
        } else {
            echo json_encode(['success' => false, 'message' => 'Failed to update evacuation center']);
        }
    } catch (Exception $e) {
        echo json_encode(['success' => false, 'message' => $e->getMessage()]);
    }
}

function deleteEvacuation() {
    global $conn;
    
    try {
        $id = $_GET['id'];
        
        $sql = "DELETE FROM evacuations WHERE id = ?";
        $stmt = $conn->prepare($sql);
        $stmt->bindValue(1, $id);
        
        if ($stmt->execute()) {
            echo json_encode(['success' => true, 'message' => 'Evacuation center deleted successfully']);
        } else {
            echo json_encode(['success' => false, 'message' => 'Failed to delete evacuation center']);
        }
    } catch (Exception $e) {
        echo json_encode(['success' => false, 'message' => $e->getMessage()]);
    }
}

$conn = null;
?>
