# PawBridge - Design Document

## High-Level Architecture

PawBridge follows a three-tier architecture with clear separation between presentation, business logic, and data layers.

### Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                     Client Layer                        │
│              (React SPA + Leaflet Maps)                 │
└─────────────────────────────────────────────────────────┘
                          │
                    HTTPS/REST API
                          │
┌─────────────────────────────────────────────────────────┐
│                   Application Layer                     │
│                  (Node.js + Express)                    │
│  ┌──────────┬──────────┬──────────┬──────────────────┐ │
│  │  Auth    │  Report  │ Adoption │  Donation/Vol    │ │
│  │ Service  │ Service  │ Service  │    Services      │ │
│  └──────────┴──────────┴──────────┴──────────────────┘ │
└─────────────────────────────────────────────────────────┘
                          │
              ┌───────────┼───────────┐
              │           │           │
         ┌────▼────┐ ┌───▼────┐ ┌───▼─────┐
         │  MySQL  │ │   AI   │ │  File   │
         │Database │ │ Service│ │ Storage │
         └─────────┘ └────────┘ └─────────┘
```

### Technology Stack

- **Frontend**: React 18+ with React Router, Axios, Leaflet
- **Backend**: Node.js with Express.js
- **Database**: MySQL 8.0+
- **Maps**: OpenStreetMap with Leaflet.js
- **AI**: Computer Vision model (TensorFlow.js or external API)
- **Authentication**: JWT tokens
- **File Storage**: Cloud storage (S3-compatible) for images up to 25MB
- **Notifications**: Email service (NodeMailer) or SMS gateway


## Component Breakdown

### Frontend Components

#### 1. Core Layout Components
- **App.js**: Main application wrapper with routing
- **Header**: Navigation bar with user menu
- **Footer**: Platform information and links
- **Sidebar**: Role-based navigation menu

#### 2. Authentication Components
- **LoginPage**: User login form
- **RegisterPage**: User registration with role selection
- **ProfilePage**: User profile management

#### 3. Injury Reporting Components
- **ReportForm**: Image upload, location capture, description
- **ReportList**: Display user's submitted reports
- **ReportDetail**: View single report with status timeline
- **NGODashboard**: NGO view of incoming reports
- **CaseManagement**: NGO interface for accepting/updating cases

#### 4. Adoption Components
- **AnimalList**: Browse available animals with filters
- **AnimalDetail**: Detailed animal profile
- **AnimalForm**: NGO form to add/edit animals
- **AdoptionRequestForm**: Citizen adoption request
- **AdoptionManagement**: NGO interface for reviewing requests

#### 5. Donation Components
- **NGOList**: Browse NGOs accepting donations
- **NGOProfile**: NGO details and donation page
- **DonationForm**: Payment interface (mock)
- **DonationHistory**: User's donation records

#### 6. Volunteering Components
- **VolunteerProfile**: Volunteer registration/profile
- **OpportunityList**: Browse volunteering opportunities
- **OpportunityForm**: NGO form to post opportunities
- **VolunteerDirectory**: NGO view of registered volunteers

#### 7. Chatbot Component
- **Chatbot**: Simple rule-based chatbot widget

#### 8. Map Components
- **MapView**: Leaflet map for location display/selection
- **LocationPicker**: Interactive map for selecting location

### Backend Services

#### 1. Authentication Service
- User registration (Citizen, NGO, Volunteer, Admin)
- Login with JWT token generation
- Password hashing with bcrypt
- Role-based access control middleware
- Token validation and refresh

#### 2. Report Service
- Create injury report
- Upload and store images
- Trigger AI analysis
- Calculate NGO distances
- Allocate report to nearest NGO
- Handle NGO responses (accept/reject)
- Reallocate on timeout or rejection
- Update case status
- Retrieve report history

#### 3. AI Service
- Receive image for analysis
- Run computer vision model
- Classify animal type (dog, cat, bird, other)
- Detect injury severity (low, medium, high, critical)
- Generate automatic preliminary injury description
- Return classification results and generated description
- Handle analysis failures gracefully

#### 4. Adoption Service
- CRUD operations for animal listings
- Filter and search animals
- Create adoption requests
- Approve/reject adoption requests
- Update animal status

#### 5. Donation Service
- Record donations with geographic distribution
- Identify NGOs within donor's vicinity
- Calculate equal distribution among nearby NGOs
- Create donation distribution records
- Retrieve donation history with distribution details
- Calculate NGO donation totals
- Generate transparency logs

#### 6. Volunteering Service
- CRUD operations for volunteer profiles
- CRUD operations for opportunities
- Filter volunteers by criteria
- Filter opportunities by criteria

#### 7. Notification Service
- Send email notifications
- Send SMS notifications (optional)
- Queue notification jobs
- Track delivery status

#### 8. Location Service
- Calculate distance between coordinates
- Find NGOs within radius
- Integrate with OpenStreetMap API
- Geocoding and reverse geocoding


## AI Module Explanation

### System Workflow

The injury reporting system operates with AI-assisted capabilities:
1. **Image Analysis**: Classify animal type and injury severity
2. **Description Generation**: Generate preliminary injury descriptions from image analysis
3. **Location-Based Routing**: Calculate distances and allocate to nearest NGO
4. **Automatic Reallocation**: Reassign cases on timeout/rejection to all eligible NGOs

The system does NOT include:
- Abuse detection
- Legal case analysis
- Predictive analytics
- Behavioral learning
- Recommendation systems
- Advanced decision-making

### Computer Vision Model

#### Model Architecture
- **Option 1**: Pre-trained model (MobileNet, ResNet) fine-tuned on animal injury dataset
- **Option 2**: External API (e.g., Google Vision API, Azure Computer Vision) with custom classification
- **Option 3**: TensorFlow.js model running in Node.js backend

#### Input
- Image file (JPEG/PNG, max 25MB)
- Preprocessed to standard dimensions (e.g., 224x224)

#### Output
```json
{
  "animalType": "dog" | "cat" | "bird" | "other",
  "injurySeverity": "low" | "medium" | "high" | "critical",
  "generatedDescription": "Dog with visible wound on left hind leg, appears to be bleeding",
  "confidence": 0.85,
  "processingTime": 3.2
}
```

#### Classification Logic

**Animal Type**:
- dog: Canine species
- cat: Feline species
- bird: Avian species
- other: Unidentified or other animals

**Injury Severity**:
- low: Minor wounds, scratches
- medium: Visible injuries, limping
- high: Severe wounds, bleeding
- critical: Life-threatening condition

#### Fallback Mechanism
- If confidence < 0.6, mark as "unknown" and flag for manual review
- If model fails, default to "other" animal type and "medium" severity
- Log all failures for model improvement

### NGO Allocation Algorithm

```
1. Extract report location (latitude, longitude)
2. Query database for all active NGOs
3. Calculate distance from report location to each NGO using Haversine formula
4. Filter NGOs within 10 km radius
5. Sort by distance (ascending)
6. Create list of all eligible NGOs within radius
7. Select nearest NGO from list
8. Send notification to NGO
9. Start 30-minute timeout timer
10. If NGO accepts:
    - Assign case to NGO
    - Notify citizen
    - End process
