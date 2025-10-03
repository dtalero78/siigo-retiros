# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Siigo Exit Interview Application - A comprehensive web system for managing exit interviews of employees leaving Siigo company. The application handles survey distribution via WhatsApp Business API (Twilio), collects responses through dynamic forms, provides AI-powered analysis using OpenAI GPT-4, and offers detailed analytics dashboards with PDF export capabilities.

## Core Commands

### Development
- `npm run dev` - Start development server with nodemon (auto-restart on changes)
- `npm start` - Start production server
- `NODE_TLS_REJECT_UNAUTHORIZED=0 npm start` - Start with SSL bypass for PostgreSQL connections

### Database Management
- `npm run setup` - Install dependencies and initialize all databases
- `npm run init-all-db` - Initialize both databases (responses and users)
- `npm run init-db` - Initialize responses database only
- `npm run init-users-db` - Initialize users database only
- `npm run clean-start` - Kill port, reinitialize databases, and start server

### Server Management
- `npm run kill-port` - Kill process on port 3000
- `npm run restart` - Kill port and start server
- `npm run force-start` - Force kill port 3000 and start server
- `npm run force-dev` - Force kill port 3000 and start dev server
- `npm run check-port` - Check if port 3000 is in use

## Architecture

### Database Architecture
The system supports dual database configuration (SQLite for development, PostgreSQL for production):
- **database/config.js** - Database abstraction layer that determines which DB to use based on `DATABASE_TYPE` env variable
- **database/db.js** & **database/db-postgres.js** - Response storage implementations
- **database/users-db.js** & **database/users-db-postgres.js** - User management implementations
- Database schemas auto-migrate on startup, adding missing columns as needed

### WhatsApp Integration Architecture
Multiple service layers for WhatsApp Business API integration via Twilio:
- **services/whatsapp-button-sender.js** - Primary service for sending template messages with interactive buttons
- **services/twilio-template-button.js** - Handles button template sending with dynamic URLs
- **services/twilio-whatsapp.js** - Core WhatsApp messaging functionality
- Template ID: `HXabd9517719a844afc93a367ef4e23927` (UTILITY category)
- Phone: `15558192172` (Twilio WhatsApp Business number)

### API Structure
All API endpoints are in **server.js** with the following patterns:
- `/api/questions` - Dynamic survey question management (supports area-based filtering: `?area=Sales`)
- `/api/responses/*` - Survey response CRUD operations
- `/api/responses/:id/reprocess` - Re-process existing responses with improved dynamic mapping
- `/api/users/*` - User management, CSV uploads, filtering
- `/api/analysis/*` - OpenAI GPT-4 analysis (individual and global)
- `/api/whatsapp/*` - Conversation viewing and reply functionality
- `/api/export/*` - Data export endpoints (includes dynamic CSV generation)

### Frontend Architecture
Static HTML/JS without framework, served from `/public`:
- **public/index.html** - Main survey form with Typeform-style design (one question per screen, clean and minimalist)
  - Flat white background with no shadows or borders
  - Fixed progress bar at the top
  - Siigo logo (logoazul.png) aligned left, 120px height
  - Dynamic question loading based on user area (27 for Sales, 17 for General)
  - Keyboard navigation support (Enter to advance)
  - Smooth animations between questions
  - **Mobile optimizations:**
    - Vertical scroll enabled for scale questions (0-10) with many options
    - 160px top padding for proper logo separation
    - Dynamic viewport height (dvh) support
    - Touch-friendly button sizing and spacing
  - **Desktop:** Centered layout with 120px padding, fixed viewport
- **public/index-old.html** - Legacy multi-step wizard form (backup)
- **public/form-typeform.html** - Original Typeform prototype (deprecated, kept for reference)
- **public/admin.html** - Admin dashboard with analytics, PDF export, and OpenAI analysis (includes dynamic response viewing)
- **public/users.html** - User management with WhatsApp sending and conversation viewing
- **public/js/dynamic-form.js** - Dynamic form rendering system for area-specific questions
- Uses Bootstrap 5.3.2 for UI components and Bootstrap Icons
- jsPDF and html2canvas for PDF generation (loaded from cdn.jsdelivr.net for CSP compliance)

## Environment Configuration

Required environment variables (.env):
```
NODE_ENV=production
PORT=3000
FORM_URL=https://www.siigo.digital
OPENAI_API_KEY=your_key_here
DATABASE_TYPE=postgres|sqlite
DATABASE_URL=postgresql://... (for PostgreSQL)
TWILIO_ACCOUNT_SID=your_sid
TWILIO_AUTH_TOKEN=your_token
TWILIO_WHATSAPP_FROM=whatsapp:+15558192172
```

## Key Features & Implementation Details

### WhatsApp Button Messages
- Uses Twilio Content API with pre-approved UTILITY templates
- Dynamic URL generation: `https://www.siigo.digital/?user=${userId}`
- Bulk sending with filtering by response status, days passed, country
- Conversation viewing and reply functionality in users.html

