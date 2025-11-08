# EPI X-Ray - Process Mining Platform

## Overview
EPI X-Ray is an advanced process mining and automation platform that helps analyze, optimize, and automate business processes. It provides insights into process performance, identifies areas for improvement, and simulates the impact of changes.

## Project Information
- **Application Name**: EPI X-Ray
- **Framework**: Next.js 15.5.4
- **Language**: TypeScript
- **UI Library**: React 19.1.0
- **Styling**: Tailwind CSS v4 with shadcn/ui components
- **Package Manager**: pnpm
- **Port**: 5000 (frontend)

## Features
1. **Process Discovery** - Automatically discovers process models from event logs
2. **Conformance Checking** - Analyzes process deviations and compliance
3. **Performance Analytics** - Tracks KPIs (cycle time, throughput, rework rate)
4. **Automation Opportunities** - Identifies tasks with high automation potential
5. **Predictive Analytics** - AI-powered forecasting and anomaly detection
6. **Digital Twin Simulation** - Virtual replica of business processes
7. **Scenario Analysis** - Compares different process scenarios
8. **API Integration** - Connects to SAP, Salesforce, ServiceNow, etc.
9. **Document Upload** - AI-powered analysis of process documents
10. **Task Mining** - Analyzes task execution data

## Project Structure
- `/app` - Next.js app router pages and layouts
- `/components` - React components (UI components and feature components)
- `/hooks` - Custom React hooks
- `/lib` - Utility functions
- `/public` - Static assets
- `/styles` - Global styles

## Development
- Run dev server: `pnpm dev` (starts on port 5000)
- Build: `pnpm build`
- Start production: `pnpm start`

## Backend Architecture

### Database (PostgreSQL via Neon)
- **ORM**: Drizzle ORM with type-safe queries
- **Tables**: users, processes, event_logs, process_models, activities, performance_metrics, deviations, automation_opportunities, documents, integrations
- **Migration**: `pnpm db:push` to sync schema changes

### API Endpoints
- **Processes**: `/api/processes` (GET, POST), `/api/processes/[id]` (GET, PATCH, DELETE)
- **Event Logs**: `/api/event-logs` (GET, POST), `/api/event-logs/[id]` (DELETE)
- **Analytics**: `/api/analytics/performance` (GET, POST), `/api/analytics/automation` (GET, POST)
- **File Upload**: `/api/upload` (POST) - CSV parsing with validation
- **Process Analysis**: `/api/processes/[id]/analyze` (POST) - Runs process mining algorithms

### Process Mining Features
- **Process Discovery**: Automatically discovers process models from event logs
- **Performance Metrics**: Calculates cycle time, throughput, rework rate
- **Automation Analysis**: Identifies high-potential automation opportunities
- **Activity Analysis**: Tracks frequency, duration, and transitions

### Security
- UUID-based filename sanitization (prevents path traversal)
- File type and size validation (CSV only, 50MB max)
- CSV validation (required fields: caseId, activity, timestamp)
- Database constraints and foreign keys

## Authentication System
- **Type**: Custom JWT-based authentication (fully independent and portable)
- **Password Security**: bcryptjs with 12 salt rounds for secure hashing
- **Session Management**: JWT tokens with 7-day expiry, stored in httpOnly cookies
- **Error Messages**: Specific errors ("Password is incorrect" vs "No account found with this email")
- **Auto-login**: Users automatically logged in after successful signup
- **API Routes**: 
  - `/api/auth/signup` - User registration with email/password (min 12 chars)
  - `/api/auth/login` - User login with JWT token generation
  - `/api/auth/logout` - Session cookie deletion
  - `/api/auth/user` - Current user info (returns 401 if not authenticated)
- **Landing Page**: Glass-morphism design with login/signup tabs
- **Protected Routes**: Dashboard and feature pages require authentication
- **User Menu**: Dropdown with logout functionality in dashboard header
- **Toast Notifications**: Clear success/error feedback for all auth actions

## UI/UX Design System
- **Styling**: Tailwind CSS v4 with custom brand color utilities
- **Brand Colors**: 
  - Primary: `oklch(0.72 0.14 195)` (cyan) with automatic dark mode adjustment
  - Semantic tokens: success, warning, info, destructive
  - All components use CSS custom properties for theme support
- **Animations**: framer-motion for modals, transitions for all interactive elements
- **Components**: shadcn/ui base + custom enhancements (skeleton loaders, empty states, theme toggle)
- **Dark Mode**: Full dark/light mode support with theme toggle in header
- **Mobile**: Responsive navigation with Sheet component, optimized spacing (p-4 md:p-6 lg:p-8)
- **Microinteractions**: Button click animations (active:scale-95), card hover lifts, smooth transitions

