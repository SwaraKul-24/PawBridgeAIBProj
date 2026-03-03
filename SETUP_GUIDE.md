# PawBridge - Complete Setup Guide

Quick guide to get PawBridge running locally.

## Prerequisites

- Node.js (v14 or higher)
- MySQL (v8 or higher)
- Modern web browser

## Backend Setup

### 1. Install Dependencies
```bash
cd backend
npm install
```

### 2. Configure Environment
Create `backend/.env`:
```env
# Database
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=pawbridge

# JWT
JWT_SECRET=your_secret_key_here
JWT_EXPIRES_IN=7d

# Email (Gmail SMTP)
EMAIL_SERVICE=gmail
EMAIL_USER=your_email@gmail.com
EMAIL_PASSWORD=your_app_password
EMAIL_FROM=your_email@gmail.com

# File Upload
UPLOAD_DIR=./uploads
MAX_IMAGE_SIZE=26214400

# Server
PORT=3000
```

### 3. Setup Database
```bash
# Login to MySQL
mysql -u root -p

# Run schema
source backend/database/schema.sql

# (Optional) Run seed data
source backend/database/seed.sql
```

### 4. Start Backend Server
```bash
cd backend
npm start
```

Backend will run at: http://localhost:3000

## Frontend Setup

### Option 1: Python HTTP Server
```bash
cd frontend
python -m http.server 8080
```
Open: http://localhost:8080

### Option 2: VS Code Live Server
1. Install "Live Server" extension
2. Right-click `frontend/index.html`
3. Select "Open with Live Server"

### Option 3: Direct File Access
Simply open `frontend/index.html` in your browser.

## Testing the Application

### 1. Test Backend Health
```bash
curl http://localhost:3000/health
```

Expected response:
```json
{
  "status": "ok",
  "message": "PawBridge API is running"
}
```

### 2. Test Frontend
1. Open http://localhost:8080 (or your frontend URL)
2. Click "Report Now" button
3. Allow location access when prompted
4. Fill in the form:
   - Animal Type: "Dog"
   - Description: "Injured dog near park"
   - Upload an image
5. Click "Submit Report"
6. Should redirect to success page

### 3. Verify Database
```sql
USE pawbridge;
SELECT * FROM reports;
SELECT * FROM report_images;
```

## Project Structure

```
pawbridge/
├── backend/
│   ├── src/
│   │   ├── controllers/     # Request handlers
│   │   ├── models/          # Database models
│   │   ├── services/        # Business logic
│   │   ├── routes/          # API routes
│   │   ├── middleware/      # Auth, validation
│   │   └── config/          # Database config
│   ├── database/
│   │   ├── schema.sql       # Database schema
│   │   └── seed.sql         # Sample data
│   ├── uploads/             # Local file storage
│   ├── package.json
│   └── server.js
├── frontend/
│   ├── js/
│   │   ├── api.js          # API functions
│   │   └── report.js       # Report form logic
│   ├── index.html          # Landing page
│   ├── report.html         # Report form
│   └── success.html        # Success page
└── SETUP_GUIDE.md
```

## Common Issues

### Issue: Database Connection Failed
**Solution:** Check MySQL is running and credentials in `.env` are correct
```bash
# Check MySQL status
sudo systemctl status mysql

# Or on macOS
brew services list
```

### Issue: Port 3000 Already in Use
**Solution:** Change port in `.env` or kill the process
```bash
# Find process
lsof -i :3000

# Kill process
kill -9 <PID>
```

### Issue: Geolocation Not Working
**Solution:** 
- Use HTTPS or localhost
- Allow location permission in browser
- Check browser console for errors

### Issue: File Upload Fails
**Solution:**
- Check `uploads/` directory exists
- Verify file size is under 25MB
- Check file type is image or video

### Issue: CORS Error
**Solution:** Backend already has CORS enabled. If still seeing errors:
```javascript
// backend/src/app.js
app.use(cors({
  origin: 'http://localhost:8080',
  credentials: true
}));
```

## API Endpoints (Phase 1)

### Reports
```
POST   /api/reports              # Create injury report
GET    /api/reports/:id          # Get report by ID
GET    /api/reports/my-reports   # Get user's reports
```

### Authentication (Not yet connected to frontend)
```
POST   /api/auth/register        # Register user
POST   /api/auth/login           # Login user
GET    /api/auth/profile         # Get user profile
```

## Development Workflow

### Backend Development
```bash
cd backend
npm run dev  # Uses nodemon for auto-reload
```

### Frontend Development
- Edit HTML/CSS/JS files
- Refresh browser to see changes
- No build step required

### Database Changes
1. Update `backend/database/schema.sql`
2. Drop and recreate database:
```sql
DROP DATABASE pawbridge;
source backend/database/schema.sql;
```

## Next Steps (Phase 2)

1. **Authentication UI**
   - Login/Register pages
   - JWT token storage
   - Protected routes

2. **Additional Features**
   - Abuse reporting (anonymous)
   - Animal adoption listings
   - Donation system
   - Volunteer opportunities

3. **AWS Migration**
   - Replace local storage with S3
   - Replace mock AI with Bedrock
   - Replace nodemailer with SES
   - Deploy to RDS

## Architecture Overview

```
Frontend (HTML/JS)
    ↓ HTTP/Fetch
Backend (Express)
    ↓
Controllers (orchestration)
    ↓
Services (business logic)
    ↓
Models (data access)
    ↓
MySQL Database
```

## Support

- Backend Architecture: See `backend/ARCHITECTURE_AUDIT_REPORT.md`
- Dependency Graph: See `backend/DEPENDENCY_GRAPH.md`
- Frontend Guide: See `frontend/README.md`

## Quick Start (TL;DR)

```bash
# Backend
cd backend
npm install
# Configure .env
# Setup database
npm start

# Frontend (new terminal)
cd frontend
python -m http.server 8080

# Open browser
# http://localhost:8080
```

Done! 🐾
