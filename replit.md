# EPI-Q - Enterprise Process Mining SaaS Platform

## Overview
EPI-Q is a next-generation enterprise-grade multi-tenant SaaS process intelligence platform designed to transform raw operational data into actionable insights. Its core purpose is to provide organizations with transparency into their processes, enabling predictive intelligence, real-time monitoring, and continuous improvement. The platform aims to make process mining accessible, deliver rapid insights, and evolve processes into living digital twins. Key capabilities include process discovery, predictive analytics, digital twin simulation, real-time monitoring, AI-powered insights, task mining, and advanced reporting. EPI-Q strives to make businesses faster, smarter, and more efficient by leveraging AI and advanced algorithms.

## User Preferences
- Prefers comprehensive documentation with detailed feature descriptions and step-by-step user guides
- Consistent dashboard structure and navigation across all module pages

## System Architecture
EPI-Q is a production-ready enterprise SaaS platform built with Next.js, React, and TypeScript. It utilizes a multi-tenant architecture with strict data isolation by `organizationId` and a robust role hierarchy (Super Admin, Admin, Employee). Security features include JWT-based authentication, team-based RBAC, Zod schema validation, SQL injection protection via Drizzle ORM, AES-256-GCM encrypted API keys, comprehensive CSRF protection, and distributed rate limiting across all API endpoints.

**Team Hierarchy & RBAC:**
The platform implements comprehensive team-based access control with:
- Team management system with dedicated team managers who own processes
- Invite-only employee registration via secure token-based invitations
- Team-level process ownership and access control
- Role-based permissions (Team Manager, Team Member)
- Admin-defined team structure during employee onboarding
- RBAC enforcement at API level using `server/rbac.ts` utilities
- Process access based on team membership and ownership

**UI/UX Design:**
The frontend uses Tailwind CSS with shadcn/ui components, `framer-motion` for animations, and a custom brand color palette. It features full dark/light mode support, responsiveness, and interactive process visualizations powered by ReactFlow with auto-layout and color-coded elements. 

**Navigation Architecture:**
All authenticated dashboard pages use a standardized `AppLayout` component wrapper for consistent navigation. The `AppLayout` component provides:
- Unified header with branding, theme toggle, and user dropdown
- Responsive sidebar with role-based menu filtering (Super Admins see Organizations link)
- Mobile-friendly sheet navigation
- Consistent page structure with `PageHeader` component for titles and descriptions

Pages using AppLayout:
- Dashboard (app/page.tsx)
- Organizations (app/(dashboard)/admin/organizations/page.tsx) - Super Admin only
- Teams (app/(dashboard)/admin/teams/page.tsx) - Admin/Super Admin only
- Invitations (app/(dashboard)/admin/invitations/page.tsx) - Admin/Super Admin only
- Support Tickets (app/(dashboard)/admin/tickets/page.tsx)
- Subscription & Billing (app/(dashboard)/subscription/page.tsx)
- Pricing Plans (app/(dashboard)/pricing/page.tsx)
- Settings (app/settings/page.tsx)
- What-If Scenarios (app/what-if-scenarios/page.tsx)
- Downloads (app/downloads/page.tsx)
- All feature pages (Process Discovery, Task Mining, Monitoring, etc.)

Public Pages (no AppLayout):
- Login (app/auth/login/page.tsx)
- Accept Invitation (app/auth/accept-invite/page.tsx) - Invite-only employee registration

**Multi-Tenant UI Pages:**
Key production-ready pages include Organizations Dashboard (Super Admin only), Support Tickets, Subscription Management, and a public Pricing Page.

**Technical Implementations & Feature Specifications:**
- **Team Management**: Complete team hierarchy system with team creation, manager assignment, member management, and team-based process ownership. Includes invite-only employee registration with secure token-based invitations (7-day expiration).
- **Core Features**: Process Discovery (Alpha Miner, Inductive Miner), Conformance Checking (token-based replay), Performance Analytics, Automation Opportunities, Predictive Analytics, Digital Twin Simulation, Task Mining, Real-Time Process Monitoring, and Advanced Reporting.
- **Unified Process Analysis Dashboard**: A multi-tab interface consolidating all analysis types (Discovery, Conformance, Performance, Automation, Predictive) with filtering, sharing options, and deep linking.
- **Predictive Analytics Suite**: Integrates Anomaly Detection (five algorithms), Forecasting (hybrid time-series prediction with Holt-Winters, linear regression, moving average, EWMA denoising), and Scenario Analysis (discrete-event simulator for optimistic, expected, pessimistic scenarios).
- **Digital Twin Simulation**: Includes Process Modeling (ReactFlow visualization), What-If Analysis (scenario configuration, real-time simulation), and Impact Simulation (baseline vs. optimized comparison).
- **AI-Powered Features**: AI Process Assistant using configurable LLM providers (Replit AI, OpenAI, Mistral AI, DeepSeek, Groq, Together AI) with encrypted API key storage.
- **Task Mining**: Desktop activity analysis with AI-powered pattern detection and a standalone Electron-based Desktop Capture Agent.
- **Payment Gateway Support**: Production-ready infrastructure with a factory pattern supporting Razorpay, PayU, and Payoneer, including subscription management and webhook verification.
- **Backend**: PostgreSQL database managed via Neon, Drizzle ORM, comprehensive RESTful API, and robust authentication/security (centralized JWT with production enforcement, bcryptjs password hashing, Zod schema validation, user ID-based rate limiting across all endpoints, comprehensive CSRF protection with 100% coverage of state-changing operations, secure cookie configuration with httpOnly/secure/sameSite flags).
- **GDPR Compliance**: Features for data export, right to deletion, and consent management.
- **Desktop Applications**: An installable Electron-based main desktop application for Windows, macOS, and Linux, and a separate Desktop Capture Agent for task mining.
- **Deployment**: Supports containerized deployment using Docker with multi-stage builds and Docker Compose.

## External Dependencies
- **Database**: PostgreSQL (via Neon)
- **ORM**: Drizzle ORM
- **AI Integration**: OpenAI GPT-4.1 (via Replit AI Integrations)
- **UI Libraries**: ReactFlow
- **Desktop Framework**: Electron 28 with Electron Builder