11. If NGO rejects or timeout:
    - Mark attempt as failed
    - Remove NGO from eligible list
    - If eligible NGOs remain in list:
      - Select next nearest NGO
      - Go to step 8
    - Else (all NGOs attempted):
      - Mark case as "unassigned"
      - Notify citizen
      - End process
```

### Distance Calculation

Using Haversine formula for geographic distance:

```javascript
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth radius in km
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
            Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}
```


## Database Schema Overview

### Users Table
```sql
CREATE TABLE users (
  id INT PRIMARY KEY AUTO_INCREMENT,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role ENUM('citizen', 'ngo', 'volunteer', 'admin') NOT NULL,
  name VARCHAR(255) NOT NULL,
  phone VARCHAR(20),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  is_active BOOLEAN DEFAULT TRUE
);
```

### NGOs Table
```sql
CREATE TABLE ngos (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  organization_name VARCHAR(255) NOT NULL,
  registration_number VARCHAR(100),
  address TEXT,
  latitude DECIMAL(10, 8) NOT NULL,
  longitude DECIMAL(11, 8) NOT NULL,
  description TEXT,
  website VARCHAR(255),
  total_donations DECIMAL(10, 2) DEFAULT 0,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
```

### Reports Table
```sql
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
  status ENUM('Pending', 'Accepted', 'NGO_Departing', 'NGO_Arrived', 'Under_Treatment', 'Treated', 'Transferred', 'Rejected', 'Deceased', 'Unassigned') DEFAULT 'Pending',
  assigned_ngo_id INT,
  allocation_attempts INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (citizen_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (assigned_ngo_id) REFERENCES ngos(id) ON DELETE SET NULL
);
```

### Report Images Table
```sql
CREATE TABLE report_images (
  id INT PRIMARY KEY AUTO_INCREMENT,
  report_id INT NOT NULL,
  image_path VARCHAR(500) NOT NULL,
  uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (report_id) REFERENCES reports(id) ON DELETE CASCADE
);
```

### Report Status History Table
```sql
CREATE TABLE report_status_history (
  id INT PRIMARY KEY AUTO_INCREMENT,
  report_id INT NOT NULL,
  status ENUM('Pending', 'Accepted', 'NGO_Departing', 'NGO_Arrived', 'Under_Treatment', 'Treated', 'Transferred', 'Rejected', 'Deceased', 'Unassigned'),
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (report_id) REFERENCES reports(id) ON DELETE CASCADE
);
```

### Allocation Attempts Table
```sql
CREATE TABLE allocation_attempts (
  id INT PRIMARY KEY AUTO_INCREMENT,
  report_id INT NOT NULL,
  ngo_id INT NOT NULL,
  attempt_number INT NOT NULL,
  response ENUM('pending', 'accepted', 'rejected', 'timeout'),
  responded_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (report_id) REFERENCES reports(id) ON DELETE CASCADE,
  FOREIGN KEY (ngo_id) REFERENCES ngos(id) ON DELETE CASCADE
);
```

### Animals Table
```sql
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
  FOREIGN KEY (ngo_id) REFERENCES ngos(id) ON DELETE CASCADE
);
```

### Animal Images Table
```sql
CREATE TABLE animal_images (
  id INT PRIMARY KEY AUTO_INCREMENT,
  animal_id INT NOT NULL,
  image_path VARCHAR(500) NOT NULL,
  is_primary BOOLEAN DEFAULT FALSE,
  uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (animal_id) REFERENCES animals(id) ON DELETE CASCADE
);
```

### Adoption Requests Table
```sql
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
  FOREIGN KEY (citizen_id) REFERENCES users(id) ON DELETE CASCADE
);
```

### Donations Table
```sql
CREATE TABLE donations (
  id INT PRIMARY KEY AUTO_INCREMENT,
  citizen_id INT NOT NULL,
  total_amount DECIMAL(10, 2) NOT NULL,
  donor_latitude DECIMAL(10, 8) NOT NULL,
  donor_longitude DECIMAL(11, 8) NOT NULL,
  transaction_id VARCHAR(255),
  payment_status ENUM('pending', 'completed', 'failed') DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (citizen_id) REFERENCES users(id) ON DELETE CASCADE
);
```

### Donation Distributions Table
```sql
CREATE TABLE donation_distributions (
  id INT PRIMARY KEY AUTO_INCREMENT,
  donation_id INT NOT NULL,
  ngo_id INT NOT NULL,
  distributed_amount DECIMAL(10, 2) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (donation_id) REFERENCES donations(id) ON DELETE CASCADE,
  FOREIGN KEY (ngo_id) REFERENCES ngos(id) ON DELETE CASCADE
);
```

### Volunteers Table
```sql
CREATE TABLE volunteers (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  skills TEXT,
  availability TEXT,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  bio TEXT,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
```

### Volunteering Opportunities Table
```sql
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
  FOREIGN KEY (ngo_id) REFERENCES ngos(id) ON DELETE CASCADE
);
```


## API Structure Overview

### Authentication Endpoints

```
POST   /api/auth/register          - Register new user
POST   /api/auth/login             - Login user
POST   /api/auth/logout            - Logout user
GET    /api/auth/me                - Get current user profile
PUT    /api/auth/profile           - Update user profile
POST   /api/auth/change-password   - Change password
```

### Report Endpoints

```
POST   /api/reports                - Create new injury report
GET    /api/reports                - Get all reports (filtered by role)
GET    /api/reports/:id            - Get single report details
PUT    /api/reports/:id/status     - Update report status (NGO only)
POST   /api/reports/:id/accept     - Accept report (NGO only)
POST   /api/reports/:id/reject     - Reject report (NGO only)
GET    /api/reports/:id/history    - Get status history
POST   /api/reports/analyze        - Trigger AI analysis (internal)
```

### NGO Endpoints

```
GET    /api/ngos                   - Get all NGOs
GET    /api/ngos/:id               - Get NGO details
PUT    /api/ngos/:id               - Update NGO profile (NGO only)
GET    /api/ngos/nearby            - Get NGOs within radius
```

### Animal/Adoption Endpoints

```
POST   /api/animals                - Create animal listing (NGO only)
GET    /api/animals                - Get all available animals
GET    /api/animals/:id            - Get animal details
PUT    /api/animals/:id            - Update animal (NGO only)
DELETE /api/animals/:id            - Delete animal (NGO only)
POST   /api/adoptions              - Create adoption request
GET    /api/adoptions              - Get adoption requests (filtered by role)
PUT    /api/adoptions/:id          - Update adoption status (NGO only)
```

### Donation Endpoints

```
POST   /api/donations              - Create donation with geographic distribution
GET    /api/donations              - Get donation history with distribution details
GET    /api/donations/:id          - Get specific donation with distribution breakdown
GET    /api/ngos/:id/donations     - Get donations received by specific NGO
```

### Volunteering Endpoints

```
POST   /api/volunteers             - Create/update volunteer profile
GET    /api/volunteers             - Get all volunteers (NGO only)
GET    /api/volunteers/:id         - Get volunteer details
POST   /api/opportunities          - Create opportunity (NGO only)
GET    /api/opportunities          - Get all opportunities
GET    /api/opportunities/:id      - Get opportunity details
PUT    /api/opportunities/:id      - Update opportunity (NGO only)
DELETE /api/opportunities/:id      - Delete opportunity (NGO only)
```

### Notification Endpoints

```
GET    /api/notifications          - Get user notifications
PUT    /api/notifications/:id/read - Mark notification as read
```

### Admin Endpoints

```
GET    /api/admin/users            - Get all users
PUT    /api/admin/users/:id        - Update user status
GET    /api/admin/reports          - Get all reports with analytics
GET    /api/admin/stats            - Get platform statistics
```

### Request/Response Examples

#### Create Report
```
POST /api/reports
Content-Type: multipart/form-data

