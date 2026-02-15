# PawBridge - Requirements Document

## Problem Statement

Injured stray animals often go unnoticed or unreported, leading to prolonged suffering and preventable deaths. Citizens who want to help lack a coordinated system to connect with NGOs that have the resources and expertise to rescue these animals. Additionally, there is no centralized platform for animal adoption, donations to animal welfare NGOs, or volunteer coordination.

PawBridge addresses this gap by providing a web-based platform that:
- Enables quick reporting of injured animals with AI-assisted severity detection
- Automatically connects reports to nearby NGOs for rapid response
- Facilitates animal adoption, donations, and volunteer coordination
- Creates a transparent ecosystem for animal welfare activities

## System Overview

PawBridge is a civic-tech platform connecting citizens, NGOs, and volunteers to coordinate stray animal rescue, adoption, donation, and volunteering activities. The system uses computer vision for injury detection and location-based routing for the injury reporting module, while keeping other modules simple and manual to ensure reliability and maintainability as an MVP.

### Core Modules
1. **Injury Reporting** - AI-assisted reporting with automatic NGO allocation
2. **Adoption** - Manual animal adoption workflow
3. **Donation** - Transparent donation tracking
4. **Volunteering** - Volunteer registration and opportunity matching
5. **Homepage Chatbot** - Basic navigation assistance

## User Roles

### 1. Citizen
- Report injured animals
- Browse and request animal adoption
- Donate to NGOs
- Register as volunteer
- Track status of their reports and requests

### 2. NGO
- Receive and respond to injury reports
- Upload animals for adoption
- Review and approve/reject adoption requests
- Receive donations
- Post volunteering opportunities
- View and contact volunteers
- Update rescue case status

### 3. Volunteer
- A volunteer is a user who opts into the volunteer role
- Volunteers can also report injured animals and request animal adoption (same capabilities as citizens)
- Register with skills and availability
- Browse volunteering opportunities
- Respond to NGO requests

### 4. Admin
- Manage user accounts (Citizens, NGOs, Volunteers)
- Monitor system activity
- Configure system parameters (e.g., response time thresholds, radius limits)
- View analytics and reports
- Moderate content

## Functional Requirements

### Module 1: Injury Reporting (AI-Assisted)

#### 1.1 Report Submission
**As a** Citizen  
**I want to** report an injured stray animal by uploading a photo  
**So that** the animal can receive timely medical attention

**Acceptance Criteria:**
- System captures user's GPS location automatically
- User can upload one or more images of the injured animal (max 25MB per image)
- System validates image format (JPEG, PNG) and size before upload
- Images are stored in cloud storage with reference paths saved in database
- User can optionally add text description
- Report is submitted successfully with confirmation message

#### 1.2 AI Image Analysis and Description Generation
**As a** System  
**I want to** analyze uploaded images using computer vision  
**So that** I can classify animal type, injury severity, and generate a preliminary injury description

**Acceptance Criteria:**
- Computer vision model processes the uploaded image
- System classifies animal type (dog, cat, bird, other)
- System determines injury severity (low, medium, high, critical)
- System generates an automatic preliminary injury description based on the analysis
- Generated description is editable by the user before final submission
- Final edited description is stored in the database
- Analysis completes within 10 seconds
- If analysis fails, system defaults to "unknown" classification and proceeds with manual review flag

#### 1.3 NGO Allocation
**As a** System  
**I want to** automatically assign reports to the nearest suitable NGO  
**So that** rescue response time is minimized

**Acceptance Criteria:**
- System identifies NGOs within 10 km radius of incident location
- NGOs are sorted by distance (nearest first)
- System sends notification to the nearest NGO
- NGO receives report details including images, location, animal type, and severity
- System tracks notification delivery status

#### 1.4 NGO Response Handling
**As an** NGO  
**I want to** accept or reject incoming rescue cases  
**So that** I can manage cases based on my capacity

**Acceptance Criteria:**
- NGO receives real-time notification of new case
- NGO can view full case details before responding
- NGO can accept or reject the case
- If NGO accepts, case is assigned to them
- If NGO rejects or doesn't respond within 30 minutes, system reallocates to next nearest NGO within 10 km radius
- System sequentially notifies ALL eligible NGOs within 10 km radius until a case is accepted or all NGOs have been attempted
- If all NGOs reject or do not respond, case remains unresolved and status is updated to "unassigned"
- Citizen is notified of case status throughout the process

