# PAWBRIDGE BACKEND — DEPENDENCY GRAPH

## Visual Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                         CLIENT REQUESTS                          │
└─────────────────────────────────────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────┐
│                            ROUTES                                │
│  authRoutes, reportRoutes, abuseRoutes, animalRoutes,           │
│  adoptionRoutes, donationRoutes, volunteerRoutes                │
└─────────────────────────────────────────────────────────────────┘
                                 │
                    ┌────────────┴────────────┐
                    ▼                         ▼
         ┌──────────────────┐      ┌──────────────────┐
         │   MIDDLEWARE     │      │   MIDDLEWARE     │
         │                  │      │                  │
         │  - auth.js       │      │  - validation.js │
         │  - requireRole() │      │  - validate()    │
         └──────────────────┘      └──────────────────┘
                    │                         │
                    └────────────┬────────────┘
                                 ▼
┌─────────────────────────────────────────────────────────────────┐
│                         CONTROLLERS                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐         │
│  │   abuse      │  │   report     │  │   animal     │         │
│  │ Controller   │  │ Controller   │  │ Controller   │         │
│  └──────────────┘  └──────────────┘  └──────────────┘         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐         │
│  │  adoption    │  │  donation    │  │  volunteer   │         │
│  │ Controller   │  │ Controller   │  │ Controller   │         │
│  └──────────────┘  └──────────────┘  └──────────────┘         │
│  ┌──────────────┐                                               │
│  │    auth      │                                               │
│  │ Controller   │                                               │
│  └──────────────┘                                               │
└─────────────────────────────────────────────────────────────────┘
                    │                         │
         ┌──────────┴──────────┐   ┌─────────┴──────────┐
         ▼                     ▼   ▼                    ▼
┌──────────────────┐  ┌──────────────────────────────────────────┐
│    SERVICES      │  │              MODELS                       │
│                  │  │                                           │
│  - aiService     │  │  - User          - AbuseReport           │
│  - geoService    │  │  - NGO           - Report                │
│  - mediaService  │  │  - Animal        - Adoption              │
│  - emailService  │  │  - Donation      - Volunteer             │
│  - notification  │  │                                           │
│  - donation      │  │                                           │
│    Service       │  │                                           │
└──────────────────┘  └──────────────────────────────────────────┘
         │                                    │
         │                                    ▼
         │                         ┌──────────────────┐
         │                         │  DATABASE CONFIG │
         │                         │                  │
         │                         │  - pool          │
         │                         │  - connection    │
         │                         └──────────────────┘
         │                                    │
         │                                    ▼
         │                         ┌──────────────────┐
         │                         │   MYSQL DATABASE │
         │                         │                  │
         │                         │  - users         │
         │                         │  - ngos          │
         │                         │  - reports       │
         │                         │  - abuse_reports │
         │                         │  - animals       │
         │                         │  - donations     │
         │                         │  - volunteers    │
         │                         │  - notifications │
         │                         └──────────────────┘
         │
         ▼
┌──────────────────────────────────────────────────────────────────┐
│                    EXTERNAL SYSTEMS (Phase 1)                     │
│                                                                   │
│  - Local File System (multer)                                    │
│  - Gmail SMTP (nodemailer)                                       │
│  - Mock AI (keyword-based)                                       │
│  - Haversine Formula (manual calculation)                        │
└──────────────────────────────────────────────────────────────────┘
```

---

## Detailed Controller Dependencies

### abuseController.js
```
abuseController
├── SERVICES
│   ├── aiService.analyzeMedia()
│   ├── geoService.getRadiusForSeverity()
│   ├── geoService.findNGOsWithinRadius()
│   ├── mediaService.uploadFile()
│   └── notificationService.createNotification()
└── MODELS
    ├── AbuseReport.create()
    ├── AbuseReport.addMedia()
    ├── AbuseReport.findById()
    ├── AbuseReport.findByTrackingId()
    ├── AbuseReport.findByReporterId()
    ├── AbuseReport.findByNGOId()
    ├── AbuseReport.assignToNGO()
    ├── AbuseReport.updateStatus()
    ├── AbuseReport.getMedia()
    ├── AbuseReport.getStatusHistory()
    ├── AbuseReport.generateTrackingId()
    └── NGO.findAll()
