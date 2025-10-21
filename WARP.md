# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Development Commands

### Frontend Development
```bash
# Install dependencies
npm install

# Start development server (runs on port 8080)
npm run dev

# Build for production
npm run build

# Build for development
npm run build:dev

# Lint code
npm run lint

# Preview production build
npm run preview
```

### Backend Development
```bash
# Navigate to backend directory
cd backend

# Install backend dependencies
npm install

# Start backend server (development with nodemon)
npm run dev

# Start backend server (production)
npm start

# Backend runs on port 5000 by default
```

### Testing and Analysis
```bash
# Run report analysis integration tests
node test-report-integration.js

# Run comprehensive analysis tests
node test-comprehensive-analysis.js

# Check database reports
node check-database-reports.js

# Test voice services (standalone HTML files)
# Open in browser: test-practical-voice.html, test-hybrid-voice.html
```

## Architecture Overview

### Full-Stack Structure
This is a **React + Vite frontend with Node.js/Express backend** medical assistant application.

**Frontend Stack:**
- **React 18** with TypeScript
- **Vite** as build tool and dev server
- **shadcn/ui** component library with Radix UI primitives
- **Tailwind CSS** for styling
- **Framer Motion** for animations
- **React Router** for navigation
- **TanStack Query** for API state management
- **i18next** for internationalization (English/Tamil)

**Backend Stack:**
- **Node.js** with Express server
- **MongoDB** with Mongoose ODM
- **JWT** authentication with bcrypt
- **Google Gemini AI** integration
- **Multer** for file uploads
- **PDF parsing** and **Tesseract OCR** for document analysis

### Key Application Features

#### 1. AI-Powered Medical Assistant
- **Gemini AI Integration**: Uses Google's Gemini API for medical advice and report analysis
- **Conversational Interface**: Chat-based interaction with medical context awareness
- **Multi-language Support**: English and Tamil with automatic medical term translation
- **Voice Recognition**: English speech recognition with Tamil medical vocabulary translation

#### 2. Medical Report Analysis
- **File Upload System**: Supports PDFs, images (JPG, PNG), and documents
- **OCR Processing**: Extracts text from scanned medical documents using Tesseract.js
- **AI Analysis**: Gemini AI analyzes uploaded reports and provides personalized health insights
- **Report Integration**: Users can select any uploaded report for AI analysis directly from chat

#### 3. Authentication & User Management
- **JWT-based Authentication**: Secure token-based auth system
- **Protected Routes**: Role-based access control throughout the application
- **User Context**: Global user state management with AuthContext

### Directory Structure

```
src/
├── components/
│   ├── auth/           # Authentication components (ProtectedRoute)
│   ├── ChatBot/        # Core chatbot interface components
│   ├── common/         # Reusable UI components
│   ├── context/        # React context providers
│   ├── layout/         # App layout components
│   ├── styles/         # Component-specific styles
│   └── ui/            # shadcn/ui components (buttons, dialogs, etc.)
├── hooks/             # Custom React hooks
├── i18n/             # Internationalization configuration
│   └── locales/      # English and Tamil translations
├── lib/              # Utility functions and configurations
├── pages/            # React Router page components
├── services/         # API services and external integrations
└── styles/          # Global styles and Tailwind config

backend/
├── config/           # Database and environment configuration  
├── controllers/      # Express route controllers
├── middleware/       # Custom middleware (auth, error handling)
├── models/          # Mongoose database models
├── routes/          # API route definitions
├── services/        # Business logic services (GeminiService)
└── uploads/         # File upload storage directory
```

### API Architecture

**Base URL**: `http://localhost:5000/api/v1`

**Key Endpoints:**
- `/auth/*` - User authentication (login, signup, token validation)
- `/reports/*` - Medical report CRUD operations
- `/ai/*` - AI chat and analysis endpoints
- `/medical-reports/*` - Medical document processing

**Authentication**: All protected routes require JWT token in Authorization header or cookies.

### Voice Recognition System

**Approach**: English speech recognition with medical term translation to Tamil
- **Primary Recognition**: Browser's Web Speech API for English (85%+ accuracy)
- **Medical Translation**: Automatic translation of 40+ medical terms to Tamil
- **User Experience**: Tamil users see English recognition with Tamil medical vocabulary
- **Services**: Multiple voice service implementations (PracticalVoiceService, HybridVoiceService, TamilVoiceService)

### State Management Patterns

**Global State:**
- **AuthContext**: User authentication state
- **TanStack Query**: Server state and API caching
- **i18n Context**: Language preference and translations

**Local State:**
- Component-level state with React hooks
- Form state management with react-hook-form
- UI state (modals, dropdowns) with local useState

## Development Guidelines

### Code Organization
- **Components**: Place reusable components in `/src/components/common/`
- **Pages**: Route-level components go in `/src/pages/`
- **Services**: API calls and external integrations in `/src/services/`
- **Types**: TypeScript interfaces in component files or separate `.types.ts` files

### Styling Approach
- **Primary**: Tailwind CSS utility classes
- **Components**: shadcn/ui for consistent design system
- **Custom Styles**: Use CSS modules or styled-components sparingly
- **Responsive Design**: Mobile-first approach with Tailwind breakpoints

### API Integration Patterns
- **TanStack Query**: Use for all data fetching with proper caching strategies
- **Error Handling**: Implement consistent error boundaries and user feedback
- **Loading States**: Always provide loading indicators for async operations

### Environment Configuration

**Frontend (.env):**
```bash
VITE_API_URL=http://localhost:5000/api/v1
# Other Vite environment variables prefixed with VITE_
```

**Backend (.env):**
```bash
NODE_ENV=development
PORT=5000
CLIENT_URL=http://localhost:8080
MONGODB_URI=mongodb://localhost:27017/medguide
JWT_SECRET=your_jwt_secret
GEMINI_API_KEY=your_gemini_api_key
```

### Testing Strategy
- **Integration Tests**: Use the provided test scripts for API and feature testing
- **Component Testing**: Add React Testing Library tests for complex components
- **E2E Testing**: Consider adding Playwright tests for critical user flows

### Build and Deployment
- **Development**: Frontend on port 8080, backend on port 5000
- **Production Build**: `npm run build` creates optimized frontend bundle
- **Backend Deployment**: Standard Node.js deployment with PM2 or similar
- **Environment**: Ensure all environment variables are configured for production

### Medical Compliance Notes
- **Data Privacy**: No medical data is stored on external servers beyond necessary AI API calls
- **Error Handling**: All medical advice includes disclaimers about professional consultation
- **File Security**: Uploaded medical reports are user-specific with proper access controls

## Common Development Tasks

### Adding New Components
1. Create component in appropriate `/src/components/` subdirectory
2. Follow existing naming conventions (PascalCase for components)
3. Include TypeScript interfaces for props
4. Export from component directory index files when appropriate

### Adding New API Endpoints
1. Define route in `/backend/routes/`
2. Implement controller in `/backend/controllers/`
3. Add model if needed in `/backend/models/`
4. Update frontend service in `/src/services/`
5. Add TanStack Query hooks for data fetching

### Internationalization
1. Add translation keys to `/src/i18n/locales/en/` and `/src/i18n/locales/ta/`
2. Use `useTranslation()` hook in components
3. Medical terms should be translated contextually, not literally

### Voice Service Modifications
1. Extend `/src/services/PracticalVoiceService.js` for new medical vocabulary
2. Update translation dictionaries for additional languages
3. Test with standalone HTML files before integrating

This architecture supports a scalable, maintainable medical assistant application with strong separation of concerns and modern development practices.