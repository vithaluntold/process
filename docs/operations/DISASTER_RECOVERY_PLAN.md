# EPI-Q Disaster Recovery Plan

**Document Version:** 1.0  
**Last Updated:** November 27, 2025  
**Document Owner:** Operations Team  
**Classification:** Internal Use Only

---

## 1. Executive Summary

This Disaster Recovery Plan (DRP) establishes procedures for recovering EPI-Q platform operations following a disaster or significant disruption. The plan ensures business continuity and data protection while meeting regulatory requirements (HIPAA, SOX, PCI-DSS).

### Recovery Objectives

| Metric | Target | Maximum Tolerable |
|--------|--------|-------------------|
| Recovery Time Objective (RTO) | 4 hours | 8 hours |
| Recovery Point Objective (RPO) | 1 hour | 4 hours |
| Maximum Tolerable Downtime (MTD) | 24 hours | 48 hours |

---

## 2. Scope

### Systems Covered

| System | Priority | RTO | RPO |
|--------|----------|-----|-----|
| Production Application | Critical | 2 hours | 1 hour |
| Production Database | Critical | 2 hours | 1 hour |
| Authentication Services | Critical | 2 hours | 1 hour |
| API Gateway | Critical | 2 hours | 1 hour |
| Staging Environment | High | 8 hours | 24 hours |
| Development Environment | Medium | 24 hours | 48 hours |
| Documentation | Low | 48 hours | 1 week |

### Disaster Categories

| Category | Description | Examples |
|----------|-------------|----------|
| Category 1 | Minor incident, limited impact | Single service failure, minor data corruption |
| Category 2 | Moderate incident, significant impact | Database failure, authentication outage |
| Category 3 | Major incident, severe impact | Complete infrastructure failure, data center outage |
| Category 4 | Catastrophic incident | Multi-region failure, ransomware, data breach |

---

## 3. Roles and Responsibilities

### Disaster Recovery Team

| Role | Primary | Backup | Responsibilities |
|------|---------|--------|------------------|
| DR Commander | CTO | VP Engineering | Overall DR coordination, decision authority |
| Technical Lead | Lead Engineer | Senior Engineer | Technical recovery execution |
| Database Admin | DBA | Backend Engineer | Database recovery operations |
| Security Lead | Security Officer | Senior Engineer | Security validation, access control |
| Communications | CEO | CMO | Stakeholder and customer communication |

### Contact Information

| Role | Name | Phone | Email | Escalation Time |
|------|------|-------|-------|-----------------|
| DR Commander | [TBD] | [TBD] | dr-commander@epi-q.com | Immediate |
| Technical Lead | [TBD] | [TBD] | tech-lead@epi-q.com | 15 minutes |
| Database Admin | [TBD] | [TBD] | dba@epi-q.com | 15 minutes |
| Security Lead | [TBD] | [TBD] | security@epi-q.com | 15 minutes |
| Communications | [TBD] | [TBD] | comms@epi-q.com | 30 minutes |

---

## 4. Backup Strategy

### Database Backups (Neon PostgreSQL)

| Backup Type | Frequency | Retention | Location |
|-------------|-----------|-----------|----------|
| Continuous WAL | Real-time | 7 days | Neon Cloud |
| Point-in-time Recovery | Available | 7 days | Neon Cloud |
| Daily Snapshot | Daily at 00:00 UTC | 30 days | Neon Cloud |
| Weekly Archive | Weekly | 1 year | Secondary Storage |
| Monthly Archive | Monthly | 7 years | Archive Storage |

### Application Backups

| Component | Frequency | Method | Location |
|-----------|-----------|--------|----------|
| Source Code | Real-time | Git | GitHub/GitLab |
| Configuration | Per change | Version control | Repository |
| Secrets | Per change | Encrypted backup | Secure vault |
| Static Assets | Daily | CDN sync | CDN provider |

### Backup Verification

| Verification | Frequency | Procedure | Owner |
|--------------|-----------|-----------|-------|
| Backup Integrity | Daily | Automated checksum | Operations |
| Restore Test (Staging) | Weekly | Full restore to staging | DBA |
| Restore Test (Production-like) | Monthly | Full restore to isolated env | DBA |
| Full DR Test | Annually | Complete DR simulation | DR Team |

---

## 5. Recovery Procedures

### 5.1 Category 1: Minor Incident

