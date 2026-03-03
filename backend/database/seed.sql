-- PawBridge Seed Data
-- Sample data for local development and testing

USE pawbridge;

-- Insert sample users
INSERT INTO users (email, password_hash, role, name, phone) VALUES
-- Password: 'password123' (hashed with bcrypt)
('admin@pawbridge.org', '$2b$10$rOzJqQZ8kGjM8vQZ8kGjM8vQZ8kGjM8vQZ8kGjM8vQZ8kGjM8vQZ8k', 'admin', 'Admin User', '+1234567890'),
('citizen1@example.com', '$2b$10$rOzJqQZ8kGjM8vQZ8kGjM8vQZ8kGjM8vQZ8kGjM8vQZ8kGjM8vQZ8k', 'citizen', 'John Doe', '+1234567891'),
('citizen2@example.com', '$2b$10$rOzJqQZ8kGjM8vQZ8kGjM8vQZ8kGjM8vQZ8kGjM8vQZ8kGjM8vQZ8k', 'volunteer', 'Jane Smith', '+1234567892'),
('ngo1@example.com', '$2b$10$rOzJqQZ8kGjM8vQZ8kGjM8vQZ8kGjM8vQZ8kGjM8vQZ8kGjM8vQZ8k', 'ngo', 'Animal Rescue Foundation', '+1234567893'),
('ngo2@example.com', '$2b$10$rOzJqQZ8kGjM8vQZ8kGjM8vQZ8kGjM8vQZ8kGjM8vQZ8kGjM8vQZ8k', 'ngo', 'Paw Care Society', '+1234567894');

-- Insert sample NGOs
INSERT INTO ngos (user_id, organization_name, registration_number, address, latitude, longitude, state, description, is_verified) VALUES
(4, 'Animal Rescue Foundation', 'NGO001', '123 Main St, Delhi', 28.6139, 77.2090, 'Delhi', 'Dedicated to rescuing injured and abandoned animals', TRUE),
(5, 'Paw Care Society', 'NGO002', '456 Park Ave, Mumbai', 19.0760, 72.8777, 'Maharashtra', 'Providing medical care and shelter for stray animals', TRUE);

-- Insert sample volunteers
INSERT INTO volunteers (user_id, skills, availability, latitude, longitude, bio) VALUES
(3, 'Animal handling, First aid, Transportation', 'Weekends, Evenings', 28.7041, 77.1025, 'Passionate about animal welfare with 5 years of volunteering experience');

-- Insert sample animals for adoption
INSERT INTO animals (ngo_id, name, species, breed, age_years, age_months, gender, health_status, description, status) VALUES
(1, 'Buddy', 'dog', 'Golden Retriever Mix', 2, 6, 'male', 'Healthy, vaccinated', 'Friendly and energetic dog looking for a loving home', 'available'),
(1, 'Whiskers', 'cat', 'Persian', 1, 3, 'female', 'Healthy, spayed', 'Calm and affectionate cat, great with children', 'available'),
(2, 'Charlie', 'dog', 'Labrador', 3, 0, 'male', 'Recovering from minor injury', 'Well-trained dog, needs a patient family', 'available');

-- Insert sample animal images
INSERT INTO animal_images (animal_id, image_path, is_primary) VALUES
(1, '/uploads/images/buddy-1.jpg', TRUE),
(2, '/uploads/images/whiskers-1.jpg', TRUE),
(3, '/uploads/images/charlie-1.jpg', TRUE);

-- Insert sample volunteering opportunities
INSERT INTO volunteering_opportunities (ngo_id, title, description, required_skills, location, latitude, longitude, date, time, status) VALUES
(1, 'Weekend Animal Feeding', 'Help feed stray animals in the shelter', 'Animal handling, Patience', 'Animal Rescue Foundation Shelter', 28.6139, 77.2090, '2024-02-17', '09:00:00', 'open'),
(2, 'Medical Assistance', 'Assist veterinarians during medical checkups', 'Basic medical knowledge, Animal handling', 'Paw Care Society Clinic', 19.0760, 72.8777, '2024-02-18', '14:00:00', 'open');

-- Insert sample notifications
INSERT INTO notifications (user_id, title, message, type, is_read) VALUES
(2, 'Welcome to PawBridge', 'Thank you for joining our animal welfare community!', 'system_alert', FALSE),
(3, 'New Volunteering Opportunity', 'A new opportunity matching your skills has been posted', 'system_alert', FALSE),
(4, 'NGO Profile Verified', 'Your NGO profile has been verified and is now active', 'system_alert', TRUE);