# EPI-Q - Enterprise Process Mining SaaS Platform

## Overview
EPI-Q is a multi-tenant SaaS platform designed to transform raw operational data into actionable insights for enterprises. It offers process transparency, predictive intelligence, real-time monitoring, and continuous improvement. Key capabilities include process discovery, predictive analytics, digital twin simulation, AI-powered insights, task mining, and advanced reporting. The platform's core purpose is to enhance business efficiency and intelligence by making process mining accessible and delivering rapid insights, aiming to evolve processes into living digital twins. EPI-Q aspires to be the world's most advanced AI-powered process intelligence platform.

## User Preferences
- Prefers comprehensive documentation with detailed feature descriptions and step-by-step user guides
- Consistent dashboard structure and navigation across all module pages

## System Architecture
EPI-Q is built with Next.js, React, and TypeScript, featuring a multi-tenant architecture with strict data isolation and a robust role hierarchy (Super Admin, Admin, Employee).

**UI/UX Design:** The frontend utilizes Tailwind CSS with shadcn/ui components, `framer-motion` for animations, and supports dark/light modes with a custom brand color palette. Interactive process visualizations are powered by ReactFlow. The dashboard maintains a professional aesthetic with the Inter font, blue accents, clean white cards, subtle borders, and clear layouts with breadcrumb navigation. Authenticated pages use a standardized `AppLayout` for consistent navigation and responsive sidebars.

**Technical Implementations & Feature Specifications:**
- **Core Process Mining:** Includes Process Discovery (Alpha Miner), Conformance Checking, Performance Analytics, Automation Opportunities, and Process Flowchart Visualization.
- **ML & Analytics:** Features statistical analysis, anomaly detection (Z-Score, Modified Z-Score, IQR, Isolation Score), forecasting (Simple Exponential Smoothing, Holt-Winters, Linear Regression, Moving Average), Monte Carlo Simulation, and AI-powered insights.
- **Digital Twin & Simulation:** Supports parameter-based simulation, what-if scenario comparison, Monte Carlo probabilistic simulation, and scenario analysis dashboards.
- **Security & Compliance:** Implements HSM-backed envelope encryption (AWS KMS, Google Cloud KMS, Azure Key Vault integration), tamper-proof audit logging, JWT authentication, CSRF protection, rate limiting, team-based RBAC, and SSO/SAML 2.0. Compliant with HIPAA, SOX, and PCI-DSS.
- **Super Admin Portal:** Provides platform metrics, health monitoring, token-based tenant management, privacy guardrails, and audit log review.
- **Task Mining:** Offers task pattern analysis, frequency & duration analytics, and automation scoring.
- **Predictive Analytics:** Features anomaly detection and forecasting dashboards with interactive charts.
- **Enterprise Connectors:** A robust framework supports connectors for Salesforce, ServiceNow, and SAP OData, including OAuth 2.0 with CSRF protection, token envelope encryption, and health monitoring. The SAP OData connector supports dynamic service path resolution, OData v2/v4, and multi-tenant scoping.

**System Design Choices:**
- **Logging:** Utilizes Pino for structured, high-performance JSON logging, with features like request tracing, HTTP logging, security event logging, ML operation logging, DB query logging, and sensitive data redaction.
- **Error Tracking:** Implements a React error boundary for automatic error reporting.
- **Optional Python ML Enhancement:** Designed to integrate with external Python FastAPI services for advanced ML algorithms (e.g., Prophet, ARIMA, LSTM for forecasting; LSTM Autoencoder, VAE for anomaly detection).

## External Dependencies

- **Database**: PostgreSQL (via Neon)
- **ORM**: Drizzle ORM
- **AI Integration**: OpenAI (via Replit AI Integrations), Mistral AI, DeepSeek, Groq, Together AI
- **UI Libraries**: ReactFlow, shadcn/ui, framer-motion
- **Cloud Key Management**: AWS KMS, Google Cloud KMS, Azure Key Vault
- **Payment Gateways**: Razorpay, PayU, Payoneer