{
  "latitude": 28.6139,
  "longitude": 77.2090,
  "userEditedDescription": "Injured dog near park - user edited this",
  "images": [File, File]  // Max 25MB per file
}

Response:
{
  "success": true,
  "data": {
    "id": 123,
    "status": "Pending",
    "animalType": "dog",
    "injurySeverity": "medium",
    "aiGeneratedDescription": "Dog with visible wound on left hind leg",
    "userEditedDescription": "Injured dog near park - user edited this",
    "aiConfidence": 0.87,
    "assignedNgo": null,
    "createdAt": "2026-02-15T10:30:00Z"
  }
}
```

#### Accept Report (NGO)
```
POST /api/reports/123/accept

Response:
{
  "success": true,
  "message": "Report accepted successfully",
  "data": {
    "id": 123,
    "status": "Accepted",
    "assignedNgo": {
      "id": 45,
      "name": "Animal Rescue Foundation"
    }
  }
}
```

#### Create Donation with Distribution
```
POST /api/donations
Content-Type: application/json

{
  "amount": 1000,
  "latitude": 28.6139,
  "longitude": 77.2090
}

Response:
{
  "success": true,
  "data": {
    "id": 456,
    "totalAmount": 1000,
    "distributionDetails": [
      {
        "ngoId": 12,
        "ngoName": "Animal Rescue Foundation",
        "distributedAmount": 333.33
      },
      {
        "ngoId": 18,
        "ngoName": "Paw Care NGO",
        "distributedAmount": 333.33
      },
      {
        "ngoId": 25,
        "ngoName": "Street Animal Welfare",
        "distributedAmount": 333.34
      }
    ],
    "paymentStatus": "pending",
    "createdAt": "2026-02-15T10:30:00Z"
  }
}
```


## Data Flow Description

### Injury Report Flow

```
1. Citizen opens report form
   ↓
