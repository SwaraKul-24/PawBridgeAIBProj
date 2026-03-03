# PawBridge Backend - Phase 1

This is the Phase 1 backend implementation for PawBridge, designed for local development with service abstraction for easy Phase 2 AWS migration.

## Architecture Overview

The backend follows MVC architecture with a services layer that abstracts all external dependencies:

- **Controllers**: Handle HTTP requests and responses
- **Services**: Business logic and external service abstraction
- **Models**: Database operations and data access
- **Routes**: API endpoint definitions
- **Middleware**: Authentication, validation, and error handling

## Phase 1 vs Phase 2

**Phase 1 (Current)**: Local development with mock/local services
- Local MySQL database
- Multer for file uploads (local storage)
- Nodemailer with Gmail SMTP
- Manual Haversine formula for geo calculations
- Mock AI service responses

**Phase 2 (Future)**: AWS services integration
- Amazon RDS (MySQL)
- Amazon S3 for file storage
- Amazon Bedrock for AI analysis
- Amazon SES for email notifications
- Amazon Location Service for geo calculations
- AWS Step Functions for workflow orchestration

## Prerequisites

- Node.js 18+ 
- MySQL 8.0+
- npm or yarn

## Installation

1. **Clone and navigate to backend directory**
   ```bash
   cd backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` with your configuration:
   ```env
   # Server
   PORT=3000
   NODE_ENV=development
   
   # Database
   DB_HOST=localhost
   DB_PORT=3306
   DB_NAME=pawbridge
   DB_USER=root
   DB_PASSWORD=your_password
   
   # JWT
   JWT_SECRET=your-secret-key
   JWT_EXPIRES_IN=7d
   
   # File Upload
   UPLOAD_DIR=uploads
   MAX_FILE_SIZE=26214400
   
   # Email (Gmail SMTP)
   EMAIL_HOST=smtp.gmail.com
   EMAIL_PORT=587
   EMAIL_USER=your-email@gmail.com
   EMAIL_PASS=your-app-password
   ```

4. **Set up MySQL database**
   ```bash
   # Create database
   mysql -u root -p -e "CREATE DATABASE pawbridge CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
   
   # Run schema
   mysql -u root -p pawbridge < database/schema.sql
   
   # Optional: Run seed data
   mysql -u root -p pawbridge < database/seed.sql
   ```

5. **Start development server**
   ```bash
   npm run dev
   ```

The server will start on `http://localhost:3000`

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user profile
- `PUT /api/auth/profile` - Update user profile

### Injury Reports
- `POST /api/reports` - Create injury report
- `GET /api/reports` - Get user's reports
- `GET /api/reports/:id` - Get report details
- `POST /api/reports/:id/accept` - Accept report (NGO)
- `PUT /api/reports/:id/status` - Update report status (NGO)

### Abuse Reports
- `POST /api/abuse` - Create abuse report (anonymous/authenticated)
- `GET /api/abuse/track/:trackingId` - Track abuse report
- `GET /api/abuse` - Get user's abuse reports
- `POST /api/abuse/:id/accept` - Accept abuse report (NGO)
- `PUT /api/abuse/:id/status` - Update abuse status (NGO)

### Animals & Adoption
- `GET /api/animals` - Get available animals
- `POST /api/animals` - Create animal listing (NGO)
- `GET /api/animals/:id` - Get animal details
- `POST /api/adoptions` - Create adoption request
- `GET /api/adoptions` - Get user's adoption requests
- `PUT /api/adoptions/:id/status` - Update adoption status (NGO)

### Donations
- `POST /api/donations` - Create donation with geo-distribution
- `GET /api/donations` - Get user's donations
- `POST /api/donations/:id/simulate-payment` - Simulate payment (Phase 1)

### Volunteering
- `POST /api/volunteers/profile` - Create volunteer profile
- `GET /api/volunteers` - Get volunteers (NGO)
- `POST /api/volunteers/opportunities` - Create opportunity (NGO)
- `GET /api/volunteers/opportunities` - Get opportunities

