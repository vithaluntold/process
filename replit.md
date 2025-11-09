# EPI X-Ray - Process Mining Platform

## Overview
EPI X-Ray is an advanced process mining and automation platform designed to analyze, optimize, and automate business processes. It provides deep insights into process performance, identifies areas for improvement, and simulates the impact of potential changes. Key capabilities include process discovery, conformance checking, performance analytics, automation opportunity identification, predictive analytics, digital twin simulation, and scenario analysis. The platform aims to revolutionize how businesses understand and improve their operational workflows.

## User Preferences
- Prefers comprehensive documentation with detailed feature descriptions and step-by-step user guides

## System Architecture
The EPI X-Ray platform is built with Next.js 15.5.4, React 19.1.0, and TypeScript, utilizing pnpm as the package manager. The frontend runs on port 5000.

**UI/UX Design:**
- **Styling**: Tailwind CSS v4 with shadcn/ui components and custom brand color utilities.
- **Brand Colors**: Primary color `oklch(0.72 0.14 195)` (cyan) with automatic dark mode adjustment, along with semantic tokens for success, warning, info, and destructive states.
- **Animations**: `framer-motion` for interactive elements like modals, transitions, button click animations, card hover lifts, and icon rotations.
- **Components**: `shadcn/ui` base components augmented with custom enhancements like skeleton loaders, empty states, and a theme toggle.
- **Dark Mode**: Full dark/light mode support with theme persistence.
- **Responsiveness**: Optimized for mobile with responsive navigation and adaptive spacing.
- **Process Visualization**: Interactive process flowcharts powered by ReactFlow, featuring auto-layout, color-coded nodes, edge thickness based on transition frequency, and animated edges for high-frequency paths. Includes MiniMap, controls, and a background grid.
- **Branding**: FinACEverse branded footer component displayed on all pages.

**Technical Implementations & Feature Specifications:**
- **Core Features**: Process Discovery (Alpha Miner, Inductive Miner), Conformance Checking (token-based replay), Performance Analytics (cycle time, throughput, bottleneck identification, activity statistics, rework rates), Automation Opportunities identification, Predictive Analytics (AI-powered forecasting and anomaly detection), Digital Twin Simulation, Scenario Analysis, Task Mining, Real-Time Process Monitoring, Advanced Reporting & Exports, Cost Analysis & ROI Calculator, and AI Process Assistant.
- **Real-Time Monitoring**: Live process instance tracking, real-time alerts, process health scores, and automated instance synchronization.
- **Advanced Reporting**: Comprehensive report generation system with PDF, Excel, and PowerPoint export formats, multiple report types, and report history management.
- **Cost Analysis & ROI Calculator**: Automatic cost metric generation for process activities and an ROI calculation engine with visual cost breakdown.
- **AI Process Assistant**: Natural language chatbot interface powered by GPT-4o for process mining insights, context-aware responses, and real-time AI-powered recommendations.
- **Process Discovery Algorithm**: Implements the Alpha Miner algorithm to automatically discover process models from event logs.
- **Performance Analytics Engine**: Calculates cycle times, throughput, and identifies bottlenecks using statistical analysis.
- **Anomaly Detection**: Features five algorithms for detecting anomalies (duration outliers, sequence violations, resource anomalies, temporal patterns, frequency anomalies) with severity classification and AI-generated insights.
- **Token-Based Replay Conformance Checking**: Industry-standard Petri net conformance validation using forced firing algorithm to detect deviations and calculate fitness scores.
- **Task Mining**: Comprehensive desktop activity analysis system with 5 database tables, a full REST API layer, AI-powered pattern detection, automation opportunity engine, and privacy consent tracking.
- **Digital Twin Simulation & What-If Scenarios**: Production-ready discrete-event simulator for creating process digital twins with probabilistic activity duration sampling, case lifecycle management, and token flow. Supports scenario parameters like duration multipliers, number of cases, and arrival rate, providing results on total/completed cases, average cycle time, throughput, and bottleneck identification.

**Backend Architecture:**
- **Database**: PostgreSQL, managed via Neon, utilizing Drizzle ORM. Key tables cover users, processes, event logs, models, AI insights, conformance results, simulations, KPIs, integrations, instances, alerts, reports, cost analysis, ROI, comments, and custom KPIs.
- **API Endpoints**: Comprehensive RESTful API for processes, event logs, analytics, file uploads, process analysis/discovery, real-time monitoring, reports, cost analysis, and AI assistant.
- **Security**: Implements UUID-based filename sanitization, file type/size validation, CSV validation, and database constraints.

**Authentication & Security System:**
- **Type**: Custom JWT-based authentication.
- **Password Security**: `bcryptjs` with 12 salt rounds, strong password requirements.
- **Session Management**: JWT tokens with 7-day expiry, stored in `httpOnly` cookies.
- **Input Validation**: Zod schemas for all user inputs.
- **Email Normalization**: Emails converted to lowercase and sanitized.
- **API Routes**: Dedicated endpoints for user registration, login, logout, current user info, and CSRF token generation.
- **Security Features**: Rate limiting, CSRF protection, generic error messages for authorization, input sanitization, and audit logging.

**GDPR Compliance Features:**
- **Data Export**: Complete user data export in JSON format.
- **Right to Deletion**: Cascading deletion of all user data with password confirmation.
- **Consent Management**: Track and manage user consents with timestamps and audit trail.
- **Privacy Controls**: Users can view, update, and revoke consents.
- **Data Minimization**: Only essential data captured.
- **Audit Trail**: All data access and modifications logged.

**Desktop Application:**
- EPI X-Ray is available as an installable desktop application built with Electron 28.
- **Platform Support**: Windows (.exe, portable), macOS (DMG, ZIP for ARM64/x64), Linux (AppImage, .deb, RPM).
- **Desktop Features**: Native menus, keyboard shortcuts, 1400x900 default window, context isolation, sandboxed security, external links in system browser, about dialog, and auto-update readiness.

## External Dependencies
- **Database**: PostgreSQL (via Neon)
- **ORM**: Drizzle ORM
- **AI Integration**: OpenAI GPT-4.1 (using Replit AI Integrations) for AI-powered insights, anomaly detection, and optimization suggestions.
- **UI Libraries**: ReactFlow for process model visualization.
- **Desktop Framework**: Electron 28 with Electron Builder for cross-platform installers.