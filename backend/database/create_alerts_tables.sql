-- Create alerts table
CREATE TABLE IF NOT EXISTS alerts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    type ENUM('Flood', 'Earthquake', 'Typhoon', 'Fire', 'Volcanic Eruption', 'Power Outage') NOT NULL,
    level ENUM('Low', 'Moderate', 'High') NOT NULL,
    status ENUM('draft', 'sent') DEFAULT 'draft',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Create alert_barangays table to track which barangays each alert is sent to
CREATE TABLE IF NOT EXISTS alert_barangays (
    id INT AUTO_INCREMENT PRIMARY KEY,
    alert_id INT NOT NULL,
    barangay_name VARCHAR(100) NOT NULL,
    sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (alert_id) REFERENCES alerts(id) ON DELETE CASCADE,
    UNIQUE KEY unique_alert_barangay (alert_id, barangay_name)
);

-- Create user_barangays table to track which barangay each user belongs to
CREATE TABLE IF NOT EXISTS user_barangays (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    barangay_name VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_user_barangay (user_id, barangay_name)
);

-- Create alert_read_status table to track which users have read which alerts
CREATE TABLE IF NOT EXISTS alert_read_status (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    alert_id INT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    read_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (alert_id) REFERENCES alerts(id) ON DELETE CASCADE,
    UNIQUE KEY unique_user_alert (user_id, alert_id)
);

-- Add index for better performance
CREATE INDEX idx_alerts_type ON alerts(type);
CREATE INDEX idx_alerts_level ON alerts(level);
CREATE INDEX idx_alert_barangays_barangay ON alert_barangays(barangay_name);
CREATE INDEX idx_user_barangays_user ON user_barangays(user_id);
CREATE INDEX idx_user_barangays_barangay ON user_barangays(barangay_name);
CREATE INDEX idx_alert_read_status_user ON alert_read_status(user_id);
CREATE INDEX idx_alert_read_status_alert ON alert_read_status(alert_id);
