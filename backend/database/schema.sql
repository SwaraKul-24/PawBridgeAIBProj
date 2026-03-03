-- PawBridge Database Schema
-- Phase 1: Local MySQL
-- Phase 2: Amazon RDS (same schema, different connection)

-- Create database
CREATE DATABASE IF NOT EXISTS pawbridge CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE pawbridge;

-- Users table
CREATE TABLE users (
  id INT PRIMARY KEY AUTO_INCREMENT,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role ENUM('citizen', 'ngo', 'volunteer', 'admin') NOT NULL,
  name VARCHAR(255) NOT NULL,
  phone VARCHAR(20),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  is_active BOOLEAN DEFAULT TRUE,
  INDEX idx_email (email),
  INDEX idx_role (role)
);

-- NGOs table
CREATE TABLE ngos (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  organization_name VARCHAR(255) NOT NULL,
  registration_number VARCHAR(100),
  address TEXT,
  latitude DECIMAL(10, 8) NOT NULL,
  longitude DECIMAL(11, 8) NOT NULL,
  state VARCHAR(100),
  description TEXT,
  website VARCHAR(255),
  total_donations DECIMAL(10, 2) DEFAULT 0,
  is_verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_location (latitude, longitude),
  INDEX idx_state (state),
  INDEX idx_verified (is_verified)
);

