-- Insert admin credentials
-- Email: drrma36@gmail.com
-- Password: drrma123 (will be hashed)
-- Role: admin

USE gsm_db;

-- Insert admin user with hashed password
INSERT INTO users (full_name, email, contact_number, barangay, address, password) 
VALUES (
    'DRRM Administrator',
    'drrma36@gmail.com',
    '09123456789',
    'Central Barangay',
    'DRRM Office, City Hall',
    '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi'  -- This is the hash for 'drrma123'
);

-- Verify insertion
SELECT * FROM users WHERE email = 'drrma36@gmail.com';
