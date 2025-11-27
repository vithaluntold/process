# EPI-Q - Enterprise Process Mining SaaS Platform

## Overview
EPI-Q is a multi-tenant SaaS platform designed to transform raw operational data into actionable insights for enterprises. It offers process transparency, predictive intelligence, real-time monitoring, and continuous improvement through capabilities like process discovery, predictive analytics, digital twin simulation, AI-powered insights, task mining, and advanced reporting. The platform's ambition is to enhance business efficiency and intelligence using advanced AI and algorithms, making process mining accessible and delivering rapid insights to evolve processes into living digital twins. EPI-Q aims to be the world's most advanced AI-powered process intelligence platform.

## User Preferences
- Prefers comprehensive documentation with detailed feature descriptions and step-by-step user guides
- Consistent dashboard structure and navigation across all module pages

## Current Implementation Status

### Fully Implemented Features (Production-Ready)

**Process Mining Core:**
- Process Discovery using Alpha Miner algorithm (`server/alpha-miner.ts`)
- Conformance Checking with deviation analysis (`server/conformance-checker.ts`)
- Performance Analytics with KPI tracking (`server/performance-analytics.ts`)
- Automation Opportunity Identification (`components/automation-opportunities.tsx`)
- Process Flowchart Visualization with ReactFlow (`components/process-flowchart.tsx`)

**Analytics & Insights:**
- Anomaly Detection using statistical Z-score analysis (`server/anomaly-detector.ts`)
- Forecasting using Holt-Winters, Linear Regression, Moving Average (`server/forecasting.ts`)
- AI-Powered Insights via configurable LLM providers (`lib/ai.ts`)

**Digital Twin & Simulation:**
- Basic parameter-based simulation engine (`server/simulation-engine.ts`)
- What-If Scenario comparison (`server/scenario-analysis.ts`)

**Security & Compliance:**
- HSM-backed KEK/DEK envelope encryption (AWS KMS, GCP KMS, Azure Key Vault, Local)
- Tamper-proof audit logging with hash chains
- JWT-based authentication with secure cookies
- CSRF protection and rate limiting
- Team-based RBAC with role hierarchy (Super Admin, Admin, Employee)
- SSO/SAML 2.0 authentication
- GDPR compliance (data export, deletion, consent)

**Super Admin Portal:**
- Platform-wide metrics and health monitoring
- Token-based tenant management (privacy-preserving)
- Audit log review with redaction for sensitive resources
- Token rotation for security

**Infrastructure:**
- Multi-tenant architecture with strict data isolation
- PostgreSQL with Drizzle ORM
- API rate limiting per user
- Zod schema validation

### ML Integration (In Progress)

**Completed TypeScript/Frontend:**
- ML API endpoints created (`app/api/ml/anomaly-detection/route.ts`, `app/api/ml/forecast/route.ts`, `app/api/ml/simulation/route.ts`)
- TypeScript ML client for Python services (`lib/ml-client.ts`)
- FastAPI server definition (`server/ml-services/api/main.py`)
- Updated Predictive Analytics dashboard with real anomaly detection and forecasting UI
- Updated Task Mining dashboard with task frequency and automation analysis
- Updated Scenario Analysis page with Monte Carlo simulation and comparison UI

**Frontend Components Updated (No Longer Placeholders):**
- `components/predictive-analytics.tsx` - Full anomaly detection + forecasting UI with algorithm selection
- `components/task-mining-dashboard.tsx` - Task frequency, duration, automation scoring with charts
- `components/scenario-analysis-page.tsx` - Monte Carlo simulation with baseline vs optimized comparison

**Statistical Fallback (Always Available):**
- Z-Score anomaly detection (when Python ML service unavailable)
- Holt-Winters forecasting (statistical time series)
- Basic Monte Carlo simulation (parameter-based)

### Python ML Services (Available for Integration)

Python ML implementations exist in `server/ml-services/` and are ready to connect via FastAPI:

**Anomaly Detection** (`server/ml-services/anomaly-detection/`):
- `lstm_autoencoder_prod.py` - LSTM Autoencoder
- `vae_prod.py` - Variational Autoencoder
- `isolation_forest_prod.py` - Isolation Forest
- `dbscan_prod.py` - DBSCAN Clustering
- `oneclass_svm_prod.py` - One-Class SVM

