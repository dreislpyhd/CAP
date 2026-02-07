-- First, let's check if there's a user with id=1, if not, we'll use a different approach

-- Step 1: Add the user_id column without default value and without foreign key
ALTER TABLE incidents ADD COLUMN user_id INT AFTER id;

-- Step 2: Update existing records to use a valid user_id (assuming there's at least one user)
-- This will set all existing incidents to belong to the first user in the users table
UPDATE incidents SET user_id = (SELECT MIN(id) FROM users LIMIT 1) WHERE user_id IS NULL;

-- Step 3: If no users exist, create a default user or set to a specific id
-- For now, let's set to 1 if no users exist (you can adjust this later)
UPDATE incidents SET user_id = 1 WHERE user_id IS NULL;

-- Step 4: Make the column NOT NULL
ALTER TABLE incidents MODIFY COLUMN user_id INT NOT NULL;

-- Step 5: Add the foreign key constraint
ALTER TABLE incidents ADD CONSTRAINT fk_incidents_user_id 
FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

-- Step 6: Add index for better performance
CREATE INDEX idx_incidents_user_id ON incidents(user_id);
