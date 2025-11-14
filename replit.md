# EPI-Q - Enterprise Process Mining SaaS Platform

## Overview
EPI-Q is a next-generation enterprise-grade multi-tenant SaaS process intelligence platform designed to transform raw operational data into actionable insights. Its core purpose is to provide organizations with transparency into their processes, enabling predictive intelligence, real-time monitoring, and continuous improvement. The platform aims to make process mining accessible, deliver rapid insights, and evolve processes into living digital twins. Key capabilities include process discovery, predictive analytics, digital twin simulation, real-time monitoring, AI-powered insights, task mining, and advanced reporting. EPI-Q strives to make businesses faster, smarter, and more efficient by leveraging AI and advanced algorithms.

## User Preferences
- Prefers comprehensive documentation with detailed feature descriptions and step-by-step user guides
- Consistent dashboard structure and navigation across all module pages

## System Architecture
EPI-Q is a production-ready enterprise SaaS platform built with Next.js, React, and TypeScript. It utilizes a multi-tenant architecture with strict data isolation by `organizationId` and a robust role hierarchy (Super Admin, Admin, Employee). Security features include JWT-based authentication, RBAC, Zod schema validation, SQL injection protection via Drizzle ORM, and AES-256-GCM encrypted API keys.

**UI/UX Design:**
The frontend uses Tailwind CSS with shadcn/ui components, `framer-motion` for animations, and a custom brand color palette. It features full dark/light mode support, responsiveness, and interactive process visualizations powered by ReactFlow with auto-layout and color-coded elements. Role-based navigation is dynamic, filtering routes for Super Admins.

**Multi-Tenant UI Pages:**
Key production-ready pages include Organizations Dashboard (Super Admin only), Support Tickets, Subscription Management, and a public Pricing Page.

**Technical Implementations & Feature Specifications:**
- **Core Features**: Process Discovery (Alpha Miner, Inductive Miner), Conformance Checking (token-based replay), Performance Analytics, Automation Opportunities, Predictive Analytics, Digital Twin Simulation, Task Mining, Real-Time Process Monitoring, and Advanced Reporting.
- **Unified Process Analysis Dashboard**: A multi-tab interface consolidating all analysis types (Discovery, Conformance, Performance, Automation, Predictive) with filtering, sharing options, and deep linking.
- **Predictive Analytics Suite**: Integrates Anomaly Detection (five algorithms), Forecasting (hybrid time-series prediction with Holt-Winters, linear regression, moving average, EWMA denoising), and Scenario Analysis (discrete-event simulator for optimistic, expected, pessimistic scenarios).
- **Digital Twin Simulation**: Includes Process Modeling (ReactFlow visualization), What-If Analysis (scenario configuration, real-time simulation), and Impact Simulation (baseline vs. optimized comparison).
- **AI-Powered Features**: AI Process Assistant using configurable LLM providers (Replit AI, OpenAI, Mistral AI, DeepSeek, Groq, Together AI) with encrypted API key storage.
- **Task Mining**: Desktop activity analysis with AI-powered pattern detection and a standalone Electron-based Desktop Capture Agent.
- **Payment Gateway Support**: Production-ready infrastructure with a factory pattern supporting Razorpay, PayU, and Payoneer, including subscription management and webhook verification.
- **Backend**: PostgreSQL database managed via Neon, Drizzle ORM, comprehensive RESTful API, and robust authentication/security (custom JWT, bcryptjs, Zod validation, rate limiting, CSRF protection).
- **GDPR Compliance**: Features for data export, right to deletion, and consent management.
- **Desktop Applications**: An installable Electron-based main desktop application for Windows, macOS, and Linux, and a separate Desktop Capture Agent for task mining.
- **Deployment**: Supports containerized deployment using Docker with multi-stage builds and Docker Compose.

## External Dependencies
- **Database**: PostgreSQL (via Neon)
- **ORM**: Drizzle ORM
- **AI Integration**: OpenAI GPT-4.1 (via Replit AI Integrations)
- **UI Libraries**: ReactFlow
- **Desktop Framework**: Electron 28 with Electron Builder