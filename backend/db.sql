-- Enhanced PawBridge Database Schema
DROP DATABASE IF EXISTS pawbridge_db;
CREATE DATABASE pawbridge_db;
USE pawbridge_db;

-- 1. Role Master Table
CREATE TABLE role_master (
    rm_id INT AUTO_INCREMENT PRIMARY KEY,
    rm_name VARCHAR(50) NOT NULL UNIQUE
);

INSERT INTO role_master(rm_name) VALUES("admin");
INSERT INTO role_master(rm_name) VALUES("user");
INSERT INTO role_master(rm_name) VALUES("ngo/organisation");

-- 2. User Master Table
CREATE TABLE user_master (
    um_id INT AUTO_INCREMENT PRIMARY KEY,
    um_name VARCHAR(100) NOT NULL,
    um_email VARCHAR(100) NOT NULL UNIQUE,
    um_password VARCHAR(255) NOT NULL,
    um_contact VARCHAR(15),
    um_address TEXT,
    um_latitude DECIMAL(10, 8),
    um_longitude DECIMAL(11, 8),
    rm_id INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (rm_id) REFERENCES role_master(rm_id) ON DELETE SET NULL
);

-- 3. NGO Verification Table (Enhanced)
CREATE TABLE ngo_verification (
    ngo_id INT AUTO_INCREMENT PRIMARY KEY,
    ngo_name VARCHAR(100) NOT NULL,
    registration_number VARCHAR(50) NOT NULL UNIQUE,
    founder_name VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL,
    contact VARCHAR(15) NOT NULL,
    address VARCHAR(255) NOT NULL,
    ngo_latitude DECIMAL(10, 8),
    ngo_longitude DECIMAL(11, 8),
    document_path VARCHAR(255) NOT NULL,
    status ENUM('Pending','Approved','Rejected') DEFAULT 'Pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    verified_at TIMESTAMP NULL,
    um_id INT NULL, -- Link to user_master when approved
    FOREIGN KEY (um_id) REFERENCES user_master(um_id) ON DELETE SET NULL
);

-- 4. Animal Type Master
CREATE TABLE animal_type_master (
    atm_id INT AUTO_INCREMENT PRIMARY KEY,
    atm_name VARCHAR(50) NOT NULL UNIQUE
);

INSERT INTO animal_type_master(atm_name) VALUES('cat');
INSERT INTO animal_type_master(atm_name) VALUES('dog');
INSERT INTO animal_type_master(atm_name) VALUES('snake');
INSERT INTO animal_type_master(atm_name) VALUES('cow');
INSERT INTO animal_type_master(atm_name) VALUES('goat');
INSERT INTO animal_type_master(atm_name) VALUES('sheep');

-- 5. Injury Report Table (Enhanced)
CREATE TABLE injury_report (
    ir_id INT AUTO_INCREMENT PRIMARY KEY,
    um_id INT NOT NULL,  -- reported by which user
    atm_id INT NOT NULL,
    ir_latitude DECIMAL(10, 8) NOT NULL,
    ir_longitude DECIMAL(11, 8) NOT NULL,
    ir_location_address VARCHAR(300),
    ir_description TEXT,
    ir_image_url VARCHAR(255),
    ir_status ENUM('Pending', 'Accepted', 'NGO_Departing', 'NGO_Arrived', 'Under_Treatment', 'Treated', 'Transferred', 'Rejected') DEFAULT 'Pending',
    assigned_ngo_id INT NULL,
    created_on TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_on TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (um_id) REFERENCES user_master(um_id) ON DELETE CASCADE,
    FOREIGN KEY (atm_id) REFERENCES animal_type_master(atm_id) ON DELETE CASCADE,
    FOREIGN KEY (assigned_ngo_id) REFERENCES user_master(um_id) ON DELETE SET NULL
);
---------------------------  imp ---------------
ALTER TABLE injury_report
ADD severity ENUM('Low','Medium','Critical') DEFAULT 'Medium';

-- 6. NGO Response/Tracking Table
CREATE TABLE ngo_response (
    nr_id INT AUTO_INCREMENT PRIMARY KEY,
    ir_id INT NOT NULL,
    ngo_id INT NOT NULL,
    response_type ENUM('Accept', 'Reject') NOT NULL,
    response_message TEXT,
    distance_km DECIMAL(5, 2),
    estimated_arrival INT, -- minutes
    responded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (ir_id) REFERENCES injury_report(ir_id) ON DELETE CASCADE,
    FOREIGN KEY (ngo_id) REFERENCES user_master(um_id) ON DELETE CASCADE
);

-- 7. Status Updates Table (For tracking)
CREATE TABLE status_updates (
    su_id INT AUTO_INCREMENT PRIMARY KEY,
    ir_id INT NOT NULL,
    ngo_id INT NOT NULL,
    status_type ENUM('Departing', 'Arrived', 'Treatment_Started', 'Treatment_Complete', 'Transferred') NOT NULL,
    update_message TEXT,
    update_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (ir_id) REFERENCES injury_report(ir_id) ON DELETE CASCADE,
    FOREIGN KEY (ngo_id) REFERENCES user_master(um_id) ON DELETE CASCADE
);

