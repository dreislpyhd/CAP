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

require_once 'config/db_connection.php';

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
$required = ['fullName', 'email', 'contactNumber', 'barangay', 'address', 'password'];
$errors = [];

foreach ($required as $field) {
    if (empty($data[$field])) {
        $errors[$field] = ucfirst($field) . ' is required';
    }
}

// Additional validations
if (!filter_var($data['email'], FILTER_VALIDATE_EMAIL)) {
    $errors['email'] = 'Invalid email format';
}

if (!preg_match('/^09\d{9}$/', $data['contactNumber'])) {
    $errors['contactNumber'] = 'Contact number must be 11 digits starting with 09';
}

if (strlen($data['password']) < 8) {
    $errors['password'] = 'Password must be at least 8 characters long';
} elseif (!preg_match('/[A-Z]/', $data['password']) || 
           !preg_match('/[a-z]/', $data['password']) || 
           !preg_match('/[0-9]/', $data['password'])) {
    $errors['password'] = 'Password must contain at least one uppercase letter, one lowercase letter, and one number';
}

if (!empty($errors)) {
    http_response_code(400);
    echo json_encode(["status" => "error", "errors" => $errors]);
    exit();
}

try {
    // Check if email already exists
    $stmt = $conn->prepare("SELECT id FROM users WHERE email = ?");
    $stmt->execute([$data['email']]);
    
    if ($stmt->rowCount() > 0) {
        http_response_code(400);
        echo json_encode(["status" => "error", "message" => "Email already registered"]);
        exit();
    }

    // Hash the password
    $hashedPassword = password_hash($data['password'], PASSWORD_DEFAULT);
    
    // Generate username from email (part before @)
    $username = explode('@', $data['email'])[0];
    
    // Check if username already exists and append number if needed
    $originalUsername = $username;
    $counter = 1;
    while (true) {
        $checkStmt = $conn->prepare("SELECT id FROM users WHERE username = ?");
        $checkStmt->execute([$username]);
        if ($checkStmt->rowCount() === 0) {
            break;
        }
        $username = $originalUsername . $counter;
        $counter++;
    }
    
    // Insert new user
    $stmt = $conn->prepare("INSERT INTO users (full_name, email, contact_number, barangay, address, password, username) 
                           VALUES (?, ?, ?, ?, ?, ?, ?)");
    
    $stmt->execute([
        $data['fullName'],
        $data['email'],
        $data['contactNumber'],
        $data['barangay'],
        $data['address'],
        $hashedPassword,
        $username
    ]);
    
    echo json_encode([
        "status" => "success", 
        "message" => "Registration successful! You can now log in.",
        "user_id" => $conn->lastInsertId()
    ]);
    
} catch(PDOException $e) {
    http_response_code(500);
    echo json_encode(["status" => "error", "message" => "Database error: " . $e->getMessage()]);
}
?>