**Forecasting** (`server/ml-services/forecasting/`):
- `prophet_prod.py` - Facebook Prophet
- `arima_prod.py` - ARIMA/SARIMA
- `lstm_prod.py` - LSTM Networks
- `gru_prod.py` - GRU Networks
- `xgboost_prod.py` - XGBoost
- `hybrid_arima_lstm_prod.py` - Hybrid Models

**Digital Twin RL** (`server/ml-services/digital-twin/`):
- `rl_optimizer.py` - PPO, TD3, Bayesian Optimization
- `monte_carlo_simulator.py` - Monte Carlo Simulation

**Process Discovery** (`server/ml-services/process-discovery/`):
- `object_centric_mining.py` - OCPM
- `trace2vec.py` - Trace2Vec/Activity2Vec

### Remaining ML Integration Work

1. **Deploy Python ML API**: Run FastAPI server on port 8000 for advanced ML algorithms
2. **Install Python ML dependencies**: TensorFlow, PyTorch, scikit-learn, Prophet, etc.
3. **Connect to advanced algorithms**: Route ML client to FastAPI when available

## System Architecture

EPI-Q is a production-ready enterprise SaaS platform built with Next.js, React, and TypeScript. It features a multi-tenant architecture with strict data isolation by `organizationId` and a robust role hierarchy (Super Admin, Admin, Employee).

**UI/UX Design:** The frontend uses Tailwind CSS with shadcn/ui components, `framer-motion` for animations, and a custom brand color palette with dark/light mode support. Interactive process visualizations are powered by ReactFlow. The dashboard design is professional, featuring Inter font, blue accent colors, clean white cards, subtle borders, and a clear layout with breadcrumb navigation. Authenticated pages use a standardized `AppLayout` for consistent navigation and a responsive sidebar.

**Technical Implementations:**
- **Currently Active:** Process Discovery (Alpha Miner), Conformance Checking, Performance Analytics, Automation Opportunities, Basic Digital Twin Simulation, Statistical Anomaly Detection, Holt-Winters Forecasting
- **AI-Powered Features:** AI Process Assistant with configurable LLM providers (Replit AI, OpenAI, Mistral AI, DeepSeek, Groq, Together AI) with encrypted API key storage
- **Security:** JWT authentication, team-based RBAC, Zod validation, SQL injection protection, AES-256-GCM encryption, CSRF protection, rate limiting, HSM-backed key management, envelope encryption, tamper-proof audit logging
- **Tenant Isolation:** `AsyncLocalStorage`-based tenant context enforcing `organizationId` filtering
- **Team Management:** Invite-only employee registration via secure tokens
- **Authentication:** Password reset, SSO/SAML 2.0 with multi-tenant configuration
- **Pricing:** 4-tier model (FREE, ELITE, PRO, ENTERPRISE) with payment gateway support
- **Desktop:** Electron-based desktop application (packaging needed)
- **GDPR:** Data export, deletion, consent management
- **Deployment:** Docker multi-stage builds and Docker Compose

## External Dependencies

**Currently Used:**
- **Database**: PostgreSQL (via Neon)
- **ORM**: Drizzle ORM
- **AI Integration**: OpenAI (via Replit AI Integrations), Mistral AI, DeepSeek, Groq, Together AI
- **UI Libraries**: ReactFlow, shadcn/ui, framer-motion
- **Cloud Key Management**: AWS KMS, Google Cloud KMS, Azure Key Vault

**For ML Integration (Python - Not Yet Active):**
- TensorFlow, PyTorch, scikit-learn, Prophet, statsmodels, pmdarima, xgboost
- pyod, stable-baselines3, gymnasium, bayesian-optimization
- pm4py, gensim, numpy, pandas, joblib, scipy

**For Desktop (Not Yet Packaged):**
- Electron 28 with Electron Builder

**Payment Gateways:**
- Razorpay, PayU, Payoneer

## Enterprise Security Architecture

### KEK/DEK Envelope Encryption
**Location:** `lib/security/envelope-encryption.ts`

**Supported Providers:**
- **AWS KMS** - Full HSM-backed key management
- **Google Cloud KMS** - Enterprise cloud key management
- **Azure Key Vault** - Microsoft's enterprise key management with HSM support
- **Local** - Development fallback with AES-256-GCM

### Environment Variables for Security

