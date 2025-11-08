# EPI X-Ray - Process Mining Platform

## Overview
EPI X-Ray is an advanced process mining and automation platform designed to analyze, optimize, and automate business processes. It provides deep insights into process performance, identifies areas for improvement, and simulates the impact of potential changes. Key capabilities include process discovery, conformance checking, performance analytics, automation opportunity identification, predictive analytics, digital twin simulation, and scenario analysis. The platform aims to revolutionize how businesses understand and improve their operational workflows.

## User Preferences
- Prefers comprehensive documentation with detailed feature descriptions and step-by-step user guides

## Project Documentation
- **FEATURES.md**: Complete technical feature documentation covering all platform capabilities, AI features, security, and GDPR compliance
- **USER_GUIDE.md**: Comprehensive step-by-step user guide with examples, troubleshooting, and best practices
- **TASK_MINING_ROADMAP.md**: Strategic 15-month implementation plan for Task Mining capabilities

## System Architecture
The EPI X-Ray platform is built with Next.js 15.5.4, React 19.1.0, and TypeScript, utilizing pnpm as the package manager. The frontend runs on port 5000.

**UI/UX Design:**
- **Styling**: Tailwind CSS v4 with shadcn/ui components and custom brand color utilities.
- **Brand Colors**: Primary color `oklch(0.72 0.14 195)` (cyan) with automatic dark mode adjustment, along with semantic tokens for success, warning, info, and destructive states. All components use CSS custom properties for theme support.
- **Animations**: `framer-motion` for modals and transitions for interactive elements, including button click animations (active:scale-95), card hover lifts, and icon rotation animations.
- **Components**: `shadcn/ui` base components augmented with custom enhancements like skeleton loaders, empty states, and a theme toggle.
- **Dark Mode**: Full dark/light mode support with a theme toggle in the header and theme persistence.
- **Responsiveness**: Optimized for mobile with responsive navigation using a Sheet component and adaptive spacing (p-4 md:p-6 lg:p-8).
- **Process Visualization**: Interactive process flowcharts powered by ReactFlow, featuring auto-layout, color-coded nodes (green=start, blue=intermediate, red=end), edge thickness based on transition frequency, and animated edges for high-frequency paths. Includes MiniMap, controls, and a background grid.

**Technical Implementations & Feature Specifications:**
- **Core Features**: Process Discovery (Alpha Miner, Inductive Miner), Conformance Checking (token-based replay), Performance Analytics (cycle time, throughput, bottleneck identification, activity statistics, rework rates), Automation Opportunities identification, Predictive Analytics (AI-powered forecasting and anomaly detection), Digital Twin Simulation, and Scenario Analysis.
- **Process Discovery Algorithm**: Implements the Alpha Miner algorithm to automatically discover process models from event logs, identifying activities, start/end activities, direct succession, causal, parallel, and choice relations, and calculating transition frequencies.
- **Performance Analytics Engine**: Calculates average/median cycle times, throughput, identifies bottlenecks using statistical analysis (mean, median, std dev, 95th percentile), and analyzes activity statistics.
- **Anomaly Detection**: Features five algorithms for detecting anomalies (duration outliers, sequence violations, resource anomalies, temporal patterns, frequency anomalies) with severity classification (critical, high, medium, low) and AI-generated insights.
- **Token-Based Replay Conformance Checking**: Industry-standard Petri net conformance validation using forced firing algorithm. Replays event logs against discovered process models to detect deviations (unexpected activities, missing transitions, wrong-order execution). Calculates fitness scores using standard formula: (consumed - missing) / (consumed + remaining). Features parallel join support (counts ALL missing tokens for AND-joins), wrong-order detection (tracks executed activities to identify causal precedence violations), and latest model auto-selection. Results persisted in conformance_results table with detailed deviation tracking.

**Backend Architecture:**
- **Database**: PostgreSQL, managed via Neon, utilizing Drizzle ORM for type-safe queries. Key tables include `users`, `processes`, `event_logs`, `process_models`, `discovered_models`, `ai_insights`, `conformance_results`, `simulation_scenarios`, `kpi_metrics`, and `integrations`. Session data is managed automatically by connect-pg-simple (not tracked in Drizzle schema).
- **API Endpoints**: Comprehensive RESTful API for processes (`/api/processes`), event logs (`/api/event-logs`), analytics (`/api/analytics`), file uploads (`/api/upload`), and process analysis/discovery (`/api/processes/[id]/analyze`, `/api/processes/[id]/discover`, `/api/processes/[id]/detect-anomalies`, `/api/processes/[id]/check-conformance`).
- **Security**: Implements UUID-based filename sanitization, file type/size validation (CSV, 50MB max), CSV validation (caseId, activity, timestamp required), and database constraints.