### OpenAI Analysis
- Individual response analysis with structured prompts
- Global organizational analysis with comprehensive statistics
- Async loading: statistics display immediately, AI analysis loads in background
- Uses GPT-4 model with detailed HR theory integration

### PDF Generation
- Uses jsPDF with html2canvas for capturing dashboard visualizations
- Handles multi-page documents automatically
- Includes all charts, statistics, and AI analysis
- Professional formatting with Siigo branding

### Security & Performance
- Content Security Policy (CSP) restricts script sources to cdn.jsdelivr.net
- Rate limiting on all endpoints (100 requests per 15 minutes)
- Helmet.js for security headers
- CORS configured for cross-origin requests
- Server binds to 0.0.0.0 for containerization support

## Testing & Debugging

### Manual Testing URLs
- Survey form (Typeform-style): `http://localhost:3000/`
- Survey form with user: `http://localhost:3000/?user=562` (General area user - 17 questions)
- Survey form with Sales user: `http://localhost:3000/?user=561` (Sales area user - 27 questions)
- Admin panel: `http://localhost:3000/admin`
- User management: `http://localhost:3000/users`
- Legacy forms (deprecated):
  - `http://localhost:3000/index-old.html` (Multi-step wizard backup)
  - `http://localhost:3000/form-typeform.html` (Original Typeform prototype)
- API endpoints:
  - `http://localhost:3000/api/questions` (17 general questions)
  - `http://localhost:3000/api/questions?area=Sales` (27 Sales questions - duplicates removed)
  - `http://localhost:3000/api/user-form/562` (Get user data)

### Common Issues & Solutions
- **PostgreSQL SSL errors**: Use `NODE_TLS_REJECT_UNAUTHORIZED=0` prefix when starting server
- **CSP violations**: Ensure all external scripts are loaded from cdn.jsdelivr.net
- **WhatsApp template errors**: Verify template is UTILITY category, not MARKETING
- **PDF generation fails**: Check that html2canvas and jsPDF are loaded correctly
- **Dynamic form errors**: Check browser console for JavaScript errors in dynamic-form.js
- **Question loading issues**: Verify user has 'area' field set and API endpoints are accessible

### Database Queries
- PostgreSQL connection test: `node test-postgres-connection.js`
- Check message status: `node check-message-status.js`
- View user data: `node check-postgres-data.js`

## Recent Implementations

### Interactive Dashboard
- Real-time statistics calculation in frontend
- Multiple visualization types (progress bars, country flags, satisfaction ratings)
- Responsive grid layout with Bootstrap components
- Color-coded alerts based on satisfaction thresholds

### Conversation Management
- Real-time WhatsApp conversation viewing
- Reply functionality through Twilio API
- Message status tracking (sent, delivered, read, failed)
- Auto-refresh every 5 seconds when conversation modal is open

### Dynamic Forms System (Typeform-style)
- **questions-config.js** - Configuration module with area-specific question sets extracted from PDF documents
- **Area-based Question Loading**: Sales area users receive 27 specialized questions (duplicates removed), other areas receive 17 general questions
- **Typeform-style Design** (index.html):
  - One question per screen with clean, minimalist flat design
  - White background with no shadows or borders
  - Fixed progress bar at top showing completion percentage
  - Siigo logo (logoazul.png) 120px aligned left with content
  - Real-time validation and button state management
  - Keyboard navigation (Enter to advance, Escape handled gracefully)
  - Smooth fade animations between questions
  - Support for multiple question types: text, textarea, radio, dropdown, scale (0-10), date
- **Dynamic Rendering**: Client-side form generation supporting multiple question types
- **Automatic Detection**: System automatically loads appropriate questions based on user's area field from `/api/user-form/:id`
- **Question Sources**:
  - SALES.pdf: 27 questions across 6 sections (Selection Process, Training/Induction, Satisfaction, Reasons) - duplicates removed
  - GENERAL.pdf: 17 questions across 4 sections (Experience, Climate/Culture, Siigo, Reasons)
- **Validation System**: Real-time validation for required fields, button enable/disable based on answer state
- **API Integration**:
  - `/api/questions?area=Sales` for Sales users (27 questions)
  - `/api/questions` for general users (17 questions)
  - `/api/responses` POST endpoint expects format: `{ responses: {...}, userId: 'xxx' }`

### Advanced Response Processing System
- **response-mapper.js** - Dynamic response mapping system that adapts to different form types
- **Intelligent Field Mapping**: Automatically maps dynamic form responses (q1-q27 for Sales, q1-q17 for General) to legacy database fields
- **Area-Specific Processing**: Different mapping logic for Sales (27 questions) vs General (17 questions) forms
- **Complete Data Preservation**: All original responses stored in `all_responses` JSONB field for full data integrity
- **Re-processing Capability**: Existing responses can be re-processed with improved mapping via `/api/responses/:id/reprocess`
- **Backward Compatibility**: Legacy responses continue to work while new responses benefit from enhanced mapping
- **Export Enhancement**: Dynamic CSV generation includes all questions based on form type with proper headers
- **Admin Panel Enhancement**: Response detail modal now dynamically renders all answers grouped by section, showing all 27 Sales questions or 17 General questions based on area