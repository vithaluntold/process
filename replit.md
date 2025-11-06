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

## Recent Changes
- 2025-11-06: Initial project import and Replit environment setup
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
