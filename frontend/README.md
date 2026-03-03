# PawBridge Frontend

Clean, minimal frontend for PawBridge animal welfare platform.

## Tech Stack

- HTML5
- Bootstrap 5 (CDN)
- Plain JavaScript (no frameworks)
- Fetch API for backend communication

## File Structure

```
/frontend
├── index.html          # Landing page
├── report.html         # Report injured animal form
├── success.html        # Success confirmation page
├── /js
│   ├── api.js         # Reusable API functions
│   └── report.js      # Report form logic
└── README.md
```

## Color Palette

```css
Primary Green:    #38512F  (navbar, primary buttons)
Beige Background: #FEF5E7  (page background)
Dark Brown/Gray:  #3A3630  (text, headings)
Light Green:      #DFF5E1  (highlights, success sections)
Darker Beige:     #F0DDBF  (cards, footer)
Orange Accent:    #DEA773  (secondary buttons)
```

## Features

### index.html
- Clean landing page with hero section
- Three action cards:
  - Report Injured Animal (active)
  - Report Abuse (coming soon)
  - Adopt a Pet (coming soon)
- Responsive Bootstrap layout
- Custom color palette applied

### report.html
- Centered form card
- Auto-detects user location using browser geolocation
- Form fields:
  - Animal Type (text input)
  - Description (textarea)
  - Upload Image/Video (file input, multiple files)
  - Latitude/Longitude (auto-filled, hidden)
- Submit button with loading state
- Bootstrap alerts for success/error messages
- Location display with visual feedback

### success.html
- Clean confirmation page
- Success message with checkmark icon
- Button to return to homepage
- Light green highlight section

## JavaScript Modules

### api.js
Reusable API communication:
```javascript
postForm(endpoint, formData) → { success, data/error }
```

### report.js
- Form submission handler
- Geolocation detection
- Alert management
- Loading state management
- Redirect on success

## Backend Integration

**Backend URL:** `http://localhost:3000`

**API Endpoint:**
```
POST /api/reports
Content-Type: multipart/form-data

Fields:
- animalType: string
- userEditedDescription: string
- images: file[] (multiple)
- latitude: number
- longitude: number
```

## How to Run

### Option 1: Simple HTTP Server (Python)
```bash
cd frontend
python -m http.server 8080
```
Open: http://localhost:8080

### Option 2: Live Server (VS Code)
1. Install "Live Server" extension
2. Right-click `index.html`
3. Select "Open with Live Server"

### Option 3: Direct File Access
Simply open `index.html` in your browser.

**Note:** For geolocation to work properly, use HTTPS or localhost.

## Browser Requirements

- Modern browser with:
  - Geolocation API support
  - Fetch API support
  - ES6+ JavaScript support
- Recommended: Chrome, Firefox, Safari, Edge (latest versions)

## Design Principles

1. **Minimal & Clean:** No unnecessary elements
2. **Beginner-Readable:** Simple, clear JavaScript
3. **No Build Tools:** Pure HTML/CSS/JS
4. **No Frameworks:** Vanilla JavaScript only
5. **Responsive:** Bootstrap grid system
6. **Accessible:** Semantic HTML, proper labels
7. **Consistent:** Strict color palette adherence

## Phase 1 Scope

Currently implemented:
- ✅ Landing page
- ✅ Report injured animal form
- ✅ Success confirmation
- ✅ Geolocation detection
- ✅ File upload
- ✅ Backend integration

Coming soon (Phase 2):
- Report abuse (anonymous)
- Animal adoption listings
- User authentication
- NGO dashboard
- Donation system
- Volunteer opportunities

## Customization

To modify colors, update CSS variables in each HTML file:
```css
:root {
  --primary-green: #38512F;
  --beige-bg: #FEF5E7;
  --dark-brown: #3A3630;
  --light-green: #DFF5E1;
  --darker-beige: #F0DDBF;
  --orange-accent: #DEA773;
}
```

## Testing Checklist

- [ ] Landing page loads correctly
- [ ] Navigation links work
- [ ] Report form displays properly
- [ ] Geolocation auto-detects
- [ ] File upload accepts images/videos
- [ ] Form validation works
- [ ] Submit button shows loading state
- [ ] Success page displays after submission
- [ ] Back to home button works
- [ ] Responsive on mobile devices
- [ ] Colors match palette exactly

## Known Limitations

1. **Geolocation:** Requires user permission and HTTPS/localhost
2. **File Size:** No client-side file size validation (handled by backend)
3. **Authentication:** Not implemented in Phase 1
4. **Error Handling:** Basic error messages only

## Support

For issues or questions, refer to the backend API documentation.