**Trigger:** Single service degradation, minor data issue

**Response Time:** 1-2 hours

**Procedure:**
1. Identify affected service
2. Review recent changes and logs
3. Rollback if change-related
4. Restore from backup if data-related
5. Verify service restoration
6. Document incident

### 5.2 Category 2: Moderate Incident

**Trigger:** Database failure, authentication outage, API unavailability

**Response Time:** 2-4 hours

**Procedure:**

#### Database Failure Recovery
```
1. Alert DR Team (15 min)
2. Assess failure scope
3. If Neon outage:
   a. Check Neon status page
   b. Contact Neon support
   c. Wait for provider recovery
4. If data corruption:
   a. Identify corruption scope
   b. Stop writes to affected tables
   c. Initiate point-in-time recovery
   d. Validate recovered data
   e. Resume operations
5. Post-recovery validation
6. Incident documentation
```

#### Authentication Failure Recovery
```
1. Alert DR Team (15 min)
2. Identify failure type:
   a. JWT signing key issue
   b. SSO/SAML configuration
   c. Database connection
3. Recovery actions:
   a. Rotate JWT secrets if compromised
   b. Restore SSO configuration
   c. Verify database connectivity
4. Clear affected sessions
5. Validate authentication flow
6. Monitor for 30 minutes
```

### 5.3 Category 3: Major Incident

**Trigger:** Complete infrastructure failure, data center outage

**Response Time:** 4-8 hours

**Procedure:**

```
Phase 1: Assessment (30 min)
- Activate DR Team
- Assess damage scope
- Declare disaster level
- Notify stakeholders

Phase 2: Infrastructure Recovery (2-4 hours)
- Deploy to backup region/provider if available
- Restore from latest backup
- Configure networking and DNS
- Deploy application containers

Phase 3: Data Recovery (1-2 hours)
- Restore database from backup
- Apply transaction logs to RPO
- Verify data integrity
- Run integrity checks

Phase 4: Validation (1 hour)
- Test all critical functions
- Verify authentication
- Check data accuracy
- Confirm integrations

Phase 5: Cutover (30 min)
- Update DNS
- Route traffic to recovered environment
- Monitor for issues
- Confirm customer access

Phase 6: Post-Recovery (ongoing)
- Detailed incident documentation
- Root cause analysis
- Process improvement
- Customer communication
```

### 5.4 Category 4: Catastrophic Incident

**Trigger:** Multi-region failure, ransomware, significant data breach

**Response Time:** 8-24 hours

**Procedure:**

```
IMMEDIATE (0-1 hour):
1. Isolate all systems
2. Activate incident response
3. Engage security team
4. Notify executive leadership
5. Contact legal counsel
6. Preserve forensic evidence

CONTAINMENT (1-4 hours):
1. Identify attack vector (if security incident)
2. Secure unaffected systems
3. Rotate all credentials
4. Review access logs
5. Engage external security firm if needed

RECOVERY (4-24 hours):
1. Build clean environment
2. Restore from verified clean backup
3. Apply security patches
4. Implement additional controls
5. Staged restoration of services

VALIDATION (ongoing):
1. Security audit of recovered systems
2. Penetration testing
3. Compliance verification
4. Customer notification (if required)
5. Regulatory notification (if required)
```

---

## 6. Communication Plan

### Internal Communication

| Severity | Initial Notification | Update Frequency |
|----------|---------------------|------------------|
| Category 1 | Team Slack | Hourly |
| Category 2 | Team + Management | 30 minutes |
| Category 3 | All Staff | 15 minutes |
| Category 4 | All Staff + Board | 15 minutes |

### External Communication

| Audience | Category 1 | Category 2 | Category 3-4 |
|----------|------------|------------|--------------|
| Customers | Status page | Email + Status | Email + Call for Enterprise |
| Partners | As needed | Email notification | Direct contact |
| Regulators | N/A | As required | Within required timeframes |
| Media | N/A | N/A | Press release if needed |

### Communication Templates

#### Customer Notification - Initial
```
Subject: EPI-Q Service Disruption Notice

We are currently experiencing a service disruption affecting [SERVICES].

Status: [INVESTIGATING/IDENTIFIED/RESOLVING]
Estimated Resolution: [TIME ESTIMATE]

We apologize for any inconvenience. Updates will be provided every [FREQUENCY].

For urgent matters, contact: support@epi-q.com
```

