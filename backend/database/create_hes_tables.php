<?php
include_once '../config/db_connection.php';

try {
    $database = new Database();
    $conn = $database->getConnection();
    
    // Create hazards table
    $hazardsSQL = "
    CREATE TABLE IF NOT EXISTS hazards (
        id INT AUTO_INCREMENT PRIMARY KEY,
        lat DECIMAL(10, 8) NOT NULL,
        lng DECIMAL(11, 8) NOT NULL,
        category VARCHAR(100) NOT NULL,
        severity VARCHAR(50) NOT NULL,
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_coordinates (lat, lng),
        INDEX idx_category (category),
        INDEX idx_severity (severity)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4";
    
    $conn->exec($hazardsSQL);
    echo "Hazards table created successfully\n";
    
    // Create evacuations table
    $evacuationsSQL = "
    CREATE TABLE IF NOT EXISTS evacuations (
        id INT AUTO_INCREMENT PRIMARY KEY,
        lat DECIMAL(10, 8) NOT NULL,
        lng DECIMAL(11, 8) NOT NULL,
        name VARCHAR(255) NOT NULL,
        capacity INT NOT NULL DEFAULT 100,
        status VARCHAR(50) NOT NULL DEFAULT 'Available',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_coordinates (lat, lng),
        INDEX idx_status (status),
        INDEX idx_name (name)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4";
    
    $conn->exec($evacuationsSQL);
    echo "Evacuations table created successfully\n";
    
    // Insert some sample data
    $sampleHazards = [
        [
            'lat' => 14.6596,
            'lng' => 120.9771,
            'category' => 'Flood',
            'severity' => 'Moderate',
            'notes' => 'Sample flood hazard'
        ],
        [
            'lat' => 14.6616,
            'lng' => 120.9751,
            'category' => 'Fire',
            'severity' => 'Low',
            'notes' => 'Sample fire hazard'
        ]
    ];
    
    $sampleEvacuations = [
        [
            'lat' => 14.6590,
            'lng' => 120.9760,
            'name' => 'Barangay Hall Evacuation Center',
            'capacity' => 150,
            'status' => 'Available'
        ],
        [
            'lat' => 14.6600,
            'lng' => 120.9780,
            'name' => 'School Evacuation Center',
            'capacity' => 200,
            'status' => 'Available'
        ]
    ];
    
    // Insert sample hazards
    foreach ($sampleHazards as $hazard) {
        $sql = "INSERT IGNORE INTO hazards (lat, lng, category, severity, notes) VALUES (?, ?, ?, ?, ?)";
        $stmt = $conn->prepare($sql);
        $stmt->execute([$hazard['lat'], $hazard['lng'], $hazard['category'], $hazard['severity'], $hazard['notes']]);
    }
    
    // Insert sample evacuations
    foreach ($sampleEvacuations as $evacuation) {
        $sql = "INSERT IGNORE INTO evacuations (lat, lng, name, capacity, status) VALUES (?, ?, ?, ?, ?)";
        $stmt = $conn->prepare($sql);
        $stmt->execute([$evacuation['lat'], $evacuation['lng'], $evacuation['name'], $evacuation['capacity'], $evacuation['status']]);
    }
    
    echo "Sample data inserted successfully\n";
    
} catch (PDOException $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
?>
