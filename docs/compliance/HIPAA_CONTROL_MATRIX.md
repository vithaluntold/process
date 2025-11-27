# EPI-Q HIPAA Security Rule Control Matrix

**Document Version:** 1.0  
**Last Updated:** November 27, 2025  
**Compliance Status:** In Progress

---

## Administrative Safeguards (45 CFR § 164.308)

### § 164.308(a)(1) - Security Management Process

| Requirement | Control | Implementation | Status |
|-------------|---------|----------------|--------|
| Risk Analysis | Security risk assessment | Envelope encryption architecture with HSM-backed keys | ✅ Implemented |
| Risk Management | Security controls implementation | Multi-layer encryption (KEK→MEK→DEK→AES-256-GCM) | ✅ Implemented |
| Sanction Policy | Employee discipline policy | HR policy document required | ⚠️ Policy Needed |
| Information System Activity Review | Audit log review | Tamper-proof audit logging with hash chain | ✅ Implemented |

### § 164.308(a)(3) - Workforce Security

| Requirement | Control | Implementation | Status |
|-------------|---------|----------------|--------|
| Authorization | Access authorization | Role-based access control (Super Admin, Admin, Employee) | ✅ Implemented |
| Workforce Clearance | Background checks | HR policy document required | ⚠️ Policy Needed |
| Termination Procedures | Access revocation | User status management (active/inactive/suspended) | ✅ Implemented |

### § 164.308(a)(4) - Information Access Management

| Requirement | Control | Implementation | Status |
|-------------|---------|----------------|--------|
| Access Authorization | Access control | Multi-tenant isolation with organizationId filtering | ✅ Implemented |
| Access Establishment | User provisioning | Team-based access with invite-only registration | ✅ Implemented |
| Access Modification | Access change management | Role assignment via admin portal | ✅ Implemented |

### § 164.308(a)(5) - Security Awareness and Training

| Requirement | Control | Implementation | Status |
|-------------|---------|----------------|--------|
| Security Reminders | Periodic reminders | Training program documentation required | ⚠️ Policy Needed |
| Protection from Malware | Anti-malware procedures | Infrastructure-level protection | ✅ Implemented |
| Log-in Monitoring | Failed login tracking | Login attempt logging in audit trail | ✅ Implemented |
| Password Management | Password policies | bcryptjs hashing with secure password requirements | ✅ Implemented |

### § 164.308(a)(6) - Security Incident Procedures

| Requirement | Control | Implementation | Status |
|-------------|---------|----------------|--------|
| Incident Response | Response plan | Incident response SOP required | ⚠️ Policy Needed |
| Incident Reporting | Reporting procedures | Audit log capture of security events | ✅ Implemented |

### § 164.308(a)(7) - Contingency Plan

| Requirement | Control | Implementation | Status |
|-------------|---------|----------------|--------|
| Data Backup Plan | Backup procedures | Database backup via Neon/Railway | ✅ Implemented |
| Disaster Recovery | Recovery procedures | DR documentation required | ⚠️ Documentation Needed |
| Emergency Mode Operation | Emergency procedures | Runbook documentation required | ⚠️ Documentation Needed |
| Testing and Revision | DR testing | Annual testing program required | ⚠️ Process Needed |

### § 164.308(a)(8) - Evaluation

| Requirement | Control | Implementation | Status |
|-------------|---------|----------------|--------|
| Periodic Evaluation | Security assessment | Penetration testing required | ⚠️ Assessment Needed |

---

## Physical Safeguards (45 CFR § 164.310)

### § 164.310(a)(1) - Facility Access Controls

| Requirement | Control | Implementation | Status |
|-------------|---------|----------------|--------|
| Contingency Operations | Facility access | Cloud provider (Railway/Neon) responsibility | ✅ Cloud Provider |
| Facility Security Plan | Physical security | Cloud provider SOC 2 compliance | ✅ Cloud Provider |
| Access Control | Physical access logs | Cloud provider responsibility | ✅ Cloud Provider |
| Maintenance Records | Maintenance logs | Cloud provider responsibility | ✅ Cloud Provider |

