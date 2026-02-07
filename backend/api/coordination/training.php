<?php
$allowed_origins = ['http://localhost:5173', 'https://disaster.goserveph.com'];
$origin = isset($_SERVER['HTTP_ORIGIN']) ? $_SERVER['HTTP_ORIGIN'] : '';
if (in_array($origin, $allowed_origins)) {
    header("Access-Control-Allow-Origin: " . $origin);
}
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Access-Control-Allow-Credentials: true');
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

// Database connection function
function getConnection() {
    $database = new Database();
    return $database->getConnection();
}

class TrainingAPI {
    private $conn;

    public function __construct() {
        $this->conn = getConnection();
    }

    // Get all training events
    public function getEvents() {
        try {
            $sql = "SELECT * FROM training_events ORDER BY date ASC, time ASC";
            $result = $this->conn->query($sql);
            
            $events = [];
            if ($result && $result->rowCount() > 0) {
                while ($row = $result->fetch(PDO::FETCH_ASSOC)) {
                    $events[] = $row;
                }
            }
            
            return [
                'success' => true,
                'data' => $events
            ];
        } catch (Exception $e) {
            return [
                'success' => false,
                'message' => 'Error fetching events: ' . $e->getMessage()
            ];
        }
    }

    // Create new training event
    public function createEvent($data) {
        try {
            // Debug: Log received data
            error_log("=== CREATE EVENT DEBUG ===");
            error_log("Received data: " . json_encode($data));
            
            // Check required fields
            $requiredFields = ['title', 'date', 'time', 'duration', 'location', 'description', 'status'];
            $missingFields = [];
            foreach ($requiredFields as $field) {
                if (!isset($data[$field]) || empty($data[$field])) {
                    $missingFields[] = $field;
                }
            }
            
            if (!empty($missingFields)) {
                error_log("Missing fields: " . implode(', ', $missingFields));
                return [
                    'success' => false,
                    'message' => 'Missing required fields: ' . implode(', ', $missingFields)
                ];
            }
            
            $sql = "INSERT INTO training_events (title, date, time, duration, location, description, status) 
                    VALUES (?, ?, ?, ?, ?, ?, ?)";
            
            $stmt = $this->conn->prepare($sql);
            $result = $stmt->execute([
                $data['title'], 
                $data['date'], 
                $data['time'], 
                $data['duration'], 
                $data['location'], 
                $data['description'], 
                $data['status']
            ]);
            
            error_log("SQL Execute result: " . ($result ? 'SUCCESS' : 'FAILED'));
            
            if ($result) {
                $insertId = $this->conn->lastInsertId();
                error_log("Inserted record ID: " . $insertId);
                return [
                    'success' => true,
                    'message' => 'Event created successfully',
                    'id' => $insertId
                ];
            } else {
                $error = $stmt->errorInfo();
                error_log("SQL Error: " . json_encode($error));
                return [
                    'success' => false,
                    'message' => 'Error creating event: ' . $error[2]
                ];
            }
        } catch (Exception $e) {
            error_log("Exception: " . $e->getMessage());
            return [
                'success' => false,
                'message' => 'Error creating event: ' . $e->getMessage()
            ];
        }
    }

    // Update training event
    public function updateEvent($id, $data) {
        try {
            // Debug: Log update attempt
            error_log("=== UPDATE EVENT DEBUG ===");
            error_log("Updating event ID: " . $id);
            error_log("Update data: " . json_encode($data));
            
            // Check if event exists first
            $checkSql = "SELECT id, title FROM training_events WHERE id = ?";
            $checkStmt = $this->conn->prepare($checkSql);
            $checkStmt->execute([$id]);
            $existingEvent = $checkStmt->fetch(PDO::FETCH_ASSOC);
            
            if (!$existingEvent) {
                error_log("Event not found with ID: " . $id);
                return [
                    'success' => false,
                    'message' => 'Event not found'
                ];
            }
            
            error_log("Found event to update: " . $existingEvent['title']);
            
            $sql = "UPDATE training_events SET 
                    title = ?, 
                    date = ?, 
                    time = ?, 
                    duration = ?, 
                    location = ?, 
                    description = ?, 
                    status = ? 
                    WHERE id = ?";
            
            $stmt = $this->conn->prepare($sql);
            $result = $stmt->execute([
                $data['title'], 
                $data['date'], 
                $data['time'], 
                $data['duration'], 
                $data['location'], 
                $data['description'], 
                $data['status'],
                $id
            ]);
            
            error_log("Update SQL Execute result: " . ($result ? 'SUCCESS' : 'FAILED'));
            
            if ($result) {
                $affectedRows = $stmt->rowCount();
                error_log("Affected rows: " . $affectedRows);
                
                if ($affectedRows > 0) {
                    error_log("Event successfully updated in database");
                    return [
                        'success' => true,
                        'message' => 'Event updated successfully'
                    ];
                } else {
                    error_log("No rows affected - data may be the same");
                    return [
                        'success' => true,
                        'message' => 'Event updated successfully (no changes needed)'
                    ];
                }
            } else {
                $error = $stmt->errorInfo();
                error_log("SQL Error: " . json_encode($error));
                return [
                    'success' => false,
                    'message' => 'Error updating event: ' . $error[2]
                ];
            }
        } catch (Exception $e) {
            error_log("Update Exception: " . $e->getMessage());
            return [
                'success' => false,
                'message' => 'Error updating event: ' . $e->getMessage()
            ];
        }
    }

