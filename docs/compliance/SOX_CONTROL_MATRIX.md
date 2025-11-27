# EPI-Q SOX Compliance Control Matrix

**Document Version:** 1.0  
**Last Updated:** November 27, 2025  
**Applicable Standard:** Sarbanes-Oxley Act Section 404

---

## IT General Controls (ITGC)

### 1. Access to Programs and Data

| Control ID | Control Objective | Implementation | Status |
|------------|------------------|----------------|--------|
| AC-01 | User Authentication | JWT-based authentication with bcrypt password hashing | ✅ Implemented |
| AC-02 | Role-Based Access Control | Three-tier role hierarchy (Super Admin, Admin, Employee) | ✅ Implemented |
| AC-03 | Segregation of Duties | Role-specific permissions with tenant isolation | ✅ Implemented |
| AC-04 | Privileged Access Management | Super Admin controls with audit logging | ✅ Implemented |
| AC-05 | User Provisioning | Invite-only registration with admin approval | ✅ Implemented |
| AC-06 | User Deprovisioning | User suspension and deletion capabilities | ✅ Implemented |
| AC-07 | Password Policies | Secure password requirements with bcrypt hashing | ✅ Implemented |
| AC-08 | Session Management | JWT expiration with secure cookie configuration | ✅ Implemented |
| AC-09 | Multi-Factor Authentication | SSO/SAML integration with IdP MFA support | ✅ Implemented |
| AC-10 | Access Reviews | Audit log review capabilities | ✅ Implemented |

### 2. Program Changes

| Control ID | Control Objective | Implementation | Status |
|------------|------------------|----------------|--------|
| CM-01 | Change Authorization | Git-based version control | ✅ Implemented |
| CM-02 | Change Testing | Manual testing procedures | ⚠️ Enhancement Needed |
| CM-03 | Change Approval | Pull request workflow | ✅ Implemented |
| CM-04 | Change Documentation | Git commit history and changelog | ✅ Implemented |
| CM-05 | Emergency Changes | Documented emergency procedures | ⚠️ Policy Needed |
| CM-06 | Release Management | Docker-based deployment pipeline | ✅ Implemented |
| CM-07 | Configuration Management | Environment variable management | ✅ Implemented |
| CM-08 | Segregation of Development | Separate development and production environments | ✅ Implemented |

### 3. Computer Operations

| Control ID | Control Objective | Implementation | Status |
|------------|------------------|----------------|--------|
| CO-01 | Job Scheduling | Railway/Replit managed infrastructure | ✅ Implemented |
| CO-02 | Problem Management | Error logging and monitoring | ✅ Implemented |
| CO-03 | Incident Management | Incident response procedures | ⚠️ Policy Needed |
| CO-04 | Backup and Recovery | Database backup via cloud provider | ✅ Implemented |
| CO-05 | Disaster Recovery | DR procedures documentation | ⚠️ Documentation Needed |
| CO-06 | System Monitoring | Application logging | ✅ Implemented |
| CO-07 | Capacity Planning | Cloud auto-scaling capabilities | ✅ Implemented |

### 4. Program Development

| Control ID | Control Objective | Implementation | Status |
|------------|------------------|----------------|--------|
| PD-01 | Development Standards | TypeScript with strict typing | ✅ Implemented |
| PD-02 | Code Review | Pull request review process | ✅ Implemented |
| PD-03 | Security Testing | Zod input validation | ✅ Implemented |
| PD-04 | Documentation | Technical documentation in /docs | ✅ Implemented |
| PD-05 | Testing Procedures | Manual testing procedures | ⚠️ Enhancement Needed |

---

## Application Controls

### Financial Data Integrity

| Control ID | Control Objective | Implementation | Status |
|------------|------------------|----------------|--------|
| FI-01 | Data Validation | Zod schema validation on all inputs | ✅ Implemented |
| FI-02 | Calculation Accuracy | TypeScript type-safe calculations | ✅ Implemented |
| FI-03 | Audit Trail | Tamper-proof audit logging with hash chain | ✅ Implemented |
| FI-04 | Data Encryption | AES-256-GCM encryption at rest | ✅ Implemented |
| FI-05 | Transmission Security | TLS 1.3 encryption in transit | ✅ Implemented |
| FI-06 | Segregation of Financial Data | Multi-tenant isolation by organizationId | ✅ Implemented |

### Report Generation Controls

| Control ID | Control Objective | Implementation | Status |
|------------|------------------|----------------|--------|
| RG-01 | Report Access Control | Role-based report access | ✅ Implemented |
| RG-02 | Report Audit Trail | Report generation logged in audit trail | ✅ Implemented |
| RG-03 | Report Integrity | Hash verification for exported reports | ✅ Implemented |
| RG-04 | Report Distribution | Secure download with authentication | ✅ Implemented |

---

## Evidence Collection Requirements

### Quarterly Evidence

| Evidence Type | Source | Collection Method | Status |
|---------------|--------|-------------------|--------|
| Access Reviews | User management API | Automated export | ⚠️ Script Needed |
| Change Logs | Git history | Git log export | ✅ Available |
| System Availability | Cloud provider | Uptime reports | ✅ Available |
| Backup Verification | Database provider | Backup logs | ✅ Available |
| Security Events | Audit logs | Audit log export | ✅ Available |

### Annual Evidence

| Evidence Type | Source | Collection Method | Status |
|---------------|--------|-------------------|--------|
| Penetration Test | External auditor | Third-party report | ⚠️ Assessment Needed |
| Risk Assessment | Internal review | Risk assessment document | ⚠️ Document Needed |
| DR Test Results | DR test | Test documentation | ⚠️ Test Needed |
| User Access Recertification | Admin review | Certification report | ⚠️ Process Needed |

---

## Control Deficiency Analysis

### Material Weaknesses
*None identified*

### Significant Deficiencies
| ID | Deficiency | Risk | Remediation |
|----|------------|------|-------------|
| SD-01 | Automated testing coverage | Code quality risk | Implement CI/CD with automated tests |
| SD-02 | Formal change approval process | Unauthorized change risk | Document change approval workflow |

### Control Gaps
| ID | Gap | Priority | Remediation |
|----|-----|----------|-------------|
| CG-01 | Emergency change procedures | Medium | Document emergency change process |
| CG-02 | Incident response plan | High | Create incident response SOP |
| CG-03 | DR testing schedule | Medium | Establish annual DR test schedule |
| CG-04 | Annual access recertification | Medium | Create recertification process |

---

## Summary

| Control Category | Total | Implemented | Needs Enhancement | Gap |
|-----------------|-------|-------------|-------------------|-----|
| Access Controls | 10 | 10 | 0 | 0 |
| Change Management | 8 | 6 | 1 | 1 |
| Computer Operations | 7 | 5 | 0 | 2 |
| Program Development | 5 | 4 | 1 | 0 |
| Financial Integrity | 6 | 6 | 0 | 0 |
| Report Generation | 4 | 4 | 0 | 0 |
| **Total** | **40** | **35** | **2** | **3** |

**Compliance Percentage:** 87.5%

---

## Remediation Timeline

### Immediate (Week 1-2)
1. Document emergency change procedures
2. Create incident response SOP

### Short-term (Week 3-4)
1. Implement CI/CD pipeline with automated tests
2. Document DR testing schedule

### Medium-term (Month 2-3)
1. Conduct first DR test
2. Establish access recertification process
3. Commission penetration test

---

*This document is for internal compliance tracking. Consult auditors for formal SOX certification.*
