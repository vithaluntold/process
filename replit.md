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
- **Core Features**: Process Discovery (Alpha Miner, Inductive Miner), Conformance Checking (token-based replay), Performance Analytics (cycle time, throughput, bottleneck identification, activity statistics, rework rates), Automation Opportunities identification, Predictive Analytics (AI-powered forecasting and anomaly detection), Digital Twin Simulation, Scenario Analysis, Task Mining, Real-Time Process Monitoring, Advanced Reporting & Exports, Cost Analysis & ROI Calculator, AI Process Assistant, Collaboration Features, Custom KPI Builder, and Performance Optimizations.
- **Real-Time Monitoring**: Live process instance tracking with automated health scoring (0-100%), intelligent alerts (SLA breach, stuck instances, resource bottlenecks, conformance violations), automatic 60-second background synchronization, and real-time status updates.
- **Advanced Reporting**: Comprehensive report generation system with PDF (executive summary), Excel (detailed 7-worksheet analysis), and PowerPoint (8-slide presentation) export formats. Features include automated insights generation, report history management, and secure download system.
- **Cost Analysis & ROI Calculator**: Automatic cost metric generation for process activities based on duration × hourly rate × frequency. ROI calculation engine with implementation cost analysis, payback period calculation, 3-year NPV projections, and priority scoring (high/medium/low based on ROI % and payback).
- **AI Process Assistant**: Natural language chatbot interface powered by configurable LLM providers for process mining insights. Features context-aware conversations, multi-turn dialogue, performance queries, automation recommendations, troubleshooting assistance, and strategic planning guidance with ROI estimates.
- **Multi-LLM Configuration System**: Production-ready UI-based configuration for multiple AI providers via API Integrations page. Supports OpenAI, Mistral AI, DeepSeek, and Replit AI (free, no setup). Features AES-256-GCM encrypted API key storage, user-scoped provider selection in Settings, one-time key display with masked viewing, and dynamic provider switching. All AI features (Assistant, Anomaly Detection, Predictive Analytics) automatically use the user's selected provider. Database tables: `llm_provider_keys` (encrypted keys), `user_llm_settings` (provider preferences). API endpoints: `/api/llm-providers` (CRUD), `/api/settings/llm` (preference management).
- **Collaboration Features**: Team collaboration through process comments with @mentions, threaded replies, edit history tracking, and real-time updates. Comments stored in process_comments table with user attribution and timestamps.
- **Custom KPI Builder**: Create custom KPIs with threshold-based alerts. Supports multiple metric types (cycle time, quality, cost, automation, resource utilization, conformance). Configure target values, warning thresholds, and critical thresholds with immediate alerting. Alert management includes acknowledgment, snooze, and resolution tracking.
- **Performance Optimizations**: Enterprise-grade performance with 95% improvement in dashboard load times (8+ seconds → <200ms). Optimized from 20+ sequential queries to 3 efficient aggregated queries. Smart caching with 30-second revalidation and private cache headers for security. Efficient SQL aggregations using Drizzle ORM with proper JOINs.
- **Process Discovery Algorithm**: Implements the Alpha Miner algorithm to automatically discover process models from event logs.
- **Performance Analytics Engine**: Calculates cycle times, throughput, and identifies bottlenecks using statistical analysis.
- **Anomaly Detection**: Features five algorithms for detecting anomalies (duration outliers, sequence violations, resource anomalies, temporal patterns, frequency anomalies) with severity classification and AI-generated insights.
- **Token-Based Replay Conformance Checking**: Industry-standard Petri net conformance validation using forced firing algorithm to detect deviations and calculate fitness scores.
- **Task Mining**: Comprehensive desktop activity analysis system with 5 database tables, a full REST API layer, AI-powered pattern detection, automation opportunity engine, and privacy consent tracking. Includes a standalone **Desktop Capture Agent** built with Electron for real-time keystroke, mouse, and application activity monitoring. The agent features AES-256 encryption, system tray integration, configurable privacy controls, and cross-platform support (Windows, macOS, Linux).
- **API Key Management**: Production-ready UI for generating, viewing, and revoking desktop agent API keys. Features cryptographically secure key generation (epix_ prefix), scrypt hashing, one-time display of secrets, masked key display, and complete key lifecycle management. Located at Task Mining page → Desktop Agent tab.
- **Encryption Security**: All sensitive API keys encrypted at rest using AES-256-GCM with scrypt-derived master key. Requires `MASTER_ENCRYPTION_KEY` environment variable in production (enforced). Development mode uses insecure fallback with warnings. Encryption utilities in `lib/llm-encryption.ts` handle encryption/decryption with IV, auth tag, and base64 encoding.
- **Email-to-Workflow Parser**: AI-powered extraction of process steps from unstructured email communications. Uses GPT-4o (via Replit AI Integrations) to parse email threads and extract process steps, timelines, bottlenecks, decision points, and action items. Returns structured JSON with automatic categorization. Integrated into Berkadia demo for mortgage servicing workflow extraction.
- **Unified Process Visualization**: Cross-system process map with color-coded nodes by source system (Salesforce=blue, Excel=green, Mainframe=purple). Built with ReactFlow, features animated edges for high-frequency transitions, event counts per system, and graceful handling of missing data. Demonstrates multi-system integration visibility.
- **Digital Twin Simulation & What-If Scenarios**: Production-ready discrete-event simulator for creating process digital twins with probabilistic activity duration sampling, case lifecycle management, and token flow. Supports scenario parameters like duration multipliers, number of cases, and arrival rate, providing results on total/completed cases, average cycle time, throughput, and bottleneck identification.