2. Browser captures GPS location
   ↓
3. Citizen uploads image(s) (max 25MB per file)
   ↓
4. Frontend sends POST /api/reports with multipart data
   ↓
5. Backend validates file type and size
   ↓
6. Backend saves images to cloud storage
   ↓
7. Backend calls AI Service with image
   ↓
8. AI Service analyzes image and returns classification + generated description
   ↓
9. Frontend displays AI-generated description to user
   ↓
10. User edits description if needed
    ↓
11. User submits final report with edited description
    ↓
12. Backend saves report with AI results and user-edited description to database
    ↓
13. Backend calls Location Service to find all NGOs within 10 km radius
    ↓
14. Location Service calculates distances and returns sorted list of eligible NGOs
    ↓
15. Backend selects nearest NGO from eligible list and creates allocation attempt
    ↓
16. Backend calls Notification Service to alert NGO
    ↓
17. Notification Service sends real-time email/SMS to NGO
    ↓
18. Backend starts 30-minute timeout timer
    ↓
19. Backend returns success response to frontend
    ↓
20. Frontend shows confirmation to citizen

--- NGO Response Path ---

21a. NGO logs in and sees real-time notification
     ↓
22a. NGO clicks "Accept"
     ↓
23a. Frontend sends POST /api/reports/:id/accept
     ↓
