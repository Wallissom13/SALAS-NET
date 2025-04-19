-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  username TEXT NOT NULL UNIQUE,
  password TEXT NOT NULL,
  is_admin BOOLEAN NOT NULL DEFAULT FALSE
);

-- Create classes table
CREATE TABLE IF NOT EXISTS classes (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE
);

-- Create students table
CREATE TABLE IF NOT EXISTS students (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  class_id INTEGER NOT NULL
);

-- Create reports table
CREATE TABLE IF NOT EXISTS reports (
  id SERIAL PRIMARY KEY,
  student_id INTEGER NOT NULL,
  content TEXT NOT NULL,
  date TIMESTAMP NOT NULL,
  reporter_type TEXT NOT NULL,
  created_by INTEGER NOT NULL
);

-- Create admin user if it doesn't exist
INSERT INTO users (username, password, is_admin)
VALUES ('Wallisson10', 'CEPI10', TRUE)
ON CONFLICT (username) DO NOTHING;

-- Create classes if they don't exist
INSERT INTO classes (name) VALUES 
('6A'), ('6B'), ('6C'), ('7A'), ('7B'), ('7C'), ('8A'), ('8B'), ('9B')
ON CONFLICT (name) DO NOTHING;

-- Remove 9A and 9C if they exist
DELETE FROM classes WHERE name IN ('9A', '9C');