```

### reportController.js
```
reportController
├── SERVICES
│   ├── aiService.analyzeMedia()
│   ├── geoService.getRadiusForSeverity()
│   ├── geoService.findNGOsWithinRadius()
│   ├── mediaService.uploadFile()
│   └── notificationService.createNotification()
└── MODELS
    ├── Report.create()
    ├── Report.addImage()
    ├── Report.findById()
    ├── Report.findByCitizenId()
    ├── Report.findByNGOId()
    ├── Report.assignToNGO()
    ├── Report.updateStatus()
    ├── Report.getImages()
    ├── Report.getStatusHistory()
    └── NGO.findByUserId()
```

### animalController.js
```
animalController
├── SERVICES
│   ├── mediaService.uploadFile()
│   └── notificationService.createNotification()
└── MODELS
    ├── Animal.create()
    ├── Animal.findById()
    ├── Animal.findAvailable()
    ├── Animal.findByNGOId()
    ├── Animal.update()
    ├── Animal.updateStatus()
    ├── Animal.deleteById()
    ├── Animal.addImage()
    ├── Animal.getImages()
    ├── Animal.removeImage()
    ├── Animal.search()
    └── NGO.findByUserId()
```

### adoptionController.js
```
adoptionController
├── SERVICES
│   └── notificationService.createNotification()
└── MODELS
    ├── Adoption.create()
    ├── Adoption.findById()
    ├── Adoption.findByCitizenId()
    ├── Adoption.findByNGOId()
    ├── Adoption.findByAnimalId()
    ├── Adoption.updateStatus()
    ├── Adoption.hasPendingRequest()
    ├── Adoption.getStatistics()
    ├── Adoption.deleteById()
    ├── Animal.findById()
    ├── Animal.updateStatus()
    └── NGO.findByUserId()
```

### donationController.js
```
donationController
├── SERVICES
│   ├── geoService.findNGOsForDonation()
│   ├── donationService.calculateDistribution()
│   └── notificationService.createNotification()
└── MODELS
    ├── Donation.create()
    ├── Donation.findById()
    ├── Donation.findByCitizenId()
    ├── Donation.findByNGOId()
    ├── Donation.updatePaymentStatus()
    ├── Donation.createDistribution()
    ├── Donation.getDistributions()
    ├── Donation.updateNGOTotalDonations()
    ├── Donation.getStatistics()
    ├── Donation.getTopNGOsByDonations()
    └── NGO.findAll()
```

### volunteerController.js
```
volunteerController
├── SERVICES
│   ├── emailService.sendEmail()
│   └── notificationService.createNotification()
└── MODELS
    ├── Volunteer.createOrUpdate()
    ├── Volunteer.findByUserId()
    ├── Volunteer.findById()
    ├── Volunteer.findAll()
    ├── Volunteer.deleteByUserId()
    ├── Volunteer.createOpportunity()
    ├── Volunteer.findOpportunityById()
    ├── Volunteer.findOpportunities()
    ├── Volunteer.findOpportunitiesByNGOId()
    ├── Volunteer.updateOpportunity()
    ├── Volunteer.updateOpportunityStatus()
    ├── Volunteer.deleteOpportunity()
    ├── Volunteer.searchBySkills()
    └── NGO.findByUserId()
```

### authController.js
```
authController
├── SERVICES
│   └── (none - uses models only)
└── MODELS
    ├── User.create()
    ├── User.findByEmail()
    ├── User.findById()
    ├── User.verifyPassword()
    ├── User.update()
    └── NGO.create()
```

---

## Service Layer Details

### aiService.js (Phase 1: Mock)
```
INPUT:  mediaPath, userDescription, caseType
OUTPUT: { animalType, severity, generatedDescription, confidence }
DEPENDENCIES: None
EXTERNAL: None (mock implementation)
```

### geoService.js (Phase 1: Haversine)
```
FUNCTIONS:
  - calculateDistance(lat1, lon1, lat2, lon2) → distance in km
  - findNGOsWithinRadius(ngos, lat, lon, radius) → filtered NGOs
  - findNGOsForDonation(ngos, lat, lon, state) → eligible NGOs
  - getRadiusForSeverity(severity) → radius config

