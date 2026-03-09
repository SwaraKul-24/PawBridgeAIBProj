# PawBridge - Design Document

## High-Level Architecture

PawBridge follows a three-tier architecture with clear separation between presentation, business logic, and data layers.

### Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                   Client Layer                          │
│         (HTML/CSS/JavaScript - Vanilla JS)              │
└─────────────────────────────────────────────────────────┘
                          │
                    HTTPS/REST API
                          │
┌─────────────────────────────────────────────────────────┐
│              API Layer (Node.js + Express)              │
│  ┌──────────────────────────────────────────────────┐  │
│  │  Routes → Business Logic                         │  │
│  │  (Auth, Injury, Adoption, Donation, Volunteer)  │  │
│  └──────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
                          │
        ┌─────────────────┼─────────────────┬──────────────┐
        │                 │                 │              │
   ┌────▼─────┐    ┌─────▼──────┐   ┌─────▼────┐  ┌─────▼────────┐
   │  MySQL   │    │  Amazon    │   │ Gemini   │  │  Nodemailer  │
   │ Database │    │     S3     │   │   AI     │  │   (Email)    │
   └──────────┘    └────────────┘   └──────────┘  └──────────────┘
```

### Technology Stack

- **Frontend**: HTML, CSS, JavaScript (Vanilla JS)
- **Backend**: Node.js with Express.js
- **Database**: MySQL 8.0+
- **AI**: Google Gemini AI (gemini-2.5-flash model)
- **Authentication**: JWT tokens
- **File Storage**: Amazon S3 for images
- **Email Notifications**: Nodemailer (Gmail SMTP)
- **In-App Notifications**: Database-persisted notifications

## Component Breakdown

### Frontend Components

#### 1. Core Pages
- **index.html**: Landing page with platform overview
- **InjuryReportPage.html**: Injury report submission form
- **adoptions.html**: Browse available animals for adoption
- **donations.html**: Donation page with payment integration
- **volunteering-opportunities.html**: Browse volunteer opportunities
- **volunteer-history.html**: User's volunteer application history
- **ngo-create-opportunity.html**: NGO form to create opportunities
- **ngo-opportunity-history.html**: NGO's posted opportunities
- **payment.html**: Payment gateway integration page

#### 2. Dashboard Components
- **Dashboards/**: User and NGO dashboard pages
- **Pages/**: Additional feature pages

#### 3. Assets
- **css/**: Stylesheets
- **js/**: JavaScript files for frontend logic
- **images/**: Static images and icons

### Backend Services

#### 1. Authentication Service
- User registration (Citizen, NGO, Admin)
- Login with JWT token generation
- Password hashing
- Role-based access control

#### 2. Injury Report Service
- Create injury report
- Upload and store images to Amazon S3
- Call Gemini AI for image analysis
- Calculate NGO distances using Haversine formula
- Allocate report to nearest NGO within 10km
- Handle NGO responses (accept/reject) with rejection tracking
- Reallocate on rejection to next nearest NGO
- Update case status in MySQL
- Retrieve report history

#### 3. AI Service (Gemini Integration)
- Interface with Google Gemini AI API
- Send images for analysis
- Classify animal type (dog, cat, cow, goat, sheep, snake)
- Detect injury severity (Low, Medium, Critical)
- Generate automatic injury descriptions
- Return classification results
- Handle analysis failures gracefully

#### 4. Adoption Service
- CRUD operations for animal listings
- Upload animal photos to local storage
- Filter and search animals
- Manage animal availability status
- Retrieve adoption listings with NGO contact information

#### 5. Donation Service
- Record donations
- Store donation information in MySQL
- Retrieve donation history
- Note: Payment processing is not integrated; system records donation intent only

#### 6. Volunteering Service
- CRUD operations for volunteer opportunities
- CRUD operations for volunteer applications
- Filter opportunities by criteria
- Send email notifications via Nodemailer for accepted volunteers
- Track application status (pending, accepted, rejected)

#### 7. Notification Service
- Create in-app notifications for injury reports and status updates
- Store notifications in MySQL database
- Track read/unread status
- Retrieve user notifications

## Database Schema

### Core Tables

#### user_master
```sql
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
    FOREIGN KEY (rm_id) REFERENCES role_master(rm_id)
);
```

#### injury_report
```sql
CREATE TABLE injury_report (
    ir_id INT AUTO_INCREMENT PRIMARY KEY,
    um_id INT NOT NULL,
    atm_id INT NOT NULL,
    ir_latitude DECIMAL(10, 8) NOT NULL,
    ir_longitude DECIMAL(11, 8) NOT NULL,
    ir_location_address VARCHAR(300),
    ir_description TEXT,
    ir_image_url VARCHAR(255),
    ir_status ENUM('Pending', 'Accepted', 'NGO_Departing', 'NGO_Arrived', 
                   'Under_Treatment', 'Treated', 'Transferred', 'Rejected'),
    severity ENUM('Low','Medium','Critical') DEFAULT 'Medium',
    assigned_ngo_id INT NULL,
    attempted_ngos JSON DEFAULT NULL,
    available_ngos JSON DEFAULT NULL,
    routing_exhausted BOOLEAN DEFAULT FALSE,
    created_on TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_on TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (um_id) REFERENCES user_master(um_id),
    FOREIGN KEY (atm_id) REFERENCES animal_type_master(atm_id),
    FOREIGN KEY (assigned_ngo_id) REFERENCES user_master(um_id)
);
```

#### adoption_posts
```sql
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
    FOREIGN KEY (ngo_id) REFERENCES user_master(um_id),
    FOREIGN KEY (atm_id) REFERENCES animal_type_master(atm_id)
);
```

#### volunteer_opportunities
```sql
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
```

#### volunteer_applications
```sql
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
    status ENUM('pending','accepted','rejected') DEFAULT 'pending',
    applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (vo_id) REFERENCES volunteer_opportunities(vo_id),
    FOREIGN KEY (um_id) REFERENCES user_master(um_id)
);
```

#### donations
```sql
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
```

#### notifications
```sql
CREATE TABLE notifications (
    n_id INT AUTO_INCREMENT PRIMARY KEY,
    recipient_id INT NOT NULL,
    notification_type ENUM('Injury_Report', 'Status_Update', 
                          'NGO_Response', 'Adoption_Inquiry') NOT NULL,
    title VARCHAR(200) NOT NULL,
    message TEXT NOT NULL,
    related_id INT,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (recipient_id) REFERENCES user_master(um_id)
);
```

## API Endpoints

### Authentication
```
POST   /register              - Register new user
POST   /login                 - User login
GET    /profile/:userId       - Get user profile
```

### Injury Reports
```
POST   /injury-report         - Submit injury report
GET    /reports/list/:ngoId   - Get NGO's assigned reports
PUT    /reports/update/:reportId - Update report status
```

### Adoptions
```
POST   /adoptions/add         - Create adoption listing (NGO)
GET    /adoptions/list/:ngoId - Get NGO's adoption listings
GET    /adoptions/all         - Get all available animals
PUT    /adoptions/remove/:apId - Remove adoption listing
```

### Donations
```
POST   /api/donation/pay      - Record donation information
GET    /donations/total       - Get total donations
```

### Volunteering
```
POST   /ngo/opportunities/create - Create opportunity (NGO)
GET    /opportunities/ngo/:ngo_id - Get NGO's opportunities
GET    /volunteer/opportunities - Get all opportunities
POST   /volunteer/apply       - Apply for opportunity
GET    /volunteer/history/:um_id - Get user's applications
GET    /ngo/opportunity/:vo_id/applicants - Get applicants
POST   /ngo/application/accept - Accept volunteer
POST   /ngo/application/reject - Reject volunteer
```

### AI Analysis
```
POST   /ai-analyze            - Analyze injury image with Gemini AI
```

## Injury Reporting Workflow

### Step 1: Report Submission
1. User fills form with animal type, description, and uploads image
2. User manually enters or selects the location
3. Image is uploaded to Amazon S3
4. Report is created in database with status "Pending"

### Step 2: AI Analysis
1. Backend calls Gemini AI API with image
2. Gemini analyzes image and returns:
   - Animal type (dog, cat, cow, goat, sheep, snake)
   - Injury severity (Low, Medium, Critical)
   - Injury description
3. AI results are stored in database

### Step 3: NGO Allocation
1. System queries all NGOs from database
2. Calculates distance using Haversine formula:
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
3. Filters NGOs within 10km radius
4. Sorts by distance (nearest first)
5. If no NGOs found within 10km:
   - Mark report as "Rejected"
   - Notify user
   - End workflow

### Step 4: Sequential NGO Routing
1. Assign report to nearest NGO
2. Store queue of available NGOs in `available_ngos` JSON field
3. Track attempted NGOs in `attempted_ngos` JSON field
4. Send notification to assigned NGO
5. Notify user about assignment

### Step 5: NGO Response Handling
1. NGO views report details
2. NGO can accept or reject:
   - **If Accept**: Report status → "Accepted", workflow complete
   - **If Reject**: 
     - Add NGO to `attempted_ngos` list
     - Remove from `available_ngos` queue
     - Route to next NGO in queue
     - Repeat until accepted or queue exhausted
3. If all NGOs reject:
   - Mark `routing_exhausted` = TRUE
   - Update status to "Rejected"
   - Notify user

### Step 6: Status Updates
1. NGO updates case status as rescue progresses
2. Status changes: Pending → Accepted → NGO_Departing → NGO_Arrived → Under_Treatment → Treated
3. Each update creates notification for user
4. Status history maintained in database

## Gemini AI Integration

### API Configuration
```javascript
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent';
const GEMINI_KEY = process.env.GEMINI_KEY;
```

### Analysis Request
```javascript
const prompt = `
Analyze this injured animal image.

Return ONLY JSON:

{
 "animal_type":"dog | cat | cow | goat | sheep | snake",
 "injury_description":"short description",
 "severity":"Low | Medium | Critical"
}
`;

