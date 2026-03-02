# PawBridge - Design Document

## High-Level Architecture

PawBridge follows a three-tier architecture with clear separation between presentation, business logic, and data layers.

### Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                   Client Layer                          │
│         (HTML/CSS/JavaScript + React SPA)               │
│              Amazon Location Service Maps               │
└─────────────────────────────────────────────────────────┘
                          │
                    HTTPS/REST API
                          │
┌─────────────────────────────────────────────────────────┐
│              API Layer (Node.js + Express MVC)          │
│  ┌──────────────────────────────────────────────────┐  │
│  │  Controllers → Services → Repositories           │  │
│  │  (Auth, Reports, Abuse, Adoption, Donation, Vol) │  │
│  └──────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
                          │
                          ↓
┌─────────────────────────────────────────────────────────┐
│         AWS Step Functions (Agent Orchestrator)         │
│  ┌──────────────────────────────────────────────────┐  │
│  │  Lambda Agent 1: AI Analysis (Bedrock)           │  │
│  │  Lambda Agent 2: Severity & Radius Classification│  │
│  │  Lambda Agent 3: NGO Allocation                  │  │
│  │  Lambda Agent 4: Notification Dispatcher         │  │
│  └──────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
                          │
        ┌─────────────────┼─────────────────┬──────────────┐
        │                 │                 │              │
   ┌────▼─────┐    ┌─────▼──────┐   ┌─────▼────┐  ┌─────▼────────┐
   │ Amazon   │    │  Amazon    │   │ Amazon   │  │   Amazon     │
   │   RDS    │    │     S3     │   │   SES    │  │   Location   │
   │ (MySQL)  │    │  (Media)   │   │ (Email)  │  │   Service    │
   └──────────┘    └────────────┘   └──────────┘  └──────────────┘