24a. Backend updates report status to "Accepted"
     ↓
25a. Backend sends real-time notification to citizen
     ↓
26a. NGO can update status (NGO_Departing, NGO_Arrived, Under_Treatment, Treated, Transferred, Deceased)
     ↓
27a. Each status update triggers real-time notification to citizen

OR

21b. NGO clicks "Reject" or timeout occurs
     ↓
22b. Backend marks attempt as failed
     ↓
23b. Backend removes NGO from eligible list
     ↓
24b. If more eligible NGOs remain within 10 km radius:
     ↓
25b. Backend selects next nearest NGO from list
     ↓
26b. Go to step 15
     ↓
27b. Else (all NGOs attempted): Mark report as "Unassigned" and notify citizen
```

### Adoption Request Flow

```
1. Citizen browses animals
   ↓
2. Frontend sends GET /api/animals
   ↓
3. Backend queries database for available animals
   ↓
4. Frontend displays animal cards
   ↓
5. Citizen clicks on animal to view details
   ↓
6. Citizen clicks "Request Adoption"
   ↓
7. Frontend sends POST /api/adoptions
   ↓
8. Backend creates adoption request in database
   ↓
9. Backend notifies NGO
   ↓
10. NGO reviews request
    ↓
11. NGO approves or rejects
    ↓
12. Frontend sends PUT /api/adoptions/:id
    ↓
13. Backend updates request status
    ↓
14. Backend notifies citizen
    ↓
15. If approved, animal status changes to "pending"
    ↓
16. NGO manually marks as "adopted" after completion
```

### Donation Flow

```
1. Citizen enters donation amount on platform
   ↓
2. System captures donor's GPS location
   ↓
3. Frontend sends POST /api/donations with amount and location
   ↓
4. Backend calls Location Service to find all NGOs within donor's vicinity
   ↓
5. Location Service returns list of nearby NGOs
   ↓
6. Backend calculates equal distribution amount per NGO
   ↓
7. Backend creates donation record with "pending" status
   ↓
8. Backend creates distribution records for each NGO
   ↓
9. Backend redirects to payment gateway (mock for MVP)
   ↓
10. Payment gateway processes payment
    ↓
11. Payment gateway sends callback to backend
    ↓
12. Backend updates donation status to "completed"
    ↓
13. Backend updates each NGO's total_donations with their distributed share
    ↓
14. Backend logs: total amount, list of recipient NGOs, distributed share per NGO
    ↓
15. Backend notifies citizen with distribution details
    ↓
16. Backend notifies each recipient NGO
    ↓
