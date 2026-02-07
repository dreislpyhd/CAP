<?php
require_once __DIR__ . '/../../vendor/autoload.php';
use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;

function sendOTP($email, $otp) {
    $mail = new PHPMailer(true);

    try {
        // Server settings
        $mail->isSMTP();
        $mail->Host       = 'smtp.gmail.com';
        $mail->SMTPAuth   = true;
        $mail->Username   = 'drrmgsm@gmail.com';
        $mail->Password   = 'sxqrwlvxrvphimil';
        $mail->SMTPSecure = PHPMailer::ENCRYPTION_STARTTLS;
        $mail->Port       = 587;

        // Recipients
        $mail->setFrom('drrmgsm@gmail.com', 'GSM System');
        $mail->addAddress($email);

        // Content
        $mail->isHTML(true);
        $mail->Subject = 'Your Login OTP Code';
        $mail->Body    = 'Your OTP code is: <b>' . $otp . '</b><br>This code will expire in 10 minutes.';
        $mail->AltBody = 'Your OTP code is: ' . $otp . '\nThis code will expire in 10 minutes.';

        $mail->send();
        return true;
    } catch (Exception $e) {
        error_log("Error sending OTP email: " . $e->getMessage());
        return false;
    }
}

function generateOTP($length = 6) {
    $characters = '0123456789';
    $otp = '';
    for ($i = 0; $i < $length; $i++) {
        $otp .= $characters[rand(0, strlen($characters) - 1)];
    }
    return $otp;
}

function saveOTP($email, $otp) {
    global $conn;
    
    // Set expiration time (10 minutes from now)
    $expires_at = date('Y-m-d H:i:s', strtotime('+10 minutes'));
    
    try {
        // Hash the OTP before storing
        $hashedOTP = password_hash($otp, PASSWORD_DEFAULT);
        error_log("=== Saving New OTP ===");
        error_log("Email: $email");
        error_log("Plain OTP: $otp");
        error_log("Hashed OTP: $hashedOTP");
        error_log("Expires at: $expires_at");
        
        // Delete any existing OTPs for this email
        $stmt = $conn->prepare("DELETE FROM user_otps WHERE email = ?");
        $stmt->execute([$email]);
        
        // Insert new OTP
        $stmt = $conn->prepare("
            INSERT INTO user_otps (email, otp, expires_at) 
            VALUES (?, ?, ?)
        ");
        $result = $stmt->execute([$email, $hashedOTP, $expires_at]);
        
        error_log("Save OTP result: " . ($result ? "success" : "failed"));
        return $result;
    } catch (Exception $e) {
        error_log("Error in saveOTP: " . $e->getMessage());
        return false;
    }
}

function verifyOTP($email, $otp) {
    global $conn;
    
    try {
        error_log("=== Starting OTP Verification ===");
        error_log("Email: $email");
        error_log("OTP to verify: $otp");
        
        // Get the most recent OTP for this email (even expired ones for debugging)
        $stmt = $conn->prepare("
            SELECT otp, expires_at, created_at 
            FROM user_otps 
            WHERE email = ? 
            ORDER BY created_at DESC 
            LIMIT 1
        ");
        $stmt->execute([$email]);
        $storedOTP = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if ($storedOTP) {
            error_log("Stored OTP record found:");
            error_log("Hash: " . $storedOTP['otp']);
            error_log("Created at: " . $storedOTP['created_at']);
            error_log("Expires at: " . $storedOTP['expires_at']);
            error_log("Current time: " . date('Y-m-d H:i:s'));
            error_log("Is expired? " . (strtotime($storedOTP['expires_at']) < time() ? 'YES' : 'NO'));
            
            // Check if OTP is expired
            if (strtotime($storedOTP['expires_at']) < time()) {
                error_log("OTP has expired");
                return false;
            }
            
            // Verify the OTP
            $isValid = password_verify($otp, $storedOTP['otp']);
            error_log("Password verify result: " . ($isValid ? 'MATCH' : 'NO MATCH'));
            
            if ($isValid) {
                // Delete the used OTP
                $stmt = $conn->prepare("DELETE FROM user_otps WHERE email = ?");
                $stmt->execute([$email]);
                error_log("OTP verified successfully");
                return true;
            }
        } else {
            error_log("No OTP found for email: $email");
        }
        
        return false;
    } catch (Exception $e) {
        error_log("Error in verifyOTP: " . $e->getMessage());
        return false;
    }
}
?>