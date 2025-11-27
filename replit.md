# EPI-Q - Enterprise Process Mining SaaS Platform

## Overview
EPI-Q is a multi-tenant SaaS platform transforming raw operational data into actionable insights for enterprises. It provides process transparency, predictive intelligence, real-time monitoring, and continuous improvement through capabilities like process discovery, predictive analytics, digital twin simulation, AI-powered insights, task mining, and advanced reporting. The platform's goal is to enhance business efficiency and intelligence using advanced AI and algorithms, making process mining accessible and delivering rapid insights to evolve processes into living digital twins. EPI-Q aims to be the world's most advanced AI-powered process intelligence platform.

## User Preferences
- Prefers comprehensive documentation with detailed feature descriptions and step-by-step user guides
- Consistent dashboard structure and navigation across all module pages

## System Architecture
EPI-Q is a production-ready enterprise SaaS platform built with Next.js, React, and TypeScript. It features a multi-tenant architecture with strict data isolation and a robust role hierarchy (Super Admin, Admin, Employee).

**UI/UX Design:** The frontend uses Tailwind CSS with shadcn/ui components, `framer-motion` for animations, and a custom brand color palette with dark/light mode support. Interactive process visualizations are powered by ReactFlow. The dashboard design is professional, featuring Inter font, blue accent colors, clean white cards, subtle borders, and a clear layout with breadcrumb navigation. Authenticated pages use a standardized `AppLayout` for consistent navigation and a responsive sidebar.

**Technical Implementations:**
- **Core Process Mining:** Process Discovery (Alpha Miner), Conformance Checking, Performance Analytics, Automation Opportunity Identification, Process Flowchart Visualization.
- **Analytics & Insights:** Anomaly Detection (Z-score), Forecasting (Holt-Winters, Linear Regression, Moving Average), AI-Powered Insights via configurable LLM providers (Replit AI, OpenAI, Mistral AI, DeepSeek, Groq, Together AI).
- **Digital Twin & Simulation:** Basic parameter-based simulation engine, What-If Scenario comparison.
- **Security & Compliance:** HSM-backed KEK/DEK envelope encryption (AWS KMS, GCP KMS, Azure Key Vault, Local), tamper-proof audit logging, JWT authentication, CSRF protection, rate limiting, team-based RBAC, SSO/SAML 2.0, GDPR compliance.
- **Super Admin Portal:** Platform-wide metrics, health monitoring, token-based tenant management with privacy guardrails, audit log review with redaction.
- **Infrastructure:** Multi-tenant architecture with `AsyncLocalStorage`-based tenant context, PostgreSQL with Drizzle ORM, API rate limiting, Zod schema validation.
- **ML Integration:** Pure TypeScript ML algorithms library (`ts-ml-algorithms.ts`) for statistical analysis, anomaly detection, forecasting, and Monte Carlo simulation. ML API endpoints for these functionalities, with a client for automatic fallback to TypeScript algorithms if Python services are unavailable.
- **Desktop:** Electron-based desktop application (packaging needed).

## External Dependencies

**Currently Used:**
- **Database**: PostgreSQL (via Neon)
- **ORM**: Drizzle ORM
- **AI Integration**: OpenAI (via Replit AI Integrations), Mistral AI, DeepSeek, Groq, Together AI
- **UI Libraries**: ReactFlow, shadcn/ui, framer-motion
- **Cloud Key Management**: AWS KMS, Google Cloud KMS, Azure Key Vault

**For Advanced ML Integration (Python - Not Yet Active):**
- FastAPI services leveraging TensorFlow, PyTorch, scikit-learn, Prophet, ARIMA/SARIMA, LSTM Networks, GRU, XGBoost, pyod, stable-baselines3, gymnasium, bayesian-optimization, pm4py, gensim, numpy, pandas, joblib, scipy.

**For Desktop (Not Yet Packaged):**
- Electron 28 with Electron Builder

**Payment Gateways:**
- Razorpay, PayU, Payoneer