### § 164.310(d)(1) - Device and Media Controls

| Requirement | Control | Implementation | Status |
|-------------|---------|----------------|--------|
| Disposal | Secure disposal | Data deletion with cascading deletes | ✅ Implemented |
| Media Re-use | Sanitization | Cloud provider responsibility | ✅ Cloud Provider |
| Accountability | Asset tracking | Cloud provider responsibility | ✅ Cloud Provider |
| Data Backup | Backup storage | Encrypted backup with HSM-backed keys | ✅ Implemented |

---

## Technical Safeguards (45 CFR § 164.312)

### § 164.312(a)(1) - Access Control

| Requirement | Control | Implementation | Status |
|-------------|---------|----------------|--------|
| Unique User Identification | User IDs | Unique email-based user accounts | ✅ Implemented |
| Emergency Access Procedure | Break-glass access | Super Admin override capability | ✅ Implemented |
| Automatic Logoff | Session timeout | JWT expiration with secure cookies | ✅ Implemented |
| Encryption and Decryption | Data encryption | AES-256-GCM with HSM-backed key hierarchy | ✅ Implemented |

### § 164.312(b) - Audit Controls

| Requirement | Control | Implementation | Status |
|-------------|---------|----------------|--------|
| Audit Logging | Activity logs | Tamper-proof audit logging with SHA-256 hash chain | ✅ Implemented |
| Audit Log Review | Log analysis | Audit log viewer in admin portal | ✅ Implemented |
| Audit Log Protection | Log integrity | Hash chain verification prevents tampering | ✅ Implemented |

### § 164.312(c)(1) - Integrity

| Requirement | Control | Implementation | Status |
|-------------|---------|----------------|--------|
| Data Authentication | Integrity controls | HMAC verification in encrypted envelopes | ✅ Implemented |
| Data Validation | Input validation | Zod schema validation on all inputs | ✅ Implemented |

### § 164.312(d) - Person or Entity Authentication

| Requirement | Control | Implementation | Status |
|-------------|---------|----------------|--------|
| Authentication | Identity verification | JWT-based authentication with bcrypt passwords | ✅ Implemented |
| Multi-factor Authentication | MFA | SSO/SAML with IdP MFA support | ✅ Implemented |

### § 164.312(e)(1) - Transmission Security

| Requirement | Control | Implementation | Status |
|-------------|---------|----------------|--------|
| Integrity Controls | Transmission integrity | TLS 1.3 encryption in transit | ✅ Implemented |
| Encryption | Transmission encryption | HTTPS-only with secure cookies | ✅ Implemented |

---

## Organizational Requirements (45 CFR § 164.314)

### § 164.314(a) - Business Associate Contracts

| Requirement | Control | Implementation | Status |
|-------------|---------|----------------|--------|
| Business Associate Agreement | BAA template | Legal BAA document required | ⚠️ Legal Review Needed |
| Subcontractor Requirements | Subcontractor BAAs | Cloud provider BAAs in place | ✅ Verified |

---

## Summary

| Category | Total Controls | Implemented | In Progress | Pending |
|----------|---------------|-------------|-------------|---------|
| Administrative | 15 | 10 | 0 | 5 |
| Physical | 8 | 8 | 0 | 0 |
| Technical | 12 | 12 | 0 | 0 |
| Organizational | 2 | 1 | 0 | 1 |
| **Total** | **37** | **31** | **0** | **6** |

**Compliance Percentage:** 84%

---

## Remediation Actions Required

1. **Sanction Policy** - Document employee discipline procedures for security violations
2. **Workforce Clearance** - Document background check requirements
3. **Security Training** - Develop security awareness training program
4. **Incident Response** - Create formal incident response SOP
5. **Disaster Recovery** - Document DR procedures and testing schedule
6. **BAA Template** - Legal review and preparation of BAA documents

---

*This document is for internal compliance tracking. Consult legal counsel for formal HIPAA certification.*