**Authentication & Security System:**
- **Type**: Custom JWT-based authentication, fully independent and portable.
- **Password Security**: `bcryptjs` with 12 salt rounds for hashing, requiring a minimum of 12 characters with uppercase, lowercase, and number requirements.
- **Session Management**: JWT tokens with 7-day expiry, stored in `httpOnly` cookies with `sameSite: lax` protection.
- **Input Validation**: Comprehensive Zod schemas for all user inputs with email validation, name sanitization, and control character removal.
- **Email Normalization**: All emails converted to lowercase and sanitized before storage to prevent duplicate account issues.
- **API Routes**: Dedicated endpoints for user registration (`/api/auth/signup`), login (`/api/auth/login`), logout (`/api/auth/logout`), fetching current user info (`/api/auth/user`), and CSRF token generation (`/api/auth/csrf`).
- **User Experience**: Features a glass-morphism landing page with login/signup tabs, protected routes for dashboard and feature pages, a user menu with logout functionality, and toast notifications for all authentication actions.
- **Security Features**:
  - **Rate Limiting**: In-memory rate limiting (5 login attempts per 15 min, 3 signups per hour) with IP-based tracking and trusted proxy validation
  - **CSRF Protection**: Token-based CSRF protection for all state-changing operations (signup, account deletion, consent management)
  - **Authorization**: Generic error messages prevent user enumeration, database-level ownership enforcement ensures data isolation
  - **Input Sanitization**: Zod validation + XSS prevention on all inputs
  - **Audit Logging**: All authentication and GDPR actions logged with IP, user agent, and timestamps
  - **Reusable Auth Helper**: `lib/server-auth.ts` for consistent JWT verification across API routes

**GDPR Compliance Features:**
- **Data Export** (`/api/gdpr/export`): Complete user data export in JSON format including processes, event logs, documents, audit logs, simulation scenarios, and consent records (GDPR Article 20: Right to Data Portability)
- **Right to Deletion** (`/api/gdpr/delete-account`): Cascading deletion of all user data with password confirmation (GDPR Article 17: Right to Erasure)
- **Consent Management** (`/api/gdpr/consent`): Track and manage user consents with timestamps, IP addresses, and audit trail (GDPR Article 7: Conditions for Consent)
- **Privacy Controls**: Users can view, update, and revoke consents at any time
- **Data Minimization**: Only essential data captured and stored
- **Audit Trail**: All data access and modifications logged in `audit_logs` table

**Digital Twin Simulation & What-If Scenarios:**
- **Discrete-Event Simulator**: Production-ready simulation engine for creating process digital twins
  - Event queue with time-based execution for accurate process flow simulation
  - Probabilistic activity duration sampling using Box-Muller normal distribution
  - Case lifecycle management (start → activities → completion)
  - Token flow through discovered process models
- **Scenario Parameters**: 
  - Duration multipliers (global "*" or activity-specific) for testing process improvements
  - Number of cases to simulate (default: 100)
  - Arrival rate (ms between case starts, default: 300,000ms = 5min)
- **Simulation Results**:
  - Total and completed cases count
  - Average cycle time across all cases
  - Throughput (cases/hour)
  - Activity-level statistics: processing time, utilization rate, completion count
  - Bottleneck identification (top 3 slowest activities)
  - Case time distribution for histogram analysis
- **Robust Error Handling**: Guards against zero cases, empty arrays, deadlocked processes
- **API Endpoints**: 
  - POST `/api/simulations` - Create and run simulation scenario
  - GET `/api/simulations?processId=X` - List all scenarios for a process
  - GET `/api/simulations/[id]` - Get specific scenario details
  - DELETE `/api/simulations/[id]` - Delete scenario
- **UI Integration**: What-If Scenarios page with tabbed interface (Create Scenario + Saved Scenarios), scenario configuration form, results visualization with KPI cards
- **Authentication**: Reusable JWT-based auth helper (`lib/server-auth.ts`) for Next.js API routes
- **Future Enhancements**: Probability overrides for transition paths, resource constraints, wait time tracking

## External Dependencies
- **Database**: PostgreSQL (via Neon)
- **ORM**: Drizzle ORM
- **AI Integration**: OpenAI GPT-4.1 (using Replit AI Integrations, no API key needed), specifically utilizing `openai`, `p-retry`, and `p-limit` packages for AI-powered insights, anomaly detection, and optimization suggestions.
- **UI Libraries**: ReactFlow for process model visualization.