### Notifications
- `GET /api/notifications` - Get user notifications
- `PUT /api/notifications/:id/read` - Mark as read

## Service Abstraction

All external services are abstracted in the `/services` layer:

### AI Service (`aiService.js`)
- **Phase 1**: Mock responses based on keywords
- **Phase 2**: Amazon Bedrock integration

### Media Service (`mediaService.js`)
- **Phase 1**: Multer with local file storage
- **Phase 2**: Direct S3 upload with presigned URLs

### Email Service (`emailService.js`)
- **Phase 1**: Nodemailer with Gmail SMTP
- **Phase 2**: Amazon SES

### Geo Service (`geoService.js`)
- **Phase 1**: Manual Haversine formula
- **Phase 2**: Amazon Location Service

### Notification Service (`notificationService.js`)
- **Phase 1**: Database storage + email
- **Phase 2**: Database + SES + WebSocket

## Database Schema

Key tables:
- `users` - User accounts (citizen, ngo, volunteer, admin)
- `ngos` - NGO organization details
- `reports` - Injury reports
- `abuse_reports` - Abuse reports with tracking
- `animals` - Animal listings for adoption
- `adoption_requests` - Adoption requests
- `donations` - Donation records with geo-distribution
- `volunteers` - Volunteer profiles
- `volunteering_opportunities` - Volunteer opportunities
- `notifications` - In-app notifications

## File Structure

```
backend/
├── src/
│   ├── config/
│   │   └── database.js          # MySQL connection
│   ├── controllers/             # HTTP request handlers
│   │   ├── authController.js
│   │   ├── reportController.js
│   │   ├── abuseController.js
│   │   ├── animalController.js
│   │   ├── adoptionController.js
│   │   ├── donationController.js
│   │   └── volunteerController.js
│   ├── services/                # Business logic & external services
│   │   ├── aiService.js         # AI analysis (mock → Bedrock)
│   │   ├── mediaService.js      # File upload (multer → S3)
│   │   ├── emailService.js      # Email (nodemailer → SES)
│   │   ├── geoService.js        # Geo calculations (Haversine → Location Service)
│   │   └── notificationService.js
│   ├── models/                  # Database operations
│   │   ├── User.js
│   │   ├── Report.js
│   │   ├── AbuseReport.js
│   │   ├── Animal.js
│   │   ├── Adoption.js
│   │   ├── Donation.js
│   │   └── Volunteer.js
│   ├── routes/                  # API endpoints
│   ├── middleware/              # Auth, validation, error handling
│   └── app.js                   # Express app setup
├── database/
│   ├── schema.sql               # Database schema
│   └── seed.sql                 # Sample data
├── uploads/                     # Local file storage (Phase 1)
└── package.json
```

## Testing

Run the development server and test endpoints using:
- Postman/Insomnia
- curl commands
- Frontend integration

Example test:
```bash
# Health check
curl http://localhost:3000/health

# Register user
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123","name":"Test User","role":"citizen"}'
```

## Migration to Phase 2

When ready for AWS integration:

1. **Update service implementations** in `/services` folder
2. **Add AWS SDK dependencies**
3. **Update environment variables** for AWS credentials
4. **Deploy Lambda functions** for agentic workflow
5. **Set up AWS Step Functions** for orchestration
6. **Configure Amazon RDS** connection
7. **Set up S3 bucket** and presigned URL generation

Controllers and routes remain unchanged due to service abstraction.

## Development Notes

- All external dependencies are abstracted in services
- Controllers are kept thin and focused on HTTP handling
- Database operations are centralized in models
- Validation is handled by middleware
- Error handling is centralized
- File uploads are handled by multer (Phase 1) with easy S3 migration path
- Geo calculations use Haversine formula with Location Service migration path
- AI responses are mocked with realistic data structure for Bedrock migration

## Support

For issues or questions about the backend implementation, refer to the design document or create an issue in the project repository.