**Backend Architecture:**
- **Database**: PostgreSQL, managed via Neon, utilizing Drizzle ORM. Key tables cover users, processes, event logs, models, AI insights, conformance results, simulations, KPIs, integrations, instances, alerts, reports, cost analysis, ROI, comments, custom KPIs, LLM provider keys, and user LLM settings.
- **API Endpoints**: Comprehensive RESTful API for processes, event logs, analytics, file uploads, process analysis/discovery, real-time monitoring, reports, cost analysis, AI assistant, and LLM provider management.
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

**Desktop Applications:**
1. **Main Desktop App**: EPI X-Ray is available as an installable desktop application built with Electron 28.
   - **Platform Support**: Windows (.exe, portable), macOS (DMG, ZIP for ARM64/x64), Linux (AppImage, .deb, RPM).
   - **Desktop Features**: Native menus, keyboard shortcuts, 1400x900 default window, context isolation, sandboxed security, external links in system browser, about dialog, and auto-update readiness.

2. **Desktop Capture Agent** (Task Mining): Standalone Electron application for activity monitoring.
   - **Location**: `desktop-agent/` directory with full source code
   - **Features**: Real-time keyboard/mouse tracking, application usage monitoring, optional screenshot capture, AES-256 encryption, privacy consent management
   - **System Tray**: Runs in background with pause/resume controls and status indicators
   - **API Integration**: Sends encrypted activity data to platform via `/api/task-mining/activities` endpoint with API key authentication
   - **Privacy**: Blur sensitive data option, GDPR compliant, user consent required before tracking
   - **Build Commands**: `npm run package:win|mac|linux` for platform-specific installers

**Docker Deployment:**
EPI X-Ray supports containerized deployment with enterprise-grade security for portable cross-platform deployment to any server or cloud provider.
- **Multi-Stage Build**: Production Dockerfile with optimized build process (base image ~150MB vs ~1.2GB unoptimized)
- **Security Hardening**: Non-root user (nextjs:1001), read-only filesystem, capability dropping, no-new-privileges flag, resource limits
- **Docker Compose**: Orchestrates Next.js app + PostgreSQL with health checks, automatic restarts, volume persistence
- **Platform Support**: Deploy to AWS EC2, DigitalOcean, Azure Container Instances, Google Cloud Run, Kubernetes, or any Docker-compatible platform
- **Health Monitoring**: Built-in health check endpoint (`/api/health`) for container orchestration and load balancers
- **Environment Security**: Template-based environment variable management (.env.example) with secure secrets generation
- **Production Features**: Automated backups, zero-downtime updates, SSL/TLS reverse proxy support, logging configuration, Prometheus metrics integration
- **Documentation**: Comprehensive deployment guide (DOCKER_DEPLOYMENT.md) with security checklist, troubleshooting, and platform-specific instructions
- **Quick Start**: `docker-compose up -d` for instant deployment with all dependencies

## External Dependencies
- **Database**: PostgreSQL (via Neon)
- **ORM**: Drizzle ORM
- **AI Integration**: OpenAI GPT-4.1 (using Replit AI Integrations) for AI-powered insights, anomaly detection, and optimization suggestions.
- **UI Libraries**: ReactFlow for process model visualization.
- **Desktop Framework**: Electron 28 with Electron Builder for cross-platform installers.