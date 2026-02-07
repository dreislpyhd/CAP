-- Add user_id column to evacuees table
ALTER TABLE evacuees ADD COLUMN user_id INT NULL;

-- Add foreign key constraint (optional, if you want to link to users table)
-- ALTER TABLE evacuees ADD CONSTRAINT fk_evacuees_user_id FOREIGN KEY (user_id) REFERENCES users(id);

-- Create index for better performance
CREATE INDEX idx_evacuees_user_id ON evacuees(user_id);