const response = await fetch(
  `${GEMINI_API_URL}?key=${GEMINI_KEY}`,
  {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{
        parts: [
          { text: prompt },
          {
            inline_data: {
              mime_type: "image/jpeg",
              data: base64Image
            }
          }
        ]
      }]
    })
  }
);
```

### Response Handling
```javascript
const data = await response.json();
let text = data.candidates[0].content.parts[0].text;

// Remove markdown formatting if present
text = text.replace(/```json/g, "").replace(/```/g, "").trim();

// Parse JSON response
const aiResult = JSON.parse(text);
// Returns: { animal_type, injury_description, severity }
```

## Amazon S3 Integration

### S3 Configuration
```javascript
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

const s3 = new S3Client({
  region: "ap-south-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
  }
});
```

### Image Upload
```javascript
async function uploadToS3(file) {
  const key = `injury_reports/${Date.now()}-${file.originalname}`;
  
  const params = {
    Bucket: process.env.AWS_BUCKET_NAME,
    Key: key,
    Body: file.buffer,
    ContentType: file.mimetype
  };
  
  await s3.send(new PutObjectCommand(params));
  
  return `https://${process.env.AWS_BUCKET_NAME}.s3.ap-south-1.amazonaws.com/${key}`;
}
```

## Notification System

### In-App Notifications
- All notifications stored in MySQL `notifications` table
- Notifications created for:
  - Injury report submission
  - NGO assignment
  - Status updates
  - Routing failures
- Users can view notifications in dashboard
- Notifications track read/unread status

### Email Notifications
- Used only for volunteer acceptance
- Sent via Nodemailer with Gmail SMTP
- Contains NGO contact details for coordination

```javascript
async function sendVolunteerAcceptanceMail(
  volunteerEmail,
  volunteerName,
  ngoName,
  ngoEmail,
  ngoContact,
  opportunityTitle
) {
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: volunteerEmail,
    subject: `Volunteer Application Accepted - ${opportunityTitle}`,
    html: `
      <h2>Congratulations ${volunteerName}!</h2>
      <p>Your volunteer application has been accepted by ${ngoName}.</p>
      <p><strong>Contact Details:</strong></p>
      <p>Email: ${ngoEmail}</p>
      <p>Phone: ${ngoContact}</p>
    `
  };
  
  await transporter.sendMail(mailOptions);
}
```

## Distance Calculation

### Haversine Formula Implementation
```javascript
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth's radius in kilometers
  
  const toRad = (deg) => deg * (Math.PI / 180);
  
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  
  return R * c; // Distance in kilometers
}
```

### NGO Filtering
```javascript
const nearbyNGOs = ngos
  .map(ngo => ({
    ...ngo,
    distance: calculateDistance(
      reportLat, reportLon,
      ngo.um_latitude, ngo.um_longitude
    )
  }))
  .filter(ngo => ngo.distance <= 10) // 10km radius
  .sort((a, b) => a.distance - b.distance);
