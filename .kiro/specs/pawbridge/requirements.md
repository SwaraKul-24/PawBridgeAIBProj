# PawBridge - Requirements Document

## Problem Statement

Injured stray animals often go unnoticed or unreported, leading to prolonged suffering and preventable deaths. Citizens who want to help lack a coordinated system to connect with NGOs that have the resources and expertise to rescue these animals. Additionally, there is no centralized platform for animal adoption, donations to animal welfare NGOs, or volunteer coordination.

PawBridge addresses this gap by providing a web-based platform that:
- Enables quick reporting of injured animals with AI-assisted image analysis
- Automatically connects reports to nearby NGOs using distance-based routing
- Facilitates animal adoption listings and donations
- Provides volunteer opportunity management

## System Overview

PawBridge is a civic-tech platform connecting citizens, NGOs, and volunteers to coordinate stray animal rescue, adoption, donation, and volunteering activities. The system uses Gemini AI for injury image analysis and implements sequential NGO routing within a 10km radius.

### Core Modules
1. **Injury Reporting** - AI-assisted reporting with automatic NGO allocation within 10km radius
2. **Adoption** - Manual animal adoption workflow
3. **Donation** - Simple donation tracking with payment gateway integration
4. **Volunteering** - Volunteer registration and opportunity matching

## User Roles

### 1. Citizen/User
- Report injured animals
- Browse and view animal adoption listings
- Donate to the platform
- Register as volunteer and apply for opportunities
- Track status of their reports

### 2. NGO
- Receive and respond to injury reports
- Upload animals for adoption
- Manage adoption listings
- Post volunteering opportunities
- Review and accept/reject volunteer applications
- Update rescue case status

### 3. Admin
- Manage user accounts
- Verify NGO registrations
- Monitor system activity

## Functional Requirements

### Module 1: Injury Reporting (AI-Assisted)

#### 1.1 Report Submission
**As a** Citizen  
**I want to** report an injured stray animal by uploading a photo  
**So that** the animal can receive timely medical attention

**Acceptance Criteria:**
- User manually provides or selects the location when submitting a report
- User can upload one image of the injured animal
- Images are stored in Amazon S3
- User can add text description
- Report is submitted successfully with confirmation message

#### 1.2 AI Image Analysis
**As a** System  
**I want to** analyze uploaded images using Gemini AI  
**So that** I can classify animal type, injury severity, and generate a preliminary injury description

**Acceptance Criteria:**
- Gemini AI processes the uploaded image
- System classifies animal type (dog, cat, cow, goat, sheep, snake)
- System determines injury severity (Low, Medium, Critical)
- System generates an automatic preliminary injury description
- Generated description is displayed to the user
- If analysis fails, system proceeds with manual classification

#### 1.3 NGO Allocation (10km Radius)
**As a** System  
**I want to** automatically assign reports to NGOs within 10km radius  
**So that** rescue response is optimized

**Acceptance Criteria:**
- System searches for NGOs within 10km radius of report location
- NGOs are sorted by distance (nearest first)
- System sends notification to the nearest NGO
- NGO receives report details including image, location, animal type, severity, and description
- If no NGOs found within 10km, report is marked as "Rejected" and user is notified

#### 1.4 Sequential NGO Routing
**As a** System  
**I want to** route reports to the next nearest NGO if the current NGO rejects  
**So that** reports have multiple chances of being accepted

**Acceptance Criteria:**
- When an NGO rejects a report, system automatically routes to the next nearest NGO within 10km
- System tracks which NGOs have already been attempted
- System continues sequential routing until an NGO accepts or all NGOs within 10km have been attempted
- If all NGOs reject or don't respond, report status is updated to "Rejected"
- User receives notifications about routing status

#### 1.5 Case Status Updates
**As an** NGO  
**I want to** update the status of rescue cases  
**So that** citizens are informed about rescue progress

**Acceptance Criteria:**
- NGO can update case status: "Pending", "Accepted", "NGO_Departing", "NGO_Arrived", "Under_Treatment", "Treated", "Transferred", "Rejected"
- Each status update is timestamped
- Citizen who reported receives notification on status changes
- Status history is maintained for each case