-- Reports table (injury reports)
CREATE TABLE reports (
  id INT PRIMARY KEY AUTO_INCREMENT,
  citizen_id INT NOT NULL,
  latitude DECIMAL(10, 8) NOT NULL,
  longitude DECIMAL(11, 8) NOT NULL,
  ai_generated_description TEXT,
  user_edited_description TEXT,
  animal_type ENUM('dog', 'cat', 'bird', 'other', 'unknown'),
  injury_severity ENUM('low', 'medium', 'high', 'critical', 'unknown'),
  ai_confidence DECIMAL(3, 2),
  status ENUM('submitted', 'under_review', 'assigned', 'in_progress', 'resolved', 'rejected', 'unassigned') DEFAULT 'submitted',
  assigned_ngo_id INT,
  allocation_attempts INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (citizen_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (assigned_ngo_id) REFERENCES ngos(id) ON DELETE SET NULL,
  INDEX idx_status (status),
  INDEX idx_citizen (citizen_id),
  INDEX idx_assigned_ngo (assigned_ngo_id),
  INDEX idx_created (created_at)
);

-- Report images table
CREATE TABLE report_images (
  id INT PRIMARY KEY AUTO_INCREMENT,
  report_id INT NOT NULL,
  image_path VARCHAR(500) NOT NULL,
  uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (report_id) REFERENCES reports(id) ON DELETE CASCADE,
  INDEX idx_report (report_id)
);

-- Report status history table
CREATE TABLE report_status_history (
  id INT PRIMARY KEY AUTO_INCREMENT,
  report_id INT NOT NULL,
  status ENUM('submitted', 'under_review', 'assigned', 'in_progress', 'resolved', 'rejected', 'unassigned'),
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (report_id) REFERENCES reports(id) ON DELETE CASCADE,
  INDEX idx_report (report_id)
);

-- Abuse reports table
CREATE TABLE abuse_reports (
  id INT PRIMARY KEY AUTO_INCREMENT,
  reporter_id INT NULL,
  tracking_id VARCHAR(50) UNIQUE NOT NULL,
  is_anonymous BOOLEAN DEFAULT FALSE,
  latitude DECIMAL(10, 8) NOT NULL,
  longitude DECIMAL(11, 8) NOT NULL,
  state_details TEXT,
  ai_generated_description TEXT,
  user_edited_description TEXT,
  abuse_type ENUM('physical_harm', 'neglect', 'confinement', 'abandonment', 'other', 'unknown'),
  abuse_severity ENUM('low', 'medium', 'high', 'critical', 'unknown'),
  ai_confidence DECIMAL(3, 2),
  status ENUM('submitted', 'under_review', 'assigned', 'in_progress', 'resolved', 'rejected', 'unassigned') DEFAULT 'submitted',
  assigned_ngo_id INT,
  allocation_attempts INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (reporter_id) REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY (assigned_ngo_id) REFERENCES ngos(id) ON DELETE SET NULL,
  INDEX idx_tracking_id (tracking_id),
  INDEX idx_status (status),
  INDEX idx_assigned_ngo (assigned_ngo_id),
  INDEX idx_is_anonymous (is_anonymous)
);

-- Abuse media table
CREATE TABLE abuse_media (
  id INT PRIMARY KEY AUTO_INCREMENT,
  abuse_report_id INT NOT NULL,
  media_type ENUM('image', 'video') NOT NULL,
  s3_url VARCHAR(500) NOT NULL,
  s3_key VARCHAR(500) NOT NULL,
  file_size_bytes INT,
  uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (abuse_report_id) REFERENCES abuse_reports(id) ON DELETE CASCADE,
  INDEX idx_abuse_report (abuse_report_id)
);

-- Notifications table
CREATE TABLE notifications (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  type ENUM('injury', 'abuse', 'adoption', 'donation', 'ngo_assignment', 'system_alert') NOT NULL,
  related_entity_type ENUM('report', 'abuse_report', 'animal', 'adoption_request', 'donation') NULL,
  related_entity_id INT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user_unread (user_id, is_read),
  INDEX idx_created (created_at),
  INDEX idx_type (type)
);

-- Animals table (for adoption)
CREATE TABLE animals (
  id INT PRIMARY KEY AUTO_INCREMENT,
  ngo_id INT NOT NULL,
  name VARCHAR(100) NOT NULL,
  species ENUM('dog', 'cat', 'bird', 'other') NOT NULL,
  breed VARCHAR(100),
  age_years INT,
  age_months INT,
  gender ENUM('male', 'female', 'unknown'),
  health_status TEXT,
  description TEXT,
  status ENUM('available', 'pending', 'adopted') DEFAULT 'available',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (ngo_id) REFERENCES ngos(id) ON DELETE CASCADE,
  INDEX idx_status (status),
  INDEX idx_ngo (ngo_id),
  INDEX idx_species (species)
);

-- Animal images table
CREATE TABLE animal_images (
  id INT PRIMARY KEY AUTO_INCREMENT,
  animal_id INT NOT NULL,
  image_path VARCHAR(500) NOT NULL,
  is_primary BOOLEAN DEFAULT FALSE,
  uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (animal_id) REFERENCES animals(id) ON DELETE CASCADE,
  INDEX idx_animal (animal_id)
);

-- Adoption requests table
CREATE TABLE adoption_requests (
  id INT PRIMARY KEY AUTO_INCREMENT,
  animal_id INT NOT NULL,
  citizen_id INT NOT NULL,
  message TEXT,
  status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
  ngo_notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (animal_id) REFERENCES animals(id) ON DELETE CASCADE,
  FOREIGN KEY (citizen_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_animal (animal_id),
  INDEX idx_citizen (citizen_id),
  INDEX idx_status (status)
);

-- Donations table
CREATE TABLE donations (
  id INT PRIMARY KEY AUTO_INCREMENT,
  citizen_id INT NOT NULL,
  total_amount DECIMAL(10, 2) NOT NULL,
  donor_latitude DECIMAL(10, 8) NOT NULL,
  donor_longitude DECIMAL(11, 8) NOT NULL,
  donor_state VARCHAR(100),
  search_radius VARCHAR(20),
  transaction_id VARCHAR(255),
  payment_status ENUM('pending', 'completed', 'failed') DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (citizen_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_citizen (citizen_id),
  INDEX idx_status (payment_status)
);

-- Donation distributions table
CREATE TABLE donation_distributions (
  id INT PRIMARY KEY AUTO_INCREMENT,
  donation_id INT NOT NULL,
  ngo_id INT NOT NULL,
  distributed_amount DECIMAL(10, 2) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (donation_id) REFERENCES donations(id) ON DELETE CASCADE,
  FOREIGN KEY (ngo_id) REFERENCES ngos(id) ON DELETE CASCADE,
  INDEX idx_donation (donation_id),
  INDEX idx_ngo (ngo_id)
);

-- Volunteers table
CREATE TABLE volunteers (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  skills TEXT,
  availability TEXT,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  bio TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user (user_id)
);

-- Volunteering opportunities table
CREATE TABLE volunteering_opportunities (
  id INT PRIMARY KEY AUTO_INCREMENT,
  ngo_id INT NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  required_skills TEXT,
  location VARCHAR(255),
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  date DATE,
  time TIME,
  status ENUM('open', 'filled', 'completed') DEFAULT 'open',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (ngo_id) REFERENCES ngos(id) ON DELETE CASCADE,
  INDEX idx_ngo (ngo_id),
  INDEX idx_status (status),
  INDEX idx_date (date)
);

-- Case rejections table (for tracking NGO rejections)
CREATE TABLE case_rejections (
  id INT PRIMARY KEY AUTO_INCREMENT,
  case_id INT NOT NULL,
  case_type ENUM('injury', 'abuse') NOT NULL,
  ngo_id INT NOT NULL,
  rejected_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY unique_rejection (case_id, case_type, ngo_id),
  FOREIGN KEY (ngo_id) REFERENCES ngos(id) ON DELETE CASCADE,
  INDEX idx_case (case_id, case_type)
);