#### 1.5 Case Status Updates
**As an** NGO  
**I want to** update the status of rescue cases  
**So that** citizens are informed about rescue progress

**Acceptance Criteria:**
- NGO can update case status using standardized enum values: "Pending", "Accepted", "NGO_Departing", "NGO_Arrived", "Under_Treatment", "Treated", "Transferred", "Rejected", "Deceased"
- Each status update is timestamped
- Citizen who reported receives real-time notification on status changes
- Status history is maintained for each case with full audit trail

#### 1.6 Case Tracking
**As a** Citizen  
**I want to** track the status of my reported cases  
**So that** I know the outcome of my report

**Acceptance Criteria:**
- Citizen can view all their submitted reports
- Each report shows current status and timeline
- Citizen can see which NGO is handling the case
- Citizen receives notifications for status updates

### Module 2: Adoption (Non-AI)

#### 2.1 Animal Listing
**As an** NGO  
**I want to** upload animals available for adoption  
**So that** citizens can adopt them

**Acceptance Criteria:**
- NGO can create animal profile with photos, name, age, species, breed, health status, and description
- NGO can mark animals as "Available", "Pending", or "Adopted"
- NGO can edit or remove animal listings
- System validates required fields before submission

#### 2.2 Browse Animals
**As a** Citizen  
**I want to** browse available animals for adoption  
**So that** I can find a suitable pet

**Acceptance Criteria:**
- Citizen can view all animals marked as "Available"
- Citizen can filter by animal type, age, location
- Each listing shows photos, basic details, and NGO information
- Citizen can view detailed animal profile

#### 2.3 Adoption Request
**As a** Citizen  
**I want to** submit an adoption request  
**So that** I can adopt an animal

**Acceptance Criteria:**
- Citizen can submit adoption request for an animal
- Request includes citizen contact information and optional message
- NGO receives notification of new adoption request
- Request status is tracked: "Pending", "Approved", "Rejected"

#### 2.4 Adoption Review
**As an** NGO  
**I want to** review and respond to adoption requests  
**So that** I can ensure animals go to suitable homes

**Acceptance Criteria:**
- NGO can view all adoption requests for their animals
- NGO can approve or reject requests with optional notes
- Citizen receives notification of decision
- When approved, animal status changes to "Pending"
- NGO can manually mark animal as "Adopted" after completion

### Module 3: Donation (Non-AI)

#### 3.1 NGO Donation Page
**As an** NGO  
**I want to** have a donation page on the platform  
**So that** citizens can support our work

**Acceptance Criteria:**
- Each NGO has a dedicated donation page
- Page displays NGO information, mission, and impact statistics
- Page shows donation history (total amount, number of donors)

#### 3.2 Make Donation with Geographic Distribution
**As a** Citizen  
**I want to** donate money via PawBridge  
**So that** I can support animal welfare in my vicinity

**Acceptance Criteria:**
- Citizen enters donation amount on the platform
- System captures donor's geographic location
- System identifies all NGOs within the donor's geographic vicinity
- Donated amount is distributed equally among all NGOs within that vicinity
- System supports payment gateway integration (mock for MVP)
- Citizen receives donation confirmation with distribution details
- System logs: total donation amount, list of recipient NGOs, and equal distributed share per NGO
- Citizen can view their donation history

#### 3.3 Donation Transparency
**As a** Citizen  
**I want to** see how donations are distributed  
**So that** I can trust the platform

**Acceptance Criteria:**
- System maintains transparent log of all donations with distribution details
- Each donation record shows total amount and how it was distributed among NGOs
- NGO donation page shows total donations received
- NGO can optionally add impact updates
- No business monetization logic is applied to donations

### Module 4: Volunteering (Non-AI)

#### 4.1 Volunteer Registration
**As a** Citizen  
**I want to** register as a volunteer  
**So that** I can help NGOs with their work

**Acceptance Criteria:**
- Citizen can opt into the volunteer role while maintaining citizen capabilities
- Volunteer can create profile with skills, availability, and location
- Profile includes contact information
- Volunteer can edit profile anytime
- Profile is visible to NGOs
- Volunteers retain ability to report injured animals and request adoptions

#### 4.2 Post Opportunities
**As an** NGO  
**I want to** post volunteering opportunities  
**So that** I can get help from volunteers

**Acceptance Criteria:**
- NGO can create opportunity with title, description, required skills, location, and date/time
- NGO can mark opportunities as "Open", "Filled", or "Completed"
- NGO can edit or delete opportunities