```

### Technology Stack

- **Frontend**: HTML, CSS, JavaScript (Vanilla JS or lightweight framework)
- **Backend**: Node.js with Express.js (MVC Architecture)
- **Database**: Amazon RDS (MySQL 8.0+ engine)
- **Maps**: Amazon Location Service
- **AI**: Amazon Bedrock (Claude or other foundation models)
- **Workflow Orchestration**: AWS Step Functions
- **Compute**: AWS Lambda for agent execution
- **Authentication**: JWT tokens
- **File Storage**: Amazon S3 for images (up to 25MB) and videos (up to 100MB)
- **Email Notifications**: AWS SES (Simple Email Service)
- **In-App Notifications**: WebSocket or polling-based system with Amazon RDS persistence
- **Message Queue**: Amazon SQS for async retries


## MVC Architecture Pattern

PawBridge follows the Model-View-Controller (MVC) architectural pattern for clean separation of concerns and maintainability.

### MVC Components

#### Controllers
Handle HTTP requests, validate input, and coordinate between services and views.
- **AuthController**: User registration, login, logout, profile management
- **ReportController**: Injury report submission, status updates, case tracking
- **AbuseController**: Abuse report submission, anonymous reporting, case tracking
- **AnimalController**: Animal listing, adoption requests, adoption management
- **DonationController**: Donation processing, distribution logic, history
- **VolunteerController**: Volunteer registration, opportunity management
- **NotificationController**: Fetch notifications, mark as read

#### Services (Business Logic Layer)
Contain core business logic and orchestrate complex operations.
- **AuthService**: Authentication, authorization, token management
- **ReportService**: Report processing, AI analysis trigger, NGO allocation
- **AbuseService**: Abuse case processing, anonymous tracking, severity classification
- **AIService**: Interface with AWS Bedrock for image/video analysis
- **AllocationService**: NGO selection logic, radius-based filtering, rejection tracking
- **NotificationService**: Send in-app and email notifications via AWS SES
- **DonationService**: Geographic distribution, payment gateway integration
- **LocationService**: Amazon Location Service integration, distance calculations

#### Repositories (Data Access Layer)
Handle all database operations and queries.
- **UserRepository**: User CRUD operations
- **NGORepository**: NGO data access, location queries
- **ReportRepository**: Injury report data access
- **AbuseReportRepository**: Abuse report data access
- **AnimalRepository**: Animal listing data access
- **DonationRepository**: Donation and distribution records
- **VolunteerRepository**: Volunteer profile data access
- **NotificationRepository**: Notification CRUD operations

#### Models
Define data structures and database schemas.
- **User**: User account information
- **NGO**: NGO organization details
- **Report**: Injury report data
- **AbuseReport**: Abuse report data
- **Animal**: Animal listing information
- **Donation**: Donation transaction records
- **Volunteer**: Volunteer profile data
- **Notification**: In-app notification data

#### Routes
Define API endpoints and map them to controllers.
- **authRoutes**: `/api/auth/*`
- **reportRoutes**: `/api/reports/*`
- **abuseRoutes**: `/api/abuse/*`
- **animalRoutes**: `/api/animals/*`
- **donationRoutes**: `/api/donations/*`
- **volunteerRoutes**: `/api/volunteers/*`
- **notificationRoutes**: `/api/notifications/*`

#### Middleware
Handle cross-cutting concerns.
- **authMiddleware**: JWT token validation, role-based access control
- **uploadMiddleware**: File upload handling to Amazon S3
- **errorHandler**: Centralized error handling and logging
- **validationMiddleware**: Request validation using express-validator
- **rateLimiter**: API rate limiting
- **corsMiddleware**: CORS configuration

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
- **ReportForm**: Image upload to S3, location capture via Amazon Location Service, description
- **ReportList**: Display user's submitted reports
- **ReportDetail**: View single report with status timeline
- **NGODashboard**: NGO view of incoming reports with in-app notifications
- **CaseManagement**: NGO interface for accepting/updating cases

#### 4. Abuse Reporting Components
- **AbuseReportForm**: Anonymous reporting, image/video upload to S3, location selection
- **AbuseReportList**: Display submitted abuse reports
- **AbuseReportDetail**: View abuse case with media evidence and status
- **AbuseTrackingPage**: Track abuse case using tracking ID
- **NGOAbuseDashboard**: NGO view of abuse cases with in-app notifications

#### 5. Adoption Components
- **AnimalList**: Browse available animals with filters
- **AnimalDetail**: Detailed animal profile
- **AnimalForm**: NGO form to add/edit animals
- **AdoptionRequestForm**: Citizen adoption request
- **AdoptionManagement**: NGO interface for reviewing requests

#### 6. Donation Components
- **NGOList**: Browse NGOs accepting donations
- **NGOProfile**: NGO details and donation page
- **DonationForm**: Payment interface with real payment gateway integration
- **DonationHistory**: User's donation records with distribution details

#### 7. Volunteering Components
- **VolunteerProfile**: Volunteer registration/profile
- **OpportunityList**: Browse volunteering opportunities
- **OpportunityForm**: NGO form to post opportunities
- **VolunteerDirectory**: NGO view of registered volunteers

#### 8. Notification Components
- **NotificationBell**: In-app notification icon with unread count
- **NotificationPanel**: Dropdown panel showing recent notifications
- **NotificationList**: Full page view of all notifications

#### 9. Chatbot Component
- **Chatbot**: Simple rule-based chatbot widget

#### 10. Map Components
- **MapView**: Amazon Location Service map for location display/selection
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
- Upload and store images to Amazon S3
- Trigger AWS Step Functions workflow for AI analysis
- Calculate NGO distances using Amazon Location Service
- Allocate report to nearest NGO based on severity
- Handle NGO responses (accept/reject) with rejection tracking
- Reallocate on timeout or rejection (excluding rejected NGOs)
- Update case status in Amazon RDS
- Retrieve report history

#### 3. Abuse Report Service
- Create abuse report (anonymous or authenticated)
- Generate unique tracking ID for anonymous reports
- Upload and store images/videos to Amazon S3
- Trigger AWS Step Functions workflow for AI abuse analysis
- Calculate NGO distances using Amazon Location Service
- Allocate abuse case to nearest NGO based on severity
- Handle NGO responses with rejection tracking
- Reallocate on timeout or rejection
- Update abuse case status in Amazon RDS
- Retrieve abuse report history and tracking

#### 4. AI Service
- Interface with AWS Bedrock for image and video analysis
- Send media files from S3 to Bedrock for processing
- Classify animal type (dog, cat, bird, other)
- Detect injury/abuse severity (low, medium, high, critical)
- Generate automatic preliminary descriptions
- Return classification results with confidence scores
- Handle analysis failures gracefully with fallback logic

#### 5. Adoption Service
- CRUD operations for animal listings
- Filter and search animals
- Create adoption requests
- Approve/reject adoption requests
- Update animal status
- Send in-app notifications for adoption updates

#### 6. Donation Service
- Record donations with geographic distribution
- Capture donor location using browser geolocation API
- **Primary**: Find NGOs within 50 km radius using Haversine formula
- **Enhancement**: Optionally use Amazon Location Service for distance calculation
- **Fallback Logic**:
  1. Search within 50 km radius
  2. If no NGOs found → Expand to 100 km radius
  3. If still none → Expand to 200 km radius
  4. If still none → Find nearest verified NGO in same state
- Calculate equal distribution among eligible NGOs
- Integrate with real payment gateway (Razorpay/Stripe sandbox)
- Create donation distribution records in Amazon RDS
- Retrieve donation history with distribution details
- Calculate NGO donation totals
- Generate transparency logs with search radius used

**Distance Calculation** (Primary Method):
```javascript
// Haversine formula for distance calculation
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

// Find NGOs within radius
async function findNGOsWithinRadius(donorLat, donorLon, radiusKm) {
  const ngos = await db.query('SELECT * FROM ngos WHERE is_active = TRUE');
  
  return ngos.filter(ngo => {
    const distance = calculateDistance(donorLat, donorLon, ngo.latitude, ngo.longitude);
    return distance <= radiusKm;
  }).map(ngo => ({
    ...ngo,
    distance: calculateDistance(donorLat, donorLon, ngo.latitude, ngo.longitude)
  }));
}
```

**Donation Distribution Logic**:
```javascript
async function distributeDonation(donorLat, donorLon, amount, donorState) {
  let eligibleNGOs = [];
  let searchRadius = 50;
  
  // Try 50 km
  eligibleNGOs = await findNGOsWithinRadius(donorLat, donorLon, 50);
  
  if (eligibleNGOs.length === 0) {
    // Try 100 km
    searchRadius = 100;
    eligibleNGOs = await findNGOsWithinRadius(donorLat, donorLon, 100);
  }
  
  if (eligibleNGOs.length === 0) {
    // Try 200 km
    searchRadius = 200;
    eligibleNGOs = await findNGOsWithinRadius(donorLat, donorLon, 200);
  }
  
  if (eligibleNGOs.length === 0) {
    // Fallback: Find nearest verified NGO in same state
    eligibleNGOs = await db.query(`
      SELECT * FROM ngos 
      WHERE state = ? AND is_verified = TRUE 
      ORDER BY (
        POW(latitude - ?, 2) + POW(longitude - ?, 2)
      ) ASC 
      LIMIT 1
    `, [donorState, donorLat, donorLon]);
    searchRadius = 'state-wide';
  }
  
  // Calculate equal distribution
  const sharePerNGO = amount / eligibleNGOs.length;
  
  return {
    eligibleNGOs,
    sharePerNGO,
    searchRadius,
    totalNGOs: eligibleNGOs.length
  };
}
```

**SQL Optimization** (Optional):
```sql
-- Computed distance filtering (faster for large datasets)
SELECT *, 
  (6371 * acos(
    cos(radians(?)) * cos(radians(latitude)) * 
    cos(radians(longitude) - radians(?)) + 
    sin(radians(?)) * sin(radians(latitude))
  )) AS distance
FROM ngos
WHERE is_active = TRUE
HAVING distance <= ?
ORDER BY distance ASC;
```

#### 7. Volunteering Service
- CRUD operations for volunteer profiles
- CRUD operations for opportunities
- Filter volunteers by criteria
- Filter opportunities by criteria
- Send email notifications via AWS SES for new opportunities

#### 8. Notification Service
- Create in-app notifications for injury reports, abuse reports, and adoptions
- Send email notifications via AWS SES for volunteering updates
- Queue notification jobs using Amazon SQS for retries
- Track delivery status
- Mark notifications as read
- Retrieve user notifications

#### 9. Location Service
- Calculate distance between coordinates using Haversine formula
- Find NGOs within specified radius using Amazon Location Service
- Geocoding and reverse geocoding via Amazon Location Service
- Support progressive radius expansion for donation and case allocation

## Notification System Design

PawBridge implements a dual notification system optimized for different use cases: in-app notifications for time-sensitive case updates and email notifications for volunteering coordination.

### A) In-App Notifications

**Purpose**: Provide real-time updates for injury reports, abuse reports, and donation confirmations.

**Use Cases**:
- Injury report status updates (Pending → Accepted → NGO_Departing → etc.)
- Abuse report status updates (Pending → Investigation → Animal_Rescued → etc.)
- NGO case assignment notifications
- Adoption request responses
- Donation confirmation with distribution details

**Storage**: All in-app notifications are persisted in Amazon RDS for reliability and history tracking.

**Delivery Mechanism**:
- **Preferred (Production)**: WebSocket connection for real-time push notifications
- **MVP Fallback**: Client-side polling every 30 seconds to `/api/notifications/unread` endpoint

**Database Schema**:
```sql
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
```

**Notification Flow**:
```
1. Event occurs (e.g., NGO accepts case)
   ↓
2. Backend creates notification record in RDS
   ↓
3. If WebSocket enabled:
   - Push notification to connected client
   Else (MVP):
   - Client polls /api/notifications/unread every 30 seconds
   ↓
4. Frontend displays notification in notification bell/panel
   ↓
5. User clicks notification
   ↓
6. Frontend marks as read via PUT /api/notifications/:id/read
   ↓
7. Backend updates is_read = TRUE in RDS
```

**API Endpoints**:
```
GET    /api/notifications          - Get paginated notifications
GET    /api/notifications/unread   - Get unread count
PUT    /api/notifications/:id/read - Mark as read
PUT    /api/notifications/read-all - Mark all as read
DELETE /api/notifications/:id      - Delete notification
```

**Frontend Implementation**:
```javascript
// MVP Polling Approach
setInterval(async () => {
  const response = await fetch('/api/notifications/unread');
  const { count, notifications } = await response.json();
  updateNotificationBell(count);
  displayNotifications(notifications);
}, 30000); // Poll every 30 seconds
```

### B) Email Notifications

**Purpose**: Notify volunteers about new opportunities and NGOs about volunteer applications.

**Use Cases**:
- New volunteering opportunity posted (notify matching volunteers)
- Volunteer applies for opportunity (notify NGO)
- Opportunity status changes (notify interested volunteers)

**Delivery**: AWS SES (Simple Email Service)

**Email Templates**:
- Plain text emails for MVP (no HTML templates)
- Include direct links to relevant pages
- Unsubscribe link in footer

**Email Flow**:
```
1. Volunteering event occurs (e.g., new opportunity posted)
   ↓
2. Backend identifies recipients (volunteers with matching skills)
   ↓
3. Backend calls AWS SES API to send emails
   ↓
4. SES delivers emails asynchronously
   ↓
5. Backend logs email delivery status
```

**SES Integration**:
```javascript
const { SESClient, SendEmailCommand } = require('@aws-sdk/client-ses');

const sesClient = new SESClient({ region: 'us-east-1' });

async function sendVolunteerEmail(to, subject, body) {
  const command = new SendEmailCommand({
    Source: 'noreply@pawbridge.org',
    Destination: { ToAddresses: [to] },
    Message: {
      Subject: { Data: subject },
      Body: { Text: { Data: body } }
    }
  });
  
  await sesClient.send(command);
}
```

**No SMS in MVP**: SMS notifications are explicitly excluded from the MVP scope to reduce complexity and cost.

### Notification Service Architecture

**NotificationService** (Backend Service):
```javascript
class NotificationService {
  // In-app notifications
  async createInAppNotification(userId, type, title, message, relatedEntity) {
    // Insert into notifications table
    // If WebSocket enabled, push to client
  }
  
  async getUserNotifications(userId, page, limit) {
    // Fetch paginated notifications from RDS
  }
  
  async markAsRead(notificationId, userId) {
    // Update is_read = TRUE
  }
  
  // Email notifications (volunteering only)
  async sendVolunteerEmail(volunteerId, opportunityId) {
    // Call AWS SES
  }
  
  async sendNGOVolunteerNotification(ngoId, volunteerId) {
    // Call AWS SES
  }
}
```

### Notification Types and Triggers

| Event | Notification Type | Delivery Method | Recipient |
|-------|------------------|-----------------|-----------|
| Injury report submitted | In-app | WebSocket/Polling | Citizen |
| NGO accepts injury case | In-app | WebSocket/Polling | Citizen |
| Injury status updated | In-app | WebSocket/Polling | Citizen |
| Abuse report submitted | In-app | WebSocket/Polling | Reporter (if logged in) |
| NGO accepts abuse case | In-app | WebSocket/Polling | Reporter (if logged in) |
| Abuse status updated | In-app | WebSocket/Polling | Reporter (if logged in) |
| Adoption request submitted | In-app | WebSocket/Polling | NGO |
| Adoption approved/rejected | In-app | WebSocket/Polling | Citizen |
| Donation completed | In-app | WebSocket/Polling | Citizen |
| New volunteering opportunity | Email | AWS SES | Matching volunteers |
| Volunteer applies | Email | AWS SES | NGO |
| Case assigned to NGO | In-app | WebSocket/Polling | NGO |

## Agentic Workflow Design

PawBridge implements an intelligent multi-agent system orchestrated by AWS Step Functions to handle injury and abuse reporting workflows autonomously.

### Workflow Orchestration with AWS Step Functions

AWS Step Functions serves as the primary orchestrator, managing the entire agentic workflow from report submission to NGO assignment. Each agent is implemented as an AWS Lambda function invoked sequentially by the Step Functions state machine.

### State Machine Flow

```
┌─────────────────────────────────────────────────────┐
│          Report Submitted (Injury/Abuse)            │
└──────────────────────┬──────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────┐
│  Step 1: AI Analysis Agent (Lambda + Bedrock)       │
│  - Analyze image/video from S3                      │
│  - Classify animal type                             │
│  - Extract injury/abuse indicators                  │
│  - Generate preliminary description                 │
└──────────────────────┬──────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────┐
│  Step 2: Severity Classification Agent (Lambda)     │
│  - Evaluate severity (Low/Medium/High/Critical)     │
│  - Determine case priority                          │
│  - Generate severity justification                  │
└──────────────────────┬──────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────┐
│  Step 3: Radius Decision Agent (Lambda)             │
│  - High/Critical → 5 km radius                      │
│  - Medium/Low → 20 km radius                        │
│  - Query Amazon Location Service                    │
└──────────────────────┬──────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────┐
│  Step 4: NGO Allocation Agent (Lambda)              │
│  - Find NGOs within radius                          │
│  - Sort by distance (nearest first)                 │
│  - Exclude previously rejected NGOs                 │
│  - Select next eligible NGO                         │
└──────────────────────┬──────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────┐
│  Step 5: Notification Agent (Lambda + SES)          │
│  - Send in-app notification to NGO                  │
│  - Start 30-minute timeout timer                    │
│  - Wait for NGO response                            │
└──────────────────────┬──────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────┐
│  Step 6: Response Handling                          │
│  ┌──────────────┬──────────────┬──────────────┐    │
│  │   Accepted   │   Rejected   │   Timeout    │    │
│  └──────┬───────┴──────┬───────┴──────┬───────┘    │
│         │              │              │             │
│         ▼              ▼              ▼             │
│    Assign Case   Mark Rejected   Move to Next      │
│    Notify User   in RDS          NGO               │
│    END           Go to Step 7    Go to Step 7      │
└─────────────────────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────┐
│  Step 7: Reallocation Logic                         │
│  - Check if more NGOs available in current radius   │
│  - If yes → Go to Step 4 (exclude rejected NGOs)    │
│  - If no → Expand radius by 5 km (max 30 km)        │
│  - If max radius reached → Mark "Unassigned"        │
│  - Notify admin for manual intervention             │
└─────────────────────────────────────────────────────┘
```

### State Transitions

#### State 1: AI Analysis
- **Input**: Report ID, S3 image/video URLs, user description
- **Process**: Invoke Bedrock API for analysis
- **Output**: Animal type, severity, generated description, confidence
- **Next State**: Severity Classification
- **Error Handling**: Retry 3 times, fallback to "unknown" classification

#### State 2: Severity Classification
- **Input**: AI analysis results
- **Process**: Apply severity rules, calculate priority score
- **Output**: Severity level (Low/Medium/High/Critical), priority score
- **Next State**: Radius Decision
- **Error Handling**: Default to "Medium" severity

#### State 3: Radius Decision
- **Input**: Severity level
- **Process**: Determine initial search radius based on severity
- **Output**: Search radius (5 km or 20 km)
- **Next State**: NGO Allocation
- **Error Handling**: Default to 20 km radius

#### State 4: NGO Allocation
- **Input**: Report location, search radius, rejected NGO list
- **Process**: Query Amazon Location Service, filter and sort NGOs
- **Output**: Prioritized NGO list (excluding rejected NGOs)
- **Next State**: Notification
- **Error Handling**: If no NGOs found, trigger radius expansion

#### State 5: Notification
- **Input**: Selected NGO, case details
- **Process**: Send in-app notification, start timeout timer
- **Output**: Notification delivery status
- **Next State**: Wait for Response (30 min timeout)
- **Error Handling**: Retry via SQS, fallback to email

#### State 6: Response Handling
- **Input**: NGO response (accept/reject/timeout)
- **Process**: Update case status in RDS
- **Output**: Assignment status
- **Next State**: 
  - If accepted → END (success)
  - If rejected → Reallocation (mark rejection in RDS)
  - If timeout → Reallocation
- **Error Handling**: Log all responses for audit

#### State 7: Reallocation
- **Input**: Current radius, rejected NGO list, remaining NGOs
- **Process**: Check for more eligible NGOs or expand radius
- **Output**: Next NGO or radius expansion trigger
- **Next State**: 
  - If NGOs available → Go to Step 4
  - If radius expandable → Go to Step 3 (with expanded radius)
  - If max radius reached → Mark "Unassigned", notify admin, END
- **Error Handling**: Escalate to admin after all attempts exhausted

### Workflow Benefits

1. **Transparency**: Visual state machine in AWS console shows exact workflow progress
2. **Observability**: Each state transition is logged with timestamps and data
3. **Error Handling**: Built-in retry logic and fallback mechanisms
4. **Scalability**: Lambda functions scale automatically with load
5. **Maintainability**: Each agent is independently deployable and testable
6. **Auditability**: Complete execution history stored for compliance

### Lambda Agent Implementation

Each agent is a separate Lambda function with clearly defined responsibilities:

#### Agent 1: AI Analysis Agent
**Lambda Function**: `pawbridge-ai-analysis-agent`

**Purpose**: Analyze uploaded media to extract animal information and injury/abuse indicators.

**Responsibilities**:
- Receive S3 URLs for uploaded images/videos
- Invoke Amazon Bedrock API with media URLs
- Classify animal type (dog, cat, bird, other)
- Detect injury/abuse severity (low, medium, high, critical)
- Generate preliminary description
- Return structured analysis results

**Input**:
```json
{
  "caseId": 123,
  "caseType": "injury",
  "s3ImageUrls": ["s3://bucket/image1.jpg"],
  "s3VideoUrls": [],
  "userDescription": "Dog with injured leg"
}
```

**Output**:
```json
{
  "animalType": "dog",
  "severity": "medium",
  "generatedDescription": "Dog with visible wound on left hind leg",
  "confidence": 0.85,
  "visualIndicators": ["wound", "limping"]
}
```

**Bedrock Integration**:
```javascript
const { BedrockRuntimeClient, InvokeModelCommand } = require('@aws-sdk/client-bedrock-runtime');

const bedrockClient = new BedrockRuntimeClient({ region: 'us-east-1' });

const prompt = `Analyze this animal image and provide:
1. Animal type (dog/cat/bird/other)
2. Injury severity (low/medium/high/critical)
3. Brief description
Image: ${s3Url}`;

const response = await bedrockClient.send(new InvokeModelCommand({
  modelId: 'anthropic.claude-3-sonnet-20240229-v1:0',
  body: JSON.stringify({ prompt, max_tokens: 300 })
}));
```

#### Agent 2: Case Classification Agent
**Lambda Function**: `pawbridge-case-classification-agent`

**Purpose**: Determine case urgency, priority, and appropriate search radius.

**Responsibilities**:
- Evaluate severity from Agent 1 output
- Determine case priority level
- Set search radius based on severity:
  - **High/Critical** → 5 km initial radius
  - **Medium/Low** → 20 km initial radius
- Generate severity justification

**Input**:
```json
{
  "caseId": 123,
  "animalType": "dog",
  "severity": "high",
  "confidence": 0.85
}
```

**Output**:
```json
{
  "priority": "urgent",
  "searchRadius": 5,
  "severityJustification": "High severity injury requires immediate attention",
  "maxRadius": 30
}
```

**Classification Logic**:
```javascript
function determineSearchRadius(severity) {
  if (severity === 'high' || severity === 'critical') {
    return { initial: 5, max: 30, increment: 5 };
  } else {
    return { initial: 20, max: 30, increment: 5 };
  }
}
```

#### Agent 3: NGO Allocation Agent
**Lambda Function**: `pawbridge-ngo-allocation-agent`

**Purpose**: Select appropriate NGOs based on location and rejection history.

**Responsibilities**:
- Query Amazon RDS for active NGOs
- Calculate distances using Haversine formula or Amazon Location Service
- Filter NGOs within search radius
- Exclude NGOs who previously rejected this case (check case_rejections table)
- Sort by distance (nearest first)
- Return prioritized NGO list

**Input**:
```json
{
  "caseId": 123,
  "caseType": "injury",
  "latitude": 28.6139,
  "longitude": 77.2090,
  "searchRadius": 5,
  "currentAttempt": 1
}
```

**Output**:
```json
{
  "eligibleNGOs": [
    { "ngoId": 45, "name": "Animal Rescue", "distance": 2.3 },
    { "ngoId": 67, "name": "Paw Care", "distance": 4.1 }
  ],
  "selectedNGO": { "ngoId": 45, "name": "Animal Rescue", "distance": 2.3 },
  "totalEligible": 2
}
```

**Distance Calculation**:
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

**Rejection Filtering**:
```sql
SELECT n.* FROM ngos n
WHERE n.is_active = TRUE
  AND n.id NOT IN (
    SELECT ngo_id FROM case_rejections 
    WHERE case_id = ? AND case_type = ?
  )
```

#### Agent 4: Notification Agent
**Lambda Function**: `pawbridge-notification-agent`

**Purpose**: Dispatch notifications and manage response tracking.

**Responsibilities**:
- Create in-app notification in Amazon RDS
- Send email via AWS SES (for volunteering only)
- Start 30-minute timeout timer
- Track notification delivery status
- Handle NGO responses (accept/reject/timeout)

**Input**:
```json
{
  "caseId": 123,
  "caseType": "injury",
  "ngoId": 45,
  "caseDetails": {
    "animalType": "dog",
    "severity": "high",
    "location": "28.6139, 77.2090",
    "description": "Dog with injured leg"
  }
}
```

**Output**:
```json
{
  "notificationId": 789,
  "deliveryStatus": "sent",
  "timeoutAt": "2026-02-15T12:30:00Z"
}
```

**Notification Creation**:
```javascript
async function createInAppNotification(ngoUserId, caseId, caseType) {
  await db.query(`
    INSERT INTO notifications (user_id, type, title, message, related_entity_type, related_entity_id)
    VALUES (?, ?, ?, ?, ?, ?)
  `, [ngoUserId, caseType, 'New Case Assigned', 'You have been assigned a new case', caseType === 'injury' ? 'report' : 'abuse_report', caseId]);
}
```

### Workflow Orchestration

AWS Step Functions orchestrates all agents in a linear, sequential workflow optimized for MVP simplicity:

**State Machine Flow** (Linear for MVP):
```
Start
  ↓
Agent 1: AI Analysis
  ↓
Agent 2: Classification
  ↓
Agent 3: NGO Allocation
  ↓
Agent 4: Notification
  ↓
Wait for Response (30 min timeout)
  ↓
Response Handler:
  - If Accepted → End (Success)
  - If Rejected → Record rejection, go to Agent 3
  - If Timeout → Go to Agent 3
  ↓
Reallocation Check:
  - If eligible NGOs remain → Go to Agent 3
  - If radius expandable → Expand radius, go to Agent 3
  - If max radius reached → Mark Unassigned, End
```

**Step Functions Definition** (Simplified):
```json
{
  "StartAt": "AIAnalysis",
  "States": {
    "AIAnalysis": {
      "Type": "Task",
      "Resource": "arn:aws:lambda:us-east-1:xxxxx:function:pawbridge-ai-analysis-agent",
      "Next": "Classification",
      "Retry": [{ "ErrorEquals": ["States.ALL"], "MaxAttempts": 3 }]
    },
    "Classification": {
      "Type": "Task",
      "Resource": "arn:aws:lambda:us-east-1:xxxxx:function:pawbridge-case-classification-agent",
      "Next": "NGOAllocation"
    },
    "NGOAllocation": {
      "Type": "Task",
      "Resource": "arn:aws:lambda:us-east-1:xxxxx:function:pawbridge-ngo-allocation-agent",
      "Next": "Notification"
    },
    "Notification": {
      "Type": "Task",
      "Resource": "arn:aws:lambda:us-east-1:xxxxx:function:pawbridge-notification-agent",
      "Next": "WaitForResponse"
    },
    "WaitForResponse": {
      "Type": "Wait",
      "Seconds": 1800,
      "Next": "CheckResponse"
    },
    "CheckResponse": {
      "Type": "Choice",
      "Choices": [
        { "Variable": "$.response", "StringEquals": "accepted", "Next": "Success" },
        { "Variable": "$.response", "StringEquals": "rejected", "Next": "HandleRejection" },
        { "Variable": "$.response", "StringEquals": "timeout", "Next": "HandleTimeout" }
      ]
    },
    "Success": { "Type": "Succeed" },
    "HandleRejection": {
      "Type": "Task",
      "Resource": "arn:aws:lambda:us-east-1:xxxxx:function:pawbridge-rejection-handler",
      "Next": "NGOAllocation"
    },
    "HandleTimeout": {
      "Type": "Task",
      "Resource": "arn:aws:lambda:us-east-1:xxxxx:function:pawbridge-timeout-handler",
      "Next": "NGOAllocation"
    }
  }
}
```

All agents read/write state to Amazon RDS (MySQL) for persistence and share data through Step Functions execution context.

## AI Module Explanation

### System Workflow

The injury and abuse reporting system operates with AI-assisted capabilities powered by Amazon Bedrock:
1. **Image/Video Analysis**: Classify animal type, injury/abuse severity, and visual indicators
2. **Description Generation**: Generate preliminary descriptions from media analysis
3. **Location-Based Routing**: Calculate distances using Amazon Location Service and allocate to nearest NGO
4. **Automatic Reallocation**: Reassign cases on timeout/rejection to all eligible NGOs (excluding those who explicitly rejected)

The system does NOT include:
- Abuse detection beyond visual analysis
- Legal case analysis
- Predictive analytics
- Behavioral learning
- Recommendation systems
- Advanced decision-making

### Amazon Bedrock Integration

#### Model Selection
- **Primary Model**: Claude 3 (Anthropic) via Amazon Bedrock
- **Alternative**: Titan Multimodal Embeddings for image analysis
- **Fallback**: Rule-based classification if Bedrock unavailable

#### Input
- Image file (JPEG/PNG, max 25MB) stored in Amazon S3
- Video file (MP4/MOV, max 100MB) stored in Amazon S3
- S3 object URL passed to Bedrock API
- User-provided text description (optional)

#### Bedrock API Call
```javascript
const bedrockClient = new BedrockRuntimeClient({ region: 'us-east-1' });

const prompt = `Analyze this image of an animal and provide:
1. Animal type (dog, cat, bird, other)
2. Injury or abuse severity (low, medium, high, critical)
3. Brief description of visible condition
4. Confidence level (0-1)

Image URL: ${s3ImageUrl}
User description: ${userDescription}`;

const response = await bedrockClient.send(new InvokeModelCommand({
  modelId: 'anthropic.claude-3-sonnet-20240229-v1:0',
  contentType: 'application/json',
  accept: 'application/json',
  body: JSON.stringify({
    prompt: prompt,
    max_tokens: 500,
    temperature: 0.3
  })
}));
```

#### Output
```json
{
  "animalType": "dog" | "cat" | "bird" | "other",
  "injurySeverity": "low" | "medium" | "high" | "critical",
  "generatedDescription": "Dog with visible wound on left hind leg, appears to be bleeding moderately",
  "confidence": 0.85,
  "processingTime": 3.2,
  "visualIndicators": ["wound", "bleeding", "limping"]
}
```

#### Classification Logic

**Animal Type**:
- dog: Canine species
- cat: Feline species
- bird: Avian species
- other: Unidentified or other animals

**Injury/Abuse Severity**:
- **low**: Minor wounds, scratches, suspected neglect
- **medium**: Visible injuries, limping, signs of distress
- **high**: Severe wounds, bleeding, animal in significant distress
- **critical**: Life-threatening condition, unconscious, active abuse in progress

#### Fallback Mechanism
- If Bedrock confidence < 0.6, mark as "unknown" and flag for manual review
- If Bedrock API fails after 3 retries, default to "other" animal type and "medium" severity
- Log all failures to CloudWatch for model improvement
- Escalate low-confidence cases to admin review queue

### NGO Allocation Algorithm

```
1. Extract report location (latitude, longitude)
2. Determine search radius based on severity:
   - High/Critical → 5 km
   - Medium/Low → 20 km
3. Query Amazon RDS for all active NGOs
4. Use Amazon Location Service to calculate distance from report location to each NGO
5. Filter NGOs within determined radius
6. Exclude NGOs who have explicitly rejected this specific case (check rejection tracking in RDS)
7. Sort remaining NGOs by distance (ascending)
8. Create list of eligible NGOs
9. Select nearest NGO from eligible list
10. Send in-app notification to NGO
11. Start 30-minute timeout timer
12. If NGO accepts:
    - Assign case to NGO in RDS
    - Notify citizen via in-app notification
    - End process
13. If NGO explicitly rejects:
    - Mark rejection in RDS with NGO ID and case ID
    - Remove NGO from eligible list for this case permanently
    - If eligible NGOs remain in current radius:
      - Select next nearest NGO
      - Go to step 10
    - Else:
      - Expand radius by 5 km (max 30 km)
      - Go to step 4
14. If timeout occurs:
    - NGO remains eligible for future attempts if radius expands
    - If eligible NGOs remain in current radius:
      - Select next nearest NGO
      - Go to step 10
    - Else:
      - Expand radius by 5 km (max 30 km)
      - Go to step 4
15. If maximum radius (30 km) reached and all NGOs attempted:
    - Mark case as "unassigned"
    - Notify citizen
    - Escalate to admin
    - End process
```

### Rejection Tracking

To prevent infinite loops and respect NGO decisions, the system maintains a rejection tracking table in Amazon RDS:

```sql
CREATE TABLE case_rejections (
  id INT PRIMARY KEY AUTO_INCREMENT,
  case_id INT NOT NULL,
  case_type ENUM('injury', 'abuse') NOT NULL,
  ngo_id INT NOT NULL,
  rejected_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY unique_rejection (case_id, case_type, ngo_id),
  FOREIGN KEY (ngo_id) REFERENCES ngos(id) ON DELETE CASCADE
);
```

**Rules**:
- NGOs who explicitly reject a case are never re-notified for that specific case
- Timeouts do NOT count as rejections (NGO remains eligible if radius expands)
- Rejection tracking is case-specific (NGO can accept other cases)
- Rejection data is used by Agent 3 (NGO Allocation) to filter eligible NGOs

### Distance Calculation

Using Haversine formula for geographic distance (also available via Amazon Location Service):

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

// Alternative: Use Amazon Location Service
const locationClient = new LocationClient({ region: 'us-east-1' });
const distance = await locationClient.send(new CalculateRouteCommand({
  CalculatorName: 'PawBridgeRouteCalculator',
  DeparturePosition: [lon1, lat1],
  DestinationPosition: [lon2, lat2]
}));
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
  latitude DECIMAL(10, 8) NOT NULL,  -- Required for geo-based allocation
  longitude DECIMAL(11, 8) NOT NULL,  -- Required for geo-based allocation
  state VARCHAR(100),  -- State/region for fallback allocation
  description TEXT,
  website VARCHAR(255),
  total_donations DECIMAL(10, 2) DEFAULT 0,
  is_verified BOOLEAN DEFAULT FALSE,  -- For donation fallback to verified NGOs
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_location (latitude, longitude),  -- Spatial index for distance queries
  INDEX idx_state (state),
  INDEX idx_verified (is_verified)
);
```

**Note**: For optimal geo-based queries, consider adding a spatial index:
```sql
ALTER TABLE ngos ADD COLUMN location POINT;
UPDATE ngos SET location = POINT(longitude, latitude);
CREATE SPATIAL INDEX idx_spatial_location ON ngos(location);
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
  status ENUM('submitted', 'under_review', 'assigned', 'in_progress', 'resolved', 'rejected', 'unassigned') DEFAULT 'submitted',
  assigned_ngo_id INT,
  allocation_attempts INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (citizen_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (assigned_ngo_id) REFERENCES ngos(id) ON DELETE SET NULL,
  INDEX idx_status (status),
  INDEX idx_citizen (citizen_id),
  INDEX idx_assigned_ngo (assigned_ngo_id)
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
  status ENUM('submitted', 'under_review', 'assigned', 'in_progress', 'resolved', 'rejected', 'unassigned'),
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (report_id) REFERENCES reports(id) ON DELETE CASCADE
);
```

### Abuse Reports Table
```sql
CREATE TABLE abuse_reports (
  id INT PRIMARY KEY AUTO_INCREMENT,
  reporter_id INT NULL,  -- NULL for anonymous reports
  tracking_id VARCHAR(50) UNIQUE NOT NULL,  -- For anonymous tracking (e.g., ABU-2026-123-XYZ)
  is_anonymous BOOLEAN DEFAULT FALSE,
  latitude DECIMAL(10, 8) NOT NULL,
  longitude DECIMAL(11, 8) NOT NULL,
  state_details TEXT,  -- State/region information for fallback allocation
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
```

### Abuse Media Table
```sql
CREATE TABLE abuse_media (
  id INT PRIMARY KEY AUTO_INCREMENT,
  abuse_report_id INT NOT NULL,
  media_type ENUM('image', 'video') NOT NULL,
  s3_url VARCHAR(500) NOT NULL,  -- Full S3 URL (e.g., s3://bucket/path/file.jpg)
  s3_key VARCHAR(500) NOT NULL,  -- S3 object key for presigned URL generation
  file_size_bytes INT,
  uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (abuse_report_id) REFERENCES abuse_reports(id) ON DELETE CASCADE,
  INDEX idx_abuse_report (abuse_report_id)
);
```

**Media Access**: 
- Images and videos stored in Amazon S3
- Only S3 URLs stored in database
- Access via presigned URLs generated on-demand for security
- Presigned URLs expire after 1 hour

**Presigned URL Generation**:
```javascript
const { S3Client, GetObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');

async function generatePresignedUrl(s3Key) {
  const command = new GetObjectCommand({
    Bucket: 'pawbridge-media',
    Key: s3Key
  });
  return await getSignedUrl(s3Client, command, { expiresIn: 3600 });
}
```

### Abuse Status History Table
```sql
CREATE TABLE abuse_status_history (
  id INT PRIMARY KEY AUTO_INCREMENT,
  abuse_report_id INT NOT NULL,
  status ENUM('submitted', 'under_review', 'assigned', 'in_progress', 'resolved', 'rejected', 'unassigned'),
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (abuse_report_id) REFERENCES abuse_reports(id) ON DELETE CASCADE
);
```

**Anonymous Reporting Flow**:
1. Anonymous user submits abuse report
2. System generates unique tracking_id (e.g., ABU-2026-123-XYZ)
3. reporter_id remains NULL, is_anonymous = TRUE
4. User receives tracking_id for future status checks
5. In-app notifications NOT sent (user not logged in)
6. User can track via `/api/abuse/track/:trackingId` endpoint

**Logged-in Reporting Flow**:
1. Authenticated user submits abuse report
2. System generates tracking_id but also stores reporter_id
3. is_anonymous = FALSE
4. User receives in-app notifications for status updates
5. User can track via dashboard or tracking_id

### Case Rejections Table
```sql
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
```

### Notifications Table
```sql
CREATE TABLE notifications (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  type ENUM('injury_report', 'abuse_report', 'adoption_request', 'adoption_response', 'case_status_update', 'ngo_assignment', 'system_alert') NOT NULL,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  related_entity_type ENUM('report', 'abuse_report', 'animal', 'adoption_request', 'donation') NULL,
  related_entity_id INT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user_unread (user_id, is_read),
  INDEX idx_created (created_at)
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

### Abuse Report Endpoints

```
POST   /api/abuse                  - Create new abuse report (anonymous or authenticated)
GET    /api/abuse                  - Get all abuse reports (filtered by role)
GET    /api/abuse/:id              - Get single abuse report details
GET    /api/abuse/track/:trackingId - Track abuse report by tracking ID (anonymous)
PUT    /api/abuse/:id/status       - Update abuse report status (NGO only)
POST   /api/abuse/:id/accept       - Accept abuse report (NGO only)
POST   /api/abuse/:id/reject       - Reject abuse report (NGO only)
GET    /api/abuse/:id/history      - Get abuse status history
POST   /api/abuse/:id/media        - Upload additional media to abuse report
```

### Notification Endpoints

```
GET    /api/notifications          - Get user notifications (paginated)
GET    /api/notifications/unread   - Get unread notification count
PUT    /api/notifications/:id/read - Mark notification as read
PUT    /api/notifications/read-all - Mark all notifications as read
DELETE /api/notifications/:id      - Delete notification
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
POST   /api/donations              - Create donation with geographic distribution (50 km radius)
GET    /api/donations              - Get donation history with distribution details
GET    /api/donations/:id          - Get specific donation with distribution breakdown
GET    /api/ngos/:id/donations     - Get donations received by specific NGO
POST   /api/donations/webhook      - Payment gateway webhook for transaction updates
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
GET    /api/notifications          - Get user notifications (paginated)
GET    /api/notifications/unread   - Get unread notification count
PUT    /api/notifications/:id/read - Mark notification as read
PUT    /api/notifications/read-all - Mark all notifications as read
DELETE /api/notifications/:id      - Delete notification
```

### Admin Endpoints

```
GET    /api/admin/users            - Get all users
PUT    /api/admin/users/:id        - Update user status
GET    /api/admin/reports          - Get all reports with analytics
GET    /api/admin/abuse            - Get all abuse reports with analytics
GET    /api/admin/stats            - Get platform statistics
GET    /api/admin/unassigned       - Get unassigned cases requiring intervention
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
    "searchRadius": "50 km",
    "distributionDetails": [
      {
        "ngoId": 12,
        "ngoName": "Animal Rescue Foundation",
        "distance": "3.2 km",
        "distributedAmount": 333.33
      },
      {
        "ngoId": 18,
        "ngoName": "Paw Care NGO",
        "distance": "8.5 km",
        "distributedAmount": 333.33
      },
      {
        "ngoId": 25,
        "ngoName": "Street Animal Welfare",
        "distance": "12.1 km",
        "distributedAmount": 333.34
      }
    ],
    "paymentStatus": "pending",
    "paymentGatewayUrl": "https://payment-gateway.com/checkout/xyz123",
    "createdAt": "2026-02-15T10:30:00Z"
  }
}
```

#### Create Abuse Report (Anonymous)
```
POST /api/abuse
Content-Type: multipart/form-data

{
  "latitude": 28.6139,
  "longitude": 77.2090,
  "userEditedDescription": "Dog being kept in small cage without food or water",
  "isAnonymous": true,
  "images": [File, File],
  "videos": [File]
}

Response:
{
  "success": true,
  "data": {
    "id": 789,
    "trackingId": "ABU-2026-789-XYZ",
    "status": "Pending",
    "abuseType": "neglect",
    "abuseSeverity": "high",
    "aiGeneratedDescription": "Animal appears confined in inadequate space with no visible food or water",
    "userEditedDescription": "Dog being kept in small cage without food or water",
    "aiConfidence": 0.82,
    "isAnonymous": true,
    "assignedNgo": null,
    "createdAt": "2026-02-15T11:00:00Z",
    "trackingUrl": "/abuse/track/ABU-2026-789-XYZ"
  }
}
```

#### Track Abuse Report (Anonymous)
```
GET /api/abuse/track/ABU-2026-789-XYZ

Response:
{
  "success": true,
  "data": {
    "trackingId": "ABU-2026-789-XYZ",
    "status": "Investigation",
    "statusHistory": [
      {
        "status": "Pending",
        "timestamp": "2026-02-15T11:00:00Z"
      },
      {
        "status": "Accepted",
        "timestamp": "2026-02-15T11:15:00Z"
      },
      {
        "status": "Investigation",
        "timestamp": "2026-02-15T12:00:00Z"
      }
    ],
    "assignedNgo": {
      "name": "Animal Welfare Society",
      "contact": "contact@aws.org"
    },
    "lastUpdated": "2026-02-15T12:00:00Z"
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

### Abuse Report Flow

```
1. User opens abuse report form (can be anonymous)
   ↓
2. If anonymous → No login required; If authenticated → User logged in
   ↓
3. User selects location on Amazon Location Service map or provides address
   ↓
4. User uploads image(s) and/or video(s) (max 25MB per image, 100MB per video)
   ↓
5. Frontend uploads files directly to Amazon S3 with presigned URLs
   ↓
6. Frontend sends POST /api/abuse with S3 URLs and metadata
   ↓
7. Backend generates unique tracking ID (e.g., ABU-2026-123-XYZ)
   ↓
8. Backend triggers AWS Step Functions workflow for abuse analysis
   ↓
9. Step Functions invokes Agent 1 (AI Analysis Lambda)
   ↓
10. Agent 1 calls AWS Bedrock with S3 media URLs
    ↓
11. Bedrock analyzes media and returns abuse classification + generated description
    ↓
12. Frontend displays AI-generated description to user
    ↓
13. User edits description if needed
    ↓
14. User submits final report with edited description
    ↓
15. Backend saves abuse report with AI results and user-edited description to Amazon RDS
    ↓
16. Step Functions invokes Agent 2 (Severity Classification Lambda)
    ↓
17. Agent 2 determines severity and returns classification
    ↓
18. Step Functions invokes Agent 3 (NGO Allocation Lambda)
    ↓
19. Agent 3 queries Amazon Location Service to find all NGOs within severity-based radius
    ↓
20. Agent 3 filters out NGOs who previously rejected this case (checks case_rejections table)
    ↓
21. Agent 3 returns sorted list of eligible NGOs
    ↓
22. Step Functions invokes Agent 4 (Notification Lambda)
    ↓
23. Agent 4 sends in-app notification to nearest eligible NGO
    ↓
24. Agent 4 starts 30-minute timeout timer
    ↓
25. Backend returns success response with tracking ID to frontend
    ↓
26. Frontend shows confirmation with tracking ID (for anonymous) or case details (for authenticated)

--- NGO Response Path ---

27a. NGO logs in and sees in-app notification
     ↓
28a. NGO clicks "Accept"
     ↓
29a. Frontend sends POST /api/abuse/:id/accept
     ↓
30a. Backend updates abuse report status to "Accepted" in RDS
     ↓
31a. Backend sends in-app notification to reporter (if authenticated) or updates tracking status
     ↓
32a. NGO can update status (Investigation, Intervention_Planned, Intervention_In_Progress, Animal_Rescued, Legal_Action_Initiated, Case_Closed)
     ↓
33a. Each status update triggers in-app notification to reporter (if authenticated)

OR

27b. NGO clicks "Reject"
     ↓
28b. Frontend sends POST /api/abuse/:id/reject
     ↓
29b. Backend records rejection in case_rejections table (case_id, case_type='abuse', ngo_id)
     ↓
30b. Backend removes NGO from eligible list for this case permanently
     ↓
31b. Step Functions continues workflow
     ↓
32b. If more eligible NGOs remain within current radius:
     ↓
33b. Agent 3 selects next nearest NGO (excluding rejected)
     ↓
34b. Go to step 23
     ↓
35b. Else: Expand radius by 5 km and restart from step 19

OR

27c. Timeout occurs (30 minutes, no response)
     ↓
28c. Step Functions timeout handler triggered
     ↓
29c. NGO remains eligible for future attempts (not marked as rejected)
     ↓
30c. If more eligible NGOs remain within current radius:
     ↓
31c. Agent 3 selects next nearest NGO
     ↓
32c. Go to step 23
     ↓
33c. Else: Expand radius by 5 km and restart from step 19
     ↓
34c. If maximum radius (30 km) reached: Mark as "Unassigned", escalate to admin
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
2. System captures donor's GPS location using browser geolocation API
   ↓
3. Frontend sends POST /api/donations with amount and location
   ↓
4. Backend calls Amazon Location Service to find all NGOs within 50 km radius
   ↓
5. If NGOs found within 50 km:
   ↓
6. Backend calculates equal distribution amount per NGO
   ↓
7. Go to step 11
   ↓
8. If no NGOs found within 50 km:
   ↓
9. Backend expands radius progressively: 50 km → 100 km → 200 km
   ↓
10. If still no NGOs found after 200 km:
    ↓
    Backend queries for nearest verified NGO in donor's state
    ↓
    Allocate entire donation to that NGO
    ↓
11. Backend creates donation record with "pending" status in Amazon RDS
    ↓
12. Backend creates distribution records for each NGO in donation_distributions table
    ↓
13. Backend integrates with real payment gateway (Razorpay/Stripe sandbox)
    ↓
14. Backend returns payment gateway URL to frontend
    ↓
15. Frontend redirects user to payment gateway
    ↓
16. User completes payment on gateway
    ↓
17. Payment gateway sends webhook callback to backend
    ↓
18. Backend verifies payment signature
    ↓
19. Backend updates donation status to "completed" in RDS
    ↓
20. Backend updates each NGO's total_donations with their distributed share
    ↓
21. Backend logs: total amount, list of recipient NGOs, distributed share per NGO, search radius used
    ↓
22. Backend sends in-app notification to citizen with distribution details
    ↓
23. Backend sends email notification via AWS SES to each recipient NGO
    ↓
24. Frontend shows confirmation page with distribution breakdown
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

# Database (Amazon RDS)
DB_HOST=pawbridge-db.xxxxx.us-east-1.rds.amazonaws.com
DB_PORT=3306
DB_NAME=pawbridge
DB_USER=admin
DB_PASSWORD=secure-password

# JWT
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=7d

# AWS Configuration
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key

# AWS S3
S3_BUCKET_NAME=pawbridge-media
S3_REGION=us-east-1
MAX_IMAGE_SIZE=26214400  # 25MB in bytes
MAX_VIDEO_SIZE=104857600  # 100MB in bytes
ALLOWED_IMAGE_TYPES=image/jpeg,image/png
ALLOWED_VIDEO_TYPES=video/mp4,video/quicktime

# AWS Bedrock
BEDROCK_MODEL_ID=anthropic.claude-3-sonnet-20240229-v1:0
BEDROCK_REGION=us-east-1

# AWS Step Functions
STEP_FUNCTION_ARN_INJURY=arn:aws:states:us-east-1:xxxxx:stateMachine:InjuryReportWorkflow
STEP_FUNCTION_ARN_ABUSE=arn:aws:states:us-east-1:xxxxx:stateMachine:AbuseReportWorkflow

# AWS SES
SES_REGION=us-east-1
SES_FROM_EMAIL=noreply@pawbridge.org
SES_VERIFIED_DOMAIN=pawbridge.org

# Amazon Location Service
LOCATION_SERVICE_PLACE_INDEX=PawBridgePlaceIndex
LOCATION_SERVICE_ROUTE_CALCULATOR=PawBridgeRouteCalculator
LOCATION_SERVICE_REGION=us-east-1

# Payment Gateway (Razorpay/Stripe)
PAYMENT_GATEWAY=razorpay
RAZORPAY_KEY_ID=rzp_test_xxxxx
RAZORPAY_KEY_SECRET=your-secret
RAZORPAY_WEBHOOK_SECRET=whsec_xxxxx

# Frontend
REACT_APP_API_URL=http://localhost:3000/api
REACT_APP_AWS_REGION=us-east-1
REACT_APP_LOCATION_SERVICE_MAP=PawBridgeMap
REACT_APP_PAYMENT_GATEWAY_KEY=rzp_test_xxxxx
```

### Project Structure

```
pawbridge/
├── backend/
│   ├── src/
│   │   ├── config/
│   │   │   ├── database.js          # Amazon RDS connection config
│   │   │   ├── aws.js               # AWS SDK configuration
│   │   │   ├── bedrock.js           # Bedrock client setup
│   │   │   ├── s3.js                # S3 client setup
│   │   │   ├── ses.js               # SES client setup
│   │   │   ├── location.js          # Location Service client
│   │   │   └── stepFunctions.js     # Step Functions client
│   │   ├── controllers/
│   │   │   ├── authController.js
│   │   │   ├── reportController.js
│   │   │   ├── abuseController.js
│   │   │   ├── animalController.js
│   │   │   ├── donationController.js
│   │   │   ├── volunteerController.js
│   │   │   └── notificationController.js
│   │   ├── services/
│   │   │   ├── authService.js
│   │   │   ├── reportService.js
│   │   │   ├── abuseService.js
│   │   │   ├── aiService.js         # Bedrock integration
│   │   │   ├── allocationService.js
│   │   │   ├── notificationService.js
│   │   │   ├── donationService.js
│   │   │   ├── locationService.js   # Amazon Location Service
│   │   │   └── s3Service.js         # S3 upload/download
│   │   ├── repositories/
│   │   │   ├── userRepository.js
│   │   │   ├── ngoRepository.js
│   │   │   ├── reportRepository.js
│   │   │   ├── abuseReportRepository.js
│   │   │   ├── animalRepository.js
│   │   │   ├── donationRepository.js
│   │   │   ├── volunteerRepository.js
│   │   │   └── notificationRepository.js
│   │   ├── models/
│   │   │   ├── User.js
│   │   │   ├── NGO.js
│   │   │   ├── Report.js
│   │   │   ├── AbuseReport.js
│   │   │   ├── Animal.js
│   │   │   ├── Donation.js
│   │   │   ├── Volunteer.js
│   │   │   └── Notification.js
│   │   ├── routes/
│   │   │   ├── authRoutes.js
│   │   │   ├── reportRoutes.js
│   │   │   ├── abuseRoutes.js
│   │   │   ├── animalRoutes.js
│   │   │   ├── donationRoutes.js
│   │   │   ├── volunteerRoutes.js
│   │   │   └── notificationRoutes.js
│   │   ├── middleware/
│   │   │   ├── auth.js              # JWT validation
│   │   │   ├── errorHandler.js
│   │   │   ├── upload.js            # S3 upload middleware
│   │   │   ├── validation.js
│   │   │   └── rateLimiter.js
│   │   ├── utils/
│   │   │   ├── validators.js
│   │   │   ├── helpers.js
│   │   │   └── trackingIdGenerator.js
│   │   └── app.js
│   ├── .env
│   ├── package.json
│   └── server.js
├── lambda-agents/                    # AWS Lambda functions
│   ├── agent1-ai-analysis/
│   │   ├── index.js                 # Bedrock integration
│   │   ├── package.json
│   │   └── README.md
│   ├── agent2-severity-classification/
│   │   ├── index.js
│   │   ├── package.json
│   │   └── README.md
│   ├── agent3-ngo-allocation/
│   │   ├── index.js                 # Location Service integration
│   │   ├── package.json
│   │   └── README.md
│   ├── agent4-notification/
│   │   ├── index.js                 # SES integration
│   │   ├── package.json
│   │   └── README.md
│   └── shared/
│       ├── rdsClient.js             # Shared RDS connection
│       └── utils.js
├── step-functions/
│   ├── injury-report-workflow.json  # Step Functions definition
│   ├── abuse-report-workflow.json
│   └── README.md
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   │   ├── common/
│   │   │   ├── auth/
│   │   │   ├── reports/
│   │   │   ├── abuse/
│   │   │   ├── animals/
│   │   │   ├── donations/
│   │   │   ├── volunteers/
│   │   │   ├── notifications/
│   │   │   └── chatbot/
│   │   ├── pages/
│   │   ├── services/
│   │   │   ├── api.js
│   │   │   ├── s3Upload.js
│   │   │   └── locationService.js
│   │   ├── utils/
│   │   ├── App.js
│   │   └── index.js
│   ├── .env
│   └── package.json
├── database/
│   ├── schema.sql
│   ├── migrations/
│   └── seed.sql
├── docs/
│   ├── API.md
│   ├── DEPLOYMENT.md
│   └── ARCHITECTURE.md
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
- **Backend**: AWS EC2 (t3.medium) or AWS Elastic Beanstalk
- **Frontend**: AWS S3 + CloudFront or Vercel
- **Database**: Amazon RDS (MySQL 8.0, db.t3.micro for MVP)
- **File Storage**: Amazon S3 with lifecycle policies
- **AI Processing**: Amazon Bedrock (pay-per-use)
- **Workflow Orchestration**: AWS Step Functions
- **Compute**: AWS Lambda for agent functions
- **Email**: AWS SES (Simple Email Service)
- **Maps**: Amazon Location Service

#### AWS Services Setup

**1. Amazon RDS (MySQL)**
```bash
# Create RDS instance
aws rds create-db-instance \
  --db-instance-identifier pawbridge-db \
  --db-instance-class db.t3.micro \
  --engine mysql \
  --engine-version 8.0 \
  --master-username admin \
  --master-user-password <password> \
  --allocated-storage 20 \
  --vpc-security-group-ids sg-xxxxx \
  --backup-retention-period 7 \
  --multi-az false
```

**2. Amazon S3**
```bash
# Create S3 bucket
aws s3 mb s3://pawbridge-media --region us-east-1

# Enable versioning
aws s3api put-bucket-versioning \
  --bucket pawbridge-media \
  --versioning-configuration Status=Enabled

# Set lifecycle policy
aws s3api put-bucket-lifecycle-configuration \
  --bucket pawbridge-media \
  --lifecycle-configuration file://s3-lifecycle.json
```

**3. AWS Lambda Functions**
```bash
# Deploy Agent 1 (AI Analysis)
cd lambda-agents/agent1-ai-analysis
zip -r function.zip .
aws lambda create-function \
  --function-name pawbridge-ai-analysis-agent \
  --runtime nodejs18.x \
  --role arn:aws:iam::xxxxx:role/lambda-execution-role \
  --handler index.handler \
  --zip-file fileb://function.zip \
  --timeout 30 \
  --memory-size 512

# Repeat for other agents
```

**4. AWS Step Functions**
```bash
# Create state machine
aws stepfunctions create-state-machine \
  --name InjuryReportWorkflow \
  --definition file://step-functions/injury-report-workflow.json \
  --role-arn arn:aws:iam::xxxxx:role/step-functions-execution-role
```

**5. Amazon Location Service**
```bash
# Create place index
aws location create-place-index \
  --index-name PawBridgePlaceIndex \
  --data-source Esri

# Create route calculator
aws location create-route-calculator \
  --calculator-name PawBridgeRouteCalculator \
  --data-source Esri
```

**6. AWS SES**
```bash
# Verify domain
aws ses verify-domain-identity --domain pawbridge.org

# Verify email address
aws ses verify-email-identity --email-address noreply@pawbridge.org
```

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

## MVP Simplifications for Hackathon

To ensure the platform is implementable within hackathon timeframes while maintaining core functionality, the following simplifications are acceptable:

### AI Analysis Simplifications
- **Basic Bedrock Prompts**: Use straightforward prompt engineering rather than fine-tuned models
- **Single Model**: Use Claude 3 Sonnet for all analysis (no model switching logic)
- **Simplified Confidence Thresholds**: Use fixed threshold (0.6) rather than dynamic adjustment
- **Limited Visual Indicators**: Focus on primary indicators (wounds, distress) rather than comprehensive analysis

### Step Functions Simplifications
- **Linear Workflow**: Implement sequential state machine without complex branching
- **Fixed Timeouts**: Use 30-minute timeout for all cases (no dynamic adjustment)
- **Limited Retry Cycles**: Maximum 3 retries per agent with exponential backoff
- **Basic Error Handling**: Simple fallback to default values rather than sophisticated error recovery

### Location Service Simplifications
- **Haversine Formula**: Use simple distance calculation as primary method, Amazon Location Service as enhancement
- **Fixed Radius Expansion**: Use predetermined increments (5 km) rather than intelligent expansion
- **No Route Optimization**: Select NGOs by straight-line distance, not actual travel distance

### Notification Simplifications
- **Polling for In-App**: Use periodic polling (every 30 seconds) rather than WebSocket real-time updates
- **Email Only for Volunteering**: Skip SMS notifications entirely for MVP
- **Basic Templates**: Use simple text templates rather than rich HTML emails
- **No Push Notifications**: Web-only notifications, no mobile push

### Payment Gateway Simplifications
- **Sandbox Mode**: Use Razorpay/Stripe test mode with test cards
- **Manual Verification**: Admin manually verifies large donations
- **Basic Webhook**: Simple webhook handler without signature verification complexity
- **No Refunds**: Refund functionality deferred to post-MVP

### Database Simplifications
- **Single RDS Instance**: No read replicas or multi-AZ deployment for MVP
- **Basic Indexing**: Only essential indexes on frequently queried columns
- **No Caching**: Direct database queries without Redis/Memcached layer
- **Manual Backups**: Daily automated backups via RDS, no point-in-time recovery

### Frontend Simplifications
- **Basic UI**: Clean but simple interface using React + Tailwind CSS
- **Limited Animations**: Minimal transitions and animations
- **Desktop-First**: Optimize for desktop, ensure mobile works but not pixel-perfect
- **No Offline Support**: Require active internet connection

### Testing Simplifications
- **Manual Testing**: Focus on manual testing of critical paths
- **Basic Unit Tests**: Test core business logic only
- **No E2E Tests**: Skip Cypress/Playwright for MVP
- **Postman Collection**: API testing via Postman rather than automated tests

### Deployment Simplifications
- **Single Region**: Deploy all AWS resources in us-east-1 only
- **No CDN**: Serve frontend directly from S3 without CloudFront
- **Basic Monitoring**: CloudWatch logs only, no custom dashboards
- **Manual Deployment**: Deploy via AWS CLI/Console rather than CI/CD pipeline

### Acceptable Trade-offs
- **Performance**: 3-5 second response times acceptable for AI analysis
- **Scalability**: Support 50-100 concurrent users (sufficient for demo)
- **Availability**: 95% uptime acceptable (not 99.9%)
- **Security**: Basic security measures, defer advanced threat protection

These simplifications allow the team to deliver a functional, demonstrable MVP within hackathon constraints while maintaining the core value proposition and architectural integrity.

## MVP Practical Constraints

To ensure PawBridge is implementable within a 48-hour hackathon timeframe, the following practical constraints and simplifications are applied:

### Workflow Constraints
- **Linear Step Function State Machine**: Sequential agent execution without complex branching or parallel states
- **Fixed 30-Minute Timeout**: All NGO response timeouts set to 30 minutes (no dynamic adjustment)
- **Maximum 3 Retry Attempts**: Limit retry cycles to 3 attempts per agent to prevent infinite loops
- **Single AWS Region**: Deploy all resources in us-east-1 only (no multi-region setup)

### Notification Constraints
- **No SMS Notifications**: Email and in-app notifications only (no SMS gateway integration)
- **Polling-Based In-App**: Use 30-second polling instead of WebSocket for MVP simplicity
- **Plain Text Emails**: Simple text-based email templates (no HTML/CSS styling)
- **No Push Notifications**: Web-only notifications (no mobile push notification service)

### Infrastructure Constraints
- **Sandbox Payment Gateway**: Use Razorpay/Stripe test mode with test cards only
- **Single RDS Instance**: No read replicas or multi-AZ deployment
- **No CDN**: Serve frontend directly from S3 without CloudFront
- **No Caching Layer**: Direct database queries without Redis/Memcached
- **Manual Deployment**: Deploy via AWS CLI/Console (no CI/CD pipeline)

### AI Constraints
- **Basic Bedrock Prompts**: Use straightforward prompt engineering (no fine-tuning)
- **Single Model**: Claude 3 Sonnet for all analysis (no model switching)
- **Fixed Confidence Threshold**: Use 0.6 threshold for all classifications
- **Limited Visual Indicators**: Focus on primary indicators only

### Database Constraints
- **Basic Indexing**: Only essential indexes on frequently queried columns
- **No Spatial Indexes**: Use Haversine formula instead of MySQL spatial functions
- **Manual Backups**: Daily automated RDS backups (no point-in-time recovery)
- **No Connection Pooling**: Direct database connections (acceptable for <100 concurrent users)

### Frontend Constraints
- **Vanilla JavaScript or Lightweight Framework**: Avoid heavy frameworks if possible
- **Basic UI**: Clean but simple interface (Tailwind CSS or Bootstrap)
- **Desktop-First**: Optimize for desktop, ensure mobile works but not pixel-perfect
- **No Offline Support**: Require active internet connection
- **Limited Animations**: Minimal transitions and animations

### Testing Constraints
- **Manual Testing**: Focus on manual testing of critical paths
- **Postman Collection**: API testing via Postman (no automated test suites)
- **No E2E Tests**: Skip Cypress/Playwright for MVP
- **Basic Unit Tests**: Test core business logic only (optional)

### Security Constraints
- **Basic Authentication**: JWT tokens with bcrypt password hashing
- **No Rate Limiting**: Skip API rate limiting for MVP (add if time permits)
- **Basic Input Validation**: Essential validation only
- **No Advanced Threat Protection**: Basic security measures sufficient

### Acceptable Trade-offs
- **Performance**: 3-5 second response times acceptable for AI analysis
- **Scalability**: Support 50-100 concurrent users (sufficient for demo)
- **Availability**: 95% uptime acceptable (not 99.9%)
- **Error Handling**: Basic error messages (no sophisticated error recovery)

### Out of Scope for MVP
- WebSocket real-time notifications
- SMS notifications
- Advanced AI model fine-tuning
- Multi-region deployment
- CDN integration
- Automated CI/CD pipeline
- Comprehensive test coverage
- Advanced monitoring dashboards
- Mobile native applications
- Offline functionality

These constraints ensure the platform remains implementable within the 48-hour hackathon window while delivering core functionality that demonstrates the value proposition to judges.

