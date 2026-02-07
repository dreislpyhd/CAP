-- Create evacuees table for relief requests
CREATE TABLE IF NOT EXISTS evacuees (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    age INT,
    gender ENUM('Male', 'Female', 'Other') DEFAULT 'Other',
    contact VARCHAR(20) NOT NULL,
    address TEXT NOT NULL,
    barangay VARCHAR(255) NOT NULL,
    family_members INT DEFAULT 1,
    zone ENUM('North Caloocan', 'South Caloocan') DEFAULT 'South Caloocan',
    status ENUM('Pending', 'Approved', 'Declined') DEFAULT 'Pending',
    evacuation_id INT DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Add indexes for better performance
CREATE INDEX idx_evacuees_status ON evacuees(status);
CREATE INDEX idx_evacuees_barangay ON evacuees(barangay);
CREATE INDEX idx_evacuees_zone ON evacuees(zone);
