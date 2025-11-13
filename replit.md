# EPI X-Ray - Process Mining Platform

## Overview

**EPI X-Ray: See Through Your Processes, Transform Your Business**

EPI X-Ray is a next-generation process intelligence platform that empowers organizations to see the invisible—the hidden patterns, inefficiencies, and opportunities buried deep within their business operations. Built for the modern enterprise, EPI X-Ray transforms raw operational data into actionable insights with surgical precision.

**The Vision:**
In a world where businesses generate terabytes of process data daily, most organizations remain blind to what's actually happening in their operations. EPI X-Ray changes that. We believe every business deserves X-ray vision into their processes—the ability to see bottlenecks before they cause delays, predict failures before they happen, and simulate improvements before implementing them.

**What We Strive Towards:**
- **Radical Transparency**: Make every process visible, measurable, and understandable
- **Predictive Intelligence**: Shift from reactive problem-solving to proactive optimization
- **Democratic Access**: Bring enterprise-grade process mining to mid-market businesses and SMBs
- **Speed to Insight**: Deliver answers in seconds, not weeks—because decisions can't wait
- **Continuous Evolution**: Transform static process maps into living digital twins that adapt and learn

**The Platform:**
EPI X-Ray combines cutting-edge AI, advanced algorithms, and intuitive design to deliver a comprehensive process intelligence suite. From discovering hidden workflows in email threads to simulating the ROI of process changes, from detecting anomalies in real-time to forecasting future performance—every feature is built with one goal: help businesses operate at their absolute best.

**Core Capabilities:**
- **Process Discovery**: Automatically extract and visualize process flows with thin, electric-animated diagrams
- **Predictive Analytics**: Forecast trends, detect anomalies, and run what-if scenarios
- **Digital Twin Simulation**: Create living models of your processes and test changes risk-free
- **Real-Time Monitoring**: Track process health with intelligent alerts and automated scoring
- **AI-Powered Insights**: Natural language queries meet enterprise-grade analytics
- **Task Mining**: Desktop activity analysis for automation opportunity discovery
- **Advanced Reporting**: Export insights to stakeholders in PDF, Excel, and PowerPoint
- **Collaboration**: Team-based process improvement with comments, mentions, and threads

EPI X-Ray doesn't just show you what happened—it shows you what's happening, what will happen, and what could happen if you make the right changes. It's process mining evolved for the AI era, designed to make every organization faster, smarter, and more efficient.

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
- **Unified Process Analysis Dashboard**: Comprehensive multi-tab interface consolidating all five analysis types (Process Discovery, Conformance Checking, Performance Analytics, Automation Opportunities, Predictive Analytics) into a single page with horizontal tab navigation. Features include: process selector dropdown, Filter dialog (date range and confidence threshold), Share dropdown (email, copy link, export to PDF/Excel/PowerPoint), deep linking support via query parameters, and real-time loading states for each analysis type. All API endpoints properly connected with filter parameters passed in request body.
- **Real-Time Monitoring**: Live process instance tracking with automated health scoring, intelligent alerts, and real-time status updates.
- **Advanced Reporting**: Comprehensive report generation system with PDF, Excel, and PowerPoint export formats.
- **Cost Analysis & ROI Calculator**: Automatic cost metric generation and ROI calculation engine with NPV projections and priority scoring.
- **AI Process Assistant**: Natural language chatbot interface powered by configurable LLM providers for process mining insights.
- **Multi-LLM Configuration System**: Production-ready UI-based configuration for multiple AI providers (Replit AI, OpenAI, Mistral AI, DeepSeek, Groq, Together AI) with encrypted API key storage and user-scoped selection.
- **Collaboration Features**: Team collaboration through process comments with @mentions, threaded replies, and real-time updates.
- **Custom KPI Builder**: Create custom KPIs with threshold-based alerts and alert management.
- **Performance Optimizations**: Enterprise-grade performance with optimized dashboard load times, smart caching, and efficient SQL aggregations.
- **Process Discovery Algorithm**: Implements the Alpha Miner algorithm.
- **Predictive Analytics Suite**: Comprehensive forecasting and scenario analysis system with three integrated modules: (1) **Anomaly Detection** - Five algorithms for detecting anomalies with severity classification and AI-generated insights; (2) **Forecasting** - Hybrid time-series prediction using Holt-Winters exponential smoothing (≥12 data points), linear regression (medium data), and moving average (sparse data) with EWMA denoising, confidence intervals, and 30/60/90-day predictions for cycle time, throughput, and resource utilization; (3) **Scenario Analysis** - What-if simulation engine leveraging discrete-event simulator to compare optimistic (30% more resources, 30% faster), expected (baseline), and pessimistic (30% fewer resources, 50% slower) scenarios with risk assessment, SLA breach probability calculation, and comprehensive comparison metrics. Features data quality indicators, zero-division guards, and graceful degradation for insufficient data.
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