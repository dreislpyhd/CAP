<?php
// Enable error reporting for development
error_reporting(E_ALL);
ini_set('display_errors', 1);

// Set CORS headers
header("Access-Control-Allow-Origin: http://localhost:5173");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Accept");
header("Access-Control-Allow-Credentials: true");
header('Content-Type: application/json');

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Session guard for cookie params and inactivity management
require_once __DIR__ . '/utils/session_guard.php';

try {
    // Get JSON input
    $json = file_get_contents('php://input');
    $data = json_decode($json, true);
    
    // Log the received data for debugging
    error_log("Received OTP verification request: " . print_r($data, true));

    // Validate required fields
    if (empty($data['email']) || empty($data['otp'])) {
        throw new Exception('Email and OTP are required');
    }

    $email = $data['email'];
    $otp = $data['otp'];

    // Include database connection and mailer
    require_once __DIR__ . '/config/db_connection.php';
    require_once __DIR__ . '/utils/mailer.php';

    // Create database connection
    $database = new Database();
    $conn = $database->getConnection();

    // Verify the OTP
    if (verifyOTP($email, $otp)) {
        // OTP is valid, get user data
        $stmt = $conn->prepare("SELECT id, email, full_name FROM users WHERE email = ?");
        $stmt->execute([$email]);
        $user = $stmt->fetch(PDO::FETCH_ASSOC);

        if ($user) {
            // Determine user role based on email
            $role = 'user'; // Default role
            if ($email === 'drrma36@gmail.com' || $email === 'admin@example.com') {
                $role = 'admin';
            }
            
            // Add role to user data
            $user['role'] = $role;

            // Session already started by guard; set user data and last activity
            $_SESSION['user_id'] = $user['id'];
            $_SESSION['user_email'] = $user['email'];
            $_SESSION['user_name'] = $user['full_name'];
            $_SESSION['user_role'] = $role;
            $_SESSION['LAST_ACTIVITY'] = time();

            echo json_encode([
                'status' => 'success',
                'message' => 'OTP verified successfully',
                'user' => $user
            ]);
            exit();
        } else {
            throw new Exception('User not found');
        }
    } else {
        throw new Exception('Invalid or expired OTP');
    }
} catch (Exception $e) {
    http_response_code(400);
    echo json_encode([
        'status' => 'error',
        'message' => $e->getMessage()
    ]);
    exit();
}
?>
