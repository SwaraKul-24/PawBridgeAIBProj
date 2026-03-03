# PawBridge Frontend - UI Preview

Visual guide to the PawBridge frontend interface.

## Color Palette

```
🟢 Primary Green:    #38512F  ███████  Navbar, Primary Buttons
🟡 Beige Background: #FEF5E7  ███████  Page Background
🟤 Dark Brown:       #3A3630  ███████  Text, Headings
🟢 Light Green:      #DFF5E1  ███████  Highlights, Success
🟡 Darker Beige:     #F0DDBF  ███████  Cards, Footer
🟠 Orange Accent:    #DEA773  ███████  Secondary Buttons
```

---

## Page 1: Landing Page (index.html)

```
┌─────────────────────────────────────────────────────────────┐
│  🐾 PawBridge                          Home | Report        │  ← Green navbar
├─────────────────────────────────────────────────────────────┤
│                                                              │
│                  Welcome to PawBridge                        │  ← Green heading
│     Connecting communities to protect and care for          │
│                  animals in need                            │
│                                                              │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │   Report     │  │   Report     │  │    Adopt     │     │
│  │   Injured    │  │    Abuse     │  │   a Pet      │     │
│  │   Animal     │  │              │  │              │     │
│  │              │  │              │  │              │     │
│  │ Found an     │  │ Witness      │  │ Give a       │     │
│  │ injured      │  │ animal       │  │ rescued      │     │
│  │ animal?      │  │ abuse?       │  │ animal a     │     │
│  │              │  │              │  │ loving home  │     │
│  │              │  │              │  │              │     │
│  │ [Report Now] │  │[Coming Soon] │  │[Coming Soon] │     │
│  │   (Green)    │  │  (Orange)    │  │  (Orange)    │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
│                                                              │
├─────────────────────────────────────────────────────────────┤
│         © 2026 PawBridge. All rights reserved.              │  ← Beige footer
└─────────────────────────────────────────────────────────────┘
```

**Features:**
- Clean hero section with centered text
- Three action cards with hover effect
- Only "Report Now" is active (green button)
- Other buttons disabled with orange color
- Responsive grid layout

---

## Page 2: Report Form (report.html)

```
┌─────────────────────────────────────────────────────────────┐
│  🐾 PawBridge                          Home | Report        │  ← Green navbar
├─────────────────────────────────────────────────────────────┤
│                                                              │
│              ┌─────────────────────────────┐                │
│              │                             │                │
│              │  Report Injured Animal      │  ← Green heading
│              │                             │                │
│              │  ┌─────────────────────┐   │                │
│              │  │ 📍 Location:        │   │  ← Light green box
│              │  │ Latitude: 37.7749   │   │
│              │  │ Longitude: -122.419 │   │
│              │  └─────────────────────┘   │                │
│              │                             │                │
│              │  Animal Type                │                │
│              │  [________________]         │                │
│              │                             │                │
│              │  Description                │                │
│              │  [________________]         │                │
│              │  [________________]         │                │
│              │  [________________]         │                │
│              │                             │                │
│              │  Upload Image/Video         │                │
│              │  [Choose Files]             │                │
│              │  You can upload multiple    │                │
│              │                             │                │
│              │  [    Submit Report    ]    │  ← Green button
│              │                             │                │
│              └─────────────────────────────┘                │
│                                                              │
├─────────────────────────────────────────────────────────────┤
│         © 2026 PawBridge. All rights reserved.              │
└─────────────────────────────────────────────────────────────┘
```

**Features:**
- Centered white card on beige background
- Auto-detected location displayed in light green box
- Clean form with proper labels
- File input accepts multiple files
- Submit button changes to "Submitting..." on click
- Alert area for error messages

**Form Validation:**
- All fields required
- Location must be detected
- At least one file must be uploaded

---

## Page 3: Success Page (success.html)

