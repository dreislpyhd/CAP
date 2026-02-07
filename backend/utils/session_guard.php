<?php
$cookieParams = [
    'lifetime' => 180,
    'path' => '/',
    'domain' => '',
    'secure' => false,
    'httponly' => true,
    'samesite' => 'Lax'
];

if (session_status() === PHP_SESSION_NONE) {
    if (function_exists('session_set_cookie_params')) {
        session_set_cookie_params($cookieParams);
    }
    session_start();
}

$timeout = 180;
$now = time();

if (isset($_SESSION['LAST_ACTIVITY'])) {
    $idle = $now - intval($_SESSION['LAST_ACTIVITY']);
    if ($idle > $timeout) {
        session_unset();
        session_destroy();
        if (ini_get("session.use_cookies")) {
            $params = session_get_cookie_params();
            setcookie(session_name(), '', $now - 42000, $params["path"], $params["domain"], $params["secure"], $params["httponly"]);
        }
        http_response_code(401);
        header('Content-Type: application/json');
        echo json_encode([
            'status' => 'error',
            'message' => 'Session expired due to inactivity'
        ]);
        exit();
    }
}

$_SESSION['LAST_ACTIVITY'] = $now;
?>
