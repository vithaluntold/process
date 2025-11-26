# EPI-Q - Enterprise Process Mining SaaS Platform

## Overview
EPI-Q is a multi-tenant SaaS platform designed to transform raw operational data into actionable insights for enterprises. It offers process transparency, predictive intelligence, real-time monitoring, and continuous improvement through capabilities like process discovery, predictive analytics, digital twin simulation, AI-powered insights, task mining, and advanced reporting. The platform's ambition is to enhance business efficiency and intelligence using advanced AI and algorithms, making process mining accessible and delivering rapid insights to evolve processes into living digital twins. EPI-Q aims to be the world's most advanced AI-powered process intelligence platform.

## User Preferences
- Prefers comprehensive documentation with detailed feature descriptions and step-by-step user guides
- Consistent dashboard structure and navigation across all module pages

## System Architecture
EPI-Q is a production-ready enterprise SaaS platform built with Next.js, React, and TypeScript. It features a multi-tenant architecture with strict data isolation by `organizationId` and a robust role hierarchy (Super Admin, Admin, Employee).

**UI/UX Design:** The frontend uses Tailwind CSS with shadcn/ui components, `framer-motion` for animations, and a custom brand color palette with dark/light mode support. Interactive process visualizations are powered by ReactFlow. The dashboard design is professional, featuring Inter font, blue accent colors, clean white cards, subtle borders, and a clear layout with breadcrumb navigation. Authenticated pages use a standardized `AppLayout` for consistent navigation and a responsive sidebar.

**Technical Implementations & Feature Specifications:**
- **Core Features:** Process Discovery (Alpha Miner, Inductive Miner, OCPM, Trace2Vec, Activity2Vec), Conformance Checking, Performance Analytics, Automation Opportunities, Predictive Analytics (Anomaly Detection, Forecasting, Scenario Analysis), Digital Twin Simulation (PPO, TD3, Bayesian Optimization, Monte Carlo, Self-Evolving Digital Twin), Task Mining, Real-Time Process Monitoring, and Advanced Reporting. These are consolidated into a Unified Process Analysis Dashboard.
- **AI-Powered Features:** An AI Process Assistant leveraging configurable LLM providers (Replit AI, OpenAI, Mistral AI, DeepSeek, Groq, Together AI) with encrypted API key storage.
- **Security:** JWT-based authentication, team-based RBAC, Zod schema validation, SQL injection protection via Drizzle ORM, AES-256-GCM encrypted API keys, comprehensive CSRF protection, and distributed rate limiting. Enterprise-grade security includes HSM-backed key management, envelope encryption, and tamper-proof audit logging.
- **Tenant Isolation:** `AsyncLocalStorage`-based tenant context system enforcing `organizationId` filtering on all database queries and API endpoints.
- **Team Management:** Comprehensive team-based access control with invite-only employee registration via secure tokens and role-based permissions.
- **Authentication:** Enterprise-grade password reset system, and SSO/SAML authentication (SAML 2.0 with multi-tenant configuration, auto-provisioning, and 4-field encryption).
- **Pricing & Subscription:** A 4-tier enterprise SaaS pricing model (FREE, ELITE, PRO, ENTERPRISE) with integrated payment gateway support.
- **Desktop Applications:** An installable Electron-based main desktop application and a separate Desktop Capture Agent for task mining.
- **GDPR Compliance:** Features for data export, right to deletion, and consent management.
- **Deployment:** Supports containerized deployment using Docker with multi-stage builds and Docker Compose.
- **Backend:** PostgreSQL database, Drizzle ORM, comprehensive RESTful API, bcryptjs password hashing, Zod schema validation, user ID-based rate limiting, and secure cookie configuration.
- **Advanced Analytics:** Over 28 ML algorithms implemented across anomaly detection (LSTM-AE, VAE, Isolation Forest, DBSCAN, One-Class SVM), forecasting (LSTM, GRU, ARIMA, Prophet, XGBoost, hybrid models), and reinforcement learning for digital twins (PPO, TD3, Bayesian Optimization).

## External Dependencies
- **Database**: PostgreSQL (via Neon)
- **ORM**: Drizzle ORM
- **AI Integration**: OpenAI (via Replit AI Integrations), Mistral AI, DeepSeek, Groq, Together AI
- **UI Libraries**: ReactFlow, shadcn/ui, framer-motion
- **Desktop Framework**: Electron 28 with Electron Builder
- **Payment Gateways**: Razorpay, PayU, Payoneer
- **Python ML Backend Libraries**: TensorFlow, PyTorch, scikit-learn, Prophet, statsmodels, pmdarima, xgboost, pyod, stable-baselines3, gymnasium, bayesian-optimization, pm4py, gensim, numpy, pandas, joblib, scipy
- **Cloud Key Management (Optional for Enterprise Security)**: AWS KMS, Google Cloud KMS