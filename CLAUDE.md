# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Siigo Exit Interview Application - A web-based system for conducting exit interviews for employees leaving Siigo company. The application collects responses through a structured form, stores them in SQLite databases, and provides AI-powered analysis of the feedback using OpenAI's API.

## Core Commands

### Development
- `npm run dev` - Start development server with nodemon
- `npm start` - Start production server
- `npm run setup` - Install dependencies and initialize all databases
- `npm run init-all-db` - Initialize both databases (responses and users)

### Database Management
- `npm run init-db` - Initialize responses database only
- `npm run init-users-db` - Initialize users database only

### Server Management
- `npm run kill-port` - Kill process on port 3000
- `npm run restart` - Kill port and start server
- `npm run force-start` - Force kill port 3000 and start server
- `npm run force-dev` - Force kill port 3000 and start dev server
- `npm run clean-start` - Kill port, reinitialize databases, and start server

### Utility
- `npm run check-port` - Check if port 3000 is in use

## Architecture

### Backend Structure
- **server.js** - Main Express server with all routes and middleware
- **database/db.js** - Database class for managing survey responses
- **database/users-db.js** - Database class for managing user information
- **scripts/init-*.js** - Database initialization scripts

### Frontend Structure
- **public/index.html** - Main survey form interface
- **public/admin.html** - Admin panel for viewing responses and analyses
- **public/users.html** - User management interface
- **public/css/** - Custom CSS and fonts
- **public/images/** - Static assets including Siigo logo

### Database Design
- **SQLite databases** stored in `/data/` directory
- **responses.db** - Survey responses with AI analysis field
- **users.db** - Employee information for targeting surveys

### Key Features
- Rate limiting and security headers via helmet
- CSV bulk upload for user management
- WhatsApp integration for survey distribution
- OpenAI GPT-4 integration for response analysis
- File upload handling with multer (CSV files only)

### Environment Variables Required
- `OPENAI_API_KEY` - For AI analysis functionality
- `WHAPI_TOKEN` - For WhatsApp message sending
- `FORM_URL` - Base URL for survey form links
- `NODE_ENV` - Environment setting
- `PORT` - Server port (defaults to 3000)

### API Endpoints Structure
- `/api/questions` - Get survey questions
- `/api/responses/*` - CRUD operations for survey responses
- `/api/users/*` - CRUD operations for users
- `/api/analysis/*` - AI analysis endpoints
- `/api/users/upload-csv` - Bulk user import
- `/api/users/send-whatsapp` - Send WhatsApp invitations

### Development Notes
- Uses Express.js with SQLite3 database
- Implements proper error handling and logging
- Security middleware includes CORS, helmet, and rate limiting
- Static file serving from `/public` directory
- Server binds to all interfaces (0.0.0.0) for containerization

### Testing
No automated tests are currently configured. Manual testing should be done through the web interfaces at:
- Survey form: `http://localhost:3000/`
- Admin panel: `http://localhost:3000/admin`
- User management: `http://localhost:3000/users`