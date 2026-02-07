<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: http://localhost:5173');
header('Access-Control-Allow-Methods: POST');
header('Access-Control-Allow-Headers: Content-Type');

$data = json_decode(file_get_contents('php://input'), true);

$type = $data['incidentType'] ?? '';
$location = $data['location'] ?? '';
$description = $data['description'] ?? '';
$fileCount = $data['fileCount'] ?? 0;

$summary = [
    'type' => ucfirst($type),
    'location' => $location,
    'descriptionPreview' => strlen($description) > 100 ? substr($description, 0, 100) . '...' : $description,
    'fileCount' => $fileCount,
    'warnings' => []
];

// Simple validation warnings
if (strlen($description) < 20) {
    $summary['warnings'][] = 'Description is quite short. Consider adding more details.';
}

if (strlen($location) < 5) {
    $summary['warnings'][] = 'Location seems too short. Please be more specific.';
}

echo json_encode($summary);
?>