```
┌─────────────────────────────────────────────────────────────┐
│  🐾 PawBridge                          Home | Report        │  ← Green navbar
├─────────────────────────────────────────────────────────────┤
│                                                              │
│                                                              │
│              ┌─────────────────────────────┐                │
│              │                             │                │
│              │           ✓                 │  ← Large checkmark
│              │                             │                │
│              │  Report Submitted           │  ← Green heading
│              │     Successfully            │                │
│              │                             │                │
│              │  Thank you for reporting!   │                │
│              │  We've received your        │                │
│              │  submission and will        │                │
│              │  connect you with nearby    │                │
│              │  NGOs who can help.         │                │
│              │                             │                │
│              │  [   Back to Home   ]       │  ← Green button
│              │                             │                │
│              └─────────────────────────────┘                │
│                    ↑ Light green background                 │
│                                                              │
├─────────────────────────────────────────────────────────────┤
│         © 2026 PawBridge. All rights reserved.              │
└─────────────────────────────────────────────────────────────┘
```

**Features:**
- Large success card with light green background
- Centered checkmark icon
- Clear success message
- Single action button to return home

---

## Responsive Behavior

### Desktop (> 768px)
- Three cards side-by-side on landing page
- Form card centered with max-width 600px
- Full navbar with all links visible

### Tablet (768px - 992px)
- Cards stack vertically on landing page
- Form remains centered
- Navbar collapses to hamburger menu

### Mobile (< 768px)
- Single column layout
- Full-width cards
- Hamburger menu for navigation
- Form inputs full width

---

## Interactive Elements

### Buttons
```css
Primary Button (Green):
  Normal:  #38512F background, white text
  Hover:   #2d3f25 background (darker)
  
Secondary Button (Orange):
  Normal:  #DEA773 background, white text
  Hover:   #c89563 background (darker)
  Disabled: Grayed out
```

### Cards
```css
Action Cards:
  Background: white
  Shadow: 0 2px 8px rgba(0,0,0,0.1)
  Hover: translateY(-5px) (lift effect)
  
Form Card:
  Background: white
  Padding: 40px
  Border-radius: 10px
```

### Alerts
```css
Error Alert:
  Background: Bootstrap danger (red)
  Dismissible with X button
  
Success Alert:
  Background: Bootstrap success (green)
  Dismissible with X button
```

---

## User Flow

```
1. User lands on index.html
   ↓
2. Clicks "Report Now" button
   ↓
3. Redirected to report.html
   ↓
4. Browser requests location permission
   ↓
5. Location auto-fills in form
   ↓
6. User fills in:
   - Animal type
   - Description
   - Uploads image/video
   ↓
7. Clicks "Submit Report"
   ↓
8. Button shows "Submitting..."
   ↓
9. Form data sent to backend via fetch
   ↓
10. On success → redirect to success.html
    On error → show alert message
    ↓
11. Success page displays confirmation
    ↓
12. User clicks "Back to Home"
    ↓
13. Returns to index.html
```

---

## Accessibility Features

- ✅ Semantic HTML (nav, main, footer)
- ✅ Proper form labels
- ✅ Alt text for icons (emoji fallback)
- ✅ Keyboard navigation support
- ✅ Focus states on interactive elements
- ✅ ARIA labels where needed
- ✅ Color contrast meets WCAG standards

---

## Browser Compatibility

Tested and working on:
- ✅ Chrome 90+
- ✅ Firefox 88+
- ✅ Safari 14+
- ✅ Edge 90+

Features used:
- CSS Grid & Flexbox
- Fetch API
- Geolocation API
- FormData API
- ES6+ JavaScript

---

## Performance

- **No build step:** Instant load
- **CDN Bootstrap:** Cached by browser
- **Minimal JavaScript:** < 2KB total
- **No external dependencies:** Pure vanilla JS
- **Optimized images:** None (user uploads only)

---

## Design Consistency

Every page follows:
1. Green navbar at top
2. Beige background
3. White/beige cards for content
4. Beige footer at bottom
5. Consistent spacing and padding
6. Same font family throughout
7. Strict color palette adherence

---

## Future Enhancements (Phase 2)

- [ ] User authentication UI
- [ ] Dashboard for logged-in users
- [ ] Abuse reporting form (anonymous)
- [ ] Animal adoption gallery
- [ ] Donation interface
- [ ] Volunteer opportunities page
- [ ] NGO dashboard
- [ ] Real-time notifications
- [ ] Map view of reports
- [ ] Image preview before upload

---

## Code Quality

- ✅ Clean, readable code
- ✅ Consistent naming conventions
- ✅ Modular JavaScript
- ✅ No code duplication
- ✅ Proper error handling
- ✅ Loading states
- ✅ User feedback
- ✅ Beginner-friendly
