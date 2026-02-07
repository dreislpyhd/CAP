<?php
header('Access-Control-Allow-Origin: http://localhost:5173');
header('Access-Control-Allow-Methods: POST, PUT, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Access-Control-Allow-Credentials: true');
header('Content-Type: application/json');

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Include database connection
require_once __DIR__ . '/../config/db_connection.php';

// Database connection function
function getConnection() {
    $database = new Database();
    return $database->getConnection();
}

class ProfileUpdateAPI {
    private $conn;

    public function __construct() {
        $this->conn = getConnection();
    }

    // Verify current password
    private function verifyCurrentPassword($userId, $currentPassword) {
        try {
            $sql = "SELECT password FROM users WHERE id = ?";
            $stmt = $this->conn->prepare($sql);
            $stmt->execute([$userId]);
            $result = $stmt->fetch(PDO::FETCH_ASSOC);
            
            if ($result && password_verify($currentPassword, $result['password'])) {
                return true;
            }
            return false;
        } catch (Exception $e) {
            error_log("Error verifying password: " . $e->getMessage());
            return false;
        }
    }

    // Update user profile (email and password)
    public function updateProfile($data) {
        try {
            error_log("=== UPDATE PROFILE DEBUG ===");
            error_log("Received data: " . json_encode($data));
            
            // Check required fields
            $requiredFields = ['email', 'currentPassword'];
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

            // Get user ID from session or token (for now, we'll use email to find the user)
            $email = $data['email'];
            $currentPassword = $data['currentPassword'];
            $newPassword = $data['newPassword'] ?? null;
            $newEmail = $data['newEmail'] ?? $email;

            // First, get the user by current email
            $sql = "SELECT id, email FROM users WHERE email = ?";
            $stmt = $this->conn->prepare($sql);
            $stmt->execute([$email]);
            $user = $stmt->fetch(PDO::FETCH_ASSOC);

            if (!$user) {
                error_log("User not found with email: " . $email);
                return [
                    'success' => false,
                    'message' => 'User not found'
                ];
            }

            $userId = $user['id'];

            // Verify current password
            if (!$this->verifyCurrentPassword($userId, $currentPassword)) {
                error_log("Current password verification failed for user ID: " . $userId);
                return [
                    'success' => false,
                    'message' => 'Current password is incorrect'
                ];
            }

            // Check if new email is already taken by another user
            if ($newEmail !== $email) {
                $sql = "SELECT id FROM users WHERE email = ? AND id != ?";
                $stmt = $this->conn->prepare($sql);
                $stmt->execute([$newEmail, $userId]);
                $existingUser = $stmt->fetch(PDO::FETCH_ASSOC);
                
                if ($existingUser) {
                    return [
                        'success' => false,
                        'message' => 'Email address is already taken by another user'
                    ];
                }
            }

            // Build update query
            $updateFields = [];
            $updateValues = [];
            
            // Update email if changed
            if ($newEmail !== $email) {
                $updateFields[] = "email = ?";
                $updateValues[] = $newEmail;
            }

            // Update password if provided
            if (!empty($newPassword)) {
                if (strlen($newPassword) < 6) {
                    return [
                        'success' => false,
                        'message' => 'New password must be at least 6 characters long'
                    ];
                }
                
                $hashedPassword = password_hash($newPassword, PASSWORD_DEFAULT);
                $updateFields[] = "password = ?";
                $updateValues[] = $hashedPassword;
            }

            if (empty($updateFields)) {
                return [
                    'success' => false,
                    'message' => 'No changes to update'
                ];
            }

            // Add updated_at field
            $updateFields[] = "updated_at = CURRENT_TIMESTAMP";
            $updateValues[] = $userId;

            // Execute update
            $sql = "UPDATE users SET " . implode(', ', $updateFields) . " WHERE id = ?";
            $stmt = $this->conn->prepare($sql);
            
            error_log("Update SQL: " . $sql);
            error_log("Update values: " . json_encode($updateValues));
            
            $result = $stmt->execute($updateValues);

            if ($result) {
                error_log("Profile updated successfully for user ID: " . $userId);
                
                // Get updated user data
                $sql = "SELECT id, full_name, email, contact_number, barangay, address FROM users WHERE id = ?";
                $stmt = $this->conn->prepare($sql);
                $stmt->execute([$userId]);
                $updatedUser = $stmt->fetch(PDO::FETCH_ASSOC);
                
                return [
                    'success' => true,
                    'message' => 'Profile updated successfully',
                    'user' => $updatedUser
                ];
            } else {
                $error = $stmt->errorInfo();
                error_log("SQL Error: " . json_encode($error));
                return [
                    'success' => false,
                    'message' => 'Error updating profile: ' . $error[2]
                ];
            }

        } catch (Exception $e) {
            error_log("Exception: " . $e->getMessage());
            return [
                'success' => false,
                'message' => 'Error updating profile: ' . $e->getMessage()
            ];
        }
    }
}

// Handle API requests
$api = new ProfileUpdateAPI();

try {
    $method = $_SERVER['REQUEST_METHOD'];
    
    switch ($method) {
        case 'POST':
        case 'PUT':
            // Update profile
            $data = json_decode(file_get_contents('php://input'), true);
            if (!$data) {
                $response = [
                    'success' => false,
                    'message' => 'Invalid JSON data'
                ];
            } else {
                $response = $api->updateProfile($data);
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