#### Customer Notification - Resolution
```
Subject: EPI-Q Service Restored

The service disruption affecting [SERVICES] has been resolved.

Duration: [START TIME] to [END TIME]
Impact: [DESCRIPTION]
Root Cause: [SUMMARY]

We apologize for any inconvenience caused.

If you experience any issues, please contact: support@epi-q.com
```

---

## 7. Testing Schedule

### Test Types

| Test Type | Frequency | Scope | Participants |
|-----------|-----------|-------|--------------|
| Backup Verification | Weekly | Verify backup integrity | DBA |
| Tabletop Exercise | Quarterly | Walk through scenarios | DR Team |
| Component Recovery | Quarterly | Restore individual services | Technical Team |
| Full DR Test | Annually | Complete failover and recovery | All Teams |

### Annual DR Test Plan

**Objectives:**
- Validate RTO and RPO targets
- Test team communication
- Verify documentation accuracy
- Identify improvement areas

**Test Scenario:**
1. Simulate complete database failure
2. Execute recovery procedures
3. Measure actual recovery times
4. Document deviations
5. Update procedures based on findings

**Success Criteria:**
- [ ] RTO achieved (< 4 hours)
- [ ] RPO achieved (< 1 hour data loss)
- [ ] All critical functions restored
- [ ] Data integrity verified
- [ ] Authentication working
- [ ] External integrations functional

---

## 8. Runbook Quick Reference

### Database Restore (Neon)

```bash
# Point-in-time recovery via Neon Console:
1. Navigate to Neon Console > Project > Branches
2. Click "Restore" on main branch
3. Select recovery point (timestamp or LSN)
4. Confirm restoration
5. Verify connection string unchanged

# Connection verification:
psql $DATABASE_URL -c "SELECT NOW();"
```

### Application Deployment

```bash
# Emergency deployment from known-good state:
1. Identify last known good commit
2. git checkout <commit-hash>
3. Deploy via Replit/Railway dashboard
4. Verify health endpoints
5. Monitor for 30 minutes
```

### DNS Failover

```
1. Access DNS provider console
2. Update A/CNAME records for:
   - api.epi-q.com
   - app.epi-q.com
3. Set TTL to minimum (60 seconds)
4. Verify propagation: dig +short api.epi-q.com
```

### Emergency Contacts

| Service | Contact | Purpose |
|---------|---------|---------|
| Neon Support | support@neon.tech | Database issues |
| Railway Support | support@railway.app | Infrastructure issues |
| Replit Support | support@replit.com | Deployment issues |
| Azure Support | Azure Portal | KMS issues |
| AWS Support | AWS Console | KMS issues |

---

## 9. Document Maintenance

### Review Schedule

| Review Type | Frequency | Reviewer |
|-------------|-----------|----------|
| Contact Information | Monthly | Operations |
| Procedures | Quarterly | DR Team |
| Full Document | Annually | DR Commander |
| Post-Incident | After each incident | DR Team |

### Change Log

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2025-11-27 | Operations Team | Initial version |

---

## 10. Appendices

### Appendix A: Critical Service Dependencies

```
EPI-Q Application
├── PostgreSQL Database (Neon)
│   └── Connection Pooler
├── Authentication
│   ├── JWT Signing Keys
│   └── SSO/SAML Providers
├── Encryption
│   └── KMS Provider (AWS/GCP/Azure)
├── External APIs
│   ├── Payment Gateways
│   ├── AI Providers (OpenAI)
│   └── Email Services
└── CDN/Static Assets
```

### Appendix B: Recovery Checklist

**Pre-Recovery:**
- [ ] DR Team activated
- [ ] Incident severity assessed
- [ ] Communication initiated
- [ ] Backup availability confirmed

**During Recovery:**
- [ ] Infrastructure provisioned
- [ ] Database restored
- [ ] Application deployed
- [ ] Configuration applied
- [ ] Secrets rotated (if security incident)

**Post-Recovery:**
- [ ] All services operational
- [ ] Data integrity verified
- [ ] Authentication working
- [ ] Integrations tested
- [ ] Monitoring active
- [ ] Customer communication sent
- [ ] Incident documented

---

*This document is classified as Internal Use Only. Distribution outside the organization requires approval from the DR Commander.*
