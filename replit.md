# EPI X-Ray - Process Mining Platform

## Overview
EPI X-Ray is an advanced process mining and automation platform designed to analyze, optimize, and automate business processes. It provides deep insights into process performance, identifies areas for improvement, and simulates the impact of potential changes. Key capabilities include process discovery, conformance checking, performance analytics, automation opportunity identification, predictive analytics, digital twin simulation, and scenario analysis. The platform aims to revolutionize how businesses understand and improve their operational workflows.

## User Preferences
- Prefers comprehensive documentation with detailed feature descriptions and step-by-step user guides
- Consistent dashboard structure and navigation across all module pages

## System Architecture
The EPI X-Ray platform is built with Next.js 15.5.4, React 19.1.0, and TypeScript, utilizing pnpm as the package manager. The frontend runs on port 5000.

**UI/UX Design:**
- **Styling**: Tailwind CSS v4 with shadcn/ui components and custom brand color utilities.
- **Brand Colors**: Primary color `oklch(0.72 0.14 195)` (cyan) with automatic dark mode adjustment, along with semantic tokens.
- **Animations**: `framer-motion` for interactive elements.
- **Components**: `shadcn/ui` base components augmented with custom enhancements.
- **Dark Mode**: Full dark/light mode support with theme persistence.
- **Responsiveness**: Optimized for mobile with responsive navigation.
- **Process Visualization**: Interactive process flowcharts powered by ReactFlow, featuring auto-layout, color-coded nodes, edge thickness, and animated edges.
- **Branding**: FinACEverse branded footer component.

**Technical Implementations & Feature Specifications:**
- **Core Features**: Process Discovery (Alpha Miner, Inductive Miner), Conformance Checking (token-based replay), Performance Analytics (cycle time, throughput, bottleneck identification), Automation Opportunities, Predictive Analytics, Digital Twin Simulation, Scenario Analysis, Task Mining, Real-Time Process Monitoring, Advanced Reporting & Exports, Cost Analysis & ROI Calculator, AI Process Assistant, Collaboration Features, Custom KPI Builder, and Performance Optimizations.
- **Real-Time Monitoring**: Live process instance tracking with automated health scoring, intelligent alerts, and real-time status updates.
- **Advanced Reporting**: Comprehensive report generation system with PDF, Excel, and PowerPoint export formats.
- **Cost Analysis & ROI Calculator**: Automatic cost metric generation and ROI calculation engine with NPV projections and priority scoring.
- **AI Process Assistant**: Natural language chatbot interface powered by configurable LLM providers for process mining insights.
- **Multi-LLM Configuration System**: Production-ready UI-based configuration for multiple AI providers (Replit AI, OpenAI, Mistral AI, DeepSeek, Groq, Together AI) with encrypted API key storage and user-scoped selection.
- **Collaboration Features**: Team collaboration through process comments with @mentions, threaded replies, and real-time updates.
- **Custom KPI Builder**: Create custom KPIs with threshold-based alerts and alert management.
- **Performance Optimizations**: Enterprise-grade performance with optimized dashboard load times, smart caching, and efficient SQL aggregations.
- **Process Discovery Algorithm**: Implements the Alpha Miner algorithm.
- **Anomaly Detection**: Five algorithms for detecting anomalies with severity classification and AI-generated insights.
- **Token-Based Replay Conformance Checking**: Industry-standard Petri net conformance validation.
- **Task Mining**: Comprehensive desktop activity analysis system with AI-powered pattern detection, automation opportunity engine, and privacy consent tracking. Includes a standalone **Desktop Capture Agent** built with Electron for real-time monitoring.
- **API Key Management**: UI for generating, viewing, and revoking desktop agent API keys with cryptographically secure generation.
- **Encryption Security**: All sensitive API keys encrypted at rest using AES-256-GCM.
- **Email-to-Workflow Parser**: AI-powered extraction of process steps from unstructured email communications.
- **Unified Process Visualization**: Cross-system process map with color-coded nodes by source system.
- **Digital Twin Simulation & What-If Scenarios**: Production-ready comprehensive digital twin platform with three integrated modules: (1) **Process Modeling** - Interactive ReactFlow visualization with color-coded nodes (green=start, red=end, cyan=activities), animated edges for high-frequency transitions, and real-time process statistics; (2) **What-If Analysis** - Scenario configuration interface with slider controls for case count (10-500) and duration multipliers (0.5x-2.0x), real-time simulation execution via discrete-event simulator, and complete scenario history with metrics; (3) **Impact Simulation** - Baseline vs. optimized scenario comparison engine calculating cycle time improvements, throughput increases, bottleneck resolution tracking, and visual impact cards. Features comprehensive race condition prevention for cross-process data isolation, null-safe rendering, and production-grade state management.

**Backend Architecture:**
- **Database**: PostgreSQL, managed via Neon, utilizing Drizzle ORM.
- **API Endpoints**: Comprehensive RESTful API for various platform functionalities.
- **Security**: UUID-based filename sanitization, file type/size validation, and database constraints.

**Authentication & Security System:**
- **Type**: Custom JWT-based authentication.
- **Password Security**: `bcryptjs` with 12 salt rounds, strong password requirements.
- **Session Management**: JWT tokens with 7-day expiry, stored in `httpOnly` cookies.
- **Input Validation**: Zod schemas.
- **Security Features**: Rate limiting, CSRF protection, input sanitization, and audit logging.

**GDPR Compliance Features:**
- **Data Export**: Complete user data export in JSON format.
- **Right to Deletion**: Cascading deletion of all user data.
- **Consent Management**: Track and manage user consents.

**Desktop Applications:**
1. **Main Desktop App**: EPI X-Ray is available as an installable desktop application built with Electron 28, supporting Windows, macOS, and Linux.
2. **Desktop Capture Agent** (Task Mining): Standalone Electron application for activity monitoring, located in `desktop-agent/` with features like real-time tracking, encryption, privacy controls, and API integration.

**Docker Deployment:**
EPI X-Ray supports containerized deployment with a multi-stage Docker build, security hardening, Docker Compose orchestration, and comprehensive deployment documentation.

## External Dependencies
- **Database**: PostgreSQL (via Neon)
- **ORM**: Drizzle ORM
- **AI Integration**: OpenAI GPT-4.1 (using Replit AI Integrations)
- **UI Libraries**: ReactFlow
- **Desktop Framework**: Electron 28 with Electron Builder