```

## Security Measures

### Authentication
- JWT tokens for session management
- Password hashing before storage
- Role-based access control (RBAC)
- Protected routes require valid JWT

### Data Protection
- HTTPS for all communications
- SQL injection prevention via parameterized queries
- Input validation on all endpoints
- File type and size validation for uploads

### AWS S3 Security
- Secure credentials management via environment variables
- Bucket access controls
- HTTPS for all S3 operations

## Deployment Architecture

### Backend Deployment
- Node.js server running on port 5001
- Environment variables for configuration
- CORS enabled for frontend domains
- Static file serving for uploads

### Database
- MySQL database
- Connection pooling for performance
- Automated backups recommended

### Frontend Deployment
- Static HTML/CSS/JS files
- Can be served from any web server
- CDN recommended for assets

## Error Handling

### AI Analysis Failures
- If Gemini API fails, return empty object
- Frontend handles missing AI data gracefully
- Report still created with manual classification

### NGO Routing Failures
- If no NGOs within 10km, mark as "Rejected"
- Notify user immediately
- Log for admin review

## Performance Considerations

### Database Optimization
- Indexes on frequently queried fields
- Connection pooling
- Efficient JOIN queries

### Image Optimization
- File size limits enforced
- S3 for scalable storage
- Lazy loading on frontend

### API Response Times
- Gemini AI: ~5-10 seconds
- Database queries: <1 second
- S3 uploads: ~2-5 seconds

## Future Enhancements

### Potential Improvements
1. Real-time notifications via WebSockets
2. Mobile app development
3. Advanced analytics dashboard
4. Multi-language support
5. SMS notifications
6. Geofencing for NGO coverage areas
7. Automated NGO verification
8. Impact reporting and metrics
