-- Create training_events table for TDS (Training & Drill Scheduling)
CREATE TABLE IF NOT EXISTS training_events (
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
);

-- Add indexes for better performance
CREATE INDEX idx_date ON training_events(date);
CREATE INDEX idx_status ON training_events(status);
CREATE INDEX idx_training_type ON training_events(training_type);

-- Insert sample data for testing
INSERT INTO training_events (title, date, time, duration, location, training_type, facilitator, participants_expected, description, status) VALUES
('Fire Safety Training', '2024-02-15', '09:00:00', '2 hours', 'Main Hall', 'Training', 'John Smith', 'All Staff', 'Basic fire safety and evacuation procedures', 'Scheduled'),
('Earthquake Drill', '2024-02-20', '14:00:00', '1 hour', 'Building A', 'Drill', 'Maria Santos', 'All Employees', 'Quarterly earthquake response drill', 'Scheduled'),
('First Aid Workshop', '2024-02-25', '10:00:00', '3 hours', 'Conference Room', 'Training', 'Dr. James Lee', 'Selected Staff', 'Basic first aid and CPR training', 'Scheduled'),
('Emergency Response Meeting', '2024-03-01', '13:00:00', '2 hours', 'Meeting Room B', 'Meeting', 'Admin Team', 'Department Heads', 'Monthly emergency response coordination', 'Scheduled');