17. Frontend shows confirmation with distribution breakdown
```

### Volunteer Coordination Flow

```
1. Citizen creates volunteer profile
   ↓
2. Frontend sends POST /api/volunteers
   ↓
3. Backend saves volunteer profile
   ↓
4. NGO posts volunteering opportunity
   ↓
5. Frontend sends POST /api/opportunities
   ↓
6. Backend saves opportunity
   ↓
7. Volunteer browses opportunities
   ↓
8. Frontend sends GET /api/opportunities
   ↓
9. Backend returns filtered opportunities
   ↓
10. NGO browses volunteers
    ↓
11. Frontend sends GET /api/volunteers
    ↓
12. Backend returns filtered volunteers
    ↓
13. NGO contacts volunteer directly (outside platform)
```


## Deployment Considerations

### Environment Setup

#### Development Environment
```
- Node.js v18+ installed
- MySQL 8.0+ running locally
- npm or yarn package manager
- Git for version control
- Environment variables in .env file
```

#### Environment Variables
```
# Server
PORT=3000
NODE_ENV=development

# Database
DB_HOST=localhost
DB_PORT=3306
DB_NAME=pawbridge
DB_USER=root
DB_PASSWORD=password

# JWT
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=7d

# File Upload
CLOUD_STORAGE_BUCKET=pawbridge-images
MAX_FILE_SIZE=26214400  # 25MB in bytes
ALLOWED_FILE_TYPES=image/jpeg,image/png

# AI Service
AI_SERVICE_URL=http://localhost:5000
AI_API_KEY=your-api-key

# Maps
OSM_API_URL=https://nominatim.openstreetmap.org

# Notifications
EMAIL_SERVICE=gmail
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password
SMS_API_KEY=your-sms-api-key

# Frontend
REACT_APP_API_URL=http://localhost:3000/api
REACT_APP_MAP_TILE_URL=https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png
```

### Project Structure

```
pawbridge/
├── backend/
│   ├── src/
│   │   ├── config/
│   │   │   ├── database.js
│   │   │   └── config.js
│   │   ├── middleware/
│   │   │   ├── auth.js
│   │   │   ├── errorHandler.js
│   │   │   └── upload.js
│   │   ├── models/
│   │   │   ├── User.js
│   │   │   ├── NGO.js
│   │   │   ├── Report.js
│   │   │   ├── Animal.js
│   │   │   └── ...
│   │   ├── routes/
│   │   │   ├── auth.js
│   │   │   ├── reports.js
│   │   │   ├── animals.js
│   │   │   └── ...
│   │   ├── services/
│   │   │   ├── aiService.js
│   │   │   ├── locationService.js
│   │   │   ├── notificationService.js
│   │   │   └── allocationService.js
│   │   ├── utils/
│   │   │   ├── validators.js
│   │   │   └── helpers.js
│   │   └── app.js
│   ├── uploads/
│   ├── .env
│   ├── package.json
│   └── server.js
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   │   ├── common/
│   │   │   ├── auth/
│   │   │   ├── reports/
│   │   │   ├── animals/
│   │   │   ├── donations/
│   │   │   ├── volunteers/
│   │   │   └── chatbot/
│   │   ├── pages/
│   │   ├── services/
│   │   │   └── api.js
│   │   ├── utils/
│   │   ├── App.js
│   │   └── index.js
│   ├── .env
│   └── package.json
├── database/
│   ├── schema.sql
│   └── seed.sql
└── README.md
```

### Database Setup

```sql
-- Create database
CREATE DATABASE pawbridge CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Run schema.sql to create tables
SOURCE database/schema.sql;

-- Run seed.sql to populate initial data (optional)
SOURCE database/seed.sql;
```

### Installation Steps

```bash
# Clone repository
git clone <repository-url>
cd pawbridge

# Backend setup
cd backend
npm install
cp .env.example .env
# Edit .env with your configuration
npm run migrate  # Run database migrations
npm run dev      # Start development server