```bash
# KMS Provider (aws, gcp, azure, or local)
KMS_PROVIDER=local

# AWS KMS
AWS_REGION=us-east-1
AWS_KMS_KEY_ID=arn:aws:kms:...
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key

# Google Cloud KMS
GCP_PROJECT_ID=your-project
GCP_KMS_LOCATION=global
GCP_KMS_KEYRING=your-keyring
GCP_KMS_KEY=your-key
GOOGLE_APPLICATION_CREDENTIALS=/path/to/credentials.json

# Azure Key Vault
AZURE_KEYVAULT_URL=https://your-vault.vault.azure.net
AZURE_KEY_NAME=your-key-name
AZURE_TENANT_ID=your-tenant-id
AZURE_CLIENT_ID=your-client-id
AZURE_CLIENT_SECRET=your-client-secret

# Local Development
MASTER_ENCRYPTION_KEY=your-32-byte-hex-key
```

### Security API Endpoints
- `GET /api/security/encryption/status` - View encryption configuration
- `POST /api/security/encryption/status` - Test encryption/decryption
- `GET /api/security/audit` - Retrieve tamper-proof audit logs
- `POST /api/security/audit` - Create audit log entry

## Super Admin Portal

### Overview
The Super Admin Portal (`/super-admin`) provides platform-wide administrative capabilities with strict privacy guardrails. Super Admins can manage the entire platform without accessing client data or private information.

**Location:** `app/super-admin/page.tsx`

### Features
- **Platform Overview**: Aggregate metrics (organizations, users, processes, API calls)
- **Tenant Management**: Suspend/activate organizations without data access
- **System Health**: Database, encryption, API, memory, and CPU monitoring
- **Security Controls**: View security status and configuration
- **Audit Logs**: Platform-level audit trail (excludes client data access logs)
- **Settings**: Platform-wide configuration options

### Privacy Guardrails
The Super Admin Portal implements comprehensive privacy guardrails to ensure no client data exposure:

**Token-Based Tenant Management:**
- Organizations are identified by non-reversible UUID tokens (adminToken field)
- Tokens are randomly generated using crypto.randomUUID() and cannot be used to derive organization identity
- Super Admins never see numeric organization IDs or organization names

**Data Protection:**
- NO access to client process data, event logs, or documents
- NO access to user personal information or passwords
- NO access to organization-specific content (names, domains, settings)
- Aggregate metrics only (counts by status, not individual details)

**Audit Log Privacy:**
- resourceId is nulled for sensitive resources (organization, tenant, user, team)
- IP addresses are partially masked (only first two octets visible)
- Action filtering excludes data access entries

**Token Rotation:**
- POST /api/super-admin/organizations with action="rotate_token" to invalidate compromised tokens
- New token automatically generated and returned

### Super Admin API Endpoints
- `GET /api/super-admin/organizations?mode=management` - List tenants by token + status only
- `GET /api/super-admin/organizations?mode=aggregate` - Aggregate statistics (counts only)
- `POST /api/super-admin/organizations` - Token rotation and administrative actions
- `POST /api/super-admin/organizations/:token/suspend` - Suspend a tenant (token-based)
- `POST /api/super-admin/organizations/:token/activate` - Activate a tenant (token-based)
- `GET /api/super-admin/health` - System health metrics
- `GET /api/super-admin/metrics` - Platform-wide aggregate metrics
- `GET /api/super-admin/audit-logs` - Platform audit logs (filtered)
- `GET /api/super-admin/security-events` - Security-related events

## Compliance Documentation

### Location
All compliance documentation is in `docs/compliance/`:
- `MARKET_READINESS_GAPS.md` - Gap analysis and remediation roadmap
- `HIPAA_CONTROL_MATRIX.md` - HIPAA Security Rule control mapping (84% compliant)
- `SOX_CONTROL_MATRIX.md` - SOX ITGC control mapping (87.5% compliant)

### Operations Documentation
- `docs/operations/INCIDENT_RESPONSE_SOP.md` - Incident response procedures

### Market Readiness Score
- Current: 55%
- Target: 85%+
- Key gaps: Python-TypeScript ML integration, automated testing, desktop agent packaging

## Implementation Roadmap

### Phase 1: Core ML Integration (Priority)
1. Create FastAPI server for Python ML services
2. Build TypeScript client for ML API calls
3. Integrate anomaly detection (LSTM-AE, Isolation Forest)
4. Integrate forecasting (Prophet, ARIMA)

### Phase 2: Advanced Features
1. Task Mining with desktop capture agent
2. Digital Twin with RL optimization (PPO, TD3)
3. Advanced process discovery (Inductive Miner, OCPM)

### Phase 3: Production Hardening
1. Automated testing (unit, integration, E2E)
2. CI/CD pipeline
3. Performance benchmarks
4. Desktop app packaging
