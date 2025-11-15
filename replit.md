# EPI-Q - Enterprise Process Mining SaaS Platform

## Overview
EPI-Q is a next-generation enterprise-grade multi-tenant SaaS process intelligence platform. Its core purpose is to transform raw operational data into actionable insights, providing organizations with transparency, predictive intelligence, real-time monitoring, and continuous improvement. The platform aims to make process mining accessible, deliver rapid insights, and evolve processes into living digital twins through capabilities like process discovery, predictive analytics, digital twin simulation, real-time monitoring, AI-powered insights, task mining, and advanced reporting. EPI-Q strives to enhance business efficiency and intelligence using AI and advanced algorithms.

## User Preferences
- Prefers comprehensive documentation with detailed feature descriptions and step-by-step user guides
- Consistent dashboard structure and navigation across all module pages

## System Architecture
EPI-Q is a production-ready enterprise SaaS platform built with Next.js, React, and TypeScript. It utilizes a multi-tenant architecture with strict data isolation by `organizationId` and a robust role hierarchy (Super Admin, Admin, Employee). Security features include JWT-based authentication, team-based RBAC, Zod schema validation, SQL injection protection via Drizzle ORM, AES-256-GCM encrypted API keys, comprehensive CSRF protection, and distributed rate limiting.

**Tenant Isolation & Data Security:**
The platform implements enterprise-grade tenant isolation using an `AsyncLocalStorage`-based tenant context system that automatically tracks `organizationId`, `userId`, and `role`. All database queries are automatically filtered by `organizationId`, and API endpoints are wrapped with higher-order functions to enforce tenant context and role-based access, ensuring a zero-trust architecture. A versioned API (`/api/v1/*`) facilitates backward-compatible migration.

**Team Hierarchy & RBAC:**
Comprehensive team-based access control includes a team management system with dedicated team managers, invite-only employee registration via secure tokens, team-level process ownership, and role-based permissions (Team Manager, Team Member). RBAC is enforced at the API level.

**UI/UX Design:**
The frontend uses Tailwind CSS with shadcn/ui components, `framer-motion` for animations, and a custom brand color palette, supporting dark/light modes and responsiveness. Interactive process visualizations are powered by ReactFlow. The dashboard design is inspired by Celonis.cloud, featuring a professional aesthetic with Inter font, blue accent colors, clean white cards, subtle borders, and a clear layout with breadcrumb navigation and tab-based organization.

**Navigation Architecture:**
All authenticated dashboard pages use a standardized `AppLayout` component for consistent navigation, offering a unified header, responsive sidebar with role-based filtering, and mobile-friendly sheet navigation. Public pages like Login and the Landing Page have distinct architectures, with the Landing Page utilizing a hybrid SSR/CSR approach to prevent hydration mismatches and ensure SEO.

**Technical Implementations & Feature Specifications:**
- **Password Reset System:** An enterprise-grade password reset system with database-stored, cryptographically secure, one-time use, time-limited tokens. Features include rate limiting, full CSRF protection, audit logging, bcryptjs password hashing, and Zod validation.
- **Multi-Tenant UI Pages:** Key production-ready pages include Organizations Dashboard (Super Admin only), Support Tickets, Subscription Management, and a public Pricing Page.
- **Team Management:** Full team hierarchy, member management, and invite-only employee registration with secure token-based invitations.
- **Pricing & Subscription:** A 4-tier enterprise SaaS pricing model (FREE, ELITE, PRO, ENTERPRISE) with integrated payment gateway support (Razorpay, PayU, Payoneer).
- **Core Features:** Includes Process Discovery (Alpha Miner, Inductive Miner), Conformance Checking, Performance Analytics, Automation Opportunities, Predictive Analytics, Digital Twin Simulation, Task Mining, Real-Time Process Monitoring, and Advanced Reporting, consolidated into a Unified Process Analysis Dashboard.
- **Predictive Analytics Suite:** Integrates Anomaly Detection (five algorithms), Forecasting (hybrid time-series prediction), and Scenario Analysis (discrete-event simulation).
- **Digital Twin Simulation:** Features Process Modeling (ReactFlow), What-If Analysis, and Impact Simulation.
- **AI-Powered Features:** An AI Process Assistant leveraging configurable LLM providers (Replit AI, OpenAI, Mistral AI, DeepSeek, Groq, Together AI) with encrypted API key storage.
- **Task Mining:** Desktop activity analysis with AI-powered pattern detection, supported by an Electron-based Desktop Capture Agent.
- **SSO/SAML Authentication:** Enterprise-grade Single Sign-On using SAML 2.0 with multi-tenant configuration, auto-provisioning, 4-field encryption architecture, security features (replay attack prevention, signature verification), and support for major IdPs.
- **Backend:** PostgreSQL database (Neon), Drizzle ORM, comprehensive RESTful API, robust authentication, bcryptjs password hashing, Zod schema validation, user ID-based rate limiting, and secure cookie configuration.
- **GDPR Compliance:** Features for data export, right to deletion, and consent management.
- **Desktop Applications:** An installable Electron-based main desktop application and a separate Desktop Capture Agent for task mining.
- **Deployment:** Supports containerized deployment using Docker with multi-stage builds and Docker Compose.

## Test Credentials for Development
For testing the authentication system, use these credentials on the landing page:

**Test Account:**
- **Email:** test@epiq.com
- **Password:** Test@123
- **Role:** admin
- **Organization ID:** 2

**Authentication Features:**
- **Login:** Users can log in using email and password. JWT session tokens are stored in HTTP-only cookies.
- **Signup:** New users automatically get a new organization created and are assigned as admin role. Each signup creates an isolated tenant environment.
- **Password Reset:** Available at `/auth/forgot-password` with enterprise-grade token-based reset flow.
- **SSO/SAML:** Enterprise Single Sign-On available for organizations with SAML 2.0 configuration.

## External Dependencies
- **Database**: PostgreSQL (via Neon)
- **ORM**: Drizzle ORM
- **AI Integration**: OpenAI GPT-4.1 (via Replit AI Integrations)
- **UI Libraries**: ReactFlow
- **Desktop Framework**: Electron 28 with Electron Builder