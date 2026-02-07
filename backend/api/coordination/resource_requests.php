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

// Include database connection
require_once __DIR__ . '/../../config/db_connection.php';

// Database connection function
function getConnection() {
    $database = new Database();
    return $database->getConnection();
}

class ResourceRequestAPI {
    private $conn;

    public function __construct() {
        $this->conn = getConnection();
    }

    // Create resource requests table if not exists
    private function createTableIfNotExists() {
        $sql = "CREATE TABLE IF NOT EXISTS resource_requests (
            id INT AUTO_INCREMENT PRIMARY KEY,
            barangay VARCHAR(255) NOT NULL,
            location VARCHAR(255) NOT NULL,
            disaster_type VARCHAR(255) NOT NULL,
            quantity INT NOT NULL,
            status VARCHAR(50) DEFAULT 'Pending',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        )";
        
        try {
            $this->conn->exec($sql);
        } catch (Exception $e) {
            error_log("Error creating table: " . $e->getMessage());
        }
    }

    // Create new resource request
    public function createRequest($data) {
        try {
            // Ensure table exists
            $this->createTableIfNotExists();
            
            // Debug: Log received data
            error_log("=== CREATE RESOURCE REQUEST DEBUG ===");
            error_log("Received data: " . json_encode($data));
            
            // Check required fields
            $requiredFields = ['barangay', 'location', 'disaster_type', 'quantity'];
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
            
            $sql = "INSERT INTO resource_requests (barangay, location, disaster_type, quantity) 
                    VALUES (?, ?, ?, ?)";
            
            $stmt = $this->conn->prepare($sql);
            $result = $stmt->execute([
                $data['barangay'], 
                $data['location'], 
                $data['disaster_type'], 
                $data['quantity']
            ]);
            
            error_log("SQL Execute result: " . ($result ? 'SUCCESS' : 'FAILED'));
            
            if ($result) {
                $insertId = $this->conn->lastInsertId();
                error_log("Inserted record ID: " . $insertId);
                return [
                    'success' => true,
                    'message' => 'Resource request submitted successfully',
                    'id' => $insertId
                ];
            } else {
                $error = $stmt->errorInfo();
                error_log("SQL Error: " . json_encode($error));
                return [
                    'success' => false,
                    'message' => 'Error submitting request: ' . $error[2]
                ];
            }
        } catch (Exception $e) {
            error_log("Exception: " . $e->getMessage());
            return [
                'success' => false,
                'message' => 'Error submitting request: ' . $e->getMessage()
            ];
        }
    }

    // Get all resource requests
    public function getRequests() {
        try {
            $this->createTableIfNotExists();
            
            $sql = "SELECT * FROM resource_requests ORDER BY created_at DESC";
            $result = $this->conn->query($sql);
            
            $requests = [];
            if ($result && $result->rowCount() > 0) {
                while ($row = $result->fetch(PDO::FETCH_ASSOC)) {
                    $requests[] = $row;
                }
            }
            
            return [
                'success' => true,
                'data' => $requests
            ];
        } catch (Exception $e) {
            return [
                'success' => false,
                'message' => 'Error fetching requests: ' . $e->getMessage()
            ];
        }
    }

    // Update resource request status
    public function updateRequestStatus($id, $status) {
        try {
            $sql = "UPDATE resource_requests SET status = ? WHERE id = ?";
            $stmt = $this->conn->prepare($sql);
            $result = $stmt->execute([$status, $id]);
            
            if ($result) {
                return [
                    'success' => true,
                    'message' => 'Request status updated successfully'
                ];
            } else {
                return [
                    'success' => false,
                    'message' => 'Error updating request status'
                ];
            }
        } catch (Exception $e) {
            return [
                'success' => false,
                'message' => 'Error updating request status: ' . $e->getMessage()
            ];
        }
    }
}

// Handle API requests
$api = new ResourceRequestAPI();

try {
    $method = $_SERVER['REQUEST_METHOD'];
    
    switch ($method) {
        case 'GET':
            // Get all requests
            $response = $api->getRequests();
            break;
            
        case 'POST':
            // Create new request
            $data = json_decode(file_get_contents('php://input'), true);
            if (!$data) {
                $response = [
                    'success' => false,
                    'message' => 'Invalid JSON data'
                ];
            } else {
                $response = $api->createRequest($data);
            }
            break;
            
        case 'PUT':
            // Update request status
            $id = $_GET['id'] ?? null;
            $status = $_GET['status'] ?? null;
            if (!$id || !$status) {
                $response = [
                    'success' => false,
                    'message' => 'Request ID and status required'
                ];
            } else {
                $response = $api->updateRequestStatus($id, $status);
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
