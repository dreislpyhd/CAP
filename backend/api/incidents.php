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
require_once __DIR__ . '/../utils/session_guard.php';

// Include database connection
require_once __DIR__ . '/../config/db_connection.php';

// Create database connection
$database = new Database();
$conn = $database->getConnection();

class IncidentsAPI {
    private $conn;
    
    public function __construct($connection) {
        $this->conn = $connection;
    }
    
    public function getIncidents() {
        try {
            $hasSeverity = false;
            try {
                $check = $this->conn->query("SHOW COLUMNS FROM incidents LIKE 'severity'");
                $hasSeverity = $check && $check->rowCount() > 0;
            } catch (PDOException $e) {
                $hasSeverity = false;
            }
            $orderClause = $hasSeverity ? "ORDER BY FIELD(i.severity, 'Critical','High','Moderate','Low') DESC, i.timestamp DESC" : "ORDER BY i.timestamp DESC";
            // Check if user is admin (you can modify this logic based on your admin detection)
            $isAdmin = isset($_SESSION['user_role']) && $_SESSION['user_role'] === 'admin';
            
            // Get user_id from session or request parameter
            $userId = $_SESSION['user_id'] ?? $_GET['user_id'] ?? null;
            
            // Build query based on user role
            if ($isAdmin) {
                // Admin can see all incidents with user information
                $query = "SELECT i.*, u.full_name as reporter_name, u.email as reporter_email 
                         FROM incidents i 
                         LEFT JOIN users u ON i.user_id = u.id 
                         $orderClause";
                $stmt = $this->conn->prepare($query);
                $stmt->execute();
            } elseif ($userId) {
                // Regular user can only see their own incidents
                $query = "SELECT i.*, u.full_name as reporter_name, u.email as reporter_email 
                         FROM incidents i 
                         LEFT JOIN users u ON i.user_id = u.id 
                         WHERE i.user_id = ? 
                         $orderClause";
                $stmt = $this->conn->prepare($query);
                $stmt->execute([$userId]);
            } else {
                // No user_id and not admin - return all incidents for notification system (public access)
                $query = "SELECT i.*, u.full_name as reporter_name, u.email as reporter_email 
                         FROM incidents i 
                         LEFT JOIN users u ON i.user_id = u.id 
                         $orderClause";
                $stmt = $this->conn->prepare($query);
                $stmt->execute();
            }
            
            $incidents = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            // Decode JSON fields and format file data
            foreach ($incidents as &$incident) {
                if (isset($incident['files'])) {
                    $files = json_decode($incident['files'], true);
                    if (is_array($files)) {
                        // Add URL to each file
                        foreach ($files as &$file) {
                            $file['url'] = 'http://localhost/gsm/backend/uploads/' . $file['path'];
                        }
                    }
                    $incident['files'] = $files;
                }
            }
            
            echo json_encode($incidents);
        } catch (PDOException $e) {
            http_response_code(500);
            echo json_encode(['message' => 'Error fetching incidents: ' . $e->getMessage()]);
        }
    }
    
    public function createIncident() {
        try {
            // Handle file uploads
            $uploadedFiles = [];
            if (isset($_FILES['files'])) {
                $uploadDir = '../uploads/';
                
                // Create upload directory if it doesn't exist
                if (!file_exists($uploadDir)) {
                    mkdir($uploadDir, 0777, true);
                }
                
                $files = $_FILES['files'];
                $fileCount = count($files['name']);
                
                for ($i = 0; $i < $fileCount; $i++) {
                    if ($files['error'][$i] === UPLOAD_ERR_OK) {
                        $fileName = time() . '_' . basename($files['name'][$i]);
                        $targetPath = $uploadDir . $fileName;
                        
                        if (move_uploaded_file($files['tmp_name'][$i], $targetPath)) {
                            $uploadedFiles[] = [
                                'name' => $files['name'][$i],
                                'size' => $files['size'][$i],
                                'type' => $files['type'][$i],
                                'path' => $fileName
                            ];
                        }
                    }
                }
            }
            
            $hasSeverity = false;
            try {
                $check = $this->conn->query("SHOW COLUMNS FROM incidents LIKE 'severity'");
                $hasSeverity = $check && $check->rowCount() > 0;
            } catch (PDOException $e) {
                $hasSeverity = false;
            }
            if ($hasSeverity) {
                $query = "INSERT INTO incidents (user_id, incidentType, location, description, severity, status, files, timestamp) 
                         VALUES (:user_id, :incidentType, :location, :description, :severity, :status, :files, NOW())";
            } else {
                $query = "INSERT INTO incidents (user_id, incidentType, location, description, status, files, timestamp) 
                         VALUES (:user_id, :incidentType, :location, :description, :status, :files, NOW())";
            }
            $stmt = $this->conn->prepare($query);
            $userId = $_SESSION['user_id'] ?? 1;
            $stmt->bindParam(':user_id', $userId);
            $stmt->bindParam(':incidentType', $_POST['incidentType']);
            $stmt->bindParam(':location', $_POST['location']);
            $stmt->bindParam(':description', $_POST['description']);
            if ($hasSeverity) {
                $severity = isset($_POST['severity']) ? $_POST['severity'] : 'Low';
                $stmt->bindParam(':severity', $severity);
            }
            $status = isset($_POST['status']) ? $_POST['status'] : 'Pending';
            if (isset($_POST['severity']) && $_POST['severity'] === 'Critical') {
                $status = 'In Progress';
            }
            $stmt->bindParam(':status', $status);
            $filesJson = json_encode($uploadedFiles);
            $stmt->bindParam(':files', $filesJson);
            if ($stmt->execute()) {
                http_response_code(201);
                echo json_encode([
                    'message' => 'Incident created successfully',
                    'id' => $this->conn->lastInsertId()
                ]);
            } else {
                throw new Exception('Failed to create incident');
            }
            
        } catch (PDOException $e) {
            http_response_code(500);
            echo json_encode(['message' => 'Error creating incident: ' . $e->getMessage()]);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['message' => $e->getMessage()]);
        }
    }
    
    public function updateIncidentStatus() {
        try {
            $incidentId = $_GET['id'];
            $data = json_decode(file_get_contents('php://input'), true);
            
            $query = "UPDATE incidents SET status = :status WHERE id = :id";
            $stmt = $this->conn->prepare($query);
            
            $stmt->bindParam(':status', $data['status']);
            $stmt->bindParam(':id', $incidentId);
            
            if ($stmt->execute()) {
                echo json_encode(['message' => 'Incident status updated successfully']);
            } else {
                throw new Exception('Failed to update incident status');
            }
            
        } catch (PDOException $e) {
            http_response_code(500);
            echo json_encode(['message' => 'Error updating incident: ' . $e->getMessage()]);
        }
    }
}

// Handle requests
$api = new IncidentsAPI($conn);

switch ($_SERVER['REQUEST_METHOD']) {
    case 'GET':
        $api->getIncidents();
        break;
    case 'POST':
        $api->createIncident();
        break;
    case 'PUT':
        $api->updateIncidentStatus();
        break;
    default:
        http_response_code(405);
        echo json_encode(['message' => 'Method not allowed']);
        break;
}
?>