#### 1.6 Case Tracking
**As a** Citizen  
**I want to** track the status of my reported cases  
**So that** I know the outcome of my report

**Acceptance Criteria:**
- Citizen can view all their submitted reports
- Each report shows current status
- Citizen can see which NGO is handling the case
- Citizen receives notifications for status updates

### Module 2: Adoption (Non-AI)

#### 2.1 Animal Listing
**As an** NGO  
**I want to** upload animals available for adoption  
**So that** citizens can view them

**Acceptance Criteria:**
- NGO can create animal profile with photo, name, age, species, breed, gender, and description
- NGO can mark animals as available or unavailable
- NGO can edit or remove animal listings
- System validates required fields before submission

#### 2.2 Browse Animals
**As a** Citizen  
**I want to** browse available animals for adoption  
**So that** I can find information about adoptable pets

**Acceptance Criteria:**
- Citizen can view all animals marked as available
- Each listing shows photo, basic details, and NGO contact information
- Citizen can view detailed animal profile
- Citizen can see NGO contact details (email, phone) to coordinate adoption directly

### Module 3: Donation (Non-AI)

#### 3.1 Make Donation
**As a** Citizen  
**I want to** donate money via PawBridge  
**So that** I can support animal welfare

**Acceptance Criteria:**
- Citizen enters donation amount on the platform
- System displays donation instructions or intent
- System records donation information in database
- Citizen can view their donation history
- Note: Payment processing is not directly integrated; donations are recorded for tracking purposes

### Module 4: Volunteering (Non-AI)

#### 4.1 Post Opportunities
**As an** NGO  
**I want to** post volunteering opportunities  
**So that** I can get help from volunteers

**Acceptance Criteria:**
- NGO can create opportunity with title, description, location, duration, volunteers needed, deadline, required skills, instructions, and badges
- NGO can view all their posted opportunities
- NGO can manage opportunity listings

#### 4.2 Browse Opportunities
**As a** Volunteer  
**I want to** browse volunteering opportunities  
**So that** I can find ways to help

**Acceptance Criteria:**
- User can view all open opportunities
- Each opportunity shows NGO details, requirements, and description
- User can view full opportunity details

#### 4.3 Apply for Opportunities
**As a** Volunteer  
**I want to** apply for volunteering opportunities  
**So that** I can participate in animal welfare activities

**Acceptance Criteria:**
- User can submit application with name, email, mobile, location, skills, motivation, and availability
- Application is sent to the NGO
- User can view their application history

#### 4.4 Manage Applications
**As an** NGO  
**I want to** review and respond to volunteer applications  
**So that** I can coordinate with volunteers

**Acceptance Criteria:**
- NGO can view all applications for their opportunities
- NGO can accept or reject applications
- When accepted, volunteer receives email notification with NGO contact details
- NGO can coordinate with volunteers via email/phone

## Non-Functional Requirements

### Performance
- Page load time: < 3 seconds on standard broadband
- Image upload: < 15 seconds for images
- AI analysis: < 10 seconds per image
- System should handle 100 concurrent users

### Security
- User authentication required for all actions except browsing
- Password encryption
- HTTPS for all communications
- Image uploads validated for file type and size
- Images stored in AWS S3 with secure access controls
- Role-based access control (RBAC)

### Storage & Infrastructure
- **Media Storage**: AWS S3 for all images
- **Database**: MySQL for relational data
- **AI Processing**: Google Gemini AI for image analysis
- **Notifications**: In-app notifications stored in database
- **Email**: Nodemailer for volunteer acceptance emails

### Usability
- Mobile-responsive design (works on phones, tablets, desktops)
- Simple, intuitive UI suitable for non-technical users

### Reliability
- Error logging and monitoring
- Graceful degradation if AI service fails
- Retry mechanisms for failed operations

### Maintainability
- Clean, documented code
- Modular architecture
- Clear separation of concerns
