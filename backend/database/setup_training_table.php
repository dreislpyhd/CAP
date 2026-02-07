<?php
// Database setup script for training_events table
require_once __DIR__ . '/../config/db_connection.php';

try {
    $database = new Database();
    $conn = $database->getConnection();
    
    // Create training_events table
    $sql = "CREATE TABLE IF NOT EXISTS training_events (
        id INT AUTO_INCREMENT PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        date DATE NOT NULL,
        time TIME NOT NULL,
        duration VARCHAR(100) NOT NULL,
        location VARCHAR(255) NOT NULL,
        training_type ENUM('Training', 'Drill', 'Meeting') NOT NULL,
        facilitator VARCHAR(255),
        participants_expected VARCHAR(255),
        description TEXT NOT NULL,
        status ENUM('Scheduled', 'In Progress', 'Completed', 'Cancelled') DEFAULT 'Scheduled',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )";
    
    $conn->exec($sql);
    echo "✅ Training events table created successfully!<br>";
    
    // Create indexes
    $conn->exec("CREATE INDEX IF NOT EXISTS idx_date ON training_events(date)");
    $conn->exec("CREATE INDEX IF NOT EXISTS idx_status ON training_events(status)");
    $conn->exec("CREATE INDEX IF NOT EXISTS idx_training_type ON training_events(training_type)");
    echo "✅ Indexes created successfully!<br>";
    
    // Insert sample data (only if table is empty)
    $checkSql = "SELECT COUNT(*) as count FROM training_events";
    $result = $conn->query($checkSql);
    $count = $result->fetch(PDO::FETCH_ASSOC)['count'];
    
    if ($count == 0) {
        $sampleData = [
            [
                'title' => 'Fire Safety Training',
                'date' => '2024-02-15',
                'time' => '09:00:00',
                'duration' => '2 hours',
                'location' => 'Main Hall',
                'training_type' => 'Training',
                'facilitator' => 'John Smith',
                'participants_expected' => 'All Staff',
                'description' => 'Basic fire safety and evacuation procedures',
                'status' => 'Scheduled'
            ],
            [
                'title' => 'Earthquake Drill',
                'date' => '2024-02-20',
                'time' => '14:00:00',
                'duration' => '1 hour',
                'location' => 'Building A',
                'training_type' => 'Drill',
                'facilitator' => 'Maria Santos',
                'participants_expected' => 'All Employees',
                'description' => 'Quarterly earthquake response drill',
                'status' => 'Scheduled'
            ],
            [
                'title' => 'First Aid Workshop',
                'date' => '2024-02-25',
                'time' => '10:00:00',
                'duration' => '3 hours',
                'location' => 'Conference Room',
                'training_type' => 'Training',
                'facilitator' => 'Dr. James Lee',
                'participants_expected' => 'Selected Staff',
                'description' => 'Basic first aid and CPR training',
                'status' => 'Scheduled'
            ]
        ];
        
        $insertSql = "INSERT INTO training_events (title, date, time, duration, location, training_type, facilitator, participants_expected, description, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
        $stmt = $conn->prepare($insertSql);
        
        foreach ($sampleData as $data) {
            $stmt->execute([
                $data['title'], $data['date'], $data['time'], $data['duration'], 
                $data['location'], $data['training_type'], $data['facilitator'], 
                $data['participants_expected'], $data['description'], $data['status']
            ]);
        }
        
        echo "✅ Sample data inserted successfully!<br>";
    } else {
        echo "ℹ️ Table already contains data, skipping sample data insertion.<br>";
    }
    
    echo "<br><strong>🎉 Setup completed successfully!</strong><br>";
    echo "You can now use the TDS component to manage training events.";
    
} catch (PDOException $e) {
    echo "❌ Error: " . $e->getMessage();
}
?>