## Recent Changes
- 2025-11-08: **STARTED AI-ENABLED ADVANCED PROCESS MINING FEATURES**
  - **Critical Bug Fix**: Fixed completely broken dashboard navigation caused by Radix Dialog modals creating invisible overlay that blocked all clicks - wrapped modals in conditional render (only mount when open)
  - **Database Schema Extended**: Added 5 new tables for advanced features:
    - `discovered_models`: Stores Alpha Miner/Inductive Miner results with activities, transitions, relations
    - `ai_insights`: AI-generated optimization suggestions, bottleneck detection, automation opportunities
    - `conformance_results`: Token-based replay conformance checking with fitness scores
    - `simulation_scenarios`: Digital twin simulation parameters and results
    - `kpi_metrics`: Real-time KPI calculations with mathematical formulas
  - **Alpha Miner Algorithm**: Complete implementation of Alpha Miner process discovery algorithm
    - Discovers activities, start/end activities, direct succession relations
    - Identifies causal, parallel, and choice relations between activities
    - Calculates transition frequencies and builds process model
    - Stored in database with full model metadata
  - **AI Integration**: OpenAI GPT-4.1 integration using Replit AI Integrations (no API key needed)
    - Installed openai, p-retry, p-limit packages
    - AI-powered process insights generation (bottlenecks, optimization, automation, compliance)
    - Anomaly detection for unusual activity sequences
    - Optimization suggestions based on performance metrics
    - Rate limiting and retry logic with exponential backoff
  - **ReactFlow Visualization**: Interactive process flowchart component
    - Auto-layout algorithm assigns activities to layers
    - Color-coded nodes (green=start, blue=intermediate, red=end)
    - Edge thickness based on transition frequency
    - Animated edges for high-frequency paths
    - MiniMap, controls, and background grid
  - **API Endpoints**: New `/api/processes/[id]/discover` endpoint for process discovery
- 2025-11-07: **COMPLETED COMPREHENSIVE UI MODERNIZATION** (13-task systematic overhaul)
  - Phase 0 (Design System): Tailwind v4 brand color tokens, skeleton loaders, empty states, hover utilities
  - Phase 1 (Experience Hygiene): Replaced all spinner loading with skeletons, eliminated hardcoded #11c1d6 colors (now use brand utilities), added smooth hover effects, enhanced empty states
  - Phase 2 (Data Visualization): Installed framer-motion with React Context modal animations, dashboard KPI cards with trend indicators (+12%, -8%, +5%, +18%), enhanced tables with brand-colored hover (hover:bg-brand/5) and proper Table components
  - Phase 3 (Advanced Polish): Dark/light mode toggle with theme persistence, mobile-responsive spacing (p-4 md:p-6 lg:p-8), button microinteractions (active:scale-95), icon rotation animations
  - **Result**: Enterprise-grade UI matching landing page quality, consistent brand colors, smooth animations, full dark mode support, mobile-optimized, professional loading states
- 2025-11-07: Added shared navigation layout to all pages
  - Created AppLayout component with sidebar navigation and user menu
  - Applied to all 9 feature pages (Process Discovery, Conformance Checking, Performance Analytics, Automation Opportunities, Predictive Analytics, Digital Twin, Scenario Analysis, Document Upload, API Integrations)
  - Mobile-responsive with hamburger menu for sidebar
  - Active page highlighting in navigation
  - User menu accessible from all pages
  - Users can now navigate between all pages without getting stuck
- 2025-11-07: Authentication system fully working and tested
  - Fixed critical cookie bug: Changed from cookies().set to response.cookies.set
  - JWT tokens now properly persist in httpOnly cookies with 7-day expiry
  - Specific error messages: "Password is incorrect" vs "No account found with this email"
  - Auto-login after signup with "Account created! Logging you in..." message
  - Successful login/logout/re-login flow verified in production
  - Dashboard access working with proper session management
  - Toast notifications for all auth actions (success and errors)
  - Password validation: minimum 12 characters, bcryptjs with 12 salt rounds
  - Hydration error fixed with suppressHydrationWarning on html tag
  - Cross-origin warnings resolved with allowedDevOrigins configuration
- 2025-11-07: Implemented complete custom authentication system
  - Created custom auth with bcryptjs password hashing and JWT tokens
  - Added useAuth hook with React Query for client-side authentication state
  - Created landing page with transparent glass design and white text
  - Updated root page routing to show landing page or dashboard based on auth status
  - Added user menu with logout button to dashboard header
  - All authentication is self-sufficient and portable (not dependent on Replit infrastructure)
- 2025-11-07: Connected all navigation pages
  - Created dedicated pages: /process-discovery, /conformance-checking, /performance-analytics, /automation-opportunities, /predictive-analytics
  - Updated all sidebar navigation links to route to actual pages
  - All pages fetch real data from backend APIs with loading states and empty state handling
  - Verified existing pages work correctly: /document-upload, /api-integrations, /digital-twin, /scenario-analysis
- 2025-11-07: Completed functional dashboard implementation
  - Connected all dashboard tabs to backend APIs with proper error handling
  - Import Data button opens modal for CSV upload via /api/upload
  - New Analysis button opens modal for process creation via /api/processes
  - Process Discovery tab fetches and displays real processes
  - Performance Analytics tab fetches metrics with required processId parameter
  - Automation Opportunities tab fetches data and calculates stats from real backend
  - Dashboard KPI cards display real database statistics (show 0 when empty)
  - Removed all hardcoded placeholder data - dashboard shows only real data
  - Added loading spinners and empty state messages for all tabs
  - All API calls include proper error checking with response.ok validation
- 2025-11-06: Built complete backend infrastructure
  - PostgreSQL database with 10+ tables
  - Full CRUD API endpoints for all entities
  - Process mining algorithms (discovery, performance, automation)
  - Secure file upload with CSV parsing
  - Analytics calculation services
- Configured Next.js to work with Replit's proxy
- Updated dev and start scripts to bind to 0.0.0.0:5000

## User Preferences
- None specified yet
