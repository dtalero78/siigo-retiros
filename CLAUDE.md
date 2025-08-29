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
- `/api/questions` - Survey question management
- `/api/responses/*` - Survey response CRUD operations
- `/api/users/*` - User management, CSV uploads, filtering
- `/api/analysis/*` - OpenAI GPT-4 analysis (individual and global)
- `/api/whatsapp/*` - Conversation viewing and reply functionality
- `/api/export/*` - Data export endpoints

### Frontend Architecture
Static HTML/JS without framework, served from `/public`:
- **public/index.html** - Main survey form with dynamic question rendering
- **public/admin.html** - Admin dashboard with analytics, PDF export, and OpenAI analysis
- **public/users.html** - User management with WhatsApp sending and conversation viewing
- Uses Bootstrap 5.3.2 for UI components
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
- Survey form: `http://localhost:3000/`
- Admin panel: `http://localhost:3000/admin`
- User management: `http://localhost:3000/users`

### Common Issues & Solutions
- **PostgreSQL SSL errors**: Use `NODE_TLS_REJECT_UNAUTHORIZED=0` prefix when starting server
- **CSP violations**: Ensure all external scripts are loaded from cdn.jsdelivr.net
- **WhatsApp template errors**: Verify template is UTILITY category, not MARKETING
- **PDF generation fails**: Check that html2canvas and jsPDF are loaded correctly

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