    // Delete training event
    public function deleteEvent($id) {
        try {
            // Debug: Log delete attempt
            error_log("=== DELETE EVENT DEBUG ===");
            error_log("Deleting event ID: " . $id);
            
            // Check if event exists first
            $checkSql = "SELECT id, title FROM training_events WHERE id = ?";
            $checkStmt = $this->conn->prepare($checkSql);
            $checkStmt->execute([$id]);
            $existingEvent = $checkStmt->fetch(PDO::FETCH_ASSOC);
            
            if (!$existingEvent) {
                error_log("Event not found with ID: " . $id);
                return [
                    'success' => false,
                    'message' => 'Event not found'
                ];
            }
            
            error_log("Found event to delete: " . $existingEvent['title']);
            
            $sql = "DELETE FROM training_events WHERE id = ?";
            $stmt = $this->conn->prepare($sql);
            $result = $stmt->execute([$id]);
            
            error_log("Delete SQL Execute result: " . ($result ? 'SUCCESS' : 'FAILED'));
            
            if ($result) {
                $affectedRows = $stmt->rowCount();
                error_log("Affected rows: " . $affectedRows);
                
                if ($affectedRows > 0) {
                    error_log("Event successfully deleted from database");
                    return [
                        'success' => true,
                        'message' => 'Event deleted successfully'
                    ];
                } else {
                    error_log("No rows affected - event may not exist");
                    return [
                        'success' => false,
                        'message' => 'No event was deleted'
                    ];
                }
            } else {
                $error = $stmt->errorInfo();
                error_log("SQL Error: " . json_encode($error));
                return [
                    'success' => false,
                    'message' => 'Error deleting event: ' . $error[2]
                ];
            }
        } catch (Exception $e) {
            error_log("Delete Exception: " . $e->getMessage());
            return [
                'success' => false,
                'message' => 'Error deleting event: ' . $e->getMessage()
            ];
        }
    }
}

// Handle API requests
$api = new TrainingAPI();

try {
    $method = $_SERVER['REQUEST_METHOD'];
    
    switch ($method) {
        case 'GET':
            // Get all events
            $response = $api->getEvents();
            break;
            
        case 'POST':
            // Create new event
            $data = json_decode(file_get_contents('php://input'), true);
            if (!$data) {
                $response = [
                    'success' => false,
                    'message' => 'Invalid JSON data'
                ];
            } else {
                $response = $api->createEvent($data);
            }
            break;
            
        case 'PUT':
            // Update event
            $id = $_GET['id'] ?? null;
            if (!$id) {
                $response = [
                    'success' => false,
                    'message' => 'Event ID required'
                ];
            } else {
                $data = json_decode(file_get_contents('php://input'), true);
                if (!$data) {
                    $response = [
                        'success' => false,
                        'message' => 'Invalid JSON data'
                    ];
                } else {
                    $response = $api->updateEvent($id, $data);
                }
            }
            break;
            
        case 'DELETE':
            // Delete event
            $id = $_GET['id'] ?? null;
            if (!$id) {
                $response = [
                    'success' => false,
                    'message' => 'Event ID required'
                ];
            } else {
                $response = $api->deleteEvent($id);
            }
            break;
            
        default:
            $response = [
                'success' => false,
                'message' => 'Method not allowed'
            ];
            http_response_code(405);
            break;
    }
} catch (Exception $e) {
    $response = [
        'success' => false,
        'message' => 'Server error: ' . $e->getMessage()
    ];
    http_response_code(500);
}

echo json_encode($response);
?>
