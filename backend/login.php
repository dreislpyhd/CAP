<?php
// Enable error reporting for development
error_reporting(E_ALL);
ini_set('display_errors', 1);

// Set CORS headers
$allowed_origins = ['http://localhost:5173', 'https://disaster.goserveph.com'];
$origin = isset($_SERVER['HTTP_ORIGIN']) ? $_SERVER['HTTP_ORIGIN'] : '';
if (in_array($origin, $allowed_origins)) {
    header("Access-Control-Allow-Origin: " . $origin);
}
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Accept, Cache, Pragma");
header("Access-Control-Allow-Credentials: true");
header('Content-Type: application/json');

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once 'config/db_connection.php';
require_once 'utils/mailer.php';

// Create database connection
$database = new Database();
$conn = $database->getConnection();

// Only allow POST requests
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(["status" => "error", "message" => "Method not allowed"]);
    exit();
}

// Get the raw POST data
$json = file_get_contents('php://input');
$data = json_decode($json, true);

// Validate required fields
if (empty($data['email']) || empty($data['password'])) {
    http_response_code(400);
    echo json_encode(["status" => "error", "message" => "Email and password are required"]);
    exit();
}

try {
    // Check if user exists
    $stmt = $conn->prepare("SELECT id, full_name, password, email FROM users WHERE email = ?");
    $stmt->execute([$data['email']]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);
    
    // For resend OTP, skip password verification if resend_otp flag is set
    $isResendOtp = !empty($data['resend_otp']);
    
    if (!$user) {
        http_response_code(401);
        echo json_encode(["status" => "error", "message" => "Invalid email or password"]);
        exit();
    }
    
    // Only verify password if not a resend OTP request
    if (!$isResendOtp && !password_verify($data['password'], $user['password'])) {
        http_response_code(401);
        echo json_encode(["status" => "error", "message" => "Invalid email or password"]);
        exit();
    }
    
    // For resend OTP, use the same OTP if it's still valid
   $otp = generateOTP();
error_log("=== Generating New OTP ===");
error_log("For email: " . $user['email']);
error_log("Generated OTP: $otp");
if (!saveOTP($user['email'], $otp)) {
    throw new Exception("Failed to save OTP");
}
// Send OTP via email
if (!sendOTP($user['email'], $otp)) {
    error_log("Failed to send OTP email to: " . $user['email']);
    throw new Exception("Failed to send OTP");
}
error_log("OTP sent successfully to: " . $user['email']);
    
    // Check if there's a valid OTP that hasn't expired yet
    if ($isResendOtp) {
        $stmt = $conn->prepare("
            SELECT otp FROM user_otps 
            WHERE email = ? AND expires_at > NOW() 
            ORDER BY created_at DESC LIMIT 1
        ");
        $stmt->execute([$user['email']]);
        $existingOtp = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if ($existingOtp) {
            // If there's a valid OTP, use it instead of generating a new one
            $otp = $existingOtp['otp'];
        } else {
            // Otherwise, generate and save a new OTP
            if (!saveOTP($user['email'], $otp)) {
                throw new Exception("Failed to save OTP");
            }
            
            // Send OTP via email
            if (!sendOTP($user['email'], $otp)) {
                throw new Exception("Failed to send OTP");
            }
        }
    } else {
        // For new login, always generate and send a new OTP
        if (!saveOTP($user['email'], $otp)) {
            throw new Exception("Failed to save OTP");
        }
        
        // Send OTP via email
        if (!sendOTP($user['email'], $otp)) {
            throw new Exception("Failed to send OTP");
        }
    }
    
    // Remove sensitive data from response
    unset($user['password']);
    
    echo json_encode([
        "status" => "otp_required", 
        "message" => "OTP has been sent to your email",
        "email" => $user['email']
    ]);
    
} catch(PDOException $e) {
    http_response_code(500);
    echo json_encode(["status" => "error", "message" => "Database error: " . $e->getMessage()]);
} catch(Exception $e) {
    http_response_code(500);
    echo json_encode(["status" => "error", "message" => $e->getMessage()]);
}
?>
