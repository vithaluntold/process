# EPI-Q Incident Response Standard Operating Procedure

**Document Version:** 1.0  
**Effective Date:** November 27, 2025  
**Document Owner:** Security Team

---

## 1. Purpose

This document establishes the incident response procedures for EPI-Q platform security incidents, ensuring rapid detection, containment, and recovery while maintaining regulatory compliance.

---

## 2. Scope

This SOP applies to all security incidents affecting:
- EPI-Q production and staging environments
- Customer data and tenant environments
- Infrastructure components (Railway, Neon, cloud services)
- Internal systems and employee accounts

---

## 3. Incident Classification

### Severity Levels

| Level | Description | Response Time | Examples |
|-------|-------------|---------------|----------|
| P1 - Critical | Complete system outage or data breach | 15 minutes | Active data breach, ransomware, complete service outage |
| P2 - High | Significant degradation or security threat | 1 hour | Partial outage, failed authentication, suspicious access patterns |
| P3 - Medium | Limited impact or potential threat | 4 hours | Single feature failure, minor security alert, failed deployment |
| P4 - Low | Minimal impact | 24 hours | Cosmetic issues, minor configuration drift |

### Incident Categories

| Category | Description | Examples |
|----------|-------------|----------|
| Security Breach | Unauthorized data access | Data exfiltration, credential compromise |
| Availability | Service outage or degradation | Database failure, API unresponsive |
| Integrity | Data corruption or manipulation | Database corruption, unauthorized modification |
| Compliance | Regulatory violation | HIPAA/SOX violation, audit finding |

---

## 4. Incident Response Phases

### Phase 1: Detection and Reporting

**Detection Sources:**
- Automated monitoring alerts
- Customer support tickets
- Security audit log alerts
- Cloud provider notifications
- Employee reports

**Reporting:**
1. Log incident in incident tracking system
2. Assign initial severity classification
3. Notify incident response team
4. Preserve initial evidence (screenshots, logs, timestamps)

### Phase 2: Assessment and Triage

**Assessment Checklist:**
- [ ] Identify affected systems and services
- [ ] Determine scope of impact (users, tenants, data)
- [ ] Assess data breach potential
- [ ] Identify attack vector (if security incident)
- [ ] Determine business impact
- [ ] Refine severity classification

**Escalation Matrix:**

| Severity | Primary Responder | Escalation | Executive Notification |
|----------|------------------|------------|----------------------|
| P1 | On-call Engineer | Immediate to Security Lead | CTO within 15 min |
| P2 | On-call Engineer | Security Lead within 30 min | CTO within 2 hours |
| P3 | Support Engineer | Security Lead within 4 hours | Weekly report |
| P4 | Support Engineer | As needed | Monthly report |

### Phase 3: Containment

**Immediate Actions:**

For Security Breaches:
1. Isolate affected systems (if possible without data loss)
2. Revoke compromised credentials
3. Block suspicious IP addresses
4. Enable enhanced logging

For Availability Issues:
1. Initiate failover to backup systems
2. Scale up resources if capacity issue
3. Roll back recent changes if deployment-related

For Data Integrity:
1. Stop writes to affected data
2. Preserve current state for forensics
3. Identify last known good backup

### Phase 4: Eradication

**Root Cause Analysis:**
1. Review audit logs for affected period
2. Analyze system changes preceding incident
3. Identify vulnerability or misconfiguration
4. Document attack timeline (if applicable)

**Remediation Actions:**
- Patch identified vulnerabilities
- Rotate all affected credentials
- Update security configurations
- Implement additional monitoring

### Phase 5: Recovery

**Recovery Checklist:**
- [ ] Restore from verified backup if needed
- [ ] Validate system integrity
- [ ] Test restored functionality
- [ ] Verify security controls operational
- [ ] Re-enable affected services gradually
- [ ] Monitor for recurrence

**Communication:**
- Update internal stakeholders
- Notify affected customers (if required)
- Prepare regulatory notifications (if data breach)

### Phase 6: Post-Incident Review

**Within 48 Hours:**
1. Conduct post-incident meeting
2. Document timeline of events
3. Identify lessons learned
4. Create action items for improvements

**Post-Incident Report Template:**
- Executive Summary
- Incident Timeline
- Root Cause Analysis
- Impact Assessment
- Actions Taken
- Lessons Learned
- Recommendations
- Action Items with Owners

---

## 5. Communication Templates

### Internal Alert (P1/P2)

```
SECURITY INCIDENT ALERT
========================
Severity: [P1/P2]
Time Detected: [TIMESTAMP]
Affected Systems: [SYSTEMS]
Current Status: [INVESTIGATING/CONTAINED/RESOLVED]
Impact: [DESCRIPTION]

Incident Commander: [NAME]
Conference Bridge: [LINK]

Next Update: [TIME]
```

### Customer Notification (if required)

```
Subject: Security Notice - EPI-Q Platform

Dear Customer,

We are writing to inform you of a security incident affecting [SCOPE].

What Happened: [BRIEF DESCRIPTION]
When: [DATE/TIME RANGE]
What Data Was Affected: [DATA TYPES]
What We Are Doing: [ACTIONS]
What You Should Do: [CUSTOMER ACTIONS]

We take the security of your data seriously and apologize for any concern 
this may cause.

For questions, please contact: security@epi-q.com

Sincerely,
EPI-Q Security Team
```

---

## 6. Regulatory Notification Requirements

### HIPAA Breach Notification

| Breach Size | Notification Timeline | Notification To |
|-------------|----------------------|-----------------|
| < 500 individuals | Annual (within 60 days of year end) | HHS via annual log |
| ≥ 500 individuals | Within 60 days of discovery | HHS, affected individuals, media |

### GDPR Breach Notification

| Requirement | Timeline | Action |
|-------------|----------|--------|
| Supervisory Authority | 72 hours | Formal breach notification |
| Affected Individuals | Without undue delay | If high risk to rights |

---

## 7. Contact Information

### Internal Contacts

| Role | Name | Phone | Email |
|------|------|-------|-------|
| Incident Commander | TBD | TBD | incident@epi-q.com |
| Security Lead | TBD | TBD | security@epi-q.com |
| Engineering Lead | TBD | TBD | engineering@epi-q.com |
| Legal Counsel | TBD | TBD | legal@epi-q.com |

### External Contacts

| Service | Contact | Purpose |
|---------|---------|---------|
| Railway Support | support@railway.app | Infrastructure issues |
| Neon Support | support@neon.tech | Database issues |
| Azure Support | Azure Portal | KMS issues |

---

## 8. Audit Log Queries

### Suspicious Access Patterns
```sql
SELECT * FROM audit_logs 
WHERE action = 'login_failed' 
AND timestamp > NOW() - INTERVAL '1 hour'
GROUP BY ip_address 
HAVING COUNT(*) > 5;
```

### Recent Privileged Actions
```sql
SELECT * FROM audit_logs 
WHERE action IN ('user_delete', 'role_change', 'org_delete')
AND timestamp > NOW() - INTERVAL '24 hours';
```

### Data Access Anomalies
```sql
SELECT user_id, COUNT(*) as access_count 
FROM audit_logs 
WHERE action = 'data_export'
AND timestamp > NOW() - INTERVAL '1 hour'
GROUP BY user_id 
HAVING COUNT(*) > 10;
```

---

## 9. Revision History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2025-11-27 | Security Team | Initial version |

---

*This document should be reviewed and updated quarterly.*