# Frontend setup (in new terminal)
cd frontend
npm install
cp .env.example .env
# Edit .env with your configuration
npm start        # Start React development server
```

### Production Deployment

#### Hosting Options
- **Backend**: Heroku, AWS EC2, DigitalOcean, Railway
- **Frontend**: Vercel, Netlify, AWS S3 + CloudFront
- **Database**: AWS RDS, DigitalOcean Managed MySQL, PlanetScale
- **File Storage**: AWS S3, Cloudinary, DigitalOcean Spaces
- **AI Service**: AWS SageMaker, Google Cloud AI, separate microservice

#### Production Checklist
- [ ] Set NODE_ENV=production
- [ ] Use strong JWT_SECRET
- [ ] Enable HTTPS/SSL
- [ ] Configure CORS properly
- [ ] Set up database backups
- [ ] Configure CDN for static assets
- [ ] Set up error logging (Sentry, LogRocket)
- [ ] Configure rate limiting
- [ ] Set up monitoring (PM2, New Relic)
- [ ] Optimize images and assets
- [ ] Enable gzip compression
- [ ] Set up CI/CD pipeline
- [ ] Configure firewall rules
- [ ] Set up automated testing

### Performance Optimization

#### Backend
- Use connection pooling for database
- Implement caching (Redis) for frequently accessed data
- Optimize database queries with indexes
- Use pagination for large datasets
- Compress API responses
- Implement request rate limiting

#### Frontend
- Code splitting with React.lazy()
- Image optimization and lazy loading
- Minimize bundle size
- Use CDN for static assets
- Implement service workers for offline support
- Cache API responses

#### Database Indexes
```sql
-- Optimize common queries
CREATE INDEX idx_reports_citizen ON reports(citizen_id);
CREATE INDEX idx_reports_ngo ON reports(assigned_ngo_id);
CREATE INDEX idx_reports_status ON reports(status);
CREATE INDEX idx_ngos_location ON ngos(latitude, longitude);
CREATE INDEX idx_animals_status ON animals(status);
CREATE INDEX idx_animals_ngo ON animals(ngo_id);
```

### Security Measures

- Input validation and sanitization
- SQL injection prevention (parameterized queries)
- XSS protection (Content Security Policy)
- CSRF protection
- Rate limiting on API endpoints
- File upload validation (type, size, content)
- Password strength requirements
- Secure session management
- HTTPS enforcement
- Regular security audits
- Dependency vulnerability scanning

### Monitoring and Logging

- Application logs (Winston, Morgan)
- Error tracking (Sentry)
- Performance monitoring (New Relic, DataDog)
- Uptime monitoring (UptimeRobot, Pingdom)
- Database query monitoring
- API response time tracking
- User activity analytics

### Backup Strategy

- Daily automated database backups
- Weekly full system backups
- Backup retention: 30 days
- Test restore procedures monthly
- Store backups in separate location
- Backup uploaded images to cloud storage

### Scalability Considerations

- Horizontal scaling with load balancer
- Database read replicas for heavy read operations
- Separate AI service as microservice
- Queue system for background jobs (Bull, RabbitMQ)
- CDN for static content delivery
- Caching layer (Redis, Memcached)
- Microservices architecture for future growth

### Testing Strategy

#### Unit Tests
- Test individual functions and services
- Mock external dependencies
- Use Jest for backend and frontend

#### Integration Tests
- Test API endpoints
- Test database operations
- Use Supertest for API testing

#### End-to-End Tests
- Test complete user flows
- Use Cypress or Playwright
- Test critical paths (report submission, adoption request)

#### Manual Testing
- Cross-browser testing
- Mobile responsiveness testing
- Accessibility testing
- User acceptance testing

### MVP Launch Checklist

- [ ] Core features implemented and tested
- [ ] Database schema finalized
- [ ] API documentation complete
- [ ] Frontend responsive on mobile/desktop
- [ ] User authentication working
- [ ] AI model integrated and tested
- [ ] Map integration functional
- [ ] Notification system operational
- [ ] Basic admin panel ready
- [ ] Error handling implemented
- [ ] Security measures in place
- [ ] Performance optimized
- [ ] Deployment environment configured
- [ ] Monitoring and logging set up
- [ ] User documentation prepared
- [ ] Demo data seeded
- [ ] Beta testing completed
- [ ] Feedback incorporated
- [ ] Launch announcement ready