-- 8. Adoption Posts Table
CREATE TABLE adoption_posts (
    ap_id INT AUTO_INCREMENT PRIMARY KEY,
    ngo_id INT NOT NULL,
    animal_name VARCHAR(100),
    atm_id INT NOT NULL,
    breed VARCHAR(100),
    age_months INT,
    gender ENUM('Male', 'Female', 'Unknown'),
    description TEXT,
    image_url VARCHAR(255),
    is_available BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (ngo_id) REFERENCES user_master(um_id) ON DELETE CASCADE,
    FOREIGN KEY (atm_id) REFERENCES animal_type_master(atm_id) ON DELETE CASCADE
);

-- 9. Donations Tracking (Placeholder for future)
CREATE TABLE donations (
    d_id INT AUTO_INCREMENT PRIMARY KEY,
    donor_name VARCHAR(100),
    donor_email VARCHAR(100),
    amount DECIMAL(10, 2),
    donation_type ENUM('UPI', 'Cash', 'Other') DEFAULT 'UPI',
    transaction_id VARCHAR(100),
    region VARCHAR(100),
    donated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 10. Notifications Table
CREATE TABLE notifications (
    n_id INT AUTO_INCREMENT PRIMARY KEY,
    recipient_id INT NOT NULL, -- user_master.um_id
    notification_type ENUM('Injury_Report', 'Status_Update', 'NGO_Response', 'Adoption_Inquiry') NOT NULL,
    title VARCHAR(200) NOT NULL,
    message TEXT NOT NULL,
    related_id INT, -- could be ir_id, ap_id, etc.
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (recipient_id) REFERENCES user_master(um_id) ON DELETE CASCADE
);

-- Sample data for testing
INSERT INTO user_master (um_name, um_email, um_password, rm_id, um_latitude, um_longitude) VALUES
('Admin User', 'pawbridge.team@gmail.com', 'admin123', 1, 18.5204, 73.8567),
('Swara Kulkarni', 'swarakulkarni2005@gmail.com', 'Swara12', 2, 18.5204, 73.8567),
('Animal Care NGO', 'swaraaditiabsscomp23@gmail.com', 'ngo123', 3, 18.5300, 73.8600);

INSERT INTO donations (donor_name, amount, region) VALUES
('Anonymous', 5000, 'Pune');

-- Add to injury_report table
ALTER TABLE injury_report 
ADD COLUMN attempted_ngos JSON DEFAULT NULL COMMENT 'Array of NGO IDs that have been tried',
ADD COLUMN available_ngos JSON DEFAULT NULL COMMENT 'Queue of NGO IDs still to try within 10km',
ADD COLUMN routing_exhausted BOOLEAN DEFAULT FALSE COMMENT 'True when all NGOs within 10km have rejected';

ALTER TABLE status_updates 
MODIFY COLUMN status_type ENUM('Pending', 'Accepted', 'Rejected', 'Resolved', 'NGO_Arrived');

-------------------------NEW DONATION TABLE-------------------------------------------
DROP TABLE donations;

CREATE TABLE donations (
    donation_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    donor_name VARCHAR(100),
    email VARCHAR(100),
    amount DECIMAL(10,2),
    transaction_id VARCHAR(100),
    status VARCHAR(20) DEFAULT 'success',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

--------------------------VOLUNTEERS TABLES------------------------------------------
CREATE TABLE volunteer_opportunities (
    vo_id INT AUTO_INCREMENT PRIMARY KEY,
    ngo_id INT NOT NULL,
    ngo_name VARCHAR(150),
    title VARCHAR(100) NOT NULL,
    location VARCHAR(150) NOT NULL,
    duration VARCHAR(100) NOT NULL,
    volunteers_needed INT NOT NULL,
    deadline DATE,
    skills VARCHAR(255),
    description TEXT,
    instructions TEXT,
    badges JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE volunteer_applications (
    va_id INT AUTO_INCREMENT PRIMARY KEY,

    vo_id INT NOT NULL,
    ngo_id INT NOT NULL,
    um_id INT,

    applicant_name VARCHAR(150),
    applicant_email VARCHAR(150),
    applicant_mobile VARCHAR(20),
    applicant_location VARCHAR(150),

    skills TEXT,
    motivation TEXT,
    availability VARCHAR(100),

    applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (vo_id) REFERENCES volunteer_opportunities(vo_id)
);
-----------------------------IMP-------------------------
ALTER TABLE volunteer_applications
ADD CONSTRAINT fk_volunteer_user
FOREIGN KEY (um_id) REFERENCES user_master(um_id)
ON DELETE CASCADE;

ALTER TABLE volunteer_applications
ADD COLUMN status ENUM('pending','accepted','rejected') DEFAULT 'pending';