DEPENDENCIES: None
EXTERNAL: None (manual calculation)
```

### mediaService.js (Phase 1: Multer)
```
FUNCTIONS:
  - uploadFile(file) → fileUrl
  - getFileUrl(filename, type) → url
  - deleteFile(fileUrl) → void

DEPENDENCIES: multer, fs
EXTERNAL: Local file system (./uploads/)
```

### emailService.js (Phase 1: Nodemailer)
```
FUNCTIONS:
  - sendEmail(to, subject, text) → result
  - sendVolunteerOpportunityEmail(email, opportunity) → result
  - sendNGOVolunteerNotification(email, volunteer, opportunity) → result

DEPENDENCIES: nodemailer
EXTERNAL: Gmail SMTP
```

### notificationService.js
```
FUNCTIONS:
  - createNotification(userId, type, title, message, ...) → notification
  - getUserNotifications(userId, page, limit) → notifications[]
  - getUnreadCount(userId) → count
  - markAsRead(notificationId, userId) → boolean
  - markAllAsRead(userId) → count
  - deleteNotification(notificationId, userId) → boolean

DEPENDENCIES: database.pool
EXTERNAL: MySQL database (notifications table)
```

### donationService.js (NEW)
```
FUNCTIONS:
  - calculateDistribution(totalAmount, eligibleNGOs) → distributions

DEPENDENCIES: None
EXTERNAL: None (pure calculation)
```

---

## Data Flow Examples

### Example 1: Create Injury Report
```
1. POST /api/reports
   ↓
2. reportRoutes → authenticateToken → upload.array() → reportValidation
   ↓
3. reportController.createReport()
   ↓
4. mediaService.uploadFile() → local file system
   ↓
5. aiService.analyzeMedia() → mock classification
   ↓
6. geoService.getRadiusForSeverity() → radius calculation
   ↓
7. NGO.findAll() → database query
   ↓
8. geoService.findNGOsWithinRadius() → Haversine filtering
   ↓
9. Report.create() → database insert
   ↓
10. Report.addImage() → database insert
   ↓
11. Report.assignToNGO() → database update
   ↓
12. notificationService.createNotification() → database insert (2x)
   ↓
13. Report.findById() → database query
   ↓
14. Response: { success: true, report: {...} }
```

### Example 2: Create Donation
```
1. POST /api/donations
   ↓
2. donationRoutes → authenticateToken
   ↓
3. donationController.createDonation()
   ↓
4. NGO.findAll() → database query
   ↓
5. geoService.findNGOsForDonation() → progressive radius search
   ↓
6. donationService.calculateDistribution() → financial calculation
   ↓
7. Donation.create() → database insert
   ↓
8. Donation.createDistribution() → database insert (multiple)
   ↓
9. Response: { success: true, data: {...} }
```

---

## Phase 2 Migration Impact

### Files That Will Change
```
✓ backend/src/services/aiService.js
  - Add: @aws-sdk/client-bedrock-runtime
  - Replace: mock logic → Bedrock API calls
  - Keep: function signatures identical

✓ backend/src/services/mediaService.js
  - Add: @aws-sdk/client-s3
  - Replace: multer local storage → S3 upload
  - Keep: function signatures identical

✓ backend/src/services/emailService.js
  - Add: @aws-sdk/client-ses
  - Replace: nodemailer → SES
  - Keep: function signatures identical

✓ backend/src/config/database.js
  - Update: connection string to RDS endpoint
  - Keep: pool interface identical
```

### Files That Will NOT Change
```
✗ All controllers (7 files)
✗ All routes (8 files)
✗ All models (8 files)
✗ All middleware (2 files)
✗ app.js
✗ server.js
```

**Total Impact:** 4 files to modify out of 35+ files = **11% code change**

---

## Verification Checklist

- [x] No controllers access database directly
- [x] No controllers contain business logic
- [x] All services have clean interfaces
- [x] All models match database schema
- [x] No circular dependencies
- [x] No AWS SDK in Phase 1
- [x] Mock AI implementation
- [x] Haversine geo calculation
- [x] Multer local storage
- [x] Nodemailer email
- [x] Phase 2 migration path documented
- [x] Controller signatures remain stable
