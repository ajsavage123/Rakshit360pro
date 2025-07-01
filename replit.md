# Rakshith360 Medical AI Assistant

## Overview

This is a full-stack medical AI assistant application built with React and Express. The system provides intelligent symptom assessment, medical guidance, and hospital recommendations through an interactive chat interface. It features a modern dark-themed UI with comprehensive medical consultation capabilities.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite for fast development and optimized builds
- **UI Library**: Radix UI components with Tailwind CSS styling
- **State Management**: React Context for authentication and theme management
- **Data Fetching**: TanStack Query for server state management
- **Routing**: React Router for client-side navigation

### Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **Database**: PostgreSQL with Drizzle ORM for type-safe database operations
- **Database Provider**: Neon serverless PostgreSQL
- **Session Management**: PostgreSQL-backed session storage
- **API Integration**: Google Gemini AI for medical consultations

### Storage Strategy
- **Primary**: PostgreSQL database for persistent data
- **Fallback**: localStorage-based storage service for offline functionality
- **Session Data**: In-memory storage with PostgreSQL backup

## Key Components

### Authentication System
- Custom authentication context using localStorage
- User registration and login with email/password
- Password reset functionality
- Session persistence across browser sessions

### Chat Interface
- Real-time AI-powered medical conversations
- Interactive question/answer flows with predefined options
- Typing indicators and message persistence
- Support for medical summaries and specialty recommendations

### Medical Features
- **Symptom Assessment**: Guided questionnaire system with dynamic follow-up questions
- **Flash Mode**: Quick emergency medical guidance
- **Hospital Finder**: Location-based hospital recommendations using Geoapify API
- **Specialty Recommendations**: AI-powered medical specialty suggestions
- **Medical Summaries**: Comprehensive case analysis with urgency levels

### UI/UX Features
- **Dark Theme**: Consistent dark mode throughout the application
- **Responsive Design**: Mobile-first approach with sidebar navigation
- **Component Library**: Comprehensive UI components using shadcn/ui
- **Onboarding Flow**: Multi-step introduction for new users

## Data Flow

1. **User Authentication**: Users authenticate through custom auth system with localStorage persistence
2. **Chat Sessions**: Medical conversations are stored locally and optionally synced to PostgreSQL
3. **AI Integration**: User inputs are processed through Google Gemini API for medical analysis
4. **Location Services**: Browser geolocation API provides coordinates for hospital recommendations
5. **External APIs**: Geoapify service fetches nearby hospitals based on user location and medical specialty

## External Dependencies

### AI Services
- **Google Gemini API**: Primary AI service for medical consultations and analysis
- **API Key Management**: Environment-based configuration with fallback UI for key input

### Location Services
- **Geoapify API**: Hospital search and geocoding services
- **Browser Geolocation**: Native location detection with permission handling

### Database
- **Neon PostgreSQL**: Serverless PostgreSQL hosting
- **Connection**: Environment variable-based connection string

### UI Libraries
- **Radix UI**: Accessible component primitives
- **Tailwind CSS**: Utility-first styling framework
- **Lucide React**: Icon library for consistent iconography

## Deployment Strategy

### Development
- **Vite Dev Server**: Hot module replacement for rapid development
- **Express Server**: API server with middleware for request logging
- **Database Migrations**: Drizzle Kit for schema management

### Production Build
- **Frontend**: Vite builds optimized React bundle to `dist/public`
- **Backend**: esbuild compiles Express server to `dist/index.js`
- **Static Serving**: Express serves built frontend assets in production

### Environment Configuration
- **Database**: `DATABASE_URL` for PostgreSQL connection
- **APIs**: `VITE_GEOAPIFY_API_KEY` for location services
- **Runtime**: `NODE_ENV` for environment-specific behavior

### Deployment Options
- **Replit**: Native support with development banner integration
- **Vercel/Netlify**: Static frontend with serverless backend
- **Traditional Hosting**: Combined Express server serving both API and static files

## Changelog
- June 29, 2025: Initial setup
- June 29, 2025: Fixed Flash Mode API key system - now uses 4-key loop instead of single key
- June 29, 2025: Enhanced hospital filtering - excludes pharmacies, nursing homes, clinics
- June 29, 2025: Improved hospital address display and nearby location filtering (10km radius)
- June 29, 2025: Added hospital sorting by distance (closest first) and duplicate removal
- July 1, 2025: Successfully migrated to Vercel deployment configuration
- July 1, 2025: Fixed all dependency and configuration issues for Vercel compatibility
- July 1, 2025: Removed Replit-specific plugins and updated build process
- July 1, 2025: Configured proper client-server separation for production deployment

## User Preferences

Preferred communication style: Simple, everyday language.