#### 4.3 Browse Opportunities
**As a** Volunteer  
**I want to** browse volunteering opportunities  
**So that** I can find ways to help

**Acceptance Criteria:**
- Volunteer can view all open opportunities
- Volunteer can filter by location, date, and required skills
- Each opportunity shows NGO details and requirements

#### 4.4 Volunteer Coordination
**As an** NGO  
**I want to** view registered volunteers and contact them  
**So that** I can coordinate activities

**Acceptance Criteria:**
- NGO can browse volunteer profiles
- NGO can filter volunteers by skills, location, and availability
- NGO can view volunteer contact information
- Coordination happens outside the platform (phone/email)

### Module 5: Homepage Chatbot (Basic)

#### 5.1 Navigation Assistance
**As a** User  
**I want to** get help navigating the platform  
**So that** I can quickly access the features I need

**Acceptance Criteria:**
- Chatbot is accessible from homepage
- Chatbot can answer questions about platform features
- Chatbot can direct users to specific modules
- Chatbot provides links to relevant pages
- Chatbot has predefined responses (no advanced AI reasoning)

#### 5.2 Chatbot Limitations
**As a** System  
**I want to** ensure chatbot stays within scope  
**So that** users receive accurate information

**Acceptance Criteria:**
- Chatbot does NOT provide medical advice
- Chatbot does NOT provide legal advice
- Chatbot clearly states limitations when asked out-of-scope questions
- Chatbot redirects complex queries to appropriate NGOs or admin

## Non-Functional Requirements

### Performance
- Page load time: < 3 seconds on standard broadband
- Image upload: < 15 seconds for 25MB image
- AI analysis: < 10 seconds per image
- System should handle 100 concurrent users (MVP scale)

### Security
- User authentication required for all actions except browsing
- Password encryption using bcrypt
- HTTPS for all communications
- Image uploads validated for file type and size (max 25MB) before upload
- Image uploads scanned for malicious content
- Images stored in cloud storage with secure access controls
- Role-based access control (RBAC)

### Usability
- Mobile-responsive design (works on phones, tablets, desktops)
- Simple, intuitive UI suitable for non-technical users
- Multi-language support (English as primary, extensible for others)
- Accessibility compliance (WCAG 2.1 Level A minimum)

### Reliability
- 95% uptime for MVP
- Automated database backups daily
- Error logging and monitoring
- Graceful degradation if AI service fails

### Scalability
- Database design supports growth to 10,000 users
- Modular architecture allows feature additions
- API-based design for future mobile app integration

### Maintainability
- Clean, documented code
- Separation of concerns (frontend/backend/database)
- Version control using Git
- Environment-based configuration

## Assumptions

1. **Internet Connectivity**: Users have stable internet access for uploading images and receiving notifications
2. **GPS Availability**: Citizens' devices have GPS capability and permission granted
3. **NGO Participation**: Sufficient NGOs are registered and active on the platform
4. **Payment Gateway**: Third-party payment gateway is available for donations (mock for MVP)
5. **Computer Vision Model**: Pre-trained model is available or can be fine-tuned for animal injury detection
6. **OpenStreetMap**: OpenStreetMap API is accessible and provides accurate location data
7. **Notification System**: Email/SMS notification service is available (can use free tier services for MVP)
8. **Image Storage**: Cloud storage is available for uploaded images (up to 25MB per image)
9. **User Verification**: Basic email verification is sufficient for user registration
10. **Legal Compliance**: Platform operates within legal framework for animal welfare and data privacy
11. **Response Time**: 30-minute response window is reasonable for NGOs to check notifications
12. **Radius Limit**: 10 km radius is appropriate for urban/semi-urban areas where NGOs operate
13. **Manual Coordination**: Adoption finalization and volunteer coordination can happen outside the platform
14. **MVP Scope**: Advanced features (analytics, recommendations, abuse reporting) are out of scope for initial release

## Out of Scope (Explicitly Excluded)

- Abuse reporting functionality
- Legal case handling
- Rejection reason text analysis
- Predictive analytics
- Behavioral learning systems
- Advanced autonomous decision engines
- AI-based volunteer matching
- Business monetization logic for donations
- Medical advice through chatbot
- Legal advice through chatbot
- Advanced chatbot reasoning capabilities
- Payment processing (use mock/third-party gateway)
- Mobile native applications (web-only for MVP)
- Real-time video streaming
- Social